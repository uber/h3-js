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

/**
 * @module h3
 */

import C from '../out/libh3';
import BINDINGS from './bindings';
import {
    throwIfError,
    H3LibraryError,
    JSBindingError,
    E_RES_DOMAIN,
    E_UNKNOWN_UNIT,
    E_ARRAY_LENGTH,
    E_NULL_INDEX,
    E_CELL_INVALID,
    E_OPTION_INVALID,
    E_DIGIT_DOMAIN
} from './errors';

/**
 * Map of C-defined functions
 * @type {any}
 * @private
 */
const H3 = {};

// Create the bound functions themselves
BINDINGS.forEach(function bind(def) {
    H3[def[0]] = C.cwrap(...def);
});

// Alias the hexidecimal base for legibility
const BASE_16 = 16;

// Alias unused bits for legibility
const UNUSED_UPPER_32_BITS = 0;

// ----------------------------------------------------------------------------
// Byte size imports

const SZ_INT = 4;
const SZ_PTR = 4;
const SZ_DBL = 8;
const SZ_INT64 = 8;
const SZ_H3INDEX = H3.sizeOfH3Index();
const SZ_LATLNG = H3.sizeOfLatLng();
const SZ_CELLBOUNDARY = H3.sizeOfCellBoundary();
const SZ_GEOPOLYGON = H3.sizeOfGeoPolygon();
const SZ_GEOLOOP = H3.sizeOfGeoLoop();
const SZ_LINKED_GEOPOLYGON = H3.sizeOfLinkedGeoPolygon();
const SZ_COORDIJ = H3.sizeOfCoordIJ();

// ----------------------------------------------------------------------------
// Custom types

/**
 * 64-bit hexidecimal string representation of an H3 index
 * @static
 * @typedef {string} H3Index
 */

/**
 * 64-bit hexidecimal string representation of an H3 index,
 * or two 32-bit integers in little endian order in an array.
 * @static
 * @typedef {string | number[]} H3IndexInput
 */

/**
 * Coordinates as an `{i, j}` pair
 * @static
 * @typedef CoordIJ
 * @property {number} i
 * @property {number} j
 */

/**
 * Custom JS Error instance with an attached error code. Error codes come from the
 * core H3 library and can be found [in the H3 docs](https://h3geo.org/docs/library/errors#table-of-error-codes).
 * @static
 * @typedef H3Error
 * @property {string} message
 * @property {number} code
 */

/**
 * Pair of lat,lng coordinates (or lng,lat if GeoJSON output is specified)
 * @static
 * @typedef {number[]} CoordPair
 */

/**
 * Pair of lower,upper 32-bit ints representing a 64-bit value
 * @static
 * @typedef {number[]} SplitLong
 */

// ----------------------------------------------------------------------------
// Unit constants

/**
 * Length/Area units
 * @static
 * @property {string} m
 * @property {string} m2
 * @property {string} km
 * @property {string} km2
 * @property {string} rads
 * @property {string} rads2
 */
export const UNITS = {
    m: 'm',
    m2: 'm2',
    km: 'km',
    km2: 'km2',
    rads: 'rads',
    rads2: 'rads2'
};

// ----------------------------------------------------------------------------
// Flags

/**
 * Mode flags for polygonToCells
 * @static
 * @property {string} containmentCenter
 * @property {string} containmentFull
 * @property {string} containmentOverlapping
 * @property {string} containmentOverlappingBbox
 */
export const POLYGON_TO_CELLS_FLAGS = {
    containmentCenter: 'containmentCenter',
    containmentFull: 'containmentFull',
    containmentOverlapping: 'containmentOverlapping',
    containmentOverlappingBbox: 'containmentOverlappingBbox'
};

// ----------------------------------------------------------------------------
// Utilities and helpers

/**
 * @private
 * @param {string} flags Value from POLYGON_TO_CELLS_FLAGS
 * @returns {number} Flag value
 * @throws {H3Error} If invalid
 */
function polygonToCellsFlagsToNumber(flags) {
    switch (flags) {
        case POLYGON_TO_CELLS_FLAGS.containmentCenter:
            return 0;
        case POLYGON_TO_CELLS_FLAGS.containmentFull:
            return 1;
        case POLYGON_TO_CELLS_FLAGS.containmentOverlapping:
            return 2;
        case POLYGON_TO_CELLS_FLAGS.containmentOverlappingBbox:
            return 3;
        default:
            throw JSBindingError(E_OPTION_INVALID, flags);
    }
}

/**
 * Validate a resolution, throwing an error if invalid
 * @private
 * @param  {unknown} res Value to validate
 * @return {number}      Valid res
 * @throws {H3Error}     If invalid
 */
function validateRes(res) {
    if (typeof res !== 'number' || res < 0 || res > 15 || Math.floor(res) !== res) {
        throw H3LibraryError(E_RES_DOMAIN, res);
    }
    return res;
}

/**
 * Assert H3 index output, throwing an error if null
 * @private
 * @param {H3Index | null} h3Index    Index to validate
 * @return {H3Index}
 * @throws {H3Error}     If invalid
 */
function validateH3Index(h3Index) {
    if (!h3Index) throw JSBindingError(E_NULL_INDEX);
    return h3Index;
}

const MAX_JS_ARRAY_LENGTH = Math.pow(2, 32) - 1;

/**
 * Validate an array length. JS will throw its own error if you try
 * to create an array larger than 2^32 - 1, but validating beforehand
 * allows us to exit early before we try to process large amounts
 * of data that won't even fit in an output array
 * @private
 * @param  {number} length  Length to validate
 * @return {number}         Valid array length
 * @throws {H3Error}        If invalid
 */
function validateArrayLength(length) {
    if (length > MAX_JS_ARRAY_LENGTH) {
        throw JSBindingError(E_ARRAY_LENGTH, length);
    }
    return length;
}

const INVALID_HEXIDECIMAL_CHAR = /[^0-9a-fA-F]/;

/**
 * Convert an H3 index (64-bit hexidecimal string) into a "split long" - a pair of 32-bit ints
 * @param  {H3IndexInput} h3Index  H3 index to check
 * @return {SplitLong}             A two-element array with 32 lower bits and 32 upper bits
 */
export function h3IndexToSplitLong(h3Index) {
    if (
        Array.isArray(h3Index) &&
        h3Index.length === 2 &&
        Number.isInteger(h3Index[0]) &&
        Number.isInteger(h3Index[1])
    ) {
        return h3Index;
    }
    if (typeof h3Index !== 'string' || INVALID_HEXIDECIMAL_CHAR.test(h3Index)) {
        return [0, 0];
    }
    const upper = parseInt(h3Index.substring(0, h3Index.length - 8), BASE_16);
    const lower = parseInt(h3Index.substring(h3Index.length - 8), BASE_16);
    return [lower, upper];
}

/**
 * Convert a 32-bit int to a hexdecimal string
 * @private
 * @param  {number} num  Integer to convert
 * @return {H3Index}     Hexidecimal string
 */
function hexFrom32Bit(num) {
    if (num >= 0) {
        return num.toString(BASE_16);
    }

    // Handle negative numbers
    num = num & 0x7fffffff;
    let tempStr = zeroPad(8, num.toString(BASE_16));
    const topNum = (parseInt(tempStr[0], BASE_16) + 8).toString(BASE_16);
    tempStr = topNum + tempStr.substring(1);
    return tempStr;
}

/**
 * Get a H3 index string from a split long (pair of 32-bit ints)
 * @param  {number} lower Lower 32 bits
 * @param  {number} upper Upper 32 bits
 * @return {H3Index}       H3 index
 */
export function splitLongToH3Index(lower, upper) {
    return hexFrom32Bit(upper) + zeroPad(8, hexFrom32Bit(lower));
}

/**
 * Zero-pad a string to a given length
 * @private
 * @param  {number} fullLen Target length
 * @param  {string} numStr  String to zero-pad
 * @return {string}         Zero-padded string
 */
function zeroPad(fullLen, numStr) {
    const numZeroes = fullLen - numStr.length;
    let outStr = '';
    for (let i = 0; i < numZeroes; i++) {
        outStr += '0';
    }
    outStr = outStr + numStr;
    return outStr;
}

// One more than the max size of an unsigned 32-bit int.
// Dividing by this number is equivalent to num >>> 32
const UPPER_BIT_DIVISOR = Math.pow(2, 32);

/**
 * Convert a JS double-precision floating point number to a split long
 * @private
 * @param  {number} num  Number to convert
 * @return {SplitLong}     A two-element array with 32 lower bits and 32 upper bits
 */
function numberToSplitLong(num) {
    if (typeof num !== 'number') {
        return [0, 0];
    }
    return [num | 0, (num / UPPER_BIT_DIVISOR) | 0];
}

/**
 * Populate a C-appropriate GeoLoop struct from a polygon array
 * @private
 * @param  {number[][]} polygonArray  Polygon, as an array of coordinate pairs
 * @param  {number}  geoLoop          C pointer to a GeoLoop struct
 * @param  {boolean} isGeoJson        Whether coordinates are in [lng, lat] order per GeoJSON spec
 * @return {number}                   C pointer to populated GeoLoop struct
 */
function polygonArrayToGeoLoop(polygonArray, geoLoop, isGeoJson) {
    const numVerts = polygonArray.length;
    const geoCoordArray = C._calloc(numVerts, SZ_LATLNG);
    // Support [lng, lat] pairs if GeoJSON is specified
    const latIndex = isGeoJson ? 1 : 0;
    const lngIndex = isGeoJson ? 0 : 1;
    for (let i = 0; i < numVerts * 2; i += 2) {
        C.HEAPF64.set(
            [polygonArray[i / 2][latIndex], polygonArray[i / 2][lngIndex]].map(degsToRads),
            geoCoordArray / SZ_DBL + i
        );
    }
    C.HEAPU32.set([numVerts, geoCoordArray], geoLoop / SZ_INT);
    return geoLoop;
}

/**
 * Create a C-appropriate GeoPolygon struct from an array of polygons
 * @private
 * @param  {number[][][]} coordinates Array of polygons, each an array of coordinate pairs
 * @param  {boolean} isGeoJson        Whether coordinates are in [lng, lat] order per GeoJSON spec
 * @return {number}                   C pointer to populated GeoPolygon struct
 */
function coordinatesToGeoPolygon(coordinates, isGeoJson) {
    // Any loops beyond the first loop are holes
    const numHoles = coordinates.length - 1;
    const geoPolygon = C._calloc(SZ_GEOPOLYGON);
    // Byte positions within the struct
    const geoLoopOffset = 0;
    const numHolesOffset = geoLoopOffset + SZ_GEOLOOP;
    const holesOffset = numHolesOffset + SZ_INT;
    // geoLoop is first part of struct
    polygonArrayToGeoLoop(coordinates[0], geoPolygon + geoLoopOffset, isGeoJson);
    let holes;
    if (numHoles > 0) {
        holes = C._calloc(numHoles, SZ_GEOLOOP);
        for (let i = 0; i < numHoles; i++) {
            polygonArrayToGeoLoop(coordinates[i + 1], holes + SZ_GEOLOOP * i, isGeoJson);
        }
    }
    C.setValue(geoPolygon + numHolesOffset, numHoles, 'i32');
    C.setValue(geoPolygon + holesOffset, holes, 'i32');
    return geoPolygon;
}

/**
 * Free memory allocated for a GeoPolygon struct. It is an error to access the struct
 * after passing it to this method.
 * @private
 * @param {number} geoPolygon     C pointer to GeoPolygon struct
 * @return {void}
 */
function destroyGeoPolygon(geoPolygon) {
    // Byte positions within the struct
    const geoLoopOffset = 0;
    const numHolesOffset = geoLoopOffset + SZ_GEOLOOP;
    const holesOffset = numHolesOffset + SZ_INT;
    // Offset of the geoLoop vertex array pointer within the GeoLoop struct
    const geoLoopArrayOffset = SZ_INT;
    // Free the outer vertex array
    C._free(C.getValue(geoPolygon + geoLoopOffset + geoLoopArrayOffset, 'i8*'));
    // Free the vertex array for the holes, if any
    const numHoles = C.getValue(geoPolygon + numHolesOffset, 'i32');
    if (numHoles > 0) {
        const holes = C.getValue(geoPolygon + holesOffset, 'i32');
        for (let i = 0; i < numHoles; i++) {
            C._free(C.getValue(holes + SZ_GEOLOOP * i + geoLoopArrayOffset, 'i8*'));
        }
        C._free(holes);
    }
    C._free(geoPolygon);
}

/**
 * Read an H3 index from a pointer to C memory.
 * @private
 * @param  {number} cAddress  Pointer to allocated C memory
 * @param {number} offset     Offset, in number of H3 indexes, in case we're
 *                            reading an array
 * @return {H3Index | null}   H3 index, or null if index was invalid
 */
function readH3IndexFromPointer(cAddress, offset = 0) {
    const lower = C.getValue(cAddress + SZ_H3INDEX * offset, 'i32');
    const upper = C.getValue(cAddress + SZ_H3INDEX * offset + SZ_INT, 'i32');
    // The lower bits are allowed to be 0s, but if the upper bits are 0
    // this represents an invalid H3 index
    return upper ? splitLongToH3Index(lower, upper) : null;
}

/**
 * Read a boolean (32 bit) from a pointer to C memory.
 * @private
 * @param  {number} cAddress  Pointer to allocated C memory
 * @param {number} offset     Offset, in number of booleans, in case we're
 *                            reading an array
 * @return {Boolean} Boolean value
 */
function readBooleanFromPointer(cAddress, offset = 0) {
    const val = C.getValue(cAddress + SZ_INT * offset, 'i32');
    return Boolean(val);
}

/**
 * Read a double from a pointer to C memory.
 * @private
 * @param  {number} cAddress  Pointer to allocated C memory
 * @param {number} offset     Offset, in number of doubles, in case we're
 *                            reading an array
 * @return {number} Double value
 */
function readDoubleFromPointer(cAddress, offset = 0) {
    return C.getValue(cAddress + SZ_DBL * offset, 'double');
}

/**
 * Read a 64-bit int from a pointer to C memory into a JS 64-bit float.
 * Note that this may lose precision if larger than MAX_SAFE_INTEGER
 * @private
 * @param  {number} cAddress  Pointer to allocated C memory
 * @return {number} Double value
 */
function readInt64AsDoubleFromPointer(cAddress) {
    return H3.readInt64AsDoubleFromPointer(cAddress);
}

/**
 * Store an H3 index in C memory. Primarily used as an efficient way to
 * write sets of hexagons.
 * @private
 * @param  {H3IndexInput} h3Index  H3 index to store
 * @param  {number} cAddress  Pointer to allocated C memory
 * @param {number} offset     Offset, in number of H3 indexes from beginning
 *                            of the current array
 */
function storeH3Index(h3Index, cAddress, offset) {
    // HEAPU32 is a typed array projection on the index space
    // as unsigned 32-bit integers. This means the index needs
    // to be divided by SZ_INT (4) to access correctly. Also,
    // the H3 index is 64 bits, so we skip by twos as we're writing
    // to 32-bit integers in the proper order.
    C.HEAPU32.set(h3IndexToSplitLong(h3Index), cAddress / SZ_INT + 2 * offset);
}

/**
 * Read an array of 64-bit H3 indexes from C and convert to a JS array of
 * H3 index strings
 * @private
 * @param  {number} cAddress    Pointer to C ouput array
 * @param  {number} maxCount    Max number of hexagons in array. Hexagons with
 *                              the value 0 will be skipped, so this isn't
 *                              necessarily the length of the output array.
 * @return {H3Index[]}          Array of H3 indexes
 */
function readArrayOfH3Indexes(cAddress, maxCount) {
    const out = [];
    for (let i = 0; i < maxCount; i++) {
        const h3Index = readH3IndexFromPointer(cAddress, i);
        if (h3Index !== null) {
            out.push(h3Index);
        }
    }
    return out;
}

/**
 * Store an array of H3 index strings as a C array of 64-bit integers.
 * @private
 * @param  {number} cAddress    Pointer to C input array
 * @param  {H3IndexInput[]} hexagons H3 indexes to pass to the C lib
 */
function storeArrayOfH3Indexes(cAddress, hexagons) {
    // Assuming the cAddress points to an already appropriately
    // allocated space
    const count = hexagons.length;
    for (let i = 0; i < count; i++) {
        storeH3Index(hexagons[i], cAddress, i);
    }
}

/**
 * Populate a C-appropriate LatLng struct from a [lat, lng] array
 * @private
 * @param {number} lat     Coordinate latitude
 * @param {number} lng     Coordinate longitude
 * @return {number}        C pointer to populated LatLng struct
 */
function storeLatLng(lat, lng) {
    const geoCoord = C._calloc(1, SZ_LATLNG);
    C.HEAPF64.set([lat, lng].map(degsToRads), geoCoord / SZ_DBL);
    return geoCoord;
}

/**
 * Read a single lat or lng value
 * @private
 * @param  {number} cAddress Pointer to C value
 * @return {number}
 */
function readSingleCoord(cAddress) {
    return radsToDegs(C.getValue(cAddress, 'double'));
}

/**
 * Read a LatLng from C and return a [lat, lng] pair.
 * @private
 * @param  {number} cAddress    Pointer to C struct
 * @return {CoordPair}          [lat, lng] pair
 */
function readLatLng(cAddress) {
    return [readSingleCoord(cAddress), readSingleCoord(cAddress + SZ_DBL)];
}

/**
 * Read a LatLng from C and return a GeoJSON-style [lng, lat] pair.
 * @private
 * @param  {number} cAddress    Pointer to C struct
 * @return {CoordPair}          [lng, lat] pair
 */
function readLatLngGeoJson(cAddress) {
    return [readSingleCoord(cAddress + SZ_DBL), readSingleCoord(cAddress)];
}

/**
 * Read the CellBoundary structure into a list of geo coordinate pairs
 * @private
 * @param {number}  cellBoundary       C pointer to CellBoundary struct
 * @param {boolean} [geoJsonCoords]    Whether to provide GeoJSON coordinate order: [lng, lat]
 * @param {boolean} [closedLoop]       Whether to close the loop
 * @return {CoordPair[]}               Array of geo coordinate pairs
 */
function readCellBoundary(cellBoundary, geoJsonCoords, closedLoop) {
    const numVerts = C.getValue(cellBoundary, 'i32');
    // Note that though numVerts is an int, the coordinate doubles have to be
    // aligned to 8 bytes, hence the 8-byte offset here
    const vertsPos = cellBoundary + SZ_DBL;
    const out = [];
    // Support [lng, lat] pairs if GeoJSON is specified
    const readCoord = geoJsonCoords ? readLatLngGeoJson : readLatLng;
    for (let i = 0; i < numVerts * 2; i += 2) {
        out.push(readCoord(vertsPos + SZ_DBL * i));
    }
    if (closedLoop) {
        // Close loop if GeoJSON is specified
        out.push(out[0]);
    }
    return out;
}

/**
 * Read the LinkedGeoPolygon structure into a nested array of MultiPolygon coordinates
 * @private
 * @param {number}  polygon           C pointer to LinkedGeoPolygon struct
 * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output: [lng, lat], closed loops
 * @return {CoordPair[][][]}          MultiPolygon-style output.
 */
function readMultiPolygon(polygon, formatAsGeoJson) {
    const output = [];
    const readCoord = formatAsGeoJson ? readLatLngGeoJson : readLatLng;
    let loops;
    let loop;
    let coords;
    let coord;
    // Loop through the linked structure, building the output
    while (polygon) {
        output.push((loops = []));
        // Follow ->first pointer
        loop = C.getValue(polygon, 'i8*');
        while (loop) {
            loops.push((coords = []));
            // Follow ->first pointer
            coord = C.getValue(loop, 'i8*');
            while (coord) {
                coords.push(readCoord(coord));
                // Follow ->next pointer
                coord = C.getValue(coord + SZ_DBL * 2, 'i8*');
            }
            if (formatAsGeoJson) {
                // Close loop if GeoJSON is requested
                coords.push(coords[0]);
            }
            // Follow ->next pointer
            loop = C.getValue(loop + SZ_PTR * 2, 'i8*');
        }
        // Follow ->next pointer
        polygon = C.getValue(polygon + SZ_PTR * 2, 'i8*');
    }
    return output;
}

/**
 * Read a CoordIJ from C and return an {i, j} pair.
 * @private
 * @param  {number} cAddress    Pointer to C struct
 * @return {CoordIJ}            {i, j} pair
 */
function readCoordIJ(cAddress) {
    return {
        i: C.getValue(cAddress, 'i32'),
        j: C.getValue(cAddress + SZ_INT, 'i32')
    };
}

/**
 * Store an {i, j} pair to a C CoordIJ struct.
 * @private
 * @param  {number} cAddress    Pointer to C memory
 * @param {CoordIJ} ij          {i,j} pair to store
 * @return {void}
 */
function storeCoordIJ(cAddress, {i, j}) {
    C.setValue(cAddress, i, 'i32');
    C.setValue(cAddress + SZ_INT, j, 'i32');
}

/**
 * Read an array of positive integers array from C. Negative
 * values are considered invalid and ignored in output.
 * @private
 * @param  {number} cAddress    Pointer to C array
 * @param  {number} count       Length of C array
 * @return {number[]}           Javascript integer array
 */
function readArrayOfPositiveIntegers(cAddress, count) {
    const out = [];
    for (let i = 0; i < count; i++) {
        const int = C.getValue(cAddress + SZ_INT * i, 'i32');
        if (int >= 0) {
            out.push(int);
        }
    }
    return out;
}

// ----------------------------------------------------------------------------
// Public API functions: Core

/**
 * Whether a given string represents a valid H3 cell index
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to check
 * @return {boolean}          Whether the cell index is valid
 */
export function isValidCell(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    return Boolean(H3.isValidCell(lower, upper));
}

/**
 * Whether a given string represents a valid H3 index
 * (e.g. it may be a cell, directed edge, vertex.)
 * Use <code>isValidCell</code> to check for a valid
 * hexagon (or pentagon) cell ID.
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to check
 * @return {boolean}          Whether the index is valid
 */
export function isValidIndex(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    return Boolean(H3.isValidIndex(lower, upper));
}

/**
 * Whether the given H3 index is a pentagon
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to check
 * @return {boolean}          isPentagon
 */
export function isPentagon(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    return Boolean(H3.isPentagon(lower, upper));
}

/**
 * Whether the given H3 index is in a Class III resolution (rotated versus
 * the icosahedron and subject to shape distortion adding extra points on
 * icosahedron edges, making them not true hexagons).
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to check
 * @return {boolean}          isResClassIII
 */
export function isResClassIII(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    return Boolean(H3.isResClassIII(lower, upper));
}

/**
 * Get the number of the base cell for a given H3 index
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to get the base cell for
 * @return {number}           Index of the base cell (0-121)
 */
export function getBaseCellNumber(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    return H3.getBaseCellNumber(lower, upper);
}

/**
 * Get the number of the indexing digit for an H3 index
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to get the digit for
 * @param  {number} digit          Indexing digit to get the valeu of
 * @return {number}           Digit (0-7)
 */
export function getIndexDigit(h3Index, digit) {
    const out = C._malloc(SZ_INT);
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    try {
        throwIfError(H3.getIndexDigit(lower, upper, digit, out));
        return C.getValue(out, 'i32');
    } finally {
        C._free(out);
    }
}

/**
 * Get the indices of all icosahedron faces intersected by a given H3 index
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to get faces for
 * @return {number[]}              Indices (0-19) of all intersected faces
 * @throws {H3Error}               If input is invalid
 */
export function getIcosahedronFaces(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const countPtr = C._malloc(SZ_INT);
    try {
        throwIfError(H3.maxFaceCount(lower, upper, countPtr));
        const count = C.getValue(countPtr, 'i32');
        const faces = C._malloc(SZ_INT * count);
        try {
            throwIfError(H3.getIcosahedronFaces(lower, upper, faces));
            return readArrayOfPositiveIntegers(faces, count);
        } finally {
            C._free(faces);
        }
    } finally {
        C._free(countPtr);
    }
}

/**
 * Returns the resolution of an H3 index
 * @static
 * @param  {H3IndexInput} h3Index H3 index to get resolution
 * @return {number}          The number (0-15) resolution, or -1 if invalid
 */
export function getResolution(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    if (!H3.isValidCell(lower, upper)) {
        // Compatability with stated API
        return -1;
    }
    return H3.getResolution(lower, upper);
}

/**
 * Creates a cell from its components (resolution, base cell number, and indexing digits).
 * This is the inverse operation of `getResolution`, `getBaseCellNumber`, and `getIndexDigit`.
 * Only allows creating valid cells.
 *
 * @static
 * @param  {number}   baseCellNumber Base cell number of cell to return
 * @param  {number[]} digits Indexing digits of cell to return
 * @param  {number}   res Resolution of cell to return. Optional, if not specified, will be inferred from digits.
 * @return {H3Index}    H3 index
 * @throws {H3Error}    If input is invalid
 */
export function constructCell(baseCellNumber, digits, res) {
    if (res === undefined) {
        res = digits.length;
    }
    if (digits.length !== res) {
        throw H3LibraryError(E_DIGIT_DOMAIN, digits.length);
    }
    if (digits.length > 15) {
        throw H3LibraryError(E_DIGIT_DOMAIN, digits.length);
    }

    const digitsMemory = C._malloc(SZ_INT * digits.length);
    const h3Index = C._malloc(SZ_H3INDEX);
    try {
        digits.forEach((value, idx) => {
            C.setValue(digitsMemory + SZ_INT * idx, value, 'i32');
        });

        throwIfError(H3.constructCell(res, baseCellNumber, digitsMemory, h3Index));
        return validateH3Index(readH3IndexFromPointer(h3Index));
    } finally {
        C._free(h3Index);
        C._free(digitsMemory);
    }
}

/**
 * Get the hexagon (or pentagon) containing a lat,lon point
 * @static
 * @param  {number} lat Latitude of point
 * @param  {number} lng Longtitude of point
 * @param  {number} res Resolution of cell to return
 * @return {H3Index}    H3 index
 * @throws {H3Error}    If input is invalid
 */
export function latLngToCell(lat, lng, res) {
    const latLng = C._malloc(SZ_LATLNG);
    // Slightly more efficient way to set the memory
    C.HEAPF64.set([lat, lng].map(degsToRads), latLng / SZ_DBL);
    // Read value as a split long
    const h3Index = C._malloc(SZ_H3INDEX);
    try {
        throwIfError(H3.latLngToCell(latLng, res, h3Index));
        return validateH3Index(readH3IndexFromPointer(h3Index));
    } finally {
        C._free(h3Index);
        C._free(latLng);
    }
}

/**
 * Get the lat,lon center of a given hexagon (or pentagon)
 * @static
 * @param  {H3IndexInput} h3Index  H3 index
 * @return {CoordPair}             Point as a [lat, lng] pair
 * @throws {H3Error}               If input is invalid
 */
export function cellToLatLng(h3Index) {
    const latLng = C._malloc(SZ_LATLNG);
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    try {
        throwIfError(H3.cellToLatLng(lower, upper, latLng));
        return readLatLng(latLng);
    } finally {
        C._free(latLng);
    }
}

/**
 * Get the vertices of a given hexagon (or pentagon), as an array of [lat, lng]
 * points. For pentagons and hexagons on the edge of an icosahedron face, this
 * function may return up to 10 vertices.
 * @static
 * @param  {H3IndexInput} h3Index          H3 index
 * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output: [lng, lat], closed loops
 * @return {CoordPair[]}              Array of [lat, lng] pairs
 * @throws {H3Error}                  If input is invalid
 */
export function cellToBoundary(h3Index, formatAsGeoJson) {
    const cellBoundary = C._malloc(SZ_CELLBOUNDARY);
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    try {
        throwIfError(H3.cellToBoundary(lower, upper, cellBoundary));
        return readCellBoundary(cellBoundary, formatAsGeoJson, formatAsGeoJson);
    } finally {
        C._free(cellBoundary);
    }
}

// ----------------------------------------------------------------------------
// Public API functions: Algorithms

/**
 * Get the parent of the given hexagon at a particular resolution
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to get parent for
 * @param  {number} res       Resolution of hexagon to return
 * @return {H3Index}          H3 index of parent, or null for invalid input
 * @throws {H3Error}          If input is invalid
 */
export function cellToParent(h3Index, res) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const parent = C._malloc(SZ_H3INDEX);
    try {
        throwIfError(H3.cellToParent(lower, upper, res, parent));
        return validateH3Index(readH3IndexFromPointer(parent));
    } finally {
        C._free(parent);
    }
}

/**
 * Get the children/descendents of the given hexagon at a particular resolution
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to get children for
 * @param  {number} res       Resolution of hexagons to return
 * @return {H3Index[]}        H3 indexes of children, or empty array for invalid input
 * @throws {H3Error}          If resolution is invalid or output is too large for JS
 */
export function cellToChildren(h3Index, res) {
    // Bad input in this case can potentially result in high computation volume
    // using the current C algorithm. Validate and return an empty array on failure.
    if (!isValidCell(h3Index)) {
        return [];
    }
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const count = validateArrayLength(cellToChildrenSize(h3Index, res));
    const hexagons = C._calloc(count, SZ_H3INDEX);
    try {
        throwIfError(H3.cellToChildren(lower, upper, res, hexagons));
        return readArrayOfH3Indexes(hexagons, count);
    } finally {
        C._free(hexagons);
    }
}

/**
 * Get the number of children for a cell at a given resolution
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to get child count for
 * @param  {number} res            Child resolution
 * @return {number}                Number of children at res for the given cell
 * @throws {H3Error}               If cell or parentRes are invalid
 */
export function cellToChildrenSize(h3Index, res) {
    if (!isValidCell(h3Index)) {
        throw H3LibraryError(E_CELL_INVALID);
    }
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const countPtr = C._malloc(SZ_INT64);
    try {
        throwIfError(H3.cellToChildrenSize(lower, upper, res, countPtr));
        return readInt64AsDoubleFromPointer(countPtr);
    } finally {
        C._free(countPtr);
    }
}

/**
 * Get the center child of the given hexagon at a particular resolution
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to get center child for
 * @param  {number} res       Resolution of cell to return
 * @return {H3Index}          H3 index of child, or null for invalid input
 * @throws {H3Error}          If resolution is invalid
 */
export function cellToCenterChild(h3Index, res) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const centerChild = C._malloc(SZ_H3INDEX);
    try {
        throwIfError(H3.cellToCenterChild(lower, upper, res, centerChild));
        return validateH3Index(readH3IndexFromPointer(centerChild));
    } finally {
        C._free(centerChild);
    }
}

/**
 * Get the position of the cell within an ordered list of all children of the
 * cell's parent at the specified resolution.
 * @static
 * @param  {H3IndexInput} h3Index  H3 index to get child pos for
 * @param  {number} parentRes      Resolution of reference parent
 * @return {number}                Position of child within parent at parentRes
 * @throws {H3Error}               If cell or parentRes are invalid
 */
export function cellToChildPos(h3Index, parentRes) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const childPos = C._malloc(SZ_INT64);
    try {
        throwIfError(H3.cellToChildPos(lower, upper, parentRes, childPos));
        return readInt64AsDoubleFromPointer(childPos);
    } finally {
        C._free(childPos);
    }
}

/**
 * Get the child cell at a given position within an ordered list of all children
 * at the specified resolution
 * @static
 * @param  {number} childPos       Position of the child cell to get
 * @param  {H3IndexInput} h3Index  H3 index of the parent cell
 * @param  {number} childRes       Resolution of child cell to return
 * @return {H3Index}          H3 index of child
 * @throws {H3Error}          If input is invalid
 */
export function childPosToCell(childPos, h3Index, childRes) {
    const [cpLower, cpUpper] = numberToSplitLong(childPos);
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const child = C._malloc(SZ_H3INDEX);
    try {
        throwIfError(H3.childPosToCell(cpLower, cpUpper, lower, upper, childRes, child));
        return validateH3Index(readH3IndexFromPointer(child));
    } finally {
        C._free(child);
    }
}

/**
 * Get all hexagons in a k-ring around a given center. The order of the hexagons is undefined.
 * @static
 * @param  {H3IndexInput} h3Index  H3 index of center hexagon
 * @param  {number} ringSize  Radius of k-ring
 * @return {H3Index[]}        H3 indexes for all hexagons in ring
 * @throws {H3Error}          If input is invalid or output is too large for JS
 */
export function gridDisk(h3Index, ringSize) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const countPtr = C._malloc(SZ_INT64);
    try {
        throwIfError(H3.maxGridDiskSize(ringSize, countPtr));
        const count = validateArrayLength(readInt64AsDoubleFromPointer(countPtr));
        const hexagons = C._calloc(count, SZ_H3INDEX);
        try {
            throwIfError(H3.gridDisk(lower, upper, ringSize, hexagons));
            return readArrayOfH3Indexes(hexagons, count);
        } finally {
            C._free(hexagons);
        }
    } finally {
        C._free(countPtr);
    }
}

/**
 * Get all hexagons in a k-ring around a given center, in an array of arrays
 * ordered by distance from the origin. The order of the hexagons within each ring is undefined.
 * @static
 * @param  {H3IndexInput} h3Index  H3 index of center hexagon
 * @param  {number} ringSize  Radius of k-ring
 * @return {H3Index[][]}      Array of arrays with H3 indexes for all hexagons each ring
 * @throws {H3Error}          If input is invalid or output is too large for JS
 */
export function gridDiskDistances(h3Index, ringSize) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const countPtr = C._malloc(SZ_INT64);
    try {
        throwIfError(H3.maxGridDiskSize(ringSize, countPtr));
        const count = validateArrayLength(readInt64AsDoubleFromPointer(countPtr));
        const kRings = C._calloc(count, SZ_H3INDEX);
        const distances = C._calloc(count, SZ_INT);
        try {
            throwIfError(H3.gridDiskDistances(lower, upper, ringSize, kRings, distances));
            /**
             * An array of empty arrays to hold the output
             * @type {string[][]}
             * @private
             */
            const out = [];
            for (let i = 0; i < ringSize + 1; i++) {
                out.push([]);
            }
            // Read the array of hexagons, putting them into the appropriate rings
            for (let i = 0; i < count; i++) {
                const cell = readH3IndexFromPointer(kRings, i);
                const index = C.getValue(distances + SZ_INT * i, 'i32');
                // eslint-disable-next-line max-depth
                if (cell !== null) {
                    out[index].push(cell);
                }
            }
            return out;
        } finally {
            C._free(kRings);
            C._free(distances);
        }
    } finally {
        C._free(countPtr);
    }
}

/**
 * Get all hexagons in a hollow hexagonal ring centered at origin with sides of a given length.
 * @static
 * @param  {H3IndexInput} h3Index  H3 index of center hexagon
 * @param  {number} ringSize  Radius of ring
 * @return {H3Index[]}        H3 indexes for all hexagons in ring
 * @throws {Error}            If the algorithm could not calculate the ring
 * @throws {H3Error}          If input is invalid
 */
export function gridRing(h3Index, ringSize) {
    const maxCount = ringSize === 0 ? 1 : 6 * ringSize;
    const hexagons = C._calloc(maxCount, SZ_H3INDEX);
    try {
        throwIfError(H3.gridRing(...h3IndexToSplitLong(h3Index), ringSize, hexagons));
        return readArrayOfH3Indexes(hexagons, maxCount);
    } finally {
        C._free(hexagons);
    }
}

/**
 * Get all hexagons in a hollow hexagonal ring centered at origin with sides of a given length.
 * Unlike gridDisk, this function will throw an error if there is a pentagon anywhere in the ring.
 * @static
 * @param  {H3IndexInput} h3Index  H3 index of center hexagon
 * @param  {number} ringSize  Radius of ring
 * @return {H3Index[]}        H3 indexes for all hexagons in ring
 * @throws {Error}            If the algorithm could not calculate the ring
 * @throws {H3Error}          If input is invalid
 */
export function gridRingUnsafe(h3Index, ringSize) {
    const maxCount = ringSize === 0 ? 1 : 6 * ringSize;
    const hexagons = C._calloc(maxCount, SZ_H3INDEX);
    try {
        throwIfError(H3.gridRingUnsafe(...h3IndexToSplitLong(h3Index), ringSize, hexagons));
        return readArrayOfH3Indexes(hexagons, maxCount);
    } finally {
        C._free(hexagons);
    }
}

/**
 * Get all hexagons with centers contained in a given polygon. The polygon
 * is specified with GeoJson semantics as an array of loops. Each loop is
 * an array of [lat, lng] pairs (or [lng, lat] if isGeoJson is specified).
 * The first loop is the perimeter of the polygon, and subsequent loops are
 * expected to be holes.
 * @static
 * @param  {number[][] | number[][][]} coordinates
 *                                  Array of loops, or a single loop
 * @param  {number} res             Resolution of hexagons to return
 * @param  {boolean} [isGeoJson]    Whether to expect GeoJson-style [lng, lat]
 *                                  pairs instead of [lat, lng]
 * @return {H3Index[]}              H3 indexes for all hexagons in polygon
 * @throws {H3Error}                If input is invalid or output is too large for JS
 */
export function polygonToCells(coordinates, res, isGeoJson) {
    validateRes(res);
    isGeoJson = Boolean(isGeoJson);
    // Guard against empty input
    if (coordinates.length === 0 || coordinates[0].length === 0) {
        return [];
    }
    // Wrap to expected format if a single loop is provided
    const polygon = typeof coordinates[0][0] === 'number' ? [coordinates] : coordinates;
    const geoPolygon = coordinatesToGeoPolygon(
        // @ts-expect-error - There's no way to convince TS that polygon is now number[][][]
        polygon,
        isGeoJson
    );
    const countPtr = C._malloc(SZ_INT64);
    try {
        throwIfError(H3.maxPolygonToCellsSize(geoPolygon, res, 0, countPtr));
        const count = validateArrayLength(readInt64AsDoubleFromPointer(countPtr));
        const hexagons = C._calloc(count, SZ_H3INDEX);
        try {
            throwIfError(H3.polygonToCells(geoPolygon, res, 0, hexagons));
            return readArrayOfH3Indexes(hexagons, count);
        } finally {
            C._free(hexagons);
        }
    } finally {
        C._free(countPtr);
        destroyGeoPolygon(geoPolygon);
    }
}

/**
 * Get all hexagons with centers contained in a given polygon. The polygon
 * is specified with GeoJson semantics as an array of loops. Each loop is
 * an array of [lat, lng] pairs (or [lng, lat] if isGeoJson is specified).
 * The first loop is the perimeter of the polygon, and subsequent loops are
 * expected to be holes.
 * @static
 * @param  {number[][] | number[][][]} coordinates
 *                                  Array of loops, or a single loop
 * @param  {number} res             Resolution of hexagons to return
 * @param  {string} flags           Value from POLYGON_TO_CELLS_FLAGS
 * @param  {boolean} [isGeoJson]    Whether to expect GeoJson-style [lng, lat]
 *                                  pairs instead of [lat, lng]
 * @return {H3Index[]}              H3 indexes for all hexagons in polygon
 * @throws {H3Error}                If input is invalid or output is too large for JS
 */
export function polygonToCellsExperimental(coordinates, res, flags, isGeoJson) {
    validateRes(res);
    isGeoJson = Boolean(isGeoJson);
    const flagsInt = polygonToCellsFlagsToNumber(flags);
    // Guard against empty input
    if (coordinates.length === 0 || coordinates[0].length === 0) {
        return [];
    }
    // Wrap to expected format if a single loop is provided
    const polygon = typeof coordinates[0][0] === 'number' ? [coordinates] : coordinates;
    const geoPolygon = coordinatesToGeoPolygon(
        // @ts-expect-error - There's no way to convince TS that polygon is now number[][][]
        polygon,
        isGeoJson
    );
    const countPtr = C._malloc(SZ_INT64);
    try {
        throwIfError(H3.maxPolygonToCellsSizeExperimental(geoPolygon, res, flagsInt, countPtr));
        const count = validateArrayLength(readInt64AsDoubleFromPointer(countPtr));
        const hexagons = C._calloc(count, SZ_H3INDEX);
        try {
            throwIfError(
                H3.polygonToCellsExperimental(
                    geoPolygon,
                    res,
                    flagsInt,
                    count,
                    UNUSED_UPPER_32_BITS,
                    hexagons
                )
            );
            return readArrayOfH3Indexes(hexagons, count);
        } finally {
            C._free(hexagons);
        }
    } finally {
        C._free(countPtr);
        destroyGeoPolygon(geoPolygon);
    }
}

/**
 * Get the outlines of a set of H3 hexagons, returned in GeoJSON MultiPolygon
 * format (an array of polygons, each with an array of loops, each an array of
 * coordinates). Coordinates are returned as [lat, lng] pairs unless GeoJSON
 * is requested.
 *
 * It is the responsibility of the caller to ensure that all hexagons in the
 * set have the same resolution and that the set contains no duplicates. Behavior
 * is undefined if duplicates or multiple resolutions are present, and the
 * algorithm may produce unexpected or invalid polygons.
 *
 * @static
 * @param {H3IndexInput[]} h3Indexes  H3 indexes to get outlines for
 * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output: [lng, lat], closed loops
 * @return {CoordPair[][][]}          MultiPolygon-style output.
 * @throws {H3Error}                  If input is invalid
 */
export function cellsToMultiPolygon(h3Indexes, formatAsGeoJson) {
    // Early exit on empty input
    if (!h3Indexes || !h3Indexes.length) {
        return [];
    }
    // Set up input set
    const indexCount = h3Indexes.length;
    const set = C._calloc(indexCount, SZ_H3INDEX);
    storeArrayOfH3Indexes(set, h3Indexes);
    // Allocate memory for output linked polygon
    const polygon = C._calloc(SZ_LINKED_GEOPOLYGON);
    try {
        throwIfError(H3.cellsToLinkedMultiPolygon(set, indexCount, polygon));
        return readMultiPolygon(polygon, formatAsGeoJson);
    } finally {
        // Clean up
        H3.destroyLinkedMultiPolygon(polygon);
        C._free(polygon);
        C._free(set);
    }
}

/**
 * Compact a set of hexagons of the same resolution into a set of hexagons across
 * multiple levels that represents the same area.
 * @static
 * @param  {H3IndexInput[]} h3Set H3 indexes to compact
 * @return {H3Index[]}       Compacted H3 indexes
 * @throws {H3Error}         If the input is invalid (e.g. duplicate hexagons)
 */
export function compactCells(h3Set) {
    if (!h3Set || !h3Set.length) {
        return [];
    }
    // Set up input set
    const count = h3Set.length;
    const set = C._calloc(count, SZ_H3INDEX);
    storeArrayOfH3Indexes(set, h3Set);
    // Allocate memory for compacted hexagons, worst-case is no compaction
    const compactedSet = C._calloc(count, SZ_H3INDEX);
    try {
        throwIfError(H3.compactCells(set, compactedSet, count, UNUSED_UPPER_32_BITS));
        return readArrayOfH3Indexes(compactedSet, count);
    } finally {
        C._free(set);
        C._free(compactedSet);
    }
}

/**
 * Uncompact a compacted set of hexagons to hexagons of the same resolution
 * @static
 * @param  {H3IndexInput[]} compactedSet H3 indexes to uncompact
 * @param  {number}    res          The resolution to uncompact to
 * @return {H3Index[]}              The uncompacted H3 indexes
 * @throws {H3Error}                If the input is invalid (e.g. invalid resolution)
 */
export function uncompactCells(compactedSet, res) {
    validateRes(res);
    if (!compactedSet || !compactedSet.length) {
        return [];
    }
    // Set up input set
    const count = compactedSet.length;
    const set = C._calloc(count, SZ_H3INDEX);
    storeArrayOfH3Indexes(set, compactedSet);
    // Estimate how many hexagons we need (always overestimates if in error)
    const uncompactCellSizePtr = C._malloc(SZ_INT64);
    try {
        throwIfError(
            H3.uncompactCellsSize(set, count, UNUSED_UPPER_32_BITS, res, uncompactCellSizePtr)
        );
        const uncompactCellSize = validateArrayLength(
            readInt64AsDoubleFromPointer(uncompactCellSizePtr)
        );
        // Allocate memory for uncompacted hexagons
        const uncompactedSet = C._calloc(uncompactCellSize, SZ_H3INDEX);
        try {
            throwIfError(
                H3.uncompactCells(
                    set,
                    count,
                    UNUSED_UPPER_32_BITS,
                    uncompactedSet,
                    uncompactCellSize,
                    UNUSED_UPPER_32_BITS,
                    res
                )
            );
            return readArrayOfH3Indexes(uncompactedSet, uncompactCellSize);
        } finally {
            C._free(set);
            C._free(uncompactedSet);
        }
    } finally {
        C._free(uncompactCellSizePtr);
    }
}

// ----------------------------------------------------------------------------
// Public API functions: Directed edges

/**
 * Whether two H3 indexes are neighbors (share an edge)
 * @static
 * @param  {H3IndexInput} origin      Origin hexagon index
 * @param  {H3IndexInput} destination Destination hexagon index
 * @return {boolean}             Whether the hexagons share an edge
 * @throws {H3Error}             If the input is invalid
 */
export function areNeighborCells(origin, destination) {
    const [oLower, oUpper] = h3IndexToSplitLong(origin);
    const [dLower, dUpper] = h3IndexToSplitLong(destination);
    const out = C._malloc(SZ_INT);
    try {
        throwIfError(H3.areNeighborCells(oLower, oUpper, dLower, dUpper, out));
        return readBooleanFromPointer(out);
    } finally {
        C._free(out);
    }
}

/**
 * Get an H3 index representing a unidirectional edge for a given origin and destination
 * @static
 * @param  {H3IndexInput} origin      Origin hexagon index
 * @param  {H3IndexInput} destination Destination hexagon index
 * @return {H3Index}             H3 index of the edge, or null if no edge is shared
 * @throws {H3Error}             If the input is invalid
 */
export function cellsToDirectedEdge(origin, destination) {
    const [oLower, oUpper] = h3IndexToSplitLong(origin);
    const [dLower, dUpper] = h3IndexToSplitLong(destination);
    const h3Index = C._malloc(SZ_H3INDEX);
    try {
        throwIfError(H3.cellsToDirectedEdge(oLower, oUpper, dLower, dUpper, h3Index));
        return validateH3Index(readH3IndexFromPointer(h3Index));
    } finally {
        C._free(h3Index);
    }
}

/**
 * Get the origin hexagon from an H3 index representing a unidirectional edge
 * @static
 * @param  {H3IndexInput} edgeIndex H3 index of the edge
 * @return {H3Index}           H3 index of the edge origin
 * @throws {H3Error}           If the input is invalid
 */
export function getDirectedEdgeOrigin(edgeIndex) {
    const [lower, upper] = h3IndexToSplitLong(edgeIndex);
    const h3Index = C._malloc(SZ_H3INDEX);
    try {
        throwIfError(H3.getDirectedEdgeOrigin(lower, upper, h3Index));
        return validateH3Index(readH3IndexFromPointer(h3Index));
    } finally {
        C._free(h3Index);
    }
}

/**
 * Get the destination hexagon from an H3 index representing a unidirectional edge
 * @static
 * @param  {H3IndexInput} edgeIndex H3 index of the edge
 * @return {H3Index}           H3 index of the edge destination
 * @throws {H3Error}           If the input is invalid
 */
export function getDirectedEdgeDestination(edgeIndex) {
    const [lower, upper] = h3IndexToSplitLong(edgeIndex);
    const h3Index = C._malloc(SZ_H3INDEX);
    try {
        throwIfError(H3.getDirectedEdgeDestination(lower, upper, h3Index));
        return validateH3Index(readH3IndexFromPointer(h3Index));
    } finally {
        C._free(h3Index);
    }
}

/**
 * Whether the input is a valid unidirectional edge
 * @static
 * @param  {H3IndexInput} edgeIndex H3 index of the edge
 * @return {boolean}           Whether the index is valid
 */
export function isValidDirectedEdge(edgeIndex) {
    const [lower, upper] = h3IndexToSplitLong(edgeIndex);
    return Boolean(H3.isValidDirectedEdge(lower, upper));
}

/**
 * Get the [origin, destination] pair represented by a unidirectional edge
 * @static
 * @param  {H3IndexInput} edgeIndex H3 index of the edge
 * @return {H3Index[]}         [origin, destination] pair as H3 indexes
 * @throws {H3Error}           If the input is invalid
 */
export function directedEdgeToCells(edgeIndex) {
    const [lower, upper] = h3IndexToSplitLong(edgeIndex);
    const count = 2;
    const hexagons = C._calloc(count, SZ_H3INDEX);
    try {
        throwIfError(H3.directedEdgeToCells(lower, upper, hexagons));
        return readArrayOfH3Indexes(hexagons, count);
    } finally {
        C._free(hexagons);
    }
}

/**
 * Get all of the unidirectional edges with the given H3 index as the origin (i.e. an edge to
 * every neighbor)
 * @static
 * @param  {H3IndexInput} h3Index   H3 index of the origin hexagon
 * @return {H3Index[]}         List of unidirectional edges
 * @throws {H3Error}           If the input is invalid
 */
export function originToDirectedEdges(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const count = 6;
    const edges = C._calloc(count, SZ_H3INDEX);
    try {
        throwIfError(H3.originToDirectedEdges(lower, upper, edges));
        return readArrayOfH3Indexes(edges, count);
    } finally {
        C._free(edges);
    }
}

/**
 * Get the vertices of a given edge as an array of [lat, lng] points. Note that for edges that
 * cross the edge of an icosahedron face, this may return 3 coordinates.
 * @static
 * @param  {H3IndexInput} edgeIndex        H3 index of the edge
 * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output: [lng, lat]
 * @return {CoordPair[]}              Array of geo coordinate pairs
 * @throws {H3Error}                  If the input is invalid
 */
export function directedEdgeToBoundary(edgeIndex, formatAsGeoJson) {
    const cellBoundary = C._malloc(SZ_CELLBOUNDARY);
    const [lower, upper] = h3IndexToSplitLong(edgeIndex);
    try {
        throwIfError(H3.directedEdgeToBoundary(lower, upper, cellBoundary));
        return readCellBoundary(cellBoundary, formatAsGeoJson);
    } finally {
        C._free(cellBoundary);
    }
}

/**
 * Get the grid distance between two hex indexes. This function may fail
 * to find the distance between two indexes if they are very far apart or
 * on opposite sides of a pentagon.
 * @static
 * @param  {H3IndexInput} origin      Origin hexagon index
 * @param  {H3IndexInput} destination Destination hexagon index
 * @return {number}          Distance between hexagons
 * @throws {H3Error}         If input is invalid or the distance could not be calculated
 */
export function gridDistance(origin, destination) {
    const [oLower, oUpper] = h3IndexToSplitLong(origin);
    const [dLower, dUpper] = h3IndexToSplitLong(destination);
    const countPtr = C._malloc(SZ_INT64);
    try {
        throwIfError(H3.gridDistance(oLower, oUpper, dLower, dUpper, countPtr));
        return readInt64AsDoubleFromPointer(countPtr);
    } finally {
        C._free(countPtr);
    }
}

/**
 * Given two H3 indexes, return the line of indexes between them (inclusive).
 *
 * This function may fail to find the line between two indexes, for
 * example if they are very far apart. It may also fail when finding
 * distances for indexes on opposite sides of a pentagon.
 *
 * Notes:
 *
 *  - The specific output of this function should not be considered stable
 *    across library versions. The only guarantees the library provides are
 *    that the line length will be `h3Distance(start, end) + 1` and that
 *    every index in the line will be a neighbor of the preceding index.
 *  - Lines are drawn in grid space, and may not correspond exactly to either
 *    Cartesian lines or great arcs.
 *
 * @static
 * @param  {H3IndexInput} origin      Origin hexagon index
 * @param  {H3IndexInput} destination Destination hexagon index
 * @return {H3Index[]}           H3 indexes connecting origin and destination
 * @throws {H3Error}             If input is invalid or the line cannot be calculated
 */
export function gridPathCells(origin, destination) {
    const [oLower, oUpper] = h3IndexToSplitLong(origin);
    const [dLower, dUpper] = h3IndexToSplitLong(destination);
    const countPtr = C._malloc(SZ_INT64);
    try {
        throwIfError(H3.gridPathCellsSize(oLower, oUpper, dLower, dUpper, countPtr));
        const count = validateArrayLength(readInt64AsDoubleFromPointer(countPtr));
        const hexagons = C._calloc(count, SZ_H3INDEX);
        try {
            H3.gridPathCells(oLower, oUpper, dLower, dUpper, hexagons);
            return readArrayOfH3Indexes(hexagons, count);
        } finally {
            C._free(hexagons);
        }
    } finally {
        C._free(countPtr);
    }
}

const LOCAL_IJ_DEFAULT_MODE = 0;

/**
 * Produces IJ coordinates for an H3 index anchored by an origin.
 *
 * - The coordinate space used by this function may have deleted
 * regions or warping due to pentagonal distortion.
 * - Coordinates are only comparable if they come from the same
 * origin index.
 * - Failure may occur if the index is too far away from the origin
 * or if the index is on the other side of a pentagon.
 * - This function is experimental, and its output is not guaranteed
 * to be compatible across different versions of H3.
 * @static
 * @param  {H3IndexInput} origin      Origin H3 index
 * @param  {H3IndexInput} destination H3 index for which to find relative coordinates
 * @return {CoordIJ}             Coordinates as an `{i, j}` pair
 * @throws {H3Error}             If the IJ coordinates cannot be calculated
 */
export function cellToLocalIj(origin, destination) {
    const ij = C._malloc(SZ_COORDIJ);
    try {
        throwIfError(
            H3.cellToLocalIj(
                ...h3IndexToSplitLong(origin),
                ...h3IndexToSplitLong(destination),
                LOCAL_IJ_DEFAULT_MODE,
                ij
            )
        );
        return readCoordIJ(ij);
    } finally {
        C._free(ij);
    }
}

/**
 * Produces an H3 index for IJ coordinates anchored by an origin.
 *
 * - The coordinate space used by this function may have deleted
 * regions or warping due to pentagonal distortion.
 * - Coordinates are only comparable if they come from the same
 * origin index.
 * - Failure may occur if the index is too far away from the origin
 * or if the index is on the other side of a pentagon.
 * - This function is experimental, and its output is not guaranteed
 * to be compatible across different versions of H3.
 * @static
 * @param  {H3IndexInput} origin     Origin H3 index
 * @param  {CoordIJ} coords     Coordinates as an `{i, j}` pair
 * @return {H3Index}            H3 index at the relative coordinates
 * @throws {H3Error}            If the H3 index cannot be calculated
 */
export function localIjToCell(origin, coords) {
    // Validate input coords
    if (!coords || typeof coords.i !== 'number' || typeof coords.j !== 'number') {
        throw new Error('Coordinates must be provided as an {i, j} object');
    }
    // Allocate memory for the CoordIJ struct and an H3 index to hold the return value
    const ij = C._malloc(SZ_COORDIJ);
    const out = C._malloc(SZ_H3INDEX);
    storeCoordIJ(ij, coords);
    try {
        throwIfError(
            H3.localIjToCell(...h3IndexToSplitLong(origin), ij, LOCAL_IJ_DEFAULT_MODE, out)
        );
        return validateH3Index(readH3IndexFromPointer(out));
    } finally {
        C._free(ij);
        C._free(out);
    }
}

// ----------------------------------------------------------------------------
// Public API functions: Distance/area utilities

/**
 * Great circle distance between two geo points. This is not specific to H3,
 * but is implemented in the library and provided here as a convenience.
 * @static
 * @param  {number[]} latLng1 Origin coordinate as [lat, lng]
 * @param  {number[]} latLng2 Destination coordinate as [lat, lng]
 * @param  {string}   unit    Distance unit (either UNITS.m, UNITS.km, or UNITS.rads)
 * @return {number}           Great circle distance
 * @throws {H3Error}          If the unit is invalid
 */
export function greatCircleDistance(latLng1, latLng2, unit) {
    const coord1 = storeLatLng(latLng1[0], latLng1[1]);
    const coord2 = storeLatLng(latLng2[0], latLng2[1]);
    let result;
    switch (unit) {
        case UNITS.m:
            result = H3.greatCircleDistanceM(coord1, coord2);
            break;
        case UNITS.km:
            result = H3.greatCircleDistanceKm(coord1, coord2);
            break;
        case UNITS.rads:
            result = H3.greatCircleDistanceRads(coord1, coord2);
            break;
        default:
            result = null;
    }
    C._free(coord1);
    C._free(coord2);
    if (result === null) {
        throw JSBindingError(E_UNKNOWN_UNIT, unit);
    }
    return result;
}

/**
 * Exact area of a given cell
 * @static
 * @param  {H3IndexInput} h3Index  H3 index of the hexagon to measure
 * @param  {string}  unit     Distance unit (either UNITS.m2, UNITS.km2, or UNITS.rads2)
 * @return {number}           Cell area
 * @throws {H3Error}          If the input is invalid
 */
export function cellArea(h3Index, unit) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const out = C._malloc(SZ_DBL);
    try {
        switch (unit) {
            case UNITS.m2:
                throwIfError(H3.cellAreaM2(lower, upper, out));
                break;
            case UNITS.km2:
                throwIfError(H3.cellAreaKm2(lower, upper, out));
                break;
            case UNITS.rads2:
                throwIfError(H3.cellAreaRads2(lower, upper, out));
                break;
            default:
                throw JSBindingError(E_UNKNOWN_UNIT, unit);
        }
        return readDoubleFromPointer(out);
    } finally {
        C._free(out);
    }
}

/**
 * Calculate length of a given unidirectional edge
 * @static
 * @param  {H3IndexInput} edge     H3 index of the edge to measure
 * @param  {string}  unit     Distance unit (either UNITS.m, UNITS.km, or UNITS.rads)
 * @return {number}           Cell area
 * @throws {H3Error}          If the input is invalid
 */
export function edgeLength(edge, unit) {
    const [lower, upper] = h3IndexToSplitLong(edge);
    const out = C._malloc(SZ_DBL);
    try {
        switch (unit) {
            case UNITS.m:
                throwIfError(H3.edgeLengthM(lower, upper, out));
                break;
            case UNITS.km:
                throwIfError(H3.edgeLengthKm(lower, upper, out));
                break;
            case UNITS.rads:
                throwIfError(H3.edgeLengthRads(lower, upper, out));
                break;
            default:
                throw JSBindingError(E_UNKNOWN_UNIT, unit);
        }
        return readDoubleFromPointer(out);
    } finally {
        C._free(out);
    }
}

/**
 * Average hexagon area at a given resolution
 * @static
 * @param  {number} res  Hexagon resolution
 * @param  {string} unit Area unit (either UNITS.m2, UNITS.km2, or UNITS.rads2)
 * @return {number}      Average area
 * @throws {H3Error}     If the input is invalid
 */
export function getHexagonAreaAvg(res, unit) {
    validateRes(res);
    const out = C._malloc(SZ_DBL);
    try {
        switch (unit) {
            case UNITS.m2:
                throwIfError(H3.getHexagonAreaAvgM2(res, out));
                break;
            case UNITS.km2:
                throwIfError(H3.getHexagonAreaAvgKm2(res, out));
                break;
            default:
                throw JSBindingError(E_UNKNOWN_UNIT, unit);
        }
        return readDoubleFromPointer(out);
    } finally {
        C._free(out);
    }
}

/**
 * Average hexagon edge length at a given resolution
 * @static
 * @param  {number} res  Hexagon resolution
 * @param  {string} unit Distance unit (either UNITS.m, UNITS.km, or UNITS.rads)
 * @return {number}      Average edge length
 * @throws {H3Error}     If the input is invalid
 */
export function getHexagonEdgeLengthAvg(res, unit) {
    validateRes(res);
    const out = C._malloc(SZ_DBL);
    try {
        switch (unit) {
            case UNITS.m:
                throwIfError(H3.getHexagonEdgeLengthAvgM(res, out));
                break;
            case UNITS.km:
                throwIfError(H3.getHexagonEdgeLengthAvgKm(res, out));
                break;
            default:
                throw JSBindingError(E_UNKNOWN_UNIT, unit);
        }
        return readDoubleFromPointer(out);
    } finally {
        C._free(out);
    }
}

// ----------------------------------------------------------------------------
// Public API functions: Vertex mode

/**
 * Find the index for a vertex of a cell.
 * @static
 * @param {H3IndexInput} h3Index     Cell to find the vertex for
 * @param {number} vertexNum         Number (index) of the vertex to calculate
 * @return {H3Index}     Vertex index
 * @throws {H3Error}     If the input is invalid
 */
export function cellToVertex(h3Index, vertexNum) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const vertexIndex = C._malloc(SZ_H3INDEX);
    try {
        throwIfError(H3.cellToVertex(lower, upper, vertexNum, vertexIndex));
        return validateH3Index(readH3IndexFromPointer(vertexIndex));
    } finally {
        C._free(vertexIndex);
    }
}

/**
 * Find the indexes for all vertexes of a cell.
 * @static
 * @param {H3IndexInput} h3Index     Cell to find all vertexes for
 * @return {H3Index[]}   All vertex indexes of this cell
 * @throws {H3Error}     If the input is invalid
 */
export function cellToVertexes(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    const maxNumVertexes = 6;
    const vertexIndexes = C._calloc(maxNumVertexes, SZ_H3INDEX);
    try {
        throwIfError(H3.cellToVertexes(lower, upper, vertexIndexes));
        return readArrayOfH3Indexes(vertexIndexes, maxNumVertexes);
    } finally {
        C._free(vertexIndexes);
    }
}

/**
 * Get the lat, lng of a given vertex
 * @static
 * @param {H3IndexInput} h3Index A vertex index
 * @returns {CoordPair}          Latitude, longitude coordinates of the vertex
 * @throws {H3Error}             If the input is invalid
 */
export function vertexToLatLng(h3Index) {
    const latlng = C._malloc(SZ_LATLNG);
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    try {
        throwIfError(H3.vertexToLatLng(lower, upper, latlng));
        return readLatLng(latlng);
    } finally {
        C._free(latlng);
    }
}

/**
 * Returns true if the input is a valid vertex index.
 * @static
 * @param {H3IndexInput} h3Index An index to test for being a vertex index
 * @returns {boolean} True if the index represents a vertex
 */
export function isValidVertex(h3Index) {
    const [lower, upper] = h3IndexToSplitLong(h3Index);
    return Boolean(H3.isValidVertex(lower, upper));
}

// ----------------------------------------------------------------------------
// Public informational utilities

/**
 * The total count of hexagons in the world at a given resolution. Note that above
 * resolution 8 the exact count cannot be represented in a JavaScript 32-bit number,
 * so consumers should use caution when applying further operations to the output.
 * @static
 * @param  {number} res  Hexagon resolution
 * @return {number}      Count
 * @throws {H3Error}     If the resolution is invalid
 */
export function getNumCells(res) {
    validateRes(res);
    const countPtr = C._malloc(SZ_INT64);
    try {
        // Get number as a long value
        throwIfError(H3.getNumCells(res, countPtr));
        return readInt64AsDoubleFromPointer(countPtr);
    } finally {
        C._free(countPtr);
    }
}

/**
 * Get all H3 indexes at resolution 0. As every index at every resolution > 0 is
 * the descendant of a res 0 index, this can be used with h3ToChildren to iterate
 * over H3 indexes at any resolution.
 * @static
 * @return {H3Index[]}  All H3 indexes at res 0
 */
export function getRes0Cells() {
    const count = H3.res0CellCount();
    const hexagons = C._malloc(SZ_H3INDEX * count);
    try {
        throwIfError(H3.getRes0Cells(hexagons));
        return readArrayOfH3Indexes(hexagons, count);
    } finally {
        C._free(hexagons);
    }
}

/**
 * Get the twelve pentagon indexes at a given resolution.
 * @static
 * @param  {number} res  Hexagon resolution
 * @return {H3Index[]}   All H3 pentagon indexes at res
 * @throws {H3Error}     If the resolution is invalid
 */
export function getPentagons(res) {
    validateRes(res);
    const count = H3.pentagonCount();
    const hexagons = C._malloc(SZ_H3INDEX * count);
    try {
        throwIfError(H3.getPentagons(res, hexagons));
        return readArrayOfH3Indexes(hexagons, count);
    } finally {
        C._free(hexagons);
    }
}

/**
 * Convert degrees to radians
 * @static
 * @param  {number} deg Value in degrees
 * @return {number}     Value in radians
 */
export function degsToRads(deg) {
    return (deg * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 * @static
 * @param  {number} rad Value in radians
 * @return {number}     Value in degrees
 */
export function radsToDegs(rad) {
    return (rad * 180) / Math.PI;
}
