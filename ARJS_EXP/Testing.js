import * as THREE from "https://cdn.skypack.dev/-/three@v0.150.0-OzKE9j8uVtfQ1iuz7xon/dist=es2019,mode=raw/build/three.module.js";
import { ARButton } from "https://cdn.skypack.dev/-/three@v0.150.0-OzKE9j8uVtfQ1iuz7xon/dist=es2019,mode=raw/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer, playBtn;
var material, shape, extrudeSettings, geometry, mesh, ambientLight, pointLight1;

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000);

renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

material = new THREE.MeshPhongMaterial({
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
  bevelSegments: 1 
};

geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
geometry.center();

mesh = new THREE.Mesh(geometry, material);
mesh.position.x = 0;
mesh.position.y = 0;
mesh.position.z = -8;
mesh.scale.set(1.5, 1.5, 1.5);
scene.add(mesh);

camera.position.z = 10;

ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

pointLight1 = new THREE.PointLight(0xf9eac8, 1, 100);
pointLight1.position.set(5, 10, 0);
pointLight1.castShadow = true;
pointLight1.shadow.camera.top = 20;
scene.add(pointLight1);

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
render();

function Play() {
	gsap.to(mesh.position, { x: 30, y:0, z:0, duration: 4 });
}

playBtn = document.getElementById("play");
playBtn.addEventListener("click", Play);

// gsap.to(mesh.position, { x: 30, y:0, z:0, duration: 4 });