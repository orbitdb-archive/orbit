# Orbit

***WIP branch for ipfs pubsub version***

## Extra Requirements

You need to have go-ipfs binary built from the IPFS pubsub branch https://github.com/ipfs/go-ipfs/tree/feat/floodsub. You need to have the daemon running before starting Orbit (at port 5001).

## Run

Currently only the Electron app works.

#### Requirements

- Node.js v6.x.x
- npm v3.x.x
- g++, gcc, make (for building native modules)
- python 2 (for building, some native modules need it, node-fibers perhaps?)

#### Get the source code

```sh
> git clone https://github.com/haadcode/orbit.git
> cd orbit
```

#### Install dependencies

```sh
> npm install
> cd client
> npm install
```

##### Build Client

```sh
> cd client
> npm run build
```

##### Run Electron App

*Run this is in project's root directory, not in `client/`.*

```sh
> npm run electron
```

The application executable is in `dist/`.

### Development

#### Run Tests

```sh
> npm test
```

#### Electron App Development

First, start the desktop app in developer mode:

```sh
> npm run dev:electron
```

Then, start the UI development environment:

```sh
> cd client/
> npm run dev
```
