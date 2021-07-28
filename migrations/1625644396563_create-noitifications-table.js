/* eslint-disable camelcase */

exports.shorthands = undefined

const tableName = 'notifications'
const constraintIndexName = 'constraint'
const constraintIndexColumns = ['user_guid', 'item_guid', 'notification_type']
const userNotifsIndexName = 'user_notifications'
const userNotifsIndexColumns = ['user_guid', 'created_at']

exports.up = pgm => {
  pgm.createTable(tableName, {
    id: 'id',
    item_guid: {
      type: 'text',
      notNull: true,
    },
    item_type: {
      type: 'text',
      notNull: true,
    },
    notification_type: {
      type: 'text',
      notNull: true,
    },
    user_guid: {
      type: 'text',
    },
    viewed: {
      type: 'boolean',
      default: false,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    created_by: {
      type: 'text',
      notNull: true,
    },
  })

  // The common use case is to get a specific users newest notifications
  pgm.createIndex(tableName, userNotifsIndexColumns, {
    name: userNotifsIndexName,
  })

  // This will create a unique constraint so the user can't have
  // the same notification for the same type more than once
  pgm.createIndex(tableName, constraintIndexColumns, {
    name: constraintIndexName,
    unique: true,
  })
}

exports.down = pgm => {
  pgm.dropIndex(tableName, userNotifsIndexColumns, {
    name: userNotifsIndexName,
  })
  pgm.dropIndex(tableName, constraintIndexColumns, {
    name: constraintIndexName,
  })
  pgm.dropTable(tableName)
}
