#!/bin/sh
cd bin/
rm -rf dist/
mkdir dist/
tar -zcvf dist/orbit-darwin-x64.tar.gz Orbit-darwin-x64/
tar -zcvf dist/orbit-linux-x64.tar.gz Orbit-linux-x64/
cd ..
