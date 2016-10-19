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

goog.provide('myphysicslab.lab.controls.LabControl');

goog.require('myphysicslab.lab.util.Printable');

/** Manages a user interface control.

* @interface
* @extends myphysicslab.lab.util.Printable
*/
myphysicslab.lab.controls.LabControl = function() {};

/** Remove connections to other objects to facilitate garbage collection.
For example, stops listening for user interface events.
* @return {undefined}
*/
myphysicslab.lab.controls.LabControl.prototype.disconnect;

/** Returns the top level Element of this control. For example, this might be a
label element that encloses the control.
* @return {!Element} the top level Element of this control
*/
myphysicslab.lab.controls.LabControl.prototype.getElement;

/** Returns the Parameter that this LabControl is connected to, if any.
* @return {?myphysicslab.lab.util.Parameter} the Parameter that this LabControl
*    is connected to, or null
*/
myphysicslab.lab.controls.LabControl.prototype.getParameter;

/** Enables or disables the control.
@param {boolean} enabled  whether to enable the control
*/
myphysicslab.lab.controls.LabControl.prototype.setEnabled;
