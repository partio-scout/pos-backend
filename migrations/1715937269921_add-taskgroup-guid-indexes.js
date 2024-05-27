/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.createIndex('task_group_entries', 'taskgroup_guid', {
    ifNotExists: true,
    name: 'task_group_entries_taskgroup_guid_idx',
  })

  // task_group_entries_history
  pgm.createIndex('task_group_entries_history', 'taskgroup_guid', {
    ifNotExists: true,
    name: 'task_group_entries_history_taskgroup_guid_idx',
  })
}

exports.down = (pgm) => {}
