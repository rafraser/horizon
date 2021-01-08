import sanitize from 'sanitize-html'
import { performance } from 'perf_hooks'
import { GameRoom, GameSocket } from '../room'

interface ChatSocket extends GameSocket {
  lastChat: number
}

export default {
  nicename: 'Chat Room (Test)',
  page: 'chat.html',

  init (room: GameRoom) {
    room.gamedata = {
      messageCount: 0
    }
  },

  register (sock: GameSocket, room: GameRoom) {
    const socket = <ChatSocket>sock

    socket.on('message', (text) => {
      if (socket.lastChat && (performance.now() - socket.lastChat) < 500) return

      const cleanText = sanitize(text, { allowedTags: [] }).trim()
      if (cleanText.length < 1) return

      socket.emit('message', {
        username: socket.user.username,
        message: cleanText
      })
      room.gamedata.messageCount++
    })
  }
}
