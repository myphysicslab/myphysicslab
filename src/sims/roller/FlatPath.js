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

goog.provide('myphysicslab.sims.roller.FlatPath');

goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.sims.roller.AbstractPath');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;
var AbstractPath = myphysicslab.sims.roller.AbstractPath;

/** A horizontal flat path.

* @param {number=} start
* @param {number=} finish
* @param {string=} name
* @param {string=} localName
* @constructor
* @final
* @struct
* @extends {myphysicslab.sims.roller.AbstractPath}
*/
myphysicslab.sims.roller.FlatPath = function(start, finish, name, localName) {
  if (!goog.isNumber(start))
    start = -5;
  if (!goog.isNumber(finish))
    finish = 5;
  name = name || FlatPath.en.NAME;
  localName = localName || FlatPath.i18n.NAME;
  AbstractPath.call(this, name, localName, start, finish, /*closedLoop=*/false);
};
var FlatPath = myphysicslab.sims.roller.FlatPath;
goog.inherits(FlatPath, AbstractPath);

/** @inheritDoc */
FlatPath.prototype.getClassName = function() {
  return 'FlatPath';
};

/** @inheritDoc */
FlatPath.prototype.x_func = function(t) {
  return t;
};

/** @inheritDoc */
FlatPath.prototype.y_func = function(t) {
  return 0;
};

/** Set of internationalized strings.
@typedef {{
  NAME: string
  }}
*/
FlatPath.i18n_strings;

/**
@type {FlatPath.i18n_strings}
*/
FlatPath.en = {
  NAME: 'Flat'
};

/**
@private
@type {FlatPath.i18n_strings}
*/
FlatPath.de_strings = {
  NAME: 'Horizontale'
};

/** Set of internationalized strings.
@type {FlatPath.i18n_strings}
*/
FlatPath.i18n = goog.LOCALE === 'de' ? FlatPath.de_strings :
    FlatPath.en;

}); // goog.scope
