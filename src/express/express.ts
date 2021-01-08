import express, { Application } from 'express'
import http from 'http'
import { Server as SocketServer } from 'socket.io'
import { HorizonClient } from '../discord/horizon'

import configuredSession from './session'
import userRoutes from './routes/user'
import { requireLogin } from './middleware'
import { GameRoom } from '../room'
import ChatRoom from '../rooms/chat'

export interface ExpressServer extends Application {
  horizonClient?: HorizonClient
}

export const app = express() as ExpressServer
app.use(configuredSession)
app.use(express.static('assets'))

app.get('/', (req, res) => {
  if (req.session.user) {
    res.send(req.session.user.username + '#' + req.session.user.discriminator)
  } else {
    res.send('Hello World!')
  }
})

app.get('/test', requireLogin, (req, res) => {
  res.send('You have reached the super secret page. Congratulations.<br>' + req.session.loginRedirect + '<br><br><br>' + JSON.stringify(req.session.user))
})

// Routing
app.use('/user', userRoutes)

export const httpServer = new http.Server(app)
export const io = new SocketServer(httpServer)

// Make a room and stick it in
const room = new GameRoom(ChatRoom)
app.get('/room/:roomid', requireLogin, (req, res) => {
  res.sendFile('pages/' + room.type.page, { root: '.' })
})

httpServer.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express + IO server has started on port ${process.env.EXPRESS_PORT}`)
})
