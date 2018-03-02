/**
  * graphics file
  * @author Rahul Kiefer
  */


//created scene and camera
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// created renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//creating cube
var geometry = new THREE.BoxGeometry(5,5,5);
var material = new THREE.MeshBasicMaterial( {color: 0x00ff00 } );
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;
