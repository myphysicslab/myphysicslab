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

/** ParametricPath that represents a cardiod, which is a vaguely heart shaped
figure. Currently set to not be a closed curve, with end points at the point (at the
origin) where the derivative is discontinuous. The discontinuous derivative causes
problems with RigidBody physics engine.

Cardioid equation:
```text
r = a (1 - cos theta)
x = a cos t (1 + cos t)
y = a sin t (1 + cos t)
```
or interchange x-y to rotate by 90 degrees.
*/
export class CardioidPath extends AbstractPath implements ParametricPath {
  private a_: number;

/**
* @param radius
* @param start
* @param finish
* @param closedLoop
* @param name
* @param localName
*/
constructor(radius: number, start?: number, finish?: number, closedLoop?: boolean, name?: string, localName?: string) {
  if (typeof start !== 'number') {
    start = -Math.PI;
  }
  if (typeof finish !== 'number') {
    finish = Math.PI;
  }
  if (closedLoop === undefined) {
    closedLoop = false;
  }
  name = name || CardioidPath.en.NAME;
  localName = localName || CardioidPath.i18n.NAME;
  super(name, localName, start, finish, closedLoop);
  this.a_ = radius;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      + ', radius: '+Util.NF(this.a_)+'}';
};

/** @inheritDoc */
getClassName() {
  return 'CardioidPath';
};

/** @inheritDoc */
x_func(t: number): number {
  const c = Math.cos(t);
  return this.a_ *Math.sin(t)*(1+c);
};

/** @inheritDoc */
y_func(t: number): number {
  const c = Math.cos(t);
  return -this.a_ *c*(1+c);
};

static readonly en: i18n_strings = {
  NAME: 'Cardioid'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Cardioid'
};

static readonly i18n = Util.LOCALE === 'de' ? CardioidPath.de_strings : CardioidPath.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('sims$roller$CardioidPath', CardioidPath);
