'use strict';

class Message {
  constructor(content, link) {
    this.content = content;
    this.link    = link;
    this.ts      = new Date().getTime();
  }
}

module.exports = Message;
