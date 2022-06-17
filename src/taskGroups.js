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
      const userData = req.body
      const promises = Object.values(userData.groups).map((userIds) => {
        const promises = userIds.map((user_guid) =>
          Promise.resolve(
            postTaskGroupEntry({
              user_guid: Number(user_guid),
              created_by: Number(req.user.membernumber),
              taskgroup_guid: req.params.taskgroup_guid,
              completed: 'COMPLETED',
              group_leader_name: userData.group_leader_name,
            })
          )
        )
        return promises
      })
      const iterablePromises = [].concat.apply([], promises)
      const entries = await Promise.all(iterablePromises)
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
