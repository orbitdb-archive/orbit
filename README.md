# anonymous-networks

## Introduction

Anonymous Networks is a proof-of-concept ***distributed, peer-to-peer chat application built on top of [IPFS](http://ipfs.io)***.

*"Anonymous"* as in no real-names, no emails. *"Anonymous"* **not** as in *"hide your traffic"*.

All content (messages, files, metadata) are saved in IPFS as files or objects.

There's currently a server that tracks the head (IPFS hash) of a linked list that enables traversing the history of a channel's messages. In future this will be replaced by IPNS.

The messages are encrypted by default. Currently there's only one key pair that is used for the crypto. This will change in the future once IPFS has keystore implemented.

![Screenshot 1](https://raw.githubusercontent.com/haadcode/anonymous-networks/master/screenshots/screenshot1%202015-11-17.png)
![Screenshot 2](https://raw.githubusercontent.com/haadcode/anonymous-networks/master/screenshots/screenshot2%202015-11-17.png)

### Features
- Channel-based chats, usernames
- Drag & drop files to a channel to share them
- Channel modes: password protection to read (Secret), password protection to write (Moderated, only channel "ops" can write)
- Native application on OSX and Linux (Electron)

## Requirements
- Node.js v4.2.x
- Chrome

For development

- Following npm modules installed globally: grunt-cli, mocha, electron-prebuilt
- g++, gcc, make (for building native modules)
- python 2 (for building, some native modules need it, node-fibers perhaps?)

## Run
```
npm install
node index.js
```

Open http//:localhost:3001 in your browser

### Run Options
#### Enable Bots
(broken atm!)
```
node index.js --bots
```

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
cd client/
(npm install electron-prebuilt  -g)
export ENV=dev
electron . 
```

Make sure you don't have the node.js version running and no client open the browser.

## TODO

## Backlog
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

## Changelog

**master**

**v1.0.2**
- Fix: Integrate with a running ipfs daemon (https://github.com/haadcode/anonymous-networks/issues/1, dignifiedquire)
- bug: UI <-> daemon connection state gets fckd
- setting channel passwords is unclear
- bug: when node who posted head is offline and nobody else has the head hash, whole channel gets fckd
- use POST instead of GET where it makes sense
- Fix "Unauthorized" bug after setting channel passwords
- Components for rendering ipfs links, mentions and localhost links (TextMessage.js)
- Add screenshots to the README and repo
- Release UI source code
- Possibility to have multiple channels open at one time
- loading animation to channel.join
- Feature: notifications
- recent channels (and settings?) read from locaStorage should be per user
- Bug: unfetched messages can end in another channel --> cancel fetching messages on leave#
- setup electron dev workflow
- "New messages" notification broken on channels that have less than div.height messages
- back to top button (overlay)

**v1.0.1**
- ~~Feature: autolinks for ipfs hashes~~
- ~~Feature: Highlight mentions of username~~
- ~~Fix: Limit username length (from victorbjelkholm)~~
- ~~Fix: Swarm connect errors: https://gist.github.com/Dignifiedquire/478dd4b157134ff41c0f (from dignifiedquire)~~
- ~~Fixed: Confusing with the latest messages being in the top though, should probably be the other way around (from dignifiedquire, victorbjelkholm)~~
- ~~Fixed: bug: emojify breaks links to host:3001 (0:3 == angel smiley)~~

**v1.0.0**
- ~~channel status message component that displays the various states of the channel ("this is a new channel", "you're not allowed to post")~~
- ~~bug: can post to channel without read password (only need to know write password)~~
- ~~flip messages from newest-on-top to newest-at-bottom, make it a setting~~
- ~~fix streaming/download problems, connection refused problems (ipfs bug?)~~
- ~~drag & drop files and folders~~
- ~~better file upload input~~
- ~~fix autologin~~
- ~~bug: swarm list is not scrollable~~
- ~~linux native build (electron)~~
- ~~normal window keyb shortcuts don't work in electron app (cmd+w)~~
- ~~split main into SocketInterface and HTTPInterface~~
- ~~auto-login on application start (credentials from user.json?) for dev purposes~~
- ~~bug: copy&paste text doesn't work in electron app (works in browser)~~
- ~~channels keep breaking when heads are out of sync~~
- ~~bug: can't ctrl-c electron app on linux~~
- ~~change # icon (channels settings) to options/settings icon, add icons to project~~
- ~~disable send message/add file at join when user doens't have channel write permissions~~
- ~~change login screen form to use the new style~~
- ~~double folder bug when adding a dir (ipfs bug perhaps)~~
- ~~identity should return cache server host (don't read from config.json)~~
- ~~add ChannelInfo data structure and endpoints, return channels's info (mode)~~
- ~~fix the send input alignment (controls alignment in general)~~
- ~~private channels~~
- ~~read-only channels (lists), "op mode"~~
- ~~desktop dist build (electron app?)~~
- ~~move Directory.getHumanReadableBytes to its own module~~
- ~~move to use ES6 in client~~
- ~~refactor MessageStor.sendMessage to use sockets instead of http~~
- ~~username before joining a network~~
- ~~move chang to Vagrant as node2, rename node in vagrant to node1~~
- ~~SwarmView (show connected peers, connect to a peer) in the UI~~
- ~~options: colored names~~
- ~~settings page (emojis on/off)~~
- ~~bootsrappable nodes (Vagrantfile)~~
- ~~display username~~
- ~~fix cacher~~
- ~~refactor list/file loading from backend in UI (use ws instead of api)~~
- ~~usernames~~
- ~~refactor identity to use asyncawait~~
- ~~messages-while-away bug: only MessageStore.mount is fetched, so if there's more than 20, only the 20 latest will be fetched~~
- ~~some messages are cached twice (messages vs. objects, see sqlite3 tables)~~
- ~~add "pin" button for files and directories~~
- ~~open browser when launching index~~
- ~~smileys (emoticons)~~
- ~~start identity and cache on DO from Vagrant~~
- ~~write log to file~~
- ~~fix TextMessage + emojis alignment~~
- ~~put identity on separate server~~
- ~~clean up node_modules mess, remove from git, new repo from fresh (dist-to-friend repo?)~~
- ~~message loading performance should be improved (on client)~~
- ~~fix recent channels data handling~~
- ~~make message fetching a push model~~
- ~~fetching sometimes gets out of sync (still), older messages are not fetched (cacher problem only. too fast?)~~
- ~~some weirdness when channel updates while you're gone (client side problem perhaps?)~~
- ~~fix "unique key" error in SQLite3 queries~~
- ~~proper local message caching (redis? sqlite?)~~
- ~~cacher service~~
- ~~move boostrapping out of conf (manually after daemon has started)~~
- ~~network server should return boostrap nodes~~
- ~~mobile send message/add file~~
- ~~remove recent channels~~
- ~~simple encryption of messages~~
- ~~log4js~~
- ~~pub/sub to improve messaging~~
- ~~fix single file download~~
- ~~directory views with React~~
- ~~download icons~~
- ~~pin important files like user data file, feeds and messages~~
- ~~UI~~

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

### Messages data structure
From the log on sending a message:
```
[DEBUG] - Sending message...
[DEBUG] - --- Message -------------------------------------------
[DEBUG] - To:      #GXmxYYp1AT5joyj1Zdb7f8WNEyQvnYwLJ9zKMdQzmqxN
[DEBUG] - Message: 'hello'
[DEBUG] - Hash:    QmZ3f9EcN7tHeD6EyzqrySj6KsbRPeDBFuBkBqT1Nx1PKV
[DEBUG] - Meta:    QmSWHUxa4ByDgW4AnrKdsVvqr151Vd9SYgZH1czpe4EAKc
[DEBUG] - -------------------------------------------------------
[DEBUG] - Message sent!
```

The message content is encrypted and saved as a separate ipfs object.

```ipfs object get QmZ3f9EcN7tHeD6EyzqrySj6KsbRPeDBFuBkBqT1Nx1PKV```

Returns:
```
{
  "Links": [],
  "Data": "{\"content\":\"Um/+VbM2ay0jxIZpjLzLung7nLbjOOmqonPZnbXd6zOz4QTvMYiUgtpe7X/0oTfy0w8m3981rfZSgX86onBX6724M6vxiHNI9nMD0gbwleAQV7BTx+5X3NqG0LFDeEW2iduwvanc0YJIpFLL5yYCRQUybc531n8/5hNk7obWvkd5kI8FST+j9S4SX0G5lz8rWiHrqR1QAo3c1g40V3fk2C9huOuMovn7YkhN+AWTKxjmkvd6dIbBVw0YnoSTzgpdkhHb2RWBi7z1kYfYSiPiqmPNQvBoMCe1Dm0o7y70ond/A+XqBAyX2JFHyt1XrB1SP6SCZs5OZk0P1/S31nxxdA==\",\"link\":null,\"ts\":1447339736170}"
}
```

A linked list "meta" object is created, link to the next message is added and the payload, as json, gets encrypted. The message gets signed with (sha512(payload, salt) + salt + sequence number, privkey). **Payload contains the hash to the actual content.** The hash of the created ipfs object is the head of the linked list. The head gets sent to server.

```ipfs object get QmSWHUxa4ByDgW4AnrKdsVvqr151Vd9SYgZH1czpe4EAKc```

Returns:
```
{
  "Links": [
    {
      "Name": "next",
      "Hash": "QmVyt1t93ptUoFG6QetWRAcwPdeAVqYEs2bK38yztJAHmG",
      "Size": 103986
    }
  ],
  "Data": "{\"seq\":51,\"pubkey\":\"-----BEGIN CERTIFICATE-----\\nMIIDBjCCAe4CCQDai2CYe+oyADANBgkqhkiG9w0BAQUFADBFMQswCQYDVQQGEwJB\\nVTETMBEGA1UECBMKU29tZS1TdGF0ZTEhMB8GA1UEChMYSW50ZXJuZXQgV2lkZ2l0\\ncyBQdHkgTHRkMB4XDTE1MTAyNDE4MzQwNloXDTE1MTEyMzE4MzQwNlowRTELMAkG\\nA1UEBhMCQVUxEzARBgNVBAgTClNvbWUtU3RhdGUxITAfBgNVBAoTGEludGVybmV0\\nIFdpZGdpdHMgUHR5IEx0ZDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\\nAJ1aO1Vjk0l1fSa4pdJQQdBtG9kpqI+U6M2yt32fOq5ICUnYhLCGw/3aZeqEEq2h\\n11/AqbvQHar8w3dzH//ErCnx5qGzUVClD2ZIB1mytXjHyKvpIdIIBOMF2EygAO5B\\niMwlFhpEhtraqO0eRQx3W6ULXr4fqqoNSPHGHHEtVlVxTcvRJr3Sz1x+2vGbFszP\\nV61uy1+QaaNc9vi2FR3DWBtOM1QPFJa792xtuAEwkSkHcc1aUJjcfK/VuOxEqPZK\\ny6DW8K2OAO61EUIwTgUubVKudlItmCJgNwRuezvI2P3wU9LvTuQ/AbJowTPuP9Le\\nyNq9TnAHPRETcvPYgbI0i2sCAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAjYne/qu7\\n7KylXi39x72cY/sEpTErKMhCJNm4DL3Mb4YfkDiOZFbNGO+1NKNKHB1DTbu5ECtT\\nvYrBLGwLICklVpVP65podAHweDGGEMW6cp4ypWOpJM4NqyNtL8HKpi2PB/n3SkYi\\nz7aCuagHbU+5YZhm4kj8KDjmbCyn7hU1vQVKf+fw+dLXNUAElI1GLv2tENEEevtl\\nTj7DurHCrxPcdrbgxQMIbDcpPMXVX4OlS51EsT5mVgGIoUFKZN8u9+AwzU+INKZp\\n6SjbrK3y/HqI4jgeDQPY9GQcGooL1ro9OHfSz61m6WiYh9V6vjq2e8bmc00U/yTA\\nlSErmB6aqZ2+0w==\\n-----END CERTIFICATE-----\\n\",\"payload\":\"j2sACz4bNjU9MqlJuWRrzHiaQlq+T8U29thB77WRbXe8KzuOZgtL90hUAVha+ZMIa+oYSvdPnGa5OlCQM452nwZUHLoW4NI6dHeKlCiGtcoqC3LpZBC7GZb+21l6F4MQwSmfRPRaqUdmDGzHql/zwvR2ZpTh8PlkW9SPF0QiJRe7lFmkhny52zVlaHz1/xAquk8d6VeqLQAf4Tj9ZP+f/dVMA7CXJzmiHeYIyZQ2vJKdEoWNnrmjxQPyDFSlNcI2D30ue7UmoEPKnjFws2NN0mIbRMZ6o+InSMgTrc9jD8mL4tlN7FgcU1H7+zdLuwUHiOWEUdk55M4mp4vWvH4Vww==\",\"sig\":\"90b3698901b20b640950537f151ac3a705c1275dbb55877b50203618d151368aa2b15692529e44b09f2a7d11d2df84ee237f661209c824e3994b65c815b8239c173ed16f43e2ba2dbfed3f5005e6b2870cce2a2fff06817e62807988b47cf92b01a5cb82339906f8f693ede88b0b4edd5b9253dd58cebaf3573793efcb4d91b50d58267f480c09276d9e66ec8540f4a0649cfee4d8c539316d1257ec3aab60458d090666d2b64fb49c26c643e0b2f89ed092f58cb374e2dfeb58714a0302b8f77833a7ee2c304699487f06ad303a88217deca7c8a59c69f8b889466aaf3eeef5dcf79c4a009bfa4a2e1e57432a71ec2163e6bd1a6144d1424056667c78e6bea3\"}"
}
```

### Random
works on api 2.2.1 and ctl 0.6.1
