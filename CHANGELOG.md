# Changelog for Orbit

**3.2.0** *(2016-10-05)*

- IPFS Pubsub - No More Servers!
- uPort Integration
- Several performance fixes

**3.1.0** *(2016-09-02)*

- Signed messages
- Identities (click a username to see the profile)
- Can now "Reply-to" a message (click a message to reply)
- Right-aligned channels panels (flag in options)
- Polished animations ("Fix planetary physics")
- Fixed a lot of bugs, improved developer resources

**3.0.0**
- Massive re-write, everything was changed

**2.2.0**
- Update to orbit-db 0.8.x
- Tab to finish the username when writing

**2.1.0**
- Use IPFS daemon v0.4.0

**v2.0.0**
- Major refactoring, a lot of code is in flux
- Use orbit-db as the IPFS backend

**v1.0.2**
- Fix: messages longer than 256 bytes can't be sent
- Fix: /me is parsed from the full content, not from the start
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
- Feature: autolinks for ipfs hashes
- Feature: Highlight mentions of username
- Fix: Limit username length (from victorbjelkholm)
- Fix: Swarm connect errors: https://gist.github.com/Dignifiedquire/478dd4b157134ff41c0f (from dignifiedquire)
- Fixed: Confusing with the latest messages being in the top though, should probably be the other way around (from dignifiedquire, victorbjelkholm)
- Fixed: bug: emojify breaks links to host:3001 (0:3 == angel smiley)

**v1.0.0**
- channel status message component that displays the various states of the channel ("this is a new channel", "you're not allowed to post")
- bug: can post to channel without read password (only need to know write password)
- flip messages from newest-on-top to newest-at-bottom, make it a setting
- fix streaming/download problems, connection refused problems (ipfs bug?)
- drag & drop files and folders
- better file upload input
- fix autologin
- bug: swarm list is not scrollable
- linux native build (electron)
- normal window keyb shortcuts don't work in electron app (cmd+w)
- split main into SocketInterface and HTTPInterface
- auto-login on application start (credentials from user.json?) for dev purposes
- bug: copy&paste text doesn't work in electron app (works in browser)
- channels keep breaking when heads are out of sync
- bug: can't ctrl-c electron app on linux
- change # icon (channels settings) to options/settings icon, add icons to project
- disable send message/add file at join when user doens't have channel write permissions
- change login screen form to use the new style
- double folder bug when adding a dir (ipfs bug perhaps)
- identity should return cache server host (don't read from config.json)
- add ChannelInfo data structure and endpoints, return channels's info (mode)
- fix the send input alignment (controls alignment in general)
- private channels
- read-only channels (lists), "op mode"
- desktop dist build (electron app?)
- move Directory.getHumanReadableBytes to its own module
- move to use ES6 in client
- refactor MessageStor.sendMessage to use sockets instead of http
- username before joining a network
- move chang to Vagrant as node2, rename node in vagrant to node1
- SwarmView (show connected peers, connect to a peer) in the UI
- options: colored names
- settings page (emojis on/off)
- bootsrappable nodes (Vagrantfile)
- display username
- fix cacher
- refactor list/file loading from backend in UI (use ws instead of api)
- usernames
- refactor identity to use asyncawait
- messages-while-away bug: only MessageStore.mount is fetched, so if there's more than 20, only the 20 latest will be fetched
- some messages are cached twice (messages vs. objects, see sqlite3 tables)
- add "pin" button for files and directories
- open browser when launching index
- smileys (emoticons)
- start identity and cache on DO from Vagrant
- write log to file
- fix TextMessage + emojis alignment
- put identity on separate server
- clean up node_modules mess, remove from git, new repo from fresh (dist-to-friend repo?)
- message loading performance should be improved (on client)
- fix recent channels data handling
- make message fetching a push model
- fetching sometimes gets out of sync (still), older messages are not fetched (cacher problem only. too fast?)
- some weirdness when channel updates while you're gone (client side problem perhaps?)
- fix "unique key" error in SQLite3 queries
- proper local message caching (redis? sqlite?)
- cacher service
- move boostrapping out of conf (manually after daemon has started)
- network server should return boostrap nodes
- mobile send message/add file
- remove recent channels
- simple encryption of messages
- log4js
- pub/sub to improve messaging
- fix single file download
- directory views with React
- download icons
- pin important files like user data file, feeds and messages
- UI
