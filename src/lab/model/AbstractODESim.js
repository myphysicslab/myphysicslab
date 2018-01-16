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

goog.provide('myphysicslab.lab.model.AbstractODESim');

goog.require('goog.array');
goog.require('myphysicslab.lab.model.ODESim');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.Simulation');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Printable');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
const GenericEvent = goog.module.get('myphysicslab.lab.util.GenericEvent');
var SimList = myphysicslab.lab.model.SimList;
var Simulation = myphysicslab.lab.model.Simulation;
const Subject = goog.module.get('myphysicslab.lab.util.Subject');
const Util = goog.module.get('myphysicslab.lab.util.Util');
var VarsList = myphysicslab.lab.model.VarsList;

/** Abstract base class for {@link myphysicslab.lab.model.ODESim}.

* @param {string=} opt_name name of this ODESim as a Subject
* @param {!SimList=} opt_simList SimList to use (optional)
* @param {!VarsList=} opt_varsList VarsList to use (optional)
* @constructor
* @abstract
* @struct
* @implements {myphysicslab.lab.model.ODESim}
* @extends {AbstractSubject}
*/
myphysicslab.lab.model.AbstractODESim = function(opt_name, opt_simList, opt_varsList) {
  AbstractSubject.call(this, opt_name || 'SIM');
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
var AbstractODESim = myphysicslab.lab.model.AbstractODESim;
goog.inherits(AbstractODESim, AbstractSubject);

if (!Util.ADVANCED) {
  /** @override */
  AbstractODESim.prototype.toString = function() {
    return ', varsList_: '+this.varsList_.toStringShort()
        +', simList_: '+this.simList_.toStringShort()
        + AbstractODESim.superClass_.toString.call(this);
  };
};

/** @abstract */
AbstractODESim.prototype.evaluate = function(vars, change, timeStep) {};

/** @override */
AbstractODESim.prototype.getTime = function() {
  return this.varsList_.getTime();
};

/** @override */
AbstractODESim.prototype.getVarsList = function() {
  return this.varsList_;
};

/** @abstract */
AbstractODESim.prototype.modifyObjects = function() {};

/** @override */
AbstractODESim.prototype.reset = function() {
  if (this.initialState_ != null) {
    this.varsList_.setValues(this.initialState_);
  }
  this.simList_.removeTemporary(Util.POSITIVE_INFINITY);
  this.modifyObjects();
  this.broadcast(new GenericEvent(this, Simulation.RESET));
};

/** @override */
AbstractODESim.prototype.restoreState = function() {
  if (this.recentState_ != null) {
    this.varsList_.setValues(this.recentState_, /*continuous=*/true);
  }
};

/** @override */
AbstractODESim.prototype.saveInitialState = function() {
  this.initialState_ = this.varsList_.getValues();
  this.broadcast(new GenericEvent(this, Simulation.INITIAL_STATE_SAVED));
};

/** @override */
AbstractODESim.prototype.saveState = function() {
  this.recentState_ = this.varsList_.getValues();
};

/** @override */
AbstractODESim.prototype.getSimList = function() {
  return this.simList_;
};

/** Sets the VarsList for this simulation.
@param {!VarsList} varsList the VarsList to use in this simulation
@protected
*/
AbstractODESim.prototype.setVarsList = function(varsList) {
  this.varsList_ = varsList;
};

}); // goog.scope
