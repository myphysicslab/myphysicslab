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

goog.provide('myphysicslab.sims.roller.CirclePath');

goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.sims.roller.AbstractPath');

goog.scope(function() {

var Util = goog.module.get('myphysicslab.lab.util.Util');
var AbstractPath = myphysicslab.sims.roller.AbstractPath;

/** Circular path centered at the origin.

* @param {number} radius
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
myphysicslab.sims.roller.CirclePath = function(radius, start, finish,
      closedLoop, name, localName) {
  if (!goog.isNumber(start))
    start = -3*Math.PI/2;
  if (!goog.isNumber(finish))
    finish = Math.PI/2;
  if (!goog.isDef(closedLoop))
    closedLoop = true;
  name = name || CirclePath.en.NAME;
  localName = localName || CirclePath.i18n.NAME;
  AbstractPath.call(this, name, localName, start, finish, closedLoop);
  /** @type {number}
  * @private
  * @const
  */
  this.radius_ = radius;
};
var CirclePath = myphysicslab.sims.roller.CirclePath;
goog.inherits(CirclePath, AbstractPath);

if (!Util.ADVANCED) {
  /** @override */
  CirclePath.prototype.toString = function() {
    return CirclePath.superClass_.toString.call(this).slice(0, -1)
        + ', radius_: '+Util.NF(this.radius_)+'}';
  };
};

/** @override */
CirclePath.prototype.getClassName = function() {
  return 'CirclePath';
};

/** @override */
CirclePath.prototype.x_func = function(t) {
  return this.radius_*Math.cos(t);
};

/** @override */
CirclePath.prototype.y_func = function(t) {
  return this.radius_*Math.sin(t);
};

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

}); // goog.scope
