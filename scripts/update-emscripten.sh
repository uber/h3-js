#!/usr/bin/env bash

# Copyright 2018-2019, 2022 Uber Technologies, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -ex

mkdir -p cmake
pushd cmake
if ! [ -e cmake-3.23.2-linux-x86_64.sh ]; then
    wget -nv https://github.com/Kitware/CMake/releases/download/v3.23.2/cmake-3.23.2-linux-x86_64.sh
fi
echo "5cca63af386e5bd0bde67c87ffac915865abd7dcc48073528f58645abda8f695  cmake-3.23.2-linux-x86_64.sh" > cmake-3.23.2-SHA-256.txt
sha256sum -c cmake-3.23.2-SHA-256.txt
if ! [ -e ./bin/cmake ]; then
    chmod a+x cmake-3.23.2-linux-x86_64.sh
    ./cmake-3.23.2-linux-x86_64.sh --skip-license
fi
export PATH=$(pwd)/bin:$PATH
cmake --version
popd

mkdir -p out
pushd h3c
# Run cmake - necessary for building h3api.h
cmake .

# Get canonical list of functions the lib should expose
./scripts/binding_functions.sh && cp binding-functions ../out

# Get the list of defined functions the lib actually needs to bind
bound_functions=`node ../dist/print-bindings.js`

pushd src/h3lib/lib
# Copy size exports into C code
cp ../../../../build/sizes.h ../include
cp ../../../../build/sizes.c .
# Compile with emscripten
emcc -O3 -I ../include *.c -DH3_HAVE_VLA --memory-init-file 0 \
    -s WASM=0 -s INVOKE_RUN=0 \
    -s MODULARIZE_INSTANCE=1 -s EXPORT_NAME="'libh3'" -s EXPORT_ES6=1 \
    -s FILESYSTEM=0 -s NODEJS_CATCH_EXIT=0 -s NODEJS_CATCH_REJECTION=0 \
    -s TOTAL_MEMORY=33554432 -s ALLOW_MEMORY_GROWTH=1 -s WARN_UNALIGNED=1 \
    -s EXPORTED_FUNCTIONS=$bound_functions \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "getValue", "setValue"]' \
    "$@"
cp *.js ../../../../out
popd
popd
