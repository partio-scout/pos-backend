/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  // Adding indexes
  pgm.createIndex('completed_agegroup_entries', 'user_guid', {
    ifNotExists: true,
    name: 'completed_agegroup_entries_user_guid_idx',
  })
  pgm.createIndex('favourite_tasks', 'user_guid', {
    ifNotExists: true,
    name: 'favourite_tasks_user_guid_idx',
  })
  pgm.createIndex('notifications', 'user_guid', {
    ifNotExists: true,
    name: 'notifications_user_guid_idx',
  })
  pgm.createIndex('task_entries', 'user_guid', {
    ifNotExists: true,
    name: 'task_entries_user_guid_idx',
  })
  pgm.createIndex('task_group_entries', 'user_guid', {
    ifNotExists: true,
    name: 'task_group_entries_user_guid_idx',
  })
}

exports.down = (pgm) => {}
