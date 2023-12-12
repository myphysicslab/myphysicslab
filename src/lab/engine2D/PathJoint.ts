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
import { CoordType } from '../model/CoordType.js';
import { DoubleRect } from '../util/DoubleRect.js';
import { NumericalPath } from '../model/NumericalPath.js';
import { PathPoint } from '../model/PathPoint.js';
import { RigidBody } from './RigidBody.js';
import { RigidBodyCollision, Connector } from './RigidBody.js';
import { Scrim } from './Scrim.js';
//import { UtilEngine } from './UtilEngine.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** Represents a bilateral contact point between a {@link RigidBody}
and a {@link NumericalPath}.

*Bilateral* means that force can be applied to push or pull in the
direction of the normal for the contact (in contrast to a contact force which can only
push and never pull). The normal vector is determined by the NumericalPath. The normal
vector specifies the direction along which the PathJoint operates: forces are calculated
(by the engine2D physics engine) to keep the distance in the normal direction at zero
between the two attachment points of the PathJoint.

A PathJoint is immutable: it cannot be changed after it is constructed.

A single PathJoint by itself will give a 'sliding track' type of connection. The
attachment points must have zero distance between them as measured in the direction of
the normal for the PathJoint, but in the direction *orthogonal to the normal* the
attachment points are free to move.

Note that some slippage of a PathJoint can occur over time, especially
when there is very fast rotation.
*/
export class PathJoint extends AbstractSimObject implements SimObject, Connector {
  private body_: RigidBody;
  /** path that joint is attached to */
  private path_: NumericalPath;
  /** attachment point in body coords of this.body_ */
  private attach_body_: Vector;
  /** last position along the path */
  private ppt_: PathPoint;

/**
@param path the path to connect
@param body the RigidBody to connect
@param attach_body the attachment point on the RigidBody in body coordinates
*/
constructor(path: NumericalPath, body: RigidBody, attach_body: Vector) {
  super('PathJoint'+(PathJoint.nextJointNum++));
  this.body_ = body;
  this.path_ = path;
  this.attach_body_ = attach_body;
  this.ppt_ = new PathPoint();
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', body_:='+this.body_.toStringShort()
      +', path_: '+this.path_.toStringShort()
      +', attach_body_: '+this.attach_body_
      +', ppt_: '+this.ppt_
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'PathJoint';
};

/** @inheritDoc */
addCollision(collisions: RigidBodyCollision[], time: number, _accuracy: number): void {
  const c = new ConnectorCollision(this.body_, Scrim.getScrim(), this, /*joint=*/true);
  this.updateCollision(c);
  c.setDetectedTime(time);
  /*if (0 == 1 && Util.DEBUG && UtilEngine.debugEngine2D != null) {
    UtilEngine.debugEngine2D.myPrint('joint collision '+c);
    // show the normal vector at the joint
    UtilEngine.debugEngine2D.debugLine('normal', c.impact1, c.impact1.add(c.normal));
    UtilEngine.debugEngine2D.myPrint('joint dist='+Util.NFE(c.distance)
      +' normalVelocity='+Util.NFE(c.getNormalVelocity())+' '+c);
    if (Math.abs(c.distance) > 1E-12)
      UtilEngine.debugEngine2D.myPrint('joint '+this.getName()
        +' is loose dist='+Util.NFE(c.distance)+' '+c);
  }*/
  collisions.unshift(c);
};

/** @inheritDoc */
align(): void {
  // Move the body so the attach point is on the path.
  // Find current world position of attachment point.
  const attach_world = this.body_.bodyToWorld(this.attach_body_);
  // find nearest point on path to current position of attachment point
  this.ppt_ = this.path_.findNearestGlobal(attach_world);
  this.path_.map_p_to_slope(this.ppt_);
  // move body to align over that point
  this.body_.alignTo(this.attach_body_, this.ppt_);
};

/** Aligns two attachment points on the body to be on the path.
@param b2 the second attachment point on the RigidBody in body coordinates
*/
align2(b2: Vector): void {
  const b1 = this.attach_body_;
  const x = b1.distanceTo(b2);
  // calculate angle beta of vector b1 - b2
  const beta = b1.subtract(b2).getAngle();
  // align b1 with path
  this.align();
  const p1 = this.body_.bodyToWorld(this.attach_body_);
  // find point on path nearest to b2
  let p2 = this.body_.bodyToWorld(b2);
  const ppt = this.path_.findNearestGlobal(p2);
  p2 = new Vector(ppt.x, ppt.y);
  // find point on path that is distance x away from p1.  Start with p2.
  p2 = this.path_.findPointByDistance(p1, p2, x);
  // calculate angle alpha of vector p1 - p2
  const alpha = p1.subtract(p2).getAngle();
  // calculate angle theta so that points on body b1, b2 align over p1, p2
  const theta = alpha - beta;
  // set body to that angle, but keep b1, p1 aligned
  this.body_.alignTo(b1, p1, theta);
};

/** Returns the attachment point on the RigidBody in body coordinates.
@return the attachment point on the RigidBody in body coordinates
*/
getAttach1(): Vector {
  return this.attach_body_;
};

/** @inheritDoc */
getBody1(): RigidBody {
  return this.body_;
};

/** @inheritDoc */
getBody2(): RigidBody {
  return Scrim.getScrim();
};

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  return DoubleRect.make(this.getPosition1(), this.getPosition2());
};

/** @inheritDoc */
getNormalDistance(): number {
  const collisions: RigidBodyCollision[] = [];
  this.addCollision(collisions, /*time=*/NaN, /*accuracy=*/NaN);
  return collisions[0].getDistance();
};

/** Returns the NumericalPath to which this PathJoint attaches the RigidBody.
@return the NumericalPath to which this PathJoint attaches the RigidBody.
*/
getPath(): NumericalPath {
  return this.path_;
};

/** Returns the PathPoint corresponding to the most recent position of this PathJoint's
attachment point on the NumericalPath.
@return the PathPoint corresponding to the most recent position of
    this PathJoint's attachment point on the NumericalPath.
*/
getPathPoint(): PathPoint {
  return this.ppt_;
};

/** @inheritDoc */
getPosition1(): Vector {
  return this.body_.bodyToWorld(this.attach_body_);
};

/** @inheritDoc */
getPosition2(): Vector {
  return this.getPosition1();
};

/** @inheritDoc */
updateCollision(c: RigidBodyCollision): void {
  if (c.primaryBody != this.body_ || c.normalBody != Scrim.getScrim()) {
    throw '';
  }
  if (c.getConnector() != this) {
    throw '';
  }
  const impact_world = this.body_.bodyToWorld(this.attach_body_);
  c.impact1 = impact_world;
  // find slope at nearest point on path to current position of attachment point
  this.path_.findNearestLocal(impact_world, this.ppt_);
  this.path_.map_p_to_slope(this.ppt_);
  Util.assert(!isNaN(this.ppt_.slope));
  // Detect if the joint has moved past the end of the path.
  if (!this.path_.isClosedLoop()) {
    // If on the path, then the normal at the point on curve should intersect
    // the impact point, and so the distance to the normal line should be zero.
    const d = this.ppt_.distanceToNormalLine(impact_world);
    if (d > 1E-4) {
      // Probably off end of path, so set normal derivative to zero.
      // This makes it so that the path effectively extends in a straight
      // line past the ends.
      this.ppt_.normalXdp = 0;
      this.ppt_.normalYdp = 0;
    }
  }
  const normal_world = this.ppt_.getNormal();
  // Find the current velocity in direction of the slope
  const attachVelocity = this.body_.getVelocity(this.attach_body_);
  // slope vector is a unit vector tangent at point, in direction of increasing p
  const slopeVector = new Vector(this.ppt_.slopeX, this.ppt_.slopeY);
  Util.assert( Math.abs(slopeVector.lengthSquared() - 1.0) < 1E-10);
  const pathVelocity = attachVelocity.dotProduct(slopeVector);
  /*if (0 == 1 && Util.DEBUG && UtilEngine.debugEngine2D != null) {
    // show visually the velocity vector of the attachment point
    const pv = slopeVector.multiply(pathVelocity);
    UtilEngine.debugEngine2D.debugLine(this.getName(), c.impact1, c.impact1.add(pv));
  }*/
  c.normal_dt = new Vector(this.ppt_.normalXdp * pathVelocity,
       this.ppt_.normalYdp * pathVelocity);
  c.normalFixed = false;
  // Radius of curvature is expensive to calculate and not needed here
  // because we already know the derivative of the normal, which is what
  // the radius is used for.
  c.radius2 = NaN;
  c.ballNormal = true;
  c.impact2 = this.ppt_.getPosition();
  c.normal = normal_world;
  // offset = how far apart the joint is, ideally zero
  const offset = c.impact1.subtract(c.impact2);
  c.distance = normal_world.dotProduct(offset);
  c.creator = 'PathJoint';
};

static nextJointNum = 0;

} // end class

Util.defineGlobal('lab$engine2D$PathJoint', PathJoint);
