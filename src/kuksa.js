require('dotenv').config()
import request from 'request-promise'
const options = {
  json: true,
  auth: {
    user: process.env.KUKSA_USER,
    pass: process.env.KUKSA_PASS,
  },
}

export async function getMember(memberId) {
  const memberData = await request(
    `${process.env.KUKSA}/members/${memberId}`,
    options
  )
  return memberData
}

export async function getMemberImage(memberId) {
  try {
    const memberImage = await request(
      `${process.env.KUKSA}/members/${memberId}/image`,
      options
    )
    return memberImage
  } catch (e) {
    console.log(`Error getting the member image ${e}`)
    return null
  }
}

export async function getGroupsFromKuksa(memberId) {
  try {
    const groups = await request(
      `${process.env.KUKSA}/members/${memberId}/groups`,
      options
    )
    return groups
  } catch (e) {
    console.log(`Error getting the member's groups ${e}`)
    return null
  }
}

export async function getGroupInfo(memberId, groupId) {
  try {
    const groupInfo = await request(
      `${process.env.KUKSA}/members/${memberId}/groups/${groupId}`,
      options
    )

    return groupInfo
  } catch (e) {
    console.log(`Error getting the group info ${e}`)
    return null
  }
}

export async function getGroupMembers(memberId, groupId) {
  try {
    const groupMembers = await request(
      `${process.env.KUKSA}/members/${memberId}/groups/${groupId}/members`,
      options
    )

    return groupMembers
  } catch (e) {
    console.log(`Error getting the group's members ${e}`)
    return null
  }
}
