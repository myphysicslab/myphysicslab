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

goog.provide('myphysicslab.lab.model.Path');

goog.require('myphysicslab.lab.model.PathIterator');
goog.require('myphysicslab.lab.model.SimObject');

/** A path of points.

* @interface
* @extends {myphysicslab.lab.model.SimObject}
*/
myphysicslab.lab.model.Path = function() {};

/** Returns an iterator over points in the Path.
* @param {number} numPoints desired number of points
* @return {!myphysicslab.lab.model.PathIterator} an iterator over points in the Path.
*/
myphysicslab.lab.model.Path.prototype.getIterator;

/** Returns a sequence number which changes when the Path changes.
* @return {number} sequence number which indicates when Path changes
*/
myphysicslab.lab.model.Path.prototype.getSequence;
