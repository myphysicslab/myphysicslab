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

goog.module('myphysicslab.sims.roller.CirclePath');

const Util = goog.require('myphysicslab.lab.util.Util');
const AbstractPath = goog.require('myphysicslab.sims.roller.AbstractPath');

/** Circular path centered at the origin.
*/
class CirclePath extends AbstractPath {
/**
* @param {number} radius
* @param {number=} start
* @param {number=} finish
* @param {boolean=} closedLoop
* @param {string=} name
* @param {string=} localName
*/
constructor(radius, start, finish,
      closedLoop, name, localName) {
  if (!goog.isNumber(start))
    start = -3*Math.PI/2;
  if (!goog.isNumber(finish))
    finish = Math.PI/2;
  if (!goog.isDef(closedLoop))
    closedLoop = true;
  name = name || CirclePath.en.NAME;
  localName = localName || CirclePath.i18n.NAME;
  super(name, localName, start, finish, closedLoop);
  /** @type {number}
  * @private
  * @const
  */
  this.radius_ = radius;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : super.toString().slice(0, -1)
      + ', radius_: '+Util.NF(this.radius_)+'}';
};

/** @override */
getClassName() {
  return 'CirclePath';
};

/** @override */
x_func(t) {
  return this.radius_*Math.cos(t);
};

/** @override */
y_func(t) {
  return this.radius_*Math.sin(t);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  NAME: string
  }}
*/
CirclePath.i18n_strings;

/**
@type {CirclePath.i18n_strings}
*/
CirclePath.en = {
  NAME: 'Circle'
};

/**
@private
@type {CirclePath.i18n_strings}
*/
CirclePath.de_strings = {
  NAME: 'Kreis'
};

/** Set of internationalized strings.
@type {CirclePath.i18n_strings}
*/
CirclePath.i18n = goog.LOCALE === 'de' ? CirclePath.de_strings :
    CirclePath.en;

exports = CirclePath;
