require('dotenv').config()
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { postTaskEntry } from './database'

const app = express()

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/task-entry', async (req, res) => {
  try {
    const id = await postTaskEntry(req.body)
    res.json(id).status(200)
  } catch (e) {
    res.status(e.statusCode).send(e.message)
  }
})

// eslint-disable-next-line
app.listen(process.env.PORT || 3001, () => console.log('Server listening!'))
