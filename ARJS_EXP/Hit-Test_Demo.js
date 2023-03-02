import * as THREE from "https://cdn.rawgit.com/mrdoob/three.js/r117/build/three.module.js";
      //   import { ARButton } from "https://cdn.rawgit.com/mrdoob/three.js/r117/examples/jsm/webxr/ARButton.js";
      import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
      import { ARButton } from "https://cdn.rawgit.com/mrdoob/three.js/r117/examples/jsm/webxr/ARButton.js";
      import * as SkeletonUtils from './SkeletonUtils.js';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      );
      let controller, reticle;
      let hitTestSource = null;
      let hitTestSourceRequested = false;
      let mixer;
      let prevTime = Date.now();

      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      light.position.set(0.5, 1, 0.25);
      scene.add(light);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      document.body.appendChild(renderer.domElement);
      document.body.appendChild(
        ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
      );
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      camera.position.z = 5;

      let loader = new GLTFLoader();
      let model = (async function () {
        try {
          model = await loader.loadAsync("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Horse.glb");
          console.log("first time", model);

            // let model1 = model.scene.clone();
            // model1.position.set(-2, -1, -2);
            // model1.scale.set(0.01, 0.01, 0.01);
            // scene.add(model1);   
            
            // let model2 = model.scene.clone();
            // model2.position.set(2, -1, -2);
            // model2.scale.set(0.01, 0.01, 0.01);
            // scene.add(model2);

          return model;
        } catch (error) {
          console.log(error);
        }
      })();

      function onSelect() {
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.setFromMatrixPosition(reticle.matrix);

        let horse = model.scene.clone();
        horse.position.setFromMatrixPosition(reticle.matrix);
        scene.add(horse);

        mixer = new THREE.AnimationMixer( horse );
				mixer.clipAction( model.animations[ 0 ] ).setDuration( 1 ).play();
      }

      controller = renderer.xr.getController(0);
      controller.addEventListener("select", onSelect);
      scene.add(controller);

      reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial()
      );
      reticle.matrixAutoUpdate = false;
      // reticle.visible = false;
      scene.add(reticle);

      function animate() {
        // requestAnimationFrame(render);
        renderer.setAnimationLoop(render);
        requestAnimationFrame( animate );
				render();
      }

      function render(timestamp, frame) {
        if (frame) {
          const referenceSpace = renderer.xr.getReferenceSpace();
          const session = renderer.xr.getSession();

          if (hitTestSourceRequested === false) {
            session
              .requestReferenceSpace("viewer")
              .then(function (referenceSpace) {
                return session.requestHitTestSource({ space: referenceSpace });
              })
              .then(function (source) {
                hitTestSource = source;
              });

            session.addEventListener("end", function () {
              hitTestSourceRequested = false;
              hitTestSource = null;
            });

            hitTestSourceRequested = true;
          }

          if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length) {
              const hit = hitTestResults[0];
              reticle.visible = true;
              reticle.matrix.fromArray(
                hit.getPose(referenceSpace).transform.matrix
              );
            } else {
              reticle.visible = false;
            }
          }
        }
        if ( mixer ) {
					const time = Date.now();
					mixer.update( ( time - prevTime ) * 0.001 );
					prevTime = time;
				}
        renderer.render(scene, camera);
      }

      animate();