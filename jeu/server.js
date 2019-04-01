const http = require('http');
const fs = require('fs');
const c = require('ansi-colors');
const socketIo = require('socket.io');

var ON_DEATH = require('death'); // This is intentionally ugly.

const port = 8080;

// Création du serveur HTTP.
const httpServer = http.createServer();

const writeResponse = function(httpResponseObject, httpResponseCode, httpResponseBody) {
  switch (httpResponseCode) {
    case 500:
      console.log(c.red.bold(`Erreur 500`));
      httpResponseBody = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erreur 500</title></head><body><h1>Erreur 500</h1><p>Erreur interne.</p></body></html>`;
      break;

    case 404:
      console.log(c.red.bold(`Erreur 404`));
      httpResponseBody = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erreur 404</title></head><body><h1>Erreur 404</h1><p>Le document demandé n'existe pas.</p></body></html>`;
      break;

    case 200:
      console.log(c.cyan(`/ Page d'accueil`));
      break;

    default:
      console.log(c.red.bold(`Erreur non spécifiée`));
      httpResponseBody = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erreur non spécifiée</title></head><body><h1>Erreur non spécifiée</h1><p>Une erreur non spécifiée s'est produite.</p></body></html>`;
  } // switch

  httpResponseObject.writeHead(httpResponseCode, {
    'Content-Type': 'text/html; charset=UTF-8',
    'Content-Length': (typeof httpResponseBody === 'string') ? Buffer.byteLength(httpResponseBody) : httpResponseBody.length
  });
  httpResponseObject.write(httpResponseBody, () => {
    httpResponseObject.end();
  });
};


httpServer.on('request', function(req, res) {
  console.log(c.cyan('Requête HTTP'));
  if (req.url === '/') {
    const page = './index.html';
    fs.readFile(page, function(error, fileData) {
      if (error) {
        writeResponse(res, 500);
      } else {
        writeResponse(res, 200, fileData);
      }
    });
  } else {
    /**
     * Nous gérons une seule 'route' (la page d'accueil),
     * toute autre requête renvoie une erreur 404
     */
    writeResponse(res, 404);
  }
});


/**
 * On démarre un serveur socket.io avec notre serveur HTTP existant
 */
const io = socketIo(httpServer);

/**
 * Retourne un identifiant compatible avec les attributs HTML "id"
 */
const uniqueId = () => {
  const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return randomLetter + Date.now();
};

/**
 * Retourne une couleur aléatoire au format hexadécimal
 */
const getRandomColor = () => {
  return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1,6);
};

const Square = function() {
  const size = 200;
  this.size = size;
  this.x = size / 2;
  this.y = size / 2;
  this.id = uniqueId();
  this.color = getRandomColor();
};

Square.prototype.updatePosition = function(x, y) {
  this.x = x;
  this.y = y;
};

Square.prototype.getClientObject = function() {
  return {
    x: this.x,
    y: this.y,
    size: this.size,
    id: this.id,
    color: this.color,
  }
};

/**
 * On crée un objet pour enregistrer les carrés.
 */
const squares = {};

/**
 * Gestion de l'événement 'connection' : correspond à la gestion
 * d'une requête WebSocket provenant d'un client WebSocket.
 */
io.on('connection', function(socket) {
  console.log(c.magenta('Événement socket.io [connection]'));
  /**
   * socket : un objet qui représente la connexion WebSocket
   * établie entre le client WebSocket et le serveur WebSocket.
   */

  /**
   * Dès la connexion on retourne une liste de tous les carrés existants.
   * On convertit l'objet en tableau pour faciliter le traitement côté client
   * et ne pas exposer les identifiants de socket.
   * Note : Object.keys() ne retourne que les propriétés propres
   * et énumérables d'un objet.
   */
  squaresArray = Object.keys(squares).map(key => squares[key]);
  console.log(c.cyan(`Liste des carrés :`), squares);
  socket.emit('allSquares', squaresArray);

  /**
   * Créer un nouveau carré pour la nouvelle connexion
   */
  const mySquare = new Square();
  squares[socket.id] = mySquare;
  const offset = (mySquare.size / 2) + (squaresArray.length * 10); // Décaler de 10px par nouveau carré
  mySquare.updatePosition(offset, offset);
  const clientObject = mySquare.getClientObject();
  socket.emit('mySquareCreated', clientObject); // Envoyer le carré à la nouvelle connexion (gestionnaire spécial qui déclenche le gestionnaire d'évévement "mousemove")
  socket.broadcast.emit('newSquare', clientObject); // Envoyer le carré à tous les autres utilisateurs
  // console.log(c.cyan(`socket.id : ${c.white(socket.id)}, clientObject.id: ${c.white(clientObject.id)}${c.reset()}`));

  socket.on('moveSquare', function(coords) {
    // console.log(c.magenta('Événement socket.io [moveSquare]'), `x : ${c.white(coords.x)}`, `y : ${c.white(coords.y)}`);

    if (squares[socket.id]) {
      const mySquare = squares[socket.id];
      mySquare.x = coords.x;
      mySquare.y = coords.y;

      // Envoyer la nouvelle position à tous les clients.
      const clientObject = mySquare.getClientObject();
      io.emit('updateSquarePosition', clientObject);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(c.magenta(`Événement socket.io [disconnect] socket.id : ${c.white(socket.id)}, reason: ${c.white(reason)}`));
    if (squares[socket.id] && squares[socket.id].id) {
      const squareId = squares[socket.id].id;
      delete squares[socket.id];
      io.emit('removeSquare', squareId);
    }
  });

  ON_DEATH(function(signal, err) {
    io.emit('killAll', {terminate: true});
  })

}); // 'connection'

httpServer.listen(port, () => {
  console.log(c.cyan(`Serveur démarré à l'adresse : ${c.white('http://localhost:')}${c.white(port)}`));
});
