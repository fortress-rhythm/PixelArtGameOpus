#!/bin/sh
# The Black Sedan test level: the shared engine in src/ + src_test/. The build itself is tools/build.js.
cd "$(dirname "$0")" && node tools/build.js test
