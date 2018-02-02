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

goog.module('myphysicslab.lab.model.AdvanceStrategy');

const Printable = goog.require('myphysicslab.lab.util.Printable');
const MemoList = goog.require('myphysicslab.lab.util.MemoList');

/** Advances the state of a Simulation thru time. This follows the [strategy design
pattern](https://en.wikipedia.org/wiki/Strategy_pattern): a Simulation can be fitted
with any of several possible AdvanceStrategys. This gives flexibility in choosing what
algorithm to use for advancing the Simulation.

* @interface
*/
class AdvanceStrategy extends Printable {

/** Advances the Simulation state by the specified amount of time.
@param {number} timeStep  the amount of time to advance in seconds
@param {!MemoList=} opt_memoList optional MemoList to call
    whenever the simulation state is advanced
@throws {!Error} when unable to advance the simulation
*/
advance(timeStep, opt_memoList) {}

/** Returns the current simulation time.  There are no explicit units for the time, so
you can regard a time unit as seconds or years as desired. See
[About Units Of Measurement](Architecture.html#aboutunitsofmeasurement).
@return {number} the current simulation time.
*/
getTime() {}

/** Returns the default time step, the small increment of time by which
to advance the simulation's state.
@return {number} the default time step, in seconds.
*/
getTimeStep() {}

/** Sets the simulation back to its initial conditions, and sets the simulation time
to the starting time.
@return {undefined}
*/
reset() {}

/** Sets the default time step, the small increment of time by which to
advance the simulation's state.

The reason for storing the time step in AdvanceStrategy is so that
{@link myphysicslab.test.TestViewerApp} produces same results as running a test.
This is a convenient way for a test to make known the time step to use.
@param {number} timeStep the default time step, in seconds.
*/
setTimeStep(timeStep) {}

} // end class
exports = AdvanceStrategy;
