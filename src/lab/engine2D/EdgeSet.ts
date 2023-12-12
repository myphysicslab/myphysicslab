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

import { RigidBody, Edge } from './RigidBody.js';
import { Util } from '../util/Util.js';

// *****************************  EdgeSet  ************************************

/** Specifies a set of {@link Edge}s of a {@link RigidBody}.
*/
export interface EdgeSet {

/** Whether this EdgeSet contains the specified Edge.
@param edge the Edge to look for
@return true if this EdgeSet contains the specified Edge
*/
contains(edge: Edge): boolean;

};

// *****************************  EdgeRange  ************************************

/** Specifies a set of Edges in a {@link RigidBody}. The Edges
must be contiguous in the list of Edges in the RigidBody. Edges are specified by their
index in the list of Edges of the RigidBody.
*/
export class EdgeRange implements EdgeSet {
  /** the RigidBody the Edges belong to */
  private body_: RigidBody;
  /** beginning index of Edge of the set, inclusive */
  private beginIdx_: number;
  /** ending index of Edge of the set, inclusive */
  private endIdx_: number;

/**
* @param body  the RigidBody the Edges belong to
* @param beginIdx  the index of the first Edge within the list of Edges
*    in the RigidBody
* @param endIdx  the index of the last Edge within the list of Edges
*    in the RigidBody
*/
constructor(body: RigidBody, beginIdx: number, endIdx: number) {
  if (endIdx < beginIdx) {
    throw '';
  }
  const n = body.getEdges().length;
  if (beginIdx < 0 || beginIdx >= n) {
    throw '';
  }
  if (endIdx < 0 || endIdx >= n) {
    throw '';
  }
  this.body_ = body;
  this.beginIdx_ = beginIdx;
  this.endIdx_ = endIdx;
};

/** @inheritDoc */
toString() {
  return 'EdgeRange{beginIdx_: '+this.beginIdx_
      +', endIdx_: '+this.endIdx_
      +', body_: '+this.body_.toStringShort()
      +'}';
};

/** Creates an EdgeRange by finding all the set of all Edges connected to a given Edge.
Any Edge in the set can be specified to the constructor: the first, the last, or any
Edge in the middle of the set.

This set of Edges corresponds to the concept of a "path
of edges" discussed in {@link lab/engine2D/Polygon.Polygon}, see the section about
'Structure of a Polygon'.

Assumption: Edges in set are contiguous in the RigidBody's list of Edges.

**TO DO** check that Edges in set are contiguous in the RigidBody's list of Edges

@param edge  the Edge to start with
@return an EdgeRange representing all Edges connected to the starting Edge
*/
static fromEdge(edge: Edge): EdgeRange {
  let beginIdx = edge.getIndex();
  while (true) {
    // Find Edge in the set with the smallest index.
    const prevEdge = edge.getVertex1().getEdge1();
    const prevIdx = prevEdge.getIndex();
    if (prevIdx < beginIdx) {
      beginIdx = prevIdx;
      edge = prevEdge;
    } else {
      break;
    }
  }
  const endIdx = edge.getVertex1().getEdge1().getIndex();
  return new EdgeRange(edge.getBody(), beginIdx, endIdx);
};

/** Creates an EdgeRange containing all Edges of the given RigidBody.
* @param body  the RigidBody of interest
* @return an EdgeRange representing all Edges contained in the RigidBody
*/
static fromRigidBody(body: RigidBody): EdgeRange {
  return new EdgeRange(body, 0, body.getEdges().length-1);
};

/** @inheritDoc */
contains(edge: Edge): boolean {
  if (edge.getBody() != this.body_) {
    return false;
  }
  const idx = edge.getIndex();
  return idx >= this.beginIdx_ && idx <= this.endIdx_;
};

} // end EdgeRange class
Util.defineGlobal('lab$engine2D$EdgeRange', EdgeRange);

// *****************************  EdgeGroup  ************************************

/** Specifies a set of {@link Edge}s in multiple RigidBodys.
Edges are specified by {@link EdgeRange}s.
*/
export class EdgeGroup implements EdgeSet {
  private ranges_: EdgeRange[] = [];

/**
* @param opt_edgeRange  the EdgeRange to start with (optional)
*/
constructor(opt_edgeRange?: EdgeRange) {
  if (opt_edgeRange !== undefined) {
    this.ranges_.push(opt_edgeRange);
  }
};

/** @inheritDoc */
toString() {
  return 'EdgeGroup{ranges_.length: '+this.ranges_.length+'}';
};

/** Add the EdgeRange to this EdgeGroup.
* @param edgeRange  the EdgeRange to add
*/
add(edgeRange: EdgeRange): void {
  if (!this.ranges_.includes(edgeRange)) {
    this.ranges_.push(edgeRange);
  }
};

/** @inheritDoc */
contains(edge: Edge): boolean {
  for (let i=0, len=this.ranges_.length; i<len; i++) {
    if (this.ranges_[i].contains(edge)) {
      return true;
    }
  }
  return false;
};

/** Remove the EdgeRange from this EdgeGroup.
* @param edgeRange  the EdgeRange to remove
*/
remove(edgeRange: EdgeRange): void {
  Util.remove(this.ranges_, edgeRange);
};

} // end class
Util.defineGlobal('lab$engine2D$EdgeGroup', EdgeGroup);
