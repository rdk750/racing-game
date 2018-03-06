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
	* Function to create a car
	* @author Rahul Kiefer
	*/
function Car() {

	var hoodHeight = 1.25; //height of a car's hood
	var carHeight = hoodHeight + .75; //distance between ground and roof

	this.shape = new THREE.Shape(); //drawing the car
	this.shape.moveTo(0,0);
	this.shape.lineTo(0,hoodHeight); //from front bottom to front of hood
	this.shape.lineTo(2,hoodHeight); //from front of hood to windshield
	this.shape.lineTo(2.5,carHeight); //from bottom of windshield to top of windshield
	this.shape.lineTo(4.5,carHeight); //from top of windshield to top of back window
	this.shape.lineTo(5,hoodHeight); //from top of back window to bottom of back window
	this.shape.lineTo(6,hoodHeight); //from bottom of back window to top of trunk
	this.shape.lineTo(6,0); //from top of trunk to bottom of trunk

	this.extrudeSettings = {
		steps: 1,
		amount: 3, //WIDTH OF CAR!!!
		bevelEnabled: true,
		bevelThickness: .5,
		bevelSize: .5,
		bevelSegments: 5
	}

  this.geometry = new THREE.ExtrudeGeometry(this.shape, this.extrudeSettings);
	this.material = new THREE.MeshLambertMaterial({color:0xCC0000});
	this.mesh = new THREE.Mesh(this.geometry, this.material);
	scene.add(this.mesh);

  this.addCamera = camera => {
    this.camera = camera;
    this.mesh.add(camera);
  };

  this.remove = () => {
    this.mesh.remove(this.camera);
    scene.remove(this.mesh);
  };
}

// initial car at 0,0 for testing
var car = new Car();

/**
  * Creating multiple views
  * @author Jonathan Lam
  */
var views = [
  // car 1: left top [currently: viewing car from front *FIX*]
  {
    left: 0,
    top: 0,
    width: 0.5,
    height: 0.5,
    background: new THREE.Color(0.5, 0.5, 0.7),
    position: [20, 3, 1.5], //pos of camera relative to car
    rotation: [0, Math.PI/2, 0],
    fov: 30
  },
  // car 2: right top (looking down on car from above)
  {
    left: 0.5,
    top: 0,
    width: 0.5,
    height: 0.5,
    background: new THREE.Color(0.5, 0.5, 0.7),
		position: [20, 3, 1.5], // [3, 15, 1.5], //pos of camera relative to car
    rotation: [0, Math.PI/2, 0],//[-Math.PI/2, 0, 0],
    fov: 30
  },
  // car 3: left bottom (looking at car from front)
  {
    left: 0,
    top: 0.5,
    width: 0.5,
    height: 0.5,
    background: new THREE.Color(0.5, 0.5, 0.7),
		position: [20, 3, 1.5], // [3, 15, 1.5], //pos of camera relative to car
    rotation: [0, Math.PI/2, 0],//[-Math.PI/2, 0, 0],
    // position: [-10, 3, 1.5], //pos of camera relative to car
    // rotation: [-Math.PI/2, -Math.PI/2, -Math.PI/2],
    fov: 30
  },
  // car 4: right bottom
  {
    left: 0.5,
    top: 0.5,
    width: 0.5,
    height: 0.5,
    background: new THREE.Color(0.5, 0.5, 0.7),
		position: [20, 3, 1.5], // [3, 15, 1.5], //pos of camera relative to car
    rotation: [0, Math.PI/2, 0],//[-Math.PI/2, 0, 0],
    // position: [3.25, 5, 20], //pos of camera relative to car
    // rotation: [-.1, 0, 0],
    fov: 30
  }
];

// update cars
var map = [];
var cars = [];
function updateCars() {
  // remove all cars
  for(var i = 0; i < cars.length; i++) {
    cars[i].remove();
  }
  cars = [];

  // make new ones
  for(var i = 0; i < map.length; i++) {
    var car = new Car();
    // x and y are coordinates on flat plane in server
    // x and z are coordinates on flat plane in three.js
    car.mesh.position.x = map[i].x;
    car.mesh.position.z = map[i].y;
    car.mesh.position.y = map[i].z;
    car.addCamera(views[i].camera);
    cars.push(car);
  }

  // get the number of cars
  console.log(map, cars);
}

// init function
function init() {
  for(var view of views) {
    // create a camera for every view
    var camera = new THREE.PerspectiveCamera(view.fov, width/height, 0.1, 1000);
    camera.position.fromArray(view.position);
    camera.rotation.fromArray(view.rotation);
    view.camera = camera;
  }

	/**
	  * Create spotlight
	  * @author Rahul Kiefer
    */

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
		*/
  var ambLight = new THREE.AmbientLight(0xf5f5f5); //soft white light
  scene.add(ambLight);

	/**
	  * Create the floor
	  * @author Rahul Kiefer
	  */
  var floor = new THREE.Mesh(
  	new THREE.PlaneGeometry(500, 500),
  	new THREE.MeshLambertMaterial({color: 0x808080})
  );

  floor.rotation.x = -Math.PI/2; //set back to zero later, fix camera angle
  scene.add(floor);
}

/**
  * Run the animation
  * @author Rahul Kiefer
  */
function animate() {
  // update coordinates of cars
  for(var i = 0; i < map.length; i++) {
    if(cars[i]) {
      // see note above for switched z and y
      cars[i].mesh.position.x = map[i].x;
      cars[i].mesh.position.z = -map[i].y;
      cars[i].mesh.position.y = map[i].z;
      cars[i].mesh.rotation.y = map[i].heading;
    }
  }

  // render views
  render();

  // wait until canvas ready to render
	requestAnimationFrame(animate);
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

// init and animate to start the game
init();
animate();
