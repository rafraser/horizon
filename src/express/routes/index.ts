import express from 'express'
import { requireLogin } from '../middleware'

import userRoutes from './user'
import roomRoutes from './room'

const router = express.Router()
export default router

router.get('/', requireLogin, (req, res) => {
  res.send('You have reached the super secret page. Congratulations.<br><br>' + JSON.stringify(req.session.user))
})

router.use('/user', userRoutes)
router.use('/room', roomRoutes)
