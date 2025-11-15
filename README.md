<!-- the README is generated from a template, please edit doc-files/README.md.tmpl -->

<img align="right" src="https://uber.github.io/img/h3Logo-color.svg" alt="H3 Logo" width="200">

# h3-js

[![Build Status](https://github.com/uber/h3-js/workflows/test/badge.svg)](https://github.com/uber/h3-js/actions)
[![Coverage Status](https://coveralls.io/repos/github/uber/h3-js/badge.svg?branch=master)](https://coveralls.io/github/uber/h3-js?branch=master)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/h3-js.svg)](https://badge.fury.io/js/h3-js)
[![H3 Version](https://img.shields.io/static/v1?label=h3%20api&message=v4.4.1&color=blue)](https://github.com/uber/h3/releases/tag/v4.4.1)

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

<a name="module_h3"></a>

## h3

* [h3](#module_h3)
    * [.UNITS](#module_h3.UNITS)
    * [.POLYGON_TO_CELLS_FLAGS](#module_h3.POLYGON_TO_CELLS_FLAGS)
    * [.h3IndexToSplitLong(h3Index)](#module_h3.h3IndexToSplitLong) ⇒ <code>SplitLong</code>
    * [.splitLongToH3Index(lower, upper)](#module_h3.splitLongToH3Index) ⇒ <code>H3Index</code>
    * [.isValidCell(h3Index)](#module_h3.isValidCell) ⇒ <code>boolean</code>
    * [.isValidIndex(h3Index)](#module_h3.isValidIndex) ⇒ <code>boolean</code>
    * [.isPentagon(h3Index)](#module_h3.isPentagon) ⇒ <code>boolean</code>
    * [.isResClassIII(h3Index)](#module_h3.isResClassIII) ⇒ <code>boolean</code>
    * [.getBaseCellNumber(h3Index)](#module_h3.getBaseCellNumber) ⇒ <code>number</code>
    * [.getIndexDigit(h3Index, digit)](#module_h3.getIndexDigit) ⇒ <code>number</code>
    * [.getIcosahedronFaces(h3Index)](#module_h3.getIcosahedronFaces) ⇒ <code>Array.&lt;number&gt;</code>
    * [.getResolution(h3Index)](#module_h3.getResolution) ⇒ <code>number</code>
    * [.constructCell(baseCellNumber, digits, res)](#module_h3.constructCell) ⇒ <code>H3Index</code>
    * [.latLngToCell(lat, lng, res)](#module_h3.latLngToCell) ⇒ <code>H3Index</code>
    * [.cellToLatLng(h3Index)](#module_h3.cellToLatLng) ⇒ <code>CoordPair</code>
    * [.cellToBoundary(h3Index, [formatAsGeoJson])](#module_h3.cellToBoundary) ⇒ <code>Array.&lt;CoordPair&gt;</code>
    * [.cellToParent(h3Index, res)](#module_h3.cellToParent) ⇒ <code>H3Index</code>
    * [.cellToChildren(h3Index, res)](#module_h3.cellToChildren) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.cellToChildrenSize(h3Index, res)](#module_h3.cellToChildrenSize) ⇒ <code>number</code>
    * [.cellToCenterChild(h3Index, res)](#module_h3.cellToCenterChild) ⇒ <code>H3Index</code>
    * [.cellToChildPos(h3Index, parentRes)](#module_h3.cellToChildPos) ⇒ <code>number</code>
    * [.childPosToCell(childPos, h3Index, childRes)](#module_h3.childPosToCell) ⇒ <code>H3Index</code>
    * [.gridDisk(h3Index, ringSize)](#module_h3.gridDisk) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.gridDiskDistances(h3Index, ringSize)](#module_h3.gridDiskDistances) ⇒ <code>Array.&lt;Array.&lt;H3Index&gt;&gt;</code>
    * [.gridRing(h3Index, ringSize)](#module_h3.gridRing) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.gridRingUnsafe(h3Index, ringSize)](#module_h3.gridRingUnsafe) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.polygonToCells(coordinates, res, [isGeoJson])](#module_h3.polygonToCells) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.polygonToCellsExperimental(coordinates, res, flags, [isGeoJson])](#module_h3.polygonToCellsExperimental) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.cellsToMultiPolygon(h3Indexes, [formatAsGeoJson])](#module_h3.cellsToMultiPolygon) ⇒ <code>Array.&lt;Array.&lt;Array.&lt;CoordPair&gt;&gt;&gt;</code>
    * [.compactCells(h3Set)](#module_h3.compactCells) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.uncompactCells(compactedSet, res)](#module_h3.uncompactCells) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.areNeighborCells(origin, destination)](#module_h3.areNeighborCells) ⇒ <code>boolean</code>
    * [.cellsToDirectedEdge(origin, destination)](#module_h3.cellsToDirectedEdge) ⇒ <code>H3Index</code>
    * [.getDirectedEdgeOrigin(edgeIndex)](#module_h3.getDirectedEdgeOrigin) ⇒ <code>H3Index</code>
    * [.getDirectedEdgeDestination(edgeIndex)](#module_h3.getDirectedEdgeDestination) ⇒ <code>H3Index</code>
    * [.isValidDirectedEdge(edgeIndex)](#module_h3.isValidDirectedEdge) ⇒ <code>boolean</code>
    * [.directedEdgeToCells(edgeIndex)](#module_h3.directedEdgeToCells) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.originToDirectedEdges(h3Index)](#module_h3.originToDirectedEdges) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.directedEdgeToBoundary(edgeIndex, [formatAsGeoJson])](#module_h3.directedEdgeToBoundary) ⇒ <code>Array.&lt;CoordPair&gt;</code>
    * [.gridDistance(origin, destination)](#module_h3.gridDistance) ⇒ <code>number</code>
    * [.gridPathCells(origin, destination)](#module_h3.gridPathCells) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.cellToLocalIj(origin, destination)](#module_h3.cellToLocalIj) ⇒ <code>CoordIJ</code>
    * [.localIjToCell(origin, coords)](#module_h3.localIjToCell) ⇒ <code>H3Index</code>
    * [.greatCircleDistance(latLng1, latLng2, unit)](#module_h3.greatCircleDistance) ⇒ <code>number</code>
    * [.cellArea(h3Index, unit)](#module_h3.cellArea) ⇒ <code>number</code>
    * [.edgeLength(edge, unit)](#module_h3.edgeLength) ⇒ <code>number</code>
    * [.getHexagonAreaAvg(res, unit)](#module_h3.getHexagonAreaAvg) ⇒ <code>number</code>
    * [.getHexagonEdgeLengthAvg(res, unit)](#module_h3.getHexagonEdgeLengthAvg) ⇒ <code>number</code>
    * [.cellToVertex(h3Index, vertexNum)](#module_h3.cellToVertex) ⇒ <code>H3Index</code>
    * [.cellToVertexes(h3Index)](#module_h3.cellToVertexes) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.vertexToLatLng(h3Index)](#module_h3.vertexToLatLng) ⇒ <code>CoordPair</code>
    * [.isValidVertex(h3Index)](#module_h3.isValidVertex) ⇒ <code>boolean</code>
    * [.getNumCells(res)](#module_h3.getNumCells) ⇒ <code>number</code>
    * [.getRes0Cells()](#module_h3.getRes0Cells) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.getPentagons(res)](#module_h3.getPentagons) ⇒ <code>Array.&lt;H3Index&gt;</code>
    * [.degsToRads(deg)](#module_h3.degsToRads) ⇒ <code>number</code>
    * [.radsToDegs(rad)](#module_h3.radsToDegs) ⇒ <code>number</code>
    * [.H3Index](#module_h3.H3Index) : <code>string</code>
    * [.H3IndexInput](#module_h3.H3IndexInput) : <code>string</code> \| <code>Array.&lt;number&gt;</code>
    * [.CoordIJ](#module_h3.CoordIJ)
    * [.H3Error](#module_h3.H3Error)
    * [.CoordPair](#module_h3.CoordPair) : <code>Array.&lt;number&gt;</code>
    * [.SplitLong](#module_h3.SplitLong) : <code>Array.&lt;number&gt;</code>


* * *

<a name="module_h3.UNITS"></a>

### h3.UNITS
Length/Area units

**Properties**

| Name | Type |
| --- | --- |
| m | <code>string</code> | 
| m2 | <code>string</code> | 
| km | <code>string</code> | 
| km2 | <code>string</code> | 
| rads | <code>string</code> | 
| rads2 | <code>string</code> | 


* * *

<a name="module_h3.POLYGON_TO_CELLS_FLAGS"></a>

### h3.POLYGON\_TO\_CELLS\_FLAGS
Mode flags for polygonToCells

**Properties**

| Name | Type |
| --- | --- |
| containmentCenter | <code>string</code> | 
| containmentFull | <code>string</code> | 
| containmentOverlapping | <code>string</code> | 
| containmentOverlappingBbox | <code>string</code> | 


* * *

<a name="module_h3.h3IndexToSplitLong"></a>

### h3.h3IndexToSplitLong(h3Index) ⇒ <code>SplitLong</code>
Convert an H3 index (64-bit hexidecimal string) into a "split long" - a pair of 32-bit ints

**Returns**: <code>SplitLong</code> - A two-element array with 32 lower bits and 32 upper bits  

| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to check |


* * *

<a name="module_h3.splitLongToH3Index"></a>

### h3.splitLongToH3Index(lower, upper) ⇒ <code>H3Index</code>
Get a H3 index string from a split long (pair of 32-bit ints)

**Returns**: <code>H3Index</code> - H3 index  

| Param | Type | Description |
| --- | --- | --- |
| lower | <code>number</code> | Lower 32 bits |
| upper | <code>number</code> | Upper 32 bits |


* * *

<a name="module_h3.isValidCell"></a>

### h3.isValidCell(h3Index) ⇒ <code>boolean</code>
Whether a given string represents a valid H3 cell index

**Returns**: <code>boolean</code> - Whether the cell index is valid  

| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to check |


* * *

<a name="module_h3.isValidIndex"></a>

### h3.isValidIndex(h3Index) ⇒ <code>boolean</code>
Whether a given string represents a valid H3 index
(e.g. it may be a cell, directed edge, vertex.)
Use <code>isValidCell</code> to check for a valid
hexagon (or pentagon) cell ID.

**Returns**: <code>boolean</code> - Whether the index is valid  

| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to check |


* * *

<a name="module_h3.isPentagon"></a>

### h3.isPentagon(h3Index) ⇒ <code>boolean</code>
Whether the given H3 index is a pentagon

**Returns**: <code>boolean</code> - isPentagon  

| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to check |


* * *

<a name="module_h3.isResClassIII"></a>

### h3.isResClassIII(h3Index) ⇒ <code>boolean</code>
Whether the given H3 index is in a Class III resolution (rotated versus
the icosahedron and subject to shape distortion adding extra points on
icosahedron edges, making them not true hexagons).

**Returns**: <code>boolean</code> - isResClassIII  

| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to check |


* * *

<a name="module_h3.getBaseCellNumber"></a>

### h3.getBaseCellNumber(h3Index) ⇒ <code>number</code>
Get the number of the base cell for a given H3 index

**Returns**: <code>number</code> - Index of the base cell (0-121)  

| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to get the base cell for |


* * *

<a name="module_h3.getIndexDigit"></a>

### h3.getIndexDigit(h3Index, digit) ⇒ <code>number</code>
Get the number of the indexing digit for an H3 index

**Returns**: <code>number</code> - Digit (0-7)  

| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to get the digit for |
| digit | <code>number</code> | Indexing digit to get the valeu of |


* * *

<a name="module_h3.getIcosahedronFaces"></a>

### h3.getIcosahedronFaces(h3Index) ⇒ <code>Array.&lt;number&gt;</code>
Get the indices of all icosahedron faces intersected by a given H3 index

**Returns**: <code>Array.&lt;number&gt;</code> - Indices (0-19) of all intersected faces  
**Throws**:

- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to get faces for |


* * *

<a name="module_h3.getResolution"></a>

### h3.getResolution(h3Index) ⇒ <code>number</code>
Returns the resolution of an H3 index

**Returns**: <code>number</code> - The number (0-15) resolution, or -1 if invalid  

| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to get resolution |


* * *

<a name="module_h3.constructCell"></a>

### h3.constructCell(baseCellNumber, digits, res) ⇒ <code>H3Index</code>
Creates a cell from its components (resolution, base cell number, and indexing digits).
This is the inverse operation of `getResolution`, `getBaseCellNumber`, and `getIndexDigit`.
Only allows creating valid cells.

**Returns**: <code>H3Index</code> - H3 index  
**Throws**:

- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| baseCellNumber | <code>number</code> | Base cell number of cell to return |
| digits | <code>Array.&lt;number&gt;</code> | Indexing digits of cell to return |
| res | <code>number</code> | Resolution of cell to return. Optional, if not specified, will be inferred from digits. |


* * *

<a name="module_h3.latLngToCell"></a>

### h3.latLngToCell(lat, lng, res) ⇒ <code>H3Index</code>
Get the hexagon (or pentagon) containing a lat,lon point

**Returns**: <code>H3Index</code> - H3 index  
**Throws**:

- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| lat | <code>number</code> | Latitude of point |
| lng | <code>number</code> | Longtitude of point |
| res | <code>number</code> | Resolution of cell to return |


* * *

<a name="module_h3.cellToLatLng"></a>

### h3.cellToLatLng(h3Index) ⇒ <code>CoordPair</code>
Get the lat,lon center of a given hexagon (or pentagon)

**Returns**: <code>CoordPair</code> - Point as a [lat, lng] pair  
**Throws**:

- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index |


* * *

<a name="module_h3.cellToBoundary"></a>

### h3.cellToBoundary(h3Index, [formatAsGeoJson]) ⇒ <code>Array.&lt;CoordPair&gt;</code>
Get the vertices of a given hexagon (or pentagon), as an array of [lat, lng]
points. For pentagons and hexagons on the edge of an icosahedron face, this
function may return up to 10 vertices.

**Returns**: <code>Array.&lt;CoordPair&gt;</code> - Array of [lat, lng] pairs  
**Throws**:

- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index |
| [formatAsGeoJson] | <code>boolean</code> | Whether to provide GeoJSON output: [lng, lat], closed loops |


* * *

<a name="module_h3.cellToParent"></a>

### h3.cellToParent(h3Index, res) ⇒ <code>H3Index</code>
Get the parent of the given hexagon at a particular resolution

**Returns**: <code>H3Index</code> - H3 index of parent, or null for invalid input  
**Throws**:

- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to get parent for |
| res | <code>number</code> | Resolution of hexagon to return |


* * *

<a name="module_h3.cellToChildren"></a>

### h3.cellToChildren(h3Index, res) ⇒ <code>Array.&lt;H3Index&gt;</code>
Get the children/descendents of the given hexagon at a particular resolution

**Returns**: <code>Array.&lt;H3Index&gt;</code> - H3 indexes of children, or empty array for invalid input  
**Throws**:

- <code>H3Error</code> If resolution is invalid or output is too large for JS


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to get children for |
| res | <code>number</code> | Resolution of hexagons to return |


* * *

<a name="module_h3.cellToChildrenSize"></a>

### h3.cellToChildrenSize(h3Index, res) ⇒ <code>number</code>
Get the number of children for a cell at a given resolution

**Returns**: <code>number</code> - Number of children at res for the given cell  
**Throws**:

- <code>H3Error</code> If cell or parentRes are invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to get child count for |
| res | <code>number</code> | Child resolution |


* * *

<a name="module_h3.cellToCenterChild"></a>

### h3.cellToCenterChild(h3Index, res) ⇒ <code>H3Index</code>
Get the center child of the given hexagon at a particular resolution

**Returns**: <code>H3Index</code> - H3 index of child, or null for invalid input  
**Throws**:

- <code>H3Error</code> If resolution is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to get center child for |
| res | <code>number</code> | Resolution of cell to return |


* * *

<a name="module_h3.cellToChildPos"></a>

### h3.cellToChildPos(h3Index, parentRes) ⇒ <code>number</code>
Get the position of the cell within an ordered list of all children of the
cell's parent at the specified resolution.

**Returns**: <code>number</code> - Position of child within parent at parentRes  
**Throws**:

- <code>H3Error</code> If cell or parentRes are invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index to get child pos for |
| parentRes | <code>number</code> | Resolution of reference parent |


* * *

<a name="module_h3.childPosToCell"></a>

### h3.childPosToCell(childPos, h3Index, childRes) ⇒ <code>H3Index</code>
Get the child cell at a given position within an ordered list of all children
at the specified resolution

**Returns**: <code>H3Index</code> - H3 index of child  
**Throws**:

- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| childPos | <code>number</code> | Position of the child cell to get |
| h3Index | <code>H3IndexInput</code> | H3 index of the parent cell |
| childRes | <code>number</code> | Resolution of child cell to return |


* * *

<a name="module_h3.gridDisk"></a>

### h3.gridDisk(h3Index, ringSize) ⇒ <code>Array.&lt;H3Index&gt;</code>
Get all hexagons in a k-ring around a given center. The order of the hexagons is undefined.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - H3 indexes for all hexagons in ring  
**Throws**:

- <code>H3Error</code> If input is invalid or output is too large for JS


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index of center hexagon |
| ringSize | <code>number</code> | Radius of k-ring |


* * *

<a name="module_h3.gridDiskDistances"></a>

### h3.gridDiskDistances(h3Index, ringSize) ⇒ <code>Array.&lt;Array.&lt;H3Index&gt;&gt;</code>
Get all hexagons in a k-ring around a given center, in an array of arrays
ordered by distance from the origin. The order of the hexagons within each ring is undefined.

**Returns**: <code>Array.&lt;Array.&lt;H3Index&gt;&gt;</code> - Array of arrays with H3 indexes for all hexagons each ring  
**Throws**:

- <code>H3Error</code> If input is invalid or output is too large for JS


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index of center hexagon |
| ringSize | <code>number</code> | Radius of k-ring |


* * *

<a name="module_h3.gridRing"></a>

### h3.gridRing(h3Index, ringSize) ⇒ <code>Array.&lt;H3Index&gt;</code>
Get all hexagons in a hollow hexagonal ring centered at origin with sides of a given length.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - H3 indexes for all hexagons in ring  
**Throws**:

- <code>Error</code> If the algorithm could not calculate the ring
- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index of center hexagon |
| ringSize | <code>number</code> | Radius of ring |


* * *

<a name="module_h3.gridRingUnsafe"></a>

### h3.gridRingUnsafe(h3Index, ringSize) ⇒ <code>Array.&lt;H3Index&gt;</code>
Get all hexagons in a hollow hexagonal ring centered at origin with sides of a given length.
Unlike gridDisk, this function will throw an error if there is a pentagon anywhere in the ring.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - H3 indexes for all hexagons in ring  
**Throws**:

- <code>Error</code> If the algorithm could not calculate the ring
- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index of center hexagon |
| ringSize | <code>number</code> | Radius of ring |


* * *

<a name="module_h3.polygonToCells"></a>

### h3.polygonToCells(coordinates, res, [isGeoJson]) ⇒ <code>Array.&lt;H3Index&gt;</code>
Get all hexagons with centers contained in a given polygon. The polygon
is specified with GeoJson semantics as an array of loops. Each loop is
an array of [lat, lng] pairs (or [lng, lat] if isGeoJson is specified).
The first loop is the perimeter of the polygon, and subsequent loops are
expected to be holes.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - H3 indexes for all hexagons in polygon  
**Throws**:

- <code>H3Error</code> If input is invalid or output is too large for JS


| Param | Type | Description |
| --- | --- | --- |
| coordinates | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> \| <code>Array.&lt;Array.&lt;Array.&lt;number&gt;&gt;&gt;</code> | Array of loops, or a single loop |
| res | <code>number</code> | Resolution of hexagons to return |
| [isGeoJson] | <code>boolean</code> | Whether to expect GeoJson-style [lng, lat]                                  pairs instead of [lat, lng] |


* * *

<a name="module_h3.polygonToCellsExperimental"></a>

### h3.polygonToCellsExperimental(coordinates, res, flags, [isGeoJson]) ⇒ <code>Array.&lt;H3Index&gt;</code>
Get all hexagons with centers contained in a given polygon. The polygon
is specified with GeoJson semantics as an array of loops. Each loop is
an array of [lat, lng] pairs (or [lng, lat] if isGeoJson is specified).
The first loop is the perimeter of the polygon, and subsequent loops are
expected to be holes.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - H3 indexes for all hexagons in polygon  
**Throws**:

- <code>H3Error</code> If input is invalid or output is too large for JS


| Param | Type | Description |
| --- | --- | --- |
| coordinates | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> \| <code>Array.&lt;Array.&lt;Array.&lt;number&gt;&gt;&gt;</code> | Array of loops, or a single loop |
| res | <code>number</code> | Resolution of hexagons to return |
| flags | <code>string</code> | Value from POLYGON_TO_CELLS_FLAGS |
| [isGeoJson] | <code>boolean</code> | Whether to expect GeoJson-style [lng, lat]                                  pairs instead of [lat, lng] |


* * *

<a name="module_h3.cellsToMultiPolygon"></a>

### h3.cellsToMultiPolygon(h3Indexes, [formatAsGeoJson]) ⇒ <code>Array.&lt;Array.&lt;Array.&lt;CoordPair&gt;&gt;&gt;</code>
Get the outlines of a set of H3 hexagons, returned in GeoJSON MultiPolygon
format (an array of polygons, each with an array of loops, each an array of
coordinates). Coordinates are returned as [lat, lng] pairs unless GeoJSON
is requested.

It is the responsibility of the caller to ensure that all hexagons in the
set have the same resolution and that the set contains no duplicates. Behavior
is undefined if duplicates or multiple resolutions are present, and the
algorithm may produce unexpected or invalid polygons.

**Returns**: <code>Array.&lt;Array.&lt;Array.&lt;CoordPair&gt;&gt;&gt;</code> - MultiPolygon-style output.  
**Throws**:

- <code>H3Error</code> If input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Indexes | <code>Array.&lt;H3IndexInput&gt;</code> | H3 indexes to get outlines for |
| [formatAsGeoJson] | <code>boolean</code> | Whether to provide GeoJSON output: [lng, lat], closed loops |


* * *

<a name="module_h3.compactCells"></a>

### h3.compactCells(h3Set) ⇒ <code>Array.&lt;H3Index&gt;</code>
Compact a set of hexagons of the same resolution into a set of hexagons across
multiple levels that represents the same area.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - Compacted H3 indexes  
**Throws**:

- <code>H3Error</code> If the input is invalid (e.g. duplicate hexagons)


| Param | Type | Description |
| --- | --- | --- |
| h3Set | <code>Array.&lt;H3IndexInput&gt;</code> | H3 indexes to compact |


* * *

<a name="module_h3.uncompactCells"></a>

### h3.uncompactCells(compactedSet, res) ⇒ <code>Array.&lt;H3Index&gt;</code>
Uncompact a compacted set of hexagons to hexagons of the same resolution

**Returns**: <code>Array.&lt;H3Index&gt;</code> - The uncompacted H3 indexes  
**Throws**:

- <code>H3Error</code> If the input is invalid (e.g. invalid resolution)


| Param | Type | Description |
| --- | --- | --- |
| compactedSet | <code>Array.&lt;H3IndexInput&gt;</code> | H3 indexes to uncompact |
| res | <code>number</code> | The resolution to uncompact to |


* * *

<a name="module_h3.areNeighborCells"></a>

### h3.areNeighborCells(origin, destination) ⇒ <code>boolean</code>
Whether two H3 indexes are neighbors (share an edge)

**Returns**: <code>boolean</code> - Whether the hexagons share an edge  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| origin | <code>H3IndexInput</code> | Origin hexagon index |
| destination | <code>H3IndexInput</code> | Destination hexagon index |


* * *

<a name="module_h3.cellsToDirectedEdge"></a>

### h3.cellsToDirectedEdge(origin, destination) ⇒ <code>H3Index</code>
Get an H3 index representing a unidirectional edge for a given origin and destination

**Returns**: <code>H3Index</code> - H3 index of the edge, or null if no edge is shared  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| origin | <code>H3IndexInput</code> | Origin hexagon index |
| destination | <code>H3IndexInput</code> | Destination hexagon index |


* * *

<a name="module_h3.getDirectedEdgeOrigin"></a>

### h3.getDirectedEdgeOrigin(edgeIndex) ⇒ <code>H3Index</code>
Get the origin hexagon from an H3 index representing a unidirectional edge

**Returns**: <code>H3Index</code> - H3 index of the edge origin  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| edgeIndex | <code>H3IndexInput</code> | H3 index of the edge |


* * *

<a name="module_h3.getDirectedEdgeDestination"></a>

### h3.getDirectedEdgeDestination(edgeIndex) ⇒ <code>H3Index</code>
Get the destination hexagon from an H3 index representing a unidirectional edge

**Returns**: <code>H3Index</code> - H3 index of the edge destination  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| edgeIndex | <code>H3IndexInput</code> | H3 index of the edge |


* * *

<a name="module_h3.isValidDirectedEdge"></a>

### h3.isValidDirectedEdge(edgeIndex) ⇒ <code>boolean</code>
Whether the input is a valid unidirectional edge

**Returns**: <code>boolean</code> - Whether the index is valid  

| Param | Type | Description |
| --- | --- | --- |
| edgeIndex | <code>H3IndexInput</code> | H3 index of the edge |


* * *

<a name="module_h3.directedEdgeToCells"></a>

### h3.directedEdgeToCells(edgeIndex) ⇒ <code>Array.&lt;H3Index&gt;</code>
Get the [origin, destination] pair represented by a unidirectional edge

**Returns**: <code>Array.&lt;H3Index&gt;</code> - [origin, destination] pair as H3 indexes  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| edgeIndex | <code>H3IndexInput</code> | H3 index of the edge |


* * *

<a name="module_h3.originToDirectedEdges"></a>

### h3.originToDirectedEdges(h3Index) ⇒ <code>Array.&lt;H3Index&gt;</code>
Get all of the unidirectional edges with the given H3 index as the origin (i.e. an edge to
every neighbor)

**Returns**: <code>Array.&lt;H3Index&gt;</code> - List of unidirectional edges  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index of the origin hexagon |


* * *

<a name="module_h3.directedEdgeToBoundary"></a>

### h3.directedEdgeToBoundary(edgeIndex, [formatAsGeoJson]) ⇒ <code>Array.&lt;CoordPair&gt;</code>
Get the vertices of a given edge as an array of [lat, lng] points. Note that for edges that
cross the edge of an icosahedron face, this may return 3 coordinates.

**Returns**: <code>Array.&lt;CoordPair&gt;</code> - Array of geo coordinate pairs  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| edgeIndex | <code>H3IndexInput</code> | H3 index of the edge |
| [formatAsGeoJson] | <code>boolean</code> | Whether to provide GeoJSON output: [lng, lat] |


* * *

<a name="module_h3.gridDistance"></a>

### h3.gridDistance(origin, destination) ⇒ <code>number</code>
Get the grid distance between two hex indexes. This function may fail
to find the distance between two indexes if they are very far apart or
on opposite sides of a pentagon.

**Returns**: <code>number</code> - Distance between hexagons  
**Throws**:

- <code>H3Error</code> If input is invalid or the distance could not be calculated


| Param | Type | Description |
| --- | --- | --- |
| origin | <code>H3IndexInput</code> | Origin hexagon index |
| destination | <code>H3IndexInput</code> | Destination hexagon index |


* * *

<a name="module_h3.gridPathCells"></a>

### h3.gridPathCells(origin, destination) ⇒ <code>Array.&lt;H3Index&gt;</code>
Given two H3 indexes, return the line of indexes between them (inclusive).

This function may fail to find the line between two indexes, for
example if they are very far apart. It may also fail when finding
distances for indexes on opposite sides of a pentagon.

Notes:

 - The specific output of this function should not be considered stable
   across library versions. The only guarantees the library provides are
   that the line length will be `h3Distance(start, end) + 1` and that
   every index in the line will be a neighbor of the preceding index.
 - Lines are drawn in grid space, and may not correspond exactly to either
   Cartesian lines or great arcs.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - H3 indexes connecting origin and destination  
**Throws**:

- <code>H3Error</code> If input is invalid or the line cannot be calculated


| Param | Type | Description |
| --- | --- | --- |
| origin | <code>H3IndexInput</code> | Origin hexagon index |
| destination | <code>H3IndexInput</code> | Destination hexagon index |


* * *

<a name="module_h3.cellToLocalIj"></a>

### h3.cellToLocalIj(origin, destination) ⇒ <code>CoordIJ</code>
Produces IJ coordinates for an H3 index anchored by an origin.

- The coordinate space used by this function may have deleted
regions or warping due to pentagonal distortion.
- Coordinates are only comparable if they come from the same
origin index.
- Failure may occur if the index is too far away from the origin
or if the index is on the other side of a pentagon.
- This function is experimental, and its output is not guaranteed
to be compatible across different versions of H3.

**Returns**: <code>CoordIJ</code> - Coordinates as an `{i, j}` pair  
**Throws**:

- <code>H3Error</code> If the IJ coordinates cannot be calculated


| Param | Type | Description |
| --- | --- | --- |
| origin | <code>H3IndexInput</code> | Origin H3 index |
| destination | <code>H3IndexInput</code> | H3 index for which to find relative coordinates |


* * *

<a name="module_h3.localIjToCell"></a>

### h3.localIjToCell(origin, coords) ⇒ <code>H3Index</code>
Produces an H3 index for IJ coordinates anchored by an origin.

- The coordinate space used by this function may have deleted
regions or warping due to pentagonal distortion.
- Coordinates are only comparable if they come from the same
origin index.
- Failure may occur if the index is too far away from the origin
or if the index is on the other side of a pentagon.
- This function is experimental, and its output is not guaranteed
to be compatible across different versions of H3.

**Returns**: <code>H3Index</code> - H3 index at the relative coordinates  
**Throws**:

- <code>H3Error</code> If the H3 index cannot be calculated


| Param | Type | Description |
| --- | --- | --- |
| origin | <code>H3IndexInput</code> | Origin H3 index |
| coords | <code>CoordIJ</code> | Coordinates as an `{i, j}` pair |


* * *

<a name="module_h3.greatCircleDistance"></a>

### h3.greatCircleDistance(latLng1, latLng2, unit) ⇒ <code>number</code>
Great circle distance between two geo points. This is not specific to H3,
but is implemented in the library and provided here as a convenience.

**Returns**: <code>number</code> - Great circle distance  
**Throws**:

- <code>H3Error</code> If the unit is invalid


| Param | Type | Description |
| --- | --- | --- |
| latLng1 | <code>Array.&lt;number&gt;</code> | Origin coordinate as [lat, lng] |
| latLng2 | <code>Array.&lt;number&gt;</code> | Destination coordinate as [lat, lng] |
| unit | <code>string</code> | Distance unit (either UNITS.m, UNITS.km, or UNITS.rads) |


* * *

<a name="module_h3.cellArea"></a>

### h3.cellArea(h3Index, unit) ⇒ <code>number</code>
Exact area of a given cell

**Returns**: <code>number</code> - Cell area  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | H3 index of the hexagon to measure |
| unit | <code>string</code> | Distance unit (either UNITS.m2, UNITS.km2, or UNITS.rads2) |


* * *

<a name="module_h3.edgeLength"></a>

### h3.edgeLength(edge, unit) ⇒ <code>number</code>
Calculate length of a given unidirectional edge

**Returns**: <code>number</code> - Cell area  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| edge | <code>H3IndexInput</code> | H3 index of the edge to measure |
| unit | <code>string</code> | Distance unit (either UNITS.m, UNITS.km, or UNITS.rads) |


* * *

<a name="module_h3.getHexagonAreaAvg"></a>

### h3.getHexagonAreaAvg(res, unit) ⇒ <code>number</code>
Average hexagon area at a given resolution

**Returns**: <code>number</code> - Average area  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| res | <code>number</code> | Hexagon resolution |
| unit | <code>string</code> | Area unit (either UNITS.m2, UNITS.km2, or UNITS.rads2) |


* * *

<a name="module_h3.getHexagonEdgeLengthAvg"></a>

### h3.getHexagonEdgeLengthAvg(res, unit) ⇒ <code>number</code>
Average hexagon edge length at a given resolution

**Returns**: <code>number</code> - Average edge length  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| res | <code>number</code> | Hexagon resolution |
| unit | <code>string</code> | Distance unit (either UNITS.m, UNITS.km, or UNITS.rads) |


* * *

<a name="module_h3.cellToVertex"></a>

### h3.cellToVertex(h3Index, vertexNum) ⇒ <code>H3Index</code>
Find the index for a vertex of a cell.

**Returns**: <code>H3Index</code> - Vertex index  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | Cell to find the vertex for |
| vertexNum | <code>number</code> | Number (index) of the vertex to calculate |


* * *

<a name="module_h3.cellToVertexes"></a>

### h3.cellToVertexes(h3Index) ⇒ <code>Array.&lt;H3Index&gt;</code>
Find the indexes for all vertexes of a cell.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - All vertex indexes of this cell  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | Cell to find all vertexes for |


* * *

<a name="module_h3.vertexToLatLng"></a>

### h3.vertexToLatLng(h3Index) ⇒ <code>CoordPair</code>
Get the lat, lng of a given vertex

**Returns**: <code>CoordPair</code> - Latitude, longitude coordinates of the vertex  
**Throws**:

- <code>H3Error</code> If the input is invalid


| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | A vertex index |


* * *

<a name="module_h3.isValidVertex"></a>

### h3.isValidVertex(h3Index) ⇒ <code>boolean</code>
Returns true if the input is a valid vertex index.

**Returns**: <code>boolean</code> - True if the index represents a vertex  

| Param | Type | Description |
| --- | --- | --- |
| h3Index | <code>H3IndexInput</code> | An index to test for being a vertex index |


* * *

<a name="module_h3.getNumCells"></a>

### h3.getNumCells(res) ⇒ <code>number</code>
The total count of hexagons in the world at a given resolution. Note that above
resolution 8 the exact count cannot be represented in a JavaScript 32-bit number,
so consumers should use caution when applying further operations to the output.

**Returns**: <code>number</code> - Count  
**Throws**:

- <code>H3Error</code> If the resolution is invalid


| Param | Type | Description |
| --- | --- | --- |
| res | <code>number</code> | Hexagon resolution |


* * *

<a name="module_h3.getRes0Cells"></a>

### h3.getRes0Cells() ⇒ <code>Array.&lt;H3Index&gt;</code>
Get all H3 indexes at resolution 0. As every index at every resolution > 0 is
the descendant of a res 0 index, this can be used with h3ToChildren to iterate
over H3 indexes at any resolution.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - All H3 indexes at res 0  

* * *

<a name="module_h3.getPentagons"></a>

### h3.getPentagons(res) ⇒ <code>Array.&lt;H3Index&gt;</code>
Get the twelve pentagon indexes at a given resolution.

**Returns**: <code>Array.&lt;H3Index&gt;</code> - All H3 pentagon indexes at res  
**Throws**:

- <code>H3Error</code> If the resolution is invalid


| Param | Type | Description |
| --- | --- | --- |
| res | <code>number</code> | Hexagon resolution |


* * *

<a name="module_h3.degsToRads"></a>

### h3.degsToRads(deg) ⇒ <code>number</code>
Convert degrees to radians

**Returns**: <code>number</code> - Value in radians  

| Param | Type | Description |
| --- | --- | --- |
| deg | <code>number</code> | Value in degrees |


* * *

<a name="module_h3.radsToDegs"></a>

### h3.radsToDegs(rad) ⇒ <code>number</code>
Convert radians to degrees

**Returns**: <code>number</code> - Value in degrees  

| Param | Type | Description |
| --- | --- | --- |
| rad | <code>number</code> | Value in radians |


* * *

<a name="module_h3.H3Index"></a>

### h3.H3Index : <code>string</code>
64-bit hexidecimal string representation of an H3 index


* * *

<a name="module_h3.H3IndexInput"></a>

### h3.H3IndexInput : <code>string</code> \| <code>Array.&lt;number&gt;</code>
64-bit hexidecimal string representation of an H3 index,
or two 32-bit integers in little endian order in an array.


* * *

<a name="module_h3.CoordIJ"></a>

### h3.CoordIJ
Coordinates as an `{i, j}` pair

**Properties**

| Name | Type |
| --- | --- |
| i | <code>number</code> | 
| j | <code>number</code> | 


* * *

<a name="module_h3.H3Error"></a>

### h3.H3Error
Custom JS Error instance with an attached error code. Error codes come from the
core H3 library and can be found [in the H3 docs](https://h3geo.org/docs/library/errors#table-of-error-codes).

**Properties**

| Name | Type |
| --- | --- |
| message | <code>string</code> | 
| code | <code>number</code> | 


* * *

<a name="module_h3.CoordPair"></a>

### h3.CoordPair : <code>Array.&lt;number&gt;</code>
Pair of lat,lng coordinates (or lng,lat if GeoJSON output is specified)


* * *

<a name="module_h3.SplitLong"></a>

### h3.SplitLong : <code>Array.&lt;number&gt;</code>
Pair of lower,upper 32-bit ints representing a 64-bit value


* * *


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
