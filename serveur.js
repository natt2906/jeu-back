var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var app = express();
var URL = 'mongodb://<dbuser>:<dbpassword>@ds157735.mlab.com:57735/heroku_2hhk567w';
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);


//io = io.listen(app);
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

app.set('view engine', 'pug');
app.use('/js', express.static(__dirname + '/js'))
app.use('/css', express.static(__dirname + '/css'))
app.use('/image', express.static(__dirname + '/image'))

/**
 * joueurs est un tableau de joueurs
 * 
 * un joueur est un objet de la forme :
 * {
 *  usernam: 'toto',
 *  id: socket.id
 * }
 */
app.locals.joueurs = [];



io.on('connection', function (socket) {

  // app.locals.joueurs.push(socket.id); 
  io.emit('jesuisla', app.locals.joueurs);
  socket.on('cube', function(lecube){
    socket.broadcast.emit('cube2',lecube);
    console.log(lecube);
  })

  socket.on('nom', function(lenom){
    socket.broadcast.emit('nom2',lenom);
    console.log(lenom);
  })
  socket.on('monidsocket', function(lid){
    
  })

});

app.get('/', function (req, res) {
  res.render('formulaire');
})
// app.post('/index', function (req, res) {
//   res.render('index');
// })

app.post('/index', function (req, res) {
  const { name } = req.body

  if (name) {
    MongoClient.connect(URL, {
      useNewUrlParser: true
    }, function (err, client) {
      if (err) {
        return;
      }
      const db = client.db('heroku_2hhk567w');
      const collection = db.collection('users');
     collection.find({
        users: name
      }).toArray(function(error, doc){
        console.log(doc.length);
        if(doc.length > 0){
          res.render('formulaire')
        }else{
          // ajouter le joueurs à la liste des joueurs en local
          app.locals.joueurs.push(name)

          collection.insertOne({
            users: name,
          })
          client.close();
          res.render('index', {
            name: name
          });
        }
      })

    });
  }
});

app.use(function (req, res) {
  res.status(404).send('ERROR 404');
})
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8080;
}
server.listen(port);