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

goog.module('myphysicslab.sims.roller.HasPath');

const NumericalPath = goog.require('myphysicslab.lab.model.NumericalPath');
const Printable = goog.require('myphysicslab.lab.util.Printable');

/** An object which has a {@link NumericalPath} that can be set.
* @interface
*/
class HasPath extends Printable {

/** Returns the NumericalPath for this object.
* @return {?NumericalPath} the NumericalPath used
*       by this object, or null if no path is set
*/
getPath() {}

/** Sets the NumericalPath for this object.
* @param {!NumericalPath} path the NumericalPath to be used
*       by this object
*/
setPath(path) {}

} //end class

exports = HasPath;
