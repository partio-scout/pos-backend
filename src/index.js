require('dotenv').config()
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { postTaskEntry, getTaskEntries } from './database'

const app = express()

app.use(cors())
app.use(bodyParser.json())

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

app.get('/', (req, res) => res.send('Hello World!'))

// eslint-disable-next-line
app.listen(process.env.PORT || 3001, () => console.log('Server listening!'))
