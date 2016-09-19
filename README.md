# Orbit

***WIP branch for ipfs pubsub version***

## Run

Currently only the Electron app works.

#### Requirements

- Node.js v6.x.x
- npm v3.x.x

#### Get the source code

```sh
git clone https://github.com/haadcode/orbit.git
cd orbit
```

#### Install dependencies

```sh
npm install
```

##### Run Electron App

*Run this is in project's root directory, not in `client/`.*

```sh
npm run electron
```

###### Notes

- Orbit currently always starts its own IPFS daemon at random ports. You can find the ports in the log messages.
- The IPFS daemon Orbit starts uses its own data directory. On OSX it's located in `~/Library/Application Support/orbit/ipfs`, on Linux it's located in `~/.config`
- All other data Orbit stores is stored in `~/Library/Application Support/orbit` and `~/.config` (OSX, Linux respectively)

### Build a Stand-Alone App

*Run this is in project's root directory, not in `client/`.*

[Get the source code](#get-the-source-code), [install dependencies](#install-dependencies) and then run:
```sh
npm run build:osx|build:linux
```

The application executable is in `bin/`.

If you end building the app multiple times without changes to the modules, run:
```
npm run build:osx --cached-modules
```

This will skip the `npm install` step in the build process.

### Publish

*Run this is in project's root directory, not in `client/`.*

First, clone the repo then run the following commands. This will build the project from "*scratch*" and add the build to IPFS. Note that you need to have an IPFS daemon running to be able to publish.

```sh
npm install
npm run build:osx
npm run build:linux
npm run publish
```

### Development

#### Requirements

- Node.js v6.x.x
- npm v3.x.x
- g++, gcc, make (for building native modules)
- python 2 (for building, some native modules need it)

#### Run Tests

```sh
npm test
```

#### Electron App Development

First, start the desktop app in developer mode:

```sh
npm run dev:electron
```

Then, start the UI development environment:

```sh
cd client/
npm install
npm run dev
```

##### Build client distributable
```sh
npm run build
```
