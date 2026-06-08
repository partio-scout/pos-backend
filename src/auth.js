const passport = require('passport')
const { Strategy: SamlStrategy } = require('@node-saml/passport-saml')
const {
  fetch: fetchMetadata,
  toPassportConfig,
} = require('passport-saml-metadata')
import axios from 'axios'
import { getGroups } from './groups'

// const issuer = 'https://api.pos-staging.azurewebsites.net/'
const issuer = process.env.ISSUER

const metadataConfig = {
  url: process.env.METADATA_URL,
  timeout: 30000,
}

module.exports.configurePassport = async (clientUrl) => {
  try {
    const reader = await fetchMetadata(metadataConfig)

    const strategyConfig = toPassportConfig(reader)
    Object.assign(strategyConfig, {
      entryPoint: strategyConfig.entryPoint || process.env.ENTRY_POINT,
      issuer,
      callbackUrl: process.env.PARTIOID_CALLBACK,
      logoutUrl: process.env.PARTIOID_LOGOUT_URL + clientUrl,
      // FIXME: Does not work in development environment
      // Because the clientUrl is not configured to partio id as an allowed client logout throws an error
      // Might work if we set the staging env app url here instead of the localhost clientUrl?
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

      try {
        //TODO: Is there a way to not hard code these?
        const url = `${process.env.KUKSA}/members/${profile.membernumber}`
        const restrictedAgeGroups = [4, 5, 6] //sudenpennut, seikkailijat, tarpojat
        const { data: memberData } = await axios.get(url, {
          auth: {
            username: process.env.KUKSA_USER,
            password: process.env.KUKSA_PASS,
          },
        })

        let ageGroup = 4 //Sudenpennut
        if (memberData.age_groupId !== null) {
          ageGroup = memberData.age_groupId
        }
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
