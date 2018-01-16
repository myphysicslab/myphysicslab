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

goog.provide('myphysicslab.lab.engine2D.CollisionHandling');

goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Enum that specifies which collision handling algorithm to use during
{@link myphysicslab.lab.engine2D.ImpulseSim#handleCollisions}.

More information:

+ {@link myphysicslab.lab.engine2D.ImpulseSim}

+ {@link myphysicslab.lab.engine2D.ImpulseSim#setCollisionHandling}

+ [Multiple Simultaneous Collisions](Engine2D.html#multiplesimultaneouscollisions)


### SIMULTANEOUS

All collisions are solved in a single step, with the goal condition being that the
post-collision velocity is equal to elasticity times opposite of pre-collision velocity.

### HYBRID

Like SERIAL, this operates on one collision at a time, but for each collision it will
include any other collisions on either of the two bodies involved (for finite mass
bodies only), doing a simultaneous collision handling for that set of bodies. Any bodies
connected by joints are also included.

### SERIAL (4 flavors)

Operates on one 'focus' collision at a time, applying the impulse and then dealing with
any 'ricochet' effects as objects thereby collide into other objects. This happens
repeatedly in a tight loop (within the collision handling method) until all ricochets
die out and no objects are colliding. The focus collision is chosen randomly each time
thru the loop. This tends to produce the most realistic results.

There are four flavors of the SERIAL option, described below.

### SEPARATE vs. GROUPED

SERIAL_GROUPED treats **joints** connected to the focus collision together with the
focus collision (essentially a simultaneous collision handling for the group of current
collision + connected joints). SERIAL_SEPARATE allows us to see *how joints would
ricochet back and forth* because they are handled separately like any other collision.

The SERIAL_GROUPED option turns out to give the same results as SERIAL_SEPARATE and is
much faster. But SERIAL_SEPARATE lets us see that these two are equivalent by trying
each option (and especially by turning on the appropriate debug statements inside
handleCollisionsSerial).

### LASTPASS

The SERIAL_SEPARATE_LASTPASS and SERIAL_GROUPED_LASTPASS options turn on the *final
pass* in `handleCollisionsSerial` which does a *single simultaneous collision handling*
with zero elasticity to all remaining collisions.

The serial collision handling loop in `ImpulseSim.handleCollisionsSerial()` ends when
all the collisions have either been handled (and therefore have large positive velocity)
or have velocity is close to zero. The *last pass* ensures that the collisions with very
small negative velocity get a final small impulse so they are left with zero velocity.
This helps reduce 'jitter' at places that should have zero velocity like contact points
or joints.

* ***WARNING*** the zero elasticity used during LASTPASS results in a small amount of
  energy loss.

* Note that enum types do not appear correctly in the documentation, they appear
* as the underlying type (string, number, boolean) instead of the enum type.
* see [Dossier issue #32](https://github.com/jleyba/js-dossier/issues/32).
*
* @readonly
* @enum {string}
*/
myphysicslab.lab.engine2D.CollisionHandling = {
  /** Solve all collisions in a single step, with the goal condition being that the
  post-collision velocity is equal to elasticity times opposite of pre-collision
  velocity. */
  SIMULTANEOUS: 'simultaneous',
  /** Combination of simultaneous and serial collision handling; in each step, any
  collisions that involve the bodies in the focus collision are handled simultaneously.
  */
  HYBRID: 'hybrid',
  /** Handle one 'focus' collision at a time, but joints connected to the focus
  collision are solved simultaneously. */
  SERIAL_GROUPED: 'serial grouped',
  /** Handle one 'focus' collision at a time, but joints connected to the focus
  collision are solved simultaneously; also at the end of the process a final
  simultaneous collision handling with zero elasticity is done to eliminate velocity at
  contacts. */
  SERIAL_GROUPED_LASTPASS: 'serial grouped lastpass',
  /** Handle one 'focus' collision at a time. */
  SERIAL_SEPARATE: 'serial separate',
  /** Handle one 'focus' collision at a time; also at the end of the process a final
  simultaneous collision handling with zero elasticity is done to eliminate velocity at
  contacts. */
  SERIAL_SEPARATE_LASTPASS: 'serial separate lastpass'
};
var CollisionHandling = myphysicslab.lab.engine2D.CollisionHandling;

/** Converts a localized choice string to an enum.
* @param {string} value the localized choice string to convert
* @return {!CollisionHandling} the enum corresponding to the choice
* @throws {!Error} if the value does not represent a valid enum
*/
CollisionHandling.choiceToEnum = function(value) {
  var choices = CollisionHandling.getChoices();
  for (var i=0, len=choices.length; i<len; i++) {
    if (value == choices[i]) {
      return CollisionHandling.getValues()[i];
    }
  }
  throw new Error('not found '+value);
};

/** Converts an enum to a localized choice string.
* @param {!CollisionHandling} value enum value to convert
* @return {string} the localized choice string corresponding to the enum
* @throws {!Error} if the value does not represent a valid enum
*/
CollisionHandling.enumToChoice = function(value) {
  var vals = CollisionHandling.getValues();
  for (var i=0, len=vals.length; i<len; i++) {
    if (value === vals[i]) {
      return CollisionHandling.getChoices()[i];
    }
  }
  throw new Error('not found '+value);
};

/** Returns array containing all localized enum choices.
* @return {!Array<string>} array containing all localized enum choices.
*/
CollisionHandling.getChoices = function() {
  // no translations, just use values
  return CollisionHandling.getValues();
};

/** Returns array containing all possible enum values.
* @return {!Array<!CollisionHandling>} array containing all possible enum values.
*/
CollisionHandling.getValues = function() {
  return [
          CollisionHandling.SIMULTANEOUS,
          CollisionHandling.HYBRID,
          CollisionHandling.SERIAL_GROUPED,
          CollisionHandling.SERIAL_GROUPED_LASTPASS,
          CollisionHandling.SERIAL_SEPARATE,
          CollisionHandling.SERIAL_SEPARATE_LASTPASS
          ];
};

/** Converts a string to an enum.
* @param {string} value the string to convert
* @return {!CollisionHandling} the enum corresponding to the value
* @throws {!Error} if the value does not represent a valid enum
*/
CollisionHandling.stringToEnum = function(value) {
  var vals = CollisionHandling.getValues();
  for (var i=0, len=vals.length; i<len; i++) {
    if (value == vals[i]) {
      return vals[i];
    }
  }
  throw new Error('not found '+value);
};

}); // goog.scope
