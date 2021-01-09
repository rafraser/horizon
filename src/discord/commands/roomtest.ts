import { MessageEmbed } from 'discord.js'
import { HorizonClient, Message } from '../command'
import { createNewRoom, GameRoom } from '../../room'
import { ChatRoom } from '../../rooms/chat'

const DOMAIN = process.env.DOMAIN || `http://localhost:${process.env.EXPRESS_PORT}`

function buildEmbed (room: GameRoom, contentFunc: (room: GameRoom, embed: MessageEmbed) => MessageEmbed): MessageEmbed {
  const embed = new MessageEmbed()
    .setTitle(room.type.nicename)
    .setColor('#536dfe')
    .setFooter(`Room ID: ${room.id}`)

  // List players in active rooms
  if (room.active) {
    embed.setURL(`${DOMAIN}/room/${room.id}`)

    let clientString = Array.from(room.clients.values()).reduce((acc, val) => {
      if (acc !== '') {
        acc = acc + ', '
      }
      return acc + val.user.username
    }, '')

    if (clientString === '') {
      clientString = 'None'
    }
    embed.addField('Players', clientString, true)
  } else {
    embed.setDescription('This room is no longer active.')
  }

  return contentFunc(room, embed)
}

const contentFunctions = {
  'Chat Room (Test)': function (room: GameRoom, embed: MessageEmbed): MessageEmbed {
    embed.addField('Messages', room.gamedata.messageCount, true)
    return embed
  },

  'Drawing Room (Test)': function (room: GameRoom, embed: MessageEmbed): MessageEmbed {
    return embed
  }
}

export default {
  name: 'roomtest',
  description: 'Testing functionality for rooms',

  async execute (client: HorizonClient, message: Message, args: string[]) {
    // Determine room type and content function
    let roomType = ChatRoom
    if (args.length >= 1) {
      const arg = args.shift().toLowerCase()
      switch (arg) {
        case 'chat':
          roomType = ChatRoom
          break
      }
    }
    const content = (contentFunctions as any)[roomType.nicename]

    const update = (room: GameRoom) => {
      embedMessage.edit(buildEmbed(room, content))
    }

    const room = createNewRoom(roomType, message.member.id)
    room.setUpdateFunction(update, 30)
    room.setFinishFunction(update)
    const embedMessage = await message.channel.send(buildEmbed(room, content))
  }
}
