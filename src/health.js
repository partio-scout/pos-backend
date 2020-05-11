import { getTables } from './database'

export async function getHealth(res) {
  try {
    const myTables = ['task_entries', 'favourite_tasks']

    let tables = await getTables()
    tables = tables.map(table => {
      return table['table_name']
    })
    if (myTables.every(table => tables.includes(table))) {
      res.status(200).send('Database is healthy')
    } else {
      res.status(500).send('No tables found')
    }
  } catch (e) {
    console.log(e)
    res.status(500).send('Database error')
  }
}
