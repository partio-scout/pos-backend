require('dotenv').config()
import pgPromise from 'pg-promise'

import {
  createNotification,
  markNotificationAsViewed,
  markNotificationsAsViewed,
  getUserNotifications,
  getNotification,
} from './notifications'

const pgp = pgPromise()
export const db = pgp(process.env.DATABASE_URL)

export async function postTaskEntry(taskEntry) {
  const {
    user_guid,
    created_by,
    task_guid,
    completion_status,
    group_leader_name,
  } = taskEntry

  try {
    const old_task_entries = await db.any(
      'SELECT * FROM task_entries WHERE task_guid = $1 AND user_guid = $2',
      [task_guid, user_guid.toString()]
    )

    if (old_task_entries) {
      const deletePromises = old_task_entries.map(archiveTaskEntry)
      await Promise.all(deletePromises)
    }
    const data = await db.one(
      'INSERT INTO task_entries(user_guid, created_by, task_guid, completion_status) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_guid, created_by, task_guid, completion_status]
    )

    if (completion_status === 'COMPLETED') {
      const notification = await createNotification({
        itemGuid: task_guid,
        itemType: 'TASK',
        notificationType: completion_status,
        userGuid: user_guid,
        createdBy: created_by,
        groupLeaderName: group_leader_name,
      })
      if (!notification) {
        throw new Error('Failed to create a notification.')
      }
    }

    const entry = await db.one(
      'SELECT task_guid, completion_status FROM task_entries WHERE id = $1',
      data.id
    )

    return entry
  } catch (error) {
    console.log('post taskentry - error', error)
  }
}

const archiveTaskEntry = async (entry) => {
  await addTaskEntryToArchive(entry)
  return await deleteTaskEntry(entry.id)
}

export async function addTaskEntryToArchive(taskEntry) {
  const { user_guid, created_at, created_by, task_guid, completion_status } =
    taskEntry

  try {
    const data = await db.one(
      'INSERT INTO task_entries_history(user_guid, created_at, created_by, task_guid, completion_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user_guid, created_at, created_by, task_guid, completion_status]
    )

    const entry = await db.one(
      'SELECT * FROM task_entries_history WHERE id = $1',
      data.id
    )
    return entry
  } catch (error) {
    console.log('add Taskentry to archive - error', error)
  }
}

const deleteTaskEntry = (id) => {
  return db.result('DELETE FROM task_entries WHERE id = $1', id)
}

export async function getTaskEntries(user_guid) {
  try {
    const data = await db.any(
      'SELECT task_guid, completion_status FROM task_entries WHERE user_guid = $1 ORDER BY created_at ASC',
      user_guid.toString()
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function postTaskGroupEntry(taskGroupEntry) {
  const {
    user_guid,
    created_by,
    taskgroup_guid,
    completed,
    // group_leader_name,
  } = taskGroupEntry

  try {
    const old_taskgroup_entries = await db.any(
      'SELECT * FROM task_group_entries WHERE taskgroup_guid = $1 AND user_guid = $2',
      [taskgroup_guid, user_guid.toString()]
    )

    if (old_taskgroup_entries) {
      const deletePromises = old_taskgroup_entries.map(archiveTaskGroupEntry)
      await Promise.all(deletePromises)
    }
    const data = await db.one(
      'INSERT INTO task_group_entries(user_guid, created_by, taskgroup_guid, completed) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_guid, created_by, taskgroup_guid, completed]
    )

    // Halutaanko notifikaatio???

    const entry = await db.one(
      'SELECT taskgroup_guid, completed FROM task_entries WHERE id = $1',
      data.id
    )

    return entry
  } catch (error) {
    console.log('post taskgroup entry - error', error)
  }
}

const archiveTaskGroupEntry = async (entry) => {
  await addTaskGroupEntryToArchive(entry)
  return await deleteTaskGroupEntry(entry.id)
}

export async function addTaskGroupEntryToArchive(taskEntry) {
  const { user_guid, created_at, created_by, task_guid, completed } = taskEntry

  try {
    const data = await db.one(
      'INSERT INTO task_group_entries_history(user_guid, updated_at, taskgroup_guid, old_state, new_state) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user_guid, created_at, created_by, task_guid, completed]
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

const deleteTaskGroupEntry = (id) => {
  return db.result('DELETE FROM task_group_entries WHERE id = $1', id)
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

export async function postFavouriteTask(entry) {
  const { user_guid, task_guid } = entry

  try {
    const data = await db.one(
      'INSERT INTO favourite_tasks(user_guid, task_guid) VALUES ($1, $2) RETURNING id',
      [user_guid, task_guid]
    )

    const entry = await db.one(
      'SELECT task_guid FROM favourite_tasks WHERE id = $1',
      data.id
    )

    return entry
  } catch (error) {
    console.log('error', error)
  }
}

export async function deleteFavouriteTask(entry) {
  const { user_guid, task_guid } = entry
  try {
    const data = await db.result(
      'DELETE FROM favourite_tasks WHERE user_guid = $1 AND task_guid = $2',
      [user_guid, task_guid]
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function getFavouriteTasks(user_guid) {
  try {
    const data = await db.any(
      'SELECT DISTINCT ON (task_guid) * FROM favourite_tasks WHERE user_guid = $1',
      user_guid.toString()
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function deleteActiveTask(entry) {
  const { user_guid, task_guid } = entry
  try {
    const data = await db.result(
      'DELETE FROM task_entries WHERE user_guid = $1 AND task_guid = $2',
      [user_guid, task_guid]
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function getTables() {
  try {
    const tables = await db.any(
      'SELECT table_name\n' +
        '  FROM information_schema.tables\n' +
        " WHERE table_schema='public'\n" +
        "   AND table_type='BASE TABLE'"
    )
    return tables
  } catch (error) {
    {
      console.log('error', error)
    }
  }
}

// Notifications
export {
  createNotification,
  markNotificationAsViewed,
  markNotificationsAsViewed,
  getUserNotifications,
  getNotification,
}
