import {
  getMember,
  getGroupsFromKuksa,
  getGroupInfo,
  getGroupMembers,
} from './kuksa'
import { getTaskEntries, getTaskGroupEntries } from './database'

async function getMemberData(groupMembers) {
  return Promise.all(
    groupMembers.members.map(async (groupMember) => {
      const allMemberTaskEntries = await getTaskEntries(groupMember.id.id)
      const allMemberTaskGroupEntries = await getTaskGroupEntries(
        groupMember.id.id
      )
      const taskEntries = allMemberTaskEntries.reduce((acc, task) => {
        acc[task.task_guid] = task.completion_status
        return acc
      }, {})
      const taskgroupEntries = allMemberTaskGroupEntries.reduce(
        (acc, taskGroup) => {
          acc[taskGroup.taskgroup_guid] = taskGroup.completed
          return acc
        },
        {}
      )
      return Object.assign(
        {},
        {
          memberId: groupMember.id.id,
          isGroupLeader: groupMember.isLeader,
          memberName:
            groupMember.name.firstname + ' ' + groupMember.name.lastname,
          memberTasks: taskEntries,
          memberTaskGroups: taskgroupEntries,
        }
      )
    })
  ).catch((error) => {
    console.log('Failed to get member data: ', error)
  })
}

function filterGroups(userNumber, groupsData) {
  return groupsData.filter((groupData) => {
    const groupMember = groupData.members.find((member) => {
      return member.memberId == userNumber
    })
    return groupMember ? groupMember.isGroupLeader : false
  })
}

async function getAllGroups(userNumber) {
  const member = await getMember(userNumber)
  const memberGroups = await getGroupsFromKuksa(userNumber)
  const groupAndMemberData = Promise.all(
    memberGroups.groups.map(async (group) => {
      const groupInfo = await getGroupInfo(userNumber, group.id)
      const groupMembers = await getGroupMembers(userNumber, group.id)
      const memberData = await getMemberData(groupMembers)
      const ageGroupId =
        (memberData[0] &&
          (await getMember(memberData[0].memberId)).ageGroupId) ||
        4
      return Object.assign(
        {},
        {
          id: group.id,
          name: group.name,
          ageGroup: groupInfo.ageGroups[0],
          ageGroupId,
          troop: groupInfo.troops.filter(
            (troop) => troop.id === member.defaultTroopId
          ),
          members: memberData,
        }
      )
    })
  ).catch((error) => {
    console.log('Failed to get groupAndMemberData: ', error)
  })

  return groupAndMemberData
}

export async function getGroups(userNumber) {
  try {
    const allGroups = await getAllGroups(userNumber)
    const filteredGroups = filterGroups(userNumber, allGroups)
    return filteredGroups || []
  } catch (error) {
    console.log('Get groups failed with error: ', error)
  }
}
