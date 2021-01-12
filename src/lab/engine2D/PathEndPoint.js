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

goog.module('myphysicslab.lab.engine2D.PathEndPoint');

const asserts = goog.require('goog.asserts');

const AbstractSimObject = goog.require('myphysicslab.lab.model.AbstractSimObject');
const Connector = goog.require('myphysicslab.lab.engine2D.Connector');
const ConnectorCollision = goog.require('myphysicslab.lab.engine2D.ConnectorCollision');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const NumericalPath = goog.require('myphysicslab.lab.model.NumericalPath');
const PathPoint = goog.require('myphysicslab.lab.model.PathPoint');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const Scrim = goog.require('myphysicslab.lab.engine2D.Scrim');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Generates a collision when the attachment point on a RigidBody moves past a certain
point on a path so that the RigidBody cannot move past that point. The RigidBody would
typically be connected to the path with a {@link myphysicslab.lab.engine2D.PathJoint},
and so can move along the path.

### Implementation Notes

Note that the current position of the body determines where on the path we detect
the body is, and this is stored in a PathPoint. We do a global search over the
entire path here for the closest point on the path to the attachment point, see
{@link NumericalPath#findNearestGlobal},
whereas later on we do a local search starting at the current PathPoint position,
see {@link NumericalPath#findNearestLocal}.

NOTE: Does not deal with case where the body crosses the 'stitch' point in a closed
loop path.

* @implements {Connector}
*/
class PathEndPoint extends AbstractSimObject {
/**
@param {string} name the name of this SimObject
@param {!NumericalPath} path the path to connect
@param {!RigidBody} body the RigidBody to connect
@param {!Vector} attach_body the attachment point on the
    RigidBody in body coordinates
@param {number} limit the limiting value of the path position, `p`, when the body moves
    beyond this then a collision is created.
@param {boolean} upperLimit `true` means this is an is an upper limit; `false` indicates
    this is a lower limit
*/
constructor(name, path, body, attach_body, limit, upperLimit) {
  super(name);
  /**
  * @type {!RigidBody}
  * @private
  */
  this.body_ = body;
  /** path that joint is attached to
  * @type {!NumericalPath}
  * @private
  */
  this.path_ = path;
  /** attachment point in body coords of this.body_
  * @type {!Vector}
  * @private
  */
  this.attach_body_ = attach_body;
  /** the limiting value of the path position, `p`, when the body moves
  * beyond this then a collision is created.
  * @type {number}
  * @private
  */
  this.limit_ = limit;
  /** `true` means this is an is an upper limit; `false` indicates
  * this is a lower limit.
  * @type {boolean}
  * @private
  */
  this.upperLimit_ = upperLimit;
  /**
  * @type {!Vector}
  * @private
  */
  this.location_ = path.map_p_to_vector(limit);
  // NOTE: important to search over entire curve for closest point here
  // later we will use findNearestLocal which is a local not global minimum.
  var point = this.body_.bodyToWorld(this.attach_body_);
  /** current position along the path
  * @type {!PathPoint}
  * @private
  */
  this.ppt_ =this.path_.findNearestGlobal(point);
  /** last position along the path
  * @type {!PathPoint}
  * @private
  */
  this.ppt_old_ = new PathPoint(this.ppt_.p);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' :
      super.toString().slice(0, -1)
      +', body_:='+this.body_.toStringShort()
      +', path_: '+this.path_.toStringShort()
      +', attach_body_: '+this.attach_body_
      +', limit_: '+Util.NF(this.limit_)
      +', upperLimit_: '+this.upperLimit_
      +'}';
};

/** @override */
getClassName() {
  return 'PathEndPoint';
};

/** @override */
addCollision(collisions, time, accuracy) {
  var c = new ConnectorCollision(this.body_, Scrim.getScrim(), this, /*joint=*/false);
  this.updateCollision(c);
  c.setDetectedTime(time);
  if (c.distance < 0) {
    // We only report a collision when distance went from positive to negative.
    // Find the old body distance, was it positive?
    var body_old = this.body_.getOldCoords();
    if (body_old == null) {
      return;
    }
    var point_old = body_old.bodyToWorld(this.attach_body_);
    this.path_.findNearestLocal(point_old, this.ppt_old_);
    this.path_.map_p_to_slope(this.ppt_old_);
    var distance_old = this.upperLimit_ ? this.limit_ - this.ppt_old_.p :
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

/** @override */
align() {
};

/** Returns the attachment point on the RigidBody in body coordinates.
@return {!Vector} the attachment point on the RigidBody in body coordinates
*/
getAttach1() {
  return this.attach_body_;
};

/** @override */
getBody1() {
  return this.body_;
};

/** @override */
getBody2() {
  return Scrim.getScrim();
};

/** @override */
getBoundsWorld() {
  return DoubleRect.make(this.location_, this.location_);
};

/** @override */
getNormalDistance() {
  var collisions = /** @type {!Array<!RigidBodyCollision>} */([]);
  this.addCollision(collisions, /*time=*/NaN, /*accuracy=*/NaN);
  return collisions[0].getDistance();
};

/** Returns the NumericalPath to which this PathEndPoint attaches the RigidBody.
@return {!NumericalPath} the NumericalPath to which this PathEndPoint attaches the
    RigidBody.
*/
getPath() {
  return this.path_;
};

/** @override */
getPosition1() {
  return this.location_;
};

/** @override */
getPosition2() {
  return this.location_;
};

/** @override */
updateCollision(c) {
  if (c.primaryBody != this.body_ || c.normalBody != Scrim.getScrim()) {
    throw '';
  }
  if (c.getConnector() != this) {
    throw '';
  }
  var point = this.body_.bodyToWorld(this.attach_body_);
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
exports = PathEndPoint;
