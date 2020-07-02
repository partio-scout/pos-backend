import { getFavouriteTasks, getTaskEntries } from './database'
import { getMember, getMemberImage } from './kuksa'

export async function getProfile(userNumber) {
  const member = await getMember(userNumber)
  const memberImage = await getMemberImage(userNumber)
  const favourites = await getFavouriteTasks(userNumber)
  const favouriteIds = favourites.map(task => {
    return task.task_guid
  })
  const tasks = await getTaskEntries(userNumber)
  const ongoing = tasks
    .filter(task => {
      return (
        task.completion_status === 'ACTIVE' ||
        task.completion_status === 'COMPLETION_REQUESTED'
      )
    })
    .map(ongoingTask => {
      return ongoingTask.task_guid
    })
  const achieved = tasks
    .filter(task => {
      return task.completion_status === 'COMPLETED'
    })
    .map(achievedTask => {
      return achievedTask.task_guid
    })

  const profile = Object.assign(
    {},
    {
      name: `${member.name.firstname} ${member.name.lastname}`,
      defaultTroopId: member.default_troop_id,
      ageGroupId: member.age_groupId || 4,
      ageGroup: member.age_group || 'Sudenpennut',
      language: 'fi',
      troops: member.troops,
      isLeader: member.is_leader || false,
      image: memberImage,
      favourites: favouriteIds,
      ongoing: ongoing,
      //TODO: somewhere else, when task is approved, it must be checked if that completes the whole taskgroup
      //TODO: when a whole taskgroup gets achieved, it must be checked if the whole agegroup is completed
      achieved: achieved,
    }
  )

  return profile
}
