import { HorizonClient, Message } from "../command"

export default {
  name: "ping",
  description: "Ping pong",

  async execute (_: HorizonClient, message: Message, args: string[]) {
    message.channel.send("Pong!")
  }
}