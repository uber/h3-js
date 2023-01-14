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

const BUNDLES = fs
    .readdirSync(path.join(__dirname, '../dist'), 'utf-8')
    .filter(fileName => fileName.endsWith('.js'));
const BROWSER_BUNDLES = fs
    .readdirSync(path.join(__dirname, '../dist/browser'), 'utf-8')
    .filter(fileName => fileName.endsWith('.js'));

const ORIGINAL_DOCUMENT_REGEX = /if\(document.currentScript\)/;

function validateBundle(assert, filePath) {
    // Validate that the bundle does not contain a bug that prevents h3-js to be imported into webworkers and react native.
    // Problem was fixed in a later version of emscripten however there are significant performance regressions when upgrading.
    // See #163 and #117 for more details.
    const fileContents = fs.readFileSync(filePath, {encoding: 'utf8', flag: 'r'});
    assert.doesNotMatch(fileContents, ORIGINAL_DOCUMENT_REGEX, 'bundle was not patched');
}

test('validateNodeBundlesHaveDocumentUndefinedFix', assert => {
    BUNDLES.forEach(file => {
        validateBundle(assert, path.join(__dirname, '../dist', file));
    });
    assert.end();
});

test('validateBrowserBundlesHaveDocumentUndefinedFix', assert => {
    BROWSER_BUNDLES.forEach(file => {
        validateBundle(assert, path.join(__dirname, '../dist/browser', file));
    });
    assert.end();
});
