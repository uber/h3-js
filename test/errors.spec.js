/*
 * Copyright 2018-2019, 2022 Uber Technologies, Inc.
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
import {H3LibraryError, JSBindingError, E_FAILED, E_UNKNOWN_UNIT} from '../lib/errors';

test('H3LibraryError', assert => {
    const err = H3LibraryError(E_FAILED);
    assert.ok(err instanceof Error, 'got Error');
    assert.equal(err.code, E_FAILED, 'got expected code');
    assert.ok(/\(code: 1\)$/.test(err.message), 'got expected message');
    assert.end();
});

test('H3LibraryError - value', assert => {
    const err = H3LibraryError(E_FAILED, 42);
    assert.ok(err instanceof Error, 'got Error');
    assert.equal(err.code, E_FAILED, 'got expected code');
    assert.ok(/\(code: 1, value: 42\)$/.test(err.message), 'got expected message');
    assert.end();
});

test('H3LibraryError - unknown code', assert => {
    const err = H3LibraryError('spam');
    assert.ok(err instanceof Error, 'got Error');
    assert.equal(err.code, 'spam', 'got expected code');
    assert.ok(/Unknown/.test(err.message), 'got expected message');
    assert.end();
});

test('JSBindingError', assert => {
    const err = JSBindingError(E_UNKNOWN_UNIT);
    assert.ok(err instanceof Error, 'got Error');
    assert.equal(err.code, E_UNKNOWN_UNIT, 'got expected code');
    assert.ok(/\(code: 1000\)$/.test(err.message), 'got expected message');
    assert.end();
});

test('JSBindingError - value', assert => {
    const err = JSBindingError(E_UNKNOWN_UNIT, 42);
    assert.ok(err instanceof Error, 'got Error');
    assert.equal(err.code, E_UNKNOWN_UNIT, 'got expected code');
    assert.ok(/\(code: 1000, value: 42\)$/.test(err.message), 'got expected message');
    assert.end();
});

test('JSBindingError - unknown code', assert => {
    const err = JSBindingError('spam');
    assert.ok(err instanceof Error, 'got Error');
    assert.equal(err.code, 'spam', 'got expected code');
    assert.ok(/Unknown/.test(err.message), 'got expected message');
    assert.end();
});
