'use strict'

const Crypto = require('orbit-crypto')
const OrbitUser = require('./orbit-user')
const UserProfile = require('./orbit-user-profile')

class OrbitIdentityProvider {
  static get id() {
    return 'orbit'
  }

  static authorize(ipfs, credentials = {}) {
    if (credentials.provider !== OrbitIdentityProvider.id)
      throw new Error(`OrbitIdentityProvider can't handle provider type '${credentials.provider}'`)

    if (!credentials.username) throw new Error("'username' not specified")

    let keys, profileData
    return Crypto.getKey(credentials.username)
      .then((keyPair) => {
        keys = keyPair
        return Crypto.exportKeyToIpfs(ipfs, keys.publicKey)
      })
      .then((pubKeyHash) => {
        profileData = new UserProfile({
          name: credentials.username,
          location: 'Earth',
          image: null,
          signKey: pubKeyHash,
          updated: null,
          identityProvider: {
            provider: OrbitIdentityProvider.id,
            id: null
          }
        })
        // profileData = {
        //   name: credentials.username,
        //   location: 'Earth',
        //   image: null,
        //   signKey: pubKeyHash,
        //   updated: null,
        //   identityProvider: {
        //     provider: OrbitIdentityProvider.id,
        //     id: null
        //   }
        // }
        return ipfs.object.put(new Buffer(JSON.stringify(profileData)))
          .then((res) => res.toJSON().Hash)
      })
      .then((hash) => {
        profileData.id = hash
        return new OrbitUser(keys, profileData)
      })
  }

  static load(ipfs, profile = {}) {
    if (profile.identityProvider.provider !== OrbitIdentityProvider.id)
      throw new Error(`OrbitIdentityProvider can't handle provider type '${profile.identityProvider.provider}'`)

    return Promise.resolve(profile)
  }
}

module.exports = OrbitIdentityProvider
