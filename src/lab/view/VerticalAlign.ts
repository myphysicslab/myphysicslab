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

import { Util } from "../util/Util.js"

/** Vertical alignment enum, used to specify how to align a SimView's simulation
rectangle within its screen rectangle.
See {@link lab/view/CoordMap.CoordMap.make | CoordMap.make},
{@link lab/view/SimView.SimView.setVerticalAlign | SimView.setVerticalAlign}.

Also used for alignment of DisplayAxes,
see {@link lab/graph/DisplayAxes.DisplayAxes.setYAxisAlignment | DisplayAxes.setYAxisAlignment}.
*/
export const enum VerticalAlign {
  TOP = "TOP",
  MIDDLE = "MIDDLE",
  BOTTOM = "BOTTOM",
  FULL = "FULL",
  VALUE = "VALUE", //align at a particular value (specified elsewhere)
};

/** returns array of all VerticalAlign values */
export function VerticalAlignValues(): VerticalAlign[] {
  return [
    VerticalAlign.TOP,
    VerticalAlign.MIDDLE,
    VerticalAlign.BOTTOM,
    VerticalAlign.FULL,
    VerticalAlign.VALUE,
  ];
};

/** returns array of all VerticalAlign enums translated to localized strings. */
export function VerticalAlignChoices(): string[] {
  return [
    i18n.TOP,
    i18n.MIDDLE,
    i18n.BOTTOM,
    i18n.FULL,
    i18n.VALUE,
  ];
};

type i18n_strings = {
  TOP: string,
  MIDDLE: string,
  BOTTOM: string,
  FULL: string,
  VALUE: string
}

const en_strings: i18n_strings = {
  TOP: 'top',
  MIDDLE: 'middle',
  BOTTOM: 'bottom',
  FULL: 'full',
  VALUE: 'value'
};

const de_strings: i18n_strings = {
  TOP: 'oben',
  MIDDLE: 'mitte',
  BOTTOM: 'unten',
  FULL: 'voll',
  VALUE: 'Wert'
};

const i18n = Util.LOCALE === 'de' ? de_strings : en_strings;

