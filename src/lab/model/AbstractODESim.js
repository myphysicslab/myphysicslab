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

goog.module('myphysicslab.lab.model.AbstractODESim');

goog.require('goog.array');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const ODESim = goog.require('myphysicslab.lab.model.ODESim');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const Simulation = goog.require('myphysicslab.lab.model.Simulation');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');

/** Abstract base class for {@link myphysicslab.lab.model.ODESim}.

* @abstract
* @implements {ODESim}
*/
class AbstractODESim extends AbstractSubject {
/**
* @param {string=} opt_name name of this ODESim as a Subject
* @param {!SimList=} opt_simList SimList to use (optional)
* @param {!VarsList=} opt_varsList VarsList to use (optional)
*/
constructor(opt_name, opt_simList, opt_varsList) {
  super(opt_name || 'SIM');
  /**
  * @type {!SimList}
  * @private
  */
  this.simList_ = opt_simList || new SimList();
  /**
  * @type {!VarsList}
  * @private
  */
  this.varsList_ = opt_varsList ||
      new VarsList([], [], this.getName()+'_VARS');
  /** Initial values.
  * @type {?Array<number>}
  * @protected
  */
  this.initialState_ = null;
  /** While stepping forward in time, stores the previous values of the simulation
  * state variables, so that we can back up in time if a collision is encountered.
  * @type {?Array<number>}
  * @private
  */
  this.recentState_ = null;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : ', varsList_: '+this.varsList_.toStringShort()
      +', simList_: '+this.simList_.toStringShort()
      + super.toString();
};

/** @abstract */
evaluate(vars, change, timeStep) {};

/** @override */
getTime() {
  return this.varsList_.getTime();
};

/** @override */
getVarsList() {
  return this.varsList_;
};

/** @abstract */
modifyObjects() {};

/** @override */
reset() {
  if (this.initialState_ != null) {
    this.varsList_.setValues(this.initialState_);
  }
  this.simList_.removeTemporary(Util.POSITIVE_INFINITY);
  this.modifyObjects();
  this.broadcast(new GenericEvent(this, Simulation.RESET));
};

/** @override */
restoreState() {
  if (this.recentState_ != null) {
    this.varsList_.setValues(this.recentState_, /*continuous=*/true);
  }
};

/** @override */
saveInitialState() {
  this.initialState_ = this.varsList_.getValues();
  this.broadcast(new GenericEvent(this, Simulation.INITIAL_STATE_SAVED));
};

/** @override */
saveState() {
  this.recentState_ = this.varsList_.getValues();
};

/** @override */
getSimList() {
  return this.simList_;
};

/** Sets the VarsList for this simulation.
@param {!VarsList} varsList the VarsList to use in this simulation
@protected
*/
setVarsList(varsList) {
  this.varsList_ = varsList;
};

} // end class
exports = AbstractODESim;
