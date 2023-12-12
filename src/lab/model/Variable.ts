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

import { Parameter, SubjectEvent } from '../util/Observe.js';
import { Printable } from '../util/Util.js';

/** Represents a variable with a numeric value; usually stored in a
{@link lab/model/VarsList.VarsList}.

Variable extends Parameter so that {@link lab/util/EasyScriptParser.EasyScriptParser}
can easily set a simulation's initial conditions (the set of starting Variables).
EasyScriptParser can then use the same mechanisms for setting or reporting values of
Parameters and Variables.

Variables differ from "normal" Parameters in that a Variable does not broadcast when
its value changes. Except that you can tell a Variable to broadcast on a discontinuous
change, see {@link Variable.setBroadcast}.
*/
export interface Variable extends Parameter, SubjectEvent, Printable {

/** Returns whether the Variable is broadcast when it changes discontinuously.
@return whether the Variable is broadcast when it changes discontinuously
*/
getBroadcast(): boolean;

/** Returns the sequence number of this Variable. The sequence number is incremented
whenever a discontinuity occurs in the value of the variable.
See {@link Variable.incrSequence}.

For example, when the variables are set back to initial conditions that is a
discontinuous change. Then a graph knows to not draw a connecting line between the
points with the discontinuity.

Another example of a discontinuity: if the value of an angle is kept within `0` to
`2*Pi` (by just adding or subtracting `2*pi` to keep it in that range), when the angle
crosses that boundary the sequence number should be incremented to indicate a
discontinuity occurred.

@return the sequence number of this Variable.
*/
getSequence(): number;

/** Returns the value of this Variable.
@return the value of this Variable
*/
getValue(): number;

/** Increments the sequence number of this Variable, which indicates that a
discontinuity has occurred in the value of this variable. This information is used in a
graph to prevent drawing a line between points that have a discontinuity.
See {@link Variable.getSequence}.
*/
incrSequence(): void;

/** Returns index of this Variable within it's VarsList, or -1 if not in a VarsList.
@return integer index number of the variable, or -1 if not in a VarsList
*/
indexOf(): number;

/** Sets whether the Variable is broadcast when it changes discontinuously
@param value whether the Variable is broadcast when it changes discontinuously
*/
setBroadcast(value: boolean): void;

/** Sets the value of this Variable and increases the sequence number.
@param value the value to set this Variable to
*/
setValue(value: number): void;

/** Sets the value of this Variable without changing the sequence number which means
it is a 'smooth' continuous change to the variable.
See {@link Variable.getSequence}.
@param value the value of this Variable
*/
setValueSmooth(value: number): void;
}
