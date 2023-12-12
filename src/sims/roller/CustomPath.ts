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

declare global {
  interface Window {
    t: number;
  }
};

/** A path defined by custom equations. The equations are JavaScript string
expressions where the parameter is `t`. There is an equation for both the `x` and `y`
value.

NOTE: This class creates a global variable named `t`.
*/
export class CustomPath extends AbstractPath implements ParametricPath {
  private equationX_: string;
  private equationY_: string;

/**
* @param start_t starting `t` value
* @param finish_t ending `t` value
* @param name
* @param localName
*/
constructor(start_t?: number, finish_t?: number, name?: string, localName?: string) {
  start_t = start_t ?? -3;
  finish_t = finish_t ?? 3;
  name = name || CustomPath.en.NAME;
  localName = localName || CustomPath.i18n.NAME;
  super(name, localName, start_t, finish_t, /*closedLoop=*/false);
  this.equationX_ = 't';
  this.equationY_ = '3 + t*t*(-7 + 1.2*t*t)/6';
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
    +', equationX_: "'+this.equationX_+'"'
    +', equationY_: "'+this.equationY_+'"'
    +'}';
};

/** @inheritDoc */
getClassName() {
  return 'CustomPath';
};

/** Returns the parameteric X equation defining the path.
* @return the parameteric X equation defining the path
*/
getXEquation(): string {
  return this.equationX_;
};

/** Returns the parameteric Y equation defining the path.
* @return the parameteric Y equation defining the path
*/
getYEquation(): string {
  return this.equationY_;
};

/** Sets the parameteric X equation defining the path. A JavaScript expression where
* the parameter is `t`.
* @param value the parameteric X equation defining the path
*/
setXEquation(value: string): void {
  this.equationX_ = value;
};

/** Sets the parameteric Y equation defining the path. A JavaScript expression where
* the parameter is `t`.
* @param value the parameteric Y equation defining the path
*/
setYEquation(value: string): void {
  this.equationY_ = value;
};

/** @inheritDoc */
x_func(t: number): number {
  window.t = t;
  const r = (0, eval)('"use strict"; '+this.equationX_);
  if (typeof r === 'number' && isFinite(r)) {
    return r;
  } else {
    throw 'not a finite number "'+this.equationX_+'" when t='+t;
  }
};

/** @inheritDoc */
y_func(t: number): number {
  window.t = t;
  const r = (0, eval)('"use strict"; '+this.equationY_);
  if (typeof r === 'number' && isFinite(r)) {
    return r;
  } else {
    throw 'not a finite number "'+this.equationY_+'" when t='+t;
  }
};

static readonly en: i18n_strings = {
  NAME: 'Custom'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Spezial'
};

static readonly i18n = Util.LOCALE === 'de' ? CustomPath.de_strings : CustomPath.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('sims$roller$CustomPath', CustomPath);
