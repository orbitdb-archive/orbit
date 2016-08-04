# Orbit

> A distributed, peer-to-peer chat application built on [IPFS](http://ipfs.io)

<img src="https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot4%202016-04-16.png" width="80%">
<img src="https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot3%202016-04-14.png" width="50%">
<img src="https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot6%202016-04-17.png" width="50%">

## Project Status

**Status:** *In active development*

Check the project's [roadmap](https://github.com/haadcode/orbit/blob/master/ROADMAP.md) to see what's happening at the moment and what's planned next.

[![Project Status](https://badge.waffle.io/haadcode/orbit.svg?label=In%20Progress&title=In%20Progress)](http://waffle.io/haadcode/orbit)
[![CircleCI Status](https://circleci.com/gh/haadcode/orbit.svg?style=shield&circle-token=158cdbe02f9dc4ca4cf84d8f54a8b17b4ed881a1)](https://circleci.com/gh/haadcode/orbit)

## Run

***Please note that Orbit is not secure at the moment!***

### Browser

The browser version uses [js-ipfs](http://github.com/ipfs/js-ipfs) module and runs Orbit with IPFS embedded to it.

**Chrome recommended!**

To start the application:
```
git clone https://github.com/haadcode/orbit.git
cd orbit
open client/dist/index.html
```

Or check the live demo: [http://orbit.libp2p.io/](http://orbit.libp2p.io)

### App

Orbit uses [Electron](http://electron.atom.io/) to wrap the application in a native executable. The Electron version of Orbit uses [go-ipfs](https://github.com/ipfs/go-ipfs) daemon. You don't need to have an IPFS daemon running to run Orbit.

#### Requirements

To build the Electron app, you will need to following tools:

- Node.js v6.x.x
- npm v3.x.x

#### Build the Electron app

```
npm install
npm build
```

The builds are in `dist/`. Eg. on OS X, open the application from `dist/Orbit-darwin-x64`.

## Development

### Requirements
- Node.js v6.x.x
- npm v3.x.x
- g++, gcc, make (for building native modules)
- python 2 (for building, some native modules need it, node-fibers perhaps?)

### Tests

*Note: requires a running redis-server*

```
npm install
npm test
```

### Build all
```
npm install
npm build
```

The builds are in `dist/`

## UI Development
```
cd client/
npm install
npm dev
```

This will open webpack dev-server at [http://localhost:8000/webpack-dev-server](http://localhost:8000/webpack-dev-server).

Build UI distributable:
```
cd client/
npm install
npm build
```

This will create `client/dist` directory which contains all the files needed to distribute Orbit browser app.

### UI Development with Electron
For UI development (webpack-dev-server in the Electron app).

Start Electron:
```
npm install
npm run dev:electron
```

Start the webpack dev server:
```
cd client/
npm install
npm dev
```

## Run your own network
Get https://github.com/haadcode/orbit-server and start the server. In Orbit's login window, point to the host where your orbit-server is running, default: `localhost:3333`.

## Contributing
Would be happy to accept PRs! If you want to work on something, it'd be good to talk beforehand to make sure nobody else is working on it. You can reach me on Twitter [@haadcode](https://twitter.com/haadcode) or on IRC #ipfs on Freenode.

Good place to start is to take a look at the ["help wanted"](https://github.com/haadcode/orbit/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) issues.
