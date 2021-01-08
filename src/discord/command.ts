import { HorizonClient } from './horizon'
import { Message } from 'discord.js'

export interface Command {
  name: string
  description: string
  aliases?: string[]
  cooldown?: number

  execute: (client: HorizonClient, message: Message, args: string[]) => void
}

// Export these along so we can do a neat import in command implementations
// import { Client, Message, Command } from "../command"
export { Message } from 'discord.js'
export { HorizonClient } from './horizon'
