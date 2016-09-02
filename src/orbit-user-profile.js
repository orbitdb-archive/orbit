'use strict'

class OrbitUserProfile {
  constructor(profile) {
    this.name = profile.name
    this.location = profile.location || 'Earth'
    this.image = profile.image
    this.signKey = profile.signKey
    this.updated = profile.updated
    this.identityProvider = {
      provider: profile.identityProvider ? profile.identityProvider.provider : null,
      id: profile.identityProvider ? profile.identityProvider.id : null
    }
  }
}

module.exports = OrbitUserProfile
