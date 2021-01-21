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

goog.module('myphysicslab.sims.springs.SpringNonLinear');

const AbstractSimObject = goog.require('myphysicslab.lab.model.AbstractSimObject');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Force = goog.require('myphysicslab.lab.model.Force');
const ForceLaw = goog.require('myphysicslab.lab.model.ForceLaw');
const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const MassObject = goog.require('myphysicslab.lab.model.MassObject');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Represents a non-linear spring attached between two {@link MassObject}s, generates
a {@link Force} which depends on how the SpringNonLinear is stretched. Damping is
proportional to the relative velocity of the two objects.

The force equation is:
    f(x) = S(6*Math.pow(x,-1) - Math.pow(x/2, -3))
    x = distance between masses
    S = resisting force constant

The potential energy is the integral of the force:
    PE(x) = S(6 * Math.log(x) + 4*Math.pow(x, -2))

The minimum PE occurs where the force is zero:
    S(6*Math.pow(x,-1) = Math.pow(x/2, -3))
    6/x = 8 x^-3
    3/4 = x^-2
    x_min = sqrt(4/3) = 2/sqrt(3)

We subtract the minimum PE from the reported PE so that PE is zero at it's minimum.

To attach one end to a fixed point you can attach to an infinite mass MassObject or a
{@link myphysicslab.lab.engine2D.Scrim Scrim}.
*/
class SpringNonLinear extends Spring {
/**
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
*/
constructor(name, body1, attach1_body, body2, attach2_body, restLength, stiffness) {
  super(name, body1, attach1_body, body2, attach2_body, restLength, stiffness,
      /*compressOnly=*/false);
  /** minimum potential energy
  @type {number}
  */
  this.minPE_ = 0
  this.calcMinPE();
};

/** @override */
getClassName() {
  return 'SpringNonLinear';
};

/** @override */
calculateForces() {
  const point1 = this.getStartPoint();
  const point2 = this.getEndPoint();
  const body1 = this.getBody1();
  const body2 = this.getBody2();
  const v = point2.subtract(point1);
  const len = v.length();
  // force on body 1 is in direction of v
  const sf = -this.getStiffness() * (6*Math.pow(len,-1) - Math.pow(len/2, -3));
  // amount of force is proportional to stretch of spring
  // spring force is - stiffness * stretch
  //const sf = -this.stiffness_ * (len - this.restLength_);
  const fx = -sf * (v.getX() / len);
  const fy = -sf * (v.getY() / len);
  let f = new Vector(fx, fy, 0);
  if (this.getDamping() != 0) {
      const v1 = body1.getVelocity(this.getAttach1());
      const v2 = body2.getVelocity(this.getAttach2());
      const df = v1.subtract(v2).multiply(-this.getDamping());
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
getPotentialEnergy() {
  const len = this.getLength();
  return this.potentialEnergy(len) - this.minPE_;
};

/** Returns potential energy for a given length of spring.
@param {number} len length of spring
@return {number} potential energy
*/
potentialEnergy(len) {
  const S = this.getStiffness();
  return S * (6 * Math.log(len) + 4/(len*len));
};

/** Returns length of spring that has minimum potential energy.
@return {number} length of spring that has minimum potential energy
*/
minPELen() {
  return 2/Math.sqrt(3);
};

/** Calculate minimum potential energy.
@return {undefined}
*/
calcMinPE() {
  this.minPE_ = this.potentialEnergy(this.minPELen());
};

} // end class

exports = SpringNonLinear;
