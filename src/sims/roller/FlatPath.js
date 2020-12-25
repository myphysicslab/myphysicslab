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

goog.module('myphysicslab.sims.roller.FlatPath');

const Util = goog.require('myphysicslab.lab.util.Util');
const AbstractPath = goog.require('myphysicslab.sims.roller.AbstractPath');

/** A horizontal flat path.
*/
class FlatPath extends AbstractPath {
/**
* @param {number=} start
* @param {number=} finish
* @param {string=} name
* @param {string=} localName
*/
constructor(start, finish, name, localName) {
  if (typeof start !== 'number')
    start = -5;
  if (typeof finish !== 'number')
    finish = 5;
  name = name || FlatPath.en.NAME;
  localName = localName || FlatPath.i18n.NAME;
  super(name, localName, start, finish, /*closedLoop=*/false);
};

/** @override */
getClassName() {
  return 'FlatPath';
};

/** @override */
x_func(t) {
  return t;
};

/** @override */
y_func(t) {
  return 0;
};

} // end class

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

exports = FlatPath;
