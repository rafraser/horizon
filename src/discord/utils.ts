import { Message, GuildMember } from 'discord.js'

export async function findUser (message: Message, arg: string): Promise<GuildMember> {
  // Fetch the guild members if it's not cached for some reason
  if (message.guild.members.cache.size <= 2) {
    await message.guild.members.fetch()
  }

  // Search the list of users for matching names
  const search = arg.toLowerCase()
  const results = message.guild.members.cache.filter(u => {
    return u.displayName.toLowerCase().includes(search) ||
            u.user.username.toLowerCase().includes(search) ||
            u.user.tag.toLowerCase() === search
  })

  return results ? results.first() : null
}

export type SearchOptions = {
  keyed: Record<string, string>
  basic: string[]
  tags: string[]
  users: GuildMember[]
}

export async function createSearchOptions (message: Message, args: string[], findUsers = true) {
  const options : SearchOptions = {
    keyed: {},
    basic: [],
    tags: [],
    users: []
  }

  for (const arg of args) {
    const split = arg.split(':')
    if (split.length === 2) {
      // Handle key:value arguments
      if (split[0] === 'tag') {
        options.tags.push(split[1].toLowerCase())
      } else {
        options.keyed[split[0]] = split[1]
      }
    } else if (findUsers) {
      // Search for users
      const user = await findUser(message, arg)
      if (user) {
        options.users.push(user)
      } else {
        options.basic.push(arg)
      }
    } else {
      // Chuck any other arguments onto the list
      this.basicOptions.push(arg)
    }
  }

  return options
}
