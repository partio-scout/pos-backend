/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = pgm => {
  // Adding type values doesn't work within a transaction if the type was not created in the same transaction
  // To make sure this migration works when ran independently this migration is not run inside a transaction
  pgm.noTransaction()
  pgm.addTypeValue('completion_status', 'ACTIVE')
}

exports.down = pgm => {}
