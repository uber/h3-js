/*
 * Copyright 2018 Uber Technologies, Inc.
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
 * Sizes exported for use in Emscripten. This file is copied into the
 * h3 src/h3lib/lib directory
 */

#ifndef SIZES_H
#define SIZES_H

int sizeOfH3Index();
int sizeOfGeoCoord();
int sizeOfGeoBoundary();
int sizeOfGeofence();
int sizeOfGeoPolygon();
int sizeOfLinkedGeoPolygon();

#endif
