/*
 * Copyright 2018-2019 Uber Technologies, Inc.
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

import test from 'tape';
import fs from 'fs';
import path from 'path';
import * as h3core from '../lib/h3core.js';

const BINDING_FUNCTIONS = fs
    .readFileSync(path.join(__dirname, '../out/binding-functions'), 'utf-8')
    .trim()
    .split(/\s+/);

// Exclude methods that don't make sense for the JS bindings
const EXCLUDE_METHODS = ['h3ToString', 'stringToH3', 'describeH3Error'];

test('implementsBindingFunctions', assert => {
    BINDING_FUNCTIONS.forEach(fn => {
        if (EXCLUDE_METHODS.indexOf(fn) < 0) {
            assert.equal(typeof h3core[fn], 'function', `Implements binding function ${fn}`);
        }
    });
    assert.end();
});
