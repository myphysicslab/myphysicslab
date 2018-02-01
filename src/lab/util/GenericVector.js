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

goog.module('myphysicslab.lab.util.GenericVector');

/** Represents a point or vector in 3D space. Functions that take a vector parameter
should accept GenericVector so that many different types of vector can be provided.
* @interface
* */
class GenericVector {
/** Returns the X value of this GenericVector.
* @return {number} the X value of this GenericVector
*/
getX() {}

/** Returns the Y value of this GenericVector.
* @return {number} the Y value of this GenericVector
*/
getY() {}

/** Returns the Z value of this GenericVector.
* @return {number} the Z value of this GenericVector
*/
getZ() {}
} // end class
exports = GenericVector;
