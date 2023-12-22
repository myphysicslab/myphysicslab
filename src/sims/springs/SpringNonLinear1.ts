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

import { AbstractSimObject, SimObject } from '../../lab/model/SimObject.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { Force } from '../../lab/model/Force.js';
import { ForceLaw } from '../../lab/model/ForceLaw.js';
import { Line } from "../../lab/model/Line.js"
import { MassObject } from '../../lab/model/MassObject.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector, GenericVector } from '../../lab/util/Vector.js';

/** Represents a non-linear spring attached between two {@link MassObject}s, generates
a {@link Force} which depends on how the SpringNonLinear1 is stretched. Damping is
proportional to the relative velocity of the two objects.

The force equation is:
```text
f(x) = S(6*Math.pow(x,-1) - Math.pow(x/2, -3))
x = distance between masses
S = resisting force constant
```
The potential energy is the integral of the force:
```text
PE(x) = S(6 * Math.log(x) + 4*Math.pow(x, -2))
```
The minimum PE occurs where the force is zero:
```text
S(6*Math.pow(x,-1) = Math.pow(x/2, -3))
6/x = 8 x^-3
3/4 = x^-2
x_min = sqrt(4/3) = 2/sqrt(3)
```
We subtract the minimum PE from the reported PE so that PE is zero at it's minimum.

To attach one end to a fixed point you can attach to an infinite mass MassObject or a
{@link lab/engine2D/Scrim.Scrim | Scrim}.
*/
export class SpringNonLinear1 extends Spring implements SimObject, Line, ForceLaw {

  /** minimum potential energy */
  minPE_: number = 0

/**
* @param name language-independent name of this object
* @param body1 body to attach to start point of the
*    SpringNonLinear1
* @param attach1_body attachment point in body
*    coords of body1
* @param body2 body to attach to end point of the
*    SpringNonLinear1
* @param attach2_body attachment point in body
*    coords of body2
* @param restLength length of spring when it has no force
* @param stiffness amount of force per unit distance of stretch
*/
constructor(name: string, body1: MassObject, attach1_body: GenericVector, body2: MassObject, attach2_body: GenericVector, restLength: number, stiffness?: number) {
  super(name, body1, attach1_body, body2, attach2_body, restLength, stiffness,
      /*compressOnly=*/false);
  this.calcMinPE();
};

/** @inheritDoc */
override getClassName() {
  return 'SpringNonLinear1';
};

/** @inheritDoc */
override calculateForces(): Force[] {
  const point1 = this.getStartPoint();
  const point2 = this.getEndPoint();
  const body1 = this.getBody1();
  const body2 = this.getBody2();
  const v = point2.subtract(point1);
  const len = v.length();
  // force on body 1 is in direction of v
  const sf = -this.getStiffness() * (6*Math.pow(len,-1) - Math.pow(len/2, -3));
  // amount of force is proportional to stretch of spring
  // spring force is - stiffness * stretch
  //const sf = -this.stiffness_ * (len - this.restLength_);
  const fx = -sf * (v.getX() / len);
  const fy = -sf * (v.getY() / len);
  let f = new Vector(fx, fy, 0);
  if (this.getDamping() != 0) {
      const v1 = body1.getVelocity(this.getAttach1());
      const v2 = body2.getVelocity(this.getAttach2());
      const df = v1.subtract(v2).multiply(-this.getDamping());
      f = f.add(df);
  }
  return [ new Force('spring', body1,
        /*location=*/point1, CoordType.WORLD,
        /*direction=*/f, CoordType.WORLD),
    new Force('spring', body2,
        /*location=*/point2, CoordType.WORLD,
        /*direction=*/f.multiply(-1), CoordType.WORLD) ];
};

/** @inheritDoc */
override getPotentialEnergy(): number {
  const len = this.getLength();
  return this.potentialEnergy(len) - this.minPE_;
};

/** Returns potential energy for a given length of spring.
@param len length of spring
@return potential energy
*/
potentialEnergy(len: number): number {
  const S = this.getStiffness();
  return S * (6 * Math.log(len) + 4/(len*len));
};

/** Returns length of spring that has minimum potential energy.
@return length of spring that has minimum potential energy
*/
minPELen(): number {
  return 2/Math.sqrt(3);
};

/** Calculate minimum potential energy.
*/
calcMinPE(): void {
  this.minPE_ = this.potentialEnergy(this.minPELen());
};

} // end class

Util.defineGlobal('sims$springs$SpringNonLinear1', SpringNonLinear1);
