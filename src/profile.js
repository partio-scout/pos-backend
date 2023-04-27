import { getMember, getMemberImage } from './kuksa'

export async function getProfile(userNumber) {
  const member = await getMember(userNumber)
  const memberImage = await getMemberImage(userNumber)

  const profile = Object.assign(
    {},
    {
      name: `${member.name.firstname} ${member.name.lastname}`,
      defaultTroopId: member.defaul_troop_id,
      ageGroupId: member.age_roupId || 4,
      ageGroup: member.age_group || 'Sudenpennut',
      language: 'fi',
      troops: member.troops,
      isLeader: member.isLeader || false,
      image: memberImage,
    }
  )

  console.log('PROFILE: ', profile)
  return profile
}
