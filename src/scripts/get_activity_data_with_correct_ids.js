// Run script with command: node get_activity_data_with_correct_ids.js FILEPATH activity/activitygroup

require('dotenv').config({ path: '../../.env' })
const fs = require('fs')
var path = require('path')
var axios = require('axios')

const appArgs2 = process.argv.slice(2)
const fileName = appArgs2[0]

const appArgs3 = process.argv.slice(3)
const dataType = appArgs3[0]

const DBURL = process.env.POF_BACKEND_PRODUCTION

var strapiUrl = ''
var idColumnName = ''

if (dataType == 'activity') {
  strapiUrl = 'activities'
  idColumnName = 'task_guid'
} else {
  strapiUrl = 'activity-groups'
  idColumnName = 'taskgroup_guid'
}

// Fetch all activities from POF
async function fetchActivitiesFromStrapi() {
  try {
    const countRes = await axios.get(`${DBURL}/${strapiUrl}/count?_locale=fi`)
    const activities = await axios.get(
      `${DBURL}/${strapiUrl}?_limit=${countRes.data}`
    )
    return activities.data
  } catch (e) {
    console.log(`Error getting activities: ${e}`)
    return null
  }
}

async function main() {
  const activityidsFromStrapiPromise = fetchActivitiesFromStrapi().then(
    function (activities) {
      return activities
    }
  )

  const activityIdsFromStrapi = await Promise.resolve(
    activityidsFromStrapiPromise
  )

  const activitiesJsonStrapio = activityIdsFromStrapi

  // Read CSV
  const filePath = path.join(fileName)
  let file = fs.readFileSync(filePath, { encoding: 'utf-8' }, function (err) {
    console.log(err)
  })

  // Split on row
  file = file.split('\n')
  // Get first row for column headers
  const headers = file.shift().split(',')
  let json = []
  console.log('Comparing csv file data and pof data')
  file.forEach(function (row) {
    // Loop through each row
    const rowJson = {}
    row = row.split(',')
    for (var i = 0; i < headers.length; i++) {
      rowJson[headers[i]] = row[i]
    }

    // Finf all wp_guid id's
    if (rowJson[idColumnName].length > 7) {
      rowJson[idColumnName]
      for (var j = 0; j < activitiesJsonStrapio.length; j++) {
        // Compare POF activity wp_guid to csv file task_guid id and if it is the same, replace task_guid with the correct id from POF
        if (activitiesJsonStrapio[j].wp_guid == rowJson[idColumnName]) {
          rowJson[idColumnName] = activitiesJsonStrapio[j].id
        }
      }
    }
    json.push(rowJson)
  })
  convertJsonToCsv(json)
}

// Convert corrected datat to csv and write it to file
function convertJsonToCsv(json) {
  console.log('Creating CSV file')

  var fields = Object.keys(json[0])
  var replacer = function (key, value) {
    return value === null ? '' : value
  }
  var csv = json.map(function (row) {
    return fields
      .map(function (fieldName) {
        return JSON.stringify(row[fieldName], replacer)
      })
      .join(',')
  })
  csv.unshift(fields.join(','))
  csv = csv.join('\r\n')

  fs.writeFile(`${strapiUrl}_data_281122.csv`, csv, (err) => {
    if (err) console.error(err)
    else console.log('New csv file created!')
  })
  return csv
}

main()
