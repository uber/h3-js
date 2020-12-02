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
import * as h3 from '../lib/h3core.js';

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

test('h3IsValid', assert => {
    assert.ok(h3.h3IsValid('85283473fffffff'), 'H3 index is considered an index');
    assert.ok(h3.h3IsValid('821C37FFFFFFFFF'), 'H3 index in upper case is considered an index');
    assert.ok(
        h3.h3IsValid('085283473fffffff'),
        'H3 index with leading zero is considered an index'
    );
    assert.ok(
        !h3.h3IsValid('ff283473fffffff'),
        'Hexidecimal string with incorrect bits is not valid'
    );
    assert.ok(!h3.h3IsValid('85283q73fffffff'), 'String with non-hexidecimal chars is not valid');
    assert.ok(
        !h3.h3IsValid('85283473fffffff112233'),
        'String with additional parsed chars is not valid'
    );
    assert.ok(
        !h3.h3IsValid('85283473fffffff_lolwut'),
        'String with additional unparsed chars is not valid'
    );
    assert.ok(
        !h3.h3IsValid('8a283081f1f1f1f1f1f5505ffff'),
        'String with extraneous parsable characters in the middle is not valid'
    );
    assert.ok(
        !h3.h3IsValid('8a28308_hello_world_5505ffff'),
        'String with extraneous unparsable characters in the middle is not valid'
    );
    assert.ok(!h3.h3IsValid('lolwut'), 'Random string is not considered an index');
    assert.ok(!h3.h3IsValid(null), 'Null is not considered an index');
    assert.ok(!h3.h3IsValid(), 'Undefined is not considered an index');
    assert.ok(!h3.h3IsValid({}), 'Object is not considered an index');
    for (let res = 0; res < 16; res++) {
        assert.ok(h3.h3IsValid(h3.geoToH3(37, -122, res)), 'H3 index is considered an index');
    }
    assert.end();
});

test('h3IsValid', assert => {
    assert.ok(h3.h3IsValid([0x3fffffff, 0x8528347]), 'Integer H3 index is considered an index');
    assert.ok(
        !h3.h3IsValid([0x73fffffff, 0xff2834]),
        'Integer with incorrect bits is not considered an index'
    );
    assert.ok(!h3.h3IsValid([]), 'Empty array is not valid');
    assert.ok(!h3.h3IsValid([1]), 'Array with a single element is not valid');
    assert.ok(
        !h3.h3IsValid([0x3fffffff, 0x8528347, 0]),
        'Array with an additional element is not valid'
    );
    assert.end();
});

test('geoToH3', assert => {
    const h3Index = h3.geoToH3(37.3615593, -122.0553238, 5);
    assert.equal(h3Index, '85283473fffffff', 'Got the expected H3 index back');
    const ffffffffAddress = h3.geoToH3(30.943387, -164.991559, 5);
    assert.equal(ffffffffAddress, '8547732ffffffff', 'Properly handle 8 Fs');
    const centralAddress = h3.geoToH3(46.04189431883772, 71.52790329909925, 15);
    assert.equal(centralAddress, '8f2000000000000', 'Properly handle leading zeros');
    assert.end();
});

test('sillyGeoToH3', assert => {
    const h3Index = h3.geoToH3(37.3615593, -122.0553238 + 360.0, 5);
    assert.equal(h3Index, '85283473fffffff', 'world-wrapping lng accepted');
    assert.end();
});

test('h3GetResolution', assert => {
    assert.equal(h3.h3GetResolution(), -1, 'Got an invalid resolution back with no query');
    for (let res = 0; res < 16; res++) {
        const h3Index = h3.geoToH3(37.3615593, -122.0553238, res);
        assert.equal(h3.h3GetResolution(h3Index), res, 'Got the expected resolution back');
    }
    assert.end();
});

test('h3ToGeo', assert => {
    const latlng = h3.h3ToGeo('85283473fffffff');
    assert.deepEqual(
        toLowPrecision(latlng),
        toLowPrecision([37.34579337536848, -121.97637597255124]),
        'lat/lng matches expected'
    );
    assert.end();
});

test('h3ToGeo - Integer', assert => {
    const latlng = h3.h3ToGeo([0x3fffffff, 0x8528347]);
    assert.deepEqual(
        toLowPrecision(latlng),
        toLowPrecision([37.34579337536848, -121.97637597255124]),
        'lat/lng matches expected'
    );
    assert.end();
});

test('h3ToGeoBoundary', assert => {
    const latlngs = h3.h3ToGeoBoundary('85283473fffffff');
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

test('h3ToGeoBoundary - GeoJson', assert => {
    const latlngs = h3.h3ToGeoBoundary('85283473fffffff', true);
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

test('h3ToGeoBoundary - 10-Vertex Pentagon', assert => {
    const latlngs = h3.h3ToGeoBoundary('81623ffffffffff', true);
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

test('kRing', assert => {
    const hexagons = h3.kRing('8928308280fffff', 1);
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

test('kRing 2', assert => {
    const hexagons = h3.kRing('8928308280fffff', 2);
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

test('kRing - Bad Radius', assert => {
    const hexagons = h3.kRing('8928308280fffff', -7);
    assert.deepEqual(hexagons, ['8928308280fffff'], 'Got origin for bad radius');
    assert.end();
});

test('kRing - Pentagon', assert => {
    const hexagons = h3.kRing('821c07fffffffff', 1);
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

test('kRing - Edge case', assert => {
    // There was an issue reading particular 64-bit integers correctly, this kRing ran into it
    const hexagons = h3.kRing('8928308324bffff', 1);
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

test('kRingDistances', assert => {
    const hexagons = h3.kRingDistances('8928308280fffff', 1);
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

test('kRingDistances - 2 rings', assert => {
    const hexagons = h3.kRingDistances('8928308280fffff', 2);
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

test('kRingDistances - Pentagon', assert => {
    const hexagons = h3.kRingDistances('821c07fffffffff', 1);

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

test('hexRing', assert => {
    const hexagons = h3.hexRing('8928308280fffff', 1);
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

test('hexRing - ring 2', assert => {
    const hexagons = h3.hexRing('8928308280fffff', 2);
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

test('hexRing - ring 0', assert => {
    const hexagons = h3.hexRing('8928308280fffff', 0);
    assert.deepEqual(hexagons, ['8928308280fffff'], 'Got origin in ring 0');
    assert.end();
});

test('hexRing - pentagon', assert => {
    assert.throws(
        () => h3.hexRing('821c07fffffffff', 2),
        /Failed/,
        'Throws with a pentagon origin'
    );
    assert.throws(
        () => h3.hexRing('821c2ffffffffff', 1),
        /Failed/,
        'Throws with a pentagon in the ring itself'
    );
    assert.throws(
        () => h3.hexRing('821c2ffffffffff', 5),
        /Failed/,
        'Throws with a pentagon inside the ring'
    );

    assert.end();
});

test('polyfill', assert => {
    const hexagons = h3.polyfill(
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

test('polyfill - GeoJson', assert => {
    const hexagons = h3.polyfill(
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

test('polyfill - Single Loop', assert => {
    const hexagons = h3.polyfill(
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

test('polyfill - Single Loop GeoJson', assert => {
    const hexagons = h3.polyfill(
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

test('polyfill - Single Loop Transmeridian', assert => {
    const hexagons = h3.polyfill(
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

test('polyfill - Empty', assert => {
    const hexagons = h3.polyfill([], 9);
    assert.equal(hexagons.length, 0, 'got no hexagons back');
    assert.end();
});

test('polyfill - Empty Loop', assert => {
    const hexagons = h3.polyfill([[]], 9);
    assert.equal(hexagons.length, 0, 'got no hexagons back');
    assert.end();
});

test('polyfill - Bad Input', assert => {
    assert.throws(() => h3.polyfill(null, 9));
    assert.throws(() => h3.polyfill(undefined, 9));
    assert.throws(() => h3.polyfill({}, 9));
    assert.throws(() => h3.polyfill([]));
    assert.throws(() => h3.polyfill([], 42));
    assert.throws(() => h3.polyfill([], null));
    assert.end();
});

test('polyfill - With Hole', assert => {
    const hexagons = h3.polyfill(
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

test('polyfill - With Hole GeoJson', assert => {
    const hexagons = h3.polyfill(
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

test('polyfill - With Two Holes', assert => {
    const hexagons = h3.polyfill(
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

test('polyfill - BBox corners (#67)', assert => {
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
    const hexagons = h3.polyfill(vertices, 7);

    assert.equal(hexagons.length, 4499, 'got the expected number of hexagons back');
    assert.end();
});

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

test('polyfill - memory management bug (#103)', assert => {
    // Note that when this memory mangement issue occurs, it makes a number of *other* tests fail.
    // Unfortunately this test itself doesn't seem to fail, though the
    const simplePolygon = makePolygon(4);
    const complexPolygon = makePolygon(1260);

    const len1 = h3.polyfill(simplePolygon, 3).length;
    h3.polyfill(complexPolygon, 3);
    const len2 = h3.polyfill(simplePolygon, 3).length;

    assert.equal(len1, len2, 'polyfill with many vertexes should not mess up later polyfills');
    assert.end();
});

test('polyfill - memory management bug (#103, holes)', assert => {
    const simplePolygon = makePolygon(4);
    const complexPolygon = [simplePolygon, makePolygon(1260, 0.5), makePolygon(2000, 0.5)];

    const len1 = h3.polyfill(simplePolygon, 3).length;
    h3.polyfill(complexPolygon, 3);
    const len2 = h3.polyfill(simplePolygon, 3).length;

    assert.equal(len1, len2, 'polyfill with many vertexes should not mess up later polyfills');
    assert.end();
});

test('h3SetToMultiPolygon - Empty', assert => {
    const h3Indexes = [];
    const multiPolygon = h3.h3SetToMultiPolygon(h3Indexes);

    assert.deepEqual(multiPolygon, [], 'no hexagons yields an empty array');

    assert.end();
});

test('h3SetToMultiPolygon - Single', assert => {
    const h3Indexes = ['89283082837ffff'];
    const multiPolygon = h3.h3SetToMultiPolygon(h3Indexes);
    const vertices = h3.h3ToGeoBoundary(h3Indexes[0]);
    const expected = [[vertices]];

    assertMultiPolygon(assert, multiPolygon, expected);

    assert.end();
});

test('h3SetToMultiPolygon - Single GeoJson', assert => {
    const h3Indexes = ['89283082837ffff'];
    const multiPolygon = h3.h3SetToMultiPolygon(h3Indexes, true);
    const vertices = h3.h3ToGeoBoundary(h3Indexes[0], true);
    const expected = [[vertices]];

    assertMultiPolygon(assert, multiPolygon, expected, true);

    assert.end();
});

test('h3SetToMultiPolygon - Contiguous 2', assert => {
    // the second hexagon shares v0 and v1 with the first
    const h3Indexes = ['89283082837ffff', '89283082833ffff'];
    const multiPolygon = h3.h3SetToMultiPolygon(h3Indexes);
    const vertices0 = h3.h3ToGeoBoundary(h3Indexes[0]);
    const vertices1 = h3.h3ToGeoBoundary(h3Indexes[1]);
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

test('h3SetToMultiPolygon - Non-contiguous 2', assert => {
    // the second hexagon does not touch the first
    const h3Indexes = ['89283082837ffff', '8928308280fffff'];
    const multiPolygon = h3.h3SetToMultiPolygon(h3Indexes);
    const vertices0 = h3.h3ToGeoBoundary(h3Indexes[0]);
    const vertices1 = h3.h3ToGeoBoundary(h3Indexes[1]);
    const expected = [[vertices0], [vertices1]];

    assertMultiPolygon(assert, multiPolygon, expected);

    assert.end();
});

test('h3SetToMultiPolygon - Hole', assert => {
    // Six hexagons in a ring around a hole
    const h3Indexes = [
        '892830828c7ffff',
        '892830828d7ffff',
        '8928308289bffff',
        '89283082813ffff',
        '8928308288fffff',
        '89283082883ffff'
    ];
    const multiPolygon = h3.h3SetToMultiPolygon(h3Indexes);

    assert.equal(multiPolygon.length, 1, 'polygon count matches expected');
    assert.equal(multiPolygon[0].length, 2, 'loop count matches expected');
    assert.equal(multiPolygon[0][0].length, 6 * 3, 'outer coord count matches expected');
    assert.equal(multiPolygon[0][1].length, 6, 'inner coord count matches expected');

    assert.end();
});

test('h3SetToMultiPolygon - kRing', assert => {
    // 2-ring in order returned by algo
    let h3Indexes = h3.kRing('8930062838bffff', 2);
    let multiPolygon = h3.h3SetToMultiPolygon(h3Indexes);

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

    multiPolygon = h3.h3SetToMultiPolygon(h3Indexes);

    assert.equal(multiPolygon.length, 1, 'polygon count matches expected');
    assert.equal(multiPolygon[0].length, 1, 'loop count matches expected');
    assert.equal(multiPolygon[0][0].length, 6 * (2 * 2 + 1), 'coord count matches expected');

    h3Indexes = h3.kRing('8930062838bffff', 6).sort();
    multiPolygon = h3.h3SetToMultiPolygon(h3Indexes);

    assert.equal(multiPolygon[0].length, 1, 'loop count matches expected');

    assert.end();
});

test('h3SetToMultiPolygon - Nested Donuts', assert => {
    const origin = '892830828c7ffff';
    const h3Indexes = h3.hexRing(origin, 1).concat(h3.hexRing(origin, 3));
    const multiPolygon = h3.h3SetToMultiPolygon(h3Indexes);

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

test('compact and uncompact', assert => {
    const hexagons = h3.polyfill(
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
    const compactedHexagons = h3.compact(hexagons);
    assert.equal(compactedHexagons.length, 209, 'got an appropriate number of hexagons back');
    const uncompactedHexagons = h3.uncompact(compactedHexagons, 9);
    assert.equal(uncompactedHexagons.length, 1253, 'got an appropriate number of hexagons back');
    assert.end();
});

test('compact - Empty', assert => {
    assert.deepEqual(h3.compact(), [], 'got an empty array for an undefined input');
    assert.deepEqual(h3.compact(null), [], 'got an empty array for a falsy input');
    assert.deepEqual(h3.compact([]), [], 'got an empty array for an empty input');
    assert.deepEqual(h3.compact({}), [], 'got an empty array for an invalid input');

    assert.end();
});

test('uncompact - Empty', assert => {
    assert.deepEqual(h3.uncompact(undefined, 9), [], 'got an empty array for an undefined input');
    assert.deepEqual(h3.uncompact(null, 9), [], 'got an empty array for a falsy input');
    assert.deepEqual(h3.uncompact([], 9), [], 'got an empty array for an empty input');
    assert.deepEqual(h3.uncompact({}, 9), [], 'got an empty array for an invalid input');

    assert.end();
});

test('compact - Invalid', assert => {
    // A slightly ridiculous substitute for Array#fill
    const dupeHexagons = new Array(11)
        .join('8500924bfffffff,')
        .split(',')
        .slice(0, -1);
    assert.throws(
        () => h3.compact(dupeHexagons, 9),
        /Failed to compact/,
        'got expected error for invalid hex set input'
    );

    assert.end();
});

test('uncompact - Invalid', assert => {
    const hexagons = [h3.geoToH3(37.3615593, -122.0553238, 10)];
    assert.throws(
        () => h3.uncompact(hexagons, 5),
        /Failed to uncompact/,
        'got expected error for invalid compacted resolution input'
    );

    assert.end();
});

test('uncompact - Integer', assert => {
    assert.deepEqual(
        h3.uncompact([[0x3fffffff, 0x8528347]], 5),
        ['85283473fffffff'],
        'got a single index for same res input'
    );

    assert.end();
});

test('h3IsPentagon', assert => {
    assert.equals(h3.h3IsPentagon('8928308280fffff'), false, 'False for hexagon');
    assert.equals(h3.h3IsPentagon('821c07fffffffff'), true, 'True for pentagon');
    assert.equals(h3.h3IsPentagon('foo'), false, 'False for invalid (bad string)');

    assert.end();
});

test('h3IsResClassIII', assert => {
    // Test all even indexes
    for (let i = 0; i < 15; i += 2) {
        const h3Index = h3.geoToH3(37.3615593, -122.0553238, i);
        assert.equals(h3.h3IsResClassIII(h3Index), false, `False for res ${i}`);
    }

    // Test all odd indexes
    for (let i = 1; i < 15; i += 2) {
        const h3Index = h3.geoToH3(37.3615593, -122.0553238, i);
        assert.equals(h3.h3IsResClassIII(h3Index), true, `True for res ${i}`);
    }

    assert.end();
});

test('h3GetFaces', assert => {
    [
        {name: 'single face', h3Index: '85283473fffffff', expected: 1},
        {name: 'edge adjacent', h3Index: '821c37fffffffff', expected: 1},
        {name: 'edge crossing, distorted', h3Index: '831c06fffffffff', expected: 2},
        {name: 'edge crossing, aligned', h3Index: '821ce7fffffffff', expected: 2},
        {name: 'class II pentagon', h3Index: '84a6001ffffffff', expected: 5},
        {name: 'class III pentagon', h3Index: '85a60003fffffff', expected: 5}
    ].forEach(({name, h3Index, expected}) => {
        const faces = h3.h3GetFaces(h3Index);
        assert.equal(faces.length, expected, `Got expected face count for ${name}`);
        assert.equal(faces.length, new Set(faces).size, `Faces are unique for ${name}`);
        assert.ok(
            faces.every(face => face >= 0 && face < 20),
            `Got face indexes in expected range for ${name}`
        );
    });

    assert.end();
});

test('h3GetBaseCell', assert => {
    const h3Index = '8928308280fffff';

    assert.equal(h3.h3GetBaseCell(h3Index), 20, 'Got expected base cell');

    assert.end();
});

test('h3ToParent', assert => {
    // NB: This test will not work with every hexagon, it has to be a location
    // that does not fall in the margin of error between the 7 children and
    // the parent's true boundaries at every resolution
    const lat = 37.81331899988944;
    const lng = -122.409290778685;
    for (let res = 1; res < 10; res++) {
        for (let step = 0; step < res; step++) {
            const child = h3.geoToH3(lat, lng, res);
            const comparisonParent = h3.geoToH3(lat, lng, res - step);
            const parent = h3.h3ToParent(child, res - step);

            assert.equals(parent, comparisonParent, `Got expected parent for ${res}:${res - step}`);
        }
    }
    assert.end();
});

test('h3ToParent - Invalid', assert => {
    const h3Index = '8928308280fffff';

    assert.equals(h3.h3ToParent(h3Index, 10), null, 'Finer resolution returns null');
    assert.equals(h3.h3ToParent(h3Index, -1), null, 'Invalid resolution returns null');
    assert.equals(h3.h3ToParent('foo', 10), null, 'Invalid index returns null');

    assert.end();
});

test('h3ToChildren', assert => {
    const lat = 37.81331899988944;
    const lng = -122.409290778685;
    const h3Index = h3.geoToH3(lat, lng, 7);

    assert.equal(h3.h3ToChildren(h3Index, 8).length, 7, 'Immediate child count correct');
    assert.equal(h3.h3ToChildren(h3Index, 9).length, 49, 'Grandchild count correct');
    assert.deepEqual(h3.h3ToChildren(h3Index, 7), [h3Index], 'Same resolution returns self');
    assert.deepEqual(h3.h3ToChildren(h3Index, 6), [], 'Coarser resolution returns empty array');
    assert.deepEqual(h3.h3ToChildren(h3Index, -1), [], 'Invalid resolution returns empty array');
    assert.deepEqual(h3.h3ToChildren('foo', -1), [], 'Invalid index returns empty array');

    assert.end();
});

test('h3ToCenterChild', assert => {
    const baseIndex = '8029fffffffffff';
    const [lat, lng] = h3.h3ToGeo(baseIndex);
    for (let res = 0; res < 14; res++) {
        for (let childRes = res; childRes < 15; childRes++) {
            const parent = h3.geoToH3(lat, lng, res);
            const comparisonChild = h3.geoToH3(lat, lng, childRes);
            const child = h3.h3ToCenterChild(parent, childRes);

            assert.equals(
                child,
                comparisonChild,
                `Got expected center child for ${res}:${childRes}`
            );
        }
    }
    assert.end();
});

test('h3ToCenterChild - Invalid', assert => {
    const h3Index = '8928308280fffff';

    assert.equals(h3.h3ToCenterChild(h3Index, 5), null, 'Coarser resolution returns null');
    assert.equals(h3.h3ToCenterChild(h3Index, -1), null, 'Invalid resolution returns null');
    // TODO: Add this assertion when the C library supports this fallback
    // assert.equals(h3.h3ToCenterChild('foo', 10), null, 'Invalid index returns null');

    assert.end();
});

test('h3IndexesAreNeighbors', assert => {
    const origin = '891ea6d6533ffff';
    const adjacent = '891ea6d65afffff';
    const notAdjacent = '891ea6992dbffff';

    assert.equal(
        h3.h3IndexesAreNeighbors(origin, adjacent),
        true,
        'Adjacent hexagons are neighbors'
    );
    assert.equal(
        h3.h3IndexesAreNeighbors(adjacent, origin),
        true,
        'Adjacent hexagons are neighbors'
    );
    assert.equal(
        h3.h3IndexesAreNeighbors(origin, notAdjacent),
        false,
        'Non-adjacent hexagons are not neighbors'
    );
    assert.equal(
        h3.h3IndexesAreNeighbors(origin, origin),
        false,
        'A hexagon is not a neighbor to itself'
    );
    assert.equal(
        h3.h3IndexesAreNeighbors(origin, 'foo'),
        false,
        'A hexagon is not a neighbor to an invalid index'
    );
    assert.equal(
        h3.h3IndexesAreNeighbors(origin, 42),
        false,
        'A hexagon is not a neighbor to an invalid index'
    );
    assert.equal(
        h3.h3IndexesAreNeighbors(origin, null),
        false,
        'A hexagon is not a neighbor to an invalid index'
    );
    assert.equal(
        h3.h3IndexesAreNeighbors('foo', 'foo'),
        false,
        'Two invalid indexes are not neighbors'
    );
    assert.equal(
        h3.h3IndexesAreNeighbors(null, null),
        false,
        'Two invalid indexes are not neighbors'
    );

    assert.end();
});

test('getH3UnidirectionalEdge', assert => {
    const origin = '891ea6d6533ffff';
    const destination = '891ea6d65afffff';
    const edge = '1591ea6d6533ffff';
    const notAdjacent = '891ea6992dbffff';

    assert.equal(
        h3.getH3UnidirectionalEdge(origin, destination),
        edge,
        'Got expected edge for adjacent hexagons'
    );

    assert.equal(
        h3.getH3UnidirectionalEdge(origin, notAdjacent),
        null,
        'Got null for non-adjacent hexagons'
    );

    assert.equal(h3.getH3UnidirectionalEdge(origin, origin), null, 'Got null for same hexagons');

    assert.equal(
        h3.getH3UnidirectionalEdge(origin, 'foo'),
        null,
        'Got null for invalid destination'
    );

    assert.equal(h3.getH3UnidirectionalEdge('bar', 'foo'), null, 'Got null for invalid hexagons');

    assert.end();
});

test('getOriginH3IndexFromUnidirectionalEdge', assert => {
    const origin = '891ea6d6533ffff';
    const edge = '1591ea6d6533ffff';

    assert.equal(
        h3.getOriginH3IndexFromUnidirectionalEdge(edge),
        origin,
        'Got expected origin for edge'
    );

    assert.equal(
        h3.getOriginH3IndexFromUnidirectionalEdge(origin),
        null,
        'Got null for non-edge hexagon'
    );

    assert.equal(h3.getOriginH3IndexFromUnidirectionalEdge(null), null, 'Got null for non-hexagon');

    assert.end();
});

test('getDestinationH3IndexFromUnidirectionalEdge', assert => {
    const destination = '891ea6d65afffff';
    const edge = '1591ea6d6533ffff';

    assert.equal(
        h3.getDestinationH3IndexFromUnidirectionalEdge(edge),
        destination,
        'Got expected origin for edge'
    );

    assert.equal(
        h3.getDestinationH3IndexFromUnidirectionalEdge(destination),
        null,
        'Got null for non-edge hexagon'
    );

    assert.equal(
        h3.getDestinationH3IndexFromUnidirectionalEdge(null),
        null,
        'Got null for non-hexagon'
    );

    assert.end();
});

test('h3UnidirectionalEdgeIsValid', assert => {
    const origin = '891ea6d6533ffff';
    const destination = '891ea6d65afffff';

    assert.equal(h3.h3UnidirectionalEdgeIsValid('1591ea6d6533ffff'), true, 'Edge index is valid');
    assert.equal(
        h3.h3UnidirectionalEdgeIsValid(h3.getH3UnidirectionalEdge(origin, destination)),
        true,
        'Output of getH3UnidirectionalEdge is valid'
    );

    ['lolwut', undefined, null, {}, 42].forEach(badInput => {
        assert.equal(h3.h3UnidirectionalEdgeIsValid(badInput), false, `${badInput} is not valid`);
    });

    assert.end();
});

test('getH3IndexesFromUnidirectionalEdge', assert => {
    const origin = '891ea6d6533ffff';
    const destination = '891ea6d65afffff';
    const edge = '1591ea6d6533ffff';

    assert.deepEqual(
        h3.getH3IndexesFromUnidirectionalEdge(edge),
        [origin, destination],
        'Got expected origin, destination from edge'
    );

    assert.deepEqual(
        h3.getH3IndexesFromUnidirectionalEdge(h3.getH3UnidirectionalEdge(origin, destination)),
        [origin, destination],
        'Got expected origin, destination from getH3UnidirectionalEdge output'
    );

    assert.end();
});

test('getH3UnidirectionalEdgesFromHexagon', assert => {
    const origin = '8928308280fffff';
    const edges = h3.getH3UnidirectionalEdgesFromHexagon(origin);

    assert.equal(edges.length, 6, 'got expected edge count');

    const neighbors = h3.hexRing(origin, 1);
    neighbors.forEach(neighbor => {
        const edge = h3.getH3UnidirectionalEdge(origin, neighbor);
        assert.ok(edges.indexOf(edge) > -1, 'found edge to neighbor');
    });

    assert.end();
});

test('getH3UnidirectionalEdgesFromHexagon - pentagon', assert => {
    const origin = '81623ffffffffff';
    const edges = h3.getH3UnidirectionalEdgesFromHexagon(origin);

    assert.equal(edges.length, 5, 'got expected edge count');

    const neighbors = h3.kRing(origin, 1).filter(hex => hex !== origin);
    neighbors.forEach(neighbor => {
        const edge = h3.getH3UnidirectionalEdge(origin, neighbor);
        assert.ok(edges.indexOf(edge) > -1, 'found edge to neighbor');
    });

    assert.end();
});

test('getH3UnidirectionalEdgeBoundary', assert => {
    const origin = '85283473fffffff';
    const edges = h3.getH3UnidirectionalEdgesFromHexagon(origin);

    // GeoBoundary of the origin
    const originBoundary = h3.h3ToGeoBoundary(origin);

    const expectedEdges = [
        [originBoundary[3], originBoundary[4]],
        [originBoundary[1], originBoundary[2]],
        [originBoundary[2], originBoundary[3]],
        [originBoundary[5], originBoundary[0]],
        [originBoundary[4], originBoundary[5]],
        [originBoundary[0], originBoundary[1]]
    ];

    edges.forEach((edge, i) => {
        const latlngs = h3.getH3UnidirectionalEdgeBoundary(edge);
        assert.deepEqual(
            toLowPrecision(latlngs),
            toLowPrecision(expectedEdges[i]),
            `Coordinates match expected for edge ${i}`
        );
    });

    assert.end();
});

test('getH3UnidirectionalEdgeBoundary - 10-vertex pentagon', assert => {
    const origin = '81623ffffffffff';
    const edges = h3.getH3UnidirectionalEdgesFromHexagon(origin);

    // GeoBoundary of the origin
    const originBoundary = h3.h3ToGeoBoundary(origin);

    const expectedEdges = [
        [originBoundary[2], originBoundary[3], originBoundary[4]],
        [originBoundary[4], originBoundary[5], originBoundary[6]],
        [originBoundary[8], originBoundary[9], originBoundary[0]],
        [originBoundary[6], originBoundary[7], originBoundary[8]],
        [originBoundary[0], originBoundary[1], originBoundary[2]]
    ];

    edges.forEach((edge, i) => {
        const latlngs = h3.getH3UnidirectionalEdgeBoundary(edge);
        assert.deepEqual(
            toLowPrecision(latlngs),
            toLowPrecision(expectedEdges[i]),
            `Coordinates match expected for edge ${i}`
        );
    });

    assert.end();
});

test('h3Distance', assert => {
    const origin = h3.geoToH3(37.5, -122, 9);
    for (let radius = 0; radius < 4; radius++) {
        const others = h3.hexRing(origin, radius);
        for (let i = 0; i < others.length; i++) {
            assert.equals(
                h3.h3Distance(origin, others[i]),
                radius,
                `Got distance ${radius} for (${origin}, ${others[i]})`
            );
        }
    }
    assert.end();
});

test('h3Distance - failure', assert => {
    const origin = h3.geoToH3(37.5, -122, 9);
    const origin10 = h3.geoToH3(37.5, -122, 10);
    const edge = '1591ea6d6533ffff';
    const distantHex = h3.geoToH3(-37.5, 122, 9);

    assert.equals(
        h3.h3Distance(origin, origin10),
        -1,
        'Returned -1 for distance between different resolutions'
    );
    assert.equals(
        h3.h3Distance(origin, edge),
        -1,
        'Returned -1 for distance between hexagon and edge'
    );
    assert.equals(
        h3.h3Distance(origin, distantHex),
        -1,
        'Returned -1 for distance between distant hexagons'
    );
    assert.end();
});

test('h3Line', assert => {
    for (let res = 0; res < 12; res++) {
        const origin = h3.geoToH3(37.5, -122, res);
        const destination = h3.geoToH3(25, -120, res);
        const line = h3.h3Line(origin, destination);
        const distance = h3.h3Distance(origin, destination);
        assert.equals(line.length, distance + 1, `distance matches expected: ${distance + 1}`);
        // property-based test for the line
        assert.ok(
            line.every((h3Index, i) => i === 0 || h3.h3IndexesAreNeighbors(h3Index, line[i - 1])),
            'every index in the line is a neighbor of the previous'
        );
    }
    assert.end();
});

test('h3Line - failure', assert => {
    const origin = h3.geoToH3(37.5, -122, 9);
    const origin10 = h3.geoToH3(37.5, -122, 10);

    assert.throws(
        () => h3.h3Line(origin, origin10),
        /Line cannot be calculated/,
        'got expected error for different resolutions'
    );
    assert.end();
});

test('experimentalH3ToLocalIj / experimentalLocalIjToH3', assert => {
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
            h3.experimentalH3ToLocalIj(origin, h3Index),
            coords,
            `Got expected coordinates for ${h3Index}`
        );
        assert.deepEqual(
            h3.experimentalLocalIjToH3(origin, coords),
            h3Index,
            `Got expected H3 index for ${JSON.stringify(coords)}`
        );
    });
    assert.end();
});

test('experimentalH3ToLocalIj / experimentalLocalIjToH3 - Pentagon', assert => {
    const origin = '811c3ffffffffff';
    [
        [origin, {i: 0, j: 0}],
        ['811d3ffffffffff', {i: 1, j: 0}],
        ['811cfffffffffff', {i: -1, j: 0}]
    ].forEach(([h3Index, coords]) => {
        assert.deepEqual(
            h3.experimentalH3ToLocalIj(origin, h3Index),
            coords,
            `Got expected coordinates for ${h3Index}`
        );
        assert.deepEqual(
            h3.experimentalLocalIjToH3(origin, coords),
            h3Index,
            `Got expected H3 index for ${JSON.stringify(coords)}`
        );
    });
    assert.end();
});

test('experimentalH3ToLocalIj - errors', assert => {
    assert.throws(
        () => h3.experimentalH3ToLocalIj('832830fffffffff', '822837fffffffff'),
        /Incompatible/,
        'Got expected error'
    );
    assert.throws(
        () => h3.experimentalH3ToLocalIj('822a17fffffffff', '822837fffffffff'),
        /too far/,
        'Got expected error'
    );
    assert.throws(
        () => h3.experimentalH3ToLocalIj('8828308281fffff', '8841492553fffff'),
        /too far/,
        'Got expected error for opposite sides of the world'
    );
    assert.throws(
        () => h3.experimentalH3ToLocalIj('81283ffffffffff', '811cbffffffffff'),
        /pentagon distortion/,
        'Got expected error'
    );
    assert.throws(
        () => h3.experimentalH3ToLocalIj('811d3ffffffffff', '8122bffffffffff'),
        /pentagon distortion/,
        'Got expected error'
    );

    assert.end();
});

test('experimentalLocalIjToH3 - errors', assert => {
    assert.throws(
        () => h3.experimentalLocalIjToH3('8049fffffffffff', null),
        /Coordinates must be provided/,
        'Got expected error'
    );
    assert.throws(
        () => h3.experimentalLocalIjToH3('8049fffffffffff', [1, 0]),
        /Coordinates must be provided/,
        'Got expected error'
    );
    assert.throws(
        () => h3.experimentalLocalIjToH3('8049fffffffffff', {i: 2, j: 0}),
        /Index not defined/,
        'Got expected error'
    );

    assert.end();
});

test('hexArea', assert => {
    let last = 1e14;
    for (let res = 0; res < 16; res++) {
        const result = h3.hexArea(res, h3.UNITS.m2);
        assert.ok(typeof result === 'number', 'Got numeric response for m2');
        assert.ok(result < last, `result < last result: ${result}` + `, ${last}`);
        last = result;
    }

    last = 1e7;
    for (let res = 0; res < 16; res++) {
        const result = h3.hexArea(res, h3.UNITS.km2);
        assert.ok(typeof result === 'number', 'Got numeric response for km2');
        assert.ok(result < last, `result < last result: ${result}` + `, ${last}`);
        last = result;
    }

    assert.end();
});

test('hexArea - bad units', assert => {
    const res = 9;
    assert.throws(() => h3.hexArea(res), /Unknown/, 'throws on missing unit');
    assert.throws(() => h3.hexArea(res, 'foo'), /Unknown/, 'throws on unknown unit');
    assert.throws(() => h3.hexArea(res, 42), /Unknown/, 'throws on unknown unit');
    assert.throws(() => h3.hexArea(res, h3.UNITS.km), /Unknown/, 'throws on invalid unit');

    assert.end();
});

test('hexArea - bad resolution', assert => {
    assert.throws(() => h3.hexArea(42, h3.UNITS.m2), /Invalid/, 'throws on invalid resolution');

    assert.throws(() => h3.hexArea(), /Invalid/, 'throws on invalid resolution');

    assert.end();
});

test('edgeLength', assert => {
    let last = 1e7;
    for (let res = 0; res < 16; res++) {
        const result = h3.edgeLength(res, h3.UNITS.m);
        assert.ok(typeof result === 'number', 'Got numeric response for m');
        assert.ok(result < last, `result < last result: ${result}` + `, ${last}`);
        last = result;
    }

    last = 1e4;
    for (let res = 0; res < 16; res++) {
        const result = h3.edgeLength(res, h3.UNITS.km);
        assert.ok(typeof result === 'number', 'Got numeric response for km');
        assert.ok(result < last, `result < last result: ${result}` + `, ${last}`);
        last = result;
    }

    assert.end();
});

test('edgeLength - bad units', assert => {
    const res = 9;
    assert.throws(() => h3.edgeLength(res), /Unknown/, 'throws on missing unit');
    assert.throws(() => h3.edgeLength(res, 'foo'), /Unknown/, 'throws on unknown unit');
    assert.throws(() => h3.edgeLength(res, 42), /Unknown/, 'throws on unknown unit');
    assert.throws(() => h3.edgeLength(res, h3.UNITS.km2), /Unknown/, 'throws on invalid unit');

    assert.end();
});

test('edgeLength - bad resolution', assert => {
    assert.throws(() => h3.edgeLength(42, h3.UNITS.m), /Invalid/, 'throws on invalid resolution');

    assert.throws(() => h3.edgeLength(), /Invalid/, 'throws on invalid resolution');

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
        const h3Index = h3.geoToH3(0, 0, res);
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
                almostEqual(cellAreaKm2, h3.hexArea(res, h3.UNITS.km2), 0.4),
            `Area is close to average area at res ${res}, km2`
        );
        const cellAreaM2 = h3.cellArea(h3Index, h3.UNITS.m2);
        assert.ok(
            // res 0 has high distortion of average area due to high pentagon proportion
            res === 0 ||
                // This seems to be the lowest factor that works for other resolutions
                almostEqual(cellAreaM2, h3.hexArea(res, h3.UNITS.m2), 0.4),
            `Area is close to average area at res ${res}, m2`
        );
        assert.ok(cellAreaM2 > cellAreaKm2, 'm2 > Km2');
        assert.ok(cellAreaKm2 > h3.cellArea(h3Index, h3.UNITS.rads2), 'Km2 > rads2');
    }
    assert.end();
});

test('cellArea - bad units', assert => {
    const h3Index = h3.geoToH3(0, 0, 9);
    assert.throws(() => h3.cellArea(h3Index), /Unknown/, 'throws on missing unit');
    assert.throws(() => h3.cellArea(h3Index, 'foo'), /Unknown/, 'throws on unknown unit');
    assert.throws(() => h3.cellArea(h3Index, 42), /Unknown/, 'throws on unknown unit');
    assert.throws(() => h3.cellArea(h3Index, h3.UNITS.km), /Unknown/, 'throws on invalid unit');

    assert.end();
});

test('exactEdgeLength', assert => {
    for (let res = 0; res < 16; res++) {
        const h3Index = h3.geoToH3(0, 0, res);
        const edges = h3.getH3UnidirectionalEdgesFromHexagon(h3Index);
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const lengthKm = h3.exactEdgeLength(edge, h3.UNITS.km);
            assert.ok(lengthKm > 0, 'Has some length');
            assert.ok(
                // res 0 has high distortion of average edge length due to high pentagon proportion
                res === 0 ||
                    // This seems to be the lowest factor that works for other resolutions
                    almostEqual(lengthKm, h3.edgeLength(res, h3.UNITS.km), 0.2),
                `Edge length is close to average edge length at res ${res}, km`
            );
            const lengthM = h3.exactEdgeLength(edge, h3.UNITS.m);
            assert.ok(
                // res 0 has high distortion of average edge length due to high pentagon proportion
                res === 0 ||
                    // This seems to be the lowest factor that works for other resolutions
                    almostEqual(lengthM, h3.edgeLength(res, h3.UNITS.m), 0.2),
                `Edge length is close to average edge length at res ${res}, m`
            );
            assert.ok(lengthM > lengthKm, 'm > Km');
            assert.ok(lengthKm > h3.exactEdgeLength(edge, h3.UNITS.rads), 'Km > rads');
        }
    }
    assert.end();
});

test('edgeLength - bad units', assert => {
    const h3Index = h3.geoToH3(0, 0, 9);
    const edge = h3.getH3UnidirectionalEdgesFromHexagon(h3Index)[0];
    assert.throws(() => h3.exactEdgeLength(edge), /Unknown/, 'throws on missing unit');
    assert.throws(() => h3.exactEdgeLength(edge, 'foo'), /Unknown/, 'throws on unknown unit');
    assert.throws(() => h3.exactEdgeLength(edge, 42), /Unknown/, 'throws on unknown unit');
    assert.throws(() => h3.exactEdgeLength(edge, h3.UNITS.m2), /Unknown/, 'throws on invalid unit');

    assert.end();
});

test('pointDist', assert => {
    assert.ok(
        almostEqual(h3.pointDist([-10, 0], [10, 0], h3.UNITS.rads), h3.degsToRads(20)),
        'Got expected angular distance for latitude along the equator'
    );
    assert.ok(
        almostEqual(h3.pointDist([0, -10], [0, 10], h3.UNITS.rads), h3.degsToRads(20)),
        'Got expected angular distance for latitude along a meridian'
    );
    assert.equal(
        h3.pointDist([23, 23], [23, 23], h3.UNITS.rads),
        0,
        'Got expected angular distance for same point'
    );
    // Just rough tests for the other units
    const distKm = h3.pointDist([0, 0], [39, -122], h3.UNITS.km);
    assert.ok(distKm > 12e3 && distKm < 13e3, 'has some reasonable distance in Km');
    const distM = h3.pointDist([0, 0], [39, -122], h3.UNITS.m);
    assert.ok(distM > 12e6 && distM < 13e6, 'has some reasonable distance in m');

    assert.end();
});

test('pointDist - bad units', assert => {
    assert.throws(() => h3.pointDist([0, 0], [0, 0]), /Unknown/, 'throws on missing unit');
    assert.throws(() => h3.pointDist([0, 0], [0, 0], 'foo'), /Unknown/, 'throws on unknown unit');
    assert.throws(() => h3.pointDist([0, 0], [0, 0], 42), /Unknown/, 'throws on unknown unit');
    assert.throws(
        () => h3.pointDist([0, 0], [0, 0], h3.UNITS.m2),
        /Unknown/,
        'throws on invalid unit'
    );

    assert.end();
});

test('numHexagons', assert => {
    let last = 0;
    for (let res = 0; res < 16; res++) {
        const result = h3.numHexagons(res);
        assert.ok(typeof result === 'number', `Got numeric response ${result}`);
        assert.ok(result > last, `result > last result: ${result}` + `, ${last}`);
        last = result;
    }
    assert.end();
});

test('numHexagons - bad resolution', assert => {
    assert.throws(() => h3.numHexagons(42), /Invalid/, 'throws on invalid resolution');
    assert.throws(() => h3.numHexagons(), /Invalid/, 'throws on invalid resolution');

    assert.end();
});

test('getRes0Indexes', assert => {
    const indexes = h3.getRes0Indexes();
    assert.equal(indexes.length, 122, 'Got expected count');
    assert.ok(indexes.every(h3.h3IsValid), 'All indexes are valid');

    assert.end();
});

test('getPentagonIndexes', assert => {
    for (let res = 0; res < 15; res++) {
        const indexes = h3.getPentagonIndexes(res);
        assert.equal(indexes.length, 12, 'Got expected count');
        assert.ok(indexes.every(h3.h3IsValid), 'All indexes are valid');
        assert.ok(indexes.every(h3.h3IsPentagon), 'All indexes are pentagons');
        assert.ok(
            indexes.every(idx => h3.h3GetResolution(idx) === res),
            'All indexes have the right resolution'
        );
        assert.equal(new Set(indexes).size, indexes.length, 'All indexes are unique');
    }
    assert.end();
});

test('getPentagonIndexes - invalid', assert => {
    assert.throws(() => h3.getPentagonIndexes(), /Invalid/, 'throws on invalid resolution');
    assert.throws(() => h3.getPentagonIndexes(42), /Invalid/, 'throws on invalid resolution');
    assert.end();
});
