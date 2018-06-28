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

goog.module('myphysicslab.lab.model.SimpleAdvance');

const DiffEqSolver = goog.require('myphysicslab.lab.model.DiffEqSolver');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const ODEAdvance = goog.require('myphysicslab.lab.model.ODEAdvance');
const ODESim = goog.require('myphysicslab.lab.model.ODESim');
const RungeKutta = goog.require('myphysicslab.lab.model.RungeKutta');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Advances an {@link ODESim} in a single step without doing any collision handling.

The {@link #advance} method calls {@link DiffEqSolver#step} to advance the Simulation
state, and then {@link myphysicslab.lab.model.Simulation#modifyObjects} to update the
state of the {@link myphysicslab.lab.model.SimObject}s.

* @implements {ODEAdvance}
*/
class SimpleAdvance {
/**
* @param {!ODESim} sim the Simulation to advance thru time
* @param {!DiffEqSolver=} opt_diffEqSolver the DiffEqSolver to
*     use for advancing the simulation; default is RungeKutta.
*/
constructor(sim, opt_diffEqSolver) {
  /**
  * @type {!ODESim}
  * @private
  */
  this.sim_ = sim;
  /**
  * @type {!DiffEqSolver}
  * @private
  */
  this.odeSolver_ = opt_diffEqSolver || new RungeKutta(sim);
  /** Default amount of time to advance the simulation, in seconds.
  * @type {number}
  * @private
  */
  this.timeStep_ = 0.025;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', odeSolver_: '+this.odeSolver_.toStringShort()
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'SimpleAdvance{sim_: '+this.sim_.toStringShort()+'}';
};

/** @override */
advance(timeStep, opt_memoList) {
  this.sim_.getSimList().removeTemporary(this.sim_.getTime());
  var err = this.odeSolver_.step(timeStep);
  if (err != null) {
    throw new Error('error during advance '+err);
  }
  this.sim_.modifyObjects();
  if (opt_memoList !== undefined) {
    opt_memoList.memorize();
  }
};

/** @override */
getDiffEqSolver() {
  return this.odeSolver_;
};

/** @override */
getTime() {
  return this.sim_.getTime();
};

/** @override */
getTimeStep() {
  return this.timeStep_;
};

/** @override */
reset() {
  this.sim_.reset();
};

/** @override */
save() {
  this.sim_.saveInitialState();
};

/** @override */
setDiffEqSolver(diffEqSolver) {
  this.odeSolver_ = diffEqSolver;
};

/** @override */
setTimeStep(timeStep) {
  this.timeStep_ = timeStep;
};

} // end class
exports = SimpleAdvance;
