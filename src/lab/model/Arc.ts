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

import { SimObject, AbstractSimObject } from './SimObject.js'
import { DoubleRect } from '../util/DoubleRect.js'
import { Vector } from '../util/Vector.js'
import { Util } from '../util/Util.js'

/** A {@link SimObject} that represents a semi-circular arc.
*/
export class Arc extends AbstractSimObject implements SimObject {
  /** Starting position of arc, in radians where zero
  * corresponds to 3 o'clock, `pi/2` corresponds to 12 o'clock.
  */
  private startAngle_: number;
  /** Angle in radians, where positive is counter-clockwise. */
  private angle_: number = 0;
  /** radius of arc, in simulation coords */
  private radius_: number;
  /** center of arc, in simulation coords */
  private center_: Vector;

/**
* @param name name of this SimObject
* @param startAngle  starting position of arc, in radians where zero
*     corresponds to 3 o'clock, `pi/2` corresponds to 12 o'clock.
* @param radius  radius of arc, in simulation coords
* @param center  center of arc, in simulation coords
*/
constructor(name: string, startAngle: number, radius: number, center: Vector) {
  super(name);
  this.startAngle_ = startAngle;
  this.radius_ = radius;
  this.center_ = center;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', startAngle_: '+Util.NF(this.startAngle_)
      +', angle_: '+Util.NF(this.angle_)
      +', radius_: '+Util.NF(this.radius_)
      +', center_: '+this.center_
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'Arc';
};

/** Returns angle in radians, where positive is counter-clockwise.
@return angle in radians, where positive is counter-clockwise
*/
getAngle(): number {
  return this.angle_;
};

/** @inheritDoc */
getBoundsWorld() {
  return DoubleRect.makeCentered(this.center_, this.radius_, this.radius_);
};

/** Returns center of arc, in simulation coords.
@return center of arc, in simulation coords
*/
getCenter(): Vector {
  return this.center_;
};

/** Returns radius of arc, in simulation coords.
@return radius of arc, in simulation coords
*/
getRadius(): number {
  return this.radius_;
};

/** Returns starting angle in radians, where zero corresponds to 3 o'clock,
`pi/2` corresponds to 12 o'clock.
@return starting angle in radians
*/
getStartAngle(): number {
  return this.startAngle_;
};

/** Sets angle in radians, where positive is counter-clockwise.
@param angle angle in radians, where positive is counter-clockwise.
*/
setAngle(angle: number) {
  this.angle_ = angle;
  this.setChanged();
};

/** Sets center of arc, in simulation coords.
@param center center of arc, in simulation coords.
*/
setCenter(center: Vector) {
  this.center_ = center;
  this.setChanged();
};

/** Sets radius of arc, in simulation coords.
@param radius radius of arc, in simulation coords.
*/
setRadius(radius: number) {
  this.radius_ = radius;
  this.setChanged();
};

/** Sets starting angle in radians, where zero corresponds to 3 o'clock,
`pi/2` corresponds to 12 o'clock.
@param angle starting angle in radians
*/
setStartAngle(angle: number) {
  this.startAngle_ = angle;
  this.setChanged();
};

/** @inheritDoc */
override similar(obj: SimObject, opt_tolerance?: number): boolean {
  if (!(obj instanceof Arc)) {
    return false;
  }
  if (Util.veryDifferent(obj.startAngle_, this.startAngle_, opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(obj.angle_, this.angle_, opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(obj.radius_, this.radius_, opt_tolerance)) {
    return false;
  }
  return obj.getCenter().nearEqual(this.center_, opt_tolerance);
};

} // end class
