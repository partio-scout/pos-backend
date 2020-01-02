const passport = require('passport')
const metadata = require('passport-saml-metadata')
const SamlStrategy = require('passport-saml').Strategy

const issuer = 'https://api.pos-staging.azurewebsites.net/'

const metadataConfig = {
  url: 'https://partioid-test.partio.fi/simplesaml/saml2/idp/metadata.php',
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
      callbackUrl: 'http://localhost:4000/login/callback',
    })

    const samlStrategy = new SamlStrategy(strategyConfig, function(
      profile,
      done
    ) {
      console.log('profile:', profile)
      return done(null, profile)
    })

    passport.use('saml', samlStrategy)

    passport.serializeUser((user, done) => {
      console.log('serializeUser:', user)
      done(null, user)
    })

    passport.deserializeUser((user, done) => {
      console.log('deserializeUser:', user)
      done(null, user)
    })

    console.log(strategyConfig)

    return samlStrategy
  } catch (e) {
    console.error('Failed to fetch SAML metadata', e)
  }
}
