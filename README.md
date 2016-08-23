# Orbit

uPort integration development branch.

Need to run IPFS daemon with
```
API_ORIGIN=* ipfs daemon
```

---

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


## Run your own network

Get https://github.com/haadcode/orbit-server and start the server. In Orbit's login window, point to the host where your orbit-server is running, default: `localhost:3333`.


## NOTES
You need to have an account in geth:
```
./geth account new
```

You need a running geth instance with:
```
./geth --rpc --rpccorsdomain "*" --unlock <account id>
```
