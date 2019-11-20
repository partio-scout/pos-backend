require('dotenv').config()
import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())

app.get('/', (req, res) => res.send('Hello World!'))

// eslint-disable-next-line
app.listen(process.env.PORT || 3001, () => console.log('Server listening!'))
