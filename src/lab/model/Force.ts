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
import { Line } from "./Line.js"
import { DoubleRect } from "../util/DoubleRect.js"
import { MassObject } from "./MassObject.js"
import { Vector } from "../util/Vector.js"
import { Util } from "../util/Util.js"

/** A Force acts on a given {@link MassObject} at a defined location and with a defined
direction and magnitude.

The method {@link getStartPoint} gives the location in world coordinates where the
Force is applied. The method {@link getVector} gives the direction and magnitude of the
Force in world coordinates.

The location and direction can be passed to the constructor either in fixed world
coordinates, or in relative body coordinates. When given in body coordinates, the
location and/or direction are calculated relative to the body's current position. See
{@link CoordType}.

In {@link lab/engine2D/RigidBodySim.RigidBodySim | RigidBodySim} the torque affects
the angular acceleration like this:
```
angular_acceleration += torque / RigidBody.momentAboutCM()
```

TO DO: move contactDistance and distanceTol to a sub-class called ContactForce?
*/
export class Force extends AbstractSimObject implements SimObject, Line {
  /** which body the force is applied to */
  private body_: MassObject;
  /**  where the force is applied, in body or world coords */
  private location_: Vector;
  /** direction & magnitude of force, in body or world coords */
  private direction_: Vector;
  /** whether location is in body or world coords */
  private locationCoordType_: CoordType;
  /** whether direction is in body or world coords */
  private directionCoordType_: CoordType;
  /** gap between objects for contact force (optional info) */
  contactDistance: number = 0;
  /** distance tolerance for contact force (optional info) */
  contactTolerance: number = 0;
  /** torque to change angular acceleration of body */
  private torque_: number;

/**
@param name  string indicating the type of force, e.g. 'gravity'
@param body the MassObject that the Force is
    applied to
@param location the location on the body where the force
    is applied, in either body or world coordinates
@param locationCoordType whether the location is in
    body or world coords
@param direction a Vector giving the direction and
    magnitude of the Force, in either body or world coordinates
@param directionCoordType whether the direction is
    in body or world coords
@param opt_torque torque to change angular acceleration of body
*/
constructor(name: string, body: MassObject, location: Vector, locationCoordType: CoordType, direction: Vector, directionCoordType: CoordType, opt_torque?: number) {
  super(name);
  this.body_ = body;
  this.location_ = location;
  this.direction_ = direction;
  this.locationCoordType_ = locationCoordType;
  this.directionCoordType_ = directionCoordType;
  this.torque_ = opt_torque===undefined ? 0 : opt_torque;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', body: "'+this.body_.getName()+'"'
      +', location: '+this.location_
      +', direction: '+this.direction_
      +', locationCoordType: '+this.locationCoordType_
      +', directionCoordType: '+this.directionCoordType_
      +', torque: '+Util.NF5E(this.torque_)
      +'}';
};

/** @inheritDoc */
getClassName(): string {
  return 'Force';
};

/** The body to which this Force is applied.
@return The MassObject to which this force is applied
*/
getBody(): MassObject {
  return this.body_;
};

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  return DoubleRect.make(this.getStartPoint(), this.getEndPoint());
};

/** @inheritDoc */
getEndPoint(): Vector {
  return this.getStartPoint().add(this.getVector());
};

/** @inheritDoc */
getStartPoint(): Vector {
  return this.locationCoordType_==CoordType.BODY ?
          this.body_.bodyToWorld(this.location_) : this.location_;
};

/** Returns the torque which affects the angular acceleration.
@return the torque which affects the angular acceleration.
*/
getTorque(): number {
  return this.torque_;
};

/** @inheritDoc */
getVector(): Vector {
  return this.directionCoordType_==CoordType.BODY ?
          this.body_.rotateBodyToWorld(this.direction_) : this.direction_;
};

/** @inheritDoc */
override similar(obj: any, opt_tolerance?: number): boolean {
  if (!(obj instanceof Force)) {
    return false;
  }
  // require same name: fixes thrust force not appearing when gravity is at same place
  if (obj.getName() != this.getName()) {
    return false;
  }
  const f = obj;
  if (!this.getStartPoint().nearEqual(f.getStartPoint(), opt_tolerance)) {
    return false;
  }
  return this.getVector().nearEqual(f.getVector(), opt_tolerance);
};

} // end class

Util.defineGlobal('lab$model$Force', Force);
