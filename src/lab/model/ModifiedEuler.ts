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

import { ODESim } from './ODESim.js'
import { DiffEqSolver } from './DiffEqSolver.js'
import { Util } from '../util/Util.js'

/** Modified Euler method for solving ordinary differential equations
expressed as a {@link ODESim}; operates by using the
differential equations to advance the variables by a small time step.

This is a numerically stable version of the numerically unstable
{@link lab/model/EulersMethod.EulersMethod}.
*/
export class ModifiedEuler implements DiffEqSolver {
  /**  the set of differential equations to solve. */
  private ode_: ODESim;
  /**  array used within algorithm, retained to avoid reallocation of array. */
  private inp_: number[] = [];
  /**  array used within algorithm, retained to avoid reallocation of array. */
  private k1_: number[] = [];
  /**  array used within algorithm, retained to avoid reallocation of array. */
  private k2_: number[] = [];

/**
* @param ode the set of differential equations to solve
*/
constructor(ode: ODESim) {
  this.ode_ = ode;
};

/** @inheritDoc */
toString() {
  return this.toStringShort();
};

/** @inheritDoc */
toStringShort() {
  return 'ModifiedEuler{ode_: '+this.ode_.toStringShort()+'}';
};

/** @inheritDoc */
getName(opt_localized?: boolean): string {
  return opt_localized ? ModifiedEuler.i18n.NAME :
      Util.toName(ModifiedEuler.en.NAME);
};

/** @inheritDoc */
nameEquals(name: string): boolean {
  return this.getName() == Util.toName(name);
};

/** @inheritDoc */
step(stepSize: number): null|object {
  const va = this.ode_.getVarsList();
  const vars = va.getValues();
  const N = vars.length;
  if (this.inp_.length != N) {
    this.inp_ = new Array(N);
    this.k1_ = new Array(N);
    this.k2_ = new Array(N);
  }
  const inp = this.inp_;
  const k1 = this.k1_;
  const k2 = this.k2_;
  // evaluate at time t
  for (let i=0; i<N; i++) {
    inp[i] = vars[i];
  }
  Util.zeroArray(k1);
  let error = this.ode_.evaluate(inp, k1, 0);
  if (error != null)
    return error;
  // evaluate at time t+stepSize
  for (let i=0; i<N; i++) {
    inp[i] = vars[i]+k1[i]*stepSize;
  }
  Util.zeroArray(k2);
  error = this.ode_.evaluate(inp, k2, stepSize);
  if (error != null)
    return error;
  for (let i=0; i<N; i++) {
      vars[i] += (k1[i] + k2[i])*stepSize/2;
  }
  va.setValues(vars, /*continuous=*/true);
  return null;
};

static en: i18n_strings = {
  NAME: 'Modified Euler'
};

static de_strings: i18n_strings = {
  NAME: 'Modifiziert Euler'
};

static readonly i18n = Util.LOCALE === 'de' ? ModifiedEuler.de_strings :
    ModifiedEuler.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('lab$model$ModifiedEuler', ModifiedEuler);
