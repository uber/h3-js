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

const test = require('tape');
const fs = require('fs');
const path = require('path');
const h3core = require('../lib/h3core');

const BINDING_FUNCTIONS = fs
    .readFileSync(path.join(__dirname, '../out/binding-functions'), 'utf-8')
    .trim()
    .split(/\s+/);

// Exclude methods that don't make sense for the JS bindings
const EXCLUDE_METHODS = ['h3ToString', 'stringToH3'];

test('implementsBindingFunctions', assert => {
    BINDING_FUNCTIONS.forEach(fn => {
        if (EXCLUDE_METHODS.indexOf(fn) < 0) {
            assert.equal(typeof h3core[fn], 'function', `Implements binding function ${fn}`);
        }
    });
    assert.end();
});
