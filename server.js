console.clear();

/* packages */
const express = require('express');
const app = express()
const expressLayouts = require('express-ejs-layouts');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const {getdb, savedb} = require('./helpers/dbcontroller');
const { v4: uuidv4 } = require('uuid');

/* settings */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ejs */
app.use(expressLayouts)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/views'))
app.set('layout',  path.join(__dirname + '/views/layouts/main'))

/* class */
class Game{
  constructor(title, map,playersSize){
    this.title = title
    this.map = map
    this.playersSize = playersSize
    this.players = []
  }
}

/* routes */
const rooms = {}
const colors = ['#90cbee','#9aee90','#ee9090','#c590ee','#4e4e4e','#eeeb90']

app.get('/', (req,res) => {
  res.render('index')
})

app.post('/getRooms', (req, res) => {
  arr = Object.keys(rooms).map(n => {
    return {
      id: n,
      creator: rooms[n].players[0].name,
      title: rooms[n].title,
      maxplayers: rooms[n].playersSize,
      players: rooms[n].players.length
    }
  })
  res.json({ok:true, data: arr})
})

app.get('/crear_mapa', (req,res) => {
  res.render('creador')
})

app.post('/savemap', (req,res) => {
  db = getdb()
  db.push({
    id: db.length,
    username: req.body.user,
    map: req.body.map,
    img: req.body.img
  })
  savedb(data)
  res.send({ok:true})
})

app.get('/crear_partida', (req,res) => {
  res.render('crearpartida')
})

app.post('/getallmaps',(req,res) => {
  db = getdb().map(n => {return {id: n.id, src: n.img}})
  res.json({ok:true, data: db})
})

app.post('/createNewGame', (req,res) => {
  let id = uuidv4()
  rooms[id] = new Game(req.body.title,req.body.map,req.body.players)
  res.json({ok: true, data: {id}})
})

app.get('/play',(req,res) => {
  res.render('partida', {id: req.query.id})
})

app.post('/getmap',(req,res) => {
  db = getdb().find(n => n.id == rooms[req.body.id].map)
  res.json({ok:true, data: db})
})

/* socket */
io.on('connection', socket => {
  socket.on('new-user', (room, name) => {
    if(rooms[room].players.length > rooms[room].maxplayers){
      return res.redirect('/')
    }
    socket.join(room)
    let player = {name: name, id: socket.id, color: colors[rooms[room].players.length]}
    rooms[room].players.push(player)
    socket.emit('user-connected', player);
    socket.broadcast.to(room).emit('user-connected', player)
  })


  socket.on('disconnect', () => {
    Object.keys(rooms).forEach(n => {
      rooms[n].players.map((e,i) => {
        if(e.id == socket.id){
          rooms[n].players.splice(i-1,1)
          if(rooms[n].players.length == 0){
            delete rooms[n]
          }
          socket.broadcast.to(n).emit('user-disconnected')
        }
      })
      io.sockets.emit('update-rooms',true)
    })

  })
  
})


/* listener */
server.listen('3000', () => {
  console.log('http://localhost:3000');
})
