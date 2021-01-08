// Load the .env file for our environment before any imports
import dotenv from 'dotenv'

import { app } from './express/express'
import { HorizonClient } from './discord/horizon'
dotenv.config({
  path: `${process.env.HORIZON_ENV || 'development'}.env`
})

const horizon = new HorizonClient(app, {})
horizon.login(process.env.DISCORD)
