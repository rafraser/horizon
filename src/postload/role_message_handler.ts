import { HorizonClient } from '../horizon'
import { GuildMemberManager, Message, TextChannel, User } from "discord.js"

const ROLE_MESSAGES = [
  {
    guild: "786168512795901962",
    channel: "787658859325816844",
    message: "790543515473281044",
    roles: new Map([
      ["🔴", "789897624324669472"],
      ["🟡", "789897296614916107"],
      ["🟢", "789897351530676285"],
    ]),
    only_one: true,
    text: "Click on the below reactions to change your colour!"
  }
]

export default async function rolesHandler(client: HorizonClient) {
  ROLE_MESSAGES.forEach(async data => {
    const guild = await client.guilds.fetch(data.guild)
    const channel = guild.channels.cache.get(data.channel) as TextChannel

    // Update or send the message
    let message : Message
    try {
      message = await channel.messages.fetch(data.message)
      message.edit(data.text)
    } catch (err) {
      message = await channel.send(data.text)
    }

    // Add reactions to the message if they don't already exist
    data.roles.forEach((_, key) => {
      message.react(key)
    })

    // Add a reaction handler
    client.on("messageReactionAdd", async (reaction, user) => {
      if(user.id === client.user.id) return
      if(reaction.message.id != data.message) return

      let role
      if(role = data.roles.get(reaction.emoji.name)) {
        const member = await guild.members.fetch(user as User)

        if(data.only_one) {
          // Remove all other roles and add this one
          const allRoles = Array.from(data.roles.values())
          await member.roles.remove(allRoles)
          await member.roles.add(role)
        } else {
          // Toggle this role
          if(member.roles.cache.has(role)) {
            await member.roles.remove(role)
          } else {
            await member.roles.add(role)
          }
        }

        // Remove the reaction once processed
        await reaction.users.remove(user as User)
      }
    })
  })
}