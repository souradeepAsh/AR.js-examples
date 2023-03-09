import * as THREE from "https://cdn.skypack.dev/-/three@v0.150.0-OzKE9j8uVtfQ1iuz7xon/dist=es2019,mode=raw/build/three.module.js";
import { ARButton } from "https://cdn.skypack.dev/-/three@v0.150.0-OzKE9j8uVtfQ1iuz7xon/dist=es2019,mode=raw/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer, playBtn, pauseBtn, clock, light, container;
var material, shape, extrudeSettings, geometry, mesh, ambientLight, pointLight1;
let objectPlaced = false;
let controller, reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;

container = document.createElement( 'div' );
document.body.appendChild( container );

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
  
clock = new THREE.Clock();


ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

pointLight1 = new THREE.PointLight(0xf9eac8, 1, 100);
pointLight1.position.set(5, 10, 0);
pointLight1.castShadow = true;
pointLight1.shadow.camera.top = 20;
scene.add(pointLight1);

// light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
// light.position.set(0, 0, -8);
// scene.add(light);

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

// material =new THREE.MeshPhongMaterial({
//   color: 0x16c12a,
//   shininess: 70
// });

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
// geometry.center();

// mesh = new THREE.Mesh(geometry, material);
// mesh.position.x = 0;
// mesh.position.y = 0;
// mesh.position.z = -8;
// mesh.scale.set(1.5, 1.5, 1.5);
// scene.add(mesh);

function onSelect(){
  if ( objectPlaced ) return;
    material =new THREE.MeshPhongMaterial({
      color: 0x16c12a,
      shininess: 70
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.scale.set(0.4, 0.4, 0.4);
    scene.add(mesh);
    reticle.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
    mesh.scale.y = Math.random() * 2 + 1;
    scene.add( mesh );
    objectPlaced = true;
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

// function render() {
//   requestAnimationFrame(render);
//   renderer.render(scene, camera);
// }

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
// gsap.to(mesh.position, { x: 30, y:0, z:0, duration: 4 });