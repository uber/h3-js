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
import * as h3 from '../lib/h3core';
import {
    E_FAILED,
    E_DOMAIN,
    E_LATLNG_DOMAIN,
    E_RES_DOMAIN,
    E_CELL_INVALID,
    E_DIR_EDGE_INVALID,
    E_PENTAGON,
    E_DUPLICATE_INPUT,
    E_NOT_NEIGHBORS,
    E_RES_MISMATCH,
    E_UNKNOWN_UNIT,
    E_ARRAY_LENGTH,
    E_OPTION_INVALID
} from '../lib/errors';

const GEO_PRECISION = 12;

function toLowPrecision(maybeNumber) {
    if (typeof maybeNumber === 'number') {
        return Number(maybeNumber.toPrecision(GEO_PRECISION));
    }
    if (Array.isArray(maybeNumber)) {
        return maybeNumber.map(toLowPrecision);
    }
    throw new Error(`Unhandled type: ${maybeNumber}`);
}

function almostEqual(a, b, factor = 1e-6) {
    return Math.abs(a - b) < a * factor;
}

// Assert a vertex loop regardless of starting vertex
function assertLoop(assert, loop, expected, isGeoJSON) {
    // Drop the repeated vertex if GeoJSON
    if (isGeoJSON) {
        loop = loop.slice(0, -1);
    }
    // Find the start index
    const index = loop.findIndex(
        vertex => toLowPrecision(vertex).join(',') === toLowPrecision(expected[0]).join(',')
    );
    assert.ok(index >= 0, 'Found start index in loop');
    // Wrap the loop to the right start index
    loop = loop.slice(index).concat(loop.slice(0, index));
    // Close GeoJSON loops
    if (isGeoJSON) {
        loop.push(loop[0]);
    }
    assert.deepEqual(loop, expected, 'Got expected loop (independent of starting vertex)');
}

function assertPolygon(assert, input, expected, isGeoJSON) {
    assert.equal(input.length, expected.length, 'Polygon has expected number of loops');
    for (let i = 0; i < input.length; i++) {
        assertLoop(assert, input[i], expected[i], isGeoJSON);
    }
}

function assertMultiPolygon(assert, input, expected, isGeoJSON) {
    assert.equal(input.length, expected.length, 'MultiPolygon has expected number of polygons');
    for (let i = 0; i < input.length; i++) {
        assertPolygon(assert, input[i], expected[i], isGeoJSON);
    }
}

// Helper - make a polygon from a unit circle with an arbitrary number of vertices
function makePolygon(numVerts, radius = 1) {
    const interval = (2 * Math.PI) / numVerts;
    const polygon = [];
    for (let i = 0; i < numVerts; i++) {
        const theta = interval * i;
        polygon.push([radius * Math.cos(theta), radius * Math.sin(theta)]);
    }
    return polygon;
}

test('isValidCell', assert => {
    assert.ok(h3.isValidCell('85283473fffffff'), 'H3 index is considered an index');
    assert.ok(h3.isValidCell('821C37FFFFFFFFF'), 'H3 index in upper case is considered an index');
    assert.ok(
        h3.isValidCell('085283473fffffff'),
        'H3 index with leading zero is considered an index'
    );
    assert.ok(
        !h3.isValidCell('ff283473fffffff'),
        'Hexidecimal string with incorrect bits is not valid'
    );
    assert.ok(!h3.isValidCell('85283q73fffffff'), 'String with non-hexidecimal chars is not valid');
    assert.ok(
        !h3.isValidCell('85283473fffffff112233'),
        'String with additional parsed chars is not valid'
    );
    assert.ok(
        !h3.isValidCell('85283473fffffff_lolwut'),
        'String with additional unparsed chars is not valid'
    );
    assert.ok(
        !h3.isValidCell('8a283081f1f1f1f1f1f5505ffff'),
        'String with extraneous parsable characters in the middle is not valid'
    );
    assert.ok(
        !h3.isValidCell('8a28308_hello_world_5505ffff'),
        'String with extraneous unparsable characters in the middle is not valid'
    );
    assert.ok(!h3.isValidCell('lolwut'), 'Random string is not considered an index');
    assert.ok(!h3.isValidCell(null), 'Null is not considered an index');
    assert.ok(!h3.isValidCell(), 'Undefined is not considered an index');
    assert.ok(!h3.isValidCell({}), 'Object is not considered an index');
    for (let res = 0; res < 16; res++) {
        assert.ok(
            h3.isValidCell(h3.latLngToCell(37, -122, res)),
            'H3 index is considered an index'
        );
    }
    assert.end();
});

test('isValidCell split long', assert => {
    assert.ok(h3.isValidCell([0x3fffffff, 0x8528347]), 'Integer H3 index is considered an index');
    assert.ok(
        !h3.isValidCell([0x73fffffff, 0xff2834]),
        'Integer with incorrect bits is not considered an index'
    );
    assert.ok(!h3.isValidCell([]), 'Empty array is not valid');
    assert.ok(!h3.isValidCell([1]), 'Array with a single element is not valid');
    assert.ok(
        !h3.isValidCell([0x3fffffff, 0x8528347, 0]),
        'Array with an additional element is not valid'
    );
    assert.end();
});

test('latLngToCell', assert => {
    const h3Index = h3.latLngToCell(37.3615593, -122.0553238, 5);
    assert.equal(h3Index, '85283473fffffff', 'Got the expected H3 index back');
    const ffffffffAddress = h3.latLngToCell(30.943387, -164.991559, 5);
    assert.equal(ffffffffAddress, '8547732ffffffff', 'Properly handle 8 Fs');
    const centralAddress = h3.latLngToCell(46.04189431883772, 71.52790329909925, 15);
    assert.equal(centralAddress, '8f2000000000000', 'Properly handle leading zeros');
    assert.end();
});

test('latLngToCell - longitude wrapping', assert => {
    const h3Index = h3.latLngToCell(37.3615593, -122.0553238 + 360.0, 5);
    assert.equal(h3Index, '85283473fffffff', 'world-wrapping lng accepted');
    assert.end();
});

test('latLngToCell - invalid lat/lng', assert => {
    assert.throws(
        () => h3.latLngToCell(Infinity, 0, 5),
        {code: E_LATLNG_DOMAIN},
        'non-finite lat throws'
    );
    assert.throws(
        () => h3.latLngToCell(0, Infinity, 5),
        {code: E_LATLNG_DOMAIN},
        'non-finite lng throws'
    );
    assert.throws(
        () => h3.latLngToCell(NaN, 0, 5),
        {code: E_LATLNG_DOMAIN},
        'non-finite lat throws'
    );
    assert.throws(
        () => h3.latLngToCell('spam', 0, 5),
        {code: E_LATLNG_DOMAIN},
        'non-numeric lat throws'
    );
    assert.throws(() => h3.latLngToCell(0, NaN, 5), {code: E_LATLNG_DOMAIN}, 'NaN lng throws');
    assert.end();
});

test('getResolution', assert => {
    assert.equal(h3.getResolution(), -1, 'Got an invalid resolution back with no query');
    for (let res = 0; res < 16; res++) {
        const h3Index = h3.latLngToCell(37.3615593, -122.0553238, res);
        assert.equal(h3.getResolution(h3Index), res, 'Got the expected resolution back');
    }
    assert.end();
});

test('getResolution - integers', assert => {
    for (let res = 0; res < 16; res++) {
        // Same as in h3GetResolution above
        const h3Index = h3.latLngToCell(37.3615593, -122.0553238, res);
        const h3IndexInt = h3.h3IndexToSplitLong(h3Index);
        assert.equal(h3.getResolution(h3IndexInt), res, 'Got the expected resolution back for int');
    }
    assert.end();
});

test('cellToLatLng', assert => {
    const latlng = h3.cellToLatLng('85283473fffffff');
    assert.deepEqual(
        toLowPrecision(latlng),
        toLowPrecision([37.34579337536848, -121.97637597255124]),
        'lat/lng matches expected'
    );
    assert.end();
});

test('cellToLatLng - Integer', assert => {
    const latlng = h3.cellToLatLng([0x3fffffff, 0x8528347]);
    assert.deepEqual(
        toLowPrecision(latlng),
        toLowPrecision([37.34579337536848, -121.97637597255124]),
        'lat/lng matches expected'
    );
    assert.end();
});

test('cellToBoundary', assert => {
    const latlngs = h3.cellToBoundary('85283473fffffff');
    const expectedlatlngs = [
        [37.271355866731895, -121.91508032705622],
        [37.353926450852256, -121.86222328902491],
        [37.42834118609435, -121.9235499963016],
        [37.42012867767778, -122.0377349642703],
        [37.33755608435298, -122.09042892904395],
        [37.26319797461824, -122.02910130919]
    ];
    assert.deepEqual(
        toLowPrecision(latlngs),
        toLowPrecision(expectedlatlngs),
        'Coordinates match expected'
    );
    assert.end();
});

test('cellToBoundary - GeoJson', assert => {
    const latlngs = h3.cellToBoundary('85283473fffffff', true);
    const expectedlatlngs = [
        [37.271355866731895, -121.91508032705622].reverse(),
        [37.353926450852256, -121.86222328902491].reverse(),
        [37.42834118609435, -121.9235499963016].reverse(),
        [37.42012867767778, -122.0377349642703].reverse(),
        [37.33755608435298, -122.09042892904395].reverse(),
        [37.26319797461824, -122.02910130919].reverse(),
        // Repeat first point
        [37.271355866731895, -121.91508032705622].reverse()
    ];
    assert.deepEqual(
        toLowPrecision(latlngs),
        toLowPrecision(expectedlatlngs),
        'Coordinates match expected'
    );
    assert.end();
});

test('cellToBoundary - 10-Vertex Pentagon', assert => {
    const latlngs = h3.cellToBoundary('81623ffffffffff', true);
    const expectedlatlngs = [
        [55.94007484027041, 12.754829243237465],
        [55.178175815407634, 10.2969712998247],
        [55.25056228923789, 9.092686031788569],
        [57.37516125699395, 7.616228186063625],
        [58.549882762724735, 7.302087248609307],
        [60.638711932789995, 8.825639091130396],
        [61.315435771664646, 9.83036925628956],
        [60.502253257733344, 12.271971757766304],
        [59.732575088573185, 13.216340916028171],
        [57.09422515125156, 13.191260467897605],
        // Repeat first point
        [55.94007484027041, 12.754829243237465]
    ];
    assert.deepEqual(
        toLowPrecision(latlngs),
        toLowPrecision(expectedlatlngs),
        'Coordinates match expected'
    );
    assert.end();
});

test('gridDisk', assert => {
    const hexagons = h3.gridDisk('8928308280fffff', 1);
    assert.equal(1 + 6, hexagons.length, 'got the expected number of hexagons for a single ring');
    [
        '8928308280fffff',
        '8928308280bffff',
        '89283082807ffff',
        '89283082877ffff',
        '89283082803ffff',
        '89283082873ffff',
        '8928308283bffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons.indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });
    assert.end();
});

test('gridDisk 2', assert => {
    const hexagons = h3.gridDisk('8928308280fffff', 2);
    assert.equal(1 + 6 + 12, hexagons.length, 'got the expected number of hexagons for two rings');
    [
        '89283082813ffff',
        '89283082817ffff',
        '8928308281bffff',
        '89283082863ffff',
        '89283082823ffff',
        '89283082873ffff',
        '89283082877ffff',
        '8928308287bffff',
        '89283082833ffff',
        '8928308282bffff',
        '8928308283bffff',
        '89283082857ffff',
        '892830828abffff',
        '89283082847ffff',
        '89283082867ffff',
        '89283082803ffff',
        '89283082807ffff',
        '8928308280bffff',
        '8928308280fffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons.indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });
    assert.end();
});

test('gridDisk - Bad Radius', assert => {
    assert.throws(
        () => h3.gridDisk('8928308280fffff', -7),
        {code: E_DOMAIN},
        'Throws with bad radius'
    );
    assert.end();
});

test('gridDisk - out of bounds', assert => {
    assert.throws(
        () => h3.gridDisk(['8928308280fffff'], 1e6),
        {code: E_ARRAY_LENGTH},
        'throws if the output is too large'
    );

    assert.end();
});

test('gridDisk - Pentagon', assert => {
    const hexagons = h3.gridDisk('821c07fffffffff', 1);
    assert.equal(
        1 + 5,
        hexagons.length,
        'got the expected number for a single ring around a pentagon'
    );
    [
        '821c2ffffffffff',
        '821c27fffffffff',
        '821c07fffffffff',
        '821c17fffffffff',
        '821c1ffffffffff',
        '821c37fffffffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons.indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });
    assert.end();
});

test('gridDisk - Edge case', assert => {
    // There was an issue reading particular 64-bit integers correctly, this kRing ran into it
    const hexagons = h3.gridDisk('8928308324bffff', 1);
    assert.equal(1 + 6, hexagons.length, 'got the expected number of hexagons');
    [
        '8928308324bffff',
        '892830989b3ffff',
        '89283098987ffff',
        '89283098997ffff',
        '8928308325bffff',
        '89283083243ffff',
        '8928308324fffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons.indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });
    assert.end();
});

test('gridDiskDistances', assert => {
    const hexagons = h3.gridDiskDistances('8928308280fffff', 1);
    assert.equal(1, hexagons[0].length, 'got the expected number of hexagons for the origin');
    assert.equal(6, hexagons[1].length, 'got the expected number of hexagons for ring 1');

    assert.deepEqual(hexagons[0], ['8928308280fffff'], 'Got origin in ring 0');
    [
        '8928308280bffff',
        '89283082807ffff',
        '89283082877ffff',
        '89283082803ffff',
        '89283082873ffff',
        '8928308283bffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons[1].indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });
    assert.end();
});

test('gridDiskDistances - 2 rings', assert => {
    const hexagons = h3.gridDiskDistances('8928308280fffff', 2);
    assert.equal(1, hexagons[0].length, 'got the expected number of hexagons for the origin');
    assert.equal(6, hexagons[1].length, 'got the expected number of hexagons for ring 1');
    assert.equal(12, hexagons[2].length, 'got the expected number of hexagons for ring 1');

    assert.deepEqual(hexagons[0], ['8928308280fffff'], 'Got origin in ring 0');
    [
        '8928308280bffff',
        '89283082807ffff',
        '89283082877ffff',
        '89283082803ffff',
        '89283082873ffff',
        '8928308283bffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons[1].indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });

    [
        '89283082813ffff',
        '89283082817ffff',
        '8928308281bffff',
        '89283082863ffff',
        '89283082823ffff',
        '8928308287bffff',
        '89283082833ffff',
        '8928308282bffff',
        '89283082857ffff',
        '892830828abffff',
        '89283082847ffff',
        '89283082867ffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons[2].indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });

    assert.end();
});

test('gridDiskDistances - Pentagon', assert => {
    const hexagons = h3.gridDiskDistances('821c07fffffffff', 1);

    assert.equal(1, hexagons[0].length, 'got the expected number of hexagons for the origin');
    assert.equal(
        5,
        hexagons[1].length,
        'got the expected number of hexagons for a ring around a pentagon'
    );

    assert.deepEqual(hexagons[0], ['821c07fffffffff'], 'Got origin in ring 0');
    [
        '821c2ffffffffff',
        '821c27fffffffff',
        '821c17fffffffff',
        '821c1ffffffffff',
        '821c37fffffffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons[1].indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });
    assert.end();
});

test('gridDiskDistances - out of bounds', assert => {
    assert.throws(
        () => h3.gridDiskDistances(['8928308280fffff'], 1e6),
        {code: E_ARRAY_LENGTH},
        'throws if the output is too large'
    );

    assert.end();
});

test('gridRingUnsafe', assert => {
    const hexagons = h3.gridRingUnsafe('8928308280fffff', 1);
    assert.equal(6, hexagons.length, 'got the expected number of hexagons for ring 1');

    [
        '8928308280bffff',
        '89283082807ffff',
        '89283082877ffff',
        '89283082803ffff',
        '89283082873ffff',
        '8928308283bffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons.indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });
    assert.end();
});

test('gridRingUnsafe - ring 2', assert => {
    const hexagons = h3.gridRingUnsafe('8928308280fffff', 2);
    assert.equal(12, hexagons.length, 'got the expected number of hexagons for ring 1');

    [
        '89283082813ffff',
        '89283082817ffff',
        '8928308281bffff',
        '89283082863ffff',
        '89283082823ffff',
        '8928308287bffff',
        '89283082833ffff',
        '8928308282bffff',
        '89283082857ffff',
        '892830828abffff',
        '89283082847ffff',
        '89283082867ffff'
    ].forEach(hexagonAddress => {
        assert.ok(hexagons.indexOf(hexagonAddress) > -1, 'found an expected hexagon');
    });
    assert.end();
});

test('gridRingUnsafe - ring 0', assert => {
    const hexagons = h3.gridRingUnsafe('8928308280fffff', 0);
    assert.deepEqual(hexagons, ['8928308280fffff'], 'Got origin in ring 0');
    assert.end();
});

test('gridRingUnsafe - pentagon', assert => {
    assert.throws(
        () => h3.gridRingUnsafe('821c07fffffffff', 2),
        {code: E_PENTAGON},
        'Throws with a pentagon origin'
    );
    assert.throws(
        () => h3.gridRingUnsafe('821c2ffffffffff', 1),
        {code: E_PENTAGON},
        'Throws with a pentagon in the ring itself'
    );
    assert.throws(
        () => h3.gridRingUnsafe('821c2ffffffffff', 5),
        {code: E_PENTAGON},
        'Throws with a pentagon inside the ring'
    );

    assert.end();
});

test('polygonToCells', assert => {
    const hexagons = h3.polygonToCells(
        [
            [
                [37.813318999983238, -122.4089866999972145],
                [37.7866302000007224, -122.3805436999997056],
                [37.7198061999978478, -122.3544736999993603],
                [37.7076131999975672, -122.5123436999983966],
                [37.7835871999971715, -122.5247187000021967],
                [37.8151571999998453, -122.4798767000009008]
            ]
        ],
        9
    );
    assert.equal(hexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCells - GeoJson', assert => {
    const hexagons = h3.polygonToCells(
        [
            [
                [-122.4089866999972145, 37.813318999983238],
                [-122.3805436999997056, 37.7866302000007224],
                [-122.3544736999993603, 37.7198061999978478],
                [-122.5123436999983966, 37.7076131999975672],
                [-122.5247187000021967, 37.7835871999971715],
                [-122.4798767000009008, 37.8151571999998453]
            ]
        ],
        9,
        true
    );
    assert.equal(hexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCells - Single Loop', assert => {
    const hexagons = h3.polygonToCells(
        [
            [37.813318999983238, -122.4089866999972145],
            [37.7866302000007224, -122.3805436999997056],
            [37.7198061999978478, -122.3544736999993603],
            [37.7076131999975672, -122.5123436999983966],
            [37.7835871999971715, -122.5247187000021967],
            [37.8151571999998453, -122.4798767000009008]
        ],
        9
    );
    assert.equal(hexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCells - Single Loop GeoJson', assert => {
    const hexagons = h3.polygonToCells(
        [
            [-122.4089866999972145, 37.813318999983238],
            [-122.3805436999997056, 37.7866302000007224],
            [-122.3544736999993603, 37.7198061999978478],
            [-122.5123436999983966, 37.7076131999975672],
            [-122.5247187000021967, 37.7835871999971715],
            [-122.4798767000009008, 37.8151571999998453]
        ],
        9,
        true
    );
    assert.equal(hexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCells - Single Loop Transmeridian', assert => {
    const hexagons = h3.polygonToCells(
        [
            [0.5729577951308232, -179.4270422048692],
            [0.5729577951308232, 179.4270422048692],
            [-0.5729577951308232, 179.4270422048692],
            [-0.5729577951308232, -179.4270422048692]
        ],
        7
    );
    assert.equal(hexagons.length, 4238, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCells - Empty', assert => {
    const hexagons = h3.polygonToCells([], 9);
    assert.equal(hexagons.length, 0, 'got no hexagons back');
    assert.end();
});

test('polygonToCells - Empty Loop', assert => {
    const hexagons = h3.polygonToCells([[]], 9);
    assert.equal(hexagons.length, 0, 'got no hexagons back');
    assert.end();
});

test('polygonToCells - Bad Input', assert => {
    assert.throws(() => h3.polygonToCells([]), {code: E_RES_DOMAIN});
    assert.throws(() => h3.polygonToCells([], 42), {code: E_RES_DOMAIN});
    assert.throws(() => h3.polygonToCells([], null), {code: E_RES_DOMAIN});
    // These throw simple JS errors, probably fine for now
    assert.throws(() => h3.polygonToCells(null, 9));
    assert.throws(() => h3.polygonToCells(undefined, 9));
    assert.throws(() => h3.polygonToCells({}, 9));
    assert.end();
});

test('polygonToCells - out of bounds', assert => {
    const polygon = [
        [85, 85],
        [85, -85],
        [-85, -85],
        [-85, 85],
        [85, 85]
    ];
    assert.throws(
        () => h3.polygonToCells(polygon, 15),
        {code: E_ARRAY_LENGTH},
        'throws if expected output is too large'
    );
    assert.end();
});

test('polygonToCells - With Hole', assert => {
    const hexagons = h3.polygonToCells(
        [
            [
                [37.813318999983238, -122.4089866999972145],
                [37.7866302000007224, -122.3805436999997056],
                [37.7198061999978478, -122.3544736999993603],
                [37.7076131999975672, -122.5123436999983966],
                [37.7835871999971715, -122.5247187000021967],
                [37.8151571999998453, -122.4798767000009008]
            ],
            [
                [37.7869802, -122.4471197],
                [37.7664102, -122.4590777],
                [37.7710682, -122.4137097]
            ]
        ],
        9
    );
    assert.equal(hexagons.length, 1214, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCells - With Hole GeoJson', assert => {
    const hexagons = h3.polygonToCells(
        [
            [
                [-122.4089866999972145, 37.813318999983238],
                [-122.3805436999997056, 37.7866302000007224],
                [-122.3544736999993603, 37.7198061999978478],
                [-122.5123436999983966, 37.7076131999975672],
                [-122.5247187000021967, 37.7835871999971715],
                [-122.4798767000009008, 37.8151571999998453]
            ],
            [
                [-122.4471197, 37.7869802],
                [-122.4590777, 37.7664102],
                [-122.4137097, 37.7710682]
            ]
        ],
        9,
        true
    );
    assert.equal(hexagons.length, 1214, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCells - With Two Holes', assert => {
    const hexagons = h3.polygonToCells(
        [
            [
                [37.813318999983238, -122.4089866999972145],
                [37.7866302000007224, -122.3805436999997056],
                [37.7198061999978478, -122.3544736999993603],
                [37.7076131999975672, -122.5123436999983966],
                [37.7835871999971715, -122.5247187000021967],
                [37.8151571999998453, -122.4798767000009008]
            ],
            [
                [37.7869802, -122.4471197],
                [37.7664102, -122.4590777],
                [37.7710682, -122.4137097]
            ],
            [
                [37.747976, -122.490025],
                [37.73155, -122.503758],
                [37.72544, -122.452603]
            ]
        ],
        9
    );
    assert.equal(hexagons.length, 1172, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCells - BBox corners (#67)', assert => {
    const {north, south, east, west} = {
        east: -56.25,
        north: -33.13755119234615,
        south: -34.30714385628804,
        west: -57.65625
    };
    const vertices = [
        [north, east],
        [north, west],
        [south, west],
        [south, east]
    ];
    const hexagons = h3.polygonToCells(vertices, 7);

    assert.equal(hexagons.length, 4499, 'got the expected number of hexagons back');
    assert.end();
});

test('polygonToCells - memory management bug (#103)', assert => {
    // Note that when this memory mangement issue occurs, it makes a number of *other* tests fail.
    // Unfortunately this test itself doesn't seem to fail, though the original pair of polygons
    // in #103 failed deterministically with this length check.
    const simplePolygon = makePolygon(4);
    const complexPolygon = makePolygon(1260);

    const len1 = h3.polygonToCells(simplePolygon, 3).length;
    h3.polygonToCells(complexPolygon, 3);
    const len2 = h3.polygonToCells(simplePolygon, 3).length;

    assert.equal(
        len1,
        len2,
        'polygonToCells with many vertexes should not mess up later polyfills'
    );
    assert.end();
});

test('polygonToCells - memory management bug (#103, holes)', assert => {
    const simplePolygon = makePolygon(4);
    const complexPolygon = [simplePolygon, makePolygon(1260, 0.5), makePolygon(2000, 0.5)];

    const len1 = h3.polygonToCells(simplePolygon, 3).length;
    h3.polygonToCells(complexPolygon, 3);
    const len2 = h3.polygonToCells(simplePolygon, 3).length;

    assert.equal(
        len1,
        len2,
        'polygonToCells with many vertexes should not mess up later polyfills'
    );
    assert.end();
});

test('polygonToCellsExperimental', assert => {
    const hexagons = h3.polygonToCellsExperimental(
        [
            [
                [37.813318999983238, -122.4089866999972145],
                [37.7866302000007224, -122.3805436999997056],
                [37.7198061999978478, -122.3544736999993603],
                [37.7076131999975672, -122.5123436999983966],
                [37.7835871999971715, -122.5247187000021967],
                [37.8151571999998453, -122.4798767000009008]
            ]
        ],
        9,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    );
    assert.equal(hexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - GeoJson', assert => {
    const hexagons = h3.polygonToCellsExperimental(
        [
            [
                [-122.4089866999972145, 37.813318999983238],
                [-122.3805436999997056, 37.7866302000007224],
                [-122.3544736999993603, 37.7198061999978478],
                [-122.5123436999983966, 37.7076131999975672],
                [-122.5247187000021967, 37.7835871999971715],
                [-122.4798767000009008, 37.8151571999998453]
            ]
        ],
        9,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter,
        true
    );
    assert.equal(hexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - Single Loop', assert => {
    const hexagons = h3.polygonToCellsExperimental(
        [
            [37.813318999983238, -122.4089866999972145],
            [37.7866302000007224, -122.3805436999997056],
            [37.7198061999978478, -122.3544736999993603],
            [37.7076131999975672, -122.5123436999983966],
            [37.7835871999971715, -122.5247187000021967],
            [37.8151571999998453, -122.4798767000009008]
        ],
        9,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    );
    assert.equal(hexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - Single Loop GeoJson', assert => {
    const hexagons = h3.polygonToCellsExperimental(
        [
            [-122.4089866999972145, 37.813318999983238],
            [-122.3805436999997056, 37.7866302000007224],
            [-122.3544736999993603, 37.7198061999978478],
            [-122.5123436999983966, 37.7076131999975672],
            [-122.5247187000021967, 37.7835871999971715],
            [-122.4798767000009008, 37.8151571999998453]
        ],
        9,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter,
        true
    );
    assert.equal(hexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - Single Loop Transmeridian', assert => {
    const hexagons = h3.polygonToCellsExperimental(
        [
            [0.5729577951308232, -179.4270422048692],
            [0.5729577951308232, 179.4270422048692],
            [-0.5729577951308232, 179.4270422048692],
            [-0.5729577951308232, -179.4270422048692]
        ],
        7,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    );
    assert.equal(hexagons.length, 4238, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - Empty', assert => {
    const hexagons = h3.polygonToCells([], 9, h3.POLYGON_TO_CELLS_FLAGS.containmentCenter);
    assert.equal(hexagons.length, 0, 'got no hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - Empty Loop', assert => {
    const hexagons = h3.polygonToCells([[]], 9, h3.POLYGON_TO_CELLS_FLAGS.containmentCenter);
    assert.equal(hexagons.length, 0, 'got no hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - Bad Input', assert => {
    assert.throws(() => h3.polygonToCellsExperimental([]), {code: E_RES_DOMAIN});
    assert.throws(() => h3.polygonToCellsExperimental([], 42), {code: E_RES_DOMAIN});
    assert.throws(() => h3.polygonToCellsExperimental([], null), {code: E_RES_DOMAIN});
    assert.throws(() => h3.polygonToCellsExperimental([], 1), {code: E_OPTION_INVALID});
    assert.throws(() => h3.polygonToCellsExperimental([], 1, 'aaa flag'), {code: E_OPTION_INVALID});
    // These throw simple JS errors, probably fine for now
    assert.throws(() => h3.polygonToCellsExperimental(null, 9));
    assert.throws(() => h3.polygonToCellsExperimental(undefined, 9));
    assert.throws(() => h3.polygonToCellsExperimental({}, 9));
    assert.end();
});

test('polygonToCellsExperimental - out of bounds', assert => {
    const polygon = [
        [85, 85],
        [85, -85],
        [-85, -85],
        [-85, 85],
        [85, 85]
    ];
    assert.throws(
        () =>
            h3.polygonToCellsExperimental(polygon, 15, h3.POLYGON_TO_CELLS_FLAGS.containmentCenter),
        {code: E_ARRAY_LENGTH},
        'throws if expected output is too large'
    );
    assert.end();
});

test('polygonToCellsExperimental - With Hole', assert => {
    const hexagons = h3.polygonToCellsExperimental(
        [
            [
                [37.813318999983238, -122.4089866999972145],
                [37.7866302000007224, -122.3805436999997056],
                [37.7198061999978478, -122.3544736999993603],
                [37.7076131999975672, -122.5123436999983966],
                [37.7835871999971715, -122.5247187000021967],
                [37.8151571999998453, -122.4798767000009008]
            ],
            [
                [37.7869802, -122.4471197],
                [37.7664102, -122.4590777],
                [37.7710682, -122.4137097]
            ]
        ],
        9,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    );
    assert.equal(hexagons.length, 1214, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - With Hole GeoJson', assert => {
    const hexagons = h3.polygonToCellsExperimental(
        [
            [
                [-122.4089866999972145, 37.813318999983238],
                [-122.3805436999997056, 37.7866302000007224],
                [-122.3544736999993603, 37.7198061999978478],
                [-122.5123436999983966, 37.7076131999975672],
                [-122.5247187000021967, 37.7835871999971715],
                [-122.4798767000009008, 37.8151571999998453]
            ],
            [
                [-122.4471197, 37.7869802],
                [-122.4590777, 37.7664102],
                [-122.4137097, 37.7710682]
            ]
        ],
        9,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter,
        true
    );
    assert.equal(hexagons.length, 1214, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - With Two Holes', assert => {
    const hexagons = h3.polygonToCellsExperimental(
        [
            [
                [37.813318999983238, -122.4089866999972145],
                [37.7866302000007224, -122.3805436999997056],
                [37.7198061999978478, -122.3544736999993603],
                [37.7076131999975672, -122.5123436999983966],
                [37.7835871999971715, -122.5247187000021967],
                [37.8151571999998453, -122.4798767000009008]
            ],
            [
                [37.7869802, -122.4471197],
                [37.7664102, -122.4590777],
                [37.7710682, -122.4137097]
            ],
            [
                [37.747976, -122.490025],
                [37.73155, -122.503758],
                [37.72544, -122.452603]
            ]
        ],
        9,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    );
    assert.equal(hexagons.length, 1172, 'got an appropriate number of hexagons back');
    assert.end();
});

test('polygonToCellsExperimental - BBox corners (#67)', assert => {
    const {north, south, east, west} = {
        east: -56.25,
        north: -33.13755119234615,
        south: -34.30714385628804,
        west: -57.65625
    };
    const vertices = [
        [north, east],
        [north, west],
        [south, west],
        [south, east]
    ];
    const hexagons = h3.polygonToCellsExperimental(
        vertices,
        7,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    );

    assert.equal(hexagons.length, 4499, 'got the expected number of hexagons back');
    assert.end();
});

test('polygonToCells - memory management bug (#103)', assert => {
    // Note that when this memory mangement issue occurs, it makes a number of *other* tests fail.
    // Unfortunately this test itself doesn't seem to fail, though the original pair of polygons
    // in #103 failed deterministically with this length check.
    const simplePolygon = makePolygon(4);
    const complexPolygon = makePolygon(1260);

    const len1 = h3.polygonToCellsExperimental(
        simplePolygon,
        3,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    ).length;
    h3.polygonToCellsExperimental(complexPolygon, 3, h3.POLYGON_TO_CELLS_FLAGS.containmentCenter);
    const len2 = h3.polygonToCellsExperimental(
        simplePolygon,
        3,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    ).length;

    assert.equal(
        len1,
        len2,
        'polygonToCellsExperimental with many vertexes should not mess up later polyfills'
    );
    assert.end();
});

test('polygonToCellsExperimental - memory management bug (#103, holes)', assert => {
    const simplePolygon = makePolygon(4);
    const complexPolygon = [simplePolygon, makePolygon(1260, 0.5), makePolygon(2000, 0.5)];

    const len1 = h3.polygonToCellsExperimental(
        simplePolygon,
        3,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    ).length;
    h3.polygonToCellsExperimental(complexPolygon, 3, h3.POLYGON_TO_CELLS_FLAGS.containmentCenter);
    const len2 = h3.polygonToCellsExperimental(
        simplePolygon,
        3,
        h3.POLYGON_TO_CELLS_FLAGS.containmentCenter
    ).length;

    assert.equal(
        len1,
        len2,
        'polygonToCellsExperimental with many vertexes should not mess up later polyfills'
    );
    assert.end();
});

test('cellsToMultiPolygon - Empty', assert => {
    const h3Indexes = [];
    const multiPolygon = h3.cellsToMultiPolygon(h3Indexes);

    assert.deepEqual(multiPolygon, [], 'no hexagons yields an empty array');

    assert.end();
});

test('cellsToMultiPolygon - Single', assert => {
    const h3Indexes = ['89283082837ffff'];
    const multiPolygon = h3.cellsToMultiPolygon(h3Indexes);
    const vertices = h3.cellToBoundary(h3Indexes[0]);
    const expected = [[vertices]];

    assertMultiPolygon(assert, multiPolygon, expected);

    assert.end();
});

test('cellsToMultiPolygon - Single GeoJson', assert => {
    const h3Indexes = ['89283082837ffff'];
    const multiPolygon = h3.cellsToMultiPolygon(h3Indexes, true);
    const vertices = h3.cellToBoundary(h3Indexes[0], true);
    const expected = [[vertices]];

    assertMultiPolygon(assert, multiPolygon, expected, true);

    assert.end();
});

test('cellsToMultiPolygon - Contiguous 2', assert => {
    // the second hexagon shares v0 and v1 with the first
    const h3Indexes = ['89283082837ffff', '89283082833ffff'];
    const multiPolygon = h3.cellsToMultiPolygon(h3Indexes);
    const vertices0 = h3.cellToBoundary(h3Indexes[0]);
    const vertices1 = h3.cellToBoundary(h3Indexes[1]);
    const expected = [
        [
            [
                vertices1[0],
                vertices1[1],
                vertices1[2],
                vertices0[1],
                vertices0[2],
                vertices0[3],
                vertices0[4],
                vertices0[5],
                vertices1[4],
                vertices1[5]
            ]
        ]
    ];

    assertMultiPolygon(assert, multiPolygon, expected);

    assert.end();
});

test('cellsToMultiPolygon - Non-contiguous 2', assert => {
    // the second hexagon does not touch the first
    const h3Indexes = ['89283082837ffff', '8928308280fffff'];
    const multiPolygon = h3.cellsToMultiPolygon(h3Indexes);
    const vertices0 = h3.cellToBoundary(h3Indexes[0]);
    const vertices1 = h3.cellToBoundary(h3Indexes[1]);
    const expected = [[vertices0], [vertices1]];

    assertMultiPolygon(assert, multiPolygon, expected);

    assert.end();
});

test('cellsToMultiPolygon - Hole', assert => {
    // Six hexagons in a ring around a hole
    const h3Indexes = [
        '892830828c7ffff',
        '892830828d7ffff',
        '8928308289bffff',
        '89283082813ffff',
        '8928308288fffff',
        '89283082883ffff'
    ];
    const multiPolygon = h3.cellsToMultiPolygon(h3Indexes);

    assert.equal(multiPolygon.length, 1, 'polygon count matches expected');
    assert.equal(multiPolygon[0].length, 2, 'loop count matches expected');
    assert.equal(multiPolygon[0][0].length, 6 * 3, 'outer coord count matches expected');
    assert.equal(multiPolygon[0][1].length, 6, 'inner coord count matches expected');

    assert.end();
});

test('cellsToMultiPolygon - kRing', assert => {
    // 2-ring in order returned by algo
    let h3Indexes = h3.gridDisk('8930062838bffff', 2);
    let multiPolygon = h3.cellsToMultiPolygon(h3Indexes);

    assert.equal(multiPolygon.length, 1, 'polygon count matches expected');
    assert.equal(multiPolygon[0].length, 1, 'loop count matches expected');
    assert.equal(multiPolygon[0][0].length, 6 * (2 * 2 + 1), 'coord count matches expected');

    // Same k-ring in random order
    h3Indexes = [
        '89300628393ffff',
        '89300628383ffff',
        '89300628397ffff',
        '89300628067ffff',
        '89300628387ffff',
        '893006283bbffff',
        '89300628313ffff',
        '893006283cfffff',
        '89300628303ffff',
        '89300628317ffff',
        '8930062839bffff',
        '8930062838bffff',
        '8930062806fffff',
        '8930062838fffff',
        '893006283d3ffff',
        '893006283c3ffff',
        '8930062831bffff',
        '893006283d7ffff',
        '893006283c7ffff'
    ];

    multiPolygon = h3.cellsToMultiPolygon(h3Indexes);

    assert.equal(multiPolygon.length, 1, 'polygon count matches expected');
    assert.equal(multiPolygon[0].length, 1, 'loop count matches expected');
    assert.equal(multiPolygon[0][0].length, 6 * (2 * 2 + 1), 'coord count matches expected');

    h3Indexes = h3.gridDisk('8930062838bffff', 6).sort();
    multiPolygon = h3.cellsToMultiPolygon(h3Indexes);

    assert.equal(multiPolygon[0].length, 1, 'loop count matches expected');

    assert.end();
});

test('cellsToMultiPolygon - Nested Donuts', assert => {
    const origin = '892830828c7ffff';
    const h3Indexes = h3.gridRingUnsafe(origin, 1).concat(h3.gridRingUnsafe(origin, 3));
    const multiPolygon = h3.cellsToMultiPolygon(h3Indexes);

    // This assertion is brittle, as the order of polygons is undefined, and it would
    // be equally correct if the smaller ring was first
    assert.equal(multiPolygon.length, 2, 'polygon count matches expected');
    assert.equal(multiPolygon[0].length, 2, 'loop count matches expected');
    assert.equal(multiPolygon[0][0].length, 6 * 7, 'outer coord count matches expected');
    assert.equal(multiPolygon[0][1].length, 6 * 5, 'inner coord count matches expected');
    assert.equal(multiPolygon[1].length, 2, 'loop count matches expected');
    assert.equal(multiPolygon[1][0].length, 6 * 3, 'outer coord count matches expected');
    assert.equal(multiPolygon[1][1].length, 6, 'inner coord count matches expected');

    assert.end();
});

test('compactCells and uncompactCells', assert => {
    const hexagons = h3.polygonToCells(
        [
            [
                [37.813318999983238, -122.4089866999972145],
                [37.7866302000007224, -122.3805436999997056],
                [37.7198061999978478, -122.3544736999993603],
                [37.7076131999975672, -122.5123436999983966],
                [37.7835871999971715, -122.5247187000021967],
                [37.8151571999998453, -122.4798767000009008]
            ]
        ],
        9
    );
    const compactedHexagons = h3.compactCells(hexagons);
    assert.equal(compactedHexagons.length, 209, 'got an appropriate number of hexagons back');
    const uncompactedHexagons = h3.uncompactCells(compactedHexagons, 9);
    assert.equal(uncompactedHexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('compactCells - Empty', assert => {
    assert.deepEqual(h3.compactCells(), [], 'got an empty array for an undefined input');
    assert.deepEqual(h3.compactCells(null), [], 'got an empty array for a falsy input');
    assert.deepEqual(h3.compactCells([]), [], 'got an empty array for an empty input');
    assert.deepEqual(h3.compactCells({}), [], 'got an empty array for an invalid input');

    assert.end();
});

test('compactCells - Res 0 edge case, issue #159', assert => {
    // k-ring around a res 0 pentagon
    const cells = h3.gridDisk('820807fffffffff', 4);

    const compacted = h3.compactCells(cells);
    assert.equal(compacted.length, 11, 'got an appropriate number of hexagons back');

    assert.end();
});

test('uncompactCells - Empty', assert => {
    assert.deepEqual(
        h3.uncompactCells(undefined, 9),
        [],
        'got an empty array for an undefined input'
    );
    assert.deepEqual(h3.uncompactCells(null, 9), [], 'got an empty array for a falsy input');
    assert.deepEqual(h3.uncompactCells([], 9), [], 'got an empty array for an empty input');
    assert.deepEqual(h3.uncompactCells({}, 9), [], 'got an empty array for an invalid input');

    assert.end();
});

test('compactCells - Invalid', assert => {
    // A slightly ridiculous substitute for Array#fill
    const dupeHexagons = new Array(11)
        .join('8500924bfffffff,')
        .split(',')
        .slice(0, -1);
    assert.throws(
        () => h3.compactCells(dupeHexagons, 9),
        {code: E_DUPLICATE_INPUT},
        'got expected error for invalid hex set input'
    );

    assert.end();
});

test('uncompactCells - Invalid', assert => {
    const hexagons = [h3.latLngToCell(37.3615593, -122.0553238, 10)];
    assert.throws(
        () => h3.uncompactCells(hexagons, 5),
        {code: E_RES_MISMATCH},
        'got expected error for invalid compacted resolution input'
    );

    assert.end();
});

test('uncompactCells - integer', assert => {
    assert.deepEqual(
        h3.uncompactCells([[0x3fffffff, 0x8528347]], 5),
        ['85283473fffffff'],
        'got a single index for same res input'
    );

    assert.end();
});

test('uncompactCells - out of bounds', assert => {
    assert.throws(
        () => h3.uncompactCells(['8029fffffffffff'], 15),
        {code: E_ARRAY_LENGTH},
        'throws if the output is too large'
    );

    assert.end();
});

test('isPentagon', assert => {
    assert.equals(h3.isPentagon('8928308280fffff'), false, 'False for hexagon');
    assert.equals(h3.isPentagon('821c07fffffffff'), true, 'True for pentagon');
    assert.equals(h3.isPentagon('foo'), false, 'False for invalid (bad string)');

    assert.end();
});

test('isResClassIII', assert => {
    // Test all even indexes
    for (let i = 0; i < 15; i += 2) {
        const h3Index = h3.latLngToCell(37.3615593, -122.0553238, i);
        assert.equals(h3.isResClassIII(h3Index), false, `False for res ${i}`);
    }

    // Test all odd indexes
    for (let i = 1; i < 15; i += 2) {
        const h3Index = h3.latLngToCell(37.3615593, -122.0553238, i);
        assert.equals(h3.isResClassIII(h3Index), true, `True for res ${i}`);
    }

    assert.end();
});

test('getIcosahedronFaces', assert => {
    [
        {name: 'single face', h3Index: '85283473fffffff', expected: 1},
        {name: 'edge adjacent', h3Index: '821c37fffffffff', expected: 1},
        {name: 'edge crossing, distorted', h3Index: '831c06fffffffff', expected: 2},
        {name: 'edge crossing, aligned', h3Index: '821ce7fffffffff', expected: 2},
        {name: 'class II pentagon', h3Index: '84a6001ffffffff', expected: 5},
        {name: 'class III pentagon', h3Index: '85a60003fffffff', expected: 5}
    ].forEach(({name, h3Index, expected}) => {
        const faces = h3.getIcosahedronFaces(h3Index);
        assert.equal(faces.length, expected, `Got expected face count for ${name}`);
        assert.equal(faces.length, new Set(faces).size, `Faces are unique for ${name}`);
        assert.ok(
            faces.every(face => face >= 0 && face < 20),
            `Got face indexes in expected range for ${name}`
        );
    });

    assert.end();
});

test('getBaseCellNumber', assert => {
    const h3Index = '8928308280fffff';

    assert.equal(h3.getBaseCellNumber(h3Index), 20, 'Got expected base cell');

    assert.end();
});

test('cellToParent', assert => {
    // NB: This test will not work with every hexagon, it has to be a location
    // that does not fall in the margin of error between the 7 children and
    // the parent's true boundaries at every resolution
    const lat = 37.81331899988944;
    const lng = -122.409290778685;
    for (let res = 1; res < 10; res++) {
        for (let step = 0; step < res; step++) {
            const child = h3.latLngToCell(lat, lng, res);
            const comparisonParent = h3.latLngToCell(lat, lng, res - step);
            const parent = h3.cellToParent(child, res - step);

            assert.equals(parent, comparisonParent, `Got expected parent for ${res}:${res - step}`);
        }
    }
    assert.end();
});

test('cellToParent - Invalid', assert => {
    const h3Index = '8928308280fffff';

    assert.throws(
        () => h3.cellToParent(h3Index, 10),
        {code: E_RES_MISMATCH},
        'Throws on finer resolution'
    );
    assert.throws(
        () => h3.cellToParent(h3Index, -1),
        {code: E_RES_DOMAIN},
        'Throws on invalid resolution'
    );
    assert.throws(
        () => h3.cellToParent('foo', 10),
        {code: E_RES_MISMATCH},
        'Throws on invalid index'
    );
    assert.end();
});

test('cellToChildren', assert => {
    const lat = 37.81331899988944;
    const lng = -122.409290778685;
    const h3Index = h3.latLngToCell(lat, lng, 7);

    assert.equal(h3.cellToChildren(h3Index, 8).length, 7, 'Immediate child count correct');
    assert.equal(h3.cellToChildren(h3Index, 9).length, 49, 'Grandchild count correct');
    assert.deepEqual(h3.cellToChildren(h3Index, 7), [h3Index], 'Same resolution returns self');
    assert.throws(
        () => h3.cellToChildren(h3Index, 6),
        {code: E_RES_DOMAIN},
        'Coarser resolution throws'
    );
    assert.throws(
        () => h3.cellToChildren(h3Index, -1),
        {code: E_RES_DOMAIN},
        'Invalid resolution throws'
    );
    assert.deepEqual(h3.cellToChildren('foo', -1), [], 'Invalid index returns empty array');

    assert.end();
});

test('cellToChildren - out of bounds', assert => {
    assert.throws(
        () => h3.cellToChildren('8029fffffffffff', 15),
        {code: E_ARRAY_LENGTH},
        'throws if the output is too large'
    );

    assert.end();
});

test('cellToCenterChild', assert => {
    const baseIndex = '8029fffffffffff';
    const [lat, lng] = h3.cellToLatLng(baseIndex);
    for (let res = 0; res < 14; res++) {
        for (let childRes = res; childRes < 15; childRes++) {
            const parent = h3.latLngToCell(lat, lng, res);
            const comparisonChild = h3.latLngToCell(lat, lng, childRes);
            const child = h3.cellToCenterChild(parent, childRes);

            assert.equals(
                child,
                comparisonChild,
                `Got expected center child for ${res}:${childRes}`
            );
        }
    }
    assert.end();
});

test('cellToCenterChild - Invalid', assert => {
    const h3Index = '8928308280fffff';

    assert.throws(
        () => h3.cellToCenterChild(h3Index, 5),
        {code: E_RES_DOMAIN},
        'Coarser resolution throws'
    );
    assert.throws(
        () => h3.cellToCenterChild(h3Index, -1),
        {code: E_RES_DOMAIN},
        'Invalid resolution throws'
    );
    // TODO: Add this assertion when the C library supports this fallback
    // assert.equals(h3.cellToCenterChild('foo', 10), null, 'Invalid index returns null');

    assert.end();
});

test('cellToChildPos', assert => {
    const h3Index = '88283080ddfffff';
    assert.equal(h3.cellToChildPos(h3Index, 8), 0, 'Got expected value for same res');
    assert.equal(h3.cellToChildPos(h3Index, 7), 6, 'Got expected value for 1st-level parent');
    assert.equal(h3.cellToChildPos(h3Index, 6), 41, 'Got expected value for 2nd-level parent');
    assert.end();
});

test('cellToChildPos - error', assert => {
    const h3Index = '88283080ddfffff';
    assert.throws(
        () => h3.cellToChildPos(h3Index, 12),
        {code: E_RES_MISMATCH},
        'Finer resolution throws'
    );
    assert.throws(
        () => h3.cellToChildPos(h3Index, -1),
        {code: E_RES_DOMAIN},
        'Invalid resolution throws'
    );
    assert.end();
});

test('childPosToCell', assert => {
    const h3Index = '88283080ddfffff';
    assert.equal(h3.childPosToCell(0, h3Index, 8), h3Index, 'Got expected value for same res');
    assert.equal(
        h3.childPosToCell(6, h3.cellToParent(h3Index, 7), 8),
        h3Index,
        'Got expected value for 1st-level parent'
    );
    assert.equal(
        h3.childPosToCell(41, h3.cellToParent(h3Index, 6), 8),
        h3Index,
        'Got expected value for 2nd-level parent'
    );
    assert.end();
});

test('childPosToCell - error', assert => {
    const h3Index = '88283080ddfffff';
    assert.throws(
        () => h3.childPosToCell(6, h3Index, 5),
        {code: E_RES_MISMATCH},
        'Coarser resolution throws'
    );
    assert.throws(
        () => h3.childPosToCell(6, h3Index, -1),
        {code: E_RES_DOMAIN},
        'Invalid resolution throws'
    );
    assert.throws(
        () => h3.childPosToCell(42, h3Index, 9),
        {code: E_DOMAIN},
        'Child pos out of range throws'
    );
    assert.end();
});

test('cellToChildPos / childPosToCell round-trip', assert => {
    // These are somewhat arbitrary, but cover a few different parts of the globe
    const testLatLngs = [
        [37.81331899988944, -122.409290778685],
        [64.2868041, 8.7824902],
        [5.8815246, 54.3336044],
        [-41.4486737, 143.918175]
    ];

    for (const [lat, lng] of testLatLngs) {
        for (let res = 0; res < 16; res++) {
            const child = h3.latLngToCell(lat, lng, res);
            const parent = h3.cellToParent(child, 0);
            const pos = h3.cellToChildPos(child, 0);
            const cell = h3.childPosToCell(pos, parent, res);
            assert.equal(cell, child, `round-trip produced the same cell for res ${res}`);
        }
    }

    assert.end();
});

test('childPosToCell / cellToChildrenSize', assert => {
    // one hexagon, one pentagon
    const baseCells = ['80bffffffffffff', '80a7fffffffffff'];

    for (const h3Index of baseCells) {
        for (let res = 0; res < 16; res++) {
            const count = h3.cellToChildrenSize(h3Index, res);
            assert.ok(
                Math.pow(6, res) <= count && count <= Math.pow(7, res),
                'count has the right order of magnitude'
            );
            const child = h3.childPosToCell(count - 1, h3Index, res);
            const pos = h3.cellToChildPos(child, 0);
            assert.equal(pos, count - 1, 'got expected round-trip');

            assert.throws(
                () => h3.childPosToCell(count, h3Index, res),
                {code: E_DOMAIN},
                'One more is out of range'
            );
        }
    }

    assert.end();
});

test('cellToChildrenSize - errors', assert => {
    const h3Index = '88283080ddfffff';
    assert.throws(
        () => h3.cellToChildrenSize(h3Index, 5),
        {code: E_RES_DOMAIN},
        'Coarser resolution throws'
    );
    assert.throws(
        () => h3.cellToChildrenSize(h3Index, -1),
        {code: E_RES_DOMAIN},
        'Invalid resolution throws'
    );
    assert.throws(
        () => h3.cellToChildrenSize('foo', 9),
        {code: E_CELL_INVALID},
        'Invalid cell throws'
    );
    assert.end();
});

test('areNeighborCells', assert => {
    const origin = '891ea6d6533ffff';
    const adjacent = '891ea6d65afffff';
    const notAdjacent = '891ea6992dbffff';

    assert.equal(h3.areNeighborCells(origin, adjacent), true, 'Adjacent hexagons are neighbors');
    assert.equal(h3.areNeighborCells(adjacent, origin), true, 'Adjacent hexagons are neighbors');
    assert.equal(
        h3.areNeighborCells(origin, notAdjacent),
        false,
        'Non-adjacent hexagons are not neighbors'
    );
    assert.equal(
        h3.areNeighborCells(origin, origin),
        false,
        'A hexagon is not a neighbor to itself'
    );
    assert.throws(
        () => h3.areNeighborCells(origin, 'foo'),
        {code: E_CELL_INVALID},
        'A hexagon is not a neighbor to an invalid index'
    );
    assert.throws(
        () => h3.areNeighborCells(origin, 42),
        {code: E_CELL_INVALID},
        'A hexagon is not a neighbor to an invalid index'
    );
    assert.throws(
        () => h3.areNeighborCells(origin, null),
        {code: E_CELL_INVALID},
        'A hexagon is not a neighbor to a null index'
    );
    assert.throws(
        () => h3.areNeighborCells('foo', 'foo'),
        {code: E_CELL_INVALID},
        'Two invalid indexes are not neighbors'
    );
    assert.throws(
        () => h3.areNeighborCells(null, null),
        {code: E_CELL_INVALID},
        'Two null indexes are not neighbors'
    );

    assert.end();
});

test('cellsToDirectedEdge', assert => {
    const origin = '891ea6d6533ffff';
    const destination = '891ea6d65afffff';
    const edge = '1591ea6d6533ffff';
    const notAdjacent = '891ea6992dbffff';

    assert.equal(
        h3.cellsToDirectedEdge(origin, destination),
        edge,
        'Got expected edge for adjacent hexagons'
    );

    assert.throws(
        () => h3.cellsToDirectedEdge(origin, notAdjacent),
        {code: E_NOT_NEIGHBORS},
        'Got null for non-adjacent hexagons'
    );

    assert.throws(
        () => h3.cellsToDirectedEdge(origin, origin),
        {code: E_NOT_NEIGHBORS},
        'Throws for same hexagons'
    );

    assert.throws(
        () => h3.cellsToDirectedEdge(origin, 'foo'),
        {code: E_NOT_NEIGHBORS},
        'Throws for invalid destination'
    );

    assert.throws(
        () => h3.cellsToDirectedEdge('bar', origin),
        {code: E_NOT_NEIGHBORS},
        'Throws for invalid origin'
    );

    assert.end();
});

test('getDirectedEdgeOrigin', assert => {
    const origin = '891ea6d6533ffff';
    const edge = '1591ea6d6533ffff';

    assert.equal(h3.getDirectedEdgeOrigin(edge), origin, 'Got expected origin for edge');

    assert.throws(
        () => h3.getDirectedEdgeOrigin(origin),
        {code: E_DIR_EDGE_INVALID},
        'Throws for non-edge hexagon'
    );

    assert.throws(
        () => h3.getDirectedEdgeOrigin(null),
        {code: E_DIR_EDGE_INVALID},
        'Throws for non-hexagon'
    );

    assert.end();
});

test('getDirectedEdgeDestination', assert => {
    const destination = '891ea6d65afffff';
    const edge = '1591ea6d6533ffff';

    assert.equal(h3.getDirectedEdgeDestination(edge), destination, 'Got expected origin for edge');

    assert.throws(
        () => h3.getDirectedEdgeDestination(destination),
        {code: E_DIR_EDGE_INVALID},
        'Throws for non-edge hexagon'
    );

    assert.throws(
        () => h3.getDirectedEdgeDestination(null),
        {code: E_DIR_EDGE_INVALID},
        'Throws for non-hexagon'
    );

    assert.end();
});

test('isValidDirectedEdge', assert => {
    const origin = '891ea6d6533ffff';
    const destination = '891ea6d65afffff';

    assert.equal(h3.isValidDirectedEdge('1591ea6d6533ffff'), true, 'Edge index is valid');
    assert.equal(
        h3.isValidDirectedEdge(h3.cellsToDirectedEdge(origin, destination)),
        true,
        'Output of getH3UnidirectionalEdge is valid'
    );

    ['lolwut', undefined, null, {}, 42].forEach(badInput => {
        assert.equal(h3.isValidDirectedEdge(badInput), false, `${badInput} is not valid`);
    });

    assert.end();
});

test('directedEdgeToCells', assert => {
    const origin = '891ea6d6533ffff';
    const destination = '891ea6d65afffff';
    const edge = '1591ea6d6533ffff';

    assert.deepEqual(
        h3.directedEdgeToCells(edge),
        [origin, destination],
        'Got expected origin, destination from edge'
    );

    assert.deepEqual(
        h3.directedEdgeToCells(h3.cellsToDirectedEdge(origin, destination)),
        [origin, destination],
        'Got expected origin, destination from getH3UnidirectionalEdge output'
    );

    assert.end();
});

test('originToDirectedEdges', assert => {
    const origin = '8928308280fffff';
    const edges = h3.originToDirectedEdges(origin);

    assert.equal(edges.length, 6, 'got expected edge count');

    const neighbors = h3.gridRingUnsafe(origin, 1);
    neighbors.forEach(neighbor => {
        const edge = h3.cellsToDirectedEdge(origin, neighbor);
        assert.ok(edges.indexOf(edge) > -1, 'found edge to neighbor');
    });

    assert.end();
});

test('originToDirectedEdges - pentagon', assert => {
    const origin = '81623ffffffffff';
    const edges = h3.originToDirectedEdges(origin);

    assert.equal(edges.length, 5, 'got expected edge count');

    const neighbors = h3.gridDisk(origin, 1).filter(hex => hex !== origin);
    neighbors.forEach(neighbor => {
        const edge = h3.cellsToDirectedEdge(origin, neighbor);
        assert.ok(edges.indexOf(edge) > -1, 'found edge to neighbor');
    });

    assert.end();
});

test('directedEdgeToBoundary', assert => {
    const origin = '85283473fffffff';
    const edges = h3.originToDirectedEdges(origin);

    // GeoBoundary of the origin
    const originBoundary = h3.cellToBoundary(origin);

    const expectedEdges = [
        [originBoundary[3], originBoundary[4]],
        [originBoundary[1], originBoundary[2]],
        [originBoundary[2], originBoundary[3]],
        [originBoundary[5], originBoundary[0]],
        [originBoundary[4], originBoundary[5]],
        [originBoundary[0], originBoundary[1]]
    ];

    edges.forEach((edge, i) => {
        const latlngs = h3.directedEdgeToBoundary(edge);
        assert.deepEqual(
            toLowPrecision(latlngs),
            toLowPrecision(expectedEdges[i]),
            `Coordinates match expected for edge ${i}`
        );
    });

    assert.end();
});

test('directedEdgeToBoundary - 10-vertex pentagon', assert => {
    const origin = '81623ffffffffff';
    const edges = h3.originToDirectedEdges(origin);

    // GeoBoundary of the origin
    const originBoundary = h3.cellToBoundary(origin);

    const expectedEdges = [
        [originBoundary[2], originBoundary[3], originBoundary[4]],
        [originBoundary[4], originBoundary[5], originBoundary[6]],
        [originBoundary[8], originBoundary[9], originBoundary[0]],
        [originBoundary[6], originBoundary[7], originBoundary[8]],
        [originBoundary[0], originBoundary[1], originBoundary[2]]
    ];

    edges.forEach((edge, i) => {
        const latlngs = h3.directedEdgeToBoundary(edge);
        assert.deepEqual(
            toLowPrecision(latlngs),
            toLowPrecision(expectedEdges[i]),
            `Coordinates match expected for edge ${i}`
        );
    });

    assert.end();
});

test('gridDistance', assert => {
    const origin = h3.latLngToCell(37.5, -122, 9);
    for (let radius = 0; radius < 4; radius++) {
        const others = h3.gridRingUnsafe(origin, radius);
        for (let i = 0; i < others.length; i++) {
            assert.equals(
                h3.gridDistance(origin, others[i]),
                radius,
                `Got distance ${radius} for (${origin}, ${others[i]})`
            );
        }
    }
    assert.end();
});

test('gridDistance - failure', assert => {
    const origin = h3.latLngToCell(37.5, -122, 9);
    const origin10 = h3.latLngToCell(37.5, -122, 10);
    const edge = '1591ea6d6533ffff';
    const distantHex = h3.latLngToCell(-37.5, 122, 9);

    assert.throws(
        () => h3.gridDistance(origin, origin10),
        {code: E_RES_MISMATCH},
        'Throws for distance between different resolutions'
    );
    assert.throws(
        () => h3.gridDistance(origin, edge),
        {code: E_FAILED},
        'Throws for distance between hexagon and edge'
    );
    assert.throws(
        () => h3.gridDistance(origin, distantHex),
        {code: E_FAILED},
        'Throws for distance between distant hexagons'
    );
    assert.end();
});

test('gridPathCells', assert => {
    for (let res = 0; res < 12; res++) {
        const origin = h3.latLngToCell(37.5, -122, res);
        const destination = h3.latLngToCell(25, -120, res);
        const line = h3.gridPathCells(origin, destination);
        const distance = h3.gridDistance(origin, destination);
        assert.equals(line.length, distance + 1, `distance matches expected: ${distance + 1}`);
        // property-based test for the line
        assert.ok(
            line.every((h3Index, i) => i === 0 || h3.areNeighborCells(h3Index, line[i - 1])),
            'every index in the line is a neighbor of the previous'
        );
    }
    assert.end();
});

test('gridPathCells - failure', assert => {
    const origin = h3.latLngToCell(37.5, -122, 9);
    const origin10 = h3.latLngToCell(37.5, -122, 10);

    assert.throws(
        () => h3.gridPathCells(origin, origin10),
        {code: E_RES_MISMATCH},
        'got expected error for different resolutions'
    );
    assert.end();
});

test('cellToLocalIj / localIjToCell', assert => {
    const origin = '8828308281fffff';
    [
        [origin, {i: 392, j: 336}],
        ['882830828dfffff', {i: 393, j: 337}],
        ['8828308285fffff', {i: 392, j: 337}],
        ['8828308287fffff', {i: 391, j: 336}],
        ['8828308283fffff', {i: 391, j: 335}],
        ['882830828bfffff', {i: 392, j: 335}],
        ['8828308289fffff', {i: 393, j: 336}]
    ].forEach(([h3Index, coords]) => {
        assert.deepEqual(
            h3.cellToLocalIj(origin, h3Index),
            coords,
            `Got expected coordinates for ${h3Index}`
        );
        assert.deepEqual(
            h3.localIjToCell(origin, coords),
            h3Index,
            `Got expected H3 index for ${JSON.stringify(coords)}`
        );
    });
    assert.end();
});

test('cellToLocalIj / localIjToCell - Pentagon', assert => {
    const origin = '811c3ffffffffff';
    [
        [origin, {i: 0, j: 0}],
        ['811d3ffffffffff', {i: 1, j: 0}],
        ['811cfffffffffff', {i: -1, j: 0}]
    ].forEach(([h3Index, coords]) => {
        assert.deepEqual(
            h3.cellToLocalIj(origin, h3Index),
            coords,
            `Got expected coordinates for ${h3Index}`
        );
        assert.deepEqual(
            h3.localIjToCell(origin, coords),
            h3Index,
            `Got expected H3 index for ${JSON.stringify(coords)}`
        );
    });
    assert.end();
});

test('cellToLocalIj - errors', assert => {
    assert.throws(
        () => h3.cellToLocalIj('832830fffffffff', '822837fffffffff'),
        {code: E_RES_MISMATCH},
        'Got expected error'
    );
    assert.throws(
        () => h3.cellToLocalIj('822a17fffffffff', '822837fffffffff'),
        {code: E_FAILED},
        'Got expected error'
    );
    assert.throws(
        () => h3.cellToLocalIj('8828308281fffff', '8841492553fffff'),
        {code: E_FAILED},
        'Got expected error for opposite sides of the world'
    );
    assert.throws(
        () => h3.cellToLocalIj('81283ffffffffff', '811cbffffffffff'),
        {code: E_FAILED},
        'Got expected error'
    );
    assert.throws(
        () => h3.cellToLocalIj('811d3ffffffffff', '8122bffffffffff'),
        {code: E_FAILED},
        'Got expected error'
    );

    assert.end();
});

test('localIjToCell - errors', assert => {
    assert.throws(
        () => h3.localIjToCell('8049fffffffffff', null),
        /Coordinates must be provided/,
        'Got expected error'
    );
    assert.throws(
        () => h3.localIjToCell('8049fffffffffff', [1, 0]),
        /Coordinates must be provided/,
        'Got expected error'
    );
    assert.throws(
        () => h3.localIjToCell('8049fffffffffff', {i: 2, j: 0}),
        {code: E_FAILED},
        'Got expected error'
    );

    assert.end();
});

test('getHexagonAreaAvg', assert => {
    let last = 1e14;
    for (let res = 0; res < 16; res++) {
        const result = h3.getHexagonAreaAvg(res, h3.UNITS.m2);
        assert.ok(typeof result === 'number', 'Got numeric response for m2');
        assert.ok(result < last, `result < last result: ${result}` + `, ${last}`);
        last = result;
    }

    last = 1e7;
    for (let res = 0; res < 16; res++) {
        const result = h3.getHexagonAreaAvg(res, h3.UNITS.km2);
        assert.ok(typeof result === 'number', 'Got numeric response for km2');
        assert.ok(result < last, `result < last result: ${result}` + `, ${last}`);
        last = result;
    }

    assert.end();
});

test('getHexagonAreaAvg - bad units', assert => {
    const res = 9;
    assert.throws(
        () => h3.getHexagonAreaAvg(res),
        {code: E_UNKNOWN_UNIT},
        'throws on missing unit'
    );
    assert.throws(
        () => h3.getHexagonAreaAvg(res, 'foo'),
        {code: E_UNKNOWN_UNIT},
        'throws on unknown unit'
    );
    assert.throws(
        () => h3.getHexagonAreaAvg(res, 42),
        {code: E_UNKNOWN_UNIT},
        'throws on unknown unit'
    );
    assert.throws(
        () => h3.getHexagonAreaAvg(res, h3.UNITS.km),
        {code: E_UNKNOWN_UNIT},
        'throws on invalid unit'
    );

    assert.end();
});

test('getHexagonAreaAvg - bad resolution', assert => {
    assert.throws(
        () => h3.getHexagonAreaAvg(42, h3.UNITS.m2),
        {code: E_RES_DOMAIN},
        'throws on invalid resolution'
    );

    assert.throws(
        () => h3.getHexagonAreaAvg(),
        {code: E_RES_DOMAIN},
        'throws on invalid resolution'
    );

    assert.end();
});

test('getHexagonEdgeLengthAvg', assert => {
    let last = 1e7;
    for (let res = 0; res < 16; res++) {
        const result = h3.getHexagonEdgeLengthAvg(res, h3.UNITS.m);
        assert.ok(typeof result === 'number', 'Got numeric response for m');
        assert.ok(result < last, `result < last result: ${result}` + `, ${last}`);
        last = result;
    }

    last = 1e4;
    for (let res = 0; res < 16; res++) {
        const result = h3.getHexagonEdgeLengthAvg(res, h3.UNITS.km);
        assert.ok(typeof result === 'number', 'Got numeric response for km');
        assert.ok(result < last, `result < last result: ${result}` + `, ${last}`);
        last = result;
    }

    assert.end();
});

test('getHexagonEdgeLengthAvg - bad units', assert => {
    const res = 9;
    assert.throws(
        () => h3.getHexagonEdgeLengthAvg(res),
        {code: E_UNKNOWN_UNIT},
        'throws on missing unit'
    );
    assert.throws(
        () => h3.getHexagonEdgeLengthAvg(res, 'foo'),
        {code: E_UNKNOWN_UNIT},
        'throws on unknown unit'
    );
    assert.throws(
        () => h3.getHexagonEdgeLengthAvg(res, 42),
        {code: E_UNKNOWN_UNIT},
        'throws on unknown unit'
    );
    assert.throws(
        () => h3.getHexagonEdgeLengthAvg(res, h3.UNITS.km2),
        {code: E_UNKNOWN_UNIT},
        'throws on invalid unit'
    );

    assert.end();
});

test('getHexagonEdgeLengthAvg - bad resolution', assert => {
    assert.throws(
        () => h3.getHexagonEdgeLengthAvg(42, h3.UNITS.m),
        {code: E_RES_DOMAIN},
        'throws on invalid resolution'
    );

    assert.throws(
        () => h3.getHexagonEdgeLengthAvg(),
        {code: E_RES_DOMAIN},
        'throws on invalid resolution'
    );

    assert.end();
});

test('cellArea', assert => {
    // These values are slightly different from the comparable h3-java test,
    // but match within some reasonable threshold
    const expectedAreas = [
        2562182.1629554993,
        447684.20172018476,
        65961.62242711011,
        9228.87291900244,
        1318.694490797148,
        187.95935122814547,
        26.87164354763051,
        3.8408488470593176,
        0.5486939641334774,
        0.07838600808653977,
        0.01119834222000042,
        0.0015997771692175615,
        0.00022853909314018362,
        0.00003264850232866918,
        0.000004664070325946983,
        6.662957600331753e-7
    ];
    for (let res = 0; res < 16; res++) {
        const h3Index = h3.latLngToCell(0, 0, res);
        const cellAreaKm2 = h3.cellArea(h3Index, h3.UNITS.km2);
        assert.ok(
            almostEqual(cellAreaKm2, expectedAreas[res]),
            `Area matches expected value at res ${res}`
        );
        // Property tests
        assert.ok(
            // res 0 has high distortion of average area due to high pentagon proportion
            res === 0 ||
                // This seems to be the lowest factor that works for other resolutions
                almostEqual(cellAreaKm2, h3.getHexagonAreaAvg(res, h3.UNITS.km2), 0.4),
            `Area is close to average area at res ${res}, km2`
        );
        const cellAreaM2 = h3.cellArea(h3Index, h3.UNITS.m2);
        assert.ok(
            // res 0 has high distortion of average area due to high pentagon proportion
            res === 0 ||
                // This seems to be the lowest factor that works for other resolutions
                almostEqual(cellAreaM2, h3.getHexagonAreaAvg(res, h3.UNITS.m2), 0.4),
            `Area is close to average area at res ${res}, m2`
        );
        assert.ok(cellAreaM2 > cellAreaKm2, 'm2 > Km2');
        assert.ok(cellAreaKm2 > h3.cellArea(h3Index, h3.UNITS.rads2), 'Km2 > rads2');
    }
    assert.end();
});

test('cellArea - bad units', assert => {
    const h3Index = h3.latLngToCell(0, 0, 9);
    assert.throws(() => h3.cellArea(h3Index), {code: E_UNKNOWN_UNIT}, 'throws on missing unit');
    assert.throws(
        () => h3.cellArea(h3Index, 'foo'),
        {code: E_UNKNOWN_UNIT},
        'throws on unknown unit'
    );
    assert.throws(() => h3.cellArea(h3Index, 42), {code: E_UNKNOWN_UNIT}, 'throws on unknown unit');
    assert.throws(
        () => h3.cellArea(h3Index, h3.UNITS.km),
        {code: E_UNKNOWN_UNIT},
        'throws on invalid unit'
    );

    assert.end();
});

test('edgeLength', assert => {
    for (let res = 0; res < 16; res++) {
        const h3Index = h3.latLngToCell(0, 0, res);
        const edges = h3.originToDirectedEdges(h3Index);
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const lengthKm = h3.edgeLength(edge, h3.UNITS.km);
            assert.ok(lengthKm > 0, 'Has some length');
            assert.ok(
                // res 0 has high distortion of average edge length due to high pentagon proportion
                res === 0 ||
                    // This seems to be the lowest factor that works for other resolutions
                    almostEqual(lengthKm, h3.getHexagonEdgeLengthAvg(res, h3.UNITS.km), 0.28),
                `Edge length is close to average edge length at res ${res}, km`
            );
            const lengthM = h3.edgeLength(edge, h3.UNITS.m);
            assert.ok(
                // res 0 has high distortion of average edge length due to high pentagon proportion
                res === 0 ||
                    // This seems to be the lowest factor that works for other resolutions
                    almostEqual(lengthM, h3.getHexagonEdgeLengthAvg(res, h3.UNITS.m), 0.28),
                `Edge length is close to average edge length at res ${res}, m`
            );
            assert.ok(lengthM > lengthKm, 'm > Km');
            assert.ok(lengthKm > h3.edgeLength(edge, h3.UNITS.rads), 'Km > rads');
        }
    }
    assert.end();
});

test('edgeLength - bad units', assert => {
    const h3Index = h3.latLngToCell(0, 0, 9);
    const edge = h3.originToDirectedEdges(h3Index)[0];
    assert.throws(() => h3.edgeLength(edge), {code: E_UNKNOWN_UNIT}, 'throws on missing unit');
    assert.throws(
        () => h3.edgeLength(edge, 'foo'),
        {code: E_UNKNOWN_UNIT},
        'throws on unknown unit'
    );
    assert.throws(() => h3.edgeLength(edge, 42), {code: E_UNKNOWN_UNIT}, 'throws on unknown unit');
    assert.throws(
        () => h3.edgeLength(edge, h3.UNITS.m2),
        {code: E_UNKNOWN_UNIT},
        'throws on invalid unit'
    );

    assert.end();
});

test('greatCircleDistance', assert => {
    assert.ok(
        almostEqual(h3.greatCircleDistance([-10, 0], [10, 0], h3.UNITS.rads), h3.degsToRads(20)),
        'Got expected angular distance for latitude along the equator'
    );
    assert.ok(
        almostEqual(h3.greatCircleDistance([0, -10], [0, 10], h3.UNITS.rads), h3.degsToRads(20)),
        'Got expected angular distance for latitude along a meridian'
    );
    assert.equal(
        h3.greatCircleDistance([23, 23], [23, 23], h3.UNITS.rads),
        0,
        'Got expected angular distance for same point'
    );
    // Just rough tests for the other units
    const distKm = h3.greatCircleDistance([0, 0], [39, -122], h3.UNITS.km);
    assert.ok(distKm > 12e3 && distKm < 13e3, 'has some reasonable distance in Km');
    const distM = h3.greatCircleDistance([0, 0], [39, -122], h3.UNITS.m);
    assert.ok(distM > 12e6 && distM < 13e6, 'has some reasonable distance in m');

    assert.end();
});

test('greatCircleDistance - bad units', assert => {
    assert.throws(
        () => h3.greatCircleDistance([0, 0], [0, 0]),
        {code: E_UNKNOWN_UNIT},
        'throws on missing unit'
    );
    assert.throws(
        () => h3.greatCircleDistance([0, 0], [0, 0], 'foo'),
        {code: E_UNKNOWN_UNIT},
        'throws on unknown unit'
    );
    assert.throws(
        () => h3.greatCircleDistance([0, 0], [0, 0], 42),
        {code: E_UNKNOWN_UNIT},
        'throws on unknown unit'
    );
    assert.throws(
        () => h3.greatCircleDistance([0, 0], [0, 0], h3.UNITS.m2),
        {code: E_UNKNOWN_UNIT},
        'throws on invalid unit'
    );

    assert.end();
});

// From https://h3geo.org/docs/core-library/restable
const EXPECTED_NUM_CELLS = [
    122,
    842,
    5882,
    41162,
    288122,
    2016842,
    14117882,
    98825162,
    691776122,
    4842432842,
    33897029882,
    237279209162,
    1660954464122,
    11626681248842,
    81386768741882,
    569707381193162
];

test('getNumCells', assert => {
    for (let res = 0; res < 16; res++) {
        assert.equal(h3.getNumCells(res), EXPECTED_NUM_CELLS[res]);
    }
    assert.end();
});

test('getNumCells - bad resolution', assert => {
    assert.throws(() => h3.getNumCells(42), {code: E_RES_DOMAIN}, 'throws on invalid resolution');
    assert.throws(() => h3.getNumCells(), {code: E_RES_DOMAIN}, 'throws on invalid resolution');

    assert.end();
});

test('getRes0Cells', assert => {
    const indexes = h3.getRes0Cells();
    assert.equal(indexes.length, 122, 'Got expected count');
    assert.ok(indexes.every(h3.isValidCell), 'All indexes are valid');

    assert.end();
});

test('getPentagons', assert => {
    for (let res = 0; res < 15; res++) {
        const indexes = h3.getPentagons(res);
        assert.equal(indexes.length, 12, 'Got expected count');
        assert.ok(indexes.every(h3.isValidCell), 'All indexes are valid');
        assert.ok(indexes.every(h3.isPentagon), 'All indexes are pentagons');
        assert.ok(
            indexes.every(idx => h3.getResolution(idx) === res),
            'All indexes have the right resolution'
        );
        assert.equal(new Set(indexes).size, indexes.length, 'All indexes are unique');
    }
    assert.end();
});

test('getPentagons - invalid', assert => {
    assert.throws(() => h3.getPentagons(), {code: E_RES_DOMAIN}, 'throws on invalid resolution');
    assert.throws(() => h3.getPentagons(42), {code: E_RES_DOMAIN}, 'throws on invalid resolution');
    assert.end();
});

test('cellToVertex - invalid', assert => {
    assert.throws(
        () => h3.cellToVertex('823d6ffffffffff', -1),
        {code: E_DOMAIN},
        'negative vertex number throws'
    );
    assert.throws(
        () => h3.cellToVertex('823d6ffffffffff', 6),
        {code: E_DOMAIN},
        'out of range vertex number throws'
    );
    assert.throws(
        () => h3.cellToVertex('823007fffffffff', 5),
        {code: E_DOMAIN},
        'out of range vertex number for pentagon throws'
    );
    assert.throws(
        () => h3.cellToVertex('ffffffffffffffff', 5),
        {code: E_FAILED},
        'invalid cell throws'
    );
    assert.end();
});

test('isValidVertex', assert => {
    assert.equal(h3.isValidVertex('FFFFFFFFFFFFFFFF'), false, 'all 1 is not a vertex');
    assert.equal(h3.isValidVertex('0'), false, 'all 0 is not a vertex');
    assert.equal(h3.isValidVertex('823d6ffffffffff'), false, 'cell is not a vertex');
    assert.equal(h3.isValidVertex('2222597fffffffff'), true, 'vertex index is a vertex');
    assert.end();
});

test('cellToVertexes', assert => {
    const origin = '823d6ffffffffff';
    const verts = h3.cellToVertexes(origin);
    assert.equal(verts.length, 6, 'vertexes have expected length');
    for (let i = 0; i < 6; i++) {
        const vert = h3.cellToVertex(origin, i);
        assert.ok(verts.includes(vert), 'cellToVertexes is exhaustive');
        assert.ok(h3.isValidVertex(vert), 'cellToVertexes returns valid vertexes');
    }
    assert.end();
});

test('cellToVertexes pentagon', assert => {
    const origin = '823007fffffffff';
    const verts = h3.cellToVertexes(origin);
    assert.equal(verts.length, 5, 'vertexes have expected length');
    for (let i = 0; i < 5; i++) {
        const vert = h3.cellToVertex(origin, i);
        assert.ok(verts.includes(vert), 'cellToVertexes is exhaustive');
        assert.ok(h3.isValidVertex(vert), 'cellToVertexes returns valid vertexes');
    }
    assert.end();
});

test('cellToVertex', assert => {
    const origin = '823d6ffffffffff';
    const verts = new Set();
    for (let i = 0; i < 6; i++) {
        const vert = h3.cellToVertex(origin, i);
        assert.ok(h3.isValidVertex(vert));
        verts.add(vert);
    }
    assert.equal(verts.size, 6, 'vertexes are unique');
    assert.end();
});

test('vertexToLatLng', assert => {
    const origin = '823d6ffffffffff';
    const bounds = h3.cellToBoundary(origin);
    for (let i = 0; i < 6; i++) {
        const vert = h3.cellToVertex(origin, i);
        const latlng = h3.vertexToLatLng(vert);
        let found = false;
        for (let j = 0; j < bounds.length; j++) {
            if (almostEqual(latlng[0], bounds[j][0]) && almostEqual(latlng[1], bounds[j][1])) {
                found = true;
                break;
            }
        }
        assert.ok(found, 'vertex latlng is present in cell bounds');
    }
    assert.end();
});

test('vertexToLatLng - invalid', assert => {
    assert.throws(
        () => h3.vertexToLatLng('ffffffffffffffff'),
        {code: E_CELL_INVALID},
        'invalid vertex throws'
    );
    assert.end();
});
