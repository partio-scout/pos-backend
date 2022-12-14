/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.createType('agegroup_state', ['COMPLETED'])
  pgm.createTable('completed_agegroup_entries', {
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
    agegroup_guid: {
      type: 'text',
      notNull: true,
    },
    completion_status: {
      type: 'agegroup_state',
      notNull: true,
    },
  })
}

exports.down = async (pgm) => {
  // Make sure we don't have any data we can lose in the table when doing a migrate down
  const hasRows =
    (await pgm.db.query('SELECT id FROM completed_agegroup_entries')).rows
      .length > 0
  if (hasRows) {
    throw new Error(`
        Migrate down aborted - possible lose of data if completed_agegroup_entries table is dropped: \n 
        Make sure you've emptied the table before dropping.
      `)
  }
  pgm.dropTable('completed_agegroup_entries')
  pgm.dropType('agegroup_state')
}
