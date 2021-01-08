import express from 'express'
import { playingUsers } from '../room'

export function requireLogin (req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.user) {
    req.session.loginRedirect = req.originalUrl
    req.session.save(_ => {
      res.sendFile('pages/login.html', { root: '.' })
    })

    return
  }
  next()
}

export function checkAlreadyPlaying (req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.user) {
    req.session.loginRedirect = req.originalUrl
    req.session.save(_ => {
      res.sendFile('pages/login.html', { root: '.' })
    })

    return
  }

  if (playingUsers.has(req.session.user.id)) {
    res.sendFile('pages/ingame.html', { root: '.' })
    return
  }
  next()
}
