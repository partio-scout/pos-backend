require('dotenv').config()
import axios from 'axios'
const options = {
  auth: {
    username: process.env.KUKSA_USER,
    password: process.env.KUKSA_PASS,
  },
}

export async function getMember(memberId) {
  const { data } = await axios.get(
    `${process.env.KUKSA}/members/${memberId}`,
    options
  )
  return data
}

export async function getMemberImage(memberId) {
  try {
    const { data } = await axios.get(
      `${process.env.KUKSA}/members/${memberId}/image`,
      options
    )
    return data
  } catch (e) {
    console.log(`Error getting the member image ${e}`)
    return null
  }
}

export async function getGroupsFromKuksa(memberId) {
  try {
    const { data } = await axios.get(
      `${process.env.KUKSA}/members/${memberId}/groups`,
      options
    )
    return data
  } catch (e) {
    console.log(`Error getting the member's groups ${e}`)
    return null
  }
}

export async function getGroupInfo(memberId, groupId) {
  try {
    const { data } = await axios.get(
      `${process.env.KUKSA}/members/${memberId}/groups/${groupId}`,
      options
    )

    return data
  } catch (e) {
    console.log(`Error getting the group info ${e}`)
    return null
  }
}

export async function getGroupMembers(memberId, groupId) {
  try {
    const { data } = await axios.get(
      `${process.env.KUKSA}/members/${memberId}/groups/${groupId}/members`,
      options
    )

    return data
  } catch (e) {
    console.log(`Error getting the group's members ${e}`)
    return null
  }
}
