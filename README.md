# Orbit

***Warning: Orbit is currently going through a big refactoring, things might be broken and instructions might be out of date. If something is not working, please open an issue and I'll make sure to fix it.***

Previously known as: **Anonymous Networks**

## Introduction

Orbit is a  ***distributed, peer-to-peer chat application built on [IPFS](http://ipfs.io)***.

All content (messages, files, metadata) are saved in IPFS as files or objects.

There's currently a server (https://github.com/haadcode/orbit-server) that tracks the head (IPFS hash) of a linked list that enables traversing the history of a channel's messages. In future this will be replaced by IPNS.

**Please note that Orbit is not secure at the moment!**

![Screenshot 1](https://raw.githubusercontent.com/haadcode/anonymous-networks/master/screenshots/screenshot1%202015-11-17.png)
![Screenshot 2](https://raw.githubusercontent.com/haadcode/anonymous-networks/master/screenshots/screenshot2%202015-11-17.png)

## Requirements
- Node.js v4.2.x
- npm

For development

- Following npm modules installed globally: grunt-cli, mocha, electron-prebuilt
- g++, gcc, make (for building native modules)
- python 2 (for building, some native modules need it, node-fibers perhaps?)

## Run
### Browser
```
npm install
node index.js
```

Open `http://localhost:3001` in your browser

### App
Build the native app:
```
grunt
```

The builds are in `dist/`. Eg. on OSX, open the application from `dist/AnonymousNetworks-darwin-x64`.

Orbit uses Electron to wrap the application in native executable.

### Run Options
(Not supported in native builds atm)

#### Autologin
Create a file called `user.json` and add your wanted credentials:
```
{
  "username": "bot",
  "password": "password"
}
```

Start the program:
```
node index.js [--bots]
```

## Build
Build all:
```
grunt
```

Build for individual platforms:
```
grunt build_nodejs_osx
grunt build_nodejs_linux
grunt build_native_osx
grunt build_native_linux
```

The builds are in `dist/`

## UI
Build:
```
cd client/
npm install
grunt build
```

Dev:
```
cd client/
(npm install)
grunt serve
```

### Development in Electron
For UI development (webpack-dev-server in the Electron app).

Start the webpack dev server:
```
cd client/
grunt serve
```

Start Electron:
```
npm install electron-prebuilt
export ENV=dev
./node_modules/.bin/electron . 
```

Make sure you don't have the node.js version running and no client open the browser.

## Run your own network
Get https://github.com/haadcode/orbit-server and start the server, edit `./network.json` and point to appropriate url (eg. localhost:3006)

## Notes
### Demo app ideas
- Email
- Twitter
- Spotify
- Netflix
- Collaborative document editing
- Git
- Wiki
- Forums

### Backlog
- Multiline supports in the send message input field
- Try right-aligned channels panels
- Add keyboard shortcuts for: open channels panel, close channels panel, next channel, previous channel, focus on send message, open settings
  + check https://github.com/glenjamin/react-hotkey
- Add trackbar to channel (line between new and previously seen messages)
- Fix browser file upload
- Skip lists for LL items in order to prevent channel history traversal to get stuck completely
- Fix Electron non-dev flow
- Add notification bubbles to native app
- Display notifications when app is unfocused
- move message type from MetaInfo to Message.content
- SwarmStore
- Tab to finish the username when writing
- If it's truly a linked list, you could take advantage of https://ipfs.io/ipfs/QmTtqKeVpgQ73KbeoaaomvLoYMP7XKemhTgPNjasWjfh9b/ for efficient seeking to any point in the history. (from Ion)
- Private messages (one-to-one messages)
- Add Katex/Mathjax support along with markdown (from davidar)
- Empty channels when no swarm peers. Notify the user that there are no peers atm., re-try logic in backend for connecting to peers if connection failed and there are 0 peers
- feature: markdown as content type in messages (like files/lists)
- add caching of packages to go-ipfs / node install.js
- password for username is unclear (and buggy: can't enter no password)
- feature: download manager
- cache UI fonts locally (package with the app)
  + http://stackoverflow.com/questions/8966740/how-to-host-google-web-fonts-on-my-own-server
- flashing "Anonymous" user name for a known user
- bug: slow internet makes the app respond slower (how ui elements appear, sending messages feedback delay, etc.)
- subcomandante needs to be platform-agnostic (remove #!/usr/bin/env node)
- convert MessageStore (UI) to ES6
- easier network setup than network.json
- hook log4js to ws so that backend logs get to browser
- aliases for peer addresses, "known as"
- bug: loading time at join if there are new messages in network
- favorites view, add(/remove) to favorites, uses DirectoryView only, localStorage for storing Maps {hash,links}, check possibility to save to network
- fix autolinks for http://localhost:port (fix in react-autolink)
- add file progress notification (loading text)
- emoji auto-completion
- emoji descriptions to image alt (fix in react-emoji)
- fancy link preview
- download a directory
