# Orbit js-ipfs demo branch

## Run

1. Open `client/dist/index.html` in your browser *(Chrome recommended)*
2. Done

## Development
### Requirements 

* Node.js v4.x.x 
* npm v3.x.x

*If you don't have npm v3.x installed, you can install it from npm with `npm install npm3 -g` and run the npm commands described in this document with `npm3` instead of `npm`.*

#### Setup and Run
```
git clone -b js-ipfs https://github.com/haadcode/orbit
cd orbit/
npm install
cd client/
npm install
npm run dev
```

#### Test
```
cd client/
npm test
```

#### Build
```
cd client/
npm install
npm run build
```

This will update the files in `dist/`.

#### Publish

**In order to publish, you must have ipfs daemon running locally**

```
cd client/
npm run publish
```
