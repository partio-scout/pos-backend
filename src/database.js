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
      'SELECT task_guid, completion_status FROM task_entries WHERE id = $1',
      data.id
    )

    return entry
  } catch (error) {
    console.log('error', error)
  }
}

export async function removeMemberTask(taskEntry) {
  const { user_guid, task_guid } = taskEntry
  try {
    const data = await db.result(
      'DELETE FROM task_entries WHERE user_guid=$1 AND task_guid=$2 AND (completion_status=$3 OR completion_status=$4) ',
      [
        user_guid.toString(),
        task_guid.toString(),
        'COMPLETED',
        'COMPLETION_REQUESTED',
      ]
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function getTaskEntries(user_guid) {
  try {
    const data = await db.any(
      'SELECT task_guid, completion_status FROM task_entries WHERE user_guid = $1',
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
