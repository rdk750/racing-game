/**
  * graphics file
  * <p>
  * Critical functions: init(), animate(), render()
  * @author Rahul Kiefer
  */

/**
  * Use #game as base element
  * @author Jonathan Lam
  */
var element = document.querySelector('#game');
var width = element.getBoundingClientRect().width;
var height = element.getBoundingClientRect().height;

/**
	* Create scene and camera
	* @author Rahul Kiefer
	*/
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

/**
	* Create renderer
	* @author Rahul Kiefer
	*/
var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
element.appendChild(renderer.domElement);

/**
	* Create the car
	* @author Rahul Kiefer
	*/

var carShape = new THREE.Shape();
carShape.moveTo(0,0);
carShape.lineTo(0,2); //from front bottom to front of hood
carShape.lineTo(2,2); //from front of hood to windshield
carShape.lineTo(2.5,3.25); //from bottom of windshield to top of windshield
carShape.lineTo(4.5,3.25); //from top of windshield to top of back window
carShape.lineTo(5,2); //from top of back window to bottom of back window
carShape.lineTo(6,2); //from bottom of back window to top of trunk
carShape.lineTo(6,0); //from top of trunk to bottom of trunk

var carExtrudeSettings = {
	steps: 1,
	amount: 3,
	bevelEnabled: false,
	bevelThickness: 1,
	bevelSize: 1,
	bevelSegments: 1
}

var carGeometry = new THREE.ExtrudeGeometry(carShape, carExtrudeSettings);
var carMaterial = new THREE.MeshLambertMaterial({color:0xCC0000});
var carMesh = new THREE.Mesh(carGeometry, carMaterial);
scene.add(carMesh);

/**
  * Creating multiple views
  * @author Jonathan Lam
  */
var views = [
  {
    left: 0,
    top: 0,
    width: 0.5,
    height: 1.0,
    background: new THREE.Color(0.5, 0.5, 0.7),
    position: [3.25, 5, 20], //pos of camera relative to car
    rotation: [-.1, 0, 0],
    fov: 30
  },
  {
    left: 0,
    top: 0,
    width: 0.5,
    height: 1.0,
    background: new THREE.Color(0.5, 0.5, 0.7),
    position: [2.5, 7.5, 14.5], //pos of camera relative to car
    rotation: [-.5, 0, 0],
    fov: 30
  },
  {
    left: 0,
    top: 0,
    width: 0.5,
    height: 1.0,
    background: new THREE.Color(0.5, 0.5, 0.7),
    position: [2.5, 7.5, 14.5], //pos of camera relative to car
    rotation: [-.5, 0, 0],
    fov: 30
  },
  {
    left: 0,
    top: 0,
    width: 0.5,
    height: 1.0,
    background: new THREE.Color(0.5, 0.5, 0.7),
    position: [2.5, 7.5, 14.5], //pos of camera relative to car
    rotation: [-.5, 0, 0],
    fov: 30
  }
];

// init and animate
init();
animate();

function init() {
  for(var view of views) {
    // create a camera for every view
    var camera = new THREE.PerspectiveCamera(view.fov, width/height, 0.1, 1000);
    camera.position.fromArray(view.position);
    camera.rotation.fromArray(view.rotation);
    carMesh.add(camera);
    view.camera = camera;
  }

  //creating spotLight
  var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set(3.5, 5, 20);

  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;

  spotLight.shadow.camera.near = 500;
  spotLight.shadow.camera.far = 4000;
  spotLight.shadow.camera.fov = 30;

  scene.add(spotLight);

	/**
	  * Create ambient light
	  * @author Rahul Kiefer

  var ambLight = new THREE.AmbientLight(0xf5f5f5); //soft white light
  scene.add(ambLight);
	*/

	/**
	  * Create the floor
	  * @author Rahul Kiefer
	  */
  var floor = new THREE.Mesh(
  	new THREE.PlaneGeometry(20, 100),
  	new THREE.MeshLambertMaterial({color: 0x808080})
  );
  floor.rotation.x = 0; //set back to zero later, fix camera angle
  //scene.add(floor);
}

/**
  * Run the animation
  * @author Rahul Kiefer
  */
function animate() {
  // wait until canvas ready to render
	requestAnimationFrame(animate);

  // render views
  render();
}

/**
  * Render the scene
  * @author Jonathan Lam
  */
function render() {
  for(var view of views) {
    var camera = view.camera;

    // set viewport
    var viewLeft = Math.floor(width * view.left);
    var viewTop = Math.floor(height * view.top);
    var viewWidth = Math.floor(width * view.width);
    var viewHeight = Math.floor(height * view.height);

    renderer.setViewport(viewLeft, viewTop, viewWidth, viewHeight);
    renderer.setScissor(viewLeft, viewTop, viewWidth, viewHeight);
    renderer.setScissorTest(true);
    renderer.setClearColor(view.background);

    // update camera
    camera.aspect = viewWidth/viewHeight;
    camera.updateProjectionMatrix();

    // render view
    renderer.render(scene, camera);
  }
}
