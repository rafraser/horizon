import { Client, ClientOptions, Message, DMChannel, TextChannel } from "discord.js"
import { Application } from "express"
import { Command } from "./command"
import { readdirAsync } from "./utils"
import path from "path"

export interface ExpressServer extends Application {
  horizonClient?: HorizonClient
}

export class HorizonClient extends Client {
  public static prefixes = ["!"]

  public commands: Map<string, Command>
  public expressServer: ExpressServer

  public constructor (expressServer: ExpressServer, options: ClientOptions) {
    super(options)

    this.expressServer = expressServer
    this.expressServer.horizonClient = this

    // Run all of our startup scripts
    this.loadStartup("preload")

    this.on("ready", () => {
      console.log("Horizon has logged into Discord!")
      this.loadStartup("postload")
    })

    this.on("message", this.commandParser)
  }

  public commandParser (message: Message) {
    // Ensure that we're in a good state to run commands
    if (message.author.bot) return
    if (process.env.TESTING_CHANNEL && message.channel.id != process.env.TESTING_CHANNEL) return
    if (message.channel instanceof DMChannel) return
    const channel = message.channel as TextChannel

    // Check for the prefix
    let isCommand = false
    let args
    for (const prefix of HorizonClient.prefixes) {
      if (message.content.startsWith(prefix)) {
        isCommand = true
        args = message.content.slice(prefix.length)
        break
      }
    }
    if (!isCommand) return

    // Handle arguments with fancy regex, then check the command name
    args = args.match(/[^"“” \n]+|["“][^"”]+["”]/g).map(arg => arg.replace(/^["“]|["”]$/g, ""))
    const cmd = args.shift().toLowerCase()
    if (!this.commands || !this.commands.has(cmd)) return
    const command = this.commands.get(cmd)

    // Run the command (with basic error handling)
    try {
      command.execute(this, message, args)
    } catch (err) {
      message.channel.send(err.message)
    }
  }

  public async loadStartup(directory: string) {
    const files = await readdirAsync(path.resolve(__dirname, directory))

    files.forEach(async file => {
      const p = path.parse(file)
      if (p.ext === ".js") {
        const module = await import(`./${directory}/${p.name}.js`)
        module.default(this)
      }
    })
  }

}