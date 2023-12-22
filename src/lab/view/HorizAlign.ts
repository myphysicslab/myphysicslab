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

/** Horizontal alignment enum, used to specify how to align a SimView's simulation
rectangle within its screen rectangle.
See {@link lab/view/CoordMap.CoordMap.make | CoordMap.make},
{@link lab/view/SimView.SimView.setHorizAlign | SimView.setHorizAlign}.

Also used for alignment of DisplayAxes, see
{@link lab/graph/DisplayAxes.DisplayAxes.setYAxisAlignment | DisplayAxes.setYAxisAlignment}.
*/
export const enum HorizAlign {
  LEFT = "LEFT",
  MIDDLE = "MIDDLE",
  RIGHT = "RIGHT",
  FULL = "FULL",
  VALUE = "VALUE", //align at a particular value (specified elsewhere)
};

/** returns array of all HorizAlign values */
export function HorizAlignValues(): HorizAlign[] {
  return [
    HorizAlign.LEFT,
    HorizAlign.MIDDLE,
    HorizAlign.RIGHT,
    HorizAlign.FULL,
    HorizAlign.VALUE
  ];
};

/** returns array of all HorizAlign enums translated to localized strings. */
export function HorizAlignChoices(): string[] {
  return [
    i18n.LEFT,
    i18n.MIDDLE,
    i18n.RIGHT,
    i18n.FULL,
    i18n.VALUE,
  ];
};

type i18n_strings = {
  LEFT: string,
  MIDDLE: string,
  RIGHT: string,
  FULL: string,
  VALUE: string
}

const en_strings: i18n_strings = {
  LEFT: 'left',
  MIDDLE: 'middle',
  RIGHT: 'right',
  FULL: 'full',
  VALUE: 'value'
};

const de_strings: i18n_strings = {
  LEFT: 'links',
  MIDDLE: 'mitte',
  RIGHT: 'rechts',
  FULL: 'voll',
  VALUE: 'Wert'
};

const i18n = Util.LOCALE === 'de' ? de_strings : en_strings;

