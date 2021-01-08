import express from 'express'

export function requireLogin (req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.user) {
    req.session.loginRedirect = req.baseUrl
    req.session.save(_ => {
      res.redirect('/user/login')
    })

    return
  }
  next()
}
