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

goog.provide('myphysicslab.sims.springs.SpringNonLinear2');

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
a {@link Force} which depends on how the SpringNonLinear2 is stretched and the masses. Damping is
proportional to the relative velocity of the two objects.

The force equation is:
    f(x) = G*m1*m2*Math.pow(x,-2)-S*Math.pow(x, -3)
    x = distance between masses
    G = attractive force constant
    m1 = mass of body 1
    m2 = mass of body 2
    S = resisting force constant

The potential energy is the integral of the force:
    PE(x) = -G*m1*m2*Math.pow(x,-1) + (S/2)*Math.pow(x, -2)

The minimum PE occurs where the force is zero:
    G*m1*m2*Math.pow(x,-2) = S*Math.pow(x, -3)
    x_min = S/(G*m1*m2)
    PE(x_min) = (6/S)*(G*m1*m2)^2

We subtract that minimum PE from the reported PE so that PE is zero at it's minimum.

To attach one end to a fixed point you can attach to an infinite mass MassObject or a
{@link myphysicslab.lab.engine2D.Scrim Scrim}.

* @param {string} name language-independent name of this object
* @param {!MassObject} body1 body to attach to start point of the
*    SpringNonLinear2
* @param {!GenericVector} attach1_body attachment point in body
*    coords of body1
* @param {!MassObject} body2 body to attach to end point of the
*    SpringNonLinear2
* @param {!GenericVector} attach2_body attachment point in body
*    coords of body2
* @param {number} restLength length of spring when it has no force
* @param {number=} stiffness strength of resisting force (default is 8)
* @param {number=} attract attract force constant (default is 6)
* @constructor
* @final
* @struct
* @extends {Spring}
*/
myphysicslab.sims.springs.SpringNonLinear2 = function(name, body1, attach1_body,
      body2, attach2_body, restLength, stiffness, attract) {
  stiffness = stiffness === undefined ? 8 : stiffness;
  Spring.call(this, name, body1, attach1_body, body2, attach2_body, restLength,
      stiffness, /*compressOnly=*/false);
  /**
  * @type {number}
  * @private
  */
  this.attract_ = attract === undefined ? 6 : attract;
  /** minimum potential energy
  @type {number}
  */
  this.minPE_ = 0
  this.calcMinPE();
};
var SpringNonLinear2 = myphysicslab.sims.springs.SpringNonLinear2;
goog.inherits(SpringNonLinear2, Spring);

/** @override */
SpringNonLinear2.prototype.getClassName = function() {
  return 'SpringNonLinear2';
};

/** @override */
SpringNonLinear2.prototype.calculateForces = function() {
  var point1 = this.getStartPoint();
  var point2 = this.getEndPoint();
  var v = point2.subtract(point1);
  var len = v.length();
  var body1 = this.getBody1();
  var body2 = this.getBody2();
  var m1 = body1.getMass();
  var m2 = body2.getMass();
  var S = this.getStiffness();
  var G = this.attract_;
  // force on body 1 is in direction of v
  var sf = G*m1*m2/(len*len) - S*Math.pow(len, -3)
  var fx = sf * (v.getX() / len);
  var fy = sf * (v.getY() / len);
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
SpringNonLinear2.prototype.getPotentialEnergy = function() {
  var len = this.getLength();
  return this.potentialEnergy(len) - this.minPE_;
};

/** Returns potential energy for a given length of spring.
@param {number} len length of spring
@return {number} potential energy
*/
SpringNonLinear2.prototype.potentialEnergy = function(len) {
  var m1 = this.getBody1().getMass();
  var m2 = this.getBody2().getMass();
  var S = this.getStiffness();
  var G = this.attract_;
  return -G*m1*m2/len + (S/2)/(len*len);
};

/** Returns length of spring that has minimum potential energy.
@return {number} length of spring that has minimum potential energy
*/
SpringNonLinear2.prototype.minPELen = function() {
  var m1 = this.getBody1().getMass();
  var m2 = this.getBody2().getMass();
  var S = this.getStiffness();
  var G = this.attract_;
  return S/(G*m1*m2);
};

/** Calculate minimum potential energy.
@return {undefined}
*/
SpringNonLinear2.prototype.calcMinPE = function() {
  this.minPE_ = this.potentialEnergy(this.minPELen());
};

/** @override */
SpringNonLinear2.prototype.setStiffness = function(stiffness) {
  SpringNonLinear2.superClass_.setStiffness.call(this, stiffness);
  this.calcMinPE();
  return this;
};

/** Returns attract force constant of this spring.
@return {number} attract force strength of this spring.
*/
SpringNonLinear2.prototype.getAttract = function() {
  return this.attract_;
};

/** Sets attract force constant of this spring
@param {number} attract the attract force constant of this spring
@return {!Spring} this Spring to allow chaining of setters
*/
SpringNonLinear2.prototype.setAttract = function(attract) {
  this.attract_ = attract;
  this.calcMinPE();
  return this;
};

}); // goog.scope
