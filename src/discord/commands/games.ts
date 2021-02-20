import { HorizonClient, Message } from '../command'
import { MessageEmbed } from 'discord.js'
import discordLink from '../../data/temp_discord_link.json'
import gamesMasterList from '../../data/games_master_list.json'
import { promises } from 'fs'
import path from 'path'

async function findUser (message: Message, arg: string) {
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

async function loadUserGamesData (message: Message, arg: string): Promise<string[] | null> {
  const user = await findUser(message, arg)
  if (!user) {
    return null
  }

  // Attempt to load the scraped games data for this user
  try {
    const steamID = (discordLink as any)[user.id]
    const gameData = JSON.parse(await promises.readFile(path.join('./owned_games', steamID) + '.json', 'utf8'))
    return (gameData.steam_games)
  } catch (e) {
    return null
  }
}

function gameNameFromId (id: string) {
  return (gamesMasterList as any).steam_games[id].display_name
}

export default {
  name: 'games',
  description: 'Check a list of games in common between users',

  async execute (client: HorizonClient, message: Message, args: string[]) {
    if (args.length <= 1) {
      message.channel.send('I need at least two users to work with!')
      return
    }

    // Process any special arguments (TBD)

    // Get a list of lists of owned Steam games
    const userGamesList = await Promise.all(args.map(async arg => await loadUserGamesData(message, arg)))
    const allGamesWithRepeats = [].concat(...userGamesList.filter(e => e != null))

    // Count how many people own each game
    const allGamesCounted : object = allGamesWithRepeats.reduce((counter, game) => {
      counter[game] = (counter[game] || 0) + 1
      return counter
    }, {})

    // Sort the games by owners
    const gamesWithNiceNames = Object.entries(allGamesCounted).map((game: any) => [game[0], gameNameFromId(game[0]), game[1]])
    const sortedGames = gamesWithNiceNames.sort((a: any, b: any) => {
      if (a[2] === b[2]) {
        // Sort by name if same number of owners
        return a[1] - b[1]
      } else {
        return b[2] - a[2]
      }
    }).slice(0, 5)

    // Make a nice embed
    const embed = new MessageEmbed()
      .setTitle('Best Games')
      .setColor('#1B9CFC')
      .setThumbnail(`https://horizon.sealion.space/img/games/${sortedGames[0][0]}.png`)

    for (const game of sortedGames) {
      embed.addField(game[1], `${game[2]} owners`)
    }

    // Return list of top games, with how many users
    await message.channel.send(embed)
  }
}
