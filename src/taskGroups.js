import Express from 'express'
import { isLoggedIn, isGroupLeader } from './auth'

import { postTaskGroupEntry, getTaskGroupEntries } from './database'

const app = Express()

app.post(
  '/groups/mark-taskgroup-done/:taskgroup_guid',
  isLoggedIn,
  isGroupLeader,
  async (req, res) => {
    try {
      const userIds = req.body.userIds
      const promises = userIds.map((user_guid) =>
        Promise.resolve(
          postTaskGroupEntry({
            user_guid,
            created_by: req.user.membernumber,
            taskgroup_guid: req.params.taskgroup_guid,
            completed: 'COMPLETED',
            group_leader_name: req.body.group_leader_name,
          })
        )
      )
      const entries = await Promise.all(promises)
      res.json(entries).status(200)
    } catch (e) {
      res.status(e.statusCode).send(e.message)
    }
  }
)

app.get('/task-group-entries', isLoggedIn, async (req, res) => {
  try {
    const entries = await getTaskGroupEntries(req.user.membernumber)
    res.json(entries).status(200)
  } catch (e) {
    res.status(e.statusCode).send(e.message)
  }
})

export default app
