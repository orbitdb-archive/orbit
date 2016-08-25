'use strict'

const OrbitIdentifyProvider = require('./identityprovider-orbit')
const uPortIdentifyProvider = require('./identityprovider-uport')

const enabledProviders = [
  OrbitIdentifyProvider,
  uPortIdentifyProvider,
]

let identityProviders = {}
enabledProviders.forEach((p) => {
  identityProviders[p.id] = p
  // console.log("Added Identity Provider:", p.id)
})

class IdentityProviders {
  static authorizeUser(ipfs, credentials = {}) {
    if (!credentials.provider) throw new Error("'provider' not specified")
    const provider = identityProviders[credentials.provider]
    if (!provider) throw new Error(`Provider '${credentials.provider}' not found`)
    return provider.authorize(ipfs, credentials)
  }

  static loadProfile(ipfs, profile = {}) {
    if (!profile.identityProvider) throw new Error(`'identityProvider' not specified`)
    if (!profile.identityProvider.provider) throw new Error(`'provider' not specified`)
    const provider = identityProviders[profile.identityProvider.provider]
    if (!provider) throw new Error(`Provider '${profile.identityProvider.provider}' not found`)
    return provider.load(ipfs, profile)
  }
}

module.exports = IdentityProviders
