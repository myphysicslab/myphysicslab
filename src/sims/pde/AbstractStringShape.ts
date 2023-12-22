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

import { StringShape } from './StringShape.js';
import { Util } from '../../lab/util/Util.js';

/** Defines initial conditions of a string used in the
{@link sims/pde/StringSim.StringSim | StringSim} PDE simulation by specifying the initial
displacement and velocity at each point of the string.

### How to find the correct velocity for a traveling wave:

The d'Alembert equation for a left-moving traveling wave is `f(x + ct)`, where `f()`
is a general single-variable waveform, think of it as `f(x)` moving to
the left as `t` increases.  The velocity (partial derivative with respect
to time) is then `c f'(x + ct)` which at time `t=0` is  `c f'(x)`.
So take the first derivative of the waveform, and multiply by `c`
where `c` is the wave speed `= sqrt(tension/density)`.
Right-moving wave is `f(x - ct)` with derivative `-c f'(x)`

*/
export abstract class AbstractStringShape implements StringShape {
  protected length_: number;
  private name_: string;
  private localName_: string;

/**
* @param length
* @param name
* @param opt_localName localized name of this SimObject (optional)
*/
constructor(length: number, name: string, opt_localName?: string) {
  if (length < 1e-16) {
    throw '';
  }
  this.length_ = length;
  this.name_ = Util.toName(name);
  this.localName_ = opt_localName || name;
};

/** @inheritDoc */
toString() {
  return this.getClassName()+'{name_: "'+this.name_+'"'
      +', length_: '+Util.NF(this.length_)
      +'}';
};

/** @inheritDoc */
abstract getClassName(): string;

/** @inheritDoc */
getLength(): number {
  return this.length_;
};

/** @inheritDoc */
getName(opt_localized: boolean = false): string {
  return opt_localized ? this.localName_ : this.name_;
};

/** @inheritDoc */
abstract position(x: number): number;

/** @inheritDoc */
abstract velocity(x: number): number;

} // end class

Util.defineGlobal('sims$pde$AbstractStringShape', AbstractStringShape);
