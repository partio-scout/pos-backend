import Express from 'express'
import { isLoggedIn } from './auth'

import {
  getNotification,
  getUserNotifications,
  markNotificationAsViewed,
  markNotificationsAsViewed,
} from './database'

const app = Express()

app.get('/user/notifications', isLoggedIn, async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.membernumber)
    res.json(notifications).status(200)
  } catch (e) {
    res.status(e.statusCode).send(e.message)
  }
})

app.post('/user/notifications/mark_viewed', isLoggedIn, async (req, res) => {
  try {
    await markNotificationsAsViewed(req.user.membernumber)
    res.json({ success: true }).status(200)
  } catch (e) {
    res.status(e.statusCode).send(e.message)
  }
})

app.post(
  '/user/notifications/:id/mark_viewed',
  isLoggedIn,
  async (req, res) => {
    try {
      const notification = await getNotification(req.params.id)

      if (notification && notification.user_guid === req.user.memberId) {
        const data = await markNotificationAsViewed(req.params.id)
        return res.json({ success: data }).status(200)
      }

      res.status(403).send('Permission denied')
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  }
)

export default app
