import { Message, MessageEmbed, MessageReaction, User } from 'discord.js'

export async function sendPaginatedEmbed (message: Message, pages: MessageEmbed[]) {
  const pageEmojis = ['⏪', '⏩']
  let currentPage = 0

  const embedMessage = await message.channel.send(pages[currentPage])
  await embedMessage.react(pageEmojis[0])
  await embedMessage.react(pageEmojis[1])

  const reactionCollector = embedMessage.createReactionCollector(
    (reaction, user) => {
      return pageEmojis.includes(reaction.emoji.name) && !user.bot
    }, { time: 60000 }
  )

  reactionCollector.on('collect', async (reaction: MessageReaction, user: User) => {
    await reaction.users.remove(user)

    switch (reaction.emoji.name) {
      case pageEmojis[0]:
        currentPage = currentPage > 0 ? --currentPage : pages.length - 1
        break

      case pageEmojis[1]:
        currentPage = currentPage + 1 < pages.length ? ++currentPage : 0
        break

      default:
        break
    }

    await embedMessage.edit(pages[currentPage])
  })

  reactionCollector.on('end', () => {})
}