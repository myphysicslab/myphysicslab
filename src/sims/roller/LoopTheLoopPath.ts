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

/** Loop-the-loop curve, like a roller coaster that has a loop in it where
the car will go upside down. Formed from part of a parabola, then part of a circle, then
another parabola. For details see Mathematica file 'roller.nb'.

*/
export class LoopTheLoopPath extends AbstractPath implements ParametricPath {
/**
* @param start
* @param finish
* @param name
* @param localName
*/
constructor(start?: number, finish?: number, name?: string, localName?: string) {
  if (typeof start !== 'number') {
    start = -3.7;
  }
  if (typeof finish !== 'number') {
    finish = 8.5;
  }
  name = name || LoopTheLoopPath.en.NAME;
  localName = localName || LoopTheLoopPath.i18n.NAME;
  super(name, localName, start, finish, /*closedLoop=*/false);
};

/** @inheritDoc */
getClassName() {
  return 'LoopTheLoopPath';
};

/** @inheritDoc */
x_func(t: number): number {
  if (t<0.5) {
    return t;
  } else if (t < 0.5 + LoopTheLoopPath.theta1 - LoopTheLoopPath.theta2) {
    return LoopTheLoopPath.radius * Math.cos(t - 0.5 + LoopTheLoopPath.theta2)
        + LoopTheLoopPath.xcenter;
  } else {
    return t - LoopTheLoopPath.theta1 + LoopTheLoopPath.theta2 - 1;
  }
};

/** @inheritDoc */
y_func(t: number): number {
  if (t<0.5) {
    return (t+1)*(t+1) + LoopTheLoopPath.yoffset;
  } else if (t < 0.5 + LoopTheLoopPath.theta1 - LoopTheLoopPath.theta2) {
    return LoopTheLoopPath.radius * Math.sin(t - 0.5 + LoopTheLoopPath.theta2)
        + LoopTheLoopPath.ycenter + LoopTheLoopPath.yoffset;
  } else {
    const dd = t - LoopTheLoopPath.theta1 + LoopTheLoopPath.theta2 - 2;
    return dd*dd + LoopTheLoopPath.yoffset;
  }
};

static theta1 = 3.46334;
static theta2 = -0.321751;
static radius = 0.527046;
static ycenter = 2.41667;
static xcenter = 0;
static yoffset = 1;

static readonly en: i18n_strings = {
  NAME: 'Loop'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Schleife'
};

static readonly i18n = Util.LOCALE === 'de' ? LoopTheLoopPath.de_strings : LoopTheLoopPath.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('sims$roller$LoopTheLoopPath', LoopTheLoopPath);
