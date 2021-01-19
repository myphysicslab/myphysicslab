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

goog.module('myphysicslab.lab.view.VerticalAlign');

/** Vertical alignment enum, used to specify how to align a LabView's simulation
rectangle within its screen rectangle. See {@link myphysicslab.lab.view.CoordMap#make},
{@link myphysicslab.lab.view.SimView#setVerticalAlign}.

Also used for alignment of DisplayAxes,
see {@link myphysicslab.lab.graph.DisplayAxes#setXAxisAlignment}.

* Note that enum types do not appear correctly in the documentation, they appear
* as the underlying type (string, number, boolean) instead of the enum type.
* see [Dossier issue #32](https://github.com/jleyba/js-dossier/issues/32).
*
* @enum {string}
*/
const VerticalAlign = {
  /** align top */
  TOP: 'TOP',
  /** align middle */
  MIDDLE: 'MIDDLE',
  /** align bottom */
  BOTTOM: 'BOTTOM',
  /** full alignment */
  FULL: 'FULL',
  /** align at a particular value (specified elsewhere) */
  VALUE: 'VALUE'
};

/** Returns array containing all localized enum choices.
* @return {!Array<string>} array containing all localized enum choices.
*/
VerticalAlign.getChoices = () =>
  [ VerticalAlign.i18n.TOP,
    VerticalAlign.i18n.MIDDLE,
    VerticalAlign.i18n.BOTTOM,
    VerticalAlign.i18n.FULL,
    VerticalAlign.i18n.VALUE ];

/** Returns array containing all possible enum values.
* @return {!Array<!VerticalAlign>} array containing all possible enum values.
*/
VerticalAlign.getValues = () =>
  [ VerticalAlign.TOP,
    VerticalAlign.MIDDLE,
    VerticalAlign.BOTTOM,
    VerticalAlign.FULL,
    VerticalAlign.VALUE ];

/** Converts a string to an enum.
* @param {string} value the string to convert
* @return {!VerticalAlign} the enum corresponding to the value
* @throws {!Error} if the value does not represent a valid enum
*/
VerticalAlign.stringToEnum = value => {
  const vals = VerticalAlign.getValues();
  for (let i=0, len=vals.length; i<len; i++) {
    if (value === vals[i]) {
      return vals[i];
    }
  }
  throw 'invalid VerticalAlign value: '+value;
};

/** Set of internationalized strings.
@typedef {{
  TOP: string,
  MIDDLE: string,
  BOTTOM: string,
  FULL: string,
  VALUE: string
  }}
*/
VerticalAlign.i18n_strings;

/**
@type {VerticalAlign.i18n_strings}
*/
VerticalAlign.en = {
  TOP: 'top',
  MIDDLE: 'middle',
  BOTTOM: 'bottom',
  FULL: 'full',
  VALUE: 'value'
};

/**
@private
@type {VerticalAlign.i18n_strings}
*/
VerticalAlign.de_strings = {
  TOP: 'oben',
  MIDDLE: 'mitte',
  BOTTOM: 'unten',
  FULL: 'voll',
  VALUE: 'Wert'
};

/** Set of internationalized strings.
@type {VerticalAlign.i18n_strings}
*/
VerticalAlign.i18n = goog.LOCALE === 'de' ? VerticalAlign.de_strings :
    VerticalAlign.en;

exports = VerticalAlign;
