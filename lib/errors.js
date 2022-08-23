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

// Error codes from the code library, aliased here for legibility
export const E_SUCCESS = 0;
export const E_FAILED = 1;
export const E_DOMAIN = 2;
export const E_LATLNG_DOMAIN = 3;
export const E_RES_DOMAIN = 4;
export const E_CELL_INVALID = 5;
export const E_DIR_EDGE_INVALID = 6;
export const E_UNDIR_EDGE_INVALID = 7;
export const E_VERTEX_INVALID = 8;
export const E_PENTAGON = 9;
export const E_DUPLICATE_INPUT = 10;
export const E_NOT_NEIGHBORS = 11;
export const E_RES_MISMATCH = 12;
export const E_MEMORY_ALLOC = 13;
export const E_MEMORY_BOUNDS = 14;
export const E_OPTION_INVALID = 15;

/**
 * Error messages corresponding to the core library error codes. See
 * https://h3geo.org/docs/library/errors#table-of-error-codes
 * @private
 */
const H3_ERROR_MSGS = {
    [E_SUCCESS]: 'Success',
    [E_FAILED]: 'The operation failed but a more specific error is not available',
    [E_DOMAIN]: 'Argument was outside of acceptable range',
    [E_LATLNG_DOMAIN]: 'Latitude or longitude arguments were outside of acceptable range',
    [E_RES_DOMAIN]: 'Resolution argument was outside of acceptable range',
    [E_CELL_INVALID]: 'Cell argument was not valid',
    [E_DIR_EDGE_INVALID]: 'Directed edge argument was not valid',
    [E_UNDIR_EDGE_INVALID]: 'Undirected edge argument was not valid',
    [E_VERTEX_INVALID]: 'Vertex argument was not valid',
    [E_PENTAGON]: 'Pentagon distortion was encountered',
    [E_DUPLICATE_INPUT]: 'Duplicate input',
    [E_NOT_NEIGHBORS]: 'Cell arguments were not neighbors',
    [E_RES_MISMATCH]: 'Cell arguments had incompatible resolutions',
    [E_MEMORY_ALLOC]: 'Memory allocation failed',
    [E_MEMORY_BOUNDS]: 'Bounds of provided memory were insufficient',
    [E_OPTION_INVALID]: 'Mode or flags argument was not valid'
};

// Error codes for JS errors thrown in the bindings
export const E_UNKNOWN_UNIT = 1000;
export const E_ARRAY_LENGTH = 1001;
export const E_NULL_INDEX = 1002;

/**
 * Error messages for errors thrown in the binding code. These don't strictly
 * need error codes, but it's simpler to treat all of the errors consistently
 * @private
 */
const JS_ERROR_MESSAGES = {
    [E_UNKNOWN_UNIT]: 'Unknown unit',
    [E_ARRAY_LENGTH]: 'Array length out of bounds',
    [E_NULL_INDEX]: 'Got unexpected null value for H3 index'
};

const UNKNOWN_ERROR_MSG = 'Unknown error';

/**
 * Create an error with an attached code
 * @private
 * @param {Record<number, string>} messages  Map of code-to-messages to use
 * @param {number} errCode                   Numeric error code
 * @param {{value: unknown} | {}} [meta]     Metadata with value to associate with the error
 */
function createError(messages, errCode, meta) {
    // The error value may be "undefined", so check if the argument was provided
    const hasValue = meta && 'value' in meta;
    // Throw a custom error type with the code attached
    const err = new Error(
        `${messages[errCode] || UNKNOWN_ERROR_MSG} (code: ${errCode}${
            hasValue ? `, value: ${meta.value}` : ''
        })`
    );
    // @ts-expect-error - TS doesn't like extending Error
    err.code = errCode;
    return err;
}

/**
 * Custom error for H3Error codes
 * @private
 * @param {number} errCode     Error code from the H3 library
 * @param {unknown} [value]    Value to associate with the error, if any
 * @returns {Error}
 */
export function H3LibraryError(errCode, value) {
    // The error value may be "undefined", so check if the argument was provided
    const meta = arguments.length === 2 ? {value} : {};
    return createError(H3_ERROR_MSGS, errCode, meta);
}

/**
 * Custom errors thrown from the JS bindings.
 * @private
 * @param {number} errCode     Error code from the H3 library
 * @param {unknown} [value]    Value to associate with the error, if any
 * @returns {Error}
 */
export function JSBindingError(errCode, value) {
    // The error value may be "undefined", so check if the argument was provided
    const meta = arguments.length === 2 ? {value} : {};
    return createError(JS_ERROR_MESSAGES, errCode, meta);
}

/**
 * Throw a JavaScript error if the C library return code is an error
 * @private
 * @param {number} errCode     Error code from the H3 library
 * @throws {Error} Error if err is not E_SUCCESS (0)
 */
export function throwIfError(errCode) {
    if (errCode !== 0) {
        throw H3LibraryError(errCode);
    }
}
