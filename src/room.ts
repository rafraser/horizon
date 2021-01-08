/* eslint-disable no-use-before-define */
import { Namespace, Socket } from 'socket.io'
import { NextFunction } from 'express'
import { io } from './express/express'
import configuredSession from './express/session'

import { HorizonClient } from './discord/horizon'
import { TextChannel } from 'discord.js'

const wrap = (middleware: any) => (socket: Socket, next: NextFunction) => middleware(socket.request, {}, next)

export const roomList = new Map() as Map<string, GameRoom>
export const playingUsers = new Map() as Map<string, boolean>

export interface GameroomType {
  page: string
  register: (socket: Socket, room: GameRoom) => void
}

export interface DiscordRoomData {
  client: HorizonClient
  channel: TextChannel
  createFunction: (channel: TextChannel, room: GameRoom) => void
  finishFunction: (channel: TextChannel, room: GameRoom) => void
}

export class GameRoom {
  id: string;
  host?: string;
  type: GameroomType;
  io: Namespace;
  clients: number;
  discord?: DiscordRoomData;
  gamedata: any;

  // eslint-disable-next-line no-undef
  timeout?: NodeJS.Timeout;

  constructor (type: GameroomType, host: string = undefined, discord: DiscordRoomData = undefined) {
    this.type = type
    this.host = host
    this.discord = discord
    this.gamedata = {}

    this.id = Math.random().toString(16).slice(2) // can we do better
    this.clients = 0

    console.log('New GameRoom!', this.id)
    this.io = io.of('/' + this.id)

    // Don't let sockets connect without authentication
    this.io.use(wrap(configuredSession))
    this.io.use((socket: any, next) => {
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

    // Add to the room list
    roomList.set(this.id, this)

    // Add a timeout for the first connection
    this.timeout = setTimeout(() => this.remove(), 30 * 1000)

    // Run Discord callback (if applicable)
    if (this.discord && this.discord.createFunction) {
      this.discord.createFunction(this.discord.channel, this)
    }
  }

  public remove () {
    console.log('Closing gameroom!', this.id)
    roomList.delete(this.id)

    // Run Discord callback (if applicable)
    if (this.discord && this.discord.finishFunction) {
      this.discord.finishFunction(this.discord.channel, this)
    }
  }
}
