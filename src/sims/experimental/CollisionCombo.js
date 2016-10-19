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

goog.provide('myphysicslab.sims.experimental.CollisionCombo');

goog.require('myphysicslab.sims.engine2D.MultipleCollisionApp');
goog.require('myphysicslab.sims.springs.CollideSpringApp');

/** This class exists only to compile MultipleCollisionApp and CollideSpringApp
* into a single compiled file.
* @constructor
* @final
* @struct
* @export
*/
myphysicslab.sims.experimental.CollisionCombo = function() {
};

goog.exportSymbol('myphysicslab.sims.engine2D.MultipleCollisionApp',
myphysicslab.sims.engine2D.MultipleCollisionApp);

goog.exportSymbol('myphysicslab.sims.springs.CollideSpringApp',
myphysicslab.sims.springs.CollideSpringApp);
