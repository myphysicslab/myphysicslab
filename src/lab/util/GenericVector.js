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

goog.provide('myphysicslab.lab.util.GenericVector');

/** Represents a point or vector in 3D space. This design allows mutable
and immutable vectors to interoperate because both are GenericVector's, and each accepts
only GenericVector for method arguments.

* @interface
* */
myphysicslab.lab.util.GenericVector = function() {};

/** Returns the X value of the GenericVector.
* @return {number} the X value of the GenericVector
*/
myphysicslab.lab.util.GenericVector.prototype.getX;

/** Returns the Y value of the GenericVector.
* @return {number} the Y value of the GenericVector
*/
myphysicslab.lab.util.GenericVector.prototype.getY;

/** Returns the Z value of the GenericVector.
* @return {number} the Z value of the GenericVector
*/
myphysicslab.lab.util.GenericVector.prototype.getZ;

/** Returns an immutable copy of this vector.  Might return itself if this is an
* immutable vector, otherwise makes a new immutable vector.
* @return {!myphysicslab.lab.util.Vector} an immutable copy of this vector
*/
myphysicslab.lab.util.GenericVector.prototype.immutable;

