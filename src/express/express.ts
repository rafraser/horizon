import express, { Application } from 'express'
import { HorizonClient } from '../discord/horizon'

import configuredSession from './session'
import userRoutes from './routes/user'

export interface ExpressServer extends Application {
  horizonClient?: HorizonClient
}

export const app = express() as ExpressServer
app.use(configuredSession)

app.get('/', (req, res) => {
  if (req.session.user) {
    res.send(req.session.user.username + '#' + req.session.user.discriminator)
  } else {
    res.send('Hello World!')
  }
})

app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express server has started on port ${process.env.EXPRESS_PORT}`)
})

// Routing
app.use('/user', userRoutes)
