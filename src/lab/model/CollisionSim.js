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

goog.provide('myphysicslab.lab.model.CollisionSim');

goog.require('myphysicslab.lab.model.Collision');
goog.require('myphysicslab.lab.model.CollisionTotals');
goog.require('myphysicslab.lab.model.ODESim');

goog.scope(function() {

/** An ODESim simulation that detects and handles collisions between objects.

* @interface
* @extends {myphysicslab.lab.model.ODESim}
*/
myphysicslab.lab.model.CollisionSim = function() {};

var CollisionSim = myphysicslab.lab.model.CollisionSim;

/** Finds collisions based on the passed in state variables. Can rely on
{@link myphysicslab.lab.model.ODESim#modifyObjects} having been called prior, with this
set of state variables. Uses the state saved by
{@link myphysicslab.lab.model.ODESim#saveState} as the 'before' state for comparison.

The list of collisions that are passed in can potentially have collisions from the
near future that were found previously. The CollisionSim should avoid adding collisions
that are duplicates of those already on the list.

@param {!Array<!myphysicslab.lab.model.Collision>} collisions the list of collisions
    to add to
@param {!Array<number>} vars  the current array of state variables
@param {number} stepSize the size of the current time step, in seconds
*/
CollisionSim.prototype.findCollisions;

/** Adjusts the simulation state based on the given Collisions.
For example, this might reverse the velocities of objects colliding against a wall.
The simulation state is contained in the `vars` array of state variables from
{@link myphysicslab.lab.model.ODESim#getVarsList}.

Note that these Collisions will typically be from the very near future;
{@link myphysicslab.lab.model.CollisionAdvance} backs up to just before the moment of collision
before handling Collisions.

@param {!Array<!myphysicslab.lab.model.Collision>} collisions the list of current
    collisions
@param {!myphysicslab.lab.model.CollisionTotals=} opt_totals CollisionTotals object
    to update with number of collisions handled (optional)
@return {boolean} true if was able to handle the collision, changing state of
    simulation.
*/
CollisionSim.prototype.handleCollisions;

/** For debugging, specify a function that will paint canvases, so that you can see the
simulation while stepping thru with debugger.
* @param {?function():undefined} fn function that will paint canvases
*/
CollisionSim.prototype.setDebugPaint;

}); // goog.scope
