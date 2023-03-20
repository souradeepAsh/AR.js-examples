import { gsap } from "gsap";
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import data from "./data.json";
import newData from "./newData.json";
import { animate } from "./utils";

const state = {
  active: 0,
  data: newData,
  getActive() {
    return this.data.stages[this.active];
  },
  next() {
    this.active = this.active + 1;
    if (this.active > this.data.stages.length - 1) {
      this.active = 0;
    }
  },
  prev() {
    this.active = this.active - 1;
    if (this.active < 0) {
      this.active = this.data.stages.length - 1;
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

camera.position.z = 25;

const loader = new GLTFLoader();
const draco = new DRACOLoader();
// draco.setDecoderConfig({ type: "js" });
// draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
draco.setDecoderPath("./draco/");
loader.setDRACOLoader(draco);

let assests = {};

const loadAllModels = async () => {
  let models = await Promise.all(
    newData.models.map((m) => {
      return loader.loadAsync(m.url);
    })
  );

  for (let i = 0; i < models.length; i++) {
    const m = models[i];
    let mesh = m.scene.clone();
    assests[newData.models[i].name] = mesh;
  }
};

let anim = [];
(async () => {
  await loadAllModels();
  ActivateAnimation();
})();

// ===========================================================
document.getElementById("next").addEventListener("click", () => {
  state.next();
  ActivateAnimation();
});
document.getElementById("prev").addEventListener("click", () => {
  state.prev();
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

  let removedChildren = [];
  scene.children.forEach((c) => {
    if (c.type == "Mesh" || c.type == "Group") {
      removedChildren.push(c);
    }
  });

  removedChildren.forEach((c) => {
    scene.remove(c);
  });

  currentActive.models.forEach((m) => {
    let mesh = assests[m.name];
    anim.push(animate(mesh, "position", 1, m.position));
    anim.push(animate(mesh, "rotation", 1, m.spin));
    anim.push(animate(mesh, "scale", 1, m.scale));
    scene.add(mesh);
  });
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
