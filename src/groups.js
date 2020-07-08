import {
  getMember,
  getGroupLeadersGroups,
  getGroupInfo,
  getGroupMembers,
} from './kuksa'
import { getTaskEntries } from './database'

async function getMemberData(groupMembers) {
  return Promise.all(
    groupMembers.members.map(async groupMember => {
      const allMemberTaskEntries = await getTaskEntries(groupMember.id.id)
      const memberTaskEntries = allMemberTaskEntries.filter(taskEntry => {
        return (
          taskEntry.completion_status === 'ACTIVE' ||
          taskEntry.completion_status === 'COMPLETION_REQUESTED'
        )
      })
      return Object.assign(
        {},
        {
          memberId: groupMember.id.id,
          memberName:
            groupMember.name.firstname + ' ' + groupMember.name.lastname,
          memberTasks: memberTaskEntries,
        }
      )
    })
  )
}

export async function getGroups(userNumber) {
  const member = await getMember(userNumber)
  if (!member.is_leader) {
    throw Error('User is not a group leader').statusCode(403)
  }
  const memberGroups = await getGroupLeadersGroups(userNumber)
  const groupAndMemberData = Promise.all(
    memberGroups.groups.map(async group => {
      const groupInfo = await getGroupInfo(userNumber, group.id)
      const groupMembers = await getGroupMembers(userNumber, group.id)
      const memberData = await getMemberData(groupMembers)
      return Object.assign(
        {},
        {
          id: group.id,
          name: group.name,
          ageGroup: groupInfo.age_groups[0],
          troop: groupInfo.troops.filter(
            troop => troop.id === member.default_troop_id
          ),
          members: memberData,
        }
      )
    })
  )

  return groupAndMemberData
}
