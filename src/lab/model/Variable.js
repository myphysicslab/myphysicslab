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

goog.provide('myphysicslab.lab.model.Variable');

goog.require('myphysicslab.lab.util.Parameter');

/** Represents a variable with a numeric value; usually stored in a
{@link myphysicslab.lab.model.VarsList}.

@interface
@extends {myphysicslab.lab.util.Parameter}
*/
myphysicslab.lab.model.Variable = function() {};

/** Returns whether the Variable is broadcast when it changes discontinuously.
@return {boolean} whether the Variable is broadcast when it changes discontinuously
*/
myphysicslab.lab.model.Variable.prototype.getBroadcast;

/** Returns the sequence number of this Variable. The sequence number is incremented
whenever a discontinuity occurs in the value of the variable. See {@link #incrSequence}.

For example, when the variables are set back to initial conditions that is a discontinuous
change. Then a graph knows to not draw a connecting line between the points with the
discontinuity.

Another example of a discontinuity: if the value of an angle is kept within `0` to
`2*Pi` (by just adding or subtracting `2*pi` to keep it in that range), when the angle
crosses that boundary the sequence number should be incremented to indicate a
discontinuity occurred.

* @return {number} the sequence number of this Variable.
*/
myphysicslab.lab.model.Variable.prototype.getSequence;

/** Returns the value of this Variable.
@return {number} the value of this Variable
*/
myphysicslab.lab.model.Variable.prototype.getValue;

/** Increments the sequence number of this Variable, which indicates that a
discontinuity has occurred in the value of this variable. This information is used in a
graph to prevent drawing a line between points that have a discontinuity.
See {@link #getSequence}.
* @return {undefined}
*/
myphysicslab.lab.model.Variable.prototype.incrSequence;

/** Sets whether the Variable is broadcast when it changes discontinuously
@param {boolean} value whether the Variable is broadcast when it changes discontinuously
*/
myphysicslab.lab.model.Variable.prototype.setBroadcast;

/** Sets the value of this Variable and increases the sequence number.
@param {number} value the value to set this Variable to
*/
myphysicslab.lab.model.Variable.prototype.setValue;

/** Sets the value of this Variable without changing the sequence number which means
it is a 'smooth' continuous change to the variable.
See {@link myphysicslab.lab.model.VarsList#getSequence}.
* @param {number} value the value of this Variable
*/
myphysicslab.lab.model.Variable.prototype.setValueSmooth;
