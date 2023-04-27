import { getMember, getMemberImage } from './kuksa'

export async function getProfile(userNumber) {
  const member = await getMember(userNumber)
  const memberImage = await getMemberImage(userNumber)

  const profile = Object.assign(
    {},
    {
      name: `${member.name.firstname} ${member.name.lastname}`,
      defaultTroopId: member.default_troop_id,
      ageGroupId: member.age_groupId || 35,
      ageGroup: member.age_group || 'Sudenpennut',
      language: 'fi',
      troops: member.troops,
      isLeader: member.isLeader || false,
      image: memberImage,
    }
  )

  return profile
}
