# Orbit API Documentation

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
Get messages from a channel. Returns a Promise that resolves to an `Array` of messages.

TODO: params, thrown errors, example

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
