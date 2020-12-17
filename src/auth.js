const passport = require('passport')
const metadata = require('passport-saml-metadata')
const SamlStrategy = require('passport-saml').Strategy
import request from 'request-promise'

// const issuer = 'https://api.pos-staging.azurewebsites.net/'
const issuer = process.env.ISSUER

const metadataConfig = {
  url: process.env.METADATA_URL,
  timeout: 30000,
}

module.exports.configurePassport = async () => {
  try {
    const reader = await metadata.fetch(metadataConfig)

    const strategyConfig = metadata.toPassportConfig(reader)
    Object.assign(strategyConfig, {
      realm: issuer,
      issuer,
      protocol: 'samlp',
      callbackUrl: process.env.PARTIOID_CALLBACK,
    })

    const samlStrategy = new SamlStrategy(strategyConfig, async function(
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
        const restrictedAgeGroups = [4, 5, 6] //sudenpennut, seikkailijat, tarpojat
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

export const isGroupLeader = (req, res, next) => {
  if (req.user) {
    // TODO: check if the user is a group leader
    return next()
  }

  res.status(403).send('Permission denied')
}
