import { HorizonClient } from '../horizon'
import { Message, TextChannel, User, GuildEmoji } from "discord.js"

const ROLE_MESSAGES = [
  {
    guild: "786168512795901962",
    channel: "787658859325816844",
    message: "790543515473281044",
    roles: new Map([
      ["795592327229734943", "789897624324669472"], // Red
      ["795592327015563265", "789896778178232320"], // Pink
      ["795592326851854357", "789897186439593986"], // Purple
      ["795592326734807041", "795592534645669918"], // Deep Purple
      ["795592327267221505", "795592537309184040"], // Indigo
      ["795592326944391169", "789896990951473194"], // Blue
      ["795592327216889866", "795592539486158889"], // Light Blue
      ["795592327191199764", "795592541478977616"], // Cyan
      ["795592327069433867", "795592542984732683"], // Teal
      ["795592327216889857", "789897351530676285"], // Green
      ["795592327150174218", "795592959542165506"], // Light Green
      ["795592327133397013", "789897298309021716"], // Lime
      ["795592327191855104", "789897296614916107"], // Yellow
      ["795592327049248819", "795592968219918346"], // Amber
      ["795592327288193034", "795593260059066369"], // Orange
      ["795592327149780992", "795593257467379762"], // Deep Orange
    ]),
    only_one: true,
    text: "Select a reaction below to change your role colour:"
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
      if(key.length > 4) {
        message.react(client.emojis.cache.get(key))
      } else {
        message.react(key)
      }
    })

    // Add a reaction handler
    client.on("messageReactionAdd", async (reaction, user) => {
      if(user.id === client.user.id) return
      if(reaction.message.id != data.message) return

      let reactionId
      if(reaction.emoji instanceof GuildEmoji) {
        reactionId = reaction.emoji.id
      } else {
        reactionId = reaction.emoji.name
      }

      let role
      if(role = data.roles.get(reactionId)) {
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