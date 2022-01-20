/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = async (pgm) => {
  // Select all unique entries from the task_entries table
  const uniques = await pgm.db.query(
    'SELECT user_guid, task_guid FROM task_entries GROUP BY user_guid, task_guid;'
  )

  const promises = uniques.rows.map(async (data) => {
    // Select all the rows for the specific users specific task
    const toMoveList = await pgm.db.query(
      'SELECT * FROM task_entries WHERE user_guid=$1 AND task_guid=$2 ORDER BY created_at DESC;',
      [data.user_guid, data.task_guid]
    )

    // Move all but the latest entry (first one in the list) to the history table
    const movePromises = toMoveList.rows.slice(1).map(async (toMove) => {
      // Add a row to the history table
      await pgm.db.query(
        'INSERT INTO task_entries_history (user_guid, created_at, created_by, task_guid, completion_status) VALUES ($1, $2, $3, $4, $5);',
        [
          toMove.user_guid,
          toMove.created_at,
          toMove.created_by,
          toMove.task_guid,
          toMove.completion_status,
        ]
      )
      // Delete the original from the entries table
      await pgm.db.query('DELETE FROM task_entries WHERE id = $1;', [toMove.id])
    })
    await Promise.all(movePromises)
  })
  await Promise.all(promises)
}

exports.down = (pgm) => {}
