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
import { Line } from './Line.js'
import { Vector } from '../util/Vector.js'
import { Util } from '../util/Util.js'

/** A {@link Line} whose endpoints can be modified.
*/
export class ConcreteLine extends AbstractSimObject implements SimObject, Line {
  private startPt_: Vector;
  private endPt_: Vector;

/**
* @param name the name of this ConcreteLine, for scripting
* @param startPt  starting point, default is the origin
* @param endPt  ending point, default is the origin
*/
constructor(name: string, startPt?: Vector, endPt?: Vector) {
  super(name);
  this.startPt_ = startPt ? startPt : Vector.ORIGIN;
  this.endPt_ = endPt ? endPt : Vector.ORIGIN;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', startPoint: '+this.getStartPoint()
      +', endPoint: '+this.getEndPoint()
      +'}';
};

/** @inheritDoc */
getClassName(): string {
  return 'ConcreteLine';
};

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  return DoubleRect.make(this.getStartPoint(), this.getEndPoint());
};

/** @inheritDoc */
getEndPoint(): Vector {
  return this.endPt_;
};

/** @inheritDoc */
getStartPoint(): Vector {
  return this.startPt_;
};

/** @inheritDoc */
getVector(): Vector {
  return this.getEndPoint().subtract(this.getStartPoint());
};

/** Sets ending point of the line.
@param loc the ending point in world coords.
*/
setEndPoint(loc: Vector): void {
  this.endPt_ = loc;
  this.setChanged();
};

/** Sets starting point of the line.
@param loc the starting point in world coords.
*/
setStartPoint(loc: Vector): void {
  this.startPt_ = loc;
  this.setChanged();
};

/** @inheritDoc */
override similar(obj: SimObject, opt_tolerance?: number): boolean {
  if (!(obj instanceof ConcreteLine)) {
    return false;
  }
  if (!obj.getStartPoint().nearEqual(this.getStartPoint(), opt_tolerance)) {
    return false;
  }
  return obj.getEndPoint().nearEqual(this.getEndPoint(), opt_tolerance);
};

} // end class
