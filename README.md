# Orbit

> A distributed, peer-to-peer chat application built on [IPFS](http://ipfs.io)

**NOTE!** *Currently only the Electron (Desktop) version works. We're working to fix the Browser version (js-ipfs)*

<img src="https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot4%202016-04-16.png" width="80%">
<img src="https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot7%202016-09-02.png" width="50%">
<img src="https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot6%202016-04-17.png" width="50%">

## Project Status

**Status:** *In active development*

Check the project's [roadmap](https://github.com/haadcode/orbit/blob/master/ROADMAP.md) to see what's happening at the moment and what's planned next.

[![Project Status](https://badge.waffle.io/haadcode/orbit.svg?label=In%20Progress&title=In%20Progress)](http://waffle.io/haadcode/orbit)
[![CircleCI Status](https://circleci.com/gh/haadcode/orbit.svg?style=shield&circle-token=158cdbe02f9dc4ca4cf84d8f54a8b17b4ed881a1)](https://circleci.com/gh/haadcode/orbit)

See also [CHANGELOG](https://github.com/haadcode/orbit/blob/master/CHANGELOG.md) for what's new!

## Run

Orbit can be run either in a browser or as a native desktop application. The browser application uses [js-ipfs](http://github.com/ipfs/js-ipfs) implementation of [IPFS](http://ipfs.io). The desktop version uses the [go-ipfs](https://github.com/ipfs/go-ipfs) implementation of [IPFS](http://ipfs.io) together with [Electron](http://electron.atom.io/).

***Please note that Orbit is not secure at the moment!***

#### Live Demo

[http://orbit.libp2p.io/](http://orbit.libp2p.io)

*The live demo is an old version of Orbit. It is recommended to follow the instructions below to run the latest version.*

#### Desktop

##### Requirements

- Node.js v6.x.x
- npm v3.x.x

##### Install and Run
```
git clone https://github.com/haadcode/orbit.git
cd orbit
npm install
npm start
```

#### Browser

*Chrome is recommended to run Orbit in the browser.*

```
git clone https://github.com/haadcode/orbit.git
cd orbit
npm install
npm start
```

## Development

#### Requirements

- Node.js v6.x.x
- npm v3.x.x
- g++, gcc, make (for building native modules)
- python 2 (for building, some native modules need it, node-fibers perhaps?)

#### Get the source code
```
git clone https://github.com/haadcode/orbit.git
cd orbit/
```

#### Install dependencies
```
npm install
```

#### Run Tests

*Note! Running the tests requires a running `redis-server`. If you don't have it installed, see installation instructions for [OSX](http://jasdeep.ca/2012/05/installing-redis-on-mac-os-x/) or [Linux](http://redis.io/topics/quickstart)*

```
npm test
```

#### Browser app development
```
cd client/
npm install
npm run dev
```

This will open webpack dev-server at [http://localhost:8000/webpack-dev-server](http://localhost:8000/webpack-dev-server).

##### Build
```
cd client/
npm install
npm run build
```

This will create `client/dist` directory which contains all the files needed to distribute the Orbit browser application.

#### Desktop app development

First, start the desktop app in developer mode:
```
npm run dev:electron
```

Then, start the UI development environment:
```
cd client/
npm install
npm run dev
```

##### Build

*Run this is in project's root directory, not in `client/`.*

```
npm run build
```

The builds are in `dist/`.

## API

See [API documentation](https://github.com/haadcode/orbit/blob/master/API.md) for full details.

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


## Contributing

Would be happy to accept PRs! If you want to work on something, it'd be good to talk beforehand to make sure nobody else is working on it. You can reach me on Twitter [@haadcode](https://twitter.com/haadcode) or on IRC #ipfs on Freenode, or in the comments of the [issues section](https://github.com/haadcode/orbit/issues).

Good place to start is to take a look at the ["help wanted"](https://github.com/haadcode/orbit/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+sort%3Areactions-%2B1-desc) issues or the project's [status board](https://waffle.io/haadcode/orbit).
