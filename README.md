# Orbit

> A ***distributed, peer-to-peer chat application built on [IPFS](http://ipfs.io)***.

***Warning: Orbit is very much work-in-progress. If something is not working, please let me know and I'll make sure to fix it.***

All content (messages, files, metadata) is saved in IPFS as files or objects.

There's currently a server (https://github.com/haadcode/orbit-server) that tracks the head (IPFS hash) of a linked list that enables traversing the history of a channel's messages. In future this will be replaced by IPNS.

**Please note that Orbit is not secure at the moment!**

![Screenshot 1](https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot4%202016-04-16.png)
![Screenshot 2](https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot3%202016-04-14.png)
![Screenshot 3](https://raw.githubusercontent.com/haadcode/orbit/master/screenshots/screenshot6%202016-04-17.png)

## Table of Contents

- [Installation](#installation)
  - [Requirements](#requirements)
  - [Browser](#browser)
    - [With Credentials](#with-credentials)
  - [Application](#application)
- [Development](#development)
  - [UI Development](#ui-development)
  - [Development in Electron](#development-in-electron)
  - [Running your own network](#running-your-own-network)
- [Contribute](#contribute)
- [License](#license)

## Installation

### Requirements

To run Orbit, [Node.js v4.x.x](http://nodejs.org) and [npm](https://npmjs.com) are required prerequisites.

In the current directory, run:

		npm install

### Browser

To use Orbit in the broswer, start the program by running:

		node index.js

Then, open `http://localhost:3001` in your browser.

#### With Credentials

To autologin, create a file called `user.json` and add your wanted credentials:

```json
{
  "username": "haadcode",
  "password": "" // Not used atm
}
```

### Application

To use Orbit as a native application, build it:

		grunt build

To build for individual platforms, run one of:

```sh
grunt build_nodejs_osx
grunt build_nodejs_linux
grunt build_native_osx
grunt build_native_linux
```

The builds are in `dist/`. Eg. on OSX, open the application from `dist/AnonymousNetworks-darwin-x64`.

Orbit uses [Electron](http://electron.atom.io/) to wrap the application in a native executable.

## Development

The following npm modules must installed globally: `grunt-cli`, `mocha`, `electron-prebuilt`. TODO: Link.
- g++, gcc, make (for building native modules)
- python 2 (for building, some native modules need it, node-fibers perhaps?) TODO Clean up.

### UI Development

Build the distributable:

```sh
cd client/
npm install
grunt build
```

Then, run the main program:

	node index

In a separate terminal, run:

```sh
cd client/
npm install
grunt serve
```

### Development in Electron
For UI development ([webpack-dev-server](TODO) in the Electron app), start the webpack dev server:

```sh
cd client/
grunt serve
```

Start Electron:

		ENV=dev ./node_modules/.bin/electron . 

Make sure the node.js version is not running, and that there is no client open in the browser.

### Running your own network

Get [orbit-server](https://github.com/haadcode/orbit-server) and start the server, edit `./network.json` and point to the appropriate url (eg. localhost:3006).

## Contribute

I would be happy to accept PRs and questions! [Open a new issue](https://github.com/haadcode/orbit/issues/new) if you have any questions.

If you want to work on something, it'd be good to talk beforehand to make sure nobody else is working on it. You can also reach me on Twitter [@haadcode](https://twitter.com/haadcode) or on IRC #ipfs on Freenode.

See [TODO](https://github.com/haadcode/orbit/blob/master/TODO.md) for ideas and tasks up for grabs.

## License

[MIT © 2016 haadcode](LICENSE)
