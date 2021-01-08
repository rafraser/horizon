import { MessageEmbed } from 'discord.js'
import { HorizonClient, Message } from '../command'
import { createNewRoom, GameRoom } from '../../room'
import ChatRoom from '../../rooms/chat'

const DOMAIN = process.env.DOMAIN || `http://localhost:${process.env.EXPRESS_PORT}`

function buildEmbed (room: GameRoom): MessageEmbed {
  const embed = new MessageEmbed()
    .setTitle(room.type.nicename)
    .setColor('#536dfe')
    .addField('Messages', room.gamedata.messageCount, true)
    .setFooter(`Room ID: ${room.id}`)

  if (room.active) {
    embed.setURL(`${DOMAIN}/room/${room.id}`)
    embed.addField('Players', room.clients, true)
  } else {
    embed.setDescription('This room is no longer active.')
  }

  return embed
}

export default {
  name: 'roomtest',
  description: 'Testing functionality for rooms',

  async execute (client: HorizonClient, message: Message, args: string[]) {
    const update = (room: GameRoom) => {
      embedMessage.edit(buildEmbed(room))
    }

    const room = createNewRoom(ChatRoom, message.member.id)
    room.setUpdateFunction(update, 30)
    room.setFinishFunction(update)
    const embedMessage = await message.channel.send(buildEmbed(room))
  }
}
