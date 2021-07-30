import { isLoggedIn } from './auth'
import Express from 'express'
import { getMember } from './kuksa'

const app = Express()

app.get('/members/:id', isLoggedIn, async (req, res) => {
  try {
    return getMember(req.params.id)
  } catch (e) {
    res.status(e.statusCode).send(e.message)
  }
})

export default app
