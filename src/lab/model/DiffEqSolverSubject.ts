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

import { AbstractSubject } from '../util/AbstractSubject.js';
import { AdaptiveStepSolver } from './AdaptiveStepSolver.js';
import { DiffEqSolver } from './DiffEqSolver.js';
import { EnergySystem } from './EnergySystem.js';
import { EulersMethod } from './EulersMethod.js';
import { ModifiedEuler } from './ModifiedEuler.js';
import { ODEAdvance } from './AdvanceStrategy.js';
import { ODESim } from './ODESim.js';
import { ParameterString, Subject } from '../util/Observe.js';
import { RungeKutta } from './RungeKutta.js';
import { Util } from '../util/Util.js';

/** Makes available several {@link lab/model/DiffEqSolver.DiffEqSolver}'s for advancing
an ODESim simulation. Creates a ParameterString for changing which DiffEqSolver to use.
The ParameterString can be hooked up to a ChoiceControl to allow the user to change the
DiffEqSolver. Or you can directly invoke the
{@link DiffEqSolverSubject.setDiffEqSolver} method.

The EnergySystem is only needed for the experimental
{@link lab/model/AdaptiveStepSolver.AdaptiveStepSolver}. If EnergySystem is not
provided then all DiffEqSolver options are still available except for
AdaptiveStepSolver.

Parameters Created
------------------

+ ParameterString named `DIFF_EQ_SOLVER`,
see {@link DiffEqSolverSubject.setDiffEqSolver}

*/
export class DiffEqSolverSubject extends AbstractSubject implements Subject {
  private sim_: ODESim;
  private energySystem_: null|EnergySystem;
  private advanceStrategy_: ODEAdvance;
  private solvers_: DiffEqSolver[];

/**
* @param sim the simulation of interest
* @param energySystem the EnergySystem (usually same as `sim`), can be `null`
* @param advanceStrategy the AdvanceStrategy being used to advance the
*    simulation in time
* @param opt_name name of this DiffEqSolverSubject.
*/
constructor(sim: ODESim, energySystem: null|EnergySystem, advanceStrategy: ODEAdvance,
    opt_name?: string) {
  super(opt_name || 'DIFF_EQ_SUBJECT');
  this.sim_ = sim;
  this.energySystem_ = energySystem;
  this.advanceStrategy_ = advanceStrategy;
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

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', sim_: '+this.sim_.toStringShort()
      +', energySystem_: '+(this.energySystem_ == null ? 'null'
          : this.energySystem_.toStringShort())
      +', advanceStrategy_: '+this.advanceStrategy_
      +', solvers_: [ '
      + this.solvers_.map(s => s.toStringShort())
      +']'
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'DiffEqSolverSubject';
};

/** Returns the language-independent name of the current DiffEqSolver
* @return the language-independent name of the current DiffEqSolver
*/
getDiffEqSolver(): string {
  return this.advanceStrategy_.getDiffEqSolver().getName();
};

/** Sets which DiffEqSolver to use.
* @param value the language-independent name of the DiffEqSolver to use
*/
setDiffEqSolver(value: string): void {
  if (!this.advanceStrategy_.getDiffEqSolver().nameEquals(value)) {
    const solver = this.solvers_.find(s => s.nameEquals(value));
    if (solver !== undefined) {
      this.advanceStrategy_.setDiffEqSolver(solver);
      this.broadcastParameter(DiffEqSolverSubject.en.DIFF_EQ_SOLVER);
    } else {
      throw 'unknown solver: '+value;
    }
  }
};

static readonly en: i18n_strings = {
  DIFF_EQ_SOLVER: 'Diff Eq Solver'
};

static readonly de_strings: i18n_strings = {
  DIFF_EQ_SOLVER: 'Diff Eq Löser'
};

static readonly i18n = Util.LOCALE === 'de' ?
    DiffEqSolverSubject.de_strings : DiffEqSolverSubject.en;

} // end DiffEqSolverSubject class

type i18n_strings = {
  DIFF_EQ_SOLVER: string
};

Util.defineGlobal('lab$model$DiffEqSolverSubject', DiffEqSolverSubject);
