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

const h3v4 = require('./dist/h3-js');
const mapping = require('./lib/legacy-mapping');

module.exports = Object.keys(mapping).reduce((map, key) => {
    map[key] = h3v4[mapping[key]];
    return map;
}, {});

// {
//     UNITS: h3v4.UNITS,
//     h3IndexToSplitLong: h3v4.h3IndexToSplitLong,
//     splitLongToH3Index: h3v4.splitLongToH3Index,
//     h3IsValid: h3v4.isValidCell,
//     h3IsPentagon: h3v4.isPentagon,
//     h3IsResClassIII: h3v4.isResClassIII,
//     h3GetBaseCell: h3v4.getBaseCellNumber,
//     h3GetFaces: h3v4.getIcosahedronFaces,
//     h3GetResolution: h3v4.getResolution,
//     geoToH3: h3v4.latLngToCell,
//     h3ToGeo: h3v4.cellToLatLng,
//     h3ToGeoBoundary: h3v4.cellToBoundary,
//     h3ToParent: h3v4.cellToParent,
//     h3ToChildren: h3v4.cellToChildren,
//     h3ToCenterChild: h3v4.cellToCenterChild,
//     kRing: h3v4.gridDisk,
//     kRingDistances: h3v4.gridDiskDistances,
//     hexRing: h3v4.gridRingUnsafe,
//     polyfill: h3v4.polygonToCells,
//     h3SetToMultiPolygon: h3v4.cellsToMultiPolygon,
//     compact: h3v4.compactCells,
//     uncompact: h3v4.uncompactCells,
//     h3IndexesAreNeighbors: h3v4.areNeighborCells,
//     getH3UnidirectionalEdge: h3v4.cellsToDirectedEdge,
//     getOriginH3IndexFromUnidirectionalEdge: h3v4.getDirectedEdgeOrigin,
//     getDestinationH3IndexFromUnidirectionalEdge: h3v4.getDirectedEdgeDestination,
//     h3UnidirectionalEdgeIsValid: h3v4.isValidDirectedEdge,
//     getH3IndexesFromUnidirectionalEdge: h3v4.directedEdgeToCells,
//     getH3UnidirectionalEdgesFromHexagon: h3v4.originToDirectedEdges,
//     getH3UnidirectionalEdgeBoundary: h3v4.directedEdgeToBoundary,
//     h3Distance: h3v4.gridDistance,
//     h3Line: h3v4.gridPathCells,
//     experimentalH3ToLocalIj: h3v4.cellToLocalIj,
//     experimentalLocalIjToH3: h3v4.localIjToCell,
//     pointDist: h3v4.greatCircleDistance,
//     cellArea: h3v4.cellArea,
//     exactEdgeLength: h3v4.exactEdgeLength,
//     hexArea: h3v4.getHexagonAreaAvg,
//     edgeLength: h3v4.getHexagonEdgeLengthAvg,
//     numHexagons: h3v4.getNumCells,
//     getRes0Indexes: h3v4.getRes0Cells,
//     getPentagonIndexes: h3v4.getPentagons,
//     degsToRads: h3v4.degsToRads,
//     radsToDegs: h3v4.radsToDegs
// };
