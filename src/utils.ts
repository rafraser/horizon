import fs from 'fs'
import { promisify } from 'util'
import { spawn } from 'child_process'
export const readdirAsync = promisify(fs.readdir)

export class User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
}

export async function executePython (script: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonCommand = 'python'
    let pythonInstance

    // Handle args and spawn the python instance
    if (args) {
      const argsArray = Array.isArray(args) ? args : [args]
      argsArray.unshift('util/' + script + '.py')
      pythonInstance = spawn(pythonCommand, args)
    } else {
      pythonInstance = spawn(pythonCommand, ['util/' + script + '.py'])
    }

    // Capture output
    let data = ''
    pythonInstance.stdout.on('data', d => { data += d })
    pythonInstance.stderr.on('data', d => { data += d })

    // Resolve/reject the promise depending on exit code
    pythonInstance.on('close', code => {
      data = data.trim()
      if (code === 0) {
        resolve(data)
      } else {
        reject(data)
      }
    })
  })
}
