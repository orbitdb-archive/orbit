'use strict'

const Web3 = require('web3')
const Uport = require('uport-lib')
const Persona = require('uport-persona')
const Crypto = require('orbit-crypto')
const OrbitUser = require('./orbit-user')
const UserProfile = require('./orbit-user-profile')

class uPortIdentityProvider {
  static get id() {
    return 'uPort'
  }

  static authorize(ipfs, credentials = {}) {
    if (credentials.provider !== uPortIdentityProvider.id)
      throw new Error(`uPortIdentityProvider can't handle provider type '${credentials.provider}'`)

    // console.log("Waiting for uPort authorization...")
    const web3 = new Web3()
    const uport = new Uport("Orbit")
    const uportProvider = uport.getUportProvider()
    web3.setProvider(uportProvider)

    let persona, uportProfile, keys, profileData

    const getOrbitSignKey = (persona, profile) => {
      console.log("Find the keys...")
      console.log(persona.address, profile)
      const generateNewKey = profile.orbitKey ? false : true
      console.log("Generate new key:", generateNewKey)
      return Crypto.getKey(persona.address, generateNewKey)
        .then((keyPair) => {
          keys = keyPair
          return Crypto.exportKeyToIpfs(ipfs, keys.publicKey)
        })
        .then((pubKeyHash) => {
          return Crypto.exportPrivateKey(keys.privateKey).then((privKey) => {
            console.log("Got keys", keys)
            if (profile.orbitKey && pubKeyHash === profile.orbitKey)
              return Promise.resolve(profile.orbitKey)

            console.log("Need to sign the new key", pubKeyHash)
            return persona.addAttribute({ orbitKey: pubKeyHash }, privKey)
              .then(() => {
                console.log("DONE!")
                return pubKeyHash
              })
          })
        })
    }

    return new Promise((resolve, reject) => {
      console.log("Waiting for authorization...")
      web3.eth.getCoinbase((err, res) => {
        console.log("Authorized!", err, res)

        if (err) reject(err)

        persona = new Persona(res)
        persona.setProviders(ipfs, uportProvider)

        return persona.load()
          .then((res) => uportProfile = persona.getProfile())
          .then(() => getOrbitSignKey(persona, uportProfile))
          .then((pubKeyHash) => {
            console.log("generate profile data from", uportProfile)
            // profileData = new UserProfile({
            profileData = {
              name: uportProfile.name,
              location: uportProfile.residenceCountry,
              image: uportProfile.image && uportProfile.image.length > 0 ? uportProfile.image[0].contentUrl.replace('/ipfs/', '') : null,
              signKey: pubKeyHash,
              updated: new Date().getTime(),
              identityProvider: {
                provider: uPortIdentityProvider.id,
                id: persona.address
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
    })
  }

  static load(ipfs, profile = {}) {
    if (profile.identityProvider.provider !== uPortIdentityProvider.id)
      throw new Error(`uPortIdentityProvider can't handle provider type '${profile.identityProvider.provider}'`)

    const web3 = new Web3()
    const uport = new Uport("Orbit")
    const uportProvider = uport.getUportProvider()
    web3.setProvider(uportProvider)

    let persona
    return new Promise((resolve, reject) => {
      persona = new Persona(profile.identityProvider.id)
      persona.setProviders(null, uportProvider)
      return persona.load()
        .then((res) => persona.getProfile())
        .then((uportProfile) => {
          console.log("Loaded uPort profile", uportProfile)
          // profileData = new UserProfile({
          const profileData = {
            name: uportProfile.name,
            location: uportProfile.residenceCountry,
            image: uportProfile.image && uportProfile.image.length > 0 ? uportProfile.image[0].contentUrl.replace('/ipfs/', '') : null,
            signKey: uportProfile.orbitKey,
            updated: profile.updated,
            identityProvider: {
              provider: uPortIdentityProvider.id,
              id: persona.address
            }
          }
          return resolve(profileData)
      })
    })
  }
}

module.exports = uPortIdentityProvider
