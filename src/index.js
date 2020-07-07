require('dotenv').config()
import express from 'express'
const router = express.Router()
import cors from 'cors'
import bodyParser from 'body-parser'
import passport from 'passport'
import {
  db,
  postTaskEntry,
  getTaskEntries,
  postFavouriteTask,
  getFavouriteTasks,
} from './database'
import { getProfile } from './profile'
import { configurePassport, isLoggedIn } from './auth'
import { getHealth } from './health'
import session from 'express-session'
import connectPgSession from 'connect-pg-simple'
import 'regenerator-runtime/runtime.js'

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
      '*',
      'https://partioid-test.partio.fi',
      'https://id.partio.fi',
      clientUrl,
      'https://pos-staging.azurewebsites.net',
      'https://pos-production.azurewebsites.net',
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
      const status = data.completion_status
      data.user_guid = req.user.membernumber
      data.created_by = req.user.membernumber
      data.completion_status =
        status === 'ACTIVE'
          ? status
          : req.user.canMarkDone
          ? 'COMPLETED'
          : 'COMPLETION_REQUESTED'

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

  app.post('/favourite', isLoggedIn, async (req, res) => {
    try {
      const data = req.body
      data.user_guid = req.user.membernumber
      const id = await postFavouriteTask(data)
      res.json(id).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  })

  app.get('/favourites', isLoggedIn, async (req, res) => {
    try {
      const entries = await getFavouriteTasks(req.user.membernumber)
      res.json(entries).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  })

  app.get('/profile', isLoggedIn, async (req, res) => {
    try {
      const profile = await getProfile(req.user.membernumber)
      res.json(profile).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  })

  app.get('/health', async (req, res) => {
    try {
      const health = await getHealth(res)
      res.json(health).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  })

  app.use('/', router)
  app.listen(process.env.PORT || 3001, () =>
    console.log('listening on port 3001')
  )
}

main().catch(error => console.error(error))
