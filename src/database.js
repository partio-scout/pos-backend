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
    console.log(data.id)
  } catch (error) {
    console.log('error', error)
  }
}
