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
import { SimList } from './SimList.js';
import { Simulation } from './Simulation.js';
import { Subject, GenericEvent } from '../util/Observe.js';
import { Terminal } from '../util/Terminal.js';
import { Util } from '../util/Util.js';
import { VarsList } from './VarsList.js';

/** A Simulation based on ordinary differential equations. Contains an array of
variables given by {@link ODESim.getVarsList} which holds the simulation state and an
{@link ODESim.evaluate} method that defines the differential equation. A
{@link lab/model/DiffEqSolver.DiffEqSolver} can act on the ODESim to advance the
variables over time.

Note that the {@link VarsList} returned by `getVarsList`
method is implicitly a significant part of the API of ODESim. For example: initial
conditions are set by modifying the values stored in the VarsList.

Time is stored in the VarsList. When the simulation state is advanced, the time is
advanced by the DiffEqSolver like any other variable. The time variable always has a
rate of change of exactly 1.0, which is specified in the `evaluate` method.

*/
export interface ODESim extends Simulation {

/** Defines the differential equations of this ODESim; for an input set of variables,
returns the current rate of change for each variable (the first derivative of each
variable with respect to time).

The `timeStep` is the time since the state variables were last fully calculated, which
can be and often is zero. The current time can be regarded as `getTime() + timeStep`.
The input variables correspond to the Simulation state at that time. Note that
`timeStep` is different from the time step used to advance the Simulation (as in
{@link lab/model/AdvanceStrategy.AdvanceStrategy.advance}). The `timeStep` is typically
used when finding collisions, see for example
{@link lab/model/CollisionSim.CollisionSim.findCollisions}.

@param vars the current array of state variables (input),
    corresponding to the state at `getTime() + timeStep`
@param change  array of change rates for each variable (output), all
    values are zero on entry.
@param timeStep the current time step (might be zero)
@return `null` if the evaluation succeeds, otherwise an object relating to the
    error that occurred. The `change` array contains the output results.
*/
evaluate(vars: number[], change: number[], timeStep: number): null|object;

/** Returns the VarsList that represents the current state of this Simulation.
@return the VarsList that represents the current state of this Simulation
*/
getVarsList(): VarsList;

/** Restores the Simulation state that was saved with
{@link ODESim.saveState}.
*/
restoreState(): void;

/** Saves the current state of the Simulation, so that we can back up to this state
later on. The state is defined mainly by the set of Simulation variables, see
{@link ODESim.getVarsList}, but can include other data. This state is
typically used for collision detection as the *before collision* state, see
{@link lab/model/CollisionSim.CollisionSim.findCollisions}.
*/
saveState(): void;

/** Sets the Terminal object that this simulation can print data into.
@param terminal the Terminal object that this simulation can print data into.
*/
setTerminal(terminal: Terminal|null): void;

} // end interface

// *************************** AbstractODESim *********************************

/** Abstract base class for {@link ODESim}.
*/
export abstract class AbstractODESim extends AbstractSubject implements Subject, Simulation, ODESim {
  private simList_: SimList;
  private varsList_: VarsList;
  /** Initial values. */
  protected initialState_: number[]|null = null;
  /** While stepping forward in time, stores the previous values of the simulation
  * state variables, so that we can back up in time if a collision is encountered.
  */
  private recentState_: number[]|null = null;
  protected terminal_: Terminal|null = null;

/**
* @param opt_name name of this ODESim as a Subject
* @param opt_simList SimList to use (optional)
* @param opt_varsList VarsList to use (optional)
*/
constructor(opt_name?: string, opt_simList?: SimList, opt_varsList?: VarsList) {
  super(opt_name || 'SIM');
  this.simList_ = opt_simList || new SimList();
  this.varsList_ = opt_varsList || new VarsList([], [], this.getName()+'_VARS');
};

/** @inheritDoc */
override toString() {
  return ', varsList_: '+this.varsList_.toStringShort()
      +', simList_: '+this.simList_.toStringShort()
      + super.toString();
};

/** @inheritDoc */
abstract evaluate(vars: number[], change: number[], timeStep: number): null|object;

/** @inheritDoc */
getTime(): number {
  return this.varsList_.getTime();
};

/** @inheritDoc */
getVarsList(): VarsList {
  return this.varsList_;
};

/** @inheritDoc */
abstract modifyObjects(): void;

/** @inheritDoc */
reset(): void {
  if (this.initialState_ != null) {
    this.varsList_.setValues(this.initialState_);
  }
  this.simList_.removeTemporary(Infinity);
  this.modifyObjects();
  this.broadcast(new GenericEvent(this, AbstractODESim.RESET));
};

/** @inheritDoc */
restoreState(): void {
  if (this.recentState_ != null) {
    this.varsList_.setValues(this.recentState_, /*continuous=*/true);
  }
};

/** @inheritDoc */
saveInitialState(): void {
  this.initialState_ = this.varsList_.getValues();
  this.broadcast(new GenericEvent(this, AbstractODESim.INITIAL_STATE_SAVED));
};

/** @inheritDoc */
saveState(): void {
  this.recentState_ = this.varsList_.getValues();
};

/** @inheritDoc */
getSimList(): SimList {
  return this.simList_;
};

/** Sets the VarsList for this simulation.
@param varsList the VarsList to use in this simulation
*/
protected setVarsList(varsList: VarsList): void {
  this.varsList_ = varsList;
};

/** @inheritDoc */
setTerminal(terminal: Terminal|null): void {
  this.terminal_ = terminal;
}

static readonly RESET = 'RESET';

static readonly INITIAL_STATE_SAVED = 'INITIAL_STATE_SAVED';

} // end class

Util.defineGlobal('lab$model$AbstractODESim', AbstractODESim);