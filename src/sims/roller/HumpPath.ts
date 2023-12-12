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

/** A 'W' shaped path with a central hump.  Formed from a quartic
polynomial:
```text
x = t
y = 3 - (7/6) t^2 + (1/6) t^4
```
*/
export class HumpPath extends AbstractPath implements ParametricPath {
/**
* @param start
* @param finish
* @param name
* @param localName
*/
constructor(start?: number, finish?: number, name?: string, localName?: string) {
  if (typeof start !== 'number')
    start = -3;
  if (typeof finish !== 'number')
    finish = 3;
  name = name || HumpPath.en.NAME;
  localName = localName || HumpPath.i18n.NAME;
  super(name, localName, start, finish, /*closedLoop=*/false);
};

/** @inheritDoc */
getClassName() {
  return 'HumpPath';
};

/** @inheritDoc */
x_func(t: number): number {
  return t;
};

/** @inheritDoc */
y_func(t: number): number {
  return 3 + t*t*(-7 + t*t)/6;
};

static readonly en: i18n_strings = {
  NAME: 'Hump'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Buckel'
};

static readonly i18n = Util.LOCALE === 'de' ? HumpPath.de_strings : HumpPath.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('sims$roller$HumpPath', HumpPath);
