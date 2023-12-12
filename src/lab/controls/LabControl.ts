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

import { Parameter } from '../util/Observe.js'
import { Printable } from '../util/Util.js'

/** A user interface control. */
export interface LabControl extends Printable {

/** Remove connections to other objects to facilitate garbage collection.
For example, stops listening for user interface events.
*/
disconnect(): void;

/** Returns the top level Element of this control. For example, this might be a
* label Element that encloses an input Element.
* @return the top level Element of this control
*/
getElement(): HTMLElement;

/** Returns the Parameter that this LabControl is connected to, if any.
* @return the Parameter that this LabControl is connected to, or `null`
*/
getParameter(): null|Parameter;

/** Enables or disables the control.
@param enabled  whether to enable the control
*/
setEnabled(enabled: boolean): void;

}
