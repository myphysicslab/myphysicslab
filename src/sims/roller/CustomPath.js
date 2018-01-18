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

goog.provide('myphysicslab.sims.roller.CustomPath');

goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.sims.roller.AbstractPath');

goog.scope(function() {

var Terminal = myphysicslab.lab.util.Terminal;
const Util = goog.module.get('myphysicslab.lab.util.Util');
var AbstractPath = myphysicslab.sims.roller.AbstractPath;

/** A path defined by custom equations. The equations are JavaScript string
expressions where the parameter is `t`. There is an equation for both the `x` and `y`
value. The equation is checked to conform to
[Safe Subset of JavaScript](myphysicslab.lab.util.Terminal.html#safesubsetofjavascript).

NOTE: This class creates a global variable named `t`.

* @param {number=} start_t starting `t` value
* @param {number=} finish_t ending `t` value
* @param {string=} name
* @param {string=} localName
* @constructor
* @final
* @struct
* @extends {AbstractPath}
*/
myphysicslab.sims.roller.CustomPath = function(start_t, finish_t, name, localName) {
  if (!goog.isNumber(start_t))
    start_t = -3;
  if (!goog.isNumber(finish_t))
    finish_t = 3;
  name = name || CustomPath.en.NAME;
  localName = localName || CustomPath.i18n.NAME;
  AbstractPath.call(this, name, localName, start_t, finish_t, /*closedLoop=*/false);
  /**
  * @type {string}
  * @private
  */
  this.equationX_ = 't';
  /**
  * @type {string}
  * @private
  */
  this.equationY_ = '3 + t*t*(-7 + 1.2*t*t)/6';
};
var CustomPath = myphysicslab.sims.roller.CustomPath;
goog.inherits(CustomPath, AbstractPath);

/** @override */
CustomPath.prototype.toString = function() {
  return Util.ADVANCED ? '' : CustomPath.superClass_.toString.call(this).slice(0, -1)
    +', equationX_: "'+this.equationX_+'"'
    +', equationY_: "'+this.equationY_+'"'
    +'}';
};

/** @override */
CustomPath.prototype.getClassName = function() {
  return 'CustomPath';
};

/** Returns the parameteric X equation defining the path.
* @return {string} the parameteric X equation defining the path
*/
CustomPath.prototype.getXEquation = function() {
  return this.equationX_;
};

/** Returns the parameteric Y equation defining the path.
* @return {string} the parameteric Y equation defining the path
*/
CustomPath.prototype.getYEquation = function() {
  return this.equationY_;
};

/** Sets the parameteric X equation defining the path. A JavaScript expression where
the parameter is `t`.
* @param {string} value the parameteric X equation defining the path
* @throws {!Error} if the equation fails checks for
*    [Safe Subset of JavaScript](myphysicslab.lab.util.Terminal.html#safesubsetofjavascript)
*/
CustomPath.prototype.setXEquation = function(value) {
  value = Terminal.deUnicode(value);
  Terminal.vetCommand(value, /*whiteList=*/['t'], /*blackList=*//\beval\b/g);
  Terminal.vetBrackets(value);
  this.equationX_ = value;
};

/** Sets the parameteric Y equation defining the path. A JavaScript expression where
the parameter is `t`.
* @param {string} value the parameteric Y equation defining the path
* @throws {!Error} if the equation fails checks for
*    [Safe Subset of JavaScript](myphysicslab.lab.util.Terminal.html#safesubsetofjavascript)
*/
CustomPath.prototype.setYEquation = function(value) {
  value = Terminal.deUnicode(value);
  Terminal.vetCommand(value,  /*whiteList=*/['t'], /*blackList=*//\beval\b/g);
  Terminal.vetBrackets(value);
  this.equationY_ = value;
};

/** @override */
CustomPath.prototype.x_func = function(t) {
  window['t'] = t;
  var r = eval('"use strict"; '+this.equationX_);
  if (goog.isNumber(r) && isFinite(r)) {
    return r;
  } else {
    throw new Error('not a finite number "'+this.equationX_+'" when t='+t);
  }
};

/** @override */
CustomPath.prototype.y_func = function(t) {
  window['t'] = t;
  var r = eval('"use strict"; '+this.equationY_);
  if (goog.isNumber(r) && isFinite(r)) {
    return r;
  } else {
    throw new Error('not a finite number "'+this.equationY_+'" when t='+t);
  }
};

/** Set of internationalized strings.
@typedef {{
  NAME: string
  }}
*/
CustomPath.i18n_strings;

/**
@type {CustomPath.i18n_strings}
*/
CustomPath.en = {
  NAME: 'Custom'
};

/**
@private
@type {CustomPath.i18n_strings}
*/
CustomPath.de_strings = {
  NAME: 'Spezial'
};

/** Set of internationalized strings.
@type {CustomPath.i18n_strings}
*/
CustomPath.i18n = goog.LOCALE === 'de' ? CustomPath.de_strings :
    CustomPath.en;

}); // goog.scope
