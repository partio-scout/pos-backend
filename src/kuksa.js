require('dotenv').config()
import request from 'request-promise'

export async function getMember(memberId) {
  const memberData = await request(`${process.env.KUKSA}/members/${memberId}`, {
    json: true,
    auth: {
      user: process.env.KUKSA_USER,
      pass: process.env.KUKSA_PASS,
    },
  })
  return memberData
}

export async function getMemberImage(memberId) {
  try {
    const memberImage = await request(
      `${process.env.KUKSA}/members/${memberId}/image`,
      {
        json: true,
        auth: {
          user: process.env.KUKSA_USER,
          pass: process.env.KUKSA_PASS,
        },
      }
    )
    return memberImage
  } catch (e) {
    console.log(`Error getting the member image ${e}`)
    return null
  }
}
