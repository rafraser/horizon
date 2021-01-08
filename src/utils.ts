import fs from 'fs'
import { promisify } from 'util'
export const readdirAsync = promisify(fs.readdir)

export class User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
}
