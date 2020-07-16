import {
  getMember,
  getGroupsFromKuksa,
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
          isGroupLeader: groupMember.is_leader,
          memberName:
            groupMember.name.firstname + ' ' + groupMember.name.lastname,
          memberTasks: memberTaskEntries,
        }
      )
    })
  )
}

function filterGroups(userNumber, groupsData) {
  return groupsData.filter(groupData => {
    const groupMember = groupData.members.filter(member => {
      return member.memberId == userNumber
    })
    return groupMember[0].isGroupLeader === true
  })
}

async function getAllGroups(userNumber) {
  const member = await getMember(userNumber)
  const memberGroups = await getGroupsFromKuksa(userNumber)
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

export async function getGroups(userNumber) {
  const allGroups = await getAllGroups(userNumber)
  const filteredGroups = filterGroups(userNumber, allGroups)
  return filteredGroups
}
