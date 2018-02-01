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

goog.module('myphysicslab.sims.pde.StringShapes');

const AbstractShape = goog.require('myphysicslab.sims.pde.AbstractShape');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Contains the various string shapes used in the StringApp simulation,
see {@link myphysicslab.sims.pde.StringApp}.
*/
class StringShapes {
/**
* @private
*/
constructor() {
  throw new Error();
};

} // end class

// ===============================================================
class FlatShape extends AbstractShape {
/**
* @param {number} length
*/
constructor(length) {
  super(length, StringShapes.en.FLAT, StringShapes.i18n.FLAT);
};

/** @override */
getClassName() {
  return 'FlatShape';
};

/** @override */
position(x) {
  return 0;
};

/** @override */
velocity(x) {
  return 0;
};

} // end class
StringShapes.FlatShape = FlatShape;

// ===============================================================
class SquarePulseShape extends AbstractShape {
/**
* @param {number} length
* @param {number=} pulseWidth
*/
constructor(length, pulseWidth) {
  super(length, StringShapes.en.SQUARE_PULSE, StringShapes.i18n.SQUARE_PULSE);
  /**
  * @type {number}
  * @private
  */
  this.w_ = pulseWidth || length/8;
};

/** @override */
getClassName() {
  return 'SquarePulseShape';
};

/** @override */
position(x) {
  var middle = this.length_/2;
  return (x >= middle-this.w_ && x <= middle+this.w_) ? 0.1 : 0.0;
};

/** @override */
velocity(x) {
  return 0;
};

} // end class
StringShapes.SquarePulseShape = SquarePulseShape;

// ===============================================================
class TrianglePulseShape extends AbstractShape {
/**
* @param {number} length
*/
constructor(length) {
  super(length, StringShapes.en.TRIANGLE_PULSE, StringShapes.i18n.TRIANGLE_PULSE);
  /**
  * @type {number}
  * @private
  */
  this.w_ = length/8;
};

/** @override */
getClassName() {
  return 'TrianglePulseShape';
};

/** @override */
position(x) {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return 0.1*((x < 0) ? x/this.w_ + 1 : -x/this.w_ + 1);
  }
};

/** @override */
velocity(x) {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return -(0.1/this.w_)*((x < 0) ? 1 : -1);
  }
};

} // end class
StringShapes.TrianglePulseShape = TrianglePulseShape;

// ===============================================================
class SinePulseShape extends AbstractShape {
/**
* @param {number} length
*/
constructor(length) {
  super(length, StringShapes.en.SINE_PULSE, StringShapes.i18n.SINE_PULSE);
  /**
  * @type {number}
  * @private
  */
  this.w_ = length/8;
};

/** @override */
getClassName() {
  return 'SinePulseShape';
};

/** @override */
position(x) {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return 0.05*Math.sin(Math.PI*x/this.w_);
  }
};

/** @override */
velocity(x) {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return -0.05*(Math.PI/this.w_)*Math.cos(Math.PI*x/this.w_);
  }
};

} // end class
StringShapes.SinePulseShape = SinePulseShape;

// ===============================================================
class HalfSinePulseShape extends AbstractShape {
/**
* @param {number} length
*/
constructor(length) {
  super(length, StringShapes.en.HALF_SINE_PULSE, StringShapes.i18n.HALF_SINE_PULSE);
  /**
  * @type {number}
  * @private
  */
  this.w_ = length/3;
};

/** @override */
getClassName() {
  return 'HalfSinePulseShape';
};

/** @override */
position(x) {
  if (x > this.w_)
    return 0;
  else
    return 0.05*Math.sin(Math.PI*x/this.w_);
};

/** @override */
velocity(x) {
  return 0;
};

} // end class
StringShapes.HalfSinePulseShape = HalfSinePulseShape;

// ===============================================================
class MultiSineShape extends AbstractShape {
/**
* @param {number} length
*/
constructor(length) {
  super(length, StringShapes.en.MULTI_SINE, StringShapes.i18n.MULTI_SINE);
};

/** @override */
getClassName() {
  return 'MultiSineShape';
};

/** @override */
position(x) {
  return 0.1*(Math.sin(2*Math.PI*x/this.length_)
      + Math.sin(4*Math.PI*x/this.length_)
      + Math.sin(6*Math.PI*x/this.length_))/3;
};

/** @override */
velocity(x) {
  return 0;
};

} // end class
StringShapes.MultiSineShape = MultiSineShape;

// ===============================================================
class TriangleShape extends AbstractShape {
/**
* @param {number} length
*/
constructor(length) {
  super(length, StringShapes.en.TRIANGLE, StringShapes.i18n.TRIANGLE);
};

/** @override */
getClassName() {
  return 'TriangleShape';
};

/** @override */
position(x) {
  return 0.2*(x < this.length_/2 ? x/this.length_ : 1 - x/this.length_);
};

/** @override */
velocity(x) {
  return 0;
};

} // end class
StringShapes.TriangleShape = TriangleShape;

// ===============================================================
/** Set of internationalized strings.
@typedef {{
  FLAT: string,
  HALF_SINE_PULSE: string,
  MULTI_SINE: string,
  SINE_PULSE: string,
  SQUARE_PULSE: string,
  TRIANGLE: string,
  TRIANGLE_PULSE: string
  }}
*/
StringShapes.i18n_strings;

/**
@type {StringShapes.i18n_strings}
*/
StringShapes.en = {
  FLAT: 'Flat',
  HALF_SINE_PULSE: 'Half Sine Pulse',
  MULTI_SINE: 'Multiple Sine',
  SINE_PULSE: 'Sine Pulse',
  SQUARE_PULSE: 'Square Pulse',
  TRIANGLE: 'Triangle',
  TRIANGLE_PULSE: 'Triangle Pulse'
};

/**
@private
@type {StringShapes.i18n_strings}
*/
StringShapes.de_strings = {
  FLAT: 'Flach',
  MULTI_SINE: 'Merhfach Sine',
  HALF_SINE_PULSE: 'Halbes Sine Puls',
  SINE_PULSE: 'Sine Pulse',
  SQUARE_PULSE: 'Quadrat Puls',
  TRIANGLE: 'Dreieck',
  TRIANGLE_PULSE: 'Dreieck Puls'
};

/** Set of internationalized strings.
@type {StringShapes.i18n_strings}
*/
StringShapes.i18n = goog.LOCALE === 'de' ? StringShapes.de_strings :
    StringShapes.en;

exports = StringShapes;
