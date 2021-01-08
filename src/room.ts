/* eslint-disable no-use-before-define */
import { Namespace, Socket } from 'socket.io'
import { NextFunction } from 'express'

import { io } from './express/express'
import configuredSession from './express/session'

const wrap = (middleware: any) => (socket: Socket, next: NextFunction) => middleware(socket.request, {}, next)

export interface GameroomType {
  page: string
  register: (socket: Socket, room: GameRoom) => void
}

export class GameRoom {
  id: string;
  host?: string;
  type: GameroomType;
  io: Namespace;
  clients: number;

  constructor (type: GameroomType, host: string = undefined) {
    this.type = type
    this.host = host

    this.id = Math.random().toString(16).slice(2) // can we do better
    this.clients = 0
    console.log('New GameRoom!', this.id)

    this.io = io.of('/' + this.id)

    // Don't let sockets connect without authentication
    this.io.use(wrap(configuredSession))
    this.io.use((socket: any, next) => {
      if (socket.request.session.user) {
        socket.user = socket.request.session.user
        next()
      } else {
        next(new Error('Unauthorized'))
      }
    })

    this.io.on('connection', socket => {
      this.clients++

      type.register(socket, this)
    })
  }
}
