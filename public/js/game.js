/**
  * This file is for the game (excluding graphics).
  */


/**
  * Connect to socket.io
  * @author Jonathan Lam
  */
var socket = io();

// get game id to show on element #gameId
socket.on('gameId', gameId => {
  var gameIdText = "";
  var gameIdChars = gameId.split("");
  for(var char of gameIdChars) {
    gameIdText += `<span class='gameIdChar'>${char.toUpperCase()}</span>`;
  }
  document.querySelector('#gameId').innerHTML = gameIdText;
});

/**
  * Get errors on joining room
  * @author Jonathan Lam
  */
socket.on('err', msg => {
  document.querySelector('#gameIdContainer').style.display = 'none';
  document.querySelector('#names').style.display = 'none';
  document.querySelector('#error').textContent = `Error: ${msg}`;
});

/**
  * Get name if client
  * @author Jonathan Lam
  */
var isHost;
var socketId;
socket.emit('isHost', (isHostResponse, socketIdResponse) => {

  if(!isHostResponse) {

    // ask for name, send to server
    var defaultNames = ["Richard","Rasmus","Tony","Aubrey","Don Juan","Graham","Dennis","George","Ted","Rufus","Rami","Willem","Peter","Zack","Oscar","Rick","Brandon","Charlie","Louie","Phil","Nigel","Earl","Jones","Carl","Jake","Richter","Russell",
                        "Corey","Alex","Ash","Mark","Irvin","Dallas\n "]
    var name = prompt('What is your name?', defaultNames[Math.floor(Math.random() * defaultNames.length)]);
    socket.emit('setName', name);

    // set socketId
    socketId = socketIdResponse;

  }

  // set host flag (true if host, false if client)
  isHost = isHostResponse;
});

/**
  * Update name listing
  * @author Jonathan Lam
  */
var namesElement = document.querySelector('#names');
socket.on('updateNames', names => {

  /**
    * Position name on top left of correct screen
    * @author Jonathan Lam
    */
  var positions;
  switch(names.length) {
    // one person joined: full screen
    case 1:
      positions = [ [ 0, 0 ] ];
      break;
    // two people in the game: side by side
    case 2:
      positions = [ [ 0, 0 ], [ width/2, 0 ] ];
      break;
    // three people in the game: top two side by side, bottom in center
    case 3:
      positions = [ [ 0, 0 ], [ width/2, 0 ], [ width/4, height/2 ] ];
      break;
    // four people in the game: top two side by side, bottom two side by side
    case 4:
      positions = [ [ 0, 0 ], [ width/2, 0 ], [ 0, height/2 ], [ width/2, height/2 ] ];
      break;
    // nobody joined; no positions
    case 0:
    default:
      break;
  }

  var namesElement = document.querySelector('#names');
  namesElement.innerHTML = '';
  for(var i = 0; i < names.length; i++) {
    var nameDiv = document.createElement('div');
    nameDiv.classList.add('name');
    nameDiv.style.left = positions[i][0] + 40 + 'px'; // added padding 40px
    nameDiv.style.top = positions[i][1] + 40 + document.querySelector('#controls').clientHeight + 'px';  // added padding 40px plus height of controls
    nameDiv.appendChild(document.createTextNode(names[i] || 'An unnamed driver'));
    namesElement.appendChild(nameDiv);
  }

  // update cars and cameras
  updateCars();

  // if client
  if(isHost !== undefined && !isHost) {

    // overwrite main render function with client one
    overwriteRender(socketId);

    // add .mobile class to controls to transform it
    document.querySelector('#controls').classList.add('mobile');

  }

});

/**
  * Terminate game (if host leaves)
  * @author Jonathan Lam
  */
socket.on('terminateGame', () => {
  window.location.href = '/';
});

/**
  * If client, get orientation event and send to server
  * Calculates forward speed from gamma (and beta), turn from beta
  * @author Jonathan Lam
  */
window.addEventListener('deviceorientation', event => {

  // only do this for client
  if(isHost) return;

  // adjusting the 'no pedal' position from flat to 45 degrees
  var beta = event.beta;
  var gamma = event.gamma + 45;

  var forwardSpeed = 0, turnSpeed = 0;
  // device facing upwards
  if(Math.abs(beta) < 90) {
    forwardSpeed = gamma;
    turnSpeed = beta;
  }
  // device facing downwards -- put at extreme (-90 or 90)
  else {
    forwardSpeed = gamma < 0 ? 90 : -90;
    turnSpeed = (beta < 0 ? -180 : 180) - beta;
  }

  // send in deviceorientation
  // comment this for testing on desktop
  socket.emit('deviceOrientation', forwardSpeed, turnSpeed);

});
// uncomment this for testing on desktop
// setTimeout( () => socket.emit('deviceOrientation', 10, 50), 1000 );

/**
  * Get all client positions
  * Host will show all
  * Client will show view from just their car
  * @author Jonathan Lam
  */
socket.on('updatedMap', mapData => {
  map = mapData;
});
