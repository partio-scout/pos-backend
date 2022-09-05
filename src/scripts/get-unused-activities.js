require('dotenv').config()
const fs = require('fs')
var path = require('path')
var request = require('request-promise')

const DBURL = process.env.POF_BACKEND_STAGING
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

const sortArraysAscending = (array) => {
  return array.sort(function (a, b) {
    return a - b
  })
}

const uniqueValues = (value, index, self) => {
  return self.indexOf(value) === index
}

function writeUnusedActivitiesToTxtFile(ids) {
  const writeStream = fs.createWriteStream('unusedActivityIds.txt')
  const pathName = writeStream.path

  // write each value of the array on the file breaking line
  ids.forEach((value) => writeStream.write(`${value}\n`))

  writeStream.on('finish', () => {
    console.log(`wrote all the array data to file ${pathName}`)
  })
  writeStream.on('error', (err) => {
    console.error(`There is an error writing the file ${pathName} => ${err}`)
  })
  writeStream.end()
}

async function main() {
  const filePath = path.join(__dirname, './testidata-kompassi.csv')
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
    tmp = {}
    row = row.split(',')
    for (let i = 0; i < headers.length; i++) {
      tmp[headers[i]] = row[i]
    }
    // Add object to list
    json.push(tmp)
  })

  const activityIdsFromKuksa = json.map((row) => {
    return row.activities_Partioaktiviteetti_Yhdistä1_aktiviteetti_View_id
  })

  const uniqueIdValuesInOrder = sortArraysAscending(
    activityIdsFromKuksa.filter(uniqueValues)
  )

  const activityidsFromStrapiPromise = fetchActivitiesFromStrapi().then(
    function (activities) {
      const activitiesJson = JSON.parse(activities)
      const ids = activitiesJson.map((activity) => {
        return activity.id.toString()
      })
      return sortArraysAscending(ids)
    }
  )

  const activityIdsFromStrapi = await Promise.resolve(
    activityidsFromStrapiPromise
  )

  const oldIdsFromKuksa = uniqueIdValuesInOrder.filter(
    (x) => !activityIdsFromStrapi.includes(x)
  )

  if (oldIdsFromKuksa.length) {
    writeUnusedActivitiesToTxtFile(oldIdsFromKuksa)
  } else {
    console.log('No old ids')
  }
  return result
}

main()
