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

/** A path like an oval racetrack with vertical sections. The straight
sections are vertical, so it is a good test for handling infinite slope situations.

The parameter, `t` starts at pi/2, corresponding to the topmost point of the oval.
```text
t = pi/2 to pi is upper left quarter circle from top going counter clockwise
t = pi to 2+pi is straight down section
t = 2+pi to 2+2*pi is the bottom half circle (ccw)
t = 2 + 2*pi to 4 + 2*pi is straight up section
t = 4+2*pi to 4+ (5/2)*pi is upper right quarter circle
```
*/
export class OvalPath extends AbstractPath implements ParametricPath {
  /** length of straight section */
  private s_: number;
  /** top of upper arc */
  private t0_: number;
  /** left end of upper arc */
  private t1_: number;
  /** bottom of left vertical line */
  private t2_: number;
  /** right end of lower arc */
  private t3_: number;
  /** top of right vertical line */
  private t4_: number;
  /** top of upper arc */
  private t5_: number;

/**
@param straight length of the straight section
*/
constructor(straight?: number, name?: string, localName?: string) {
  name = name || OvalPath.en.NAME;
  localName = localName || OvalPath.i18n.NAME;
  super(name, localName, /*start=*/0, /*finish=*/0, /*closedLoop=*/true);
  straight = straight ?? 2.0;
  this.s_ = straight;
  this.t0_ = Math.PI/2;
  this.t1_ = Math.PI;
  this.t2_ = this.t1_ + this.s_;
  this.t3_ = this.t2_ + Math.PI;
  this.t4_ = this.t3_ + this.s_;
  this.t5_ = this.t4_ + Math.PI/2;
  this.setStartTValue(this.t0_);
  this.setFinishTValue(this.t5_);
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      + ', straight: '+Util.NF(this.s_)+'}';
};

/** @inheritDoc */
getClassName() {
  return 'OvalPath';
};

/** @inheritDoc */
x_func(t: number): number {
  if (t<this.t1_)
    return Math.cos(t);
  else if (t<this.t2_)
    return -1;
  else if (t< this.t3_)
    return Math.cos(Math.PI + t-this.t2_);
  else if (t< this.t4_)
    return 1;
  else if (t<this.t5_)
    return Math.cos(t-this.t4_);
  else
    return 0;
};

/** @inheritDoc */
y_func(t: number): number {
  if (t<this.t1_)
    return this.s_+Math.sin(t);
  else if (t<this.t2_)
    return this.s_ - (t-this.t1_);
  else if (t< this.t3_)
    return Math.sin(Math.PI + t-this.t2_);
  else if (t< this.t4_)
    return t-this.t3_;
  else if (t<this.t5_)
    return this.s_ + Math.sin(t-this.t4_);
  else
    return 0;
};

static readonly en: i18n_strings = {
  NAME: 'Oval'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Oval'
};

static readonly i18n = Util.LOCALE === 'de' ? OvalPath.de_strings : OvalPath.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('sims$roller$OvalPath', OvalPath);
