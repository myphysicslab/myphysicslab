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

/** Euler's method for solving ordinary differential equations
expressed as a {@link ODESim}; operates by using the
differential equations to advance the variables by a small time step.

Note that *Euler's method is not numerically stable*, it is provided for educational
purposes only.  See {@link lab/model/ModifiedEuler.ModifiedEuler} for a numerically
stable version of Euler's method.
*/
export class EulersMethod implements DiffEqSolver {
  /**  the set of differential equations to solve. */
  private ode_: ODESim;
  /**  array used within algorithm, retained to avoid reallocation of array. */
  private inp_: number[] = [];
  /**  array used within algorithm, retained to avoid reallocation of array. */
  private k1_: number[] = [];

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
  return 'EulersMethod{ode_: '+this.ode_.toStringShort()+'}';
};

/** @inheritDoc */
getName(opt_localized?: boolean): string {
  return opt_localized ? EulersMethod.i18n.NAME :
      Util.toName(EulersMethod.en.NAME);
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
  }
  const inp = this.inp_;
  const k1 = this.k1_;
  for (let i=0; i<N; i++) {
    // set up input to diffeqs (note: this protects vars from being changed)
    inp[i] = vars[i];
  }
  Util.zeroArray(k1);
  const error = this.ode_.evaluate(inp, k1, 0);  // evaluate at time t
  if (error != null) {
    return error;
  }
  /* Filip's Method for DoublePendulumSim.
   * See email of May 24, 2021 with Filip Optołowicz.
  vars[9] += k1[9] * stepSize; // time
  vars[1] += k1[1] * stepSize;
  vars[3] += k1[3] * stepSize;
  vars[0] += vars[1] * stepSize;
  vars[2] += vars[3] * stepSize;
  */
  for (let i=0; i<N; i++) {
    vars[i] += k1[i] * stepSize;
  }
  va.setValues(vars, /*continuous=*/true);
  return null;
};

static en: i18n_strings = {
  NAME: 'Eulers Method'
};

static de_strings: i18n_strings = {
  NAME: 'Eulers Methode'
};

static readonly i18n = Util.LOCALE === 'de' ? EulersMethod.de_strings :
    EulersMethod.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('lab$model$EulersMethod', EulersMethod);
