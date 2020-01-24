require('dotenv').config()
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import passport from 'passport'
import { db, postTaskEntry, getTaskEntries } from './database'
import { configurePassport, isLoggedIn } from './auth'
import session from 'express-session'
import connectPgSession from 'connect-pg-simple'

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'

const main = async () => {
  await configurePassport()

  const pgSession = connectPgSession(session)
  const app = express()

  app.use(bodyParser.json())
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  )
  app.set('trust proxy', 1)
  app.use(
    session({
      store: new pgSession({
        pgPromise: db,
      }),
      secret: process.env.SECRET,
      resave: false,
      saveUninitialized: false,
      // Cookie Options
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  )

  const corsOptions = {
    origin: [
      'https://partioid-test.partio.fi',
      'https://id.partio.fi',
      clientUrl,
    ],
    credentials: true,
  }

  app.use(cors(corsOptions))

  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/', (_, res) => res.send('OK'))

  app.get(
    '/login',
    passport.authenticate('saml', {
      successRedirect: '/success',
      failureRedirect: '/failure',
    })
  )

  app.post(
    '/login/callback',
    passport.authenticate('saml', {
      failureRedirect: '/',
      failureFlash: true,
    }),
    async (req, res) => {
      res.redirect(clientUrl)
    }
  )
  app.get('/user', isLoggedIn, async (req, res) => {
    res.json({
      name: `${req.user.firstname} ${req.user.lastname}`,
      canMarkDone: req.user.canMarkDone,
    })
  })

  app.post('/task-entry', isLoggedIn, async (req, res) => {
    try {
      const data = req.body
      data.user_guid = req.user.membernumber
      data.status = req.user.canMarkDone ? 'COMPLETED' : 'COMPLETION_REQUESTED'

      const id = await postTaskEntry(data)
      res.json(id).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  })

  app.get('/task-entries', isLoggedIn, async (req, res) => {
    try {
      const entries = await getTaskEntries(req.user.membernumber)
      res.json(entries).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  })

  app.listen(3001, () => console.log('listening on port 3001'))
}

main().catch(error => console.error(error))
