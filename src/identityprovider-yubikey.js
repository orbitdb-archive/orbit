'use strict'

const yub = require('yub')
const Crypto = require('orbit-crypto')
const OrbitUser = require('./orbit-user')
const UserProfile = require('./orbit-user-profile')

class YubikeyIdentityProvider {
  static get id() {
    return 'Yubikey'
  }

  static authorize(ipfs, credentials = {}) {
    if (credentials.provider !== YubikeyIdentityProvider.id)
      throw new Error(`YubikeyIdentityProvider can't handle provider type '${credentials.provider}'`)

    // console.log("Waiting for uPort authorization...")

    let persona, uportProfile, keys, profileData

    const getOrbitSignKey = (username, profile) => {
      console.log("Find the keys...")
      console.log(username, profile)
      const id = profile.identity + "." + username
      return Crypto.getKey(id)
        .then((keyPair) => {
          keys = keyPair
          return Crypto.exportKeyToIpfs(ipfs, keys.publicKey)
        })
    }

    const yubikeyVerify = (otp, clientId, secretKey) => {
      return new Promise((resolve, reject) => {
        console.log("Waiting for authorization...")
        yub.init(clientId, secretKey)
        yub.verifyOffline(otp, (err,data) => {
          if (err) reject(err)
          if (!data.valid) reject(new Error("Invalid OTP"))
          console.log(data);
          if (data.valid) resolve(data)
        })
      })
    }

    return new Promise((resolve, reject) => {
      const otp = credentials.otp
      const username = credentials.username
      const clientId = credentials.clientId
      const secretKey = credentials.secretKey
      let yubikeyProfile
      return yubikeyVerify(otp, clientId, secretKey)
        .then((res) => yubikeyProfile = res)
        .then(() => getOrbitSignKey(username, yubikeyProfile))
        .then((pubKeyHash) => {
          console.log("generate profile data from", yubikeyProfile)
          // profileData = new UserProfile({
          profileData = {
            name: username,
            location: 'Earth',
            image: null,
            signKey: pubKeyHash,
            updated: new Date().getTime(),
            identityProvider: {
              provider: YubikeyIdentityProvider.id,
              id: yubikeyProfile.identity
            }
          }
          console.log(">", profileData)

          return ipfs.object.put(new Buffer(JSON.stringify(profileData)))
            .then((res) => res.toJSON().Hash)
        })
        .then((hash) => {
          console.log("All good, userId is", hash)
          profileData.id = hash
          resolve(new OrbitUser(keys, profileData))
        })
    })
  }

  static load(ipfs, profile = {}) {
    if (profile.identityProvider.provider !== YubikeyIdentityProvider.id)
      throw new Error(`YubikeyIdentityProvider can't handle provider type '${profile.identityProvider.provider}'`)

    return Promise.resolve(profile)
  }
}

module.exports = YubikeyIdentityProvider
