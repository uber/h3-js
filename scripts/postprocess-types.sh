#!/usr/bin/env bash

# Copyright 2022 Uber Technologies, Inc.
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

# Set the correct module name (h3-js). By default this is set to the name of the
# input module being transpiled, and not to the package name. 
sed 's/module "h3core"/module "h3-js"/g' dist/types.d.ts > types.d.ts.tmp

# Because we encode our types in JSDoc, we are limited by JSDoc support. In particular, 
# JSDoc does not support the tuple type, so this line post-processes the definition of 
# several types we intend to be tuples from number[] to [number, number].
sed -E -e 's/(CoordPair|SplitLong) = number\[\]/\1 = [number,number]/g' types.d.ts.tmp > dist/types.d.ts

rm types.d.ts.tmp