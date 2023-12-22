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
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** Generates a collision when the attachment point on a RigidBody moves past a certain
point on a path so that the RigidBody cannot move past that point. The RigidBody would
typically be connected to the path with a
{@link lab/engine2D/PathJoint.PathJoint | PathJoint},
and so can move along the path.

### Implementation Notes

The current position of the body determines where on the path we detect
the body is, and this is stored in a PathPoint. We do a global search over the
entire path here for the closest point on the path to the attachment point, see
{@link NumericalPath.findNearestGlobal},
whereas later on we do a local search starting at the current PathPoint position,
see {@link NumericalPath.findNearestLocal}.

NOTE: Does not deal with case where the body crosses the 'stitch' point in a closed
loop path.
*/
export class PathEndPoint extends AbstractSimObject implements SimObject, Connector {
  private body_: RigidBody;
  /** path that joint is attached to */
  private path_: NumericalPath;
  /** attachment point in body coords of this.body_ */
  private attach_body_: Vector;
  /** the limiting value of the path position, `p`, when the body moves
  * beyond this then a collision is created.
  */
  private limit_: number;
  /** `true` means this is an is an upper limit; `false` indicates
  * this is a lower limit.
  */
  private upperLimit_: boolean;
  private location_: Vector;
  /** current position along the path */
  private ppt_: PathPoint;
  /** last position along the path */
  private ppt_old_: PathPoint;

/**
@param name the name of this SimObject
@param path the path to connect
@param body the RigidBody to connect
@param attach_body the attachment point on the
    RigidBody in body coordinates
@param limit the limiting value of the path position, `p`, when the body moves
    beyond this then a collision is created.
@param upperLimit `true` means this is an is an upper limit; `false` indicates
    this is a lower limit
*/
constructor(name: string, path: NumericalPath, body: RigidBody, attach_body: Vector, limit: number, upperLimit: boolean) {
  super(name);
  this.body_ = body;
  this.path_ = path;
  this.attach_body_ = attach_body;
  this.limit_ = limit;
  this.upperLimit_ = upperLimit;
  this.location_ = path.map_p_to_vector(limit);
  // NOTE: important to search over entire curve for closest point here
  // later we will use findNearestLocal which is a local not global minimum.
  const point = this.body_.bodyToWorld(this.attach_body_);
  this.ppt_ =this.path_.findNearestGlobal(point);
  this.ppt_old_ = new PathPoint(this.ppt_.p);
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', body_:='+this.body_.toStringShort()
      +', path_: '+this.path_.toStringShort()
      +', attach_body_: '+this.attach_body_
      +', limit_: '+Util.NF(this.limit_)
      +', upperLimit_: '+this.upperLimit_
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'PathEndPoint';
};

/** @inheritDoc */
addCollision(collisions: RigidBodyCollision[], time: number, _accuracy: number): void {
  const c = new ConnectorCollision(this.body_, Scrim.getScrim(), this, /*joint=*/false);
  this.updateCollision(c);
  c.setDetectedTime(time);
  if (c.distance < 0) {
    // We only report a collision when distance went from positive to negative.
    // Find the old body distance, was it positive?
    const body_old = this.body_.getOldCoords();
    if (body_old == null) {
      return;
    }
    const point_old = body_old.bodyToWorld(this.attach_body_);
    this.path_.findNearestLocal(point_old, this.ppt_old_);
    this.path_.map_p_to_slope(this.ppt_old_);
    const distance_old = this.upperLimit_ ? this.limit_ - this.ppt_old_.p :
        this.ppt_old_.p - this.limit_;
    if (distance_old < 0) {
      return;  // it did not cross from positive to negative, so no collision
    }
    /*if (false && this.path_.isClosedLoop()) {
      // Deal with case where the body crosses the 'stitch' point, where p
      // suddenly goes from 0 to total path length.
      // If the change in distance is same as path length, ignore this.
      if (Math.abs(c.distance - distance_old) > 0.9*this.path_.getLength()) {
        return;
      }
    }*/
  }
  if (c.distance < this.body_.getDistanceTol()) {
    collisions.unshift(c);
  }
};

/** @inheritDoc */
align(): void {
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
  return DoubleRect.make(this.location_, this.location_);
};

/** @inheritDoc */
getNormalDistance(): number {
  const collisions: RigidBodyCollision[] = [];
  this.addCollision(collisions, /*time=*/NaN, /*accuracy=*/NaN);
  return collisions[0].getDistance();
};

/** Returns the NumericalPath to which this PathEndPoint attaches the RigidBody.
@return the NumericalPath to which this PathEndPoint attaches the RigidBody.
*/
getPath(): NumericalPath {
  return this.path_;
};

/** @inheritDoc */
getPosition1(): Vector {
  return this.location_;
};

/** @inheritDoc */
getPosition2(): Vector {
  return this.location_;
};

/** @inheritDoc */
updateCollision(c: RigidBodyCollision): void {
  if (c.primaryBody != this.body_ || c.normalBody != Scrim.getScrim()) {
    throw '';
  }
  if (c.getConnector() != this) {
    throw '';
  }
  const point = this.body_.bodyToWorld(this.attach_body_);
  c.impact1 = point;
  this.path_.findNearestLocal(point, this.ppt_);
  this.path_.map_p_to_slope(this.ppt_);
  c.distance = this.upperLimit_ ? this.limit_ - this.ppt_.p :
      this.ppt_.p - this.limit_;
  c.normal = this.ppt_.getSlope().multiply(this.upperLimit_ ? -1 : 1);
  c.ballNormal = false;
  c.impact2 = this.ppt_.getPosition();
  c.creator = Util.DEBUG ? 'PathEndPoint' : '';
};

} // end class
Util.defineGlobal('lab$engine2D$PathEndPoint', PathEndPoint);
