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
    // Fetch first page to discover pagination info
    const { data: firstJson } = await axios.get(`${DBURL}/${strapiUrl}`)

    // Helper to extract items from various Strapi response shapes and flatten v4 "data/attributes"
    const extractItems = (json) => {
      if (!json) return []
      if (Array.isArray(json)) return json
      if (json.data && Array.isArray(json.data)) {
        return json.data.map((d) =>
          d && d.id && d.attributes
            ? Object.assign({ id: d.id }, d.attributes)
            : d
        )
      }
      // look for any array on the top level (fallback)
      for (const k of Object.keys(json)) {
        if (Array.isArray(json[k])) return json[k]
      }
      return []
    }

    const items = extractItems(firstJson)

    // Determine pagination info if available
    const pagination =
      (firstJson.meta && firstJson.meta.pagination) ||
      (firstJson.pagination && firstJson.pagination) ||
      null

    if (!pagination || pagination.pageCount <= 1) {
      // single page or no pagination info — return what we have
      return items
    }

    const pageCount = pagination.pageCount || 1
    const pageSize = pagination.pageSize || pagination.limit || 0

    // Fetch remaining pages (start from 2 because we already fetched page 1)
    for (let p = 2; p <= pageCount; p++) {
      try {
        // try Strapi v4 style first
        const { data: pageJson } = await axios.get(
          `${DBURL}/${strapiUrl}?pagination[page]=${p}&pagination[pageSize]=${pageSize}`
        )
        items.push(...extractItems(pageJson))
      } catch (err) {
        try {
          // fallback to a generic page query
          const { data: pageJson2 } = await axios.get(
            `${DBURL}/${strapiUrl}?page=${p}&pageSize=${pageSize}`
          )
          items.push(...extractItems(pageJson2))
        } catch (err2) {
          console.log(`Error fetching page ${p}: ${err2}`)
        }
      }
    }

    return items
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
    if (rowJson[idColumnName].length > 7) {
      rowJson[idColumnName]
      for (var i = 0; i < activitiesJsonStrapio.length; i++) {
        // Compare POF activity wp_guid to csv file task_guid id and if it is the same, replace task_guid with the correct id from POF
        if (activitiesJsonStrapio[i].wp_guid == rowJson[idColumnName]) {
          rowJson[idColumnName] = activitiesJsonStrapio[i].id
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
