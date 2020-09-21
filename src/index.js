import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import passport from 'passport'
import {
  db,
  postTaskEntry,
  getTaskEntries,
  deleteActiveTask,
  postFavouriteTask,
  getFavouriteTasks,
  deleteFavouriteTask,
} from './database'
import { getProfile } from './profile'
import { getGroups } from './groups'
import { configurePassport, isLoggedIn } from './auth'
import { getHealth } from './health'
import session from 'express-session'
import connectPgSession from 'connect-pg-simple'
import 'regenerator-runtime/runtime.js'

require('dotenv').config()
const router = express.Router()
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'

const cookieConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: 'none',
  secure: true,
}

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
      cookie: cookieConfig,
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

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.locals.error = err
    if (err.status >= 100 && err.status < 600) res.status(err.status)
    else res.status(500)
    res.json({ error: err })
  })

  app.get('/', (_, res) => res.send('OK'))

  app.get(
    '/login',
    passport.authenticate('saml', {
      successRedirect: '/success',
      failureRedirect: '/failure',
    })
  )

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect(clientUrl)
  })

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

  app.delete('/favourite/:task_guid', isLoggedIn, async (req, res) => {
    try {
      const data = req.body
      data.user_guid = req.user.membernumber
      data.task_guid = req.params.task_guid
      const id = await deleteFavouriteTask(data)
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

  app.delete('/active/:task_guid', isLoggedIn, async (req, res) => {
    try {
      const data = req.body
      data.user_guid = req.user.membernumber
      data.task_guid = req.params.task_guid
      const id = await deleteActiveTask(data)
      res.json(id).status(200)
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

  app.get('/groups', isLoggedIn, async (req, res) => {
    try {
      const groups = await getGroups(req.user.membernumber)
      res.json(groups).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  })

  app.post('/member-entry', isLoggedIn, async (req, res) => {
    try {
      const data = req.body
      data.created_by = req.user.membernumber

      //TODO: do we need to check that this user has right the to approve
      const id = await postTaskEntry(data)
      res.json(id).status(200)
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
