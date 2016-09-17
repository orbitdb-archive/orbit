'use strict'

const Web3 = require('web3')
const Uport = require('uport-lib').Uport
const Persona = require('uport-persona').Persona
const MutablePersona = require('uport-persona').MutablePersona
const Crypto = require('orbit-crypto')
const OrbitUser = require('./orbit-user')

const web3 = new Web3()
const web3Prov = new web3.providers.HttpProvider('https://consensysnet.infura.io:8545')

const ipfsProvider = {
  host: 'ipfs.infura.io',
  port: '5001',
  protocol: 'https',
  root: ''
}

class uPortIdentityProvider {
  static get id() {
    return 'uPort'
  }

  static authorize(ipfs, credentials = {}) {
    if (credentials.provider !== uPortIdentityProvider.id)
      throw new Error(`uPortIdentityProvider can't handle provider type '${credentials.provider}'`)

    // console.log("Waiting for uPort authorization...")
    const uport = new Uport("Orbit", { ipfsProvider: ipfsProvider })
    const uportProvider = uport.getUportProvider()
    web3.setProvider(uportProvider)

    let persona, uportProfile, keys, profileData

    const getOrbitSignKey = (persona, profile) => {
      return Crypto.getKey(persona.address)
        .then((keyPair) => {
          keys = keyPair
          return Crypto.exportKeyToIpfs(ipfs, keys.publicKey)
        })
        .then((pubKeyHash) => {
          return Crypto.exportPrivateKey(keys.privateKey).then((privKey) => {
            console.log("PROFILE", profile)
            
            if (profile.orbitKey && pubKeyHash === profile.orbitKey)
              return Promise.resolve(profile.orbitKey)

            persona.signAttribute({ orbitKey: pubKeyHash }, privKey, persona.address)
            return persona.writeToRegistry()
              .then((tx) => {
                console.log("Got tx hash:", tx)
                return pubKeyHash
              })
          })
        })
    }

    return new Promise((resolve, reject) => {
      web3.eth.getCoinbase((err, res) => {
        if (err) reject(err)

        let persona
        return uport.getUserPersona()
          .then((res) =>{
            persona = res
            uportProfile = persona.getProfile()
            return
          })
          .then(() => getOrbitSignKey(persona, uportProfile))
          .then((pubKeyHash) => {
            profileData = {
              name: uportProfile.name,
              location: uportProfile.location,
              image: uportProfile.image && uportProfile.image.length > 0 ? uportProfile.image[0].contentUrl.replace('/ipfs/', '') : null,
              signKey: pubKeyHash,
              updated: new Date().getTime(),
              identityProvider: {
                provider: uPortIdentityProvider.id,
                id: persona.address
              }
            }

            return ipfs.object.put(new Buffer(JSON.stringify(profileData)))
              .then((res) => res.toJSON().Hash)
        })
        .then((hash) => {
          profileData.id = hash
          resolve(new OrbitUser(keys, profileData))
        })
      })
    })
  }

  static load(ipfs, profile = {}) {
    if (profile.identityProvider.provider !== uPortIdentityProvider.id)
      throw new Error(`uPortIdentityProvider can't handle provider type '${profile.identityProvider.provider}'`)

    const uport = new Uport("Orbit", { ipfsProvider: ipfsProvider })
    let persona = new Persona(profile.identityProvider.id, ipfsProvider, web3.currentProvider)

    return new Promise((resolve, reject) => {
      return persona.load()
        .then((res) => persona.getProfile())
        .then((uportProfile) => {
          console.log("uPort Profile Data", uportProfile)
          const profileData = {
            name: uportProfile.name,
            location: uportProfile.location,
            image: uportProfile.image && uportProfile.image.length > 0 ? uportProfile.image[0].contentUrl.replace('/ipfs/', '') : null,
            signKey: uportProfile.orbitKey || profile.signKey,
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
