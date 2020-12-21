import express from "express"
import { ExpressServer } from "./horizon"

export const app = express() as ExpressServer

app.get("/", (_, res) => {
  res.send("Hello World!")
})

app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express server has started on port ${process.env.EXPRESS_PORT}`)
})