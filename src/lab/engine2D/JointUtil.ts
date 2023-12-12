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

import { ContactSim } from './ContactSim.js';
import { CoordType } from '../model/CoordType.js';
import { Joint } from './Joint.js';
import { RigidBody } from './RigidBody.js';
import { Scrim } from './Scrim.js';
import { Vector } from '../util/Vector.js';
import { Util } from '../util/Util.js';

/** Utility functions for creating Joints. */
export class JointUtil {

constructor() {
  throw '';
};

/** Creates a single Joint to attach a RigidBody to a fixed point on the singleton
{@link Scrim}, at the current world position of the attachment point.
See {@link Scrim.getScrim}.
@param sim the ContactSim to which the Joint is added
@param body the RigidBody to add joints to
@param attach_body the point to place the Joint in body coordinates
@param normalType whether the normal should be in body or world coords
@param normal the normal Vector that determines the direction of the Joint
@return the Joint that is created
*/
static addSingleFixedJoint(sim: ContactSim, body: RigidBody, attach_body: Vector, normalType: CoordType, normal: Vector): Joint {
  return JointUtil.addSingleJoint(sim,
      Scrim.getScrim(), body.bodyToWorld(attach_body),
      body, attach_body,
      normalType, normal);
};

/** Creates a single Joint to attach two RigidBodys. The second body is moved to align
with the first body, see {@link Joint.align}.
@param sim the ContactSim to which the Joint is added
@param body1 the first RigidBody
@param attach1_body the attachment point on `body1`, in body coordinates
@param body2 the second RigidBody
@param attach2_body the attachment point on body2 in body coordinates
@param normalType whether the normal is in body or world coords
@param normal the normal Vector that determines the direction of the Joint
@return the Joint that is created
*/
static addSingleJoint(sim: ContactSim, body1: RigidBody, attach1_body: Vector, body2: RigidBody, attach2_body: Vector, normalType: CoordType, normal: Vector): Joint {
  const j1 = new Joint(
      body1, attach1_body,
      body2, attach2_body,
      normalType, normal);
  sim.addConnector(j1);
  j1.align();
  return j1;
};

/** Creates two Joints with perpendicular normals to attach a RigidBody to a fixed
point on the singleton {@link Scrim}, at the current world position
of the attachment point. See {@link Scrim.getScrim}.
@param sim the ContactSim to which the Joint is added
@param body the RigidBody to add joints to
@param attach_body the point on the RigidBody to place the joints, in body coordinates
@param normalType whether the normal should be in body or world coords
*/
static attachFixedPoint(sim: ContactSim, body: RigidBody, attach_body: Vector, normalType: CoordType) {
  JointUtil.attachRigidBody(sim,
      Scrim.getScrim(), body.bodyToWorld(attach_body),
      body, attach_body,
      normalType);
};

/** Creates two Joints with perpendicular normals to attach two RigidBodys. The second
body is moved to align with the first body, see
{@link Joint.align}. The normal vectors are `(0, 1)` and `(1, 0)`,
in either body coordinates or world coordinates as specified by the CoordType.
@param sim the ContactSim to which the Joint is added
@param body1 the first RigidBody
@param attach1_body the attachment point on `body1`, in body coordinates
@param body2 the second RigidBody
@param attach2_body the attachment point on `body2`, in body coordinates
@param normalType whether the normal should be in body or world coords
*/
static attachRigidBody(sim: ContactSim, body1: RigidBody, attach1_body: Vector, body2: RigidBody, attach2_body: Vector, normalType: CoordType) {
  JointUtil.addSingleJoint(sim,
      body1, attach1_body,
      body2, attach2_body,
      normalType, Vector.NORTH);
  JointUtil.addSingleJoint(sim,
      body1, attach1_body,
      body2, attach2_body,
      normalType, Vector.EAST);
};

} // end class
Util.defineGlobal('lab$engine2D$JointUtil', JointUtil);
