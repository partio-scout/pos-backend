/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.createType('task_group_state', ['COMPLETED'])
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
      type: 'task_group_state',
      notNull: true,
    },
  })
}

exports.down = (pgm) => {
  pgm.dropTable('task_group_entries')
  pgm.dropType('task_group_state')
}
