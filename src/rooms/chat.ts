import sanitize from 'sanitize-html'
import { performance } from 'perf_hooks'
import { Socket } from 'socket.io'

import { User } from '../utils'

interface ChatSocket extends Socket {
  user: User
  lastChat: number
}

export default {
  page: 'chat.html',

  register (sock: Socket) {
    const socket = <ChatSocket>sock

    socket.on('message', (text) => {
      if (socket.lastChat && (performance.now() - socket.lastChat) < 500) return

      const cleanText = sanitize(text, { allowedTags: [] }).trim()
      if (cleanText.length < 1) return
      socket.emit('message', {
        username: socket.user.username,
        message: cleanText
      })
    })
  }
}
