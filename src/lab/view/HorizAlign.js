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

goog.provide('myphysicslab.lab.view.HorizAlign');

goog.scope(function() {

/** Horizontal alignment enum, used to specify how to align a LabView's simulation
rectangle within its screen rectangle. See {@link myphysicslab.lab.view.CoordMap#make},
{@link myphysicslab.lab.view.SimView#setHorizAlign}.

Also used for alignment of DisplayAxes,
see {@link myphysicslab.lab.graph.DisplayAxes#setYAxisAlignment}.

* Note that enum types do not appear correctly in the documentation, they appear
* as the underlying type (string, number, boolean) instead of the enum type.
* see [Dossier issue #32](https://github.com/jleyba/js-dossier/issues/32).
*
* @enum {string}
*/
myphysicslab.lab.view.HorizAlign = {
  /** align left */
  LEFT: 'LEFT',
  /** align middle */
  MIDDLE: 'MIDDLE',
  /** align right */
  RIGHT: 'RIGHT',
  /** full alignment */
  FULL: 'FULL'
};
var HorizAlign = myphysicslab.lab.view.HorizAlign;

/** Returns array containing all localized enum choices.
* @return {!Array<string>} array containing all localized enum choices.
*/
HorizAlign.getChoices = function() {
  return [HorizAlign.i18n.LEFT,
      HorizAlign.i18n.MIDDLE,
      HorizAlign.i18n.RIGHT,
      HorizAlign.i18n.FULL];
};

/** Returns array containing all possible enum values.
* @return {!Array<!HorizAlign>} array containing all
*    possible enum values.
*/
HorizAlign.getValues = function() {
  return [HorizAlign.LEFT,
          HorizAlign.MIDDLE,
          HorizAlign.RIGHT,
          HorizAlign.FULL];
};

/** Converts a string to an enum.
* @param {string} value the string to convert
* @return {!HorizAlign} the enum corresponding to the value
* @throws {!Error} if the value does not represent a valid enum
*/
HorizAlign.stringToEnum = function(value) {
  var vals = HorizAlign.getValues();
  for (var i=0, len=vals.length; i<len; i++) {
    if (value === vals[i]) {
      return vals[i];
    }
  }
  throw new Error('invalid HorizAlign value:  '+value);
};

/** Set of internationalized strings.
@typedef {{
  LEFT: string,
  MIDDLE: string,
  RIGHT: string,
  FULL: string
  }}
*/
HorizAlign.i18n_strings;

/**
@type {HorizAlign.i18n_strings}
*/
HorizAlign.en = {
  LEFT: 'left',
  MIDDLE: 'middle',
  RIGHT: 'right',
  FULL: 'full'
};

/**
@private
@type {HorizAlign.i18n_strings}
*/
HorizAlign.de_strings = {
  LEFT: 'links',
  MIDDLE: 'mitte',
  RIGHT: 'rechts',
  FULL: 'voll'
};

/** Set of internationalized strings.
@type {HorizAlign.i18n_strings}
*/
HorizAlign.i18n = goog.LOCALE === 'de' ? HorizAlign.de_strings :
    HorizAlign.en;

}); // goog.scope
