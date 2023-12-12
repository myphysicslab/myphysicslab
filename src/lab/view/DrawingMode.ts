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

import { Util } from '../util/Util.js'

/** DrawingMode specifies how the line of a graph or path is drawn.
*/
export const enum DrawingMode {
  DOTS = 'dots',
  LINES = 'lines'
};

export function DrawingModeChoices(): string[] {
  return [ i18n.DOTS,
    i18n.LINES ];
};

export function DrawingModeValues(): DrawingMode[] {
  return [ DrawingMode.DOTS,
    DrawingMode.LINES ];
};

type i18n_strings = {
  DOTS: string,
  LINES: string
};

const en_strings: i18n_strings = {
  DOTS: 'Dots',
  LINES: 'Lines'
};

const de_strings: i18n_strings = {
  DOTS: 'Punkte',
  LINES: 'Linien'
};

const i18n = Util.LOCALE === 'de' ? de_strings : en_strings;
