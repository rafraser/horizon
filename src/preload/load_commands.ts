import path from "path"
import { readdirAsync } from "../utils"
import { HorizonClient } from '../horizon'
import { Command } from "../command"

export default async function loadCommands(client: HorizonClient) {
  client.commands = new Map()
  const files = await readdirAsync(path.resolve(__dirname, "../commands"))
  files.forEach(file => {
    const p = path.parse(file)
    if (p.ext === '.js') loadCommand(client, p.name)
  })
}

async function loadCommand(client: HorizonClient, name: string) {
  const module = await import(`../commands/${name}.js`)
  const command = module.default as Command

  client.commands.set(command.name, command)
  if (command.aliases) {
    command.aliases.forEach(alias => client.commands.set(alias, command))
  }
}