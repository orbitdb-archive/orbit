# Orbit js-ipfs demo branch

## Run

1. Open `client/dist/index.html` in your browser *(Chrome recommended)*
2. Done

## Development
### Requirements 

* Node.js v4.x.x 
* npm v3.x.x

*If you don't have npm v3.x installed, you can install it from npm with `npm install npm3 -g` and run the npm commands described in this document with `npm3` instead of `npm`.*

### Installation
```
git clone -b js-ipfs https://github.com/haadcode/orbit
cd orbit/
npm install
```

### Run
```
cd client/
npm install
npm run dev
```

### Test
```
cd client/
npm install
npm test
```

### Build
```
cd client/
npm install
npm run build
```

This will update the files in `dist/`.

### Publish

**In order to publish, you must have ipfs daemon running locally**

```
cd client/
npm run publish
```

### Orbit API

#### connect(url, username, password)
Connect to a network. `url` should be given as a string in the form of `host:port`.

TODO: return value, thrown errors, example

#### disconnect()
Disconnect from the currently connected network.

TODO: return value, thrown errors, example

#### join(channel)
Join a `channel`.

TODO: return value, thrown errors, example

#### leave(channel)
Leave a `channel`.

TODO: return value, thrown errors, example

#### send(channel, message)
Send a `message` to a `channel`. Channel must be joined first.

TODO: return value, thrown errors, example

#### get(channel, lessThanHash, greaterThanHash, amount)
Get messages from a channel. Returns an `Array` of messages.

TODO: params, thrown errors

#### getPost(hash)
Get the contents of a message.

TODO: params, return value, thrown errors, example

#### addFile(channel, filePath || buffer)
Add a file to a `channel`. 

TODO: params, return value, thrown errors, example

#### getFile(hash)
Returns contents of a file from IPFS.

TODO: params, return value, thrown errors, example

#### getDirectory(hash)
Returns a directory listing as an `Array`

TODO: params, return value, thrown errors, example
