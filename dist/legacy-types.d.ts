declare module "h3-js" {
    /**
     * Convert an H3 index (64-bit hexidecimal string) into a "split long" - a pair of 32-bit ints
     * @param  {H3IndexInput} h3Index  H3 index to check
     * @return {SplitLong}             A two-element array with 32 lower bits and 32 upper bits
     */
    export function h3IndexToSplitLong(h3Index: H3IndexInput): SplitLong;
    /**
     * Get a H3 index string from a split long (pair of 32-bit ints)
     * @param  {number} lower Lower 32 bits
     * @param  {number} upper Upper 32 bits
     * @return {H3Index}       H3 index
     */
    export function splitLongToH3Index(lower: number, upper: number): H3Index;
    /**
     * Whether a given string represents a valid H3 index
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to check
     * @return {boolean}          Whether the index is valid
     */
    export function h3IsValid(h3Index: H3IndexInput): boolean;
    /**
     * Whether the given H3 index is a pentagon
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to check
     * @return {boolean}          h3IsPentagon
     */
    export function h3IsPentagon(h3Index: H3IndexInput): boolean;
    /**
     * Whether the given H3 index is in a Class III resolution (rotated versus
     * the icosahedron and subject to shape distortion adding extra points on
     * icosahedron edges, making them not true hexagons).
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to check
     * @return {boolean}          h3IsResClassIII
     */
    export function h3IsResClassIII(h3Index: H3IndexInput): boolean;
    /**
     * Get the number of the base cell for a given H3 index
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to get the base cell for
     * @return {number}           Index of the base cell (0-121)
     */
    export function h3GetBaseCell(h3Index: H3IndexInput): number;
    /**
     * Get the indices of all icosahedron faces intersected by a given H3 index
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to get faces for
     * @return {number[]}              Indices (0-19) of all intersected faces
     * @throws {H3Error}               If input is invalid
     */
    export function h3GetFaces(h3Index: H3IndexInput): number[];
    /**
     * Returns the resolution of an H3 index
     * @static
     * @param  {H3IndexInput} h3Index H3 index to get resolution
     * @return {number}          The number (0-15) resolution, or -1 if invalid
     */
    export function h3GetResolution(h3Index: H3IndexInput): number;
    /**
     * Get the hexagon containing a lat,lon point
     * @static
     * @param  {number} lat Latitude of point
     * @param  {number} lng Longtitude of point
     * @param  {number} res Resolution of hexagons to return
     * @return {H3Index}    H3 index
     * @throws {H3Error}    If input is invalid
     */
    export function geoToH3(lat: number, lng: number, res: number): H3Index;
    /**
     * Get the lat,lon center of a given hexagon
     * @static
     * @param  {H3IndexInput} h3Index  H3 index
     * @return {CoordPair}             Point as a [lat, lng] pair
     * @throws {H3Error}               If input is invalid
     */
    export function h3ToGeo(h3Index: H3IndexInput): CoordPair;
    /**
     * Get the vertices of a given hexagon (or pentagon), as an array of [lat, lng]
     * points. For pentagons and hexagons on the edge of an icosahedron face, this
     * function may return up to 10 vertices.
     * @static
     * @param  {H3IndexInput} h3Index          H3 index
     * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output: [lng, lat], closed loops
     * @return {CoordPair[]}              Array of [lat, lng] pairs
     * @throws {H3Error}                  If input is invalid
     */
    export function h3ToGeoBoundary(h3Index: H3IndexInput, formatAsGeoJson?: boolean): CoordPair[];
    /**
     * Get the parent of the given hexagon at a particular resolution
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to get parent for
     * @param  {number} res       Resolution of hexagon to return
     * @return {H3Index}          H3 index of parent, or null for invalid input
     * @throws {H3Error}          If input is invalid
     */
    export function h3ToParent(h3Index: H3IndexInput, res: number): H3Index;
    /**
     * Get the children/descendents of the given hexagon at a particular resolution
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to get children for
     * @param  {number} res       Resolution of hexagons to return
     * @return {H3Index[]}        H3 indexes of children, or empty array for invalid input
     * @throws {H3Error}          If resolution is invalid or output is too large for JS
     */
    export function h3ToChildren(h3Index: H3IndexInput, res: number): H3Index[];
    /**
     * Get the number of children for a cell at a given resolution
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to get child count for
     * @param  {number} res            Child resolution
     * @return {number}                Number of children at res for the given cell
     * @throws {H3Error}               If cell or parentRes are invalid
     */
    export function cellToChildrenSize(h3Index: H3IndexInput, res: number): number;
    /**
     * Get the center child of the given hexagon at a particular resolution
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to get center child for
     * @param  {number} res       Resolution of cell to return
     * @return {H3Index}          H3 index of child, or null for invalid input
     * @throws {H3Error}          If resolution is invalid
     */
    export function h3ToCenterChild(h3Index: H3IndexInput, res: number): H3Index;
    /**
     * Get the position of the cell within an ordered list of all children of the
     * cell's parent at the specified resolution.
     * @static
     * @param  {H3IndexInput} h3Index  H3 index to get child pos for
     * @param  {number} parentRes      Resolution of reference parent
     * @return {number}                Position of child within parent at parentRes
     * @throws {H3Error}               If cell or parentRes are invalid
     */
    export function cellToChildPos(h3Index: H3IndexInput, parentRes: number): number;
    /**
     * Get the child cell at a given position within an ordered list of all children
     * at the specified resolution
     * @static
     * @param  {number} childPos       Position of the child cell to get
     * @param  {H3IndexInput} h3Index  H3 index of the parent cell
     * @param  {number} childRes       Resolution of child cell to return
     * @return {H3Index}          H3 index of child
     * @throws {H3Error}          If input is invalid
     */
    export function childPosToCell(childPos: number, h3Index: H3IndexInput, childRes: number): H3Index;
    /**
     * Get all hexagons in a k-ring around a given center. The order of the hexagons is undefined.
     * @static
     * @param  {H3IndexInput} h3Index  H3 index of center hexagon
     * @param  {number} ringSize  Radius of k-ring
     * @return {H3Index[]}        H3 indexes for all hexagons in ring
     * @throws {H3Error}          If input is invalid or output is too large for JS
     */
    export function kRing(h3Index: H3IndexInput, ringSize: number): H3Index[];
    /**
     * Get all hexagons in a k-ring around a given center, in an array of arrays
     * ordered by distance from the origin. The order of the hexagons within each ring is undefined.
     * @static
     * @param  {H3IndexInput} h3Index  H3 index of center hexagon
     * @param  {number} ringSize  Radius of k-ring
     * @return {H3Index[][]}      Array of arrays with H3 indexes for all hexagons each ring
     * @throws {H3Error}          If input is invalid or output is too large for JS
     */
    export function kRingDistances(h3Index: H3IndexInput, ringSize: number): H3Index[][];
    /**
     * Get all hexagons in a hollow hexagonal ring centered at origin with sides of a given length.
     * @static
     * @param  {H3IndexInput} h3Index  H3 index of center hexagon
     * @param  {number} ringSize  Radius of ring
     * @return {H3Index[]}        H3 indexes for all hexagons in ring
     * @throws {Error}            If the algorithm could not calculate the ring
     * @throws {H3Error}          If input is invalid
     */
    export function gridRing(h3Index: H3IndexInput, ringSize: number): H3Index[];
    /**
     * Get all hexagons in a hollow hexagonal ring centered at origin with sides of a given length.
     * Unlike kRing, this function will throw an error if there is a pentagon anywhere in the ring.
     * @static
     * @param  {H3IndexInput} h3Index  H3 index of center hexagon
     * @param  {number} ringSize  Radius of ring
     * @return {H3Index[]}        H3 indexes for all hexagons in ring
     * @throws {Error}            If the algorithm could not calculate the ring
     * @throws {H3Error}          If input is invalid
     */
    export function hexRing(h3Index: H3IndexInput, ringSize: number): H3Index[];
    /**
     * Get all hexagons with centers contained in a given polygon. The polygon
     * is specified with GeoJson semantics as an array of loops. Each loop is
     * an array of [lat, lng] pairs (or [lng, lat] if isGeoJson is specified).
     * The first loop is the perimeter of the polygon, and subsequent loops are
     * expected to be holes.
     * @static
     * @param  {number[][] | number[][][]} coordinates
     *                                  Array of loops, or a single loop
     * @param  {number} res             Resolution of hexagons to return
     * @param  {boolean} [isGeoJson]    Whether to expect GeoJson-style [lng, lat]
     *                                  pairs instead of [lat, lng]
     * @return {H3Index[]}              H3 indexes for all hexagons in polygon
     * @throws {H3Error}                If input is invalid or output is too large for JS
     */
    export function polyfill(coordinates: number[][] | number[][][], res: number, isGeoJson?: boolean): H3Index[];
    /**
     * Get all hexagons with centers contained in a given polygon. The polygon
     * is specified with GeoJson semantics as an array of loops. Each loop is
     * an array of [lat, lng] pairs (or [lng, lat] if isGeoJson is specified).
     * The first loop is the perimeter of the polygon, and subsequent loops are
     * expected to be holes.
     * @static
     * @param  {number[][] | number[][][]} coordinates
     *                                  Array of loops, or a single loop
     * @param  {number} res             Resolution of hexagons to return
     * @param  {string} flags           Value from POLYGON_TO_CELLS_FLAGS
     * @param  {boolean} [isGeoJson]    Whether to expect GeoJson-style [lng, lat]
     *                                  pairs instead of [lat, lng]
     * @return {H3Index[]}              H3 indexes for all hexagons in polygon
     * @throws {H3Error}                If input is invalid or output is too large for JS
     */
    export function polygonToCellsExperimental(coordinates: number[][] | number[][][], res: number, flags: string, isGeoJson?: boolean): H3Index[];
    /**
     * Get the outlines of a set of H3 hexagons, returned in GeoJSON MultiPolygon
     * format (an array of polygons, each with an array of loops, each an array of
     * coordinates). Coordinates are returned as [lat, lng] pairs unless GeoJSON
     * is requested.
     *
     * It is the responsibility of the caller to ensure that all hexagons in the
     * set have the same resolution and that the set contains no duplicates. Behavior
     * is undefined if duplicates or multiple resolutions are present, and the
     * algorithm may produce unexpected or invalid polygons.
     *
     * @static
     * @param {H3IndexInput[]} h3Indexes  H3 indexes to get outlines for
     * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output: [lng, lat], closed loops
     * @return {CoordPair[][][]}          MultiPolygon-style output.
     * @throws {H3Error}                  If input is invalid
     */
    export function h3SetToMultiPolygon(h3Indexes: H3IndexInput[], formatAsGeoJson?: boolean): CoordPair[][][];
    /**
     * Compact a set of hexagons of the same resolution into a set of hexagons across
     * multiple levels that represents the same area.
     * @static
     * @param  {H3IndexInput[]} h3Set H3 indexes to compact
     * @return {H3Index[]}       Compacted H3 indexes
     * @throws {H3Error}         If the input is invalid (e.g. duplicate hexagons)
     */
    export function compact(h3Set: H3IndexInput[]): H3Index[];
    /**
     * Uncompact a compacted set of hexagons to hexagons of the same resolution
     * @static
     * @param  {H3IndexInput[]} compactedSet H3 indexes to uncompact
     * @param  {number}    res          The resolution to uncompact to
     * @return {H3Index[]}              The uncompacted H3 indexes
     * @throws {H3Error}                If the input is invalid (e.g. invalid resolution)
     */
    export function uncompact(compactedSet: H3IndexInput[], res: number): H3Index[];
    /**
     * Whether two H3 indexes are neighbors (share an edge)
     * @static
     * @param  {H3IndexInput} origin      Origin hexagon index
     * @param  {H3IndexInput} destination Destination hexagon index
     * @return {boolean}             Whether the hexagons share an edge
     * @throws {H3Error}             If the input is invalid
     */
    export function h3IndexesAreNeighbors(origin: H3IndexInput, destination: H3IndexInput): boolean;
    /**
     * Get an H3 index representing a unidirectional edge for a given origin and destination
     * @static
     * @param  {H3IndexInput} origin      Origin hexagon index
     * @param  {H3IndexInput} destination Destination hexagon index
     * @return {H3Index}             H3 index of the edge, or null if no edge is shared
     * @throws {H3Error}             If the input is invalid
     */
    export function getH3UnidirectionalEdge(origin: H3IndexInput, destination: H3IndexInput): H3Index;
    /**
     * Get the origin hexagon from an H3 index representing a unidirectional edge
     * @static
     * @param  {H3IndexInput} edgeIndex H3 index of the edge
     * @return {H3Index}           H3 index of the edge origin
     * @throws {H3Error}           If the input is invalid
     */
    export function getOriginH3IndexFromUnidirectionalEdge(edgeIndex: H3IndexInput): H3Index;
    /**
     * Get the destination hexagon from an H3 index representing a unidirectional edge
     * @static
     * @param  {H3IndexInput} edgeIndex H3 index of the edge
     * @return {H3Index}           H3 index of the edge destination
     * @throws {H3Error}           If the input is invalid
     */
    export function getDestinationH3IndexFromUnidirectionalEdge(edgeIndex: H3IndexInput): H3Index;
    /**
     * Whether the input is a valid unidirectional edge
     * @static
     * @param  {H3IndexInput} edgeIndex H3 index of the edge
     * @return {boolean}           Whether the index is valid
     */
    export function h3UnidirectionalEdgeIsValid(edgeIndex: H3IndexInput): boolean;
    /**
     * Get the [origin, destination] pair represented by a unidirectional edge
     * @static
     * @param  {H3IndexInput} edgeIndex H3 index of the edge
     * @return {H3Index[]}         [origin, destination] pair as H3 indexes
     * @throws {H3Error}           If the input is invalid
     */
    export function getH3IndexesFromUnidirectionalEdge(edgeIndex: H3IndexInput): H3Index[];
    /**
     * Get all of the unidirectional edges with the given H3 index as the origin (i.e. an edge to
     * every neighbor)
     * @static
     * @param  {H3IndexInput} h3Index   H3 index of the origin hexagon
     * @return {H3Index[]}         List of unidirectional edges
     * @throws {H3Error}           If the input is invalid
     */
    export function getH3UnidirectionalEdgesFromHexagon(h3Index: H3IndexInput): H3Index[];
    /**
     * Get the vertices of a given edge as an array of [lat, lng] points. Note that for edges that
     * cross the edge of an icosahedron face, this may return 3 coordinates.
     * @static
     * @param  {H3IndexInput} edgeIndex        H3 index of the edge
     * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output: [lng, lat]
     * @return {CoordPair[]}              Array of geo coordinate pairs
     * @throws {H3Error}                  If the input is invalid
     */
    export function getH3UnidirectionalEdgeBoundary(edgeIndex: H3IndexInput, formatAsGeoJson?: boolean): CoordPair[];
    /**
     * Get the grid distance between two hex indexes. This function may fail
     * to find the distance between two indexes if they are very far apart or
     * on opposite sides of a pentagon.
     * @static
     * @param  {H3IndexInput} origin      Origin hexagon index
     * @param  {H3IndexInput} destination Destination hexagon index
     * @return {number}          Distance between hexagons
     * @throws {H3Error}         If input is invalid or the distance could not be calculated
     */
    export function h3Distance(origin: H3IndexInput, destination: H3IndexInput): number;
    /**
     * Given two H3 indexes, return the line of indexes between them (inclusive).
     *
     * This function may fail to find the line between two indexes, for
     * example if they are very far apart. It may also fail when finding
     * distances for indexes on opposite sides of a pentagon.
     *
     * Notes:
     *
     *  - The specific output of this function should not be considered stable
     *    across library versions. The only guarantees the library provides are
     *    that the line length will be `h3Distance(start, end) + 1` and that
     *    every index in the line will be a neighbor of the preceding index.
     *  - Lines are drawn in grid space, and may not correspond exactly to either
     *    Cartesian lines or great arcs.
     *
     * @static
     * @param  {H3IndexInput} origin      Origin hexagon index
     * @param  {H3IndexInput} destination Destination hexagon index
     * @return {H3Index[]}           H3 indexes connecting origin and destination
     * @throws {H3Error}             If input is invalid or the line cannot be calculated
     */
    export function h3Line(origin: H3IndexInput, destination: H3IndexInput): H3Index[];
    /**
     * Produces IJ coordinates for an H3 index anchored by an origin.
     *
     * - The coordinate space used by this function may have deleted
     * regions or warping due to pentagonal distortion.
     * - Coordinates are only comparable if they come from the same
     * origin index.
     * - Failure may occur if the index is too far away from the origin
     * or if the index is on the other side of a pentagon.
     * - This function is experimental, and its output is not guaranteed
     * to be compatible across different versions of H3.
     * @static
     * @param  {H3IndexInput} origin      Origin H3 index
     * @param  {H3IndexInput} destination H3 index for which to find relative coordinates
     * @return {CoordIJ}             Coordinates as an `{i, j}` pair
     * @throws {H3Error}             If the IJ coordinates cannot be calculated
     */
    export function experimentalH3ToLocalIj(origin: H3IndexInput, destination: H3IndexInput): CoordIJ;
    /**
     * Produces an H3 index for IJ coordinates anchored by an origin.
     *
     * - The coordinate space used by this function may have deleted
     * regions or warping due to pentagonal distortion.
     * - Coordinates are only comparable if they come from the same
     * origin index.
     * - Failure may occur if the index is too far away from the origin
     * or if the index is on the other side of a pentagon.
     * - This function is experimental, and its output is not guaranteed
     * to be compatible across different versions of H3.
     * @static
     * @param  {H3IndexInput} origin     Origin H3 index
     * @param  {CoordIJ} coords     Coordinates as an `{i, j}` pair
     * @return {H3Index}            H3 index at the relative coordinates
     * @throws {H3Error}            If the H3 index cannot be calculated
     */
    export function experimentalLocalIjToH3(origin: H3IndexInput, coords: CoordIJ): H3Index;
    /**
     * Great circle distance between two geo points. This is not specific to H3,
     * but is implemented in the library and provided here as a convenience.
     * @static
     * @param  {number[]} latLng1 Origin coordinate as [lat, lng]
     * @param  {number[]} latLng2 Destination coordinate as [lat, lng]
     * @param  {string}   unit    Distance unit (either UNITS.m, UNITS.km, or UNITS.rads)
     * @return {number}           Great circle distance
     * @throws {H3Error}          If the unit is invalid
     */
    export function pointDist(latLng1: number[], latLng2: number[], unit: string): number;
    /**
     * Exact area of a given cell
     * @static
     * @param  {H3IndexInput} h3Index  H3 index of the hexagon to measure
     * @param  {string}  unit     Distance unit (either UNITS.m2, UNITS.km2, or UNITS.rads2)
     * @return {number}           Cell area
     * @throws {H3Error}          If the input is invalid
     */
    export function cellArea(h3Index: H3IndexInput, unit: string): number;
    /**
     * Calculate length of a given unidirectional edge
     * @static
     * @param  {H3IndexInput} edge     H3 index of the edge to measure
     * @param  {string}  unit     Distance unit (either UNITS.m, UNITS.km, or UNITS.rads)
     * @return {number}           Cell area
     * @throws {H3Error}          If the input is invalid
     */
    export function exactEdgeLength(edge: H3IndexInput, unit: string): number;
    /**
     * Average hexagon area at a given resolution
     * @static
     * @param  {number} res  Hexagon resolution
     * @param  {string} unit Area unit (either UNITS.m2, UNITS.km2, or UNITS.rads2)
     * @return {number}      Average area
     * @throws {H3Error}     If the input is invalid
     */
    export function hexArea(res: number, unit: string): number;
    /**
     * Average hexagon edge length at a given resolution
     * @static
     * @param  {number} res  Hexagon resolution
     * @param  {string} unit Distance unit (either UNITS.m, UNITS.km, or UNITS.rads)
     * @return {number}      Average edge length
     * @throws {H3Error}     If the input is invalid
     */
    export function edgeLength(res: number, unit: string): number;
    /**
     * Find the index for a vertex of a cell.
     * @static
     * @param {H3IndexInput} h3Index     Cell to find the vertex for
     * @param {number} vertexNum         Number (index) of the vertex to calculate
     * @return {H3Index}     Vertex index
     * @throws {H3Error}     If the input is invalid
     */
    export function cellToVertex(h3Index: H3IndexInput, vertexNum: number): H3Index;
    /**
     * Find the indexes for all vertexes of a cell.
     * @static
     * @param {H3IndexInput} h3Index     Cell to find all vertexes for
     * @return {H3Index[]}   All vertex indexes of this cell
     * @throws {H3Error}     If the input is invalid
     */
    export function cellToVertexes(h3Index: H3IndexInput): H3Index[];
    /**
     * Get the lat, lng of a given vertex
     * @static
     * @param {H3IndexInput} h3Index A vertex index
     * @returns {CoordPair}          Latitude, longitude coordinates of the vertex
     * @throws {H3Error}             If the input is invalid
     */
    export function vertexToLatLng(h3Index: H3IndexInput): CoordPair;
    /**
     * Returns true if the input is a valid vertex index.
     * @static
     * @param {H3IndexInput} h3Index An index to test for being a vertex index
     * @returns {boolean} True if the index represents a vertex
     */
    export function isValidVertex(h3Index: H3IndexInput): boolean;
    /**
     * The total count of hexagons in the world at a given resolution. Note that above
     * resolution 8 the exact count cannot be represented in a JavaScript 32-bit number,
     * so consumers should use caution when applying further operations to the output.
     * @static
     * @param  {number} res  Hexagon resolution
     * @return {number}      Count
     * @throws {H3Error}     If the resolution is invalid
     */
    export function numHexagons(res: number): number;
    /**
     * Get all H3 indexes at resolution 0. As every index at every resolution > 0 is
     * the descendant of a res 0 index, this can be used with h3ToChildren to iterate
     * over H3 indexes at any resolution.
     * @static
     * @return {H3Index[]}  All H3 indexes at res 0
     */
    export function getRes0Indexes(): H3Index[];
    /**
     * Get the twelve pentagon indexes at a given resolution.
     * @static
     * @param  {number} res  Hexagon resolution
     * @return {H3Index[]}   All H3 pentagon indexes at res
     * @throws {H3Error}     If the resolution is invalid
     */
    export function getPentagonIndexes(res: number): H3Index[];
    /**
     * Convert degrees to radians
     * @static
     * @param  {number} deg Value in degrees
     * @return {number}     Value in radians
     */
    export function degsToRads(deg: number): number;
    /**
     * Convert radians to degrees
     * @static
     * @param  {number} rad Value in radians
     * @return {number}     Value in degrees
     */
    export function radsToDegs(rad: number): number;
    export namespace UNITS {
        const m: string;
        const m2: string;
        const km: string;
        const km2: string;
        const rads: string;
        const rads2: string;
    }
    export namespace POLYGON_TO_CELLS_FLAGS {
        const containmentCenter: string;
        const containmentFull: string;
        const containmentOverlapping: string;
        const containmentOverlappingBbox: string;
    }
    /**
     * 64-bit hexidecimal string representation of an H3 index
     */
    export type H3Index = string;
    /**
     * 64-bit hexidecimal string representation of an H3 index,
     * or two 32-bit integers in little endian order in an array.
     */
    export type H3IndexInput = string | number[];
    /**
     * Coordinates as an `{i, j}` pair
     */
    export type CoordIJ = {
        i: number;
        j: number;
    };
    /**
     * Custom JS Error instance with an attached error code. Error codes come from the
     * core H3 library and can be found [in the H3 docs](https://h3geo.org/docs/library/errors#table-of-error-codes).
     */
    export type H3Error = {
        message: string;
        code: number;
    };
    /**
     * Pair of lat,lng coordinates (or lng,lat if GeoJSON output is specified)
     */
    export type CoordPair = [number,number];
    /**
     * Pair of lower,upper 32-bit ints representing a 64-bit value
     */
    export type SplitLong = [number,number];
}
