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

goog.module('myphysicslab.lab.model.PathIterator');

const MutableVector = goog.require('myphysicslab.lab.util.MutableVector');

/** An iterator over points in a {@link myphysicslab.lab.model.Path}.
@interface
*/
class PathIterator {

/** Sets the given MutableVector to the location of the next point on the path.
* @param {!myphysicslab.lab.util.MutableVector} point the MutableVector where the
*   location is stored.
* @return {boolean} true if a next point was found
*/
nextPoint(point) {}

} // end class
exports = PathIterator;
