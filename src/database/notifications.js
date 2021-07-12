import { db } from './index'

const TABLE_NAME = 'notifications'

export async function createNotification(notification) {
  const {
    itemGuid,
    itemType,
    notificationType,
    userGuid,
    createdBy,
  } = notification
  try {
    const data = await db.one(
      `INSERT INTO ${TABLE_NAME} (item_guid, item_type, notification_type, user_guid, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [itemGuid, itemType, notificationType, userGuid, createdBy]
    )

    const notification = await db.one(
      `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
      data.id
    )

    return notification
  } catch (error) {
    console.log('error', error)
  }
}

export async function markNotificationAsViewed(notificationId) {
  try {
    const data = await db.one(
      `UPDATE ${TABLE_NAME} SET viewed=$1 WHERE id=$2 RETURNING viewed`,
      [true, notificationId]
    )
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export async function markNotificationsAsViewed(userGuid) {
  try {
    const data = await db.any(
      `UPDATE ${TABLE_NAME} SET viewed=$1 WHERE user_guid=$2 AND viewed!=$1`,
      [true, userGuid]
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

const NOTIFICATION_COUNT = 5

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
        `SELECT * FROM ${TABLE_NAME} WHERE user_guid = $1 ORDER BY created_at DESC LIMIT $2`,
        [user_guid.toString(), limit]
      )
      const combined = notifications.concat(viewed)
      return combined.sort((notifA, notifB) => {
        if (notifA.created_at < notifB.created_at) {
          return 1
        }
        if (notifA.created_at > notifB.created_at) {
          return -1
        }
        return 0
      })
    }

    return notifications
  } catch (error) {
    console.log('error', error)
  }
}
