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

import { DiffEqSolver } from './DiffEqSolver.js'
import { GenericEvent } from '../util/Observe.js'
import { MemoList } from '../util/Memo.js'
import { ODEAdvance, AdvanceStrategy } from './AdvanceStrategy.js'
import { ODESim } from './ODESim.js'
import { RungeKutta } from './RungeKutta.js'
import { Util } from '../util/Util.js'

/** Advances an {@link ODESim} in a single step without doing any
collision handling.

The {@link advance} method calls {@link DiffEqSolver.step}
to advance the Simulation state, and then
{@link lab/model/Simulation.Simulation.modifyObjects | Simulation.modifyObjects}
to update the state of the
{@link lab/model/SimObject.SimObject | SimObject}s.
*/
export class SimpleAdvance implements ODEAdvance, AdvanceStrategy {
  private sim_: ODESim;
  private odeSolver_: DiffEqSolver;
  /** Default amount of time to advance the simulation, in seconds. */
  private timeStep_: number;

/**
* @param sim the Simulation to advance thru time
* @param opt_diffEqSolver the DiffEqSolver to use for advancing the simulation;
*      default is RungeKutta.
*/
constructor(sim: ODESim, opt_diffEqSolver?: DiffEqSolver) {
  this.sim_ = sim;
  this.odeSolver_ = opt_diffEqSolver || new RungeKutta(sim);
  this.timeStep_ = 0.025;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', odeSolver_: '+this.odeSolver_.toStringShort()
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'SimpleAdvance{sim_: '+this.sim_.toStringShort()+'}';
};

/** @inheritDoc */
advance(timeStep: number, opt_memoList?: MemoList): void {
  this.sim_.getSimList().removeTemporary(this.sim_.getTime());
  const err = this.odeSolver_.step(timeStep);
  if (err != null) {
    throw 'error during advance '+err;
  }
  this.sim_.modifyObjects();
  if (opt_memoList !== undefined) {
    opt_memoList.memorize();
  }
};

/** @inheritDoc */
getDiffEqSolver(): DiffEqSolver {
  return this.odeSolver_;
};

/** @inheritDoc */
getTime(): number {
  return this.sim_.getTime();
};

/** @inheritDoc */
getTimeStep(): number {
  return this.timeStep_;
};

/** @inheritDoc */
reset(): void {
  this.sim_.reset();
};

/** @inheritDoc */
save(): void {
  this.sim_.saveInitialState();
};

/** @inheritDoc */
setDiffEqSolver(diffEqSolver: DiffEqSolver): void {
  this.odeSolver_ = diffEqSolver;
};

/** @inheritDoc */
setTimeStep(timeStep: number): void {
  this.timeStep_ = timeStep;
};

} // end class
Util.defineGlobal('lab$model$SimpleAdvance', SimpleAdvance);
