import express, { Application } from 'express'
import path from 'path'

import { HorizonClient } from '../discord/horizon'

import configuredSession from './session'
import userRoutes from './routes/user'
import { requireLogin } from './middleware'

export interface ExpressServer extends Application {
  horizonClient?: HorizonClient
}

export const app = express() as ExpressServer
app.use(configuredSession)
app.use(express.static('assets'))

app.get('/', (req, res) => {
  if (req.session.user) {
    res.send(req.session.user.username + '#' + req.session.user.discriminator)
  } else {
    res.send('Hello World!')
  }
})

app.get('/test', requireLogin, (req, res) => {
  res.send('You have reached the super secret page. Congratulations.<br>' + req.session.loginRedirect + '<br><br><br>' + JSON.stringify(req.session.user))
})

app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express server has started on port ${process.env.EXPRESS_PORT}`)
})

// Routing
app.use('/user', userRoutes)
