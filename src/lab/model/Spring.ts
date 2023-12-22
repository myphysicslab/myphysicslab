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

import { AbstractSimObject, SimObject } from "./SimObject.js"
import { CoordType } from "./CoordType.js"
import { DoubleRect } from "../util/DoubleRect.js"
import { Force } from "./Force.js"
import { ForceLaw } from "./ForceLaw.js"
import { Line } from "./Line.js"
import { MassObject } from "./MassObject.js"
import { Util } from "../util/Util.js"
import { Vector, GenericVector } from "../util/Vector.js"

/** Represents a spring attached between two {@link MassObject}s,
generates a {@link Force} which depends on how the Spring is stretched.
Damping is proportional to the relative velocity of the two objects.

To attach one end to a fixed point you can attach to an infinite mass MassObject or a
{@link lab/engine2D/Scrim.Scrim | Scrim}.

## Compress-only mode

The `compressOnly` argument of the constructor sets the spring to *compress only mode*
which behaves normally if the spring is in compression (the length is less than the rest
length) but it temporarily disconnects from the second attachment point during extension
(when the length is more than rest length). During extension, the Spring's start point
is at the first attachment point on `body1`, but the end point is rest-length away from
start point in the direction of the second attachment point.

*/
export class Spring extends AbstractSimObject implements SimObject, Line, ForceLaw {
  /** body to attach point1 to */
  private body1_: MassObject;
  /** attachment point in body coords for body1 */
  private attach1_: Vector;
  /** body to attach point2 to */
  private body2_: MassObject;
  /** attachment point in body coords for body2 */
  private attach2_: Vector;
  private restLength_: number;
  private stiffness_: number;
  private damping_: number = 0;
  private compressOnly_: boolean;

/**
* @param name language-independent name of this object
* @param body1 body to attach to start point of the Spring
* @param attach1_body attachment point in body coords of body1
* @param body2 body to attach to end point of the Spring
* @param attach2_body attachment point in body coords of body2
* @param restLength length of spring when it has no force
* @param stiffness amount of force per unit distance of stretch
* @param compressOnly Sets the spring to 'compress only mode' which
*    behaves normally if the spring is in compression but disconnects
*    from the second attachment point during extension.
*/
constructor(name: string, body1: MassObject, attach1_body: GenericVector,
    body2: MassObject, attach2_body: GenericVector, restLength: number,
    stiffness?: number, compressOnly?: boolean) {
  super(name);
  this.body1_ = body1;
  this.attach1_ = Vector.clone(attach1_body);
  this.body2_ = body2;
  this.attach2_ = Vector.clone(attach2_body);
  this.restLength_ = restLength;
  this.stiffness_ = stiffness ?? 0;
  this.compressOnly_ = compressOnly ?? false;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', body1_:"'+this.body1_.getName()+'"'
      +', attach1_: '+this.attach1_
      +', body2_:"'+this.body2_.getName()+'"'
      +', attach2_: '+this.attach2_
      +', restLength_: '+Util.NF(this.restLength_)
      +', stiffness_: '+Util.NF(this.stiffness_)
      +', damping_: '+Util.NF(this.damping_)
      +', compressOnly_: '+this.compressOnly_
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'Spring';
};

/** @inheritDoc */
calculateForces(): Force[] {
  const point1 = this.getStartPoint();
  const point2 = this.getEndPoint();
  const v = point2.subtract(point1);
  const len = v.length();
  if (len < Vector.TINY_POSITIVE) {
    throw "zero spring length";
  };
  // force on body 1 is in direction of v
  // amount of force is proportional to stretch of spring
  // spring force is - stiffness * stretch
  const sf = -this.stiffness_ * (len - this.restLength_);
  const fx = -sf * (v.getX() / len);
  const fy = -sf * (v.getY() / len);
  let f = new Vector(fx, fy, 0);
  if (this.damping_ != 0) {
    // damping does not happen for 'compress only' when uncompressed
    if (!this.compressOnly_ || len < this.restLength_ - 1E-10) {
      const v1 = this.body1_.getVelocity(this.attach1_);
      const v2 = this.body2_.getVelocity(this.attach2_);
      const df = v1.subtract(v2).multiply(-this.damping_);
      f = f.add(df);
    }
  }
  return [ new Force('spring', this.body1_,
        /*location=*/point1, CoordType.WORLD,
        /*direction=*/f, CoordType.WORLD),
    new Force('spring', this.body2_,
        /*location=*/point2, CoordType.WORLD,
        /*direction=*/f.multiply(-1), CoordType.WORLD) ];
};

/** @inheritDoc */
disconnect(): void {
};

/** Returns attachment point for body 1, in body coordinates of body 1.
@return attachment point for body 1, in body coordinates of body 1.
*/
getAttach1(): Vector {
  return this.attach1_;
};

/** Returns attachment point for body 2, in body coordinates of body 2.
@return attachment point for body 2, in body coordinates of body 2.
*/
getAttach2(): Vector {
  return this.attach2_;
};

/** @inheritDoc */
getBodies(): MassObject[] {
  return [ this.body1_, this.body2_ ];  // include the spring also?
};

/** Returns the RigidBody that start point of the spring is attached to.
@return the RigidBody that start point of the spring is attached to.
*/
getBody1(): MassObject {
  return this.body1_;
};

/** Returns the RigidBody that end point of the spring is attached to.
@return the RigidBody that end point of the spring is attached to.
*/
getBody2(): MassObject {
  return this.body2_;
};

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  return DoubleRect.make(this.getStartPoint(), this.getEndPoint());
};

/** Returns the amount of damping for this spring. Damping is proportional to the
relative velocity of the two points.
@return amount of damping for this spring
*/
getDamping(): number {
  return this.damping_;
};

/** @inheritDoc */
getEndPoint(): Vector {
  if (this.attach2_ == null || this.body2_ == null) {
    throw '';
  }
  const p2 = this.body2_.bodyToWorld(this.attach2_);
  if (this.compressOnly_) {
    // 'compress only mode'
    const p1 = this.getStartPoint();
    const dist = p1.distanceTo(p2);
    const rlen = this.restLength_;
    if (dist <= rlen) {
      // spring is compressed, so it works as normal
      return p2;
    } else {
      // spring is not compressed, so the end is restLength from p1
      // in the direction towards p2.
      const n = p2.subtract(p1).normalize();
      return p1.add(n.multiply(rlen));
    }
  } else {
    return p2;
  }
};

/** Returns the distance between start and end points of this spring
@return the distance between start and end points of this spring
*/
getLength(): number {
  return this.getEndPoint().distanceTo(this.getStartPoint());
};

/** @inheritDoc */
getPotentialEnergy(): number {
  // spring potential energy = 0.5*stiffness*(stretch^2)
  const stretch = this.getStretch();
  return 0.5 * this.stiffness_ * stretch * stretch;
};

/** Returns the length of this spring when no force is applied.
@return rest length of this spring
*/
getRestLength(): number {
  return this.restLength_;
};

/** @inheritDoc */
getStartPoint(): Vector {
  if (this.attach1_ == null || this.body1_ == null)
    throw '';
  return this.body1_.bodyToWorld(this.attach1_) ;
};

/** Returns stiffness of this spring.
@return stiffness of this spring.
*/
getStiffness(): number {
  return this.stiffness_;
};

/** Positive stretch means the spring is expanded, negative stretch means compressed.
@return the amount that this line is stretched from its rest length
*/
getStretch(): number {
  return this.getLength() - this.restLength_;
};

/** @inheritDoc */
getVector(): Vector {
  return this.getEndPoint().subtract(this.getStartPoint());
};

/** Sets the value of damping for this spring. Damping is proportional to the relative
velocity of the two points.
@param damping the value of damping for this spring
@return this Spring to allow chaining of setters
*/
setDamping(damping: number): Spring {
  this.damping_ = damping
  this.setChanged();
  return this;
};

/** Sets the rest length of this spring, which is used for calculating the stretch.
When length of spring is the rest length, then no force is applied at either end.
@param value the rest length of this spring
*/
setRestLength(value: number): void {
  this.restLength_ = value;
  this.setChanged();
};

/** Sets stiffness of this spring
@param stiffness the stiffness of this spring
*/
setStiffness(stiffness: number): void {
  this.stiffness_ = stiffness;
  this.setChanged();
};

static LOADME = 'loadme';
}
Util.defineGlobal('lab$model$Spring', Spring);
