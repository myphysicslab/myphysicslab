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

goog.module('myphysicslab.sims.pde.StringPath');
goog.forwardDeclare('myphysicslab.sims.pde.StringSim');

const AbstractSimObject = goog.require('myphysicslab.lab.model.AbstractSimObject');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Path = goog.require('myphysicslab.lab.model.Path');
const PathIterator = goog.require('myphysicslab.lab.model.PathIterator');
const Util = goog.require('myphysicslab.lab.util.Util');

/** This is an Adapter that forwards to {@link StringSim}.
* @implements {Path}
*/
class StringPath extends AbstractSimObject {
/**
* @param {!myphysicslab.sims.pde.StringSim} sim
*/
constructor(sim) {
  super('string');
  /**
  * @type {!myphysicslab.sims.pde.StringSim}
  * @private
  */
  this.sim_ = sim;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : StringPath.superClass_.toString.call(this).slice(0, -1)
      +', sim: '+this.sim_.toStringShort()
      +'}';
};

/** @override */
getClassName() {
  return 'StringPath';
};

/** @override */
getBoundsWorld() {
  // height is just a guess! Should get this info from StringShape?
  var len = this.sim_.getLength();
  var height = 1;
  return new DoubleRect(0, -height, len, height);
};

/** @override */
getIterator(numPoints) {
  return new StringIterator(this.sim_);
};

/** @override */
getSequence() {
  return this.sim_.getSequence();
};

} // end class


/** This is an Adapter that forwards to {@link StringSim}.
* @implements {PathIterator}
*/
class StringIterator {
/**
* @param {!myphysicslab.sims.pde.StringSim} sim
*/
constructor(sim) {
  /**
  * @type {!myphysicslab.sims.pde.StringSim}
  * @private
  */
  this.sim_ = sim;
  /**
  * @type {number}
  * @private
  */
  this.idx_ = -1;
};

/** @override */
nextPoint(point) {
  var n = this.sim_.getNumPoints();
  if (this.idx_ >=  n-1) {
    return false;
  }
  this.idx_++;
  this.sim_.getPoint(this.idx_, point);
  return true;
};

} // end class

exports = StringPath;
