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

import Benchmark from 'benchmark';
import * as h3core from '../lib/h3core';

// fixtures

const h3Index = '89283080ddbffff';
const h3IndexInt = [0x0ddbffff, 0x8928308];
const polygon = [
    [37.85848750746621, -122.48880236632749],
    [37.860723745370926, -122.47361033446712],
    [37.853811518065555, -122.47172205932065],
    [37.85055848093865, -122.48545496947689]
];
const ring10 = h3core.gridDisk(h3Index, 10);
const ring10Compact = h3core.compactCells(ring10);
const ring10Polygon = h3core.cellsToMultiPolygon(ring10)[0];

export default function makeBenchmarks() {
    const suite = new Benchmark.Suite();

    suite.add('isValidCell', () => {
        h3core.isValidCell(h3Index);
    });

    suite.add('latLngToCell', () => {
        h3core.latLngToCell(37.2, -122.2, 9);
    });

    suite.add('cellToLatLng', () => {
        h3core.cellToLatLng(h3Index);
    });

    suite.add('cellToLatLng - integers', () => {
        h3core.cellToLatLng(h3IndexInt);
    });

    suite.add('cellToBoundary', () => {
        h3core.cellToBoundary(h3Index);
    });

    suite.add('cellToBoundary - integers', () => {
        h3core.cellToBoundary(h3IndexInt);
    });

    suite.add('getIcosahedronFaces', () => {
        h3core.getIcosahedronFaces(h3Index);
    });

    suite.add('cellToChildren', () => {
        h3core.cellToChildren(h3Index, 14);
    });

    suite.add('cellToParent', () => {
        h3core.cellToParent(h3Index, 0);
    });

    suite.add('cellToChildPos', () => {
        h3core.cellToChildPos(h3Index, 0);
    });

    suite.add('childPosToCell', () => {
        h3core.childPosToCell(16800, h3Index, 14);
    });

    suite.add('gridDisk', () => {
        h3core.gridDisk(h3Index, 1);
    });

    suite.add('polygonToCells_9', () => {
        h3core.polygonToCells(polygon, 9, false);
    });

    suite.add('polygonToCells_11', () => {
        h3core.polygonToCells(polygon, 11, false);
    });

    suite.add('polygonToCells_10ring', () => {
        h3core.polygonToCells(ring10Polygon, 10, false);
    });

    suite.add('cellsToMultiPolygon', () => {
        h3core.cellsToMultiPolygon(ring10, false);
    });

    suite.add('compactCells', () => {
        h3core.compactCells(ring10);
    });

    suite.add('uncompactCells', () => {
        h3core.uncompactCells(ring10Compact, 10);
    });

    suite.add('areNeighborCells', () => {
        h3core.areNeighborCells('891ea6d6533ffff', '891ea6d65afffff');
    });

    suite.add('cellsToDirectedEdge', () => {
        h3core.cellsToDirectedEdge('891ea6d6533ffff', '891ea6d65afffff');
    });

    suite.add('getDirectedEdgeOrigin', () => {
        h3core.getDirectedEdgeOrigin('1591ea6d6533ffff');
    });

    suite.add('getDirectedEdgeDestination', () => {
        h3core.getDirectedEdgeDestination('1591ea6d6533ffff');
    });

    suite.add('isValidDirectedEdge', () => {
        h3core.isValidDirectedEdge('1591ea6d6533ffff');
    });

    return suite;
}
