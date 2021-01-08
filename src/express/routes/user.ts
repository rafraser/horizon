import express from 'express'
import fetch from 'node-fetch'

import { User } from '../../utils'

const router = express.Router()
export default router

const CLIENT_ID = process.env.DISCORD_CLIENT_ID
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DOMAIN = process.env.DOMAIN || `http://localhost:${process.env.EXPRESS_PORT}`
const redirectUrl = `${DOMAIN}/user/callback`

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
  const redirectEncoded = encodeURIComponent(redirectUrl)
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
  data.append('redirect_uri', redirectUrl)
  const response = await fetch('https://discordapp.com/api/oauth2/token', {
    body: data,
    method: 'POST'
  })

  // Get some neato userdata from the token
  // Get ID and username from token
  const json = await response.json()
  const user = await getDiscordUserData(json.access_token)

  // Finish login, redirect to user page
  req.session.user = user
  req.session.save(_ => {
    if (req.session.loginRedirect) {
      res.redirect(req.session.loginRedirect)
    } else {
      res.redirect('/')
    }
  })
})
