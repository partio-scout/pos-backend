/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  // Adding indexes
  pgm.createIndex('completed_agegroup_entries', 'user_guid', {
    ifNotExists: true,
  })
  pgm.createIndex('favourite_tasks', 'user_guid', { ifNotExists: true })
  pgm.createIndex('notifications', 'user_guid', { ifNotExists: true })
  pgm.createIndex('task_entries', 'user_guid', { ifNotExists: true })
  pgm.createIndex('task_group_entries', 'user_guid', { ifNotExists: true })
}

exports.down = (pgm) => {}
