# orbit-bot

Run an Orbit client on a channel. This is useful to make sure a channel gets cached when there are only few peers online.

## Install

**Requires**
- Node.js > v6.0.0

```
git clone -b bot https://github.com/haadcode/orbit.git
cd orbit
npm install
./node_modules/go-ipfs-dep/go-ipfs/ipfs init
cd src/bot
```

## Run
```
screen -S bot -d -m node index <botname> <channel>
```

## Run in a screen
```
screen -S bot -d -m node index <botname> <channel>
```

## Deploy

**Requires**
- Vagrant > v.1.8.1
- Digital Ocean API Token

First, open `Vagrantfile` and add your key path and Digital Ocean API token. Make sure to change the `<botname>` and `<channel>` on this line: `screen -S bot -d -m node index <botname> <channel>`

Then run:
```
vagrant up
```

This will create a Digital Ocean droplet and run orbit-bot in a screen automatically joining the specified `<channel>`. That's it, your Orbit channel is now cached.
