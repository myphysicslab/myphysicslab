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

goog.module('myphysicslab.lab.model.AbstractMassObject');

const array = goog.require('goog.array');
const AbstractSimObject = goog.require('myphysicslab.lab.model.AbstractSimObject');
const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const MassObject = goog.require('myphysicslab.lab.model.MassObject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Abstract class which implements most of the {@link MassObject} methods.

* @abstract
* @implements {MassObject}
*/
class AbstractMassObject extends AbstractSimObject {
/**
* @param {string=} opt_name name of this SimObject (optional)
* @param {string=} opt_localName localized name of this SimObject (optional)
*/
constructor(opt_name, opt_localName) {
  super(opt_name, opt_localName);
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

/** @override */
toString() {
  return Util.ADVANCED ? '' :
      super.toString().slice(0, -1)
      +', mass_: '+Util.NF(this.mass_)
      +', loc_world_: '+this.loc_world_
      +', angle_: '+this.angle_
      +', velocity_: '+this.velocity_
      +', angular_velocity_: '+Util.NF(this.angular_velocity_)
      +', cm_body_: '+this.cm_body_
      +', zeroEnergyLevel_: '+Util.NF(this.zeroEnergyLevel_)
      +', moment_: '+Util.NF(this.moment_)
      +', dragPts_: ['
      +this.dragPts_.map(p => p.toString())
      +']'
      +'}';
};

/** @override */
alignTo(p_body, p_world, opt_angle) {
  const angle = (opt_angle === undefined) ? this.angle_ : opt_angle;
  // vector from CM to target point
  const rx = p_body.getX() - this.cm_body_.getX();
  const ry = p_body.getY() - this.cm_body_.getY();
  // p_world says where p_body should wind up in world coords;
  // need to find where CM will wind up.
  // rotate the vector rx, ry by the angle, subtract from p_world;
  // this gives where CM will be.
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  this.setPosition(new Vector(p_world.getX() - (rx*cos - ry*sin),
              p_world.getY() - (rx*sin + ry*cos)), angle);
};

/** @override */
bodyToWorld(p_body) {
  const rx = p_body.getX() - this.cm_body_.getX();  // vector from cm to p_body
  const ry = p_body.getY() - this.cm_body_.getY();
  const vx = this.loc_world_.getX() + (rx*this.cosAngle_ - ry*this.sinAngle_);
  const vy = this.loc_world_.getY() + (rx*this.sinAngle_ + ry*this.cosAngle_);
  return new Vector(vx, vy);
};

/** @override */
bodyToWorldTransform() {
  // move to global sim position
  let at = new AffineTransform(1, 0, 0, 1, this.loc_world_.getX(),
    this.loc_world_.getY());
  at = at.rotate(this.angle_);  //  rotate by angle
  return at.translate(-this.cm_body_.getX(), -this.cm_body_.getY());
};

/** @abstract */
createCanvasPath(context) {};

/** @override */
getAngle() {
  return this.angle_;
};

/** @override */
getAngularVelocity() {
  return this.angular_velocity_;
};

/** @abstract */
getBottomBody() {};

/** @override */
getBottomWorld() {
  let min = Util.POSITIVE_INFINITY;
  this.getVerticesBody().forEach(v => {
    const p = this.bodyToWorld(v);
    if (p.getY() < min) {
      min = p.getY();
    }
  });
  return min;
};

/** @override */
getBoundsBody() {
  return new DoubleRect(this.getLeftBody(), this.getBottomBody(),
      this.getRightBody(), this.getTopBody());
};

/** @override */
getBoundsWorld() {
  return new DoubleRect(this.getLeftWorld(), this.getBottomWorld(),
      this.getRightWorld(), this.getTopWorld());
};

/** @override */
getCenterOfMassBody() {
  return this.cm_body_;
};

/** @abstract */
getCentroidBody() {};

/** @abstract */
getCentroidRadius() {};

/** @override */
getCentroidWorld() {
  return this.bodyToWorld(this.getCentroidBody());
};

/** @override */
getDragPoints() {
  return Array.from(this.dragPts_);
};

/** @override */
getHeight() {
  return this.getTopBody() - this.getBottomBody();
};

/** @override */
getKineticEnergy() {
  return this.translationalEnergy() + this.rotationalEnergy();
};

/** @abstract */
getLeftBody() {};

/** @override */
getLeftWorld() {
  let min = Util.POSITIVE_INFINITY;
  this.getVerticesBody().forEach(v => {
    const p = this.bodyToWorld(v);
    if (p.getX() < min) {
      min = p.getX();
    }
  });
  return min;
};

/** @override */
getMass() {
  return this.mass_;
};

/** @abstract */
getMinHeight() {};

/** @override */
getPosition() {
  return this.loc_world_;
};

/** @abstract */
getRightBody() {};

/** @override */
getRightWorld() {
  let max = Util.NEGATIVE_INFINITY;
  this.getVerticesBody().forEach(v => {
    const p = this.bodyToWorld(v);
    if (p.getX() > max) {
      max = p.getX();
    }
  });
  return max;
};

/** @abstract */
getTopBody() {};

/** @override */
getTopWorld() {
  let max = Util.NEGATIVE_INFINITY;
  this.getVerticesBody().forEach(v => {
    const p = this.bodyToWorld(v);
    if (p.getY() > max) {
      max = p.getY();
    }
  });
  return max;
};

/** @override */
getWidth() {
  return this.getRightBody() - this.getLeftBody();
};

/** @override */
getVelocity(p_body) {
  if (p_body !== undefined) {
    const r = this.rotateBodyToWorld(Vector.clone(p_body).subtract(this.cm_body_));
    return new Vector(this.velocity_.getX() - r.getY()*this.angular_velocity_,
        this.velocity_.getY() + r.getX()*this.angular_velocity_);
  } else {
    return this.velocity_;
  }
};

/** @abstract */
getVerticesBody() {};

/** @override */
getZeroEnergyLevel() {
  return this.zeroEnergyLevel_;
};

/** @override */
isMassObject() {
  return true;
};

/** @override */
momentAboutCM() {
  return this.mass_*this.moment_;
};

/** @override */
momentum() {
  const result = new Array(3);
  result[0] = this.mass_*this.velocity_.getX();
  result[1] = this.mass_*this.velocity_.getY();
  result[2] = this.momentAboutCM()*this.angular_velocity_
      + this.mass_*(this.loc_world_.getX()*this.velocity_.getY()
      - this.loc_world_.getY()*this.velocity_.getX());
  return result;
};

/** @override */
rotateBodyToWorld(v_body) {
  return Vector.clone(v_body).rotate(this.cosAngle_, this.sinAngle_);
};

/** @override */
rotateWorldToBody(v_world) {
  // rotate by -angle
  // note that cos(-a) = cos(a) and sin(-a) = -sin(a).
  return Vector.clone(v_world).rotate(this.cosAngle_, -this.sinAngle_);
};

/** @override */
rotationalEnergy() {
  return 0.5*this.momentAboutCM()*this.angular_velocity_*this.angular_velocity_;
};

/** @override */
setAngle(angle) {
  this.setPosition(this.loc_world_,  angle);
};

/** @override */
setAngularVelocity(angular_velocity) {
  if (!isFinite(angular_velocity)) {
    throw 'angular velocity must be finite '+angular_velocity;
  }
  this.angular_velocity_ = angular_velocity;
};

/** @override */
setCenterOfMass(x_body, y_body) {
  this.cm_body_ = new Vector(x_body, y_body);
  // NaN indicates that minimum height must be recalculated
  this.minHeight_ = Util.NaN;
};

/** @override */
setDragPoints(dragPts) {
  this.dragPts_ = Array.from(dragPts);
};

/** @override */
setMass(mass) {
  if (mass <= 0 || typeof mass !== 'number') {
    throw 'mass must be positive '+mass;
  }
  this.mass_ = mass;
  return this;
};

/** @override */
setMinHeight(minHeight) {
  this.minHeight_ = minHeight;
};

/** @override */
setMomentAboutCM(moment) {
  this.moment_ = moment;
};

/** @override */
setPosition(loc_world, angle) {
  this.loc_world_ = Vector.clone(loc_world);
  if (angle !== undefined && this.angle_ != angle) {
    this.angle_ = angle;
    this.sinAngle_ = Math.sin(angle);
    this.cosAngle_ = Math.cos(angle);
  }
};

/** @override */
setVelocity(velocity_world, angular_velocity) {
  this.velocity_ = Vector.clone(velocity_world);
  if (angular_velocity !== undefined) {
    this.setAngularVelocity(angular_velocity);
  }
};

/** @override */
setZeroEnergyLevel(height) {
  this.zeroEnergyLevel_ = height !== undefined ? height : this.loc_world_.getY();
  return this;
};

/** @override */
translationalEnergy() {
  return 0.5 * this.mass_ * this.velocity_.lengthSquared();
};

/** @override */
worldToBody(p_world) {
  // get the vector from cm (which is at x_world,y_world) to p_world
  const rx = p_world.getX() - this.loc_world_.getX();
  const ry = p_world.getY() - this.loc_world_.getY();
  const sin = -this.sinAngle_;
  const cos = this.cosAngle_;
  // add the reverse-rotated vector to the cm location (in body-coords)
  const vx = this.cm_body_.getX() + (rx*cos - ry*sin);
  const vy = this.cm_body_.getY() + (rx*sin + ry*cos);
  return new Vector(vx, vy);
};

} // end class
exports = AbstractMassObject;
