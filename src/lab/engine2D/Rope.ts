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

import { AbstractSimObject, SimObject } from '../model/SimObject.js';
import { ConnectorCollision } from './ConnectorCollision.js';
import { DoubleRect } from '../util/DoubleRect.js';
import { Line } from '../model/Line.js';
import { RigidBody } from './RigidBody.js';
import { RigidBodyCollision, Connector } from './RigidBody.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** Rope connects two RigidBodys and limits the distance
between the two attachment points on the bodies. A Rope can either be
flexible so that the limit only occurs when it reaches its full length, or it
can be a rigid inextensible rod. A Rope generates collisions or contact
when the rope becomes tight. A flexible rope becomes tight when its length is close to
or exceeds its rest length. A rigid rod is always tight and so is always generating
collisions and contacts, similar to a Joint.

Ropes are immutable: they cannot be changed after they are constructed.

Rope uses 'curved edge physics' for calculating contact forces. See the paper
[Curved Edge Physics](../CEP_Curved_Edge_Physics.pdf) by Erik Neumann. The
objects attached to a rope move in circles around each other, and so some extra contact
force is needed to prevent the rope from being stretched beyond its length. The same
analysis as used for curved edges applies here, except that we have the equivalent of
two concave edges, so the radius used is negative.

## align()

If this is an inextensible rod, then `align()` moves the bodies so that their attachment
points are exactly rest length apart. If this is a flexible rope, then `align()` moves
the bodies only if the distance is more than the rope's rest length (minus half of the
contact distance tolerance). Moves the second body to align with the first body,
maintaining the angle between them if possible.
*/
export class Rope extends AbstractSimObject implements SimObject, Line, Connector {
  private body1_: RigidBody;
  private attach1_body_: Vector;
  /** second body */
  private body2_: RigidBody;
  private attach2_body_: Vector;
  private restLength_: number;
  private rod_: boolean;
  /** One of the bodies can be a Scrim which has zero distance tolerance, so find the
  * max distance tolerance of the bodies.
  */
  private distTol_: number;
  /** One of the bodies can be a Scrim which has zero velocity tolerance, so find the
  * max velocity tolerance of the bodies.
  */
  private veloTol_: number;

/**
* @param body1 the first body; can be an immoveable object like Scrim or an infinite
*     mass Polygon
* @param attach1_body attachment point in body coords for body1
* @param body2 the second body; must be moveable with finite mass
* @param attach2 attachment point in body coords for body2
* @param length  the maximum length of the rope (or fixed length of rod)
* @param ropeType  1 means rope, 2 means rod.
*/
constructor(body1: RigidBody, attach1_body: Vector, body2: RigidBody, attach2: Vector, length: number, ropeType: number) {
  super('rope'+(Rope.ropeNum++));
  if (!isFinite(body2.getMass())) {
    throw 'body2 must have finite mass';
  }
  this.body1_ = body1;
  this.attach1_body_ = attach1_body;
  this.body2_ = body2;
  this.attach2_body_ = attach2;
  this.restLength_ = length;
  this.rod_ = ropeType == Rope.ROD;
  this.distTol_ = Math.max(this.body1_.getDistanceTol(), this.body2_.getDistanceTol());
  this.veloTol_ = Math.max(this.body1_.getVelocityTol(), this.body2_.getVelocityTol());
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', body1_:"'+this.body1_.getName()+'"'
      +', attach1_body: '+this.attach1_body_
      +', body2:"'+this.body2_.getName()+'"'
      +', attach2_body: '+this.attach2_body_
      +', restLength_: '+Util.NF(this.restLength_)
      +', rod: '+this.rod_
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'Rope';
};

/** @inheritDoc */
addCollision(collisions: RigidBodyCollision[], time: number, _accuracy: number): void {
  const c = new ConnectorCollision(this.body1_, this.body2_, this, /*joint=*/this.rod_);
  this.updateCollision(c);
  c.setDetectedTime(time);
  if (this.rod_) {
    collisions.unshift(c);
  } else if (c.distance < this.distTol_) {
    collisions.unshift(c);
  }
};

/** @inheritDoc */
align(): void {
  // Find the angle between the attachment points, then set the distance
  // between the two attachment points to be rest-length apart.
  let angle = -Math.PI/2;  // where 0 = 3 o'clock.
  const p1 = this.body1_.bodyToWorld(this.attach1_body_);
  const p2 = this.body2_.bodyToWorld(this.attach2_body_);
  const d = p2.subtract(p1);
  const len = d.length();
  const len2 = this.rod_ ? this.restLength_ : this.restLength_ - this.distTol_/2;
  if (!this.rod_ && len < len2) {
    return;
  }
  if (len > 0.01) {
    angle = Math.atan2(d.getY(), d.getX());
  }
  const d2 = p1.add(new Vector(len2*Math.cos(angle), len2*Math.sin(angle)));
  this.body2_.alignTo(/*p_body=*/this.attach2_body_, /*p_world=*/d2);
  this.setChanged();
};

/** @inheritDoc */
getBody1(): RigidBody {
  return this.body1_;
};

/** @inheritDoc */
getBody2(): RigidBody {
  return this.body2_;
};

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  return DoubleRect.make(this.getPosition1(), this.getPosition2());
};

/** @inheritDoc */
getEndPoint(): Vector {
  return this.body2_.bodyToWorld(this.attach2_body_);
};

/** Returns the distance between end points of this spring
@return the distance between end points of this spring
*/
getLength(): number {
  return this.getEndPoint().distanceTo(this.getStartPoint());
};

/** @inheritDoc */
getNormalDistance(): number {
  return this.getLength();
};

/** @inheritDoc */
getPosition1(): Vector {
  return this.body1_.bodyToWorld(this.attach1_body_);
};

/** @inheritDoc */
getPosition2(): Vector {
  return this.body2_.bodyToWorld(this.attach2_body_);
};

/** Returns the maximum length of the rope (or fixed length of rod)
@return the maximum length of the rope (or fixed length of rod)
*/
getRestLength(): number {
  return this.restLength_;
};

/** @inheritDoc */
getStartPoint(): Vector {
  return this.body1_.bodyToWorld(this.attach1_body_);
};

/** Positive stretch means the rope is expanded, negative stretch means compressed.
@return the amount that this line is stretched from its rest length
*/
getStretch(): number {
  return this.getLength() - this.restLength_;
};

/** @inheritDoc */
getVector(): Vector {
  return this.getEndPoint().subtract(this.getStartPoint());
};

/** Returns `true` if the rope is tight, meaning its length is equal to its rest
length.
@return `true` if the rope is tight
*/
isTight(): boolean {
  return this.rod_ ||
      this.getLength() > this.restLength_ - this.distTol_;
};

/** @inheritDoc */
updateCollision(c: RigidBodyCollision): void {
  if (c.primaryBody != this.body1_ || c.normalBody != this.body2_)
    throw '';
  if (c.getConnector() != this)
    throw '';
  // stretch = length - restLength
  c.distance = -this.getStretch();
  const normal = this.getVector().normalize();
  if (normal != null) {
    c.normal = normal;
  } else {
    throw '';
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

/** For naming objects.*/
static ropeNum = 0;

static readonly ROPE = 1;
static readonly ROD = 2;

} // end class

Util.defineGlobal('lab$engine2D$Rope', Rope);
