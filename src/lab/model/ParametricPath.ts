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

import { DoubleRect } from '../util/DoubleRect.js';
import { Util } from '../util/Util.js';

/** Defines a 2D path with a parametric function `f(t) = (x(t), y(t))`.  For example, a circle of radius 3 with center at the origin is defined by
```text
f(t) = (3*cos(t), 3*sin(t))
```
The path has designated start and finish values for the parameter `t`. Note that `t` is
only used to generate the path and usually `t` does not correspond to a length measure
of the path.

*/
export interface ParametricPath {

/** The ending value for `t` in the parameteric equation defining the path.
* @return ending value for `t`
*/
getFinishTValue(): number;

/** Name of this object, either the language-independent name for scripting
purposes or the localized name for display to user.

The language-independent name should be the same as the English version but
capitalized and with spaces and dashes replaced by underscore,
see {@link Util.toName} and
{@link ParametricPath.nameEquals}.

@param opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return name of this object
*/
getName(opt_localized?: boolean): string;

/** The starting value for `t` in the parameteric equation defining the path.
* @return starting value for `t`
*/
getStartTValue(): number;

/** Whether the path is a closed loop, ending at the same point it starts.
* @return whether the path is a closed loop
*/
isClosedLoop(): boolean;

/** Whether this ParametricPath has the given name, adjusting for the transformation to
a language-independent form of the name, as is done by
{@link Util.toName}.
@param name the English or language-independent version of the name
@return whether this ParametricPath has the given name (adjusted to
    language-independent form)
*/
nameEquals(name: string): boolean;

/** Returns the `x` value for the given value of `t` in the parametric equation.
* @param t the value of `t` in the parametric equation
* @return the `x` value for the given value of `t`
*/
x_func(t: number): number;

/** Returns the `y` value for the given value of `t` in the parametric equation.
* @param t the value of `t` in the parametric equation
* @return the `y` value for the given value of `t`
*/
y_func(t: number): number;

};
