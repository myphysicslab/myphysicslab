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

goog.module('myphysicslab.lab.model.ODEAdvance');

const AdvanceStrategy = goog.require('myphysicslab.lab.model.AdvanceStrategy');
const DiffEqSolver = goog.require('myphysicslab.lab.model.DiffEqSolver');

/** An AdvanceStrategy for advancing an {@link myphysicslab.lab.model.ODESim}
thru time.

* @interface
*/
class ODEAdvance extends AdvanceStrategy {

/** Returns the DiffEqSolver used to solve the differential equations
@return {!DiffEqSolver} the DiffEqSolver used to solve the differential equations
*/
getDiffEqSolver() {}

/** Sets the DiffEqSolver used to solve the differential equations
@param {!DiffEqSolver} diffEqSolver the DiffEqSolver used to solve the differential
    equations of this simulation.
*/
setDiffEqSolver(diffEqSolver) {}

} // end class
exports = ODEAdvance;
