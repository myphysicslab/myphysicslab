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

goog.module('myphysicslab.sims.pde.StringShape');

/** Defines initial conditions of a string used in the
{@link myphysicslab.sims.pde.StringSim} PDE simulation by specifying the initial
displacement and velocity at each point of the string.

### How to find the correct velocity for a traveling wave:

The d'Alembert equation for a left-moving traveling wave is `f(x + ct)`, where `f()`
is a general single-variable waveform, think of it as `f(x)` moving to
the left as `t` increases.  The velocity (partial derivative with respect
to time) is then `c f'(x + ct)` which at time `t=0` is  `c f'(x)`.
So take the first derivative of the waveform, and multiply by `c`
where `c` is the wave speed `= sqrt(tension/density)`.
Right-moving wave is `f(x - ct)` with derivative `-c f'(x)`

* @interface
*/
class StringShape {

/** Returns name of class of this object.
* @return {string} name of class of this object.
*/
getClassName() {};

/** Returns the length of the string.
@return {number} length of the string
*/
getLength() {}

/** Name of this StringShape, either a the language-independent name for scripting
purposes or the localized name for display to user.
@param {boolean=} opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return {string} name of this StringShape
*/
getName(opt_localized) {}

/** Returns the initial displacement at a point on the string.
@param {number} x  the location of the point of the string
@return {number} the displacement at that point of the string
*/
position(x) {}

/** Returns the initial velocity at a point of the string.
@param {number} x  the location of the point of the string
@return {number} the velocity at that point of the string
*/
velocity(x) {}

} // end class
exports = StringShape;
