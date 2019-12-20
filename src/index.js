require('dotenv').config()
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import passport from 'passport'
import { postTaskEntry, getTaskEntries } from './database'
import { configurePassport } from './auth'
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')

const main = async () => {
  await configurePassport()

  const app = express()
  app.use(cookieParser())

  app.use(bodyParser.json())
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  )

  app.use(
    cookieSession({
      name: 'session',
      keys: ['key1'],

      // Cookie Options
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })
  )

  const corsOptions = {
    origin: [
      'http://localhost:3000',
      'https://partioid-test.partio.fi',
      'https://id.partio.fi',
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
    (req, res) => {
      console.log('/login/callback')
      res.redirect('http://localhost:3000/')
    }
  )

  app.post('/task-entry', async (req, res) => {
    try {
      const id = await postTaskEntry(req.body)
      res.json(id).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  })

  app.get('/task-entries/:userGuid', async (req, res) => {
    try {
      const entries = await getTaskEntries(req.params.userGuid)
      res.json(entries).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  })

  app.listen(3001, () => console.log('listening on port 3001'))
}

main().catch(error => console.error(error))
