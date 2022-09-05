const fs = require('fs')
const path = require('path')
require('dotenv').config()
const pgp = require('pg-promise')()

const db = pgp(process.env.DATABASE_URL)

async function deleteTaskEntriesById(task_guid) {
  try {
    const data = await db.any(
      'DELETE FROM task_entries WHERE task_guid = $1 RETURNING task_guid',
      [task_guid.toString()]
    )

    console.log('entries successfully deleted', data)
    return data
  } catch (error) {
    console.log('delete taskentries - error', error)
  }
}

async function main() {
  oldIds.forEach((task_guid) => {
    try {
      return deleteTaskEntriesById(task_guid)
    } catch (error) {
      console.log('error while migrating', error)
    }
  })
}

main()
