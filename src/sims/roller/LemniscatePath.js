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

goog.provide('myphysicslab.sims.roller.LemniscatePath');

goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.sims.roller.AbstractPath');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;
var AbstractPath = myphysicslab.sims.roller.AbstractPath;
var NF = myphysicslab.lab.util.UtilityCore.NF;

/** Lemniscate curve; a 'figure eight' path.

Equation in polar coords is:

    r^2  =  2 a^2  cos(2t)

    r = (+/-) a Sqrt(2 cos(2t))

where a=constant, t=angle from -Pi/4 to Pi/4, and r=radius

To get both lobes with the direction of travel increasing across the origin, define

    T = -t + Pi/2

Then

    r = a Sqrt(2 cos(2t))   for -Pi/4 < t < Pi/4
    r = -a Sqrt(2 cos(2T))   for Pi/4 < t < 3 Pi/4

To get into Cartesian coords, we use

    x = r cos(t)
    y = r sin(t)

* @param {number} size
* @param {number=} start
* @param {number=} finish
* @param {boolean=} closedLoop
* @param {string=} name
* @param {string=} localName
* @constructor
* @final
* @struct
* @extends {AbstractPath}
*/
myphysicslab.sims.roller.LemniscatePath = function(size, start, finish,
      closedLoop, name, localName) {
  if (!goog.isNumber(start))
    start = -Math.PI/4;
  if (!goog.isNumber(finish))
    finish = 3*Math.PI/4;
  if (!goog.isDef(closedLoop))
    closedLoop = true;
  name = name || LemniscatePath.en.NAME;
  localName = localName || LemniscatePath.i18n.NAME;
  AbstractPath.call(this, name, localName, start, finish, closedLoop);
  /** @type {number}
  * @private
  * @const
  */
  this.a_ = size;
};
var LemniscatePath = myphysicslab.sims.roller.LemniscatePath;
goog.inherits(LemniscatePath, AbstractPath);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  LemniscatePath.prototype.toString = function() {
    return LemniscatePath.superClass_.toString.call(this).slice(0, -1)
        + ', size: '+NF(this.a_)+'}';
  };
};

/** @inheritDoc */
LemniscatePath.prototype.getClassName = function() {
  return 'LemniscatePath';
};

/** @inheritDoc */
LemniscatePath.prototype.x_func = function(t) {
  if (t<=Math.PI/4) {
    return this.a_ *Math.sqrt(2*Math.cos(2*t))*Math.cos(t);
  } else if (t<=3*Math.PI/4) {
    var T = -t + Math.PI/2;
    return -this.a_ *Math.sqrt(2*Math.cos(2*T))*Math.cos(T);
  } else {
    return 0;
  }
};

/** @inheritDoc */
LemniscatePath.prototype.y_func = function(t) {
  if (t<=Math.PI/4) {
    return this.a_*Math.sqrt(2*Math.cos(2*t))*Math.sin(t);
  } else if (t<=3*Math.PI/4) {
    var T = -t + Math.PI/2;
    return -this.a_*Math.sqrt(2*Math.cos(2*T))*Math.sin(T);
  } else {
    return 0;
  }
};

/** Set of internationalized strings.
@typedef {{
  NAME: string
  }}
*/
LemniscatePath.i18n_strings;

/**
@type {LemniscatePath.i18n_strings}
*/
LemniscatePath.en = {
  NAME: 'Lemniscate'
};

/**
@private
@type {LemniscatePath.i18n_strings}
*/
LemniscatePath.de_strings = {
  NAME: 'Lemniscate'
};

/** Set of internationalized strings.
@type {LemniscatePath.i18n_strings}
*/
LemniscatePath.i18n = goog.LOCALE === 'de' ? LemniscatePath.de_strings :
    LemniscatePath.en;

}); // goog.scope
