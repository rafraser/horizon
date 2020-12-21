// Load the .env file for our environment before any imports
import dotenv from "dotenv"
dotenv.config({
    path: `${ process.env.HORIZON_ENV || "development" }.env`
})

import { app } from "./express"
import { HorizonClient } from "./horizon"

const horizon = new HorizonClient(app, {})
horizon.login(process.env.DISCORD)