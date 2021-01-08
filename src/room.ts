/* eslint-disable no-use-before-define */
import { Namespace, Socket } from 'socket.io'
import { NextFunction } from 'express'
import { io } from './express/express'
import configuredSession from './express/session'
import { User } from './utils'

const wrap = (middleware: any) => (socket: Socket, next: NextFunction) => middleware(socket.request, {}, next)

export const roomList = new Map() as Map<string, GameRoom>
export const playingUsers = new Map() as Map<string, boolean>

export interface GameroomType {
  nicename: string
  page: string
  init: (room: GameRoom) => void
  register: (socket: Socket, room: GameRoom) => void
}

export interface GameSocket extends Socket {
  user: User
  request: any
}

export class GameRoom {
  id: string;
  type: GameroomType;
  clients: number;
  gamedata: any;
  active: boolean = true;
  io: Namespace;
  host?: string;
  finishFunction?: (room: GameRoom) => void

  // eslint-disable-next-line no-undef
  updateLoop?: NodeJS.Timeout
  // eslint-disable-next-line no-undef
  timeout?: NodeJS.Timeout

  constructor (type: GameroomType, host: string = undefined) {
    this.type = type
    this.host = host
    this.gamedata = {}

    this.id = Math.random().toString(16).slice(2) // can we do better
    this.clients = 0
    this.type.init(this)

    console.log('New GameRoom!', this.id)
    this.io = io.of('/' + this.id)

    // Don't let sockets connect without authentication
    this.io.use(wrap(configuredSession))
    this.io.use((socket: GameSocket, next) => {
      if (!socket.request.session.user) {
        next(new Error('Unauthorized'))
        return
      }

      if (playingUsers.has(socket.request.session.user.id)) {
        next(new Error('Already in-game'))
        return
      }

      socket.user = socket.request.session.user
      next()
    })

    // Handle socket connections - pass to roomtype handler
    this.io.on('connection', socket => {
      console.log(this.id, socket.user.id)
      this.clients++
      playingUsers.set(socket.user.id, true)

      if (this.timeout) {
        clearTimeout(this.timeout)
      }

      // Delete rooms with no players
      socket.on('disconnect', () => {
        playingUsers.delete(socket.user.id)
        this.clients--
        if (this.clients <= 0) {
          this.remove()
        }
      })

      type.register(socket, this)
    })

    // Add a timeout for the first connection
    this.timeout = setTimeout(() => this.remove(), 30 * 1000)
  }

  public setUpdateFunction (func: (room: GameRoom) => void, frequency: number = 60) {
    if (this.updateLoop) {
      clearInterval(this.updateLoop)
    }
    this.updateLoop = setInterval(() => func(this), frequency * 1000)
  }

  public setFinishFunction (func: (room: GameRoom) => void) {
    this.finishFunction = func
  }

  public remove () {
    console.log('Closing gameroom!', this.id)
    roomList.delete(this.id)
    this.active = false

    // Run finish callback if applicable
    if (this.finishFunction) {
      this.finishFunction(this)
    }
  }
}

export function createNewRoom (type: GameroomType, host: string = undefined) {
  const room = new GameRoom(type, host)
  roomList.set(room.id, room)
  return room
}
