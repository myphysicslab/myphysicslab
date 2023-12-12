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

import { Util, Printable } from '../util/Util.js'

/** Solves an ordinary differential equation expressed as an
{@link lab/model/ODESim.ODESim} by advancing it in small time increments.
The differential equation is specified by the ODESim's
{@link lab/model/ODESim.ODESim.evaluate} method.

*/
export interface DiffEqSolver extends Printable {

/** Name of this object, either the language-independent name for scripting
purposes or the localized name for display to user.

The language-independent name should be the same as the English version but
capitalized and with spaces and dashes replaced by underscore,
see {@link Util.toName}
and {@link DiffEqSolver.nameEquals}.

@param opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return name of this object
*/
getName(opt_localized?: boolean): string;

/** Whether this DiffEqSolver has the given name, adjusting for the transformation to a
language-independent form of the name, as is done by
{@link Util.toName}.
@param name the English or language-independent version of the name
@return whether this DiffEqSolver has the given name (adjusted to
    language-independent form)
*/
nameEquals(name: string): boolean;

/** Advances the associated ODESim by the given small time increment, which results in
modifiying the state variables of the ODESim. Modifies the variables array obtained from
{@link lab/model/ODESim.ODESim.getVarsList} by using the change rates obtained
from {@link lab/model/ODESim.ODESim.evaluate}.
@param stepSize  the amount of time to advance the differential equation
@return null if the step succeeds, otherwise an object
relating to the error that occurred
*/
step(stepSize: number): null|object;

} // end class
