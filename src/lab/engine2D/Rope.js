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

goog.module('myphysicslab.lab.engine2D.Rope');

goog.require('goog.asserts');

const AbstractSimObject = goog.require('myphysicslab.lab.model.AbstractSimObject');
const Connector = goog.require('myphysicslab.lab.engine2D.Connector');
const ConnectorCollision = goog.require('myphysicslab.lab.engine2D.ConnectorCollision');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Line = goog.require('myphysicslab.lab.model.Line');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Rope connects two RigidBodys and limits the distance
between the two attachment points on the bodies. A Rope can either be
flexible so that the limit only occurs when it reaches its full length, or it
can be a rigid inextensible rod. A Rope generates collisions or contact
when the rope becomes tight. A flexible rope becomes tight when its length is close to
or exceeds its rest length. A rigid rod is always tight and so is always generating
collisions and contacts, similar to a Joint.

Ropes are immutable: they cannot be changed after they are constructed.

Rope uses 'curved edge physics' for calculating contact forces. See the paper [Curved
Edge Physics paper](CEP_Curved_Edge_Physics.pdf) by Erik Neumann. The objects attached to a
rope move in circles around each other, and so some extra contact force is needed to
prevent the rope from being stretched beyond its length. The same analysis as used for
curved edges applies here, except that we have the equivalent of two concave edges, so
the radius used is negative.

## align()

If this is an inextensible rod, then `align()` moves the bodies so that their attachment
points are exactly rest length apart. If this is a flexible rope, then `align()` moves
the bodies only if the distance is more than the rope's rest length (minus half of the
contact distance tolerance). Moves the second body to align with the first body,
maintaining the angle between them if possible.

* @implements {Connector}
* @implements {Line}
*/
class Rope extends AbstractSimObject {
/**
* @param {!RigidBody} body1  the first body; can be an
  immoveable object like Scrim or an infinite mass Polygon
* @param {!Vector} attach1_body attachment point in body coords
  for body1
* @param {!RigidBody} body2 the second body; must be moveable
  with finite mass
* @param {!Vector} attach2 attachment point in body coords for
  body2
* @param {number} length  the maximum length of the rope (or fixed length of rod)
* @param {number} ropeType  1 means rope, 2 means rod.
*/
constructor(body1, attach1_body, body2, attach2, length, ropeType) {
  super('rope'+(Rope.ropeNum++));
  if (!isFinite(body2.getMass())) {
    throw new Error('body2 must have finite mass');
  }
  /**
  @type {!RigidBody}
  @private
  */
  this.body1_ = body1;
  /**
  @type {!Vector}
  @private
  */
  this.attach1_body_ = attach1_body;
  /** second body
  @type {!RigidBody}
  @private
  */
  this.body2_ = body2;
  /**
  @type {!Vector}
  @private
  */
  this.attach2_body_ = attach2;
  /**
  * @type {number}
  * @private
  */
  this.restLength_ = length;
  /**
  @type {boolean}
  @private
  */
  this.rod_ = ropeType == Rope.ROD;
  /** One of the bodies can be a Scrim which has zero distance tolerance, so find the
  max distance tolerance of the bodies.
  @type {number}
  @private
  */
  this.distTol_ = Math.max(this.body1_.getDistanceTol(), this.body2_.getDistanceTol());
  /** One of the bodies can be a Scrim which has zero velocity tolerance, so find the
  max velocity tolerance of the bodies.
  @type {number}
  @private
  */
  this.veloTol_ = Math.max(this.body1_.getVelocityTol(), this.body2_.getVelocityTol());
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : super.toString().slice(0, -1)
      +', body1_:"'+this.body1_.getName()+'"'
      +', attach1_body: '+this.attach1_body_
      +', body2:"'+this.body2_.getName()+'"'
      +', attach2_body: '+this.attach2_body_
      +', restLength_: '+Util.NF(this.restLength_)
      +', rod: '+this.rod_
      +'}';
};

/** @override */
getClassName() {
  return 'Rope';
};

/** @override */
addCollision(collisions, time, accuracy) {
  var c = new ConnectorCollision(this.body1_, this.body2_, this, /*joint=*/this.rod_);
  this.updateCollision(c);
  c.setDetectedTime(time);
  if (this.rod_) {
    collisions.unshift(c);
  } else if (c.distance < this.distTol_) {
    collisions.unshift(c);
  }
};

/** @override */
align() {
  // Find the angle between the attachment points, then set the distance
  // between the two attachment points to be rest-length apart.
  var angle = -Math.PI/2;  // where 0 = 3 o'clock.
  var p1, p2, d, d2, len, len2;
  p1 = this.body1_.bodyToWorld(this.attach1_body_);
  p2 = this.body2_.bodyToWorld(this.attach2_body_);
  d = p2.subtract(p1);
  len = d.length();
  len2 = this.rod_ ? this.restLength_ :
      this.restLength_ - this.distTol_/2;
  if (!this.rod_ && len < len2)
    return;
  if (len > 0.01) {
    angle = Math.atan2(d.getY(), d.getX());
  }
  d2 = p1.add(new Vector(len2*Math.cos(angle), len2*Math.sin(angle)));
  this.body2_.alignTo(/*p_body=*/this.attach2_body_, /*p_world=*/d2);
};

/** @override */
getBody1() {
  return this.body1_;
};

/** @override */
getBody2() {
  return this.body2_;
};

/** @override */
getBoundsWorld() {
  return DoubleRect.make(this.getPosition1(), this.getPosition2());
};

/** @override */
getEndPoint() {
  return this.body2_.bodyToWorld(this.attach2_body_);
};

/** Returns the distance between end points of this spring
@return {number} the distance between end points of this spring
*/
getLength() {
  return this.getEndPoint().distanceTo(this.getStartPoint());
};

/** @override */
getNormalDistance() {
  return this.getLength();
};

/** @override */
getPosition1() {
  return this.body1_.bodyToWorld(this.attach1_body_);
};

/** @override */
getPosition2() {
  return this.body2_.bodyToWorld(this.attach2_body_);
};

/** Returns the maximum length of the rope (or fixed length of rod)
@return {number} the maximum length of the rope (or fixed length of rod)
*/
getRestLength() {
  return this.restLength_;
};

/** @override */
getStartPoint() {
  return this.body1_.bodyToWorld(this.attach1_body_);
};

/** Positive stretch means the rope is expanded, negative stretch means compressed.
@return {number} the amount that this line is stretched from its rest length
*/
getStretch() {
  return this.getLength() - this.restLength_;
};

/** @override */
getVector() {
  return this.getEndPoint().subtract(this.getStartPoint());
};

/** Returns `true` if the rope is tight, meaning its length is equal to its rest
length.
@return {boolean} `true` if the rope is tight
*/
isTight() {
  return this.rod_ ||
      this.getLength() > this.restLength_ - this.distTol_;
};

/** @override */
updateCollision(c) {
  if (c.primaryBody != this.body1_ || c.normalBody != this.body2_)
    throw new Error();
  if (c.getConnector() != this)
    throw new Error();
  // stretch = length - restLength
  c.distance = -this.getStretch();
  var normal = this.getVector().normalize();
  if (normal != null) {
    c.normal = normal;
  } else {
    throw new Error();
  }
  c.impact1 = this.body1_.bodyToWorld(this.attach1_body_);
  c.impact2 = this.body2_.bodyToWorld(this.attach2_body_);
  c.creator = Util.DEBUG ? 'Rope' : '';
  // Rope uses 'curved edge physics'.
  // Collisions generated by Rope identify as curved concave edges
  // with radius equal to the length of the rope.
  c.ballObject = true;
  c.radius1 = 0;
  c.ballNormal = true;
  // negative radius means concave
  if (this.rod_) {
    c.radius2 = -this.restLength_;
  } else {
    c.radius2 = -c.impact1.subtract(c.impact2).length();
  }
};

} // end class

/**
@type {number}
@const
*/
Rope.ROPE = 1;

/**
@type {number}
@const
*/
Rope.ROD = 2;

/** For naming objects.
@type {number}
@private
*/
Rope.ropeNum = 0;

exports = Rope;
