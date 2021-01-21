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

goog.module('myphysicslab.sims.engine2D.RotatingTestForce');

const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const Force = goog.require('myphysicslab.lab.model.Force');
const ForceLaw = goog.require('myphysicslab.lab.model.ForceLaw');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** A ForceLaw that creates a Force whose direction rotates continuously.
* @implements {ForceLaw}
*/
class RotatingTestForce {
/**
* @param {!RigidBodySim} sim
* @param {!RigidBody} body
* @param {!Vector} location_body
* @param {number} magnitude
* @param {number} rotation_rate
*/
constructor(sim, body, location_body, magnitude, rotation_rate) {
  /**
  * @type {!RigidBodySim}
  * @private
  */
  this.sim_ = sim;
  /**
  * @type {!RigidBody}
  * @private
  */
  this.body_ = body;
  /**
  * @type {!Vector}
  * @private
  */
  this.location_body_ = location_body;
  /**
  * @type {number}
  * @private
  */
  this.magnitude_ = magnitude;
  /**
  * @type {number}
  * @private
  */
  this.rotation_rate_ = rotation_rate;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'RotatingTestForce{body: "'+this.body_.getName()+'"}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'RotatingTestForce{body: "'+this.body_.getName()+'"}';
};

/** @override */
disconnect() {
};

/** @override */
getBodies() {
  return [this.body_];
};

/** @override */
calculateForces() {
  const t = this.rotation_rate_ * this.sim_.getTime();
  const direction_body = new Vector(this.magnitude_*Math.cos(t),
    this.magnitude_*Math.sin(t));
  const f = new Force('rotating', this.body_,
      /*location=*/this.location_body_, CoordType.BODY,
      /*direction=*/direction_body, CoordType.BODY);
  return [f];
};

/** @override */
getPotentialEnergy() {
  return 0;
};

} // end class

exports = RotatingTestForce;
