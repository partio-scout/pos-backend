/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = pgm => {
  pgm.addTypeValue('completion_status', 'ACTIVE')
}

exports.down = pgm => {}
