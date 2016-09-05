'use strict'

const ipfsd = require('ipfsd-ctl')
const Orbit = require('../Orbit')

/*
  Usage:
  node index.js <botname> <channel>

  Eg.
  node index.js Cacher1 ipfs
*/

// Options
let user = process.argv[2] || 'anonymous' + new Date().getTime().toString().split('').splice(-4, 4).join('')
let channel = process.argv[3] || 'ipfs'

// State
let orbit, ipfs

function formatTimestamp(timestamp) {
  const safeTime = (time) => ("0" + time).slice(-2)
  const date = new Date(timestamp)
  return safeTime(date.getHours()) + ":" + safeTime(date.getMinutes()) + ":" + safeTime(date.getSeconds())
}

// Start
ipfsd.local((err, ipfsDaemon) => {
  if(err) {
    console.error(err)
    process.exit(1)
  }

  ipfsDaemon.startDaemon((err, ipfs) => {
    orbit = new Orbit(ipfs)

    orbit.events.on('connected', (network) => {
      console.log(`-!- Connected to ${network.name} at ${network.publishers[0]}`)
      orbit.join(channel)
    })

    orbit.events.on('joined', (channel) => {
      orbit.send(channel, "/me is now caching this channel")
      console.log(`-!- Joined #${channel}`)
    })

    orbit.events.on('message', (channel, message) => {
      // Get the actual content of the message
      orbit.getPost(message.payload.value)
        .then((post) => {
          // Get the user info
          orbit.getUser(post.meta.from)
            .then((user) => {
              console.log(`${formatTimestamp(post.meta.ts)} < ${user.name}> ${post.content}`)
            })
        })
    })

    // Connect to Orbit DEV network
    orbit.connect('178.62.241.75:3333', user)
      .catch((e) => logger.error(e))
  })
})
