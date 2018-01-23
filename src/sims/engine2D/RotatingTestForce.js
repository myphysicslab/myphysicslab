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

goog.provide('myphysicslab.sims.engine2D.RotatingTestForce');

goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodySim');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ForceLaw');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const Force = goog.module.get('myphysicslab.lab.model.Force');
const ForceLaw = goog.module.get('myphysicslab.lab.model.ForceLaw');
const RigidBody = goog.module.get('myphysicslab.lab.engine2D.RigidBody');
const RigidBodySim = goog.module.get('myphysicslab.lab.engine2D.RigidBodySim');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** A ForceLaw that creates a Force whose direction rotates continuously.
* @param {!RigidBodySim} sim
* @param {!RigidBody} body
* @param {!Vector} location_body
* @param {number} magnitude
* @param {number} rotation_rate
* @constructor
* @final
* @struct
* @implements {ForceLaw}
*/
myphysicslab.sims.engine2D.RotatingTestForce = function(sim, body, location_body,
    magnitude, rotation_rate) {
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
var RotatingTestForce = myphysicslab.sims.engine2D.RotatingTestForce;

/** @override */
RotatingTestForce.prototype.toString = function() {
  return Util.ADVANCED ? '' : 'RotatingTestForce{body: "'+this.body_.getName()+'"}';
};

/** @override */
RotatingTestForce.prototype.toStringShort = function() {
  return Util.ADVANCED ? '' : 'RotatingTestForce{body: "'+this.body_.getName()+'"}';
};

/** @override */
RotatingTestForce.prototype.disconnect = function() {
};

/** @override */
RotatingTestForce.prototype.getBodies = function() {
  return [this.body_];
};

/** @override */
RotatingTestForce.prototype.calculateForces = function() {
  var t = this.rotation_rate_ * this.sim_.getTime();
  var direction_body = new Vector(this.magnitude_*Math.cos(t),
    this.magnitude_*Math.sin(t));
  var f = new Force('rotating', this.body_,
      /*location=*/this.location_body_, CoordType.BODY,
      /*direction=*/direction_body, CoordType.BODY);
  return [f];
};

/** @override */
RotatingTestForce.prototype.getPotentialEnergy = function() {
  return 0;
};

}); // goog.scope
