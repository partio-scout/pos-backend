import { db } from './index'
import { createNotification } from './notifications'

export async function postTaskGroupEntry(taskGroupEntry) {
  const {
    user_guid,
    created_by,
    taskgroup_guid,
    completed,
    group_leader_name,
  } = taskGroupEntry

  try {
    const old_taskgroup_entries = await db.any(
      'SELECT * FROM task_group_entries WHERE taskgroup_guid = $1 AND user_guid = $2',
      [taskgroup_guid, user_guid.toString()]
    )

    if (old_taskgroup_entries.length > 0) {
      console.log('Already completed')
      return null
    }

    const data = await db.one(
      'INSERT INTO task_group_entries(user_guid, created_by, taskgroup_guid, completed) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_guid, created_by, taskgroup_guid, completed]
    )

    await addTaskGroupEntryToArchive(taskGroupEntry)

    const notification = await createNotification({
      itemGuid: taskgroup_guid,
      itemType: 'TASK_GROUP',
      notificationType: completed,
      userGuid: user_guid,
      createdBy: created_by,
      groupLeaderName: group_leader_name,
    })
    if (!notification) {
      throw new Error('Failed to create a notification.')
    }

    const entry = await db.one(
      'SELECT taskgroup_guid, completed FROM task_group_entries WHERE id = $1',
      data.id
    )

    return entry
  } catch (error) {
    console.log('post taskgroup entry - error', error)
  }
}

export async function addTaskGroupEntryToArchive(taskGroupEntry) {
  const { user_guid, taskgroup_guid, completed } = taskGroupEntry
  try {
    const data = await db.one(
      'INSERT INTO task_group_entries_history(user_guid, taskgroup_guid, old_state, new_state) VALUES ($1, $2, $3, $4 ) RETURNING id',
      [user_guid, taskgroup_guid, null, completed]
    )

    const entry = await db.one(
      'SELECT * FROM task_group_entries_history WHERE id = $1',
      data.id
    )
    return entry
  } catch (error) {
    console.log('add Taskgroup entry to archive - error', error)
  }
}

export async function getTaskGroupEntries(user_guid) {
  try {
    const data = await db.any(
      'SELECT taskgroup_guid, completed FROM task_group_entries WHERE user_guid = $1 ORDER BY created_at ASC',
      user_guid.toString()
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}
