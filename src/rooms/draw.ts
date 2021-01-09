import { createCanvas } from 'canvas'
import { GameRoom, GameSocket } from '../room'

interface DrawSocket extends GameSocket {}

export const CANVAS_WIDTH = 1024
export const CANVAS_HEIGHT = 1024
export const CANVAS_BACKGROUND = 'white'

export const CANVAS_COLORS = [
  '#ff1744',
  '#ff4081',
  '#8e24aa',
  '#7c4dff',
  '#536dfe',
  '#2979ff',
  '#40c4ff',
  '#00e5ff',
  '#00e676',
  '#76ff03',
  '#c6ff00',
  '#ffff00',
  '#ffb300',
  '#ff6d00',
  '#f4511e',
  '#000000'
]

export function generateImage (room: GameRoom) {
  console.log(room, room.gamedata)
  return room.gamedata.canvas.toDataURL()
}

function draw (room: GameRoom, data: any) {
  // Draw on our canvas
  const context = room.gamedata.context
  context.beginPath()
  context.moveTo(data.x0, data.y0)
  context.lineTo(data.x1, data.y1)
  context.strokeStyle = CANVAS_COLORS[data.color]
  context.lineWidth = 4
  context.stroke()
  context.closePath()
}

export const DrawRoom = {
  nicename: 'Drawing Room (Test)',
  page: 'draw.html',

  init (room: GameRoom) {
    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    const context = canvas.getContext('2d')
    context.fillStyle = CANVAS_BACKGROUND
    context.fillRect(0, 0, canvas.width, canvas.height)

    room.gamedata = {
      canvas: canvas,
      context: context,
      usernames: []
    }
  },

  register (sock: GameSocket, room: GameRoom) {
    const socket = <DrawSocket>sock

    // Keep track of all usernames that have played
    if (room.gamedata.usernames.indexOf(socket.user.username) === -1) {
      room.gamedata.usernames.push(socket.user.username)
    }

    // Broadcast the palette choices + current data
    socket.emit('create canvas', {
      palette: CANVAS_COLORS,
      canvasData: room.gamedata.canvas.toDataURL()
    })

    // Network drawing
    // todo: validate data
    socket.on('drawing', (data) => {
      draw(room, data)
      socket.broadcast.emit('drawing', data)
    })
  }
}
