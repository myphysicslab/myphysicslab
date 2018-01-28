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

goog.module('myphysicslab.sims.pde.StringAdvance');
goog.forwardDeclare('myphysicslab.sims.pde.StringSim');

const AdvanceStrategy = goog.require('myphysicslab.lab.model.AdvanceStrategy');
const Util = goog.require('myphysicslab.lab.util.Util');

/** This is an Adapter that forwards to {@link StringSim}.
* @implements {AdvanceStrategy}
*/
class StringAdvance {
/**
* @param {!myphysicslab.sims.pde.StringSim} sim
*/
constructor(sim) {
  /**
  * @type {!myphysicslab.sims.pde.StringSim}
  * @private
  */
  this.sim_ = sim;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort();
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'StringAdvance{sim_: '+this.sim_.toStringShort()+'}';
};

/** @override */
advance(opt_timeStep, opt_memoList) {
  var timeStep = goog.isDef(opt_timeStep) ? opt_timeStep : this.getTimeStep();
  var startTime = this.getTime();
  while (this.getTime() < startTime + timeStep) {
    this.sim_.advance();
  }
  this.sim_.getSimList().removeTemporary(this.sim_.getTime());
  this.sim_.modifyObjects();
  if (opt_memoList !== undefined) {
    opt_memoList.memorize();
  }
};

/** @override */
getTime() {
  return this.sim_.getTime();
};

/** @override */
getTimeStep() {
  return this.sim_.getTimeStep();
};

/** @override */
setTimeStep(value) {
  if (this.sim_.getTimeStep() != value) {
    this.sim_.setTimeStep(value);
  }
};

/** @override */
reset() {
  this.sim_.reset();
};

} // end class

exports = StringAdvance;
