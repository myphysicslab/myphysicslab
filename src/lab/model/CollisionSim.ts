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

import { Collision, CollisionTotals } from './Collision.js'
import { ODESim } from './ODESim.js'
import { Simulation } from './Simulation.js'

/** An ODESim simulation that detects and handles collisions between objects. */
export interface CollisionSim<T extends Collision> extends ODESim, Simulation {

/** Finds collisions based on the passed in state variables. Can rely on
{@link modifyObjects} having been called prior, with this
set of state variables. Uses the state saved by
{@link saveState} as the 'before' state for comparison.

The list of collisions that are passed in can potentially have collisions from the
near future that were found previously. The CollisionSim should avoid adding collisions
that are duplicates of those already on the list.

@param collisions the list of collisions to add to
@param vars  the current array of state variables
@param stepSize the size of the current time step, in seconds
*/
findCollisions(collisions: T[], vars: number[], stepSize: number): void;

/** Adjusts the simulation state based on the given Collisions.
For example, this might reverse the velocities of objects colliding against a wall.
The simulation state is contained in the `vars` array of state variables from
{@link getVarsList}.

Note that these Collisions will typically be from the very near future;
{@link lab/model/CollisionAdvance.CollisionAdvance | CollisionAdvance}
backs up to just before the moment of collision before handling Collisions.

@param collisions the list of current collisions
@param opt_totals CollisionTotals object to update with number of collisions handled
@return true if was able to handle the collision, changing state of simulation.
*/
handleCollisions(collisions: T[], opt_totals?: CollisionTotals): boolean;

/** For debugging, specify a function that will paint canvases, so that you can see the
simulation while stepping thru with debugger.
@param fn function that will paint canvases
*/
setDebugPaint(fn: null|(()=>void)): void;

}
