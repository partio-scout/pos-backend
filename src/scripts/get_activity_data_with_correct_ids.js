// Run script with command: node get_activity_data_with_correct_ids.js FILEPATH

require('dotenv').config({ path: '../../.env' })
const fs = require('fs')
var path = require('path')
var request = require('request-promise')

const appArgs = process.argv.slice(2)
const fileName = appArgs[0]
// const DBURL = process.env.POF_BACKEND_STAGING
const DBURL = process.env.POF_BACKEND_PRODUCTION

// Fetch all activities from POF
async function fetchActivitiesFromStrapi() {
  try {
    const countRes = await request(`${DBURL}/activities/count?_locale=fi`)
    const activities = await request(`${DBURL}/activities?_limit=${countRes}`)
    return activities
  } catch (e) {
    console.log(`Error getting activities: ${e}`)
    return null
  }
}

async function main() {
  const activityidsFromStrapiPromise = fetchActivitiesFromStrapi().then(
    function (activities) {
      const activitiesJson = JSON.parse(activities)
      return activitiesJson
    }
  )

  const activityIdsFromStrapi = await Promise.resolve(
    activityidsFromStrapiPromise
  )

  const activitiesJsonStrapio = activityIdsFromStrapi
  console.log('Activities retrieved from pof')

  // Read CSV
  const filePath = path.join(fileName)
  let file = fs.readFileSync(filePath, { encoding: 'utf-8' }, function (err) {
    console.log(err)
  })

  // Split on row
  file = file.split('\n')
  // Get first row for column headers
  headers = file.shift().split(',')
  let json = []
  console.log('Comparing csv file data and pof data')
  file.forEach(function (row) {
    // Loop through each row
    rowJson = {}
    row = row.split(',')
    for (var i = 0; i < headers.length; i++) {
      rowJson[headers[i]] = row[i]
    }

    // Finf all wp_guid id's
    if (rowJson.task_guid.length > 7) {
      rowJson.task_guid
      for (var i = 0; i < activitiesJsonStrapio.length; i++) {
        // Compare POF activity wp_guid to csv file task_guid id and if it is the same, replace task_guid with the correct id from POF
        if (activitiesJsonStrapio[i].wp_guid == rowJson.task_guid) {
          rowJson.task_guid = activitiesJsonStrapio[i].id
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

  fs.writeFile('activity_data_11_22.csv', csv, (err) => {
    if (err) console.error(err)
    else console.log('New csv file created!')
  })
  return csv
}

main()
