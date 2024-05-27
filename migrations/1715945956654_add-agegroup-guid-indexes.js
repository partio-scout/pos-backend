/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  pgm.createIndex('completed_agegroup_entries', 'agegroup_guid', {
    ifNotExists: true,
    name: 'completed_agegroup_entries_agegroup_guid_idx',
  })
}

exports.down = (pgm) => {}
