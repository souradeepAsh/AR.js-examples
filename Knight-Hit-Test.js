/*
This is a JavaScript code that sets up an augmented reality (AR) experience using the WebXR API and three.js library.
The App class initializes the scene, renderer, camera, lighting, and environment. 
It also loads a knight model using the GLTFLoader and sets up a Player class instance to control its animation and movement. The LoadingBar class is used to show a progress bar while loading the model.
The setEnvironment() method sets the environment map of the scene using an HDR texture. 
The resize() method adjusts the aspect ratio of the camera and the size of the renderer when the window is resized.
The setupXR() method enables XR on the renderer and adds an AR button to the page. It also sets up a hit-test source to detect surfaces in the real-world environment and 
allows the knight to be placed on them. The onSelect() function is called when the user interacts with the scene, 
and it updates the position of the knight based on the position of the reticle (a visual indicator of the hit-test point).
*/

import * as THREE from 'https://cdn.rawgit.com/mrdoob/three.js/r117/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from './libs/three125/RGBELoader.js';
import { ARButton } from './libs/ARButton.js';
import { LoadingBar } from './libs/LoadingBar.js';
import { Player } from './libs/Player.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        //For run the animation
        this.clock = new THREE.Clock();

        // For loading the model we need these
        this.loadingBar = new LoadingBar();

        // Asset path
		this.assetsPath = './assets';
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 3 );
        
		this.scene = new THREE.Scene();

        // ambient light
		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight();
        light.position.set( 0.2, 1, 1);
        this.scene.add(light);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        this.setEnvironment();
        
        this.workingVec3 = new THREE.Vector3();
        
        this.initScene();
        this.setupXR();
		
		window.addEventListener('resize', this.resize.bind(this));
        
	}
    
    setEnvironment(){
        const loader = new RGBELoader().setDataType( THREE.UnsignedByteType );

        // https://threejs.org/docs/#api/en/extras/PMREMGenerator
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const self = this;
        
        loader.load( './assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
        const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
        pmremGenerator.dispose();

        self.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment');
        } );
    }
	
    resize(){ 
        this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
    
    loadKnight(){
	    const loader = new GLTFLoader().setPath(this.assetsPath);
		const self = this;
		
		// Load a GLTF resource
		loader.load(
			// resource URL
			`/knight2.glb`,
			// called when the resource is loaded
			function ( gltf ) {
				const object = gltf.scene.children[5];
				
				const options = {
					object: object,
					speed: 0.5,
					assetsPath: self.assetsPath,
					loader: loader,
                    animations: gltf.animations,
					clip: gltf.animations[0],
					app: self,
					name: 'knight',
					npc: false
				};
				
				self.knight = new Player(options);
                self.knight.object.visible = false;
				
				self.knight.action = 'Dance';
				const scale = 0.005;
				self.knight.object.scale.set(scale, scale, scale); 
				
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop( self.render.bind(self) );//(timestamp, frame) => { self.render(timestamp, frame); } );
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);

			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			}
		);
	}		
    
    initScene(){
        // After load the knight we have to make him follow with the reticle.
        this.loadKnight();

        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
    }
    
    setupXR(){
        this.renderer.xr.enabled = true;
        
        //ARButton in 3D scene
        const btn = new ARButton( this.renderer, { sessionInit: {
            // Required for Ar Hit test in mobile decides 
            requiredFeatures: [ 'hit-test' ],
            //Overlay on the " START AR" or you can change the color of it in css, it make's vite project crash sometimes.
            optionalFeatures: [ 'dom-overlay' ], 
            domOverlay: { root: document.body } 
        } } );
        
        const self = this;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
        

        // for place the model in 3D scene
        function onSelect() {
            if (self.knight===undefined) return;
            
            if (self.reticle.visible){
                if (self.knight.object.visible){
                    self.workingVec3.setFromMatrixPosition( self.reticle.matrix );
                    self.knight.newPath(self.workingVec3);
                }else{
                    self.knight.object.position.setFromMatrixPosition( self.reticle.matrix );
                    self.knight.object.visible = true;
                }
            }
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        
        this.scene.add( this.controller );    
    }
/* 
    This is a JavaScript function that requests a hit test source from a WebXR session for the purpose of performing augmented reality (AR) interactions. 
    The hit test source provides information about the real-world environment that can be used to place virtual objects in a way that appears to be anchored in the physical world.
    The function starts by creating a reference to the this object and the XR session object using this.renderer.xr.getSession(). It then requests a reference space using session.requestReferenceSpace('viewer'). The reference space represents the user's physical location and orientation in the real world, 
    and the 'viewer' option specifies that the user's position and orientation should be used as the reference.
    Once the reference space is established, the function requests a hit test source using session.requestHitTestSource({ space: referenceSpace }). The hit test source provides information about the location and orientation of real-world surfaces that can be used to place virtual objects.
    The space parameter specifies the reference space to use for the hit test source.
    When the hit test source is obtained, it is stored in the self.hitTestSource variable using a callback function.
    The function also sets an event listener for the end event of the XR session. This event is triggered when the session is ended, such as when the user closes the AR application or the session is interrupted.
    When the event occurs, the function sets self.hitTestSourceRequested to false, clears the self.hitTestSource and self.referenceSpace variables.
    Finally, the function sets this.hitTestSourceRequested to true, which indicates that a hit test source request has been made but not yet fulfilled.
*/

    requestHitTestSource(){
        const self = this;
        const session = this.renderer.xr.getSession();
        session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
            session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
                self.hitTestSource = source;
            } );
        } );
        session.addEventListener( 'end', function () {
            self.hitTestSourceRequested = false;
            self.hitTestSource = null;
            self.referenceSpace = null;
        } );
        this.hitTestSourceRequested = true;
    }
    
    getHitTestResults( frame ){
        const hitTestResults = frame.getHitTestResults( this.hitTestSource );
        
        if ( hitTestResults.length ) {
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hit = hitTestResults[ 0 ];
            const pose = hit.getPose( referenceSpace );
            this.reticle.visible = true;
            this.reticle.matrix.fromArray( pose.transform.matrix );
        } else {
            this.reticle.visible = false;
        }
    }

    render( timestamp, frame ) {
        const dt = this.clock.getDelta();
        if (this.knight) this.knight.update(dt);
        const self = this;
        if ( frame ) {
            if ( this.hitTestSourceRequested === false ) 
            this.requestHitTestSource( )

            if ( this.hitTestSource ) 
            this.getHitTestResults( frame );
        }
        this.renderer.render( this.scene, this.camera );
        /*if (this.knight.calculatedPath && this.knight.calculatedPath.length>0){
            console.log( `path:${this.knight.calculatedPath[0].x.toFixed(2)}, ${this.knight.calculatedPath[0].y.toFixed(2)}, ${this.knight.calculatedPath[0].z.toFixed(2)} position: ${this.knight.object.position.x.toFixed(2)}, ${this.knight.object.position.y.toFixed(2)}, ${this.knight.object.position.z.toFixed(2)}`);
        }*/
    }
}

export { App };
