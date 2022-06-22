const fs = require('fs')
const { resolve } = require('path')
var path = require('path')
require('dotenv').config()
const pgp = require('pg-promise')()

const db = pgp(process.env.DATABASE_URL)

async function main() {
  const filePath = path.join(__dirname, './testidata.csv')
  // Read CSV
  let file = fs.readFileSync(filePath, { encoding: 'utf-8' }, function (err) {
    console.log(err)
  })

  // Split on row
  file = file.split('\n')

  // Get first row for column headers
  headers = file.shift().split(',')

  let json = []
  file.forEach(function (row) {
    // Loop through each row
    rowJson = {}
    row = row.split(',')
    for (var i = 0; i < headers.length; i++) {
      rowJson[headers[i]] = row[i]
    }
    // Add object to list
    json.push(rowJson)
  })

  const cs = new pgp.helpers.ColumnSet(
    ['user_guid', 'created_at', 'created_by', 'task_guid', 'completion_status'],
    { table: 'task_entries' }
  )

  function getNextData(t, pageIndex) {
    let data = null
    data = []
    let lowerLimit = 5000 * pageIndex
    let upperLimit = lowerLimit + 5000
    if (upperLimit > json.length) {
      upperLimit = json.length
    }

    return new Promise((resolve, reject) => {
      for (lowerLimit; lowerLimit < upperLimit; lowerLimit++) {
        let entry = json[lowerLimit]
        data.push({
          user_guid: entry.TAHTahoId,
          created_at: entry.TPALuotu,
          created_by: entry.TPALuoja,
          task_guid:
            entry.activities_Partioaktiviteetti_Yhdistä1_aktiviteetti_View_id,
          completion_status: 'COMPLETED',
        })
      }
      if (data.length === 0) {
        resolve(undefined)
      } else {
        resolve(data)
      }
    })
  }

  db.tx('massive-insert', (t) => {
    const processData = (json) => {
      if (json) {
        const insert = pgp.helpers.insert(json, cs)
        return t.none(insert)
      }
    }
    return t.sequence((index) => getNextData(t, index).then(processData), {
      track: true,
    })
  })
    .then((data) => {
      // COMMIT has been executed
      console.log('Total batches:', data.total, ', Duration:', data.duration)
    })
    .catch((error) => {
      // ROLLBACK has been executed
      console.log(error)
    })
}

main()
