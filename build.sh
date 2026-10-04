#!/bin/sh
# The Hourglass City. The build itself is tools/build.js (plain Node, works on Windows too).
cd "$(dirname "$0")" && node tools/build.js city
