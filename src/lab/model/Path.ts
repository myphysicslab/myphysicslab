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

import { SimObject } from './SimObject.js';
import { MutableVector } from '../util/MutableVector.js';

/** A set of connected points that form a (possibly curved) line.
*/
export interface Path extends SimObject {

/** Returns an iterator over points in the Path.
* @param numPoints desired number of points
* @return an iterator over points in the Path.
*/
getIterator(numPoints: number): PathIterator;

/** Returns a sequence number which changes when the Path changes.
* @return sequence number which indicates when Path changes
*/
getSequence(): number;

};


/** An iterator over points in a {@link Path}.
*/
export interface PathIterator {

/** Sets the given MutableVector to the location of the next point on the path.
* @param point the MutableVector where the location is stored
* @return true if a next point was found
*/
nextPoint(point: MutableVector): boolean;

};
