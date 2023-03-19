import { gsap } from "gsap";
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import data from "./data.json";

const state = {
  active: 0,
  data: data,
  getActive() {
    return this.data[this.active];
  },
  next() {
    this.active = this.active + 1;
    if (this.active > this.data.length - 1) {
      this.active = 0;
    }
  },
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
var raycaster, mouse;
raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();
const light = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(light);

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

camera.position.z = 5;

// animate(cube, "position", 1, [1, 2, 2]);
// animate(cube, "rotation", 0.8, [0, Math.PI, 0]);

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
loader.setDRACOLoader(dracoLoader);
let model = await loader.loadAsync("/chest.glb");
let m1 = model.scene.clone();
let currentActive = state.getActive();
m1.position.set(...currentActive.position);
m1.rotation.set(0, 0, 0);
m1.scale.set(...currentActive.scale);
let group;
m1.traverse((child) => {
  console.log(child);
});
scene.add(m1);
let anim = [];
ActivateAnimation();
document.getElementById("next").addEventListener("click", () => {
  state.next();
  ActivateAnimation();
});

function ActivateAnimation() {
  let currentActive = state.getActive();
  if (anim.length > 0) {
    anim.forEach((a) => {
      a.kill();
    });
  }
  anim = [];
  anim.push(animate(m1, "position", 1, currentActive.position));
  anim.push(animate(m1, "rotation", 1, currentActive.rotation));
  anim.push(animate(m1, "scale", 1, currentActive.scale));
  console.log(anim);
}

function animate(mesh, type, duration = 1, to) {
  switch (type) {
    case "position":
      return gsap.to(mesh.position, {
        duration: duration,
        x: to[0],
        y: to[1],
        z: to[2],
      });
      break;
    case "rotation":
      let { axis, speed, delay, isRotation } = to;
      if (!isRotation)
        return gsap.to(mesh.rotation, {
          duration: speed,
          x: axis[0],
          y: axis[1],
          z: axis[2],
        });
      let rotation = axis.map((a) => {
        return a * Math.PI * 2;
      });

      return gsap.fromTo(
        mesh.rotation,
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          duration: speed,
          x: rotation[0],
          y: rotation[1],
          z: rotation[2],
          repeat: -1,
          repeatDelay: delay,
          ease: "none",
        }
      );
      break;
    case "scale":
      return gsap.to(mesh.scale, {
        duration: duration,
        x: to[0],
        y: to[1],
        z: to[2],
      });
      break;

    default:
      break;
  }
}

// ============================================================
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// renderer.domElement.addEventListener("click", onClick, false);

// render loop
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
render();

// we pass to the function the child object of another object as a parameter.

function onClick(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    console.log("Intersection:", intersects[0]);
    unGrupsinBorrar(intersects[0].object);
  }
}
function unGrupsinBorrar(ModelSelect) {
  // we get the Id
  var elId = ModelSelect.id;

  // declare the object in a variable
  var objetUngrup = scene.getObjectById(elId);

  console.log(objetUngrup);

  // we get the position
  // var laPosicion = scene.getObjectById(elId).getWorldPosition();

  // // we get the rotation
  // var laRotacion = scene.getObjectById(elId).getWorldRotation();

  // we remove the object from the scene - it is not deleted because it is declared in the variable--
  // scene.remove(scene.getObjectById(elId));
  // remove from the scene the object with the ID that we have passed as a parameter
  scene.remove(ModelSelect);
  console.log(scene);

  // We add the object to the scene - it appears in the position (0,0,0) and rotation (0,0,0)
  // scene.add(objetUngrup);

  // // We recover the position
  // objetUngrup.position.copy(laPosicion);

  // // We recover the rotation
  // objetUngrup.rotation.copy(laRotacion);

  // The object is now inserted as a child of the scene, with the same ID it had
}
