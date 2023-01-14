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

const LIBH3_PATH = path.join(__dirname, '../out/libh3.js');

const ORIGINAL_DOCUMENT_REGEX = /if\(document.currentScript\)/;
const PATCHED_DOCUMENT_REGEX = /if\(typeof document!=="undefined" && document.currentScript\)/;

test('validateLIBH3HasDocumentUndefinedFix', assert => {
    // Validate that the bundle does not contain a bug that prevents h3-js to be imported into webworkers and react native.
    // Problem was fixed in a later version of emscripten however there are significant performance regressions when upgrading.
    // See #163 and #117 for more details.
    const fileContents = fs.readFileSync(LIBH3_PATH, {encoding: 'utf8', flag: 'r'});
    assert.doesNotMatch(fileContents, ORIGINAL_DOCUMENT_REGEX, 'bundle was not patched');
    assert.match(fileContents, PATCHED_DOCUMENT_REGEX, 'bundle was not patched');
    assert.end();
});