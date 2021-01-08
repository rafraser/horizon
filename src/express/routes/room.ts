import express from 'express'
import { checkAlreadyPlaying } from '../middleware'
import { roomList } from '../../room'

const router = express.Router()
export default router

router.get('/:roomid', checkAlreadyPlaying, (req, res) => {
  const roomId = req.params.roomid
  const room = roomList.get(roomId)
  if (room) {
    res.sendFile('pages/' + room.type.page, { root: '.' })
  } else {
    res.sendFile('pages/noroom.html', { root: '.' })
  }
})
