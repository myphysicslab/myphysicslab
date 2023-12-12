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

/** Circular path centered at the origin.
*/
export class CirclePath extends AbstractPath implements ParametricPath {
  private radius_: number;

constructor(radius: number, start?: number, finish?: number, closedLoop?: boolean,
    name?: string, localName?: string) {
  start = start ?? -3*Math.PI/2;
  finish = finish ?? Math.PI/2;
  closedLoop = closedLoop ?? true;
  name = name || CirclePath.en.NAME;
  localName = localName || CirclePath.i18n.NAME;
  super(name, localName, start, finish, closedLoop);
  this.radius_ = radius;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      + ', radius_: '+Util.NF(this.radius_)+'}';
};

/** @inheritDoc */
getClassName() {
  return 'CirclePath';
};

/** @inheritDoc */
x_func(t: number): number {
  return this.radius_*Math.cos(t);
};

/** @inheritDoc */
y_func(t: number): number {
  return this.radius_*Math.sin(t);
};

static readonly en: i18n_strings = {
  NAME: 'Circle'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Kreis'
};

static readonly i18n = Util.LOCALE === 'de' ? CirclePath.de_strings : CirclePath.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('sims$roller$CirclePath', CirclePath);
