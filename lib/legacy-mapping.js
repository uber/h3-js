/*
 * Copyright 2022 Uber Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"),
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

module.exports = {
    UNITS: 'UNITS',
    h3IndexToSplitLong: 'h3IndexToSplitLong',
    splitLongToH3Index: 'splitLongToH3Index',
    h3IsValid: 'isValidCell',
    h3IsPentagon: 'isPentagon',
    h3IsResClassIII: 'isResClassIII',
    h3GetBaseCell: 'getBaseCellNumber',
    h3GetFaces: 'getIcosahedronFaces',
    h3GetResolution: 'getResolution',
    geoToH3: 'latLngToCell',
    h3ToGeo: 'cellToLatLng',
    h3ToGeoBoundary: 'cellToBoundary',
    h3ToParent: 'cellToParent',
    h3ToChildren: 'cellToChildren',
    h3ToCenterChild: 'cellToCenterChild',
    kRing: 'gridDisk',
    kRingDistances: 'gridDiskDistances',
    hexRing: 'gridRingUnsafe',
    polyfill: 'polygonToCells',
    h3SetToMultiPolygon: 'cellsToMultiPolygon',
    compact: 'compactCells',
    uncompact: 'uncompactCells',
    h3IndexesAreNeighbors: 'areNeighborCells',
    getH3UnidirectionalEdge: 'cellsToDirectedEdge',
    getOriginH3IndexFromUnidirectionalEdge: 'getDirectedEdgeOrigin',
    getDestinationH3IndexFromUnidirectionalEdge: 'getDirectedEdgeDestination',
    h3UnidirectionalEdgeIsValid: 'isValidDirectedEdge',
    getH3IndexesFromUnidirectionalEdge: 'directedEdgeToCells',
    getH3UnidirectionalEdgesFromHexagon: 'originToDirectedEdges',
    getH3UnidirectionalEdgeBoundary: 'directedEdgeToBoundary',
    h3Distance: 'gridDistance',
    h3Line: 'gridPathCells',
    experimentalH3ToLocalIj: 'cellToLocalIj',
    experimentalLocalIjToH3: 'localIjToCell',
    pointDist: 'greatCircleDistance',
    cellArea: 'cellArea',
    exactEdgeLength: 'edgeLength',
    hexArea: 'getHexagonAreaAvg',
    edgeLength: 'getHexagonEdgeLengthAvg',
    numHexagons: 'getNumCells',
    getRes0Indexes: 'getRes0Cells',
    getPentagonIndexes: 'getPentagons',
    degsToRads: 'degsToRads',
    radsToDegs: 'radsToDegs'
};
