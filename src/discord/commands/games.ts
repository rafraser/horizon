import { promises } from 'fs'
import path from 'path'
import { MessageEmbed, GuildMember } from 'discord.js'

import { HorizonClient, Message } from '../command'
import { sendPaginatedEmbed } from '../pagination'
import { SearchOptions, createSearchOptions } from '../utils'

// todo - this is a terrible way to handle this!
import discordLink from '../../data/temp_discord_link.json'
import gamesMasterList from '../../data/games_master_list.json'

/* eslint-disable */
type GameInfo = {
  id?: string
  display_name: string
  tags: string[]
  min_players?: number
  max_players?: number
  owners?: number
}

type UserGameData = {
  steam_games?: string[],
  nonsteam_games?: string[]
}
/* eslint-enable */

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
    const gameData = JSON.parse(await promises.readFile(path.join('./owned_games', steamID) + '.json', 'utf8')) as UserGameData
    let games = [] as string[]
    if (gameData.steam_games != null) {
      games = games.concat(gameData.steam_games)
    }

    if (gameData.nonsteam_games != null) {
      games = games.concat(gameData.nonsteam_games)
    }

    return games
  } catch (e) {
    return null
  }
}

async function loadGameInfo (steamIDs: string[]): Promise<[GameInfo[], boolean[]]> {
  // List of lists of owned Steam games
  const gamesList = await Promise.all(steamIDs.map(loadUserGamesData))
  const hasGames = gamesList.map(x => x.length >= 1)
  const gamesFlattened : string[] = [].concat(...gamesList.filter(e => e != null))

  // Count up the games
  const gameCounts = gamesFlattened.reduce((counter, game) => {
    counter[game] = (counter[game] || 0) + 1
    return counter
  }, {} as Record<string, number>)

  // Convert to array of game data
  const gameData = Object.entries(gameCounts).map(([gameID, count]) => {
    const game = gameFromID(gameID)
    if (game) {
      game.owners = count
      return game
    } else {
      return null
    }
  }).filter(e => e != null && e.owners > 1)

  return [gameData, hasGames]
}

function filterGames (games: GameInfo[], options: SearchOptions, playerCount: number) {
  games = games.filter(game => (game.max_players || 100) >= playerCount && (game.min_players || 2) <= playerCount)
  games = games.filter(game => options.tags.every(tag => game.tags.includes(tag)))
  return games
}

function sortGames (games: GameInfo[], options: SearchOptions): GameInfo[] {
  switch (options.keyed.search || 'default') {
    case 'alphabetical':
      return games.sort((a, b) => a.display_name.localeCompare(b.display_name))

    case 'random':
      return games.sort((a, b) => {
        if (a.owners === b.owners) {
          return 0.5 - Math.random()
        } else {
          return b.owners - a.owners
        }
      })

    default:
      return games.sort((a, b) => {
        if (a.owners === b.owners) {
          return a.display_name.localeCompare(b.display_name)
        } else {
          return b.owners - a.owners
        }
      })
  }
}

function makeEmbedFromPage (gamesPage: GameInfo[], description: string, currentPage: number, maxPage: number): MessageEmbed {
  // Make a nice embed
  const embed = new MessageEmbed()
    .setTitle('Best Games')
    .setDescription(description)
    .setColor('#1B9CFC')
    .setThumbnail(`https://horizon.sealion.space/img/games/${gamesPage[0].id}.png`)
    .setFooter(`Page ${currentPage + 1}/${maxPage}`)

  for (const game of gamesPage) {
    embed.addField(game.display_name, `${game.owners} owners`)
  }

  return embed
}

async function sendAllGames (message: Message, options: SearchOptions) {
  const steamGamesList = (gamesMasterList.steam_games as Record<string, GameInfo>)
  const gamesTable = Object.values(steamGamesList)
    .filter(game => options.tags.every(tag => game.tags.includes(tag)))
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
    .reduce((acc, game) => {
      return acc + `${game.display_name.substring(0, 15)}\n`
    }, '```elm\n') + '```'
  await message.channel.send(gamesTable)
}

export default {
  name: 'games',
  description: 'Check a list of games in common between users',

  async execute (client: HorizonClient, message: Message, args: string[]) {
    // Parse options from args
    const options = await createSearchOptions(message, args)
    if (options.users.length === 0) {
      await sendAllGames(message, options)
      return
    } else if (options.users.length <= 1) {
      await message.channel.send('I need at least two users to work with!')
      return
    }

    // Condense users (reporting anyone who we couldn't find)
    const users = options.users.filter(x => x !== null)
    const steamIDs = users.map(u => userToSteamID(u) || '0')

    // Fetch the game data
    let [gameData, hasGames] = await loadGameInfo(steamIDs)
    gameData = filterGames(gameData, options, steamIDs.length)
    gameData = sortGames(gameData, options)

    // Handle case where there's nothing in common
    if (gameData.length < 1) {
      await message.channel.send("Couldn't find any games in common! Try making a less restrictive search?")
      return
    }

    // Add a description with all our users
    const usersWithGames = users.filter((_, idx) => hasGames[idx])
    const description = 'Games shared by: ' + usersWithGames.map(user => user.displayName).join(', ')

    // Paginate
    const pageSize = 8
    const paged = [...Array(Math.ceil(gameData.length / pageSize))].map(_ => gameData.splice(0, pageSize))
    const embedPages = paged.map((curr, idx) => makeEmbedFromPage(curr, description, idx, paged.length))
    await sendPaginatedEmbed(message, embedPages)
  }
}
