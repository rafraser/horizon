import session from 'express-session'
import MySQLSession from 'express-mysql-session'

declare module 'express-session' {
  // eslint-disable-next-line no-unused-vars
  interface Session {
    user: any,
    loginRedirect: string
  }
}

const sqlOptions = {
  host: process.env.DATABASE_HOST,
  port: 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DB
}

const MySQLStore = MySQLSession(session as any)
const store = new MySQLStore(sqlOptions)

const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  cookie: { secure: false },
  store: store,
  resave: false,
  saveUninitialized: false
}

if (process.env.HORIZON_ENV === 'production') {
  sessionOptions.cookie.secure = true
}

const configuredSession = session(sessionOptions)
export default configuredSession
