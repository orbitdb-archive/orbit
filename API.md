# Orbit API Documentation

***This document is work in progress***

### Table of Contents

- [Getting Started](#getting-started)
- [Constructor](#constructor)
- [Properties](#properties)
  - [user](#user)
  - [network](#network)
  - [channels](#channels)
  - [peers](#peers)
- [Methods](#methods)
  - [connect(username)](#connectusername)
  - [disconnect()](#disconnect)
  - [join(channel)](#joinchannel)
  - [leave(channel)](#leavechannel)
  - [send(channel, message)](#sendchannel-message)
  - [get(channel, [lessThanHash], [greaterThanHash], [amount])](#getchannel-lessthanhash-greaterthanhash-amount)
  - [getPost(hash, [withUserProfile = true])](#getposthash-withuserprofile--true)
  - [getUser(hash)](#getuserhash)
  - [addFile(channel, source)](#addfilechannel-source)
  - [getFile(hash)](#getfilehash)
  - [getDirectory(hash)](#getdirectoryhash)

### Getting Started

Install the module to your project:

```
npm install orbit_
```


And require it in your program:

```javascript
const Orbit = require('orbit_')
```

*Please note that Orbit requires you to pass an instance of IPFS to its constructor. You can create and IPFS instance with [js-ipfs](https://github.com/ipfs/js-ipfs) or [js-ipfs-api](https://github.com/ipfs/js-ipfs-api) or you can use a higher-level wrapper that does everything automatically for you, like [ipfs-daemon](https://github.com/haadcode/ipfs-daemon).*

### Constructor

#### new Orbit(ipfs, options = {})
Create an instance of Orbit.

`ipfs` - An IPFS instance. Either [`js-ipfs`](https://github.com/ipfs/js-ipfs) or [`js-ipfs-api`](https://github.com/ipfs/js-ipfs-api).

`options` - Default options are:
``` 
{
  keystorePath: <path>, // path where to keep keys
  cacheFile: <file>,    // path to orbit-db cache file
  maxHistory: 64        // how many messages to retrieve from history on joining a channel
}
```

**Usage**

```javascript
const orbit = new Orbit(ipfs)
```

### Properties

#### user
Returns the current user.

**Usage**

```javascript
const user = orbit.user
console.log(user.name, user.id)
```

#### network
Returns the network info.

**Usage**

```javascript
const network = orbit.network
console.log(network.name) // 'Orbit DEV Network'
```

#### channels
Returns the channels the user is currently joined on.

#### peers
Returns a list of IPFS swarm peers.

### Methods

#### connect(username)
Connect to a network as `username`.

TODO: return value, thrown errors, example

**Usage**

```javascript
orbit.events.on('connected', (network) => {
  console.log(`Connected to ${network.name} as ${orbit.user.name}`)
})

orbit.connect('Haad')
```

#### disconnect()
Disconnect from the currently connected network.

TODO: return value, thrown errors, example

**Usage**

```javascript
orbit.disconnect()
```

#### join(channel)
Join a `channel`. Upon successfully joining a channel, `events` will emit `'joined'` event.

Returns `true` if joined a channel, `false` if orbit is already joined on the `channel`.

**Usage**

```javascript
orbit.events.on('joined', (channel) => console.log(`Joined #${channel}`))
orbit.join('mychannel')
```

Or

```javascript
orbit.join('mychannel')
  .then((channel) => console.log(`Joined #${channel}`))
```

#### leave(channel)
Leave a `channel`.

TODO: return value, thrown errors, example

```javascript
orbit.leave()
```
#### send(channel, message)
Send a `message` to a `channel`. Channel must be joined first.

TODO: return value, thrown errors, example

```javascript
orbit.events.on('message', (channel, message) => console.log(message))
orbit.send('mychannel', 'hello world')
```

To get the actual content of the message, you need to get the POST from `message.payload.value` with:
```javascript
orbit.getPost(message.payload.value)
    .then((post) => console.log(post))

/*
{
  content: 'hello world',
  ...
}
*/
```

#### get(channel, [lessThanHash], [greaterThanHash], [amount])
Get messages from a channel. Returns a Promise that resolves to an `Array` of messages.

TODO: params, thrown errors, example

#### getPost(hash, [withUserProfile = true])
Get the contents of a message.

If `withUserProfile` is set to false, the `post` will NOT include the user information in `post.meta.from` but rather the id (IPFS hash) of the user. This is the same as calling `getPost` and then calling `getUser` as in the example below.

TODO: params, return value, thrown errors, example

```javascript
orbit.getPost(message.payload.value)
  .then((post) => {
    console.log(`${post.meta.ts} < ${post.meta.from.name}> ${post.content}`)
  })
```

Or

```javascript
orbit.getPost(message.payload.value, false)
  .then((post) => {
    // Get the user info
    orbit.getUser(post.meta.from)
      .then((user) => {
        console.log(`${post.meta.ts} < ${user.name}> ${post.content}`)
      })
  })
```

#### getUser(hash)
Get user profile.

```javascript
orbit.getUser(post.meta.from)
  .then((user) => {
    console.log(`${user.id} - ${user.name}`)
  })
```

#### addFile(channel, source)
Add a file to a `channel`. Source is an object that defines how to add the file.

Returns a *FilePost* object.

Source object:

```javascript
addFile(channel, source) where source is:
{
  // for all files, filename must be specified
  filename: <filepath>,    // add an individual file
  // and optionally use one of these in addition
  directory: <path>,       // add a directory
  buffer: <Buffer>,        // add a file from buffer
  // optional meta data
  meta: <meta data object>
}
```

FilePost:

```javascript
{
  name: 'File1',
  hash: 'Qm...File1',
  size: 123,
  from: 'Qm...Userid',
  meta: { ... }
}
```

Usage:

```javascript
orbit.addFile(channel, { filename: "file1.txt" }) // add single file
orbit.addFile(channel, { filename: "test directory", directory: filePath }) // add directory
orbit.addFile(channel, { filename: "file1.txt", buffer: new Buffer(<file1.txt as Buffer>) }) // add a buffer as file
```

#### getFile(hash)
Get contents of a file from Orbit. Returns a *stream*. Takes a *hash* of the file as an argument.

```javascript
orbit.getFile('Qm...File1')
  .then((stream) => {
    let buf = new Uint8Array(0)
    stream.on('data', (chunk) => {
      const appendBuffer = new Uint8Array(buf.length + chunk.length)
      appendBuffer.set(buf)
      appendBuffer.set(chunk, buf.length)
      buf = appendBuffer
    })
    stream.on('error', () => /* handle error */)
    stream.on('end', () => /* the Stream has finished, no more data */)
  })
  .catch((e) => console.error(e))
```

#### getDirectory(hash)
Returns a directory listing as an `Array`

```javascript
orbit.getDirectory('Qm...Dir1')
  .then((result) => {
    // result is:
    // {
    //   Hash: 'Qm...Dir1,
    //   Size: 18,
    //   Type: ..., // Type === 1 ? "this is a directory" : "this is a file"
    //   Name: 'Dir1'
    // }
  })
```
