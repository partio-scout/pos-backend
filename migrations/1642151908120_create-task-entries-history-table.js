/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.createTable('task_entries_history', {
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
    task_guid: {
      type: 'text',
      notNull: true,
    },
    completion_status: {
      type: 'completion_status',
      notNull: true,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('task_entries_history')
}
