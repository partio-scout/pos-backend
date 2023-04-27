const passport = require('passport')
const metadata = require('passport-saml-metadata')
const SamlStrategy = require('passport-saml').Strategy
import request from 'request-promise'
import { getGroups } from './groups'

// const issuer = 'https://api.pos-staging.azurewebsites.net/'
const issuer = process.env.ISSUER

const metadataConfig = {
  url: process.env.METADATA_URL,
  timeout: 30000,
}

module.exports.configurePassport = async (clientUrl) => {
  try {
    const reader = await metadata.fetch(metadataConfig)

    const strategyConfig = metadata.toPassportConfig(reader)
    Object.assign(strategyConfig, {
      realm: issuer,
      issuer,
      protocol: 'samlp',
      callbackUrl: process.env.PARTIOID_CALLBACK,
      logoutCallbackUrl: process.env.PARTIOID_LOGOUT_CALLBACK,
      // FIXME: Does not work in development environment
      // Because the clientUrl is not configured to partio id as an allowed client logout throws an error
      // Might work if we set the staging env app url here instead of the localhost clientUrl?
      logoutUrl: process.env.PARTIOID_LOGOUT_URL + clientUrl,
    })

    const samlStrategy = new SamlStrategy(strategyConfig, async function (
      profile,
      done
    ) {
      const scout = {
        firstname: profile.firstname,
        lastname: profile.lastname,
        membernumber: profile.membernumber,
      }
      console.log('Logging in - profile: ', profile)

      try {
        //TODO: Is there a way to not hard code these?
        const restrictedAgeGroups = [35, 21, 13] //sudenpennut, seikkailijat, tarpojat
        const memberData = await request(
          `${process.env.KUKSA}/members/${profile.membernumber}`,
          {
            json: true,
            auth: {
              user: process.env.KUKSA_USER,
              pass: process.env.KUKSA_PASS,
            },
          }
        )
        console.log('membeData: ', memberData)
        console.log('memberData.ageGroupId: ', memberData.ageGroupId)

        let ageGroup = 35 //Sudenpennut
        if (memberData.ageGroupId !== null) {
          ageGroup = memberData.ageGroupId
        }
        console.log('ageGroupId: ', ageGroup)
        scout.canMarkDone = !restrictedAgeGroups.includes(ageGroup)
      } catch (error) {
        console.log(error.name, error.message)
        scout.canMarkDone = false
      }

      return done(null, scout)
    })

    passport.use('saml', samlStrategy)

    passport.serializeUser((user, done) => {
      done(null, user)
    })

    passport.deserializeUser((user, done) => {
      done(null, user)
    })

    // console.log(strategyConfig)

    return samlStrategy
  } catch (e) {
    console.error('Failed to fetch SAML metadata', e)
  }
}

export const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }

  res.status(401).send('Unauthorized')
}

export const isGroupLeader = async (req, res, next) => {
  const userId = req.user.membernumber
  const groups = await getGroups(userId)
  if (groups && groups.length) {
    return next()
  }

  res.status(403).send('Permission denied')
}
