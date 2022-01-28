/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.createTable('task_group_entries_history', {
    id: 'id',
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    taskgroup_guid: {
      type: 'text',
      notNull: true,
    },
    user_guid: {
      type: 'text',
      notNull: true,
    },
    old_state: {
      type: 'completion_status',
      notNull: true,
    },
    new_state: {
      type: 'completion_status',
      notNull: true,
    },
  })
}

exports.down = async (pgm) => {
  // Make sure we don't have any data we can lose in the history table when doing a migrate down
  const hasRows =
    (await pgm.db.query('SELECT id FROM task_group_entries_history')).rows
      .length > 0
  if (hasRows) {
    throw new Error(`
      Migrate down aborted - possible lose of data if task_group_entries_history table is dropped: \n 
      Make sure you've moved all the history data from task_group_entries_history to task_group_entries and emptied the task_grpup_entries_history table.
    `)
  }
  pgm.dropTable('task_entries_history')
}
