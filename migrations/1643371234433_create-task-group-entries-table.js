/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.createTable('task_group_entries', {
    id: 'id',
    user_guid: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    created_by: {
      type: 'text',
      notNull: true,
    },
    taskgroup_guid: {
      type: 'text',
      notNull: true,
    },
    completed: {
      type: 'boolean',
      default: false,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('task_group_entries')
}
