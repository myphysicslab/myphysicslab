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

import { AbstractStringShape } from './AbstractStringShape.js';
import { Util } from '../../lab/util/Util.js';
import { StringShape } from './StringShape.js';

// ===============================================================
/**
*/
export class FlatShape extends AbstractStringShape implements StringShape {
/**
* @param length
*/
constructor(length: number) {
  super(length, StringShapes.en.FLAT, StringShapes.i18n.FLAT);
};

/** @inheritDoc */
getClassName() {
  return 'FlatShape';
};

/** @inheritDoc */
position(_x: number): number {
  return 0;
};

/** @inheritDoc */
velocity(_x: number): number {
  return 0;
};

} // end class

Util.defineGlobal('sims$pde$FlatShape', FlatShape);

// ===============================================================
/**
*/
export class SquarePulseShape extends AbstractStringShape implements StringShape {
  private w_: number;

/**
* @param length
* @param pulseWidth
*/
constructor(length: number, pulseWidth?: number) {
  super(length, StringShapes.en.SQUARE_PULSE, StringShapes.i18n.SQUARE_PULSE);
  this.w_ = pulseWidth || length/8;
};

/** @inheritDoc */
getClassName() {
  return 'SquarePulseShape';
};

/** @inheritDoc */
position(x: number): number {
  const middle = this.length_/2;
  return (x >= middle-this.w_ && x <= middle+this.w_) ? 0.1 : 0.0;
};

/** @inheritDoc */
velocity(_x: number): number {
  return 0;
};

} // end class

Util.defineGlobal('sims$pde$SquarePulseShape', SquarePulseShape);

// ===============================================================
/**
*/
export class TrianglePulseShape extends AbstractStringShape implements StringShape {
  private w_: number;

/**
* @param length
*/
constructor(length: number) {
  super(length, StringShapes.en.TRIANGLE_PULSE, StringShapes.i18n.TRIANGLE_PULSE);
  this.w_ = length/8;
};

/** @inheritDoc */
getClassName() {
  return 'TrianglePulseShape';
};

/** @inheritDoc */
position(x: number): number {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return 0.1*((x < 0) ? x/this.w_ + 1 : -x/this.w_ + 1);
  }
};

/** @inheritDoc */
velocity(x: number): number {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return -(0.1/this.w_)*((x < 0) ? 1 : -1);
  }
};

} // end class

Util.defineGlobal('sims$pde$TrianglePulseShape', TrianglePulseShape);

// ===============================================================
/**
*/
export class SinePulseShape extends AbstractStringShape implements StringShape {
  private w_: number;

/**
* @param length
*/
constructor(length: number) {
  super(length, StringShapes.en.SINE_PULSE, StringShapes.i18n.SINE_PULSE);
  this.w_ = length/8;
};

/** @inheritDoc */
getClassName() {
  return 'SinePulseShape';
};

/** @inheritDoc */
position(x: number): number {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return 0.05*Math.sin(Math.PI*x/this.w_);
  }
};

/** @inheritDoc */
velocity(x: number): number {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return -0.05*(Math.PI/this.w_)*Math.cos(Math.PI*x/this.w_);
  }
};

} // end class

Util.defineGlobal('sims$pde$SinePulseShape', SinePulseShape);

// ===============================================================
/**
*/
export class HalfSinePulseShape extends AbstractStringShape implements StringShape {
  private w_: number;

/**
* @param length
*/
constructor(length: number) {
  super(length, StringShapes.en.HALF_SINE_PULSE, StringShapes.i18n.HALF_SINE_PULSE);
  this.w_ = length/3;
};

/** @inheritDoc */
getClassName() {
  return 'HalfSinePulseShape';
};

/** @inheritDoc */
position(x: number): number {
  if (x > this.w_)
    return 0;
  else
    return 0.05*Math.sin(Math.PI*x/this.w_);
};

/** @inheritDoc */
velocity(_x: number): number {
  return 0;
};

} // end class

Util.defineGlobal('sims$pde$HalfSinePulseShape', HalfSinePulseShape);

// ===============================================================
/**
*/
export class MultiSineShape extends AbstractStringShape implements StringShape {
/**
* @param length
*/
constructor(length: number) {
  super(length, StringShapes.en.MULTI_SINE, StringShapes.i18n.MULTI_SINE);
};

/** @inheritDoc */
getClassName() {
  return 'MultiSineShape';
};

/** @inheritDoc */
position(x: number): number {
  return 0.1*(Math.sin(2*Math.PI*x/this.length_)
      + Math.sin(4*Math.PI*x/this.length_)
      + Math.sin(6*Math.PI*x/this.length_))/3;
};

/** @inheritDoc */
velocity(_x: number): number {
  return 0;
};

} // end class

Util.defineGlobal('sims$pde$MultiSineShape', MultiSineShape);

// ===============================================================
/**
*/
export class TriangleShape extends AbstractStringShape implements StringShape {
/**
* @param length
*/
constructor(length: number) {
  super(length, StringShapes.en.TRIANGLE, StringShapes.i18n.TRIANGLE);
};

/** @inheritDoc */
getClassName() {
  return 'TriangleShape';
};

/** @inheritDoc */
position(x: number): number {
  return 0.2*(x < this.length_/2 ? x/this.length_ : 1 - x/this.length_);
};

/** @inheritDoc */
velocity(_x: number): number {
  return 0;
};

} // end class

Util.defineGlobal('sims$pde$TriangleShape', TriangleShape);

// ===============================================================

/** Static class that contains the names of string shapes used in
{@link myphysicslab.sims.pde.StringApp}
*/
class StringShapes {

constructor() {
  throw '';
};

static readonly en: i18n_strings = {
  FLAT: 'Flat',
  HALF_SINE_PULSE: 'Half Sine Pulse',
  MULTI_SINE: 'Multiple Sine',
  SINE_PULSE: 'Sine Pulse',
  SQUARE_PULSE: 'Square Pulse',
  TRIANGLE: 'Triangle',
  TRIANGLE_PULSE: 'Triangle Pulse'
};

static readonly de_strings: i18n_strings = {
  FLAT: 'Flach',
  MULTI_SINE: 'Merhfach Sine',
  HALF_SINE_PULSE: 'Halbes Sine Puls',
  SINE_PULSE: 'Sine Pulse',
  SQUARE_PULSE: 'Quadrat Puls',
  TRIANGLE: 'Dreieck',
  TRIANGLE_PULSE: 'Dreieck Puls'
};

static readonly i18n = Util.LOCALE === 'de' ? StringShapes.de_strings : StringShapes.en;

} // end class

type i18n_strings = {
  FLAT: string,
  HALF_SINE_PULSE: string,
  MULTI_SINE: string,
  SINE_PULSE: string,
  SQUARE_PULSE: string,
  TRIANGLE: string,
  TRIANGLE_PULSE: string
};

Util.defineGlobal('sims$pde$StringShapes', StringShapes);
