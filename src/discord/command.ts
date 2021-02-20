import { HorizonClient } from './horizon'
import { GuildMember, Message } from 'discord.js'

export interface Command {
  name: string
  description: string
  aliases?: string[]
  cooldown?: number

  execute: (client: HorizonClient, message: Message, args: string[]) => void
}

export async function findUser (message: Message, args: string[], retself: boolean = false): Promise<GuildMember> {
  // Return mentioned user if any were in the message
  if (message.mentions.members.size >= 1) {
    return message.mentions.members.first()
  }

  // Handle case with 0 arguments
  if (!args || args.length < 1) {
    if (retself) {
      return message.member
    } else {
      throw new Error('No user found!')
    }
  }

  // Fetch the guild members if it's not cached for some reason
  if (message.guild.members.cache.size <= 2) {
    await message.guild.members.fetch()
  }

  // Search the list of users for matching names
  const search = args.shift().toLowerCase()
  const results = message.guild.members.cache.filter(u => {
    return u.displayName.toLowerCase().includes(search) ||
            u.user.username.toLowerCase().includes(search) ||
            u.user.tag.toLowerCase() === search
  })

  // Return results or raise an error
  // In the event no user was found, shove the argument back on the list
  if (results.size > 1) {
    throw new Error('More than one user matched!')
  } else if (results.size < 1) {
    if (retself) {
      args.unshift(search)
      return message.member
    } else {
      args.unshift(search)
      throw new Error('No user found!')
    }
  } else {
    return results.first()
  }
}

// Export these along so we can do a neat import in command implementations
// import { Client, Message, Command } from "../command"
export { Message } from 'discord.js'
export { HorizonClient } from './horizon'
