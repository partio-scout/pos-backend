require('dotenv').config()
import pgPromise from 'pg-promise'

const pgp = pgPromise()
export const db = pgp(process.env.DATABASE_URL)

export async function postTaskEntry(taskEntry) {
  const { user_guid, created_by, task_guid, completion_status } = taskEntry

  try {
    const data = await db.one(
      'INSERT INTO task_entries(user_guid, created_by, task_guid, completion_status) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_guid, created_by, task_guid, completion_status]
    )

    const entry = await db.one(
      'SELECT task_guid, completion_status from task_entries WHERE id = $1',
      data.id
    )

    return entry
  } catch (error) {
    console.log('error', error)
  }
}

export async function getTaskEntries(user_guid) {
  try {
    const data = await db.any(
      'SELECT task_guid, completion_status from task_entries WHERE user_guid = $1',
      user_guid
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
      'SELECT task_guid from favourite_tasks WHERE id = $1',
      data.id
    )

    return entry
  } catch (error) {
    console.log('error', error)
  }
}

export async function getFavouriteTasks(user_guid) {
  try {
    const data = await db.any(
      'SELECT * from favourite_tasks WHERE user_guid = $1',
      user_guid
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
