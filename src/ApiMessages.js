'use strict';

let ApiMessages = {
  error: "error",
  register: "register",
  deregister: "deregister",
  network: {
    connect: "network.connect",
    disconnect: "network.disconnect"
  },
  channels: {
    get: "channels.get",
    updated: "channels.updated"
  },
  channel: {
    authenticate: "channel.authenticate",
    join: "channel.join",
    part: "channel.part",
    messages: "channel.get",
    passwords: "channel.password",
    info: "channel.info",
    setMode: "channel.password"
  },
  user: {
    get: "user.get"
  },
  message: {
    send: "message.send",
    get: "message.get"
  },
  file: {
    add: "file.add"
  },
  directory: {
    get: "directory.get"
  },
  swarm: {
    peers: "swarm.get"
  }
};

module.exports = ApiMessages;