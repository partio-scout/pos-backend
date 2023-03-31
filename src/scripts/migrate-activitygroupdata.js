const fs = require('fs')
var path = require('path')
require('dotenv').config()
const pgp = require('pg-promise')()

const db = pgp(process.env.DATABASE_URL)

// Give csv-file as an argument for script
const appArgs = process.argv.slice(2)
const fileName = appArgs[0]

async function main() {
  const filePath = path.join(__dirname, fileName)
  // Read CSV
  let file = fs.readFileSync(filePath, { encoding: 'utf-8' }, function (err) {
    console.log(err)
  })

  console.log(fileName)
  // Split on row
  file = file.split('\n')

  // Get first row for column headers
  headers = file.shift().split(';')

  console.log()
  let json = []
  file.forEach(function (row) {
    // Loop through each row
    rowJson = {}
    row = row.split(';')
    for (var i = 0; i < headers.length; i++) {
      rowJson[headers[i]] = row[i]
    }
    // Add object to list
    json.push(rowJson)
  })

  const cs = new pgp.helpers.ColumnSet(
    ['user_guid', 'created_at', 'created_by', 'taskgroup_guid', 'completed'],
    { table: 'task_group_entries' }
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
        if (!entry.TMELuoja) {
          console.log(entry)
        }
        const [date, time] = entry.TMELuotu.split(' ')
        const [day, month, year] = date.split('.')
        const [hours, minutes] = time.split(':')
        const createdAtDate = new Date(year, month - 1, day, hours, minutes)
        const createdBy = entry.TMELuoja.split(' ')[1]
        data.push({
          user_guid: entry.TAHTahoId,
          created_at: createdAtDate,
          created_by: createdBy,
          taskgroup_guid: entry.activity_group,
          completed: 'COMPLETED',
        })
      }
      // console.log(data)
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
      console.log('Error in massive-insert', error)
    })
}

main()
