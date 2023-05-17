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
    // Get any existing entries for the given task group and user
    const old_taskgroup_entries = await db.any(
      'SELECT * FROM task_group_entries WHERE taskgroup_guid = $1 AND user_guid = $2',
      [taskgroup_guid, user_guid.toString()]
    )

    // Move the existing entries to the history table (AKA archive)
    if (old_taskgroup_entries) {
      const archivePromises = old_taskgroup_entries.map(
        addTaskGroupEntryToArchive
      )
      await Promise.all(archivePromises)
    }

    // Create an entry for the task group entry state change
    const data = await db.one(
      'INSERT INTO task_group_entries(user_guid, created_by, taskgroup_guid, completed) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_guid, created_by, taskgroup_guid, completed]
    )

    const entry = await db.one(
      'SELECT taskgroup_guid, completed FROM task_group_entries WHERE id = $1',
      data.id
    )

    // Create a notification about the state change
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

    return entry
  } catch (error) {
    console.error('post taskgroup entry - error: ', error)
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

export async function deleteTaskGroupEntryGroupMember(taskGroupEntry) {
  const {
    user_guid,
    created_by,
    taskgroup_guid,
    completed,
    group_leader_name,
  } = taskGroupEntry
  try {
    // Create a notification about the state change
    const notification = await createNotification({
      itemGuid: taskgroup_guid,
      itemType: 'TASK_GROUP',
      notificationType: 'DELETED',
      userGuid: user_guid,
      createdBy: created_by,
      groupLeaderName: group_leader_name,
    })
    if (!notification) {
      throw new Error('Failed to create a notification.')
    }
    const data = await db.result(
      'DELETE FROM task_group_entries WHERE user_guid = $1 AND taskgroup_guid = $2',
      [user_guid.toString(), taskgroup_guid]
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function deleteTaskGroupEntry(taskGroupEntry) {
  const { user_guid, created_by, taskgroup_guid, group_leader_name } =
    taskGroupEntry
  try {
    // Create a notification about the state change
    const notification = await createNotification({
      itemGuid: taskgroup_guid,
      itemType: 'TASK_GROUP',
      notificationType: 'DELETED',
      userGuid: user_guid,
      createdBy: created_by,
      groupLeaderName: group_leader_name,
    })
    if (!notification) {
      throw new Error('Failed to create a notification.')
    }

    return db.result('DELETE FROM task_group_entries WHERE id = $1', id)
  } catch (error) {
    console.error('Delete taskgroup entry - error: ', error)
  }
}

export async function getTaskGroupEntry(user_guid, taskgroup_guid) {
  try {
    const data = await db.any(
      'SELECT * FROM task_group_entries WHERE taskgroup_guid = $1 AND user_guid = $2',
      [taskgroup_guid, user_guid.toString()]
    )
    return data
  } catch (error) {}
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
