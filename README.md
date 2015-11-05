# anonymous-networks

## Introduction

Anonymous Networks is a proof-of-concept chat application built on top of ipfs. 

All content (messages, files, metadata) are saved in ipfs. There's currently a server that tracks the head (ipfs hash) of a linked list that enables traversing the history of a message chain. In future this will be replaced by ipns.

### Features
- Channel-based chats and usernames
- Drag & drop files to a channel to share them
- Channel modes: password protection to read (Secret), password protection to write (Moderated, only channel "ops" can write)
- Native application on OSX and Linux (Electron)

## Run
```
  npm install
  node index.js
```

Open http//:localhost:3001 in your browser

### Run options
Run as electron app:
```
  electron . 
```

Run with bots:
```
  node index.js --bots
```

Autologin:
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

## Requirements (for development)
- Node.js v4.2.1
- Following npm modules installed globally: grunt-cli, mocha, electron-prebuilt
- g++, gcc, make (for building native modules)
- python 2 (for building, some native modules need it, node-fibers perhaps?)
- Chrome

## TODO
- bug: UI <-> daemon connection state gets fckd
- highlight mentions on channels
- feature: markdown as content type in messages (like files/lists)
- feature: autolinks for ipfs hashes
- add caching of packages to go-ipfs / node install.js
- loading animation to channel.join
- empty channels when no swarm peers. notify the user that there are no peers atm., re-try logic in backend for connecting to peers if connection failed and there are 0 peers
- feature: notifications
- password for username is unclear (and buggy: can't enter no password)
- feature: download manager
- recent channels (and settings?) read from locaStorage should be per user
- recent channels list should say it's "recent channels"
- setting channel passwords is unclear
- cache UI fonts locally (package with the app)
  + http://stackoverflow.com/questions/8966740/how-to-host-google-web-fonts-on-my-own-server
- flashing "Anonymous" user name for a known user
- bug: slow internet makes the app respond slower (how ui elements appear, sending messages feedback delay, etc.)
- bug: saw ENOENT / file not found error message after login once in electron app (see bug notes for the stacktrace)
- "Incorrect password" should be red
- subcomandante needs to be platform-agnostic (remove #!/usr/bin/env node)
- bug: when node who posted head is offline and nobody else has the head hash, whole channel gets fckd
- bug: unfetched messages can end in another channel --> cancel fetching messages on leave#
- convert MessageStore (UI) to ES6
- easier network setup than network.json
- timestamp weirdness, slow updates
- hook log4js to ws so that backend logs get to browser
- bug: emojify breaks links to host:3001 (0:3 == angel smiley)
- back to top button (overlay)
- aliases for peer addresses, "known as"
- bug: loading time at join if there are new messages in network
- bug: adding files takes ages!
- LAN connections not initiated (ipfs bug?)
- favorites view, add(/remove) to favorites, uses DirectoryView only, localStorage for storing Maps {hash,links}, check possibility to save to network
- setup electron dev workflow
- fix autolinks for http://localhost:port (fix in react-autolink)
- add file progress notification (loading text)
- emoji auto-completion
- emoji descriptions to image alt (fix in react-emoji)
- fancy link preview
- change TransitionGroups to react-motion
- download a directory
- UI feedback for: connections status, adding file, loading messages, etc.
- use POST instead of GET where it makes sense

## DONE
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
Demo app ideas:
- Email
- Twitter
- Spotify
- Netflix
- Collaborative document editing
- Git
- Wiki
- Forums

