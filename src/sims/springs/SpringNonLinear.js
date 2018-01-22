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

goog.provide('myphysicslab.sims.springs.SpringNonLinear');

goog.require('myphysicslab.lab.model.AbstractSimObject');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ForceLaw');
goog.require('myphysicslab.lab.model.MassObject');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericVector');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

const AbstractSimObject = goog.module.get('myphysicslab.lab.model.AbstractSimObject');
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const Force = goog.module.get('myphysicslab.lab.model.Force');
const ForceLaw = goog.module.get('myphysicslab.lab.model.ForceLaw');
const GenericVector = goog.module.get('myphysicslab.lab.util.GenericVector');
const MassObject = goog.module.get('myphysicslab.lab.model.MassObject');
var Spring = myphysicslab.lab.model.Spring;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Represents a non-linear spring attached between two {@link MassObject}s, generates
a {@link Force} which depends on how the SpringNonLinear is stretched. Damping is
proportional to the relative velocity of the two objects.

To attach one end to a fixed point you can attach to an infinite mass MassObject or a
{@link myphysicslab.lab.engine2D.Scrim Scrim}.

* @param {string} name language-independent name of this object
* @param {!MassObject} body1 body to attach to start point of the
*    SpringNonLinear
* @param {!GenericVector} attach1_body attachment point in body
*    coords of body1
* @param {!MassObject} body2 body to attach to end point of the
*    SpringNonLinear
* @param {!GenericVector} attach2_body attachment point in body
*    coords of body2
* @param {number} restLength length of spring when it has no force
* @param {number=} stiffness amount of force per unit distance of stretch
* @constructor
* @final
* @struct
* @extends {Spring}
*/
myphysicslab.sims.springs.SpringNonLinear = function(name, body1, attach1_body,
      body2, attach2_body, restLength, stiffness) {
  Spring.call(this, name, body1, attach1_body, body2, attach2_body, restLength,
      stiffness, /*compressOnly=*/false);
  var minLen = 2/Math.sqrt(3);
  /** minimum potential energy
  @type {number}
  @const
  */
  this.minPE_ = (6 * Math.log(minLen) + 4/(minLen*minLen));
};
var SpringNonLinear = myphysicslab.sims.springs.SpringNonLinear;
goog.inherits(SpringNonLinear, Spring);

/** @override */
SpringNonLinear.prototype.getClassName = function() {
  return 'SpringNonLinear';
};

/** @override */
SpringNonLinear.prototype.calculateForces = function() {
  var point1 = this.getStartPoint();
  var point2 = this.getEndPoint();
  var body1 = this.getBody1();
  var body2 = this.getBody2();
  var v = point2.subtract(point1);
  var len = v.length();
  // force on body 1 is in direction of v
  var sf = -this.getStiffness() * (6*Math.pow(len,-1) - Math.pow(len/2, -3));
  // amount of force is proportional to stretch of spring
  // spring force is - stiffness * stretch
  //var sf = -this.stiffness_ * (len - this.restLength_);
  var fx = -sf * (v.getX() / len);
  var fy = -sf * (v.getY() / len);
  var f = new Vector(fx, fy, 0);
  if (this.getDamping() != 0) {
      var v1 = body1.getVelocity(this.getAttach1());
      var v2 = body2.getVelocity(this.getAttach2());
      var df = v1.subtract(v2).multiply(-this.getDamping());
      f = f.add(df);
  }
  return [ new Force('spring', body1,
        /*location=*/point1, CoordType.WORLD,
        /*direction=*/f, CoordType.WORLD),
    new Force('spring', body2,
        /*location=*/point2, CoordType.WORLD,
        /*direction=*/f.multiply(-1), CoordType.WORLD) ];
};

/** @override */
SpringNonLinear.prototype.getPotentialEnergy = function() {
  // The graph of potential energy reaches a minimum where force is zero.
  // Find the offset so that potential energy is zero when force is zero.
  // force = 0 = -k (6/x - 8 x^-3)
  // 6/x = 8 x^-3
  // 6/8 = x^-2
  // x^2 = 4/3
  // x = sqrt(4/3) = 2/sqrt(3)
  // offset is minPE_ = PE(2/sqrt(3))

  // spring potential energy is integral of force
  var len = this.getLength();
  return this.getStiffness() * (6 * Math.log(len) + 4/(len*len) - this.minPE_);
};

}); // goog.scope
