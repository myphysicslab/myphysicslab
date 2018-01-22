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

goog.provide('myphysicslab.lab.model.AbstractMassObject');

goog.require('goog.array');
goog.require('myphysicslab.lab.model.AbstractSimObject');
goog.require('myphysicslab.lab.model.MassObject');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var AbstractSimObject = myphysicslab.lab.model.AbstractSimObject;
const AffineTransform = goog.module.get('myphysicslab.lab.util.AffineTransform');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const MassObject = goog.module.get('myphysicslab.lab.model.MassObject');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Abstract class which implements most of the {@link MassObject} methods.

* @param {string=} opt_name name of this SimObject (optional)
* @param {string=} opt_localName localized name of this SimObject (optional)
* @constructor
* @abstract
* @struct
* @extends {AbstractSimObject}
* @implements {MassObject}
*/
myphysicslab.lab.model.AbstractMassObject = function(opt_name, opt_localName) {
  AbstractSimObject.call(this, opt_name, opt_localName);
  /**
  * @type {number}
  * @protected
  */
  this.mass_ = 1;
  /**
  * @type {!Vector}
  * @protected
  */
  this.loc_world_ = Vector.ORIGIN;
  /**
  * @type {number}
  * @protected
  */
  this.angle_ = 0;
  /** sine of angle
  * @type {number}
  * @protected
  */
  this.sinAngle_ = 0.0;
  /** cosine of angle.
  * @type {number}
  * @protected
  */
  this.cosAngle_ = 1.0;
  /**
  * @type {!Vector}
  * @protected
  */
  this.velocity_ = Vector.ORIGIN;
  /** angular velocity about center of mass
  * @type {number}
  * @protected
  */
  this.angular_velocity_ = 0;
  /** center of mass in body coordinates
  * @type {!Vector}
  * @protected
  */
  this.cm_body_ = Vector.ORIGIN;
  /** the vertical coordinate where this body has zero potential energy; or null
  * to use the default zero energy level.
  * @type {?number}
  * @protected
  */
  this.zeroEnergyLevel_ = null;
  /**
  * @type {!Array<!Vector>}
  * @protected
  */
  this.dragPts_ = [Vector.ORIGIN];
  /** moment about center of mass divided by mass
  * @type {number}
  * @protected
  */
  this.moment_ = 0;
  /** the minimum value the vertical position of this body can take on,
  used in energy calculations
  * @type {number}
  * @protected
  */
  this.minHeight_ = Util.NaN;
};
var AbstractMassObject = myphysicslab.lab.model.AbstractMassObject;
goog.inherits(AbstractMassObject, AbstractSimObject);

/** @override */
AbstractMassObject.prototype.toString = function() {
  return Util.ADVANCED ? '' :
      AbstractMassObject.superClass_.toString.call(this).slice(0, -1)
      +', mass_: '+Util.NF(this.mass_)
      +', loc_world_: '+this.loc_world_
      +', angle_: '+this.angle_
      +', velocity_: '+this.velocity_
      +', angular_velocity_: '+Util.NF(this.angular_velocity_)
      +', cm_body_: '+this.cm_body_
      +', zeroEnergyLevel_: '+Util.NF(this.zeroEnergyLevel_)
      +', moment_: '+Util.NF(this.moment_)
      +'}';
};

/** @override */
AbstractMassObject.prototype.alignTo = function(p_body, p_world, opt_angle) {
  var angle = (opt_angle === undefined) ? this.angle_ : opt_angle;
  // vector from CM to target point
  var rx = p_body.getX() - this.cm_body_.getX();
  var ry = p_body.getY() - this.cm_body_.getY();
  // p_world says where p_body should wind up in world coords;
  // need to find where CM will wind up.
  // rotate the vector rx, ry by the angle, subtract from p_world;
  // this gives where CM will be.
  var sin = Math.sin(angle);
  var cos = Math.cos(angle);
  this.setPosition(new Vector(p_world.getX() - (rx*cos - ry*sin),
              p_world.getY() - (rx*sin + ry*cos)), angle);
};

/** @override */
AbstractMassObject.prototype.bodyToWorld = function(p_body) {
  var rx = p_body.getX() - this.cm_body_.getX();  // vector from cm to p_body
  var ry = p_body.getY() - this.cm_body_.getY();
  var vx = this.loc_world_.getX() + (rx*this.cosAngle_ - ry*this.sinAngle_);
  var vy = this.loc_world_.getY() + (rx*this.sinAngle_ + ry*this.cosAngle_);
  return new Vector(vx, vy);
};

/** @override */
AbstractMassObject.prototype.bodyToWorldTransform = function() {
  // move to global sim position
  var at = new AffineTransform(1, 0, 0, 1, this.loc_world_.getX(),
    this.loc_world_.getY());
  at = at.rotate(this.angle_);  //  rotate by angle
  return at.translate(-this.cm_body_.getX(), -this.cm_body_.getY());
};

/** @abstract */
AbstractMassObject.prototype.createCanvasPath = function(context) {};

/** @override */
AbstractMassObject.prototype.getAngle = function() {
  return this.angle_;
};

/** @override */
AbstractMassObject.prototype.getAngularVelocity = function() {
  return this.angular_velocity_;
};

/** @abstract */
AbstractMassObject.prototype.getBottomBody = function() {};

/** @override */
AbstractMassObject.prototype.getBottomWorld = function() {
  var min = Util.POSITIVE_INFINITY;
  goog.array.forEach(this.getVerticesBody(), function(v) {
    var p = this.bodyToWorld(v);
    if (p.getY() < min)
      min = p.getY();
  }, this);
  return min;
};

/** @override */
AbstractMassObject.prototype.getBoundsBody = function() {
  return new DoubleRect(this.getLeftBody(), this.getBottomBody(),
      this.getRightBody(), this.getTopBody());
};

/** @override */
AbstractMassObject.prototype.getBoundsWorld = function() {
  return new DoubleRect(this.getLeftWorld(), this.getBottomWorld(),
      this.getRightWorld(), this.getTopWorld());
};

/** @override */
AbstractMassObject.prototype.getCenterOfMassBody = function() {
  return this.cm_body_;
};

/** @abstract */
AbstractMassObject.prototype.getCentroidBody = function() {};

/** @abstract */
AbstractMassObject.prototype.getCentroidRadius = function() {};

/** @override */
AbstractMassObject.prototype.getCentroidWorld = function() {
  return this.bodyToWorld(this.getCentroidBody());
};

/** @override */
AbstractMassObject.prototype.getDragPoints = function() {
  return goog.array.clone(this.dragPts_);
};

/** @override */
AbstractMassObject.prototype.getHeight = function() {
  return this.getTopBody() - this.getBottomBody();
};

/** @override */
AbstractMassObject.prototype.getKineticEnergy = function() {
  return this.translationalEnergy() + this.rotationalEnergy();
};

/** @abstract */
AbstractMassObject.prototype.getLeftBody = function() {};

/** @override */
AbstractMassObject.prototype.getLeftWorld = function() {
  var min = Util.POSITIVE_INFINITY;
  goog.array.forEach(this.getVerticesBody(), function(v) {
    var p = this.bodyToWorld(v);
    if (p.getX() < min)
      min = p.getX();
  }, this);
  return min;
};

/** @override */
AbstractMassObject.prototype.getMass = function() {
  return this.mass_;
};

/** @abstract */
AbstractMassObject.prototype.getMinHeight = function() {};

/** @override */
AbstractMassObject.prototype.getPosition = function() {
  return this.loc_world_;
};

/** @abstract */
AbstractMassObject.prototype.getRightBody = function() {};

/** @override */
AbstractMassObject.prototype.getRightWorld = function() {
  var max = Util.NEGATIVE_INFINITY;
  goog.array.forEach(this.getVerticesBody(), function(v) {
    var p = this.bodyToWorld(v);
    if (p.getX() > max)
      max = p.getX();
  }, this);
  return max;
};

/** @abstract */
AbstractMassObject.prototype.getTopBody = function() {};

/** @override */
AbstractMassObject.prototype.getTopWorld = function() {
  var max = Util.NEGATIVE_INFINITY;
  goog.array.forEach(this.getVerticesBody(), function(v) {
    var p = this.bodyToWorld(v);
    if (p.getY() > max)
      max = p.getY();
  }, this);
  return max;
};

/** @override */
AbstractMassObject.prototype.getWidth = function() {
  return this.getRightBody() - this.getLeftBody();
};

/** @override */
AbstractMassObject.prototype.getVelocity = function(p_body) {
  if (goog.isDef(p_body)) {
    var r = this.rotateBodyToWorld(Vector.clone(p_body).subtract(this.cm_body_));
    return new Vector(this.velocity_.getX() - r.getY()*this.angular_velocity_,
                    this.velocity_.getY() + r.getX()*this.angular_velocity_);
  } else {
    return this.velocity_;
  }
};

/** @abstract */
AbstractMassObject.prototype.getVerticesBody = function() {};

/** @override */
AbstractMassObject.prototype.getZeroEnergyLevel = function() {
  return this.zeroEnergyLevel_;
};

/** @override */
AbstractMassObject.prototype.isMassObject = function() {
  return true;
};

/** @override */
AbstractMassObject.prototype.momentAboutCM = function() {
  return this.mass_*this.moment_;
};

/** @override */
AbstractMassObject.prototype.momentum = function() {
  var result = new Array(3);
  result[0] = this.mass_*this.velocity_.getX();
  result[1] = this.mass_*this.velocity_.getY();
  result[2] = this.momentAboutCM()*this.angular_velocity_
    + this.mass_*(this.loc_world_.getX()*this.velocity_.getY()
    - this.loc_world_.getY()*this.velocity_.getX());
  return result;
};

/** @override */
AbstractMassObject.prototype.rotateBodyToWorld = function(v_body) {
  return Vector.clone(v_body).rotate(this.cosAngle_, this.sinAngle_);
};

/** @override */
AbstractMassObject.prototype.rotateWorldToBody = function(v_world) {
  // rotate by -angle
  // note that cos(-a) = cos(a) and sin(-a) = -sin(a).
  return Vector.clone(v_world).rotate(this.cosAngle_, -this.sinAngle_);
};

/** @override */
AbstractMassObject.prototype.rotationalEnergy = function() {
  return 0.5*this.momentAboutCM()*this.angular_velocity_*this.angular_velocity_;
};

/** @override */
AbstractMassObject.prototype.setAngle = function(angle) {
  this.setPosition(this.loc_world_,  angle);
};

/** @override */
AbstractMassObject.prototype.setAngularVelocity = function(angular_velocity) {
  if (!isFinite(angular_velocity)) {
    throw new Error('angular velocity must be finite '+angular_velocity);
  }
  this.angular_velocity_ = angular_velocity;
};

/** @override */
AbstractMassObject.prototype.setCenterOfMass = function(x_body, y_body) {
  this.cm_body_ = new Vector(x_body, y_body);
  // NaN indicates that minimum height must be recalculated
  this.minHeight_ = Util.NaN;
};

/** @override */
AbstractMassObject.prototype.setDragPoints = function(dragPts) {
  this.dragPts_ = goog.array.clone(dragPts);
};

/** @override */
AbstractMassObject.prototype.setMass = function(mass) {
  if (mass <= 0 || !goog.isNumber(mass)) {
    throw new Error('mass must be positive '+mass);
  }
  this.mass_ = mass;
  return this;
};

/** @override */
AbstractMassObject.prototype.setMinHeight = function(minHeight) {
  this.minHeight_ = minHeight;
};

/** @override */
AbstractMassObject.prototype.setMomentAboutCM = function(moment) {
  this.moment_ = moment;
};

/** @override */
AbstractMassObject.prototype.setPosition = function(loc_world, angle) {
  this.loc_world_ = Vector.clone(loc_world);
  if (goog.isDef(angle) && this.angle_ != angle) {
    this.angle_ = angle;
    this.sinAngle_ = Math.sin(angle);
    this.cosAngle_ = Math.cos(angle);
  }
};

/** @override */
AbstractMassObject.prototype.setVelocity = function(velocity_world, angular_velocity) {
  this.velocity_ = Vector.clone(velocity_world);
  if (goog.isDef(angular_velocity)) {
    this.setAngularVelocity(angular_velocity);
  }
};

/** @override */
AbstractMassObject.prototype.setZeroEnergyLevel = function(height) {
  this.zeroEnergyLevel_ = goog.isDef(height) ? height :
    this.loc_world_.getY();
  return this;
};

/** @override */
AbstractMassObject.prototype.translationalEnergy = function() {
  return 0.5 * this.mass_ * this.velocity_.lengthSquared();
};

/** @override */
AbstractMassObject.prototype.worldToBody = function(p_world) {
  // get the vector from cm (which is at x_world,y_world) to p_world
  var rx = p_world.getX() - this.loc_world_.getX();
  var ry = p_world.getY() - this.loc_world_.getY();
  var sin = -this.sinAngle_;
  var cos = this.cosAngle_;
  // add the reverse-rotated vector to the cm location (in body-coords)
  var vx = this.cm_body_.getX() + (rx*cos - ry*sin);
  var vy = this.cm_body_.getY() + (rx*sin + ry*cos);
  return new Vector(vx, vy);
};

}); // goog.scope
