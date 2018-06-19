/*
 * Copyright 2018 Uber Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * Prints an array of functions that need to be exported from the
 * transpiled C library.
 */

/* eslint-env node */
/* eslint-disable no-console */
const BINDINGS = require('../lib/bindings');

const bindingNames = BINDINGS
    // The _ prefix here is required for references in the built code
    .map(def => `_${def[0]}`)
    // Add core C functions required by the lib
    .concat(['_malloc', '_calloc']);

console.log(JSON.stringify(bindingNames));
