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

import { Printable } from '../util/Util.js'
import { MemoList } from '../util/Memo.js'
import { DiffEqSolver } from './DiffEqSolver.js'

/** Advances the state of a Simulation thru time. This follows the
[strategy design pattern](https://en.wikipedia.org/wiki/Strategy_pattern):
a Simulation can be fitted with any of several possible AdvanceStrategys. This gives
flexibility in choosing what algorithm to use for advancing the Simulation.
*/
export interface AdvanceStrategy extends Printable {

/** Advances the Simulation state by the specified amount of time.
@param timeStep  the amount of time to advance in seconds
@param opt_memoList optional MemoList to call whenever the simulation state is advanced
@throws when unable to advance the simulation
*/
advance(timeStep: number, opt_memoList?: MemoList): void;

/** Returns the current simulation time.  There are no explicit units for the time, so
you can regard a time unit as seconds or years as desired. See
[About Units Of Measurement](../Architecture.html#aboutunitsofmeasurement).
@return the current simulation time.
*/
getTime(): number;

/** Returns the default time step, the small increment of time by which
to advance the simulation's state.
@return the default time step, in seconds.
*/
getTimeStep(): number;

/** Sets the simulation back to its initial conditions, and sets the simulation time
to the starting time.
*/
reset(): void;

/** Save the initial conditions, which can be returned to with
{@link AdvanceStrategy.reset}.
*/
save(): void;

/** Sets the default time step, the small increment of time by which to advance the
simulation's state.

The reason for storing the time step in AdvanceStrategy is so that
{@link test/TestViewerApp.TestViewerApp} produces the same results as running a test.
This is a convenient way for a test to make known the time step to use.
@param timeStep the default time step, in seconds.
*/
setTimeStep(timeStep: number): void;
};

// *************************** ODEAdvance *******************************

/** An AdvanceStrategy for advancing an {@link lab/model/ODESim.ODESim} thru time.
*/
export interface ODEAdvance extends AdvanceStrategy {

/** Returns the DiffEqSolver used to solve the differential equations
@return the DiffEqSolver used to solve the differential equations
*/
getDiffEqSolver(): DiffEqSolver;

/** Sets the DiffEqSolver used to solve the differential equations
@param diffEqSolver the DiffEqSolver used to solve the differential
    equations of this simulation.
*/
setDiffEqSolver(diffEqSolver: DiffEqSolver): void;
};
