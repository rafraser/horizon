import { HorizonClient, Message } from '../command'
import { MessageEmbed, GuildMember } from 'discord.js'
import discordLink from '../../data/temp_discord_link.json'
import gamesMasterList from '../../data/games_master_list.json'
import { promises } from 'fs'
import path from 'path'
import { sendPaginatedEmbed } from '../pagination'

/* eslint-disable */
type GameInfo = {
  id?: string
  display_name: string
  tags: string[]
  min_players?: number
  max_players?: number
  owners?: number
}
/* eslint-enable */

async function findUser (message: Message, arg: string): Promise<GuildMember> {
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

function processArgs (args: string[]): {mode: string, tags: string[], userArgs: string[]} {
  const options = {
    mode: 'default',
    tags: [] as string[],
    userArgs: [] as string[]
  }

  for (const arg of args) {
    const split = arg.split(':')
    if (split.length <= 1) {
      options.userArgs.push(arg)
    } else {
      // Process special args
      switch (split[0]) {
        case 'tag':
          options.tags.push(split[0])
          break

        case 'mode':
          options.mode = split[1]
          break
      }
    }
  }

  return options
}

function gameFromID (gameID: string) {
  const steamGame = (gamesMasterList.steam_games as Record<string, GameInfo>)[gameID]
  if (steamGame) {
    steamGame.id = gameID
    return steamGame
  } else {
    const nonSteamGame = (gamesMasterList.nonsteam_games as Record<string, GameInfo>)[gameID]
    if (nonSteamGame) {
      nonSteamGame.id = gameID
      return nonSteamGame
    }
  }
}

function userToSteamID (user: GuildMember): string {
  return (discordLink as Record<string, string>)[user.id]
}

async function loadUserGamesData (steamID: string): Promise<string[]> {
  try {
    const gameData = JSON.parse(await promises.readFile(path.join('./owned_games', steamID) + '.json', 'utf8'))
    return gameData.steam_games.concat(gameData.nonsteam_games)
  } catch (e) {
    return null
  }
}

async function loadGameInfo (steamIDs: string[]): Promise<GameInfo[]> {
  // List of lists of owned Steam games
  const gamesList = await Promise.all(steamIDs.map(loadUserGamesData))
  const gamesFlattened : string[] = [].concat(...gamesList.filter(e => e != null))

  // Count up the games
  const gameCounts = gamesFlattened.reduce((counter, game) => {
    counter[game] = (counter[game] || 0) + 1
    return counter
  }, {} as Record<string, number>)

  // Convert to array of game data
  return Object.entries(gameCounts).map(([gameID, count]) => {
    const game = gameFromID(gameID)
    if (game) {
      game.owners = count
      return game
    } else {
      return null
    }
  }).filter(e => e != null && e.owners > 1)
}

function makeEmbedFromPage (gamesPage: GameInfo[], currentPage: number, maxPage: number): MessageEmbed {
  // Make a nice embed
  const embed = new MessageEmbed()
    .setTitle('Best Games')
    .setColor('#1B9CFC')
    .setThumbnail(`https://horizon.sealion.space/img/games/${gamesPage[0].id}.png`)
    .setFooter(`Page ${currentPage + 1}/${maxPage}`)

  for (const game of gamesPage) {
    embed.addField(game.display_name, `${game.owners} owners`)
  }

  return embed
}

export default {
  name: 'games',
  description: 'Check a list of games in common between users',

  async execute (client: HorizonClient, message: Message, args: string[]) {
    // Parse options from args
    const options = processArgs(args)
    if (options.userArgs.length <= 1) {
      await message.channel.send('I need at least two users to work with!')
      return
    }

    // Condense users (reporting anyone who we couldn't find)
    let users = await Promise.all(options.userArgs.map(async arg => await findUser(message, arg)))
    const emptyUserIndexes = users.map((e, i) => e ? null : i).filter(x => x !== null)
    if (emptyUserIndexes.length > 0) {
      const emptyUsers = emptyUserIndexes.map(idx => options.userArgs[idx])
      await message.channel.send(`I couldn't find: ${emptyUsers.join(', ')}`)
    }
    users = users.filter(x => x !== null)

    // Map to SteamIDs
    let steamIDs = users.map(user => userToSteamID(user))
    const emptySteamIndexes = steamIDs.map((e, i) => e ? null : i).filter(x => x !== null)
    if (emptyUserIndexes.length > 0) {
      const emptySteamUsers = emptySteamIndexes.map(idx => users[idx]).map(user => user.displayName)
      await message.channel.send(`No SteamIDs for: ${emptySteamUsers.join(', ')}`)
    }
    steamIDs = steamIDs.filter(x => x !== null)
    if (steamIDs.length < 2) {
      return
    }

    // Fetch the game data
    const gameData = await loadGameInfo(steamIDs)

    // Sort the games by owners
    /*
    const gamesWithNiceNames = Object.entries(filteredCount).map((game: any) => [game[0], gameNameFromId(game[0]), game[1]])
    const sortedGames = gamesWithNiceNames.sort((a: any, b: any) => {
      if (a[2] === b[2]) {
        // Sort by name if same number of owners
        return a[1].localeCompare(b[1])
      } else {
        return b[2] - a[2]
      }
    })
    */
    const sortedGames = gameData
    console.log(sortedGames)

    const pageSize = 8
    const paged = [...Array(Math.ceil(sortedGames.length / pageSize))].map(_ => sortedGames.splice(0, pageSize))
    const embedPages = paged.map((curr, idx) => makeEmbedFromPage(curr, idx, paged.length))

    // Return list of top games, with how many users
    await sendPaginatedEmbed(message, embedPages)
  }
}
