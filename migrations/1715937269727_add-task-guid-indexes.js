/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  // Adding indexes
  pgm.createIndex('favourite_tasks', 'task_guid', {
    ifNotExists: true,
    name: 'favourite_tasks_task_guid_idx',
  })

  pgm.createIndex('task_entries', 'task_guid', {
    ifNotExists: true,
    name: 'task_entries_task_guid_idx',
  })

  pgm.createIndex('task_entries_history', 'task_guid', {
    ifNotExists: true,
    name: 'task_entries_history_task_guid_idx',
  })
}

exports.down = (pgm) => {}
