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

goog.module('myphysicslab.lab.model.Line');

const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Represents a directed line segment from starting point to ending point.
* @interface
*/
class Line extends SimObject {

/** Returns ending point of this line in world coords.
@return {!Vector} ending point of this line in world coords.
*/
getEndPoint() {}

/** Returns starting point of this line in world coords
@return {!Vector} starting point of this line in world coords.
*/
getStartPoint() {}

/** Returns the Vector from starting point to ending point.
@return {!Vector} the Vector from starting point to ending point.
*/
getVector() {}

} // end class
exports = Line;
