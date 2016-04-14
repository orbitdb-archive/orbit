# Orbit

***Warning: Orbit is very much work-in-progress, things might be broken and instructions might be out of date. If something is not working, please let me know and I'll make sure to fix it.***

## Introduction

Orbit is a  ***distributed, peer-to-peer chat application built on [IPFS](http://ipfs.io)***.

All content (messages, files, metadata) are saved in IPFS as files or objects.

There's currently a server (https://github.com/haadcode/orbit-server) that tracks the head (IPFS hash) of a linked list that enables traversing the history of a channel's messages. In future this will be replaced by IPNS.

**Please note that Orbit is not secure at the moment!**

![Screenshot](https://raw.githubusercontent.com/haadcode/anonymous-networks/master/screenshots/screenshot1%202016-04-14.png)

## Requirements
- Node.js >= v4.2.x
- npm > v3.0.0

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

## Contributing
Would be happy to accept PRs! If you want to work on something, it'd be good to talk beforehand to make sure nobody else is working on it. You can reach me on Twitter [@haadcode](https://twitter.com/haadcode) or on IRC #ipfs on Freenode.

See [TODO](https://github.com/haadcode/orbit/blob/master/TODO.md) for ideas and tasks up for grabs.
