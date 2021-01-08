import express from 'express'
import { requireLogin } from '../middleware'

const router = express.Router()
export default router

router.get('/:roomid', requireLogin, (req, res) => {
  res.send('Room not found.')
})
