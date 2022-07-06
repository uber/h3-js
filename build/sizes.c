/*
 * Copyright 2018, 2022 Uber Technologies, Inc.
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
 * Sizes and C helpers exported for use in Emscripten. This file is copied into
 * the h3 src/h3lib/lib directory
 */

#include <stdint.h>
#include "h3api.h"

int sizeOfH3Index() {
    return sizeof(H3Index);
}

int sizeOfLatLng() {
    return sizeof(LatLng);
}

int sizeOfCellBoundary() {
    return sizeof(CellBoundary);
}

int sizeOfGeoLoop() {
    return sizeof(GeoLoop);
}

int sizeOfGeoPolygon() {
    return sizeof(GeoPolygon);
}

int sizeOfLinkedGeoPolygon() {
    return sizeof(LinkedGeoPolygon);
}

int sizeOfCoordIJ() {
    return sizeof(CoordIJ);
}

// Helper: Get the value of a int64_t pointer as a double. JS can't handle the
// 64-bit int, but it can get the value in a double (precise if less than
// MAX_SAFE_INTEGER, approximate if over)
double int64PointerAsDouble(int64_t *input) {
    return (double)(*input);
}