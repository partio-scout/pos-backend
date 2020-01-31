/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = pgm => {
  pgm.createTable('favourite_tasks', {
    id: 'id',
    user_guid: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    task_guid: {
      type: 'text',
      notNull: true,
    },
  })
}

exports.down = pgm => {
  pgm.dropTable('favourite_tasks')
}
