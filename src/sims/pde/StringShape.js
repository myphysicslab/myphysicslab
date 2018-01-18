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

goog.provide('myphysicslab.sims.pde.StringShape');
goog.provide('myphysicslab.sims.pde.FlatShape');
goog.provide('myphysicslab.sims.pde.SquarePulseShape');
goog.provide('myphysicslab.sims.pde.TrianglePulseShape');
goog.provide('myphysicslab.sims.pde.SinePulseShape');
goog.provide('myphysicslab.sims.pde.HalfSinePulseShape');
goog.provide('myphysicslab.sims.pde.MultiSineShape');
goog.provide('myphysicslab.sims.pde.TriangleShape');

goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Defines initial conditions of a string used in the
{@link myphysicslab.sims.pde.StringSim} PDE simulation by specifying the initial displacement
and velocity at each point of the string.

### How to find the correct velocity for a traveling wave:

The d'Alembert equation for a left-moving traveling wave is `f(x + ct)`, where `f()`
is a general single-variable waveform, think of it as `f(x)` moving to
the left as `t` increases.  The velocity (partial derivative with respect
to time) is then `c f'(x + ct)` which at time `t=0` is  `c f'(x)`.
So take the first derivative of the waveform, and multiply by `c`
where `c` is the wave speed `= sqrt(tension/density)`.
Right-moving wave is `f(x - ct)` with derivative `-c f'(x)`

* @param {number} length
* @param {string} name
* @param {string=} opt_localName localized name of this SimObject (optional)
* @constructor
* @abstract
* @struct
*/
myphysicslab.sims.pde.StringShape = function(length, name, opt_localName) {
  if (length < 1e-16) {
    throw new Error();
  }
  /**
  * @type {number}
  * @protected
  */
  this.length_ = length;
  /**
  * @type {string}
  * @private
  */
  this.name_ = Util.toName(name);
  /**
  * @type {string}
  * @private
  */
  this.localName_ = opt_localName || name;
};
var StringShape = myphysicslab.sims.pde.StringShape;

/** @override */
StringShape.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.getClassName()+'{name_: "'+this.name_+'"'
      +', length_: '+Util.NF(this.length_)
      +'}';
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
* @abstract
*/
StringShape.prototype.getClassName = function() {};

/** Returns the length of the string.
@return {number} length of the string
*/
StringShape.prototype.getLength = function() {
  return this.length_;
};

/** Name of this StringShape, either a the language-independent name for scripting
purposes or the localized name for display to user.
@param {boolean=} opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return {string} name of this StringShape
*/
StringShape.prototype.getName = function(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** Returns the initial displacement at a point on the string.
@param {number} x  the location of the point of the string
@return {number} the displacement at that point of the string
@abstract
*/
StringShape.prototype.position = function(x) {};

/** Returns the initial velocity at a point of the string.
@param {number} x  the location of the point of the string
@return {number} the velocity at that point of the string
@abstract
*/
StringShape.prototype.velocity = function(x) {};



// ===============================================================
/**
* @param {number} length
* @constructor
* @final
* @struct
* @extends {StringShape}
*/
myphysicslab.sims.pde.FlatShape = function(length) {
  StringShape.call(this, length, StringShape.en.FLAT, StringShape.i18n.FLAT);
};
var FlatShape = myphysicslab.sims.pde.FlatShape;
goog.inherits(FlatShape, StringShape);

/** @override */
FlatShape.prototype.getClassName = function() {
  return 'FlatShape';
};

/** @override */
FlatShape.prototype.position = function(x) {
  return 0;
};

/** @override */
FlatShape.prototype.velocity = function(x) {
  return 0;
};



// ===============================================================
/**
* @param {number} length
* @param {number=} pulseWidth
* @constructor
* @final
* @struct
* @extends {StringShape}
*/
myphysicslab.sims.pde.SquarePulseShape = function(length, pulseWidth) {
  StringShape.call(this, length, StringShape.en.SQUARE_PULSE,
      StringShape.i18n.SQUARE_PULSE);
  /**
  * @type {number}
  * @private
  */
  this.w_ = pulseWidth || length/8;
};
var SquarePulseShape = myphysicslab.sims.pde.SquarePulseShape;
goog.inherits(SquarePulseShape, StringShape);

/** @override */
SquarePulseShape.prototype.getClassName = function() {
  return 'SquarePulseShape';
};

/** @override */
SquarePulseShape.prototype.position = function(x) {
  var middle = this.length_/2;
  return (x >= middle-this.w_ && x <= middle+this.w_) ? 0.1 : 0.0;
};

/** @override */
SquarePulseShape.prototype.velocity = function(x) {
  return 0;
};



// ===============================================================
/**
* @param {number} length
* @constructor
* @final
* @struct
* @extends {StringShape}
*/
myphysicslab.sims.pde.TrianglePulseShape = function(length) {
  StringShape.call(this, length, StringShape.en.TRIANGLE_PULSE,
      StringShape.i18n.TRIANGLE_PULSE);
  /**
  * @type {number}
  * @private
  */
  this.w_ = length/8;
};
var TrianglePulseShape = myphysicslab.sims.pde.TrianglePulseShape;
goog.inherits(TrianglePulseShape, StringShape);

/** @override */
TrianglePulseShape.prototype.getClassName = function() {
  return 'TrianglePulseShape';
};

/** @override */
TrianglePulseShape.prototype.position = function(x) {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return 0.1*((x < 0) ? x/this.w_ + 1 : -x/this.w_ + 1);
  }
};

/** @override */
TrianglePulseShape.prototype.velocity = function(x) {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return -(0.1/this.w_)*((x < 0) ? 1 : -1);
  }
};



// ===============================================================
/**
* @param {number} length
* @constructor
* @final
* @struct
* @extends {StringShape}
*/
myphysicslab.sims.pde.SinePulseShape = function(length) {
  StringShape.call(this, length, StringShape.en.SINE_PULSE,
      StringShape.i18n.SINE_PULSE);
  /**
  * @type {number}
  * @private
  */
  this.w_ = length/8;
};
var SinePulseShape = myphysicslab.sims.pde.SinePulseShape;
goog.inherits(SinePulseShape, StringShape);

/** @override */
SinePulseShape.prototype.getClassName = function() {
  return 'SinePulseShape';
};

/** @override */
SinePulseShape.prototype.position = function(x) {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return 0.05*Math.sin(Math.PI*x/this.w_);
  }
};

/** @override */
SinePulseShape.prototype.velocity = function(x) {
  x = x - this.w_;
  if (x < -this.w_ || x > this.w_) {
    return 0;
  } else {
    return -0.05*(Math.PI/this.w_)*Math.cos(Math.PI*x/this.w_);
  }
};


// ===============================================================
/**
* @param {number} length
* @constructor
* @final
* @struct
* @extends {StringShape}
*/
myphysicslab.sims.pde.HalfSinePulseShape = function(length) {
  StringShape.call(this, length, StringShape.en.HALF_SINE_PULSE,
      StringShape.i18n.HALF_SINE_PULSE);
  /**
  * @type {number}
  * @private
  */
  this.w_ = length/3;
};
var HalfSinePulseShape = myphysicslab.sims.pde.HalfSinePulseShape;
goog.inherits(HalfSinePulseShape, StringShape);

/** @override */
HalfSinePulseShape.prototype.getClassName = function() {
  return 'HalfSinePulseShape';
};

/** @override */
HalfSinePulseShape.prototype.position = function(x) {
  if (x > this.w_)
    return 0;
  else
    return 0.05*Math.sin(Math.PI*x/this.w_);
};

/** @override */
HalfSinePulseShape.prototype.velocity = function(x) {
  return 0;
};



// ===============================================================
/**
* @param {number} length
* @constructor
* @final
* @struct
* @extends {StringShape}
*/
myphysicslab.sims.pde.MultiSineShape = function(length) {
  StringShape.call(this, length, StringShape.en.MULTI_SINE,
      StringShape.i18n.MULTI_SINE);
};
var MultiSineShape = myphysicslab.sims.pde.MultiSineShape;
goog.inherits(MultiSineShape, StringShape);

/** @override */
MultiSineShape.prototype.getClassName = function() {
  return 'MultiSineShape';
};

/** @override */
MultiSineShape.prototype.position = function(x) {
  return 0.1*(Math.sin(2*Math.PI*x/this.length_)
      + Math.sin(4*Math.PI*x/this.length_)
      + Math.sin(6*Math.PI*x/this.length_))/3;
};

/** @override */
MultiSineShape.prototype.velocity = function(x) {
  return 0;
};



// ===============================================================
/**
* @param {number} length
* @constructor
* @final
* @struct
* @extends {StringShape}
*/
myphysicslab.sims.pde.TriangleShape = function(length) {
  StringShape.call(this, length, StringShape.en.TRIANGLE, StringShape.i18n.TRIANGLE);
};
var TriangleShape = myphysicslab.sims.pde.TriangleShape;
goog.inherits(TriangleShape, StringShape);

/** @override */
TriangleShape.prototype.getClassName = function() {
  return 'TriangleShape';
};

/** @override */
TriangleShape.prototype.position = function(x) {
  return 0.2*(x < this.length_/2 ? x/this.length_ : 1 - x/this.length_);
};

/** @override */
TriangleShape.prototype.velocity = function(x) {
  return 0;
};

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
StringShape.i18n_strings;

/**
@type {StringShape.i18n_strings}
*/
StringShape.en = {
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
@type {StringShape.i18n_strings}
*/
StringShape.de_strings = {
  FLAT: 'Flach',
  MULTI_SINE: 'Merhfach Sine',
  HALF_SINE_PULSE: 'Halbes Sine Puls',
  SINE_PULSE: 'Sine Pulse',
  SQUARE_PULSE: 'Quadrat Puls',
  TRIANGLE: 'Dreieck',
  TRIANGLE_PULSE: 'Dreieck Puls'
};

/** Set of internationalized strings.
@type {StringShape.i18n_strings}
*/
StringShape.i18n = goog.LOCALE === 'de' ? StringShape.de_strings :
    StringShape.en;

}); // goog.scope
