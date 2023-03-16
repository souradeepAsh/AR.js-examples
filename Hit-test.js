// The code imports the necessary modules from the Three.js library and creates a scene, 
// camera, and renderer. It also adds a hemisphere light to the scene for illumination.

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

      // The code then creates an AR button that is appended to the HTML document, allowing the user to enter AR mode. 
      // It also adds a cube to the scene for testing purposes.
      // For ui Stop AR
      document.body.appendChild(
        ARButton.createButton(renderer, {
          requiredFeatures: ["hit-test"],
          optionalFeatures: ["dom-overlay", "dom-overlay-for-handheld-ar"],
          domOverlay: { root: document.body },
        })
      );

      // Only for cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      camera.position.z = 5;

      // Next, the code loads the 3D model of the horse using a 
      // GLTFLoader and adds it to the scene when 
      // the user selects a point on a horizontal surface using the controller.
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
        objectPlaced = true;

        mixer = new THREE.AnimationMixer(horse);
        horse_main = mixer.clipAction(gltf.animations[0]).play();
      }

      controller = renderer.xr.getController(0);
      controller.addEventListener("select", onSelect);
      scene.add(controller);

      // The code then sets up a reticle to display where the user is pointing the controller, 
      // as well as hit testing to detect horizontal surfaces on which to place the horse.
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

/* 
  This is a JavaScript function called render that takes two parameters: timestamp and frame. 
  It appears to be part of a larger codebase related to rendering graphics in a browser or web-based application, 
  possibly using a library like Three.js or A-Frame.
  The first line of the function calculates the time delta between the current frame and the previous frame using a clock object, 
  which is likely part of the rendering library. This delta value can be used to update animations or other time-dependent effects in the scene.
  The function then checks if the frame parameter is truthy 
  (i.e. not null, undefined, false, 0, etc.). If so, 
  it proceeds to perform some operations related to AR (augmented reality) or 
  VR (virtual reality) rendering using WebXR, a web-based API for creating immersive experiences.
  First, it gets the reference space for the XR session using the getReferenceSpace() method on the renderer.xr object. 
  This reference space represents the coordinate system used for rendering XR content.
  Next, it gets the XR session itself using the getSession() method on the renderer.xr object.
  If hitTestSourceRequested is false (presumably a global variable), 
  it requests a hit test source using the XR session's requestHitTestSource() method, 
  passing in the reference space. This hit test source can be used to detect 
  when the user touches or interacts with real-world objects using an XR input device (like a VR controller or AR phone).
  When the hit test source is created, it assigns it to the hitTestSource variable. 
  The function also sets up an event listener for when the XR session ends, which will reset the hitTestSourceRequested and hitTestSource variables.
  Finally, if hitTestSource is truthy, the function gets the hit test results for the current 
  frame using the getHitTestResults() method on the frame object, passing in the hit test source. 
  If there are any hit test results, it selects the first one and sets the position of a reticle object (presumably a graphical marker used to indicate 
  where the user is pointing in AR/VR space) based on the hit test result's position and orientation.
  After the XR-related code, the function updates any animations in the scene using a mixer object 
  (presumably part of a Three.js animation system), passing in the delta value calculated at the beginning of the function. 
*/

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

//Animation Play button
function Play() {
  action_anim.forEach(function (action) {
    action.paused = false;
  });
  horse_main.paused = false;
}

//Animation Paused button
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