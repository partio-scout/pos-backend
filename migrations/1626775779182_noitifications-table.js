/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = pgm => {
  pgm.addColumns('notifications', {
    viewed_at: { type: 'timestamp' },
  })
}

exports.down = pgm => {}
