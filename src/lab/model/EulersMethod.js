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

goog.module('myphysicslab.lab.model.EulersMethod');

const ODESim = goog.require('myphysicslab.lab.model.ODESim');
const DiffEqSolver = goog.require('myphysicslab.lab.model.DiffEqSolver');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Euler's method for solving ordinary differential equations
expressed as a {@link ODESim}; operates by using the
differential equations to advance the variables by a small time step.

Note that *Euler's method is not numerically stable*, it is provided for educational
purposes only.  See {@link myphysicslab.lab.model.ModifiedEuler} for a numerically
stable version of Euler's method.

* @implements {DiffEqSolver}
*/
class EulersMethod {
/**
* @param {!ODESim} ode the set of differential equations to solve
*/
constructor(ode) {
  /**  the set of differential equations to solve.
  * @type {!ODESim}
  * @private
  */
  this.ode_ = ode;
  /**  array used within algorithm, retained to avoid reallocation of array.
  * @type {!Array<number>}
  * @private
  */
  this.inp_ = [];
  /**  array used within algorithm, retained to avoid reallocation of array.
  * @type {!Array<number>}
  * @private
  */
  this.k1_ = [];
  /**  array used within algorithm, retained to avoid reallocation of array.
  * @type {!Array<number>}
  * @private
  */
  this.k2_ = [];
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort();
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'EulersMethod{ode_: '+this.ode_.toStringShort()+'}';
};

/** @override */
getName(opt_localized) {
  return opt_localized ? EulersMethod.i18n.NAME :
      Util.toName(EulersMethod.en.NAME);
};

/** @override */
nameEquals(name) {
  return this.getName() == Util.toName(name);
};

/** @override */
step(stepSize) {
  var error, i;
  var va = this.ode_.getVarsList();
  var vars = va.getValues();
  var N = vars.length;
  if (this.inp_.length != N) {
    this.inp_ = new Array(N);
    this.k1_ = new Array(N);
  }
  var inp = this.inp_;
  var k1 = this.k1_;
  for (i=0; i<N; i++) {
    // set up input to diffeqs (note: this protects vars from being changed)
    inp[i] = vars[i];
  }
  Util.zeroArray(k1);
  error = this.ode_.evaluate(inp, k1, 0);  // evaluate at time t
  if (!goog.isNull(error))
    return error;
  for (i=0; i<N; i++) {
      vars[i] += k1[i] * stepSize;
  }
  va.setValues(vars, /*continuous=*/true);
  return null;
};

} //end class

/** Set of internationalized strings.
@typedef {{
  NAME: string
  }}
*/
EulersMethod.i18n_strings;

/**
@type {EulersMethod.i18n_strings}
*/
EulersMethod.en = {
  NAME: 'Eulers Method'
};

/**
@private
@type {EulersMethod.i18n_strings}
*/
EulersMethod.de_strings = {
  NAME: 'Eulers Methode'
};

/** Set of internationalized strings.
@type {EulersMethod.i18n_strings}
*/
EulersMethod.i18n = goog.LOCALE === 'de' ? EulersMethod.de_strings :
    EulersMethod.en;

exports = EulersMethod;
