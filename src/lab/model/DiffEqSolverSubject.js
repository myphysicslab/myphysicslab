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

goog.provide('myphysicslab.lab.model.DiffEqSolverSubject');

goog.require('myphysicslab.lab.model.AdaptiveStepSolver');
goog.require('myphysicslab.lab.model.ODEAdvance');
goog.require('myphysicslab.lab.model.DiffEqSolver');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.EulersMethod');
goog.require('myphysicslab.lab.model.ModifiedEuler');
goog.require('myphysicslab.lab.model.ODESim');
goog.require('myphysicslab.lab.model.RungeKutta');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var AdaptiveStepSolver = myphysicslab.lab.model.AdaptiveStepSolver;
var DiffEqSolver = myphysicslab.lab.model.DiffEqSolver;
var EulersMethod = myphysicslab.lab.model.EulersMethod;
var ModifiedEuler = myphysicslab.lab.model.ModifiedEuler;
var ParameterString = myphysicslab.lab.util.ParameterString;
var RungeKutta = myphysicslab.lab.model.RungeKutta;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var EnergySystem = myphysicslab.lab.model.EnergySystem;

/** Makes available several {@link myphysicslab.lab.model.DiffEqSolver}s for advancing
an ODESim simulation. Creates a ParameterString for changing which DiffEqSolver to use.
The ParameterString can be hooked up to a ChoiceControl to allow the user to change the
DiffEqSolver. Or you can directly invoke the {@link #setDiffEqSolver} method.

The EnergySystem is only needed for the experimental
{@link myphysicslab.lab.model.AdaptiveStepSolver}. If EnergySystem is not provided then
all DiffEqSolver options are still available except for AdaptiveStepSolver.

### Parameters Created

+ ParameterString named `DiffEqSolverSubject.en.DIFF_EQ_SOLVER`
  see {@link #setDiffEqSolver}

* @param {!myphysicslab.lab.model.ODESim} sim the simulation of interest
* @param {?myphysicslab.lab.model.EnergySystem} energySystem the EnergySystem (usually
    same as `sim`), can be `null`
* @param {!myphysicslab.lab.model.ODEAdvance} advanceStrategy the AdvanceStrategy
    being used to advance the simulation in time
* @param {string=} opt_name name of this DiffEqSolverSubject.
* @constructor
* @final
* @struct
* @extends {myphysicslab.lab.util.AbstractSubject}
* @implements {myphysicslab.lab.util.Subject}
*/
myphysicslab.lab.model.DiffEqSolverSubject = function(sim, energySystem,
     advanceStrategy, opt_name) {
  AbstractSubject.call(this, opt_name || 'DIFF_EQ_SUBJECT');
  /**
  * @type {!myphysicslab.lab.model.ODESim}
  * @private
  */
  this.sim_ = sim;
  /**
  * @type {?myphysicslab.lab.model.EnergySystem}
  * @private
  */
  this.energySystem_ = energySystem;
  /**
  * @type {!myphysicslab.lab.model.ODEAdvance}
  * @private
  */
  this.advanceStrategy_ = advanceStrategy;
  /**
  * @type {!Array<!DiffEqSolver>}
  * @private
  */
  this.solvers_ = [ new EulersMethod(this.sim_),
      new ModifiedEuler(this.sim_),
      new RungeKutta(this.sim_)];
  if (this.energySystem_ != null) {
    this.solvers_.push(new AdaptiveStepSolver(this.sim_, this.energySystem_,
        new ModifiedEuler(this.sim_)));
    this.solvers_.push(new AdaptiveStepSolver(this.sim_, this.energySystem_,
        new RungeKutta(this.sim_)));
  };
  var choices = goog.array.map(this.solvers_, function(s) {
      return s.getName(/*localized=*/true);
  });
  var values = goog.array.map(this.solvers_, function(s) { return s.getName(); });
  this.addParameter(
    new ParameterString(this, DiffEqSolverSubject.en.DIFF_EQ_SOLVER,
        DiffEqSolverSubject.i18n.DIFF_EQ_SOLVER,
        this.getDiffEqSolver, this.setDiffEqSolver,
        choices, values));
};
var DiffEqSolverSubject = myphysicslab.lab.model.DiffEqSolverSubject;
goog.inherits(DiffEqSolverSubject, AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DiffEqSolverSubject.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', sim_: '+this.sim_.toStringShort()
        +', energySystem_: '+(this.energySystem_ == null ? 'null'
            : this.energySystem_.toStringShort())
        +', advanceStrategy_: '+this.advanceStrategy_
        +', solvers_: [ '
        + goog.array.map(this.solvers_, function(s) { return s.toStringShort(); })
        +']'
        + DiffEqSolverSubject.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
DiffEqSolverSubject.prototype.getClassName = function() {
  return 'DiffEqSolverSubject';
};

/** Returns the language-independent name of the current DiffEqSolver
* @return {string} the language-independent name of the current DiffEqSolver
*/
DiffEqSolverSubject.prototype.getDiffEqSolver = function() {
  return this.advanceStrategy_.getDiffEqSolver().getName();
};

/** Sets which DiffEqSolver to use.
* @param {string} value the language-independent name of the DiffEqSolver to use
*/
DiffEqSolverSubject.prototype.setDiffEqSolver = function(value) {
  if (!this.advanceStrategy_.getDiffEqSolver().nameEquals(value)) {
    var solver = goog.array.find(this.solvers_, function(s) {
        return s.nameEquals(value);
    });
    if (solver != null) {
      this.advanceStrategy_.setDiffEqSolver(solver);
      this.broadcastParameter(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);
    } else {
      throw new Error('unknown solver: '+value);
    }
  }
};

/** Set of internationalized strings.
@typedef {{
  DIFF_EQ_SOLVER: string
  }}
*/
DiffEqSolverSubject.i18n_strings;

/**
@type {DiffEqSolverSubject.i18n_strings}
*/
DiffEqSolverSubject.en = {
  DIFF_EQ_SOLVER: 'Diff Eq Solver'
};

/**
@private
@type {DiffEqSolverSubject.i18n_strings}
*/
DiffEqSolverSubject.de_strings = {
  DIFF_EQ_SOLVER: 'Diff Eq L\u00f6ser'
};

/** Set of internationalized strings.
@type {DiffEqSolverSubject.i18n_strings}
*/
DiffEqSolverSubject.i18n = goog.LOCALE === 'de' ? DiffEqSolverSubject.de_strings :
    DiffEqSolverSubject.en;

}); // goog.scope
