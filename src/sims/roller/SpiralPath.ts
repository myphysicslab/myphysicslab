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

/** A spiral shaped path.
See the Mathematica file Rollercurves.nb for construction.

*/
export class SpiralPath extends AbstractPath implements ParametricPath {
  /** center of upper arc */
  private arc1x: number = -2.50287;
  /** center of upper arc */
  private arc1y: number = 5.67378;
  /** radius of the arcs */
  private rad: number = 1;
  /** t value at inside of spiral */
  private slo: number = 4.91318;
  /** inside point of spiral */
  private slox: number = 0.122489;
  /** inside point of spiral */
  private sloy: number = -0.601809;
  /** t value at outside of spiral */
  private shi: number = 25.9566;
  /** outside point of spiral */
  private shix: number = 2.20424;
  /** outside point of spiral */
  private shiy: number = 2.38089;
  /** center of lower arc */
  private arc2y: number = this.sloy + this.rad;
  /** right point of upper arc */
  private arc1rx: number = this.arc1x + Math.cos(Math.PI/4);
  /** end of upper arc */
  private t1: number = Math.PI/2;
  /** end of left vertical line */
  private t2: number = this.t1 + this.arc1y - this.arc2y;
  /** end of lower arc */
  private t3: number = this.t2 + Math.PI/2;
  /** end of horiz line, start of spiral */
  private t4: number = this.t3 + this.slox - this.arc1x;
  /** end of spiral */
  private t5: number = this.t4 + this.shi - this.slo;
  /** end of diagonal line */
  private t6: number = this.t5 + Math.sqrt(2)*(this.shix-this.arc1rx);
  /** top of upper arc */
  private t7: number = this.t6 + Math.PI/4;

constructor() {
  super(SpiralPath.en.NAME, SpiralPath.i18n.NAME, /*start=*/0, /*finish=*/0,
      /*closedLoop=*/true);
  this.setFinishTValue(this.t7);
};

/** @inheritDoc */
getClassName() {
  return 'SpiralPath';
};

/** @inheritDoc */
x_func(t: number): number {
  if (t < this.t1) { // upper arc
    return Math.cos(t + Math.PI/2) + this.arc1x;
  } else if (t < this.t2)  { // left vertical line
    return this.arc1x - this.rad;
  } else if (t < this.t3)  { // lower arc
    return Math.cos(t- this.t2 +Math.PI) + this.arc1x;
  } else if (t < this.t4)  { // end of horiz line
    return this.arc1x + (t-this.t3);
  } else if (t < this.t5)  { // end of spiral
    return ((t-this.t4 + this.slo)/8) * Math.cos(t-this.t4+this.slo);
  } else if (t < this.t6)  { // end of diagonal line
    return this.shix - (t-this.t5)/Math.sqrt(2);
  } else if (t < this.t7) {
    return this.arc1x + Math.cos(Math.PI/4 + t-this.t6);
  } else {
    return 0;
  }
};

/** @inheritDoc */
y_func(t: number): number {
  if (t < this.t1) { // upper arc
    return Math.sin(t + Math.PI/2) + this.arc1y;
  } else if (t < this.t2)  { // left vertical line
    return this.arc1y - (t-this.t1);
  } else if (t < this.t3)  { // lower arc
    return Math.sin(t-this.t2+Math.PI) + this.arc2y;
  } else if (t < this.t4)  { // end of horiz line
    return this.sloy;
  } else if (t < this.t5)  { // end of spiral
    return ((t-this.t4+this.slo)/8) * Math.sin(t-this.t4+this.slo);
  } else if (t < this.t6)  { // end of diagonal line
    return this.shiy + (t-this.t5)/Math.sqrt(2);
  } else if (t < this.t7) {
    return this.arc1y + Math.sin(Math.PI/4 + t-this.t6);
  } else {
    return 0;
  }
};

static readonly en: i18n_strings = {
  NAME: 'Spiral'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Spirale'
};

static readonly i18n = Util.LOCALE === 'de' ? SpiralPath.de_strings : SpiralPath.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('sims$roller$SpiralPath', SpiralPath);
