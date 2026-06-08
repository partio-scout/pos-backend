require('dotenv').config()
const fs = require('fs')
var path = require('path')
var axios = require('axios')

const DBURL = process.env.POF_BACKEND_STAGING
async function fetchActivitiesFromStrapi() {
  try {
    const { data: countRes } = await axios.get(
      `${DBURL}/activities/count?_locale=fi`
    )
    const { data: activities } = await axios.get(
      `${DBURL}/activities?_limit=${countRes}`
    )

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
  // Change filename below to match the csv-file with migration activities
  const filePath = path.join(__dirname, './aktiviteetti_aa.csv')
  // Read CSV
  let file = fs.readFileSync(filePath, { encoding: 'utf-8' }, function (err) {
    console.log(err)
  })

  // Split on row
  file = file.split('\n')

  // Get first row for column headers
  let headers = file.shift().split(',')

  let json = []
  file.forEach(function (row) {
    // Loop through each row
    let tmp = {}
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
      if (!activities || !Array.isArray(activities)) {
        console.log('No activities returned from Strapi')
        return []
      }

      const ids = activities.map((activity) => {
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
    return oldIdsFromKuksa
  } else {
    console.log('No old ids')
  }
}

main()
module.exports = { main }
