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

goog.provide('myphysicslab.lab.view.DrawingMode');

goog.scope(function() {

/** DrawingMode enum, specifies how the line of a graph or path is drawn.
*
* Note that enum types do not appear correctly in the documentation, they appear
* as the underlying type (string, number, boolean) instead of the enum type.
* see [Dossier issue #32](https://github.com/jleyba/js-dossier/issues/32).
* @enum {string}
*/
myphysicslab.lab.view.DrawingMode = {
  /** Draw the graph as separate dots. */
  DOTS: 'dots',
  /** Draw the graph as connected lines. */
  LINES: 'lines'
};
var DrawingMode = myphysicslab.lab.view.DrawingMode;

/** Converts a localized choice string to an enum.
* @param {string} value the localized choice string to convert
* @return {!DrawingMode} the enum corresponding to the choice
* @throws {Error} if the value does not represent a valid enum
*/
DrawingMode.choiceToEnum = function(value) {
  var choices = DrawingMode.getChoices();
  for (var i=0, len=choices.length; i<len; i++) {
    if (value == choices[i]) {
      return DrawingMode.getValues()[i];
    }
  }
  throw new Error('DrawingMode not found '+value);
};

/** Converts an enum to a localized choice string.
* @param {!DrawingMode} value enum value to convert
* @return {string} the localized choice string corresponding to the enum
* @throws {Error} if the value does not represent a valid enum
*/
DrawingMode.enumToChoice = function(value) {
  var vals = DrawingMode.getValues();
  for (var i=0, len=vals.length; i<len; i++) {
    if (value == vals[i]) {
      return DrawingMode.getChoices()[i];
    }
  }
  throw new Error('not found '+value);
};

/** Returns the localized string versions of the enums in {@link #getValues}.
* @return {!Array<string>} the translated string versions of the enums
*/
DrawingMode.getChoices = function() {
  return [
    DrawingMode.i18n.DOTS,
    DrawingMode.i18n.LINES
  ];
};

/** Returns the set of valid enums.
* @return {!Array<!DrawingMode>} the set of valid enums.
*/
DrawingMode.getValues = function() {
  return [DrawingMode.DOTS,
          DrawingMode.LINES];
};

/** Converts a number to an enum.
* @param {string} value the number to convert
* @return {!DrawingMode} the enum corresponding to the value
* @throws {Error} if the value does not represent a valid enum
*/
DrawingMode.stringToEnum = function(value) {
  var vals = DrawingMode.getValues();
  for (var i=0, len=vals.length; i<len; i++) {
    if (value == vals[i]) {
      return vals[i];
    }
  }
  throw new Error('not found '+value);
};

/** Set of internationalized strings.
@typedef {{
  DOTS: string,
  LINES: string
  }}
*/
DrawingMode.i18n_strings;

/**
@type {DrawingMode.i18n_strings}
*/
DrawingMode.en = {
  DOTS: 'Dots',
  LINES: 'Lines'
};

/**
@private
@type {DrawingMode.i18n_strings}
*/
DrawingMode.de_strings = {
  DOTS: 'Punkte',
  LINES: 'Linien'
};

/** Set of internationalized strings.
@type {DrawingMode.i18n_strings}
*/
DrawingMode.i18n = goog.LOCALE === 'de' ? DrawingMode.de_strings :
    DrawingMode.en;

}); // goog.scope
