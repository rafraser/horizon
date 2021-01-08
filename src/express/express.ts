import express, { Application } from 'express'
import { HorizonClient } from '../discord/horizon'

import configuredSession from './session'
import userRoutes from './routes/user'

export interface ExpressServer extends Application {
  horizonClient?: HorizonClient
}

export const app = express() as ExpressServer
app.use(configuredSession)

app.get('/', (_, res) => {
  res.send('Hello World!')
})

app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express server has started on port ${process.env.EXPRESS_PORT}`)
})

// Routing
app.use('/user', userRoutes)
