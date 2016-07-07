# TODO

- use browserfs
- refactor Orbit.js to work independently, fix the methods/events/properties
- create gimme-ipfs-daemon to handle js-ipfs vs. go-ipfs
- media player component for js-ipfs
- integrate with ES6 compatible Reflux (after they merge)
- add "linkto" field to Post (for threaded conversations)
- threaded conversations. enable from (channel?) options
- pin messages
- reactions to messages
- add crdts: all counters, sets and graphs (to crdt lib)
- orbit-db: document store, graph store
- move settings to a panel instead of view

### WIP
- emoji auto-completion
- Fix browser file upload
- Refactor: Move channel loading state to the node.js process

### Must have
- Refactor: Move loading icon in Channel to its own component
- Refactor: Move new messages notification bar in Channel to its own component
- Refactor: Move controlsBar from Channel to its own component
- Refactor: SwarmStore
- Solution for playing videos purely in the browser (replace/improve on current MediaSource API solution)
- feature: markdown as content type in messages (like files/lists)
- fix autolinks for http://localhost:port (fix in react-autolink)
- Try right-aligned channels panels
- Private messages (one-to-one messages)
    + channels but with @ instead of #
- Collections (pin messages to lists)
- Add snippet message type for multiline messages (includes: rendering, code higlighting, markdown, etc.)
- Add keyboard shortcuts for: open channels panel, close channels panel, next channel, previous channel, focus on send message, open settings
- Add notification bubbles to native app
- Add a notification sound
- Remember scroll position after channel change
- fancy link preview
- Add trackbar to channel (line between new and previously seen messages)
- Add Katex/Mathjax support along with markdown (from davidar)
- download a directory

### Nice to have
- join/leave messages
- cache UI fonts locally (package with the app)
  + http://stackoverflow.com/questions/8966740/how-to-host-google-web-fonts-on-my-own-server
- feature: download manager
- aliases for peer addresses, "known as"
