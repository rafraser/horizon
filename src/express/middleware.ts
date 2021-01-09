import express from 'express'

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
