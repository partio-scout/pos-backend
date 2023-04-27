import { getMember, getMemberImage } from './kuksa'

export async function getProfile(userNumber) {
  const member = await getMember(userNumber)
  const memberImage = await getMemberImage(userNumber)

  const profile = Object.assign(
    {},
    {
      name: `${member.name.firstname} ${member.name.lastname}`,
      defaultTroopId: member.defaultTroopId,
      ageGroupId: member.ageGroupId || 35,
      ageGroup: member.ageGroup || 'Sudenpennut',
      language: 'fi',
      troops: member.troops,
      isLeader: member.isLeader || false,
      image: memberImage,
    }
  )

  return profile
}
