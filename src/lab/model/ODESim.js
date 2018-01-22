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

goog.module('myphysicslab.lab.model.ODESim');

const Simulation = goog.require('myphysicslab.lab.model.Simulation');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');

/** A Simulation based on ordinary differential equations. Contains an array of
variables given by {@link #getVarsList} which holds the simulation state and an
{@link #evaluate} method that defines the differential equation. A
{@link myphysicslab.lab.model.DiffEqSolver} can act on the ODESim to advance the
variables over time.

Note that the {@link myphysicslab.lab.model.VarsList} returned by `getVarsList`
method is implicitly a significant part of the API of ODESim. For example: initial
conditions are set by modifying the values stored in the VarsList.

Time is stored in the VarsList. When the simulation state is advanced, the time is
advanced by the DiffEqSolver like any other variable. The time variable always has a
rate of change of exactly 1.0, which is specified in the `evaluate` method.

* @interface
*/
class ODESim extends Simulation {

/** Defines the differential equations of this ODESim; for an input set of variables,
returns the current rate of change for each variable (the first derivative of each
variable with respect to time).

The `timeStep` is the time since the state variables were last fully calculated, which
can be and often is zero. The current time can be regarded as `getTime() + timeStep`.
The input variables correspond to the Simulation state at that time. Note that
`timeStep` is different from the time step used to advance the Simulation (as in
{@link myphysicslab.lab.model.AdvanceStrategy#advance}). The `timeStep` is typically
used when finding collisions, see for example
{@link myphysicslab.lab.model.CollisionSim#findCollisions}.

@param {!Array<number>} vars the current array of state variables (input),
    corresponding to the state at `getTime() + timeStep`
@param {!Array<number>} change  array of change rates for each variable (output), all
    values are zero on entry.
@param {number} timeStep the current time step (might be zero)
@return {?Object} `null` if the evaluation succeeds, otherwise an object relating to the
    error that occurred. The `change` array contains the output results.
*/
evaluate(vars, change, timeStep) {}

/** Returns the VarsList that represents the current state of this Simulation.
@return {!VarsList} the VarsList that represents the current
    state of this Simulation
*/
getVarsList() {}

/** Restores the Simulation state that was saved with {@link #saveState}.
@return {undefined}
*/
restoreState() {}

/** Saves the current state of the Simulation, so that we can back up to this state
later on. The state is defined mainly by the set of Simulation variables, see
{@link #getVarsList}, but can include other data. This state is typically used for
collision detection as the *before collision* state, see
{@link myphysicslab.lab.model.CollisionSim#findCollisions}.
@return {undefined}
*/
saveState() {}

} // end class
exports = ODESim;
