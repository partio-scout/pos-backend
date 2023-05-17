import { db } from './index'
import { createNotification } from './notifications'

export async function postAgegroupEntry(ageGroupEntry) {
  const { user_guid, created_by, agegroup_guid, completed, group_leader_name } =
    ageGroupEntry

  try {
    const old_agegroup_entries = await db.any(
      'SELECT * FROM completed_agegroup_entries WHERE agegroup_guid = $1 AND user_guid = $2',
      [agegroup_guid, user_guid.toString()]
    )

    if (old_agegroup_entries?.length) {
      return console.log('SKIP')
    }

    // Create an entry for the agegroup entry state change
    const data = await db.one(
      'INSERT INTO completed_agegroup_entries(user_guid, created_by, agegroup_guid, completion_status) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_guid, created_by, agegroup_guid, completed]
    )

    const entry = await db.one(
      'SELECT agegroup_guid, completion_status FROM completed_agegroup_entries WHERE id = $1',
      data.id
    )

    // Create a notification about the deleted item
    const notification = await createNotification({
      itemGuid: agegroup_guid,
      itemType: 'AGE_GROUP',
      notificationType: completed,
      userGuid: user_guid,
      createdBy: created_by,
      groupLeaderName: group_leader_name,
    })
    if (!notification) {
      throw new Error('Failed to create a notification.')
    }

    return entry
  } catch (error) {
    console.error('post agegroup entry - error: ', error)
  }
}

export async function deleteAgeGroupEntry(ageGroupEntry) {
  const { user_guid, created_by, agegroup_guid, completed, group_leader_name } =
    ageGroupEntry
  try {
    // Create a notification about the state change
    const notification = await createNotification({
      itemGuid: agegroup_guid,
      itemType: 'AGE_GROUP',
      notificationType: completed,
      userGuid: user_guid,
      createdBy: created_by,
      groupLeaderName: group_leader_name,
    })
    if (!notification) {
      throw new Error('Failed to create a notification.')
    }

    const data = await db.result(
      'DELETE FROM completed_agegroup_entries WHERE user_guid = $1 AND agegroup_guid = $2',
      [user_guid.toString(), agegroup_guid]
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function getAgeGroupEntries(user_guid) {
  try {
    const data = await db.any(
      'SELECT agegroup_guid, completion_status FROM completed_agegroup_entries WHERE user_guid = $1 ORDER BY created_at ASC',
      user_guid.toString()
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}
