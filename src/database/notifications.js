import { db } from './index'

const TABLE_NAME = 'notifications'

export async function createNotification(notificationData) {
  const {
    itemGuid,
    itemType,
    notificationType,
    userGuid,
    createdBy,
    groupLeaderName,
  } = notificationData
  try {
    // Check if the notification already exists and return it if it does
    const notificationQuery = `SELECT * FROM ${TABLE_NAME} WHERE item_guid = $1 AND notification_type = $2 AND user_guid = $3`
    const notificationParams = [
      itemGuid.toString(),
      notificationType,
      userGuid.toString(),
    ]
    let notification = await db.oneOrNone(notificationQuery, notificationParams)

    if (!notification) {
      // The notification doesn't exist so we create it
      const data = await db.one(
        `INSERT INTO ${TABLE_NAME} (item_guid, item_type, notification_type, user_guid, created_by, group_leader_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          itemGuid,
          itemType,
          notificationType,
          userGuid,
          createdBy,
          groupLeaderName,
        ]
      )

      // Fetch the created notification
      notification = await db.one(
        `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
        data.id
      )
    }

    // Return the notification
    return notification
  } catch (error) {
    console.log('Error in notification creation: ', error)
  }
}

export async function markNotificationAsViewed(notificationId) {
  try {
    const data = await db.any(
      `UPDATE ${TABLE_NAME} SET viewed=$1, viewed_at=$3 WHERE id=$2 AND viewed!=$1 RETURNING viewed`,
      [true, notificationId, new Date()]
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function markNotificationsAsViewed(userGuid) {
  try {
    const data = await db.any(
      `UPDATE ${TABLE_NAME} SET viewed=$1, viewed_at=$3 WHERE user_guid=$2 AND viewed!=$1`,
      [true, userGuid, new Date()]
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function getNotification(notificationId) {
  try {
    const notification = await db.one(
      `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
      [notificationId]
    )

    return notification
  } catch (error) {
    console.log('error', error)
  }
}

const NOTIFICATION_COUNT = 200

export async function getUserNotifications(user_guid) {
  try {
    const notifications = await db.any(
      `SELECT * FROM ${TABLE_NAME} WHERE user_guid = $1 AND viewed = $2 ORDER BY created_at DESC`,
      [user_guid, false]
    )

    if (!notifications || !notifications.length) {
      return db.any(
        `SELECT * FROM ${TABLE_NAME} WHERE user_guid = $1 ORDER BY created_at DESC LIMIT $2`,
        [user_guid.toString(), NOTIFICATION_COUNT]
      )
    }

    if (notifications.length < NOTIFICATION_COUNT) {
      const limit = NOTIFICATION_COUNT - notifications.length
      const viewed = await db.any(
        `SELECT * FROM ${TABLE_NAME} WHERE user_guid = $1 AND viewed = $2 ORDER BY created_at DESC LIMIT $3`,
        [user_guid.toString(), true, limit]
      )
      const combined = notifications.concat(viewed)
      return combined
      // return combined.sort((notifA, notifB) => {
      //   if (notifA.created_at < notifB.created_at) {
      //     return 1
      //   }
      //   if (notifA.created_at > notifB.created_at) {
      //     return -1
      //   }
      //   return 0
      // })
    }

    return notifications
  } catch (error) {
    console.log('error', error)
  }
}

export async function deleteOldNotifications() {
  try {
    const data = await db.any(
      `DELETE FROM ${TABLE_NAME} WHERE viewed_at < NOW() - INTERVAL '30 days'`,
      []
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}
