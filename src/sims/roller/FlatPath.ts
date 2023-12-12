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

import { Util } from '../../lab/util/Util.js';
import { AbstractPath } from './AbstractPath.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';

/** A horizontal flat path.
*/
export class FlatPath extends AbstractPath implements ParametricPath {

constructor(start?: number, finish?: number, name?: string, localName?: string) {
  start = start ?? -5;
  finish = finish ?? 5;
  name = name || FlatPath.en.NAME;
  localName = localName || FlatPath.i18n.NAME;
  super(name, localName, start, finish, /*closedLoop=*/false);
};

/** @inheritDoc */
getClassName() {
  return 'FlatPath';
};

/** @inheritDoc */
x_func(t: number): number {
  return t;
};

/** @inheritDoc */
y_func(_t: number): number {
  return 0;
};

static readonly en: i18n_strings = {
  NAME: 'Flat'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Horizontale'
};

static readonly i18n = Util.LOCALE === 'de' ? FlatPath.de_strings : FlatPath.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('sims$roller$FlatPath', FlatPath);
