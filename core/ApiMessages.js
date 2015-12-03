'use strict';

let ApiMessages = {
  error: "error",
  disconnect: "disconnect",
  register: "register",
  deregister: "deregister",
  whoami: "whoami",
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
  list: {
    get: "list.get"
  },
  swarm: {
    peers: "swarm.get"
  }
};

module.exports = ApiMessages;