# Change Log

All notable changes to this project will be documented in this file. This library adheres to a versioning policy described in [the README](./README.md#versioning). The public API of this library consists of the functions exported in [h3core.js](./lib/h3core.js).

## [4.4.0] - 2025-08-21
### Changed
- Updated the core library to `v4.4.1` (#213)
### Added
- Add `isValidIndex`, `getIndexDigit`, and `constructCell` from the core C library (#213)

## [4.3.0] - 2025-08-21
### Changed
- Updated the core library to `v4.3.0` (#206)
### Added
- Add `gridRing` function, to get all hexagons in a hollow hexagonal ring centered at some origin. (#206)

## [4.2.1] - 2025-04-03
### Changed
- Updated the core library to `v4.2.1` (#202)
### Added
- Add `polygonToCellsExperimental` function, supporting different containment modes. (#198)

## [4.1.0] - 2023-01-19
### Added
- Add `cellToChildPos`, `childPosToCell`, and `cellToChildrenSize` functions. (#170)

### Changed
- Updated the core library to `v4.1.0` (#170)

### Fixed
- Patch libh3 bundles to check for `typeof document != "undefined"` before accessing `document`. This allows h3-js to be used in a Web Worker and React Native (#169)
- Fix H3Index type hints for `cellToBoundary`, `cellArea`, `edgeLength` (#171)

## [4.0.1] - 2022-09-19
### Changed
- Updated the core library to `v4.0.1` (#161)
### Fixed
- Fixed error when compacting with res 0 cells (#161)

## [4.0.0] - 2022-08-23
### Breaking Changes
- Updated the core library to `v4.0.0`. This update renames the majority of the H3 functions. You can see a [list of changed function names](https://h3geo.org/docs/library/migration-3.x/functions) in the core library documentation. For the most part, upgrading to v4 for Javascript consumers should be a straightforward search & replace between the old names and the new. (#151, #144, #141, #139)
- Added more cases in which JS errors may be thrown. In H3 v3, many functions would fail silently with invalid input, returning `null` or similar signal values. In H3 v4, we will throw descriptive errors for most instances of bad input. (#139)

### Changed
- Add Typescript typechecking, generate types with tsc (#153)

### Fixed
- Fail package publish if there are library changes (#148)

### Added
- Added legacy API wrapper with Typescript types (#146)

## [4.0.0-rc4] - 2022-08-22
### Breaking changes
- Updated the core library to `v4.0.0-rc5`. (#151)
### Changed
- Add Typescript typechecking, generate types with tsc (#153)

## [4.0.0-rc3] - 2022-08-11
### Fixed
- Fail package publish if there are library changes (#148)

## [4.0.0-rc2] - 2022-08-11
### Added
- Added legacy API wrapper with Typescript types (#146)

## [4.0.0-rc1] - 2022-07-28
### Breaking Changes
- Updated the core library to `v4.0.0-rc4`. (#141)
- Updated the core library to `v4.0.0-rc2`. This update renames the majority of the H3 functions. You can see a [list of changed function names](https://h3geo.org/docs/library/migration-3.x/functions) in the core library documentation. For the most part, upgrading to v4 for Javascript consumers should be a straightforward search & replace between the old names and the new. (#139)
- Added more cases in which JS errors may be thrown. In H3 v3, many functions would fail silently with invalid input, returning `null` or similar signal values. In H3 v4, we will throw descriptive errors for most instances of bad input. (#139)

### Added
- Added vertex mode functions (#138)

## [3.7.2] - 2021-04-29
### Fixed
- Accept integer input to `h3GetResolution` (#113)

## [3.7.1] - 2021-03-10
### Fixed
- Fixed bug in freeing geo polygon memory during `polyfill` (#104)

## [3.7.0] - 2020-10-15
### Added
- Added bindings for new area and distance functions (#93):
	- `cellArea`
	- `exactEdgeLength`
	- `pointDist`
- All functions accepting H3 index input now also accept a `[lowerBits, upperBits]` tuple of 32-bit integers (#91)
### Fixed
- Fixed type definition for `UNITS` (#94)
### Changed
- Updated the core library to 3.7.1 (#93)

## [3.6.4] - 2020-06-02
### Fixed
- Fixed `h3IsValid` returning true on certain edge cases (#81)
- Fix some `polyfill` edge cases (#86)
### Changed
- Updated the core library to 3.6.3 - minor fixes for `h3IsValid` and `compact` (#81)
- Updated the core library to 3.6.4 - reinstate new `polyfill` algorithm (#86)

## [3.6.3] - 2019-12-10
### Fixed
- Updated the core library to v3.6.2. This rolls back the polyfill algorithm to previous version; we'll roll forward again once we've fixed the known issues.


## [3.6.2] - 2019-11-11
### Fixed
- Improved TypeScript typedefs (#73)
- Fix `polyfill` edge cases, improve perfomance (#74)
### Changed
- Updated the core library to v3.6.1 (#74)

## [3.6.1] - 2019-09-19
### Fixed
- Downgraded required `yarn` version (#68)

## [3.6.0] - 2019-09-12
### Fixed
- Removed `unhandledRejection` handling from emscripten build (#64)
- Fixed TypeScript definition file, added a CI test to guard against regressions (#65)
### Changed
- Updated the core library to v3.6.0 (#61)
### Added
- Added bindings for `getPentagonIndexes` and `h3ToCenterChild` (#61)

## [3.5.0] - 2019-07-24
### Added
- Added `h3GetFaces` binding (#54)
- Generated a TypeScript definition file from jsdoc comments (#55)
### Changed
- Updated the core library to v3.5.0 (#52, #54)

## [3.4.3] - 2019-04-01
### Added
- Changed module exports to ES6 syntax (#41)
- Added UMD bundle to published package (#41)
- Added separate bundles with an Emscripten browser-only build (#43)

## [3.4.2] - 2019-02-08
### Fixed
- Changed `const` to `var` for better compatibility in Emscripten-generated code (#37)

## [3.4.1] - 2019-01-25
### Fixed
- Updated Emscripten, removing hack for `getTempRet0`

## [3.4.0] - 2019-01-24
### Changed
- Updated the core library to v3.4.0 (#31)
### Added
- Added `getRes0Indexes` binding (#31)

## [3.3.0] - 2019-01-08
### Changed
- Updated the core library to v3.3.0 (#29)
### Added
- Added `h3Line` binding (#29)

## [3.2.0] - 2018-10-31
### Changed
- Updated the core library to v3.2.0 (#26)
### Added
- Added `experimentalH3ToLocalIj` and `experimentalLocalIjToH3` bindings (#26)

## [3.1.1] - 2018-08-30
### Fixed
- Updated the core library to v3.1.1, including fixes for `polyfill` and `h3SetToMultiPolygon` (#19)
- Removed Emscripten Node error handling from built library, fixing stacktraces (#18)
### Added
- Added generated API documentation to README (#17)

## [3.1.0] - 2018-08-13
### Added
- Added binding for `h3Distance` (#15)
### Changed
- Updated the core library to v3.1.0 (#15)
- Moved emscripten build to docker (#14)

## [3.0.2] - 2018-07-26
### Changed
- Updated the core library to v3.0.8 (#10)
- Renamed names of h3.1 or h3-1 to h3 (#4)
- Added engine support for Node 10 (#11)

## [3.0.1] - 2018-06-18
### Fixed
- Fixed npm distribution

## [3.0.0] - 2018-06-18
### Added
-   First public release.
