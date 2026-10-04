#!/bin/sh
# Ravenshore Garden. The build itself is tools/build.js.
cd "$(dirname "$0")" && node tools/build.js garden
