/**
  * Basic app routing using express
  * @author Jonathan Lam
  */

// express and http packages for basic routing
var express = require('express');
var app = express();
var http = require('http').Server(app);

// set port to environment-defined port or 5000 (default)
http.listen(
  process.env.PORT || 5000,
  () => console.log(`Listening on port ${process.env.PORT || 5000}.`));

/**
  * Get socket.io dependency
  * @author Jonathan Lam
  */

// socket.io for real-time WebSocket communication
var io = require('socket.io')(http);
var session = require('express-session')({
    secret: 'test-secret',
    resave: true,
    saveUninitialized: true
});
app.use(session);
var sharedsession = require('express-socket.io-session');
io.use(sharedsession(session, { autoSave: true }));

// callback to listen for io events
io.on('connection', socket => {

  // handle when a person connects
  console.log(`A user with socket id ${socket.id} has connected.`);

  // sync up to express
  socket.handshake.session.socketId = socket.id;
  socket.handshake.session.save();

  // handle when a person creates a new game
  socket.on('createNewGame', callback => {

    // make sure user is not already in a game
    if(socket.handshake.session.gameId !== undefined) return;

    // generate random id of five letters
    var gameIdCharacters = 'abcdefghijklmnopqrstuvwxyz';
    var gameId;
    do {
      gameId = '';
      while(gameId.length < 5) {
        gameId += gameIdCharacters.substr(Math.floor(Math.random() * gameIdCharacters.length), 1);
      }
    } while(Object.keys(rooms).indexOf(gameId) !== -1);

    rooms[gameId] = { host: null, clients: [] };

    callback(gameId);

  });

  // check if user is host
  socket.on('isHost', callback => {
    var hostInterval = setInterval(() => {
      socket.handshake.session.reload(() => {
        if(socket.handshake.session.host !== undefined) {
          clearInterval(hostInterval);
          callback(socket.handshake.session.host === true, socket.handshake.session.socketId);
        }
      });
    }, 50);
  });

  // set a user's name
  socket.on('setName', name => {
    // get room, set name
    var room = rooms[socket.handshake.session.gameId];
    room.clients.find(client => client.socketId === socket.id).name = name;

    // tell sockets to update names
    io.to(socket.handshake.session.gameId).emit('updateNames', room.clients.map(client => client.name));
  });

  // handle device orientation input
  socket.on('deviceOrientation', (forwardSpeed, turnSpeed) => {

    // if not in game return
    if(!socket.handshake.session.gameId) return;

    // get correct client
    var client = rooms[socket.handshake.session.gameId].clients.find(client => client.socketId === socket.id);

    // if host return
    if(!client) return;

    // update client acceleration, heading
    // acceleration is limited from -90 to +90
    // heading is converted into radians
    client.acceleration = -Math.max(-90, Math.min(90, forwardSpeed));
    client.turn = Math.PI/180 * turnSpeed;

    // prevent invalid accelerations and turn speeds
    if(client.acceleration < -90 || client.acceleration > 90) client.acceleration = 0;
    if(client.turn < -90 || client.turn > 90) client.turn = 0;
  });

  // handle when a person disconnects
  socket.on('disconnect', () => {
    console.log(`A user with socket id ${socket.id} has disconnected.`);

    // delete room if host
    if(socket.handshake.session.gameId !== undefined && socket.handshake.session.host === true) {
      // delete room
      delete rooms[socket.handshake.session.gameId];

      // tell users to go away
      io.to(socket.handshake.session.gameId).emit('terminateGame');
    }

    // delete person if client and if room exists
    else if(socket.handshake.session.gameId !== undefined && socket.handshake.session.host === false) {

      // only do if room exists (room may not exist because it is deleted when host leaves)
      var room = rooms[socket.handshake.session.gameId];
      if(room !== undefined) {

        // delete client from room
        room.clients = room.clients.filter(client => client.socketId !== socket.id);

        // update room host
        io.sockets.sockets[room.host.socketId].emit('updatedMap', room.clients);

        // update other users
        io.to(socket.handshake.session.gameId).emit('updateNames', room.clients.map(client => client.name));
      }
    }

    // also remove from session
    socket.handshake.session.gameId = undefined;
    socket.handshake.session.host = undefined;
    socket.handshake.session.save();
  });

});


/**
  * Do game updates (position, speed, acceleration (friction), and heading
  * (turn)) every 10ms. This happens here to ensure every person moves at the
  * same speed. The friction is calculated as a piecewise function (linear
  * decceleration at high speeds, and a decceleration proportional to the
  * speed at low speeds) to make the driving feel more realistic. The constants
  * and multipliers were determined by trial and error to make the driving
  * feel realistic.
  * <p>
  * Equations:
  * - Update speed:                 newSpeed          = oldSpeed + acceleration * accelerationMultiplier - friction
  * - Friction:                     friction          = { if |newSpeed| > frictionConstant * 1.5 then newSpeed > 0 ? -frictionConstant : frictionConstant
  *                                                       if |newSpeed| < frictionConstant * 1.5 then newSpeed * 0.5
  * - Update x position:            newPlayerX        = oldPlayerX + Math.cos(heading) * speed * speedMultiplier
  * - Update y position:            newPlayerY        = oldPlayerY + Math.sin(heading) * speed * speedMultiplier
  * - Update heading (direction):   newPlayerHeading  = oldPlayerHeading + turnSpeed * speed * turnMultiplier
  * @author Jonathan Lam
  */
var accelerationMultiplier = 0.01;    // fraction of the input acceleration that goes into the accleration
var speedMultiplier = 0.005;          // fraction of the input speed that goes into the speed
var turnMultiplier = 0.0002;          // fraction of the input turn that goes into the turn
var highSpeedFrictionConstant = 0.25; // linear decceleration of car at high speeds
var lowSpeedFrictionMultiplier = 0.1; // fraction of the speed that the friction will go against
setInterval(() => {
  // update every game room
  for(var room of Object.keys(rooms)) {
    for(var client of rooms[room].clients) {

      // update player speed
      client.speed += client.acceleration * accelerationMultiplier;
      // bound player speed between -180 and +180
      if(client.speed < -90) client.speed = -90;
      if(client.speed > 90) client.speed = 90;

      // calculated simulated friction and add to speed
      var friction = (Math.abs(client.speed) > highSpeedFrictionConstant * 1.5)
        ? (client.speed > 0 ? 1 : -1) * highSpeedFrictionConstant
        : client.speed * lowSpeedFrictionMultiplier;
      client.speed -= friction;

      // update player position (depends on heading)
      client.x += Math.cos(client.heading) * client.speed * speedMultiplier;
      client.y += Math.sin(client.heading) * client.speed * speedMultiplier;

      // update player heading (turn speed is proportional to the speed and angle of turn)
      client.heading += client.turn * client.speed * turnMultiplier;
    }

    // send data to host
    var socket;
    if(rooms[room].host && (socket = io.sockets.sockets[rooms[room].host.socketId]) !== undefined) {
      socket.emit('updatedMap', rooms[room].clients);
    }
    // send data to clients
    for(var client of rooms[room].clients) {
      if((socket = io.sockets.sockets[client.socketId]) !== undefined) {
        socket.emit('updatedMap', rooms[room].clients);
      }
    }
  }
}, 10);


/**
  * Rooms to allow people to play multiplayer
  * @todo   add verification that server is created, number of people is less than 3
  * @author Jonathan Lam
  */

var rooms = {};
/*
room format: {
  host: [hostId],
  clients: [arrayOfClientIds]
}
client format: {
  name: [name],
  id: [sessionId],
  x: [xPosition],
  y: [yPosistion],
  z: 0 (for now),
  heading: [heading]
}
*/

app.get('/game/:gameId', (req, res, next) => {

  // send to game file
  res.sendFile(`${__dirname}/public/game.html`);

  // get gameid parameter
  var gameId = req.params.gameId.toLowerCase();
  var socket;

  // sync up to socket to join room (keep refreshing until socketId is updated)
  var syncInterval = setInterval(() => req.session.reload(() => {
    if(req.session.socketId !== undefined && (socket = io.sockets.sockets[req.session.socketId]) !== undefined) {
      clearInterval(syncInterval);

      // error 1: room does not exist
      if(Object.keys(rooms).indexOf(gameId) === -1) {
        socket.emit('err', `Game room "${gameId}" does not exist.`);
        return;
      }

      // error 2: room has more than four people in it
      if(rooms[gameId].clients.length > 3) {
        socket.emit('err', `Game room "${gameId}" is already full.`);
        return;
      }

      // error 3: user is already in the game
      if(rooms[gameId].clients.find(client => client.sessionId === req.session.id) !== undefined || (rooms[gameId].host && rooms[gameId].host.sessionId === req.session.id)) {
        socket.emit('err', 'You are already in this game on another tab.');
        return;
      }

      // add gameId to session, session id to game room
      req.session.gameId = gameId;

      // if first person, then host; if not, then client
      if(rooms[gameId].host === null) {
        rooms[gameId].host = {
          sessionId: req.session.id,
          socketId: socket.id
        };
        req.session.host = true;
      } else {
        // create default client
        rooms[gameId].clients.push({
          sessionId: req.session.id,
          socketId: socket.id,
          name: null,
          x: 0,
          y: 0,
          z: 0,
          acceleration: 0,
          speed: 0,
          heading: 0,
          turn: 0
        });
        req.session.host = false;
      }
      req.session.save();

      // join game room
      socket.join(gameId);
      socket.emit('gameId', gameId);
      io.to(gameId).emit('updateNames', rooms[gameId].clients.map(client => client.name));
      console.log(`A user with socket id ${socket.id} has joined the room ${gameId}.`);
    }
  }), 50);
});


/**
  * Static serving in express for resources (*.css, *.js)
  * @author Jonathan Lam
  */
app.use(express.static('public'));
