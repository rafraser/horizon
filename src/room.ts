/* eslint-disable no-use-before-define */
import { Namespace, Socket } from 'socket.io'
import { NextFunction } from 'express'

import { io } from './express/express'
import configuredSession from './express/session'

const wrap = (middleware: any) => (socket: Socket, next: NextFunction) => middleware(socket.request, {}, next)

export const roomList = new Map() as Map<string, GameRoom>
export const userPlaying = new Map() as Map<string, boolean>

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
  // eslint-disable-next-line no-undef
  timeout?: NodeJS.Timeout;

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

    // Handle socket connections - pass to roomtype handler
    this.io.on('connection', socket => {
      this.clients++
      userPlaying.set(socket.user.id, true)

      if (this.timeout) {
        clearTimeout(this.timeout)
      }

      // Delete rooms with no players
      socket.on('disconnect', () => {
        this.clients--
        if (this.clients <= 0) {
          this.remove()
        }
      })

      type.register(socket, this)
    })

    // Add to the room list
    roomList.set(this.id, this)

    // Add a timeout for the first connection
    this.timeout = setTimeout(() => this.remove(), 30 * 1000)
  }

  public remove () {
    console.log('Closing gameroom!', this.id)
    roomList.delete(this.id)
  }
}
