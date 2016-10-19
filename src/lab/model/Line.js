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

goog.provide('myphysicslab.lab.model.Line');

goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var SimObject = myphysicslab.lab.model.SimObject;

/** Represents a directed line segment from starting point to ending point.

* @interface
* @extends {myphysicslab.lab.model.SimObject}
*/
myphysicslab.lab.model.Line = function() {};

var Line = myphysicslab.lab.model.Line;

/** Returns ending point of this line in world coords.
@return {!myphysicslab.lab.util.Vector} ending point of this line in world coords.
*/
Line.prototype.getEndPoint;

/** Returns starting point of this line in world coords
@return {!myphysicslab.lab.util.Vector} starting point of this line in world coords.
*/
Line.prototype.getStartPoint;

/** Returns the Vector from starting point to ending point.
@return {!myphysicslab.lab.util.Vector} the Vector from starting point to ending point.
*/
Line.prototype.getVector;

}); // goog.scope
