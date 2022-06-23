const fs = require('fs')
var path = require('path')
require('dotenv').config()
const pgp = require('pg-promise')()

const db = pgp(process.env.DATABASE_URL)

const oldIds = [
  13,
  28,
  61,
  69,
  92,
  106,
  113,
  1851,
  1852,
  1856,
  2527,
  2528,
  2531,
  2534,
  2670,
  2673,
  2676,
  2679,
  2681,
  2683,
  2686,
  2691,
  2906,
  2907,
  2908,
  2909,
  2910,
  2911,
  2912,
  2943,
  2944,
  2945,
  2946,
  2947,
  2948,
  2949,
  2950,
  2951,
  2952,
  3121,
  3124,
  3146,
  3154,
  3155,
  3156,
  3158,
  3159,
  3160,
  3161,
  3163,
  3165,
  3167,
  undefined,
]

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
