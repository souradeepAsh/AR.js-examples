import * as THREE from "https://cdn.rawgit.com/mrdoob/three.js/r117/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
import { ARButton } from "https://cdn.rawgit.com/mrdoob/three.js/r117/examples/jsm/webxr/ARButton.js";
import Stats from './stats.module.js';
import * as SkeletonUtils from "./SkeletonUtils.js";

let camera, scene, renderer, light;
let controller, reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
let objectPlaced = false;
let action_anim = [];
let horse, horse_main;
let mixer;
let clock;
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
);
scene = new THREE.Scene();
scene.add(camera);

clock = new THREE.Clock();

light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      light.position.set(0.5, 1, 0.25);
      scene.add(light);

renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;

      document.body.appendChild(renderer.domElement);
      document.body.appendChild(
        ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
      );

      // For ui Stop AR
      // document.body.appendChild(
      //   ARButton.createButton(renderer, {
      //     optionalFeatures: ["dom-overlay", "dom-overlay-for-handheld-ar"],
      //     domOverlay: { root: document.body },
      //   })
      // );

      // Only for cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      camera.position.z = 5;

      let loader = new GLTFLoader();
      let gltf = (async function () {
        try {
          gltf = await loader.loadAsync("./Horse.glb");
          console.log("first time", gltf);
        } catch (error) {
          console.log(error);
        }
      })();

      function onSelect() {
        if (objectPlaced) return;
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.setFromMatrixPosition(reticle.matrix);

        horse = SkeletonUtils.clone(gltf.scene);
        horse.position.setFromMatrixPosition(reticle.matrix);
        horse.scale.set(0.01, 0.01, 0.01);
        scene.add(horse);
        objectPlaced = false;

        mixer = new THREE.AnimationMixer(horse);
        horse_main = mixer.clipAction(gltf.animations[0]).play();
      }

      controller = renderer.xr.getController(0);
      controller.addEventListener("select", onSelect);
      scene.add(controller);

      reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial()
      );
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);

      function animate() {
        renderer.setAnimationLoop(render);
      }

      function render(timestamp, frame) {
        const delta = clock.getDelta();
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
        if (mixer) {
          mixer.update(delta);
        }
        renderer.render(scene, camera);
      }

//Animation Play
function Play() {
  action_anim.forEach(function (action) {
    action.paused = false;
  });
  horse_main.paused = false;
}

//Animation Paused
function Pause() {
  action_anim.forEach(function (action) {
    action.paused = true;
  });
  horse_main.paused = true;
}

const playBtn = document.getElementById("play");
playBtn.addEventListener("click", Play);

const pauseBtn = document.getElementById("pause");
pauseBtn.addEventListener("click", Pause);

      animate();