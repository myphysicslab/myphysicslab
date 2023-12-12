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

import { SimObject } from "./SimObject.js"
import { Vector } from "../util/Vector.js"

/** Represents a directed line segment from starting point to ending point.
*/
export interface Line extends SimObject {

/** Returns ending point of this line in world coords.
@return ending point of this line in world coords.
*/
getEndPoint(): Vector;

/** Returns starting point of this line in world coords
@return starting point of this line in world coords.
*/
getStartPoint(): Vector;

/** Returns the Vector from starting point to ending point.
@return the Vector from starting point to ending point.
*/
getVector(): Vector;

}
