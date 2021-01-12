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

goog.module('myphysicslab.lab.engine2D.EdgeGroup');

const array = goog.require('goog.array');

const EdgeRange = goog.require('myphysicslab.lab.engine2D.EdgeRange');
const EdgeSet = goog.require('myphysicslab.lab.engine2D.EdgeSet');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Specifies a set of {@link myphysicslab.lab.engine2D.Edge}s in multiple Polygons.
Edges are specified by {@link EdgeRange}s.

* @implements {EdgeSet}
*/
class EdgeGroup {
/**
* @param {!EdgeRange=} opt_edgeRange  the EdgeRange to start with (optional)
*/
constructor(opt_edgeRange) {
  /**
  * @type {!Array<!EdgeRange>}
  * @private
  */
  this.ranges_ = [];
  if (opt_edgeRange !== undefined) {
    this.ranges_.push(opt_edgeRange);
  }
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'EdgeGroup{ranges_.length: '+this.ranges_.length+'}';
};

/** Add the EdgeRange to this EdgeGroup.
* @param {!EdgeRange} edgeRange  the EdgeRange to add
*/
add(edgeRange) {
  if (!this.ranges_.includes(edgeRange)) {
    this.ranges_.push(edgeRange);
  }
};

/** @override */
contains(edge) {
  for (var i=0, len=this.ranges_.length; i<len; i++) {
    if (this.ranges_[i].contains(edge)) {
      return true;
    }
  }
  return false;
};

/** Remove the EdgeRange from this EdgeGroup.
* @param {!EdgeRange} edgeRange  the EdgeRange to remove
*/
remove(edgeRange) {
  array.remove(this.ranges_, edgeRange);
};

} // end class
exports = EdgeGroup;
