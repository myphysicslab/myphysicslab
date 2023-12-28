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

import { Util } from "../util/Util.js"

/** Specifies the calculation done by
{@link lab/engine2D/ContactSim.ContactSim | ContactSim} to
determine the extra acceleration added to eliminate small amount of residual velocity
at a contact. This is part of the process of finding the force needed at the contact.

If no extra acceleration is added, then objects will jiggle around when they should be
at rest because contact forces are calculated only to eliminate acceleration at contact
points, not velocity. The objects keep moving because of the slight residual velocity
that exists when the contact is first detected. Eventually this residual velocity
results in a low-velocity collision or a loss of contact.

See {@link lab/util/Observe.GenericObserver | GenericObserver} for a way to observe the
effects of the various ExtraAccel settings by coloring the display of contact forces
based on the gap distance at each contact.

More information:

+ [Extra Acceleration](../classes/lab_engine2D_ContactSim.ContactSim.html#md:extra-acceleration)
    in ContactSim
+ [How to Stop Jitter](../Engine2D.html#howtostopjitter) in the 2D Physics Engine Overview
+ [Target Gap](../classes/lab_engine2D_RigidBody.RigidBodyCollision.html#md:target-gap)
    in {@link lab/engine2D/RigidBody.RigidBodyCollision | RigidBodyCollision}.
*/
export const enum ExtraAccel {
    /** No extra acceleration.
    */
  NONE = 'none',
    /** Extra acceleration is applied to reduce the velocity at the contact to zero. A
    contact that is getting closer will get slightly more force applied to it; a
    contact that is separating will get slightly less force applied to it. The velocity
    is brought to zero fairly rapidly, over a few time steps. The final contact
    distance can be anywhere within the range of the distance tolerance.
    */
  VELOCITY = 'velocity',
    /** Extra acceleration is applied to reduce the velocity at the contact to zero,
    and also to to bring the contact distance to be at the *target gap* distance.
    */
  VELOCITY_AND_DISTANCE = 'velocity_and_distance',
    /** Same as {@link VELOCITY} but also applies the extra acceleration
    to Joints
    */
  VELOCITY_JOINTS = 'velocity_joints',
    /** Same as {@link VELOCITY_AND_DISTANCE} but also applies the extra
    acceleration to Joints
    */
  VELOCITY_AND_DISTANCE_JOINTS = 'velocity_and_distance_joints',
};

/** returns array of all {@link ExtraAccel} values */
export function ExtraAccelValues(): ExtraAccel[] {
  return   [
    ExtraAccel.NONE,
    ExtraAccel.VELOCITY,
    ExtraAccel.VELOCITY_AND_DISTANCE,
    ExtraAccel.VELOCITY_JOINTS,
    ExtraAccel.VELOCITY_AND_DISTANCE_JOINTS,
  ];
};

/** returns array of all {@link ExtraAccel} enums translated to localized strings. */
export function ExtraAccelChoices(): string[] {
  return [
    i18n.NONE,
    i18n.VELOCITY,
    i18n.VELOCITY_AND_DISTANCE,
    i18n.VELOCITY_JOINTS,
    i18n.VELOCITY_AND_DISTANCE_JOINTS,
  ];
};

type i18n_strings = {
  NONE: string,
  VELOCITY: string,
  VELOCITY_AND_DISTANCE: string,
  VELOCITY_JOINTS: string,
  VELOCITY_AND_DISTANCE_JOINTS: string
};

const en_strings: i18n_strings = {
  NONE: 'none',
  VELOCITY: 'velocity',
  VELOCITY_AND_DISTANCE: 'velocity+distance',
  VELOCITY_JOINTS: 'velocity (also joints)',
  VELOCITY_AND_DISTANCE_JOINTS: 'velocity+distance (also joints)'
};

const de_strings: i18n_strings = {
  NONE: 'keine',
  VELOCITY: 'Geschwindigkeit',
  VELOCITY_AND_DISTANCE: 'Geschwindigkeit+Entfernung',
  VELOCITY_JOINTS: 'Geschwindigkeit (auch Verbindungsglied)',
  VELOCITY_AND_DISTANCE_JOINTS: 'Geschwindigkeit+Entfernung (auch Verbindungsglied)'
};

const i18n = Util.LOCALE === 'de' ? de_strings : en_strings;
