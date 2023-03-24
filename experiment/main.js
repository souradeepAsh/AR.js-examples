import { gsap } from "gsap";
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import data from "./data.json";
import newData from "./newData.json";
import { animate } from "./utils";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";


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

let scene, camera, light, container, renderer, controls, objectPlaced = false, clock, controller, reticle, hitTestSource = null, hitTestSourceRequested = false;
var raycaster, mouse;
let assests = {};

scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

clock = new THREE.Clock();

raycaster = new THREE.Raycaster();

mouse = new THREE.Vector2();

light = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(light);

camera.position.z = 25;

const loader = new GLTFLoader();
const draco = new DRACOLoader();
// draco.setDecoderConfig({ type: "js" });
// draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
draco.setDecoderPath("./draco/");
loader.setDRACOLoader(draco);

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

// ============================================================
renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.xr.enabled = true;

// orbit controls
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// renderer.domElement.addEventListener("click", onClick, false);

document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],    // important for mobile ar hit test
    optionalFeatures: ["dom-overlay"], // , "dom-overlay-for-handheld-ar"
    domOverlay: { root: document.body },
  })
);

//On select function for the Object Place
function onSelect(){
  if (objectPlaced) return;

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

//animate function for animation play
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
  renderer.setAnimationLoop(render);
}
ActivateAnimation();

// render loop
function render( timestamp, frame ) {
  const delta = clock.getDelta();
  if ( frame ) {
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
  renderer.render( scene, camera );
}
