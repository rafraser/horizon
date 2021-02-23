import { Message, MessageEmbed, MessageReaction, User } from 'discord.js'

export async function sendPaginatedEmbed (message: Message, pages: MessageEmbed[]) {
  const pageEmojis = ['⬅️', '➡️']
  let currentPage = 0

  const embedMessage = await message.channel.send(pages[currentPage])
  const reactionCollector = embedMessage.createReactionCollector(
    (reaction, user) => pageEmojis.includes(reaction.emoji.name) && user === message.author, { time: 60000 }
  )

  reactionCollector.on('collection', async (reaction: MessageReaction, user: User) => {
    await reaction.users.remove(user)
    switch (reaction.emoji.name) {
      case pageEmojis[0]:
        currentPage = currentPage > 0 ? currentPage-- : pages.length - 1
        break

      case pageEmojis[1]:
        currentPage = currentPage + 1 < pages.length ? currentPage++ : 0
        break
    }

    await embedMessage.edit(pages[currentPage])
  })

  reactionCollector.on('end', () => {})
}
