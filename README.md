# Orbit

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Distributed peer-to-peer chat application on IPFS.

***Current work is happening in: https://github.com/haadcode/orbit/tree/js-ipfs***

***Warning: Orbit is very much work-in-progress. If something is not working, please let me know and I'll make sure to fix it.***

## Table of Contents

- [Background](#background)
- [Install](#install)
  - [Requirements](#requirements)
- [Usage](#usage)
  - [Browser](#browser)
  - [App](#app)
  - [Run Options](#run-options)
    - [Autologin](#autologin)
- [Build](#build)
- [UI Development](#ui-development)
  - [Development in Electron](#development-in-electron)
- [Run your own network](#run-your-own-network)
- [Contributing](#contributing)
- [License](#license)

## Background

Orbit is a ***distributed, peer-to-peer chat application built on [IPFS](http://ipfs.io)***.

All content (messages, files, metadata) are saved in IPFS as files or objects.

There's currently a server (https://github.com/haadcode/orbit-server) that tracks the head (IPFS hash) of a linked list that enables traversing the history of a channel's messages. In future this will be replaced by IPNS.

**Please note that Orbit is not secure at the moment!**

![Screenshot 1](https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot4%202016-04-16.png)
![Screenshot 2](https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot3%202016-04-14.png)
![Screenshot 3](https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot6%202016-04-17.png)

## Install

First, clone this repository locally. Then:

```bash
npm install
```

### Requirements
- [Node.js v4.x.x](http://nodejs.org/)
- [npm](https://npmjs.com)

For development:

The following npm modules must be installed globally: [grunt-cli](https://www.npmjs.com/package/grunt-cli), [mocha](https://www.npmjs.com/package/mocha), [electron-prebuilt](https://www.npmjs.com/package/electron-prebuilt). These can be installed by running:

```bash
npm i -g grunt-cli mocha electron-prebuilt
```

As well, you will need:
- g++, gcc, make (for building native modules)
- python 2 (for building, some native modules need it, node-fibers perhaps?)

## Usage

Orbit can be run either in the browser or as a native app.

### Browser

```bash
node index.js
```

Open `http://localhost:3001` in your browser.

### App

Build the native app:

```bash
grunt build
```

The builds are in `dist/`. For example, on OSX, open the application from `dist/AnonymousNetworks-darwin-x64`.

Orbit uses [Electron](http://electron.atom.io/) to wrap the application in a native executable.

### Run Options

#### Autologin

Create a file called `user.json` and add your wanted credentials:

```json
{
  "username": "haadcode",
  "password": "" // Not used atm
}
```

Then, start the program:

```bash
node index.js
```

## Build

Run these commands from inside the local repository. Build all:

```bash
grunt build
```

Build for individual platforms:

```bash
grunt build_nodejs_osx
grunt build_nodejs_linux
grunt build_native_osx
grunt build_native_linux
```

The builds are in the `dist/` folder.

## UI Development

Build distributable:

```bash
cd client/
npm install
grunt build
```

Development:

```bash
node index
```

```bash
cd client/
(npm install)
grunt serve
```

### Development in Electron
For UI development (webpack-dev-server in the Electron app).

Start the webpack dev server:

```bash
cd client/
grunt serve
```

Start Electron:

```bash
ENV=dev ./node_modules/.bin/electron . 
```

Make sure you don't have the node.js version running, and that the client is not open in the browser.

## Run your own network

Get [orbit-server](https://github.com/haadcode/orbit-server) and start the server, edit `./network.json` and point to the appropriate url (eg. `localhost:3006`).

## Contributing

I would be happy to accept PRs! If you want to work on something, it'd be good to talk beforehand to make sure nobody else is working on it. You can reach me on Twitter [@haadcode](https://twitter.com/haadcode) or on IRC #ipfs on Freenode. Or, [open an issue](https://github.com/haadcode/orbit/issues/new) - check the [existing ones](https://github.com/haadcode/orbit/issues) to make sure work isn't being duplicated.

See [TODO](https://github.com/haadcode/orbit/blob/master/TODO.md) for ideas and tasks up for grabs.

## License

Copyright (c) 2015 haadcode
