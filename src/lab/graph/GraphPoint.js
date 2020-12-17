// Copyright 2016 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.module('myphysicslab.lab.graph.GraphPoint');

const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A point in a 2D graph, with indication of when discontinuity occurs in a sequence
* of points.  See {@link myphysicslab.lab.graph.GraphLine}.
* @implements {GenericVector}
*/
class GraphPoint {
/**
* @param {number} x X value of the GraphPoint
* @param {number} y Y value of the GraphPoint
* @param {number} seqX sequence number for the X value; when sequence number changes
*   between successive GraphPoints it indicates there was a discontinuity in the graph
* @param {number} seqY sequence number for the Y value; when sequence number changes
*   between successive GraphPoints it indicates there was a discontinuity in the graph
*/
constructor(x, y, seqX, seqY) {
  if (isNaN(x) || isNaN(y)) {
    throw 'NaN in GraphPoint';
  }
  /** @type {number} */
  this.x = x;
  /** @type {number} */
  this.y = y;
  /** @type {number} */
  this.seqX = seqX;
  /** @type {number} */
  this.seqY = seqY;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'GraphPoint{x: '+Util.NF(this.x)
      +', y: '+Util.NF(this.y)
      +', seqX: '+Util.NF(this.seqX)
      +', seqY: '+Util.NF(this.seqY)
      +'}';
};

/** Returns whether this GraphPoint is identical to another GraphPoint
* @param {!GraphPoint} other the GraphPoint to compare with
* @return {boolean} `true` if this GraphPoint is identical to the other GraphPoint
*/
equals(other) {
  return this.x == other.x && this.y == other.y && this.seqX == other.seqX
      && this.seqY == other.seqY;
};

/** @override */
getX() {
  return this.x;
};

/** @override */
getY() {
  return this.y;
};

/** @override */
getZ() {
  return 0;
};

} // end class
exports = GraphPoint;
