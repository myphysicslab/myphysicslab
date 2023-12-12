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

import { CoordType } from './CoordType.js';
import { DoubleRect } from '../util/DoubleRect.js';
import { Line } from './Line.js';
import { MassObject } from './MassObject.js';
import { SimObject, AbstractSimObject } from './SimObject.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** An Impulse is a sudden change in momentum, it acts on a given
{@link MassObject} at a defined location and with a defined
direction and magnitude.

The method {@link Impulse.getStartPoint} gives the location in world coordinates where
the Impulse is applied. The method {@link Impulse.getVector} gives the direction and
magnitude of the Impulse in world coordinates.
*/
export class Impulse extends AbstractSimObject implements SimObject, Line {
  /** which body the impulse is applied to */
  private body_: MassObject;
  /** magnitude of impulse */
  private magnitude_: number;
  /**  where the impulse is applied, in world coords */
  private location_: Vector;
  /** direction of impulse, a unit vector, in world coords */
  private direction_: Vector;
  /** offset vector from CM (center of mass) of body to point of impact,
  * in world coords
  */
  private offset_: Vector;

/**
@param name  string indicating the type of impulse
@param body the MassObject that the Impulse is applied to
@param magnitude the size of the impulse
@param location the location on the body where the impulse
    is applied, in world coordinates
@param direction a unit Vector giving the direction and
    magnitude of the Impulse, in world coordinates
@param offset vector from CM (center of mass) of body to point of impact,
    in world coords
*/
constructor(name: string, body: MassObject, magnitude: number, location: Vector, direction: Vector, offset: Vector) {
  super(name);
  this.body_ = body;
  this.magnitude_ = magnitude;
  this.location_ = location;
  this.direction_ = direction;
  this.offset_ = offset;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', body: "'+this.body_.getName()+'"'
      +', magnitude_: '+Util.NF5E(this.magnitude_)
      +', location_: '+this.location_
      +', direction_: '+this.direction_
      +', offset_: '+this.offset_
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'Impulse';
};

/** The body to which this Impulse is applied.
* @return The MassObject to which this impulse is applied
*/
getBody(): MassObject {
  return this.body_;
};

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  return DoubleRect.make(this.location_, this.getEndPoint());
};

/** @inheritDoc */
getEndPoint(): Vector {
  return this.location_.add(this.direction_);
};

/** @inheritDoc */
getStartPoint(): Vector {
  return this.location_;
};

/** Returns the magnitude of the impulse.
* @return the magnitude of the impulse.
*/
getMagnitude(): number {
  return this.magnitude_;
};

/** Returns the offset vector from CM (center of mass) of body to point of impact,
* in world coords
* @return the offset vector of the impulse.
*/
getOffset(): Vector {
  return this.offset_;
};

/** @inheritDoc */
getVector(): Vector {
  return this.direction_;
};

/** @inheritDoc */
override similar(obj: SimObject, opt_tolerance?: number): boolean {
  if (!(obj instanceof Impulse)) {
    return false;
  }
  if (obj.getName() != this.getName()) {
    return false;
  }
  const f = obj as Impulse;
  if (!this.location_.nearEqual(f.getStartPoint(), opt_tolerance)) {
    return false;
  }
  if (Util.veryDifferent(this.magnitude_, f.getMagnitude(), opt_tolerance)) {
    return false;
  }
  if (!this.direction_.nearEqual(f.getVector(), opt_tolerance)) {
    return false;
  }
  return this.offset_.nearEqual(f.getOffset(), opt_tolerance);
};

} // end Impulse class
Util.defineGlobal('lab$model$Impulse', Impulse);
