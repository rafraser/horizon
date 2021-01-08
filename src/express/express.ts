import express, { Application } from 'express'
import http from 'http'
import { Server as SocketServer } from 'socket.io'
import { HorizonClient } from '../discord/horizon'

import configuredSession from './session'
import routes from './routes'

import { GameRoom } from '../room'
import ChatRoom from '../rooms/chat'

export interface ExpressServer extends Application {
  horizonClient?: HorizonClient
}

export const app = express() as ExpressServer
app.use(configuredSession)
app.use(express.static('assets'))
app.use('/', routes)

export const httpServer = new http.Server(app)
export const io = new SocketServer(httpServer)

httpServer.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express + IO server has started on port ${process.env.EXPRESS_PORT}`)
})

// eslint-disable-next-line no-new
new GameRoom(ChatRoom)
