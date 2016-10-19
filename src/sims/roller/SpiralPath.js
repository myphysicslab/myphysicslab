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

goog.provide('myphysicslab.sims.roller.SpiralPath');

goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.sims.roller.AbstractPath');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;
var AbstractPath = myphysicslab.sims.roller.AbstractPath;

/** A spiral shaped path.
See the Mathematica file Rollercurves.nb for construction.

* @constructor
* @final
* @struct
* @extends {myphysicslab.sims.roller.AbstractPath}
*/
myphysicslab.sims.roller.SpiralPath = function() {
  /** center of upper arc
  * @type {number}
  * @private
  * @const
  */
  this.arc1x = -2.50287;
  /** center of upper arc
  * @type {number}
  * @private
  * @const
  */
  this.arc1y = 5.67378;
  /** radius of the arcs
  * @type {number}
  * @private
  * @const
  */
  this.rad = 1;
  /** t value at inside of spiral
  * @type {number}
  * @private
  * @const
  */
  this.slo = 4.91318;
  /** inside point of spiral
  * @type {number}
  * @private
  * @const
  */
  this.slox = 0.122489;
  /** inside point of spiral
  * @type {number}
  * @private
  * @const
  */
  this.sloy = -0.601809;
  /** t value at outside of spiral
  * @type {number}
  * @private
  * @const
  */
  this.shi = 25.9566;
  /** outside point of spiral
  * @type {number}
  * @private
  * @const
  */
  this.shix = 2.20424;
  /** outside point of spiral
  * @type {number}
  * @private
  * @const
  */
  this.shiy = 2.38089;
  /** center of lower arc
  * @type {number}
  * @private
  * @const
  */
  this.arc2y = this.sloy + this.rad;
  /** right point of upper arc
  * @type {number}
  * @private
  * @const
  */
  this.arc1rx = this.arc1x + Math.cos(Math.PI/4);
  /** end of upper arc
  * @type {number}
  * @private
  * @const
  */
  this.t1 = Math.PI/2;
  /** end of left vertical line
  * @type {number}
  * @private
  * @const
  */
  this.t2 = this.t1 + this.arc1y - this.arc2y;
  /** end of lower arc
  * @type {number}
  * @private
  * @const
  */
  this.t3 = this.t2 + Math.PI/2;
  /** end of horiz line, start of spiral
  * @type {number}
  * @private
  * @const
  */
  this.t4 = this.t3 + this.slox - this.arc1x;
  /** end of spiral
  * @type {number}
  * @private
  * @const
  */
  this.t5 = this.t4 + this.shi - this.slo;
  /** end of diagonal line
  * @type {number}
  * @private
  * @const
  */
  this.t6 = this.t5 + Math.sqrt(2)*(this.shix-this.arc1rx);
  /** top of upper arc
  * @type {number}
  * @private
  * @const
  */
  this.t7 = this.t6 + Math.PI/4;

  AbstractPath.call(this, SpiralPath.en.NAME, SpiralPath.i18n.NAME, /*start=*/0,
      /*finish=*/this.t7, /*closedLoop=*/true);
};
var SpiralPath = myphysicslab.sims.roller.SpiralPath;
goog.inherits(SpiralPath, AbstractPath);

/** @inheritDoc */
SpiralPath.prototype.getClassName = function() {
  return 'SpiralPath';
};

/** @inheritDoc */
SpiralPath.prototype.x_func = function(t) {
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
SpiralPath.prototype.y_func = function(t) {
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

/** Set of internationalized strings.
@typedef {{
  NAME: string
  }}
*/
SpiralPath.i18n_strings;

/**
@type {SpiralPath.i18n_strings}
*/
SpiralPath.en = {
  NAME: 'Spiral'
};

/**
@private
@type {SpiralPath.i18n_strings}
*/
SpiralPath.de_strings = {
  NAME: 'Spirale'
};

/** Set of internationalized strings.
@type {SpiralPath.i18n_strings}
*/
SpiralPath.i18n = goog.LOCALE === 'de' ? SpiralPath.de_strings :
    SpiralPath.en;

}); // goog.scope
