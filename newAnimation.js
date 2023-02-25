import * as THREE from "https://cdn.rawgit.com/mrdoob/three.js/r117/build/three.module.js";
import { ARButton } from "https://cdn.rawgit.com/mrdoob/three.js/r117/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "./SkeletonUtils.js";

let camera, scene, renderer;
let clock;

let controller, reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;

const mixers = [];
let mixer1;

// init();

// function init() {
camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
scene = new THREE.Scene();

clock = new THREE.Clock();

const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
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

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

camera.position.z = 5;

const loader = new GLTFLoader();
// loader.load( 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Horse.glb', function ( gltf ) {

let gltf = (async function () {
  try {
    gltf = await loader.loadAsync(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Horse.glb"
    );
    console.log("first time", gltf);

    const model1 = SkeletonUtils.clone(gltf.scene);
    const model2 = SkeletonUtils.clone(gltf.scene);
    const model3 = SkeletonUtils.clone(gltf.scene);

    const mixer1 = new THREE.AnimationMixer(model1);
    const mixer2 = new THREE.AnimationMixer(model2);
    const mixer3 = new THREE.AnimationMixer(model3);

    mixer1.clipAction(gltf.animations[0]).play();
    mixer2.clipAction(gltf.animations[0]).play();
    mixer3.clipAction(gltf.animations[0]).play();

    model1.position.set(-2, -1, -4);
    model1.scale.set(0.01, 0.01, 0.01);
    model2.position.set(0, -1, -4);
    model2.scale.set(0.01, 0.01, 0.01);
    model3.position.set(2, -1, -4);
    model3.scale.set(0.01, 0.01, 0.01);

    scene.add(model1, model2, model3);
    mixers.push(mixer1, mixer2, mixer3);
    // return gltf;
  } catch (error) {
    console.log(error);
  }
})();

window.addEventListener("resize", onWindowResize);

function onSelect() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.setFromMatrixPosition(reticle.matrix);

  //   let horse = gltf.scene.clone();
  //   horse.position.setFromMatrixPosition(reticle.matrix);
  //   console.log("model-dede", gltf.scene);

  let horse = SkeletonUtils.clone(gltf.scene);
  //   anim = new THREE.AnimationMixer( horse );
  //   anim.clipAction( gltf.animations[ 0 ] ).play();
  horse.position.set(0, -1, -2);
  scene.add(horse);

  mixer1 = new THREE.AnimationMixer(horse);
  mixer1.clipAction(gltf.animations[0]).play();
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
  //   requestAnimationFrame(animate);

  //   render();
}
animate();

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
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  for (const mixer of mixers) mixer.update(delta);

  if (mixer1) {
    mixer1.update(delta);
  }
  renderer.render(scene, camera);
}

// }

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}