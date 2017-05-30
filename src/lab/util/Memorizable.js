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

goog.provide('myphysicslab.lab.util.Memorizable');

goog.require('myphysicslab.lab.util.Printable');

/** An object that memorizes simulation data or performs some other function that needs
to happen regularly. The `memorize` method is meant to be called after each simulation
time step, as is done in {@link myphysicslab.lab.model.AdvanceStrategy#advance}.
See {@link myphysicslab.lab.util.MemoList} for how to add a Memorizable
object so that it will be called frequently.

* @interface
* @extends {myphysicslab.lab.util.Printable}
*/
myphysicslab.lab.util.Memorizable = function() {};

/** Memorize the current simulation data, or do some other function that should happen
regularly after each simulation time step.
@return {undefined}
*/
myphysicslab.lab.util.Memorizable.prototype.memorize;
