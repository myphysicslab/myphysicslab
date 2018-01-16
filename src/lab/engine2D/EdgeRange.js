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

goog.provide('myphysicslab.lab.engine2D.EdgeRange');

goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.EdgeSet');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var Util = goog.module.get('myphysicslab.lab.util.Util');

/** Specifies a set of Edges in a Polygon. The Edges must be contiguous in the list of
Edges in the Polygon. Edges are specified by their index in the list of Edges of the
Polygon, see {@link myphysicslab.lab.engine2D.Polygon}.

* @param {!myphysicslab.lab.engine2D.Polygon} body  the Polygon the Edges belong to
* @param {number} beginIdx  the index of the first Edge within the list of Edges
*    in the Polygon
* @param {number} endIdx  the index of the last Edge within the list of Edges
*    in the Polygon
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.engine2D.EdgeSet}
*/
myphysicslab.lab.engine2D.EdgeRange = function(body, beginIdx, endIdx) {
  if (endIdx < beginIdx) {
    throw new Error();
  }
  var n = body.getEdges().length;
  if (beginIdx < 0 || beginIdx >= n) {
    throw new Error();
  }
  if (endIdx < 0 || endIdx >= n) {
    throw new Error();
  }
  /** the Polygon the Edges belong to
  * @type {!myphysicslab.lab.engine2D.Polygon}
  * @private
  */
  this.body_ = body;
  /** beginning index of Edge of the set, inclusive
  * @type {number}
  * @private
  */
  this.beginIdx_ = beginIdx;
  /** ending index of Edge of the set, inclusive
  * @type {number}
  * @private
  */
  this.endIdx_ = endIdx;

};
var EdgeRange = myphysicslab.lab.engine2D.EdgeRange;

if (!Util.ADVANCED) {
  /** @override */
  EdgeRange.prototype.toString = function() {
    return 'EdgeRange{beginIdx_: '+this.beginIdx_
        +', endIdx_: '+this.endIdx_
        +', body_: '+this.body_.toStringShort()
        +'}';
  };
};

/** Creates an EdgeRange by finding all the set of all Edges connected to a given Edge.
Any Edge in the set can be specified to the constructor: the first, the last, or any
Edge in the middle of the set. This set of Edges corresponds to the concept of a "path
of edges" discussed in {@link myphysicslab.lab.engine2D.Polygon}, see the section about
'Structure of a Polygon'.

Assumption: Edges in set are contiguous in the Polygon's list of Edges.

@todo check that Edges in set are contiguous in the Polygon's list of Edges

* @param {!myphysicslab.lab.engine2D.Edge} edge  the Edge to start with
* @return {!EdgeRange} an EdgeRange representing all Edges connected to
*     the starting Edge
*/
EdgeRange.fromEdge = function(edge) {
  var beginIdx = edge.getIndex();
  while (true) {
    // Find Edge in the set with the smallest index.
    var prevEdge = edge.getVertex1().getEdge1();
    var prevIdx = prevEdge.getIndex();
    if (prevIdx < beginIdx) {
      beginIdx = prevIdx;
      edge = prevEdge;
    } else {
      break;
    }
  }
  var endIdx = edge.getVertex1().getEdge1().getIndex();
  return new EdgeRange(edge.getBody(), beginIdx, endIdx);
};

/** Creates an EdgeRange containing all Edges of the given Polygon.
* @param {!myphysicslab.lab.engine2D.Polygon} body  the Polygon of interest
* @return {!EdgeRange} an EdgeRange representing all Edges contained in the Polygon
*/
EdgeRange.fromPolygon = function(body) {
  return new EdgeRange(body, 0, body.getEdges().length-1);
};

/** @override */
EdgeRange.prototype.contains = function(edge) {
  if (edge.getBody() != this.body_) {
    return false;
  }
  var idx = edge.getIndex();
  return idx >= this.beginIdx_ && idx <= this.endIdx_;
};

}); // goog.scope
