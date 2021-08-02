/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = pgm => {
  pgm.addColumns('notifications', {
    group_leader_name: { type: 'text' },
  })
}

exports.down = pgm => {
  pgm.dropColumn('notifications', {
    group_leader_name: { type: 'text' },
  })
}
