import * as THREE from "https://cdn.skypack.dev/-/three@v0.150.0-OzKE9j8uVtfQ1iuz7xon/dist=es2019,mode=raw/build/three.module.js";
import { ARButton } from "https://cdn.skypack.dev/-/three@v0.150.0-OzKE9j8uVtfQ1iuz7xon/dist=es2019,mode=raw/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer, playBtn, pauseBtn, clock;
var material, shape, extrudeSettings, geometry, mesh, ambientLight, pointLight1;

scene = new THREE.Scene();

ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

pointLight1 = new THREE.PointLight(0xf9eac8, 1, 100);
pointLight1.position.set(5, 10, 0);
pointLight1.castShadow = true;
pointLight1.shadow.camera.top = 20;
scene.add(pointLight1);

camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000);

clock = new THREE.Clock();

renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"], // , "dom-overlay-for-handheld-ar"
    domOverlay: { root: document.body },
  })
);

camera.position.z = 10;

material =new THREE.MeshPhongMaterial({
  color: 0x16c12a,
  shininess: 70
});

shape = new THREE.Shape();
shape.moveTo(0, 0);
shape.lineTo(2, 3);
shape.lineTo(4, 0);
shape.lineTo(0, 0);

extrudeSettings = {
  steps: 5,
  depth: 1,
  bevelEnabled: true,
  bevelThickness: 0.8,
  bevelSize: 0.5,
  bevelOffset: 0,
  bevelSegments: 1 };

geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
geometry.center();

mesh = new THREE.Mesh(geometry, material);
mesh.position.x = 0;
mesh.position.y = 0;
mesh.position.z = -8;
mesh.scale.set(1.5, 1.5, 1.5);
scene.add(mesh);

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
render();

function Play() {
  const x = Number(document.getElementById('x-input').value);
  const y = Number(document.getElementById('y-input').value);
  const z = Number(document.getElementById('z-input').value);

	gsap.to(mesh.position, { x, y, z, duration: 4 });
}

playBtn = document.getElementById("play");
playBtn.addEventListener("click", Play);

function Pause() {
	gsap.to(mesh.position, { x: 0, y:0, z:-8, duration: 4 });
}

pauseBtn = document.getElementById("pause");
pauseBtn.addEventListener("click", Pause);

// gsap.to(mesh.position, { x: 30, y:0, z:0, duration: 4 });