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

goog.module('myphysicslab.lab.model.DiffEqSolverSubject');

const array = goog.require('goog.array');
const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const AdaptiveStepSolver = goog.require('myphysicslab.lab.model.AdaptiveStepSolver');
const DiffEqSolver = goog.require('myphysicslab.lab.model.DiffEqSolver');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EulersMethod = goog.require('myphysicslab.lab.model.EulersMethod');
const ModifiedEuler = goog.require('myphysicslab.lab.model.ModifiedEuler');
const ODEAdvance = goog.require('myphysicslab.lab.model.ODEAdvance');
const ODESim = goog.require('myphysicslab.lab.model.ODESim');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const RungeKutta = goog.require('myphysicslab.lab.model.RungeKutta');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Makes available several {@link DiffEqSolver}s for advancing
an ODESim simulation. Creates a ParameterString for changing which DiffEqSolver to use.
The ParameterString can be hooked up to a ChoiceControl to allow the user to change the
DiffEqSolver. Or you can directly invoke the {@link #setDiffEqSolver} method.

The EnergySystem is only needed for the experimental
{@link AdaptiveStepSolver}. If EnergySystem is not provided then
all DiffEqSolver options are still available except for AdaptiveStepSolver.

Parameters Created
------------------

+ ParameterString named `DIFF_EQ_SOLVER`, see {@link #setDiffEqSolver}

*/
class DiffEqSolverSubject extends AbstractSubject {
/**
* @param {!ODESim} sim the simulation of interest
* @param {?EnergySystem} energySystem the EnergySystem (usually same as `sim`),
    can be `null`
* @param {!ODEAdvance} advanceStrategy the AdvanceStrategy being used to advance the
    simulation in time
* @param {string=} opt_name name of this DiffEqSolverSubject.
*/
constructor(sim, energySystem, advanceStrategy, opt_name) {
  super(opt_name || 'DIFF_EQ_SUBJECT');
  /**
  * @type {!ODESim}
  * @private
  */
  this.sim_ = sim;
  /**
  * @type {?EnergySystem}
  * @private
  */
  this.energySystem_ = energySystem;
  /**
  * @type {!ODEAdvance}
  * @private
  */
  this.advanceStrategy_ = advanceStrategy;
  /**
  * @type {!Array<!DiffEqSolver>}
  * @private
  */
  this.solvers_ = [];
  this.solvers_.push(new EulersMethod(this.sim_));
  this.solvers_.push(new ModifiedEuler(this.sim_));
  this.solvers_.push(new RungeKutta(this.sim_));
  if (this.energySystem_ != null) {
    let solver = new AdaptiveStepSolver(this.sim_, this.energySystem_,
        new ModifiedEuler(this.sim_));
    this.solvers_.push(solver);
    solver = new AdaptiveStepSolver(this.sim_, this.energySystem_,
        new RungeKutta(this.sim_));
    this.solvers_.push(solver);
  };
  const choices = this.solvers_.map(s => s.getName(/*localized=*/true));
  const values = this.solvers_.map(s => s.getName());
  this.addParameter(
    new ParameterString(this, DiffEqSolverSubject.en.DIFF_EQ_SOLVER,
        DiffEqSolverSubject.i18n.DIFF_EQ_SOLVER,
        () => this.getDiffEqSolver(), a => this.setDiffEqSolver(a),
        choices, values));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', sim_: '+this.sim_.toStringShort()
      +', energySystem_: '+(this.energySystem_ == null ? 'null'
          : this.energySystem_.toStringShort())
      +', advanceStrategy_: '+this.advanceStrategy_
      +', solvers_: [ '
      + this.solvers_.map(s => s.toStringShort())
      +']'
      + super.toString();
};

/** @override */
getClassName() {
  return Util.ADVANCED ? '' : 'DiffEqSolverSubject';
};

/** Returns the language-independent name of the current DiffEqSolver
* @return {string} the language-independent name of the current DiffEqSolver
*/
getDiffEqSolver() {
  return this.advanceStrategy_.getDiffEqSolver().getName();
};

/** Sets which DiffEqSolver to use.
* @param {string} value the language-independent name of the DiffEqSolver to use
*/
setDiffEqSolver(value) {
  if (!this.advanceStrategy_.getDiffEqSolver().nameEquals(value)) {
    const solver = array.find(this.solvers_, s => s.nameEquals(value));
    if (solver != null) {
      this.advanceStrategy_.setDiffEqSolver(solver);
      this.broadcastParameter(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);
    } else {
      throw 'unknown solver: '+value;
    }
  }
};

} // end class

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
  DIFF_EQ_SOLVER: 'Diff Eq Löser'
};

/** Set of internationalized strings.
@type {DiffEqSolverSubject.i18n_strings}
*/
DiffEqSolverSubject.i18n = goog.LOCALE === 'de' ? DiffEqSolverSubject.de_strings :
    DiffEqSolverSubject.en;

exports = DiffEqSolverSubject;
