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

goog.module('myphysicslab.lab.model.CoordType');

/** Enum that specifies whether a {@link myphysicslab.lab.util.Vector} is
in body or world coordinates. See [Body Coordinates](Engine2D.html#bodycoordinates)
in 2D Physics Engine Overview and {@link myphysicslab.lab.model.MassObject}.

* @readonly
* @enum {number}
*/
const CoordType = {
  /** Specifies that a Vector is in body coordinates */
  BODY: 0,
  /** Specifies that a Vector is in world coordinates */
  WORLD: 1
};
exports = CoordType;
