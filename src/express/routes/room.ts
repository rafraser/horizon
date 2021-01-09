import express from 'express'
import { roomList, playingUsers } from '../../room'

const router = express.Router()
export default router

router.get('/:roomid', (req, res) => {
  // Ensure that the room exists
  const roomId = req.params.roomid
  const room = roomList.get(roomId)
  if (!room) {
    res.sendFile('pages/noroom.html', { root: '.' })
    return
  }

  // Ensure that the user is logged in
  if (!req.session.user) {
    req.session.loginRedirect = req.originalUrl
    req.session.save(_ => {
      res.sendFile('pages/login.html', { root: '.' })
    })

    return
  }

  // Ensure that the user is not already in a game room
  if (playingUsers.has(req.session.user.id)) {
    const playingRoom = playingUsers.get(req.session.user.id)
    if (playingRoom.id !== roomId) {
      res.sendFile('pages/ingame.html', { root: '.' })
      return
    }

    // Close the old connection and allow reconnection to the room
    if (playingRoom.clients.has(req.session.user.id)) {
      const existingSocket = playingRoom.clients.get(req.session.user.id)
      existingSocket.disconnect(true)
      playingRoom.clients.delete(req.session.user.id)
    }
  }

  // All seems well - load the room page
  res.sendFile('pages/' + room.type.page, { root: '.' })
})
