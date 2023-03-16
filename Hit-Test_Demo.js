/* 
This is a JavaScript code that creates a WebXR augmented reality (AR) experience using the three.js library.
The code initializes a scene, camera, and renderer, and adds a hemispherical light to the scene. 
It also sets up an event listener for window resize and defines functions to handle user input through a controller, including placing a 3D object in the scene, 
pausing and playing animations, and detecting when the user taps on the ground.
The code also loads a 3D model of a horse using the GLTFLoader and sets up an animation mixer to play animations on the horse. 
When the user taps on the ground, a new instance of the horse model is created and placed at the tapped location.
The ARButton from the three.js library is used to enable AR mode, and the code sets up a reticle to indicate the position of the user's tap.
Overall, this code creates an AR experience where the user can tap on the ground to place a horse model and interact with it by playing or pausing animations.
*/

import * as THREE from "https://cdn.rawgit.com/mrdoob/three.js/r117/build/three.module.js";
import { ARButton } from "https://cdn.rawgit.com/mrdoob/three.js/r117/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "./SkeletonUtils.js";
import Stats from "./stats.module.js";

let camera, scene, renderer, light;
let clock;

let controller, reticle, container;
let hitTestSource = null;
let hitTestSourceRequested = false;
let groundDetected = false;
let horse = [],
  horse_main,
  horse1,
  horse2,
  horse3;
let action_anim = [];

// change done
let objectPlaced = false;
let objectInstance = null;

const mixers = [];
let mixer1;

container = document.createElement( 'div' );
document.body.appendChild( container );

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
// scene.add(camera);

clock = new THREE.Clock();

light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
light.position.set(0.5, 1, 0.25);
scene.add(light);

renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
container.appendChild( renderer.domElement );

document.body.appendChild(renderer.domElement);


document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"], // , "dom-overlay-for-handheld-ar"
    domOverlay: { root: document.body },
  })
);

camera.position.z = 5;

const loader = new GLTFLoader();
let gltf = (async function () {
  try {
    gltf = await loader.loadAsync("./Horse.glb");
    console.log("first time", gltf);

    // Check the multiple model load or not and also checking animation is working or not in the 3D web.
    // const model1 = SkeletonUtils.clone(gltf.scene);
    // const model2 = SkeletonUtils.clone(gltf.scene);
    // const model3 = SkeletonUtils.clone(gltf.scene);

    // const mixer1 = new THREE.AnimationMixer(model1);
    // const mixer2 = new THREE.AnimationMixer(model2);
    // const mixer3 = new THREE.AnimationMixer(model3);

    // horse1 = mixer1.clipAction(gltf.animations[0]).play();
    // horse2 = mixer2.clipAction(gltf.animations[0]).play();
    // horse3 = mixer3.clipAction(gltf.animations[0]).play();

    // action_anim = [horse1, horse2, horse3];

    // model1.position.set(-2, -1, -4);
    // model1.scale.set(0.01, 0.01, 0.01);
    // model2.position.set(0, -1, -4);
    // model2.scale.set(0.01, 0.01, 0.01);
    // model3.position.set(2, -1, -4);
    // model3.scale.set(0.01, 0.01, 0.01);

    // scene.add(model1, model2, model3);
    // mixers.push(mixer1, mixer2, mixer3);

  } catch (error) {
    console.log(error);
  }
})();

window.addEventListener("resize", onWindowResize);

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
  objectPlaced = true;

  mixer1 = new THREE.AnimationMixer(horse);
  horse_main = mixer1.clipAction(gltf.animations[0]).play();
  // reticle.visible = false;
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
animate();

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


function render(timestamp, frame) {
  const delta = clock.getDelta();
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();
    if (hitTestSourceRequested === false && !objectPlaced) {
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
    // If Object place once then it will disable the reticle and you can't place another object on the  plane as reticle is disable in 3D scene.
    if (hitTestSource && !objectPlaced) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length) {
        const hit = hitTestResults[0];
        const position = new THREE.Vector3();
        position.fromArray(hit.getPose(referenceSpace).transform.position);
        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  // for (const mixer of mixers) mixer.update(delta);
  if (mixer1) { mixer1.update(delta);}
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
