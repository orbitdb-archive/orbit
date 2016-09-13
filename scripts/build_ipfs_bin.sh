#!/bin/sh
set -e # exit on error

die() {
  set +v
  echo >&2 "$@"
  exit 1
}

require() {
  set +v
  which "$1" >/dev/null || die "$1 not in \$PATH. please install $1"
  set -v
}

set -v # print commands
require mv
require cd
require mkdir
require pwd
require make
require git
require go
require npm
require node
npm --version | egrep "^3." >/dev/null || die "requires npm version 3"
go version | grep "go1.7" >/dev/null || die "requires npm version 3"

# install go-ipfs pubsub branch
GOPATH="/tmp/gopath"
ORBIT_PATH=$(pwd)
rm -rf $GOPATH
mkdir -p /tmp/gopath/src/github.com/ipfs
cd /tmp/gopath/src/github.com/ipfs
git clone --branch feat/floodsub https://github.com/ipfs/go-ipfs go-ipfs || die "failed to clone go-ipfs"
cd go-ipfs
make build >/dev/null || die "failed to build go-ipfs"

# install go-ipfs into node_modules/.bin/ipfs, which should be in our path.
mv cmd/ipfs/ipfs "$ORBIT_PATH/node_modules/go-ipfs-dep/go-ipfs/ipfs"
echo 'Haz acquired go-ipfs with pubsub!'
cd "$ORBIT_PATH"
