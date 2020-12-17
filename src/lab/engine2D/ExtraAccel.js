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

goog.module('myphysicslab.lab.engine2D.ExtraAccel');

/** Specifies the calculation done by {@link myphysicslab.lab.engine2D.ContactSim} to
determine the extra acceleration added to eliminate small amount of residual velocity
at a contact. This is part of the process of finding the force needed at the contact.

If no extra acceleration is added, then objects will jiggle around when they should be
at rest because contact forces are calculated only to eliminate acceleration at contact
points, not velocity. The objects keep moving because of the slight residual velocity
that exists when the contact is first detected. Eventually this residual velocity
results in a low-velocity collision or a loss of contact.

See {@link myphysicslab.lab.util.GenericObserver} for a way to observe the effects
of the various ExtraAccel settings by coloring the display of contact forces
based on the gap distance at each contact.

More information:

+ 'Extra Acceleration' in {@link myphysicslab.lab.engine2D.ContactSim}
+ [How to Stop Jitter](Engine2D.html#howtostopjitter) in the 2D Physics Engine Overview
+ 'Distance and Target Gap' in {@link myphysicslab.lab.engine2D.RigidBodyCollision}.

* Note that enum types do not appear correctly in the documentation, they appear
* as the underlying type (string, number, boolean) instead of the enum type.
* see [Dossier issue #32](https://github.com/jleyba/js-dossier/issues/32).
*
* @readonly
* @enum {string}
*/
const ExtraAccel = {
    /** No extra acceleration.
    */
  NONE: 'none',
    /** Extra acceleration is applied to reduce the velocity at the contact to zero. A
    contact that is getting closer will get slightly more force applied to it; a contact
    that is separating will get slightly less force applied to it. The velocity is
    brought to zero fairly rapidly, over a few time steps. The final contact distance
    can be anywhere within the range of the distance tolerance.
    */
  VELOCITY: 'velocity',
    /** Extra acceleration is applied to reduce the velocity at the contact to zero, and
    also to to bring the contact distance to be at the *target gap* distance.
    */
  VELOCITY_AND_DISTANCE: 'velocity_and_distance',
    /** Same as {@link #VELOCITY} but also applies the extra acceleration to Joints */
  VELOCITY_JOINTS: 'velocity_joints',
    /** Same as {@link #VELOCITY_AND_DISTANCE} but also applies the extra acceleration
    to Joints */
  VELOCITY_AND_DISTANCE_JOINTS: 'velocity_and_distance_joints'
};

/** Converts a localized choice string to an enum.
* @param {string} value the localized choice string to convert
* @return {!ExtraAccel} the enum corresponding to the choice
* @throws {!Error} if the value does not represent a valid enum
*/
ExtraAccel.choiceToEnum = function(value) {
  var choices = ExtraAccel.getChoices();
  for (var i=0, len=choices.length; i<len; i++) {
    if (value == choices[i]) {
      return ExtraAccel.getValues()[i];
    }
  }
  throw 'ExtraAccel not found '+value;
};

/** Converts an enum to a localized choice string.
* @param {!ExtraAccel} value enum value to convert
* @return {string} the localized choice string corresponding to the enum
* @throws {!Error} if the value does not represent a valid enum
*/
ExtraAccel.enumToChoice = function(value) {
  var vals = ExtraAccel.getValues();
  for (var i=0, len=vals.length; i<len; i++) {
    if (value === vals[i]) {
      return ExtraAccel.getChoices()[i];
    }
  }
  throw 'not found '+value;
};

/** Returns the translated string versions of the enums in {@link #getValues}.
* @return {!Array<string>} the translated string versions of the enums
*/
ExtraAccel.getChoices = function() {
  return [ExtraAccel.i18n.NONE,
      ExtraAccel.i18n.VELOCITY,
      ExtraAccel.i18n.VELOCITY_AND_DISTANCE,
      ExtraAccel.i18n.VELOCITY_JOINTS,
      ExtraAccel.i18n.VELOCITY_AND_DISTANCE_JOINTS];
};

/** Returns the set of valid enums.
* @return {!Array<!ExtraAccel>} the set of valid enums.
*/
ExtraAccel.getValues = function() {
  return [
    ExtraAccel.NONE,
    ExtraAccel.VELOCITY,
    ExtraAccel.VELOCITY_AND_DISTANCE,
    ExtraAccel.VELOCITY_JOINTS,
    ExtraAccel.VELOCITY_AND_DISTANCE_JOINTS
  ];
};

/** Converts a string to an enum.
* @param {string} value the string to convert
* @return {!ExtraAccel} the enum corresponding to the value
* @throws {!Error} if the value does not represent a valid enum
*/
ExtraAccel.stringToEnum = function(value) {
  var vals = ExtraAccel.getValues();
  for (var i=0, len=vals.length; i<len; i++) {
    if (value === vals[i]) {
      return vals[i];
    }
  }
  throw 'not found '+value;
};

/** Set of internationalized strings.
@typedef {{
  NONE: string,
  VELOCITY: string,
  VELOCITY_AND_DISTANCE: string,
  VELOCITY_JOINTS: string,
  VELOCITY_AND_DISTANCE_JOINTS: string
  }}
*/
ExtraAccel.i18n_strings;

/**
@type {ExtraAccel.i18n_strings}
*/
ExtraAccel.en = {
  NONE: 'none',
  VELOCITY: 'velocity',
  VELOCITY_AND_DISTANCE: 'velocity+distance',
  VELOCITY_JOINTS: 'velocity (also joints)',
  VELOCITY_AND_DISTANCE_JOINTS: 'velocity+distance (also joints)'
};

/**
@private
@type {ExtraAccel.i18n_strings}
*/
ExtraAccel.de_strings = {
  NONE: 'keine',
  VELOCITY: 'Geschwindigkeit',
  VELOCITY_AND_DISTANCE: 'Geschwindigkeit+Entfernung',
  VELOCITY_JOINTS: 'Geschwindigkeit (auch Verbindungsglied)',
  VELOCITY_AND_DISTANCE_JOINTS: 'Geschwindigkeit+Entfernung (auch Verbindungsglied)'
};

/** Set of internationalized strings.
@type {ExtraAccel.i18n_strings}
*/
ExtraAccel.i18n = goog.LOCALE === 'de' ? ExtraAccel.de_strings :
    ExtraAccel.en;

exports = ExtraAccel;
