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

goog.provide('myphysicslab.lab.engine2D.EdgeGroup');

goog.require('goog.array');
goog.require('myphysicslab.lab.engine2D.EdgeRange');
goog.require('myphysicslab.lab.engine2D.EdgeSet');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var EdgeRange = myphysicslab.lab.engine2D.EdgeRange;
var EdgeSet = myphysicslab.lab.engine2D.EdgeSet;
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Specifies a set of {@link myphysicslab.lab.engine2D.Edge}s in multiple Polygons.
Edges are specified by {@link EdgeRange}s.

* @param {!EdgeRange=} opt_edgeRange  the EdgeRange to
    start with (optional)
* @constructor
* @final
* @struct
* @implements {EdgeSet}
*/
myphysicslab.lab.engine2D.EdgeGroup = function(opt_edgeRange) {
  /**
  * @type {!Array<!EdgeRange>}
  * @private
  */
  this.ranges_ = [];
  if (goog.isDef(opt_edgeRange)) {
    this.ranges_.push(opt_edgeRange);
  }
};
var EdgeGroup = myphysicslab.lab.engine2D.EdgeGroup;

/** @override */
EdgeGroup.prototype.toString = function() {
  return Util.ADVANCED ? '' : 'EdgeGroup{ranges_.length: '+this.ranges_.length+'}';
};

/** Add the EdgeRange to this EdgeGroup.
* @param {!EdgeRange} edgeRange  the EdgeRange to add
*/
EdgeGroup.prototype.add = function(edgeRange) {
  if (!goog.array.contains(this.ranges_, edgeRange)) {
    this.ranges_.push(edgeRange);
  }
};

/** @override */
EdgeGroup.prototype.contains = function(edge) {
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
EdgeGroup.prototype.remove = function(edgeRange) {
  goog.array.remove(this.ranges_, edgeRange);
};

}); // goog.scope
