import { Client, ClientOptions } from "discord.js"
import { Application } from "express"

export interface ExpressServer extends Application {
    horizonClient?: HorizonClient
}

export class HorizonClient extends Client {
    private expressServer: ExpressServer

    public constructor (expressServer: ExpressServer, options: ClientOptions) {
        super(options)

        this.expressServer = expressServer
        this.expressServer.horizonClient = this

        this.on("ready", () => {
            console.log("Horizon has logged into Discord!")
        })
    }
}