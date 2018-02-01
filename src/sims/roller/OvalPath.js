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

goog.module('myphysicslab.sims.roller.OvalPath');

const Util = goog.require('myphysicslab.lab.util.Util');
const AbstractPath = goog.require('myphysicslab.sims.roller.AbstractPath');

/** A path like an oval racetrack with vertical sections. The straight
sections are vertical, so it is a good test for handling infinite slope situations.

The parameter, `t` starts at pi/2, corresponding to the topmost point of the oval.

    t = pi/2 to pi is upper left quarter circle from top going counter clockwise
    t = pi to 2+pi is straight down section
    t = 2+pi to 2+2*pi is the bottom half circle (ccw)
    t = 2 + 2*pi to 4 + 2*pi is straight up section
    t = 4+2*pi to 4+ (5/2)*pi is upper right quarter circle

*/
class OvalPath extends AbstractPath {
/**
* @param {number=} straight
* @param {string=} name
* @param {string=} localName
*/
constructor(straight, name, localName) {
  name = name || OvalPath.en.NAME;
  localName = localName || OvalPath.i18n.NAME;
  super(name, localName, /*start=*/0, /*finish=*/0, /*closedLoop=*/true);
  if (!goog.isNumber(straight)) {
    straight = 2.0;
  }
  /** length of straight section
  * @type {number}
  * @private
  * @const
  */
  this.s_ = straight;
  /** top of upper arc
  * @type {number}
  * @private
  * @const
  */
  this.t0_ = Math.PI/2;
  /** left end of upper arc
  * @type {number}
  * @private
  * @const
  */
  this.t1_ = Math.PI;
  /** bottom of left vertical line
  * @type {number}
  * @private
  * @const
  */
  this.t2_ = this.t1_ + this.s_;
  /** right end of lower arc
  * @type {number}
  * @private
  * @const
  */
  this.t3_ = this.t2_ + Math.PI;
  /** top of right vertical line
  * @type {number}
  * @private
  * @const
  */
  this.t4_ = this.t3_ + this.s_;
  /** top of upper arc
  * @type {number}
  * @private
  * @const
  */
  this.t5_ = this.t4_ + Math.PI/2;
  this.setStartTValue(this.t0_);
  this.setFinishTValue(this.t5_);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : super.toString().slice(0, -1)
      + ', straight: '+Util.NF(this.s_)+'}';
};

/** @override */
getClassName() {
  return 'OvalPath';
};

/** @override */
x_func(t) {
  if (t<this.t1_)
    return Math.cos(t);
  else if (t<this.t2_)
    return -1;
  else if (t< this.t3_)
    return Math.cos(Math.PI + t-this.t2_);
  else if (t< this.t4_)
    return 1;
  else if (t<this.t5_)
    return Math.cos(t-this.t4_);
  else
    return 0;
};

/** @override */
y_func(t) {
  if (t<this.t1_)
    return this.s_+Math.sin(t);
  else if (t<this.t2_)
    return this.s_ - (t-this.t1_);
  else if (t< this.t3_)
    return Math.sin(Math.PI + t-this.t2_);
  else if (t< this.t4_)
    return t-this.t3_;
  else if (t<this.t5_)
    return this.s_ + Math.sin(t-this.t4_);
  else
    return 0;
};

} // end class

/** Set of internationalized strings.
@typedef {{
  NAME: string
  }}
*/
OvalPath.i18n_strings;

/**
@type {OvalPath.i18n_strings}
*/
OvalPath.en = {
  NAME: 'Oval'
};

/**
@private
@type {OvalPath.i18n_strings}
*/
OvalPath.de_strings = {
  NAME: 'Oval'
};

/** Set of internationalized strings.
@type {OvalPath.i18n_strings}
*/
OvalPath.i18n = goog.LOCALE === 'de' ? OvalPath.de_strings :
    OvalPath.en;

exports = OvalPath;
