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

// Define the C bindings for the h3 library

// Add some aliases to make the function definitions more intelligible
const NUMBER = 'number';
const H3_ERROR = NUMBER;
const BOOLEAN = NUMBER;
const H3_LOWER = NUMBER;
const H3_UPPER = NUMBER;
const RESOLUTION = NUMBER;
const POINTER = NUMBER;

// Define the bindings to functions in the C lib. Functions are defined as
// [name, return type, [arg types]]. You must run `npm run build-emscripten`
// before new functions added here will be available.
/** @type {([string, string] | [string, string | null, string[]])[]} */
export default [
    // The size functions are inserted via build/sizes.h
    ['sizeOfH3Index', NUMBER],
    ['sizeOfLatLng', NUMBER],
    ['sizeOfCellBoundary', NUMBER],
    ['sizeOfGeoLoop', NUMBER],
    ['sizeOfGeoPolygon', NUMBER],
    ['sizeOfLinkedGeoPolygon', NUMBER],
    ['sizeOfCoordIJ', NUMBER],
    ['readInt64AsDoubleFromPointer', NUMBER],
    // The remaining functions are defined in the core lib in h3Api.h
    ['isValidCell', BOOLEAN, [H3_LOWER, H3_UPPER]],
    ['latLngToCell', H3_ERROR, [NUMBER, NUMBER, RESOLUTION, POINTER]],
    ['cellToLatLng', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['cellToBoundary', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['maxGridDiskSize', H3_ERROR, [NUMBER, POINTER]],
    ['gridDisk', H3_ERROR, [H3_LOWER, H3_UPPER, NUMBER, POINTER]],
    ['gridDiskDistances', H3_ERROR, [H3_LOWER, H3_UPPER, NUMBER, POINTER, POINTER]],
    ['gridRing', H3_ERROR, [H3_LOWER, H3_UPPER, NUMBER, POINTER]],
    ['gridRingUnsafe', H3_ERROR, [H3_LOWER, H3_UPPER, NUMBER, POINTER]],
    ['maxPolygonToCellsSize', H3_ERROR, [POINTER, RESOLUTION, NUMBER, POINTER]],
    ['polygonToCells', H3_ERROR, [POINTER, RESOLUTION, NUMBER, POINTER]],
    ['maxPolygonToCellsSizeExperimental', H3_ERROR, [POINTER, RESOLUTION, NUMBER, POINTER]],
    [
        'polygonToCellsExperimental',
        H3_ERROR,
        [POINTER, RESOLUTION, NUMBER, NUMBER, NUMBER, POINTER]
    ],
    ['cellsToLinkedMultiPolygon', H3_ERROR, [POINTER, NUMBER, POINTER]],
    ['destroyLinkedMultiPolygon', null, [POINTER]],
    ['compactCells', H3_ERROR, [POINTER, POINTER, NUMBER, NUMBER]],
    ['uncompactCells', H3_ERROR, [POINTER, NUMBER, NUMBER, POINTER, NUMBER, RESOLUTION]],
    ['uncompactCellsSize', H3_ERROR, [POINTER, NUMBER, NUMBER, RESOLUTION, POINTER]],
    ['isPentagon', BOOLEAN, [H3_LOWER, H3_UPPER]],
    ['isResClassIII', BOOLEAN, [H3_LOWER, H3_UPPER]],
    ['getBaseCellNumber', NUMBER, [H3_LOWER, H3_UPPER]],
    ['getResolution', NUMBER, [H3_LOWER, H3_UPPER]],
    ['maxFaceCount', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['getIcosahedronFaces', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['cellToParent', H3_ERROR, [H3_LOWER, H3_UPPER, RESOLUTION, POINTER]],
    ['cellToChildren', H3_ERROR, [H3_LOWER, H3_UPPER, RESOLUTION, POINTER]],
    ['cellToCenterChild', H3_ERROR, [H3_LOWER, H3_UPPER, RESOLUTION, POINTER]],
    ['cellToChildrenSize', H3_ERROR, [H3_LOWER, H3_UPPER, RESOLUTION, POINTER]],
    ['cellToChildPos', H3_ERROR, [H3_LOWER, H3_UPPER, RESOLUTION, POINTER]],
    ['childPosToCell', H3_ERROR, [NUMBER, NUMBER, H3_LOWER, H3_UPPER, RESOLUTION, POINTER]],
    ['areNeighborCells', H3_ERROR, [H3_LOWER, H3_UPPER, H3_LOWER, H3_UPPER, POINTER]],
    ['cellsToDirectedEdge', H3_ERROR, [H3_LOWER, H3_UPPER, H3_LOWER, H3_UPPER, POINTER]],
    ['getDirectedEdgeOrigin', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['getDirectedEdgeDestination', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['isValidDirectedEdge', BOOLEAN, [H3_LOWER, H3_UPPER]],
    ['directedEdgeToCells', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['originToDirectedEdges', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['directedEdgeToBoundary', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['gridDistance', H3_ERROR, [H3_LOWER, H3_UPPER, H3_LOWER, H3_UPPER, POINTER]],
    ['gridPathCells', H3_ERROR, [H3_LOWER, H3_UPPER, H3_LOWER, H3_UPPER, POINTER]],
    ['gridPathCellsSize', H3_ERROR, [H3_LOWER, H3_UPPER, H3_LOWER, H3_UPPER, POINTER]],
    ['cellToLocalIj', H3_ERROR, [H3_LOWER, H3_UPPER, H3_LOWER, H3_UPPER, NUMBER, POINTER]],
    ['localIjToCell', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER, NUMBER, POINTER]],
    ['getHexagonAreaAvgM2', H3_ERROR, [RESOLUTION, POINTER]],
    ['getHexagonAreaAvgKm2', H3_ERROR, [RESOLUTION, POINTER]],
    ['getHexagonEdgeLengthAvgM', H3_ERROR, [RESOLUTION, POINTER]],
    ['getHexagonEdgeLengthAvgKm', H3_ERROR, [RESOLUTION, POINTER]],
    ['greatCircleDistanceM', NUMBER, [POINTER, POINTER]],
    ['greatCircleDistanceKm', NUMBER, [POINTER, POINTER]],
    ['greatCircleDistanceRads', NUMBER, [POINTER, POINTER]],
    ['cellAreaM2', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['cellAreaKm2', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['cellAreaRads2', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['edgeLengthM', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['edgeLengthKm', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['edgeLengthRads', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['getNumCells', H3_ERROR, [RESOLUTION, POINTER]],
    ['getRes0Cells', H3_ERROR, [POINTER]],
    ['res0CellCount', NUMBER],
    ['getPentagons', H3_ERROR, [NUMBER, POINTER]],
    ['pentagonCount', NUMBER],
    ['cellToVertex', H3_ERROR, [H3_LOWER, H3_UPPER, NUMBER, POINTER]],
    ['cellToVertexes', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['vertexToLatLng', H3_ERROR, [H3_LOWER, H3_UPPER, POINTER]],
    ['isValidVertex', BOOLEAN, [H3_LOWER, H3_UPPER]]
];
