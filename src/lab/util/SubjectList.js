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

goog.module('myphysicslab.lab.util.SubjectList');

const Printable = goog.require('myphysicslab.lab.util.Printable');
const Subject = goog.require('myphysicslab.lab.util.Subject');

/** Provides a list of {@link myphysicslab.lab.util.Subject Subjects} contained
in this object. Used when creating an
{@link myphysicslab.lab.util.EasyScriptParser EasyScriptParser}.

* @interface
*/
class SubjectList extends Printable {

/** Returns list of Subjects contained in this object, possibly including this object
itself.
@return {!Array<!myphysicslab.lab.util.Subject>} the Subjects contained in this object
*/
getSubjects() {}
} // end class
exports = SubjectList;
