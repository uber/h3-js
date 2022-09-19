<!-- the README is generated from a template, please edit doc-files/README.md.tmpl -->

<img align="right" src="https://uber.github.io/img/h3Logo-color.svg" alt="H3 Logo" width="200">

# h3-js

[![Build Status](https://github.com/uber/h3-js/workflows/test/badge.svg)](https://github.com/uber/h3-js/actions)
[![Coverage Status](https://coveralls.io/repos/github/uber/h3-js/badge.svg?branch=master)](https://coveralls.io/github/uber/h3-js?branch=master)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/h3-js.svg)](https://badge.fury.io/js/h3-js)
[![H3 Version](https://img.shields.io/static/v1?label=h3%20api&message=v4.0.0&color=blue)](https://github.com/uber/h3/releases/tag/v4.0.1)

The `h3-js` library provides a pure-JavaScript version of the [H3 Core Library](https://github.com/uber/h3), a hexagon-based geographic grid system. It can be used either in Node >= 6 or in the browser. The core library is transpiled from C using [emscripten](http://kripken.github.io/emscripten-site), offering full parity with the C API and highly efficient operations.

For more information on H3 and for the full API documentation, please see the [H3 Documentation](https://h3geo.org).

-   Post **bug reports or feature requests** to the [Github Issues page](https://github.com/uber/h3-js/issues)
-   Ask **questions** by posting to the [H3 tag on StackOverflow](https://stackoverflow.com/questions/tagged/h3)

## Install

    npm install h3-js

## Usage

> :tada: **Note:** The following usage docs apply to **H3 v4**, which was released on August 23, 2022.
>
> - For v3 docs, [see the latest v3.x.x release](https://github.com/uber/h3-js/blob/v3.7.2/README.md).
> - For breaking changes in v4, [see the CHANGELOG](./CHANGELOG.md). In particular, most [function names have changed](https://h3geo.org/docs/library/migration-3.x/functions).

The library uses ES6 modules. Bundles for Node and the browser are built to the `dist` folder.

### Import

ES6 usage:

```js
import {latLngToCell} from "h3-js";
```

CommonJS usage:

```js
const h3 = require("h3-js");
```

Pre-bundled script (library is available as an `h3` global):

```html
<script src="https://unpkg.com/h3-js"></script>
```

### Core functions

```js
// Convert a lat/lng point to a hexagon index at resolution 7
const h3Index = h3.latLngToCell(37.3615593, -122.0553238, 7);
// -> '87283472bffffff'

// Get the center of the hexagon
const hexCenterCoordinates = h3.cellToLatLng(h3Index);
// -> [37.35171820183272, -122.05032565263946]

// Get the vertices of the hexagon
const hexBoundary = h3.cellToBoundary(h3Index);
// -> [ [37.341099093235684, -122.04156135164334 ], ...]
```

### Useful algorithms

```js
// Get all neighbors within 1 step of the hexagon
const disk = h3.gridDisk(h3Index, 1);
// -> ['87283472bffffff', '87283472affffff', ...]

// Get the set of hexagons within a polygon
const polygon = [
    [37.813318999983238, -122.4089866999972145],
    [37.7198061999978478, -122.3544736999993603],
    [37.8151571999998453, -122.4798767000009008]
];
const hexagons = h3.polygonToCells(polygon, 7);
// -> ['872830828ffffff', '87283082effffff', ...]

// Get the outline of a set of hexagons, as a GeoJSON-style MultiPolygon
const coordinates = h3.cellsToMultiPolygon(hexagons, true);
// -> [[[
//      [-122.37681938644465, 37.76546768434345],
//      [-122.3856345540363,37.776004200673846],
//      ...
//    ]]]
```

## API Reference

{{>main}}

## Legacy API

H3 v4 renamed the majority of the functions in the library. To help ease migration from H3 v3 to H3 v4, we offer a legacy API wrapper at `h3-js/legacy`, which exports the v4 functions with the v3 names. Users are welcome to use the legacy API wrapper as a transitional support, but are encouraged to upgrade to the H3 v4 API as soon as possible.

Note that the legacy API is _not_ 100% backwards compatible - it's a thin wrapper on top of the v4 functions, so in cases where behavior has changed, the v4 behavior will be used. In particular, many of the v4 functions will throw errors for invalid input, where v3 functions would return null.

Installation:

```
npm install h3-js
```

Usage:

```
import {geoToH3} from 'h3-js/legacy';

const h3Index = geoToH3(37.3615593, -122.0553238, 7);
```

## Development

The `h3-js` library uses `yarn` as the preferred package manager. To install the dev dependencies, just run:

    yarn

To lint the code:

    yarn lint

To run the tests:

    yarn test

Code must be formatted with `prettier`; unformatted code will fail the build. To format all files:

    yarn prettier

### Benchmarks

The `h3-js` library includes a basic benchmark suite using [Benchmark.js](https://benchmarkjs.com/). Because many of the functions may be called over thousands of hexagons in a "hot loop", performance is an important concern. Benchmarks are run against the transpiled ES5 code by default.

To run the benchmarks in Node:

    yarn benchmark-node

To run the benchmarks in a browser:

    yarn benchmark-browser

Sample Node output (Macbook Pro running Node 12):

```
isValidCell x 3,650,995 ops/sec ±1.67% (87 runs sampled)
latLngToCell x 429,982 ops/sec ±1.39% (86 runs sampled)
cellToLatLng x 1,161,867 ops/sec ±1.11% (84 runs sampled)
cellToLatLng - integers x 1,555,791 ops/sec ±1.29% (86 runs sampled)
cellToBoundary x 375,938 ops/sec ±1.25% (87 runs sampled)
cellToBoundary - integers x 377,181 ops/sec ±1.18% (85 runs sampled)
getIcosahedronFaces x 992,946 ops/sec ±1.13% (85 runs sampled)
gridDisk x 194,400 ops/sec ±1.16% (85 runs sampled)
polygonToCells_9 x 4,919 ops/sec ±0.79% (87 runs sampled)
polygonToCells_11 x 368 ops/sec ±0.76% (86 runs sampled)
polygonToCells_10ring x 76.88 ops/sec ±0.57% (68 runs sampled)
cellsToMultiPolygon x 760 ops/sec ±1.06% (86 runs sampled)
compactCells x 2,466 ops/sec ±0.75% (86 runs sampled)
uncompactCells x 715 ops/sec ±1.15% (85 runs sampled)
areNeighborCells x 1,073,086 ops/sec ±1.56% (89 runs sampled)
cellsToDirectedEdge x 692,172 ops/sec ±1.06% (86 runs sampled)
getDirectedEdgeOrigin x 995,390 ops/sec ±1.60% (85 runs sampled)
getDirectedEdgeDestination x 930,473 ops/sec ±1.11% (86 runs sampled)
isValidDirectedEdge x 3,505,407 ops/sec ±1.05% (87 runs sampled)
```

When making code changes that may affect performance, please run benchmarks against `master` and then against your branch to identify any regressions.

### Transpiling the C Source

The core library is transpiled using [emscripten](http://kripken.github.io/emscripten-site). The easiest way to build from source locally is by using Docker. Make sure Docker is installed, then:

    yarn docker-boot
    yarn build-emscripten

The build script uses the `H3_VERSION` file to determine the version of the core library to build. To use a different version of the library (e.g. to test local changes), clone the desired H3 repo to `./h3c` and then run `yarn docker-emscripten`.

## Contributing

Pull requests and [Github issues](https://github.com/uber/h3-js/issues) are welcome. Please include tests for new work, and keep the library test coverage at 100%. Please note that the purpose of this module is to expose the API of the [H3 Core library](https://github.com/uber/h3), so we will rarely accept new features that are not part of that API. New proposed feature work is more appropriate in the core C library or in a new JS library that depends on `h3-js`.

Before we can merge your changes, you must agree to the [Uber Contributor License Agreement](http://cla-assistant.io/uber/h3-js).

## Versioning

The [H3 core library](https://github.com/uber/h3) adheres to [Semantic Versioning](http://semver.org/). The `h3-js` library has a `major.minor.patch` version scheme. The major and minor version numbers of `h3-js` are the major and minor version of the bound core library, respectively. The patch version is incremented independently of the core library.

## Legal and Licensing

The `h3-js` library is licensed under the [Apache 2.0 License](https://github.com/uber/h3-js/blob/master/LICENSE).

DGGRID Copyright (c) 2015 Southern Oregon University
