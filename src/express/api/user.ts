import express from 'express'
import fetch from 'node-fetch'

export class User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
}

const router = express.Router()
const CLIENT_ID = process.env.DISCORD_CLIENT_ID
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const PORT = process.env.PORT

let redirect = `http://localhost:${PORT}/user/callback`
if (process.env.HORIZON_ENV === 'production') {
  redirect = `http://horizon.sealion.space:${PORT}/user/callback`
}

async function getDiscordUserData (token: string) {
  const res = await fetch('https://discord.com/api/users/@me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  return await res.json() as User
}

router.get('/login', (_, res) => {
  const redirectEncoded = encodeURIComponent(redirect)
  res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${redirectEncoded}`)
})

router.get('/logout', (req, res) => {
  req.session.destroy(console.error)
  res.redirect('/')
})

router.get('/callback', async (req, res) => {
  if (!req.query.code) throw new Error()
  const code = req.query.code
  // const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

  // Fetch OAuth2 token from login code
  const data = new URLSearchParams()
  data.append('client_id', CLIENT_ID)
  data.append('client_secret', CLIENT_SECRET)
  data.append('code', code as string)
  data.append('grant_type', 'authorization_code')
  data.append('scope', 'identify')
  data.append('redirect_uri', redirect)
  const response = await fetch('https://discordapp.com/api/oauth2/token', {
    body: data,
    method: 'POST'
  })

  // Get some neato userdata from the token
  // Get ID and username from token
  const json = await response.json()
  const user = await getDiscordUserData(json.access_token)
  console.log(user)

  // Finish login, redirect to user page
  req.session.user = user
  req.session.save(_ => {
    res.redirect('/')
  })
})
