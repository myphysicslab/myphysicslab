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

import { Util } from '../../lab/util/Util.js';
import { AbstractPath } from './AbstractPath.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';

/** Lemniscate curve; a 'figure eight' path.

Equation in polar coords is:
```text
r^2  =  2 a^2  cos(2t)
r = (+/-) a Sqrt(2 cos(2t))
```
where `a`=constant, `t`=angle from `-Pi/4` to `Pi/4`, and `r`=radius

To get both lobes with the direction of travel increasing across the origin, define
```text
T = -t + Pi/2
```
Then
```text
r = a Sqrt(2 cos(2t))   for -Pi/4 < t < Pi/4
r = -a Sqrt(2 cos(2T))   for Pi/4 < t < 3 Pi/4
```
To get into Cartesian coords, we use
```text
x = r cos(t)
y = r sin(t)
```
*/
export class LemniscatePath extends AbstractPath implements ParametricPath {
  private a_: number;

/**
* @param size
* @param start
* @param finish
* @param closedLoop
* @param name
* @param localName
*/
constructor(size: number, start?: number, finish?: number, closedLoop?: boolean, name?: string, localName?: string) {
  if (typeof start !== 'number')
    start = -Math.PI/4;
  if (typeof finish !== 'number')
    finish = 3*Math.PI/4;
  if (closedLoop === undefined)
    closedLoop = true;
  name = name || LemniscatePath.en.NAME;
  localName = localName || LemniscatePath.i18n.NAME;
  super(name, localName, start, finish, closedLoop);
  this.a_ = size;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      + ', size: '+Util.NF(this.a_)+'}';
};

/** @inheritDoc */
getClassName() {
  return 'LemniscatePath';
};

/** @inheritDoc */
x_func(t: number): number {
  if (t<=Math.PI/4) {
    return this.a_ *Math.sqrt(2*Math.cos(2*t))*Math.cos(t);
  } else if (t<=3*Math.PI/4) {
    const T = -t + Math.PI/2;
    return -this.a_ *Math.sqrt(2*Math.cos(2*T))*Math.cos(T);
  } else {
    return 0;
  }
};

/** @inheritDoc */
y_func(t: number): number {
  if (t<=Math.PI/4) {
    return this.a_*Math.sqrt(2*Math.cos(2*t))*Math.sin(t);
  } else if (t<=3*Math.PI/4) {
    const T = -t + Math.PI/2;
    return -this.a_*Math.sqrt(2*Math.cos(2*T))*Math.sin(T);
  } else {
    return 0;
  }
};

static readonly en: i18n_strings = {
  NAME: 'Lemniscate'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Lemniscate'
};

static readonly i18n = Util.LOCALE === 'de' ? LemniscatePath.de_strings : LemniscatePath.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('sims$roller$LemniscatePath', LemniscatePath);
