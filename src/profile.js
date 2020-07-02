import fs from 'fs'
import jpeg from 'jpeg-js'

export async function getProfile(userNumber) {
  const imageData = fs.readFileSync('./src/assets/profile.jpg')
  const rawImageData = jpeg.decode(imageData)
  //TODO: get user data from Kuksa
  console.log(userNumber)
  const profile = Object.assign(
    {},
    {
      name: 'Testi Profiili',
      defaultTroopId: 9999613,
      ageGroupId: 8,
      ageGroup: 'Vaeltajat (18–22-v)',
      language: 'fi',
      troops: [
        {
          id: 9999613,
          name: 'Hervannan Hukat ry',
        },
        {
          id: 9999615,
          name: 'Hervannan Sukat ry',
        },
      ],
      isLeader: true,
      image: {
        name: 'profile.jpg',
        image: rawImageData,
        width: 400,
        height: 400,
      },
      //TODO: get these from database
      favourites: [
        '7d8cfea49ab79ebe14837df62fd7520d',
        'dea6da7d4ed82623d271c331b894bc39',
      ],
      ongoing: [
        '7c4808125350871d3435d2ed6a84f6be',
        '5a986c459d5e0a360f83b9bdfc2f7c96',
      ],
      //TODO: somewhere else, when task is approved, it must be checked if that completes the whole taskgroup
      //TODO: when a whole taskgroup gets achieved, it must be checked if the whole agegroup is completed
      achieved: [
        '5c10027b5872c28e2ad191554d5d03c1', // type=task
        '42f16dfd80cc6195da2a820f3b139d2d', // type=taskgroup this is a complete taskgroup
        '053fa231362e95cb211c5eb85c3cbedb', // type=agegroup this is a complete agegroup
      ],
    }
  )

  return profile
}
