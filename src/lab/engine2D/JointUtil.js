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

goog.module('myphysicslab.lab.engine2D.JointUtil');

const asserts = goog.require('goog.asserts');

const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const Joint = goog.require('myphysicslab.lab.engine2D.Joint');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const Scrim = goog.require('myphysicslab.lab.engine2D.Scrim');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Utility functions for creating Joints.
*/
class JointUtil {
/**
@private
*/
constructor() {
  throw '';
};

/** Creates a single Joint to attach a RigidBody to a fixed point on the singleton
{@link Scrim}, at the current world position of the attachment point.
See {@link Scrim#getScrim}.
@param {!ContactSim} sim the ContactSim to which the Joint is added
@param {!RigidBody} body the RigidBody to add joints to
@param {!Vector} attach_body the point to place the Joint in body coordinates
@param {!CoordType} normalType whether the normal should be in
    body or world coords, from {@link CoordType}.
@param {!Vector} normal the normal Vector that determines the direction of the Joint
@return {!Joint} the Joint that is created
*/
static addSingleFixedJoint(sim, body, attach_body, normalType, normal) {
  return JointUtil.addSingleJoint(sim,
      Scrim.getScrim(), body.bodyToWorld(attach_body),
      body, attach_body,
      normalType, normal);
};

/** Creates a single Joint to attach two RigidBodys. The second body is moved to align
with the first body, see {@link #align}.
@param {!ContactSim} sim the ContactSim to which the Joint is added
@param {!RigidBody} body1 the first RigidBody
@param {!Vector} attach1_body the attachment point on `body1`, in body coordinates
@param {!RigidBody} body2 the second RigidBody
@param {!Vector} attach2_body the attachment point on body2 in body coordinates
@param {!CoordType} normalType whether the normal is in body or
    world coords, from {@link CoordType}.
@param {!Vector} normal the normal Vector that determines the direction of the Joint
@return {!Joint} the Joint that is created
*/
static addSingleJoint(sim, body1, attach1_body, body2, attach2_body, normalType, normal) {
  var j1 = new Joint(
      body1, attach1_body,
      body2, attach2_body,
      normalType, normal);
  sim.addConnector(j1);
  j1.align();
  return j1;
};

/** Creates two Joints with perpendicular normals to attach a RigidBody to a fixed
point on the singleton {@link Scrim}, at the current world position of the attachment
point. See {@link Scrim#getScrim}.
@param {!ContactSim} sim the ContactSim to which the Joint is added
@param {!RigidBody} body the RigidBody to add joints to
@param {!Vector} attach_body the point on the RigidBody to place
    the joints, in body coordinates
@param {!CoordType} normalType whether the normal should be in
    body or world coords, from {@link CoordType}.
*/
static attachFixedPoint(sim, body, attach_body, normalType) {
  JointUtil.attachRigidBody(sim,
      Scrim.getScrim(), body.bodyToWorld(attach_body),
      body, attach_body,
      normalType);
};

/** Creates two Joints with perpendicular normals to attach two RigidBodys. The second
body is moved to align with the first body, see {@link #align}. The normal vectors are
`(0, 1)` and `(1, 0)`, in either body coordinates or world coordinates as specified by
the CoordType.
@param {!ContactSim} sim the ContactSim to which the Joint is
    added
@param {!RigidBody} body1 the first RigidBody
@param {!Vector} attach1_body the attachment point on `body1`, in body coordinates
@param {!RigidBody} body2 the second RigidBody
@param {!Vector} attach2_body the attachment point on `body2`, in body coordinates
@param {!CoordType} normalType whether the normal should be in
    body or world coords, from {@link CoordType}.
*/
static attachRigidBody(sim, body1, attach1_body, body2, attach2_body, normalType) {
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
exports = JointUtil;
