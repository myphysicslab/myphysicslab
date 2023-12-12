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

/** Defines initial conditions of a string used in the
{@link sims/pde/StringSim.StringSim} PDE simulation by specifying the initial
displacement and velocity at each point of the string.

### How to find the correct velocity for a traveling wave:

The d'Alembert equation for a left-moving traveling wave is `f(x + ct)`, where `f()`
is a general single-variable waveform, think of it as `f(x)` moving to
the left as `t` increases.  The velocity (partial derivative with respect
to time) is then `c f'(x + ct)` which at time `t=0` is  `c f'(x)`.
So take the first derivative of the waveform, and multiply by `c`
where `c` is the wave speed `= sqrt(tension/density)`.
Right-moving wave is `f(x - ct)` with derivative `-c f'(x)`

*/
export interface StringShape {

/** Returns name of class of this object.
* @return name of class of this object.
*/
getClassName(): string;

/** Returns the length of the string.
@return length of the string
*/
getLength(): number;

/** Name of this StringShape, either a the language-independent name for scripting
purposes or the localized name for display to user.
@param opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return name of this StringShape
*/
getName(opt_localized?: boolean): string;

/** Returns the initial displacement at a point on the string.
@param x  the location of the point of the string
@return the displacement at that point of the string
*/
position(x: number): number;

/** Returns the initial velocity at a point of the string.
@param x  the location of the point of the string
@return the velocity at that point of the string
*/
velocity(x: number): number;

}
