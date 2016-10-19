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

goog.provide('myphysicslab.lab.model.ModifiedEuler');

goog.require('myphysicslab.lab.model.ODESim');
goog.require('myphysicslab.lab.model.DiffEqSolver');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Modified Euler method for solving ordinary differential equations
expressed as a {@link myphysicslab.lab.model.ODESim}; operates by using the
differential equations to advance the variables by a small time step.

This is a numerically stable version of the numerically unstable
{@link myphysicslab.lab.model.EulersMethod}.

* @param {!myphysicslab.lab.model.ODESim} ode the set of differential equations to solve
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.model.DiffEqSolver}
*/
myphysicslab.lab.model.ModifiedEuler = function(ode) {
  /**  the set of differential equations to solve.
  * @type {!myphysicslab.lab.model.ODESim}
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
var ModifiedEuler = myphysicslab.lab.model.ModifiedEuler;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  ModifiedEuler.prototype.toString = function() {
    return this.toStringShort();
  };

  /** @inheritDoc */
  ModifiedEuler.prototype.toStringShort = function() {
    return 'ModifiedEuler{ode_: '+this.ode_.toStringShort()+'}';
  };
};

/** @inheritDoc */
ModifiedEuler.prototype.getName = function(opt_localized) {
  return opt_localized ? ModifiedEuler.i18n.NAME :
      UtilityCore.toName(ModifiedEuler.en.NAME);
};

/** @inheritDoc */
ModifiedEuler.prototype.nameEquals = function(name) {
  return this.getName() == UtilityCore.toName(name);
};

/** @inheritDoc */
ModifiedEuler.prototype.step = function(stepSize) {
  var error, i;
  var va = this.ode_.getVarsList();
  var vars = va.getValues();
  var N = vars.length;
  if (this.inp_.length != N) {
    this.inp_ = /** @type {!Array<number>}*/(new Array(N));
    this.k1_ = /** @type {!Array<number>}*/(new Array(N));
    this.k2_ = /** @type {!Array<number>}*/(new Array(N));
  }
  var inp = this.inp_;
  var k1 = this.k1_;
  var k2 = this.k2_;
  // evaluate at time t
  for (i=0; i<N; i++) {
    inp[i] = vars[i];
  }
  UtilityCore.zeroArray(k1);
  error = this.ode_.evaluate(inp, k1, 0);
  if (!goog.isNull(error))
    return error;
  // evaluate at time t+stepSize
  for (i=0; i<N; i++) {
    inp[i] = vars[i]+k1[i]*stepSize;
  }
  UtilityCore.zeroArray(k2);
  error = this.ode_.evaluate(inp, k2, stepSize);
  if (!goog.isNull(error))
    return error;
  for (i=0; i<N; i++) {
      vars[i] += (k1[i] + k2[i])*stepSize/2;
  }
  va.setValues(vars, /*continuous=*/true);
  return null;
};

/** Set of internationalized strings.
@typedef {{
  NAME: string
  }}
*/
ModifiedEuler.i18n_strings;

/**
@type {ModifiedEuler.i18n_strings}
*/
ModifiedEuler.en = {
  NAME: 'Modified Euler'
};

/**
@private
@type {ModifiedEuler.i18n_strings}
*/
ModifiedEuler.de_strings = {
  NAME: 'Modifiziert Euler'
};

/** Set of internationalized strings.
@type {ModifiedEuler.i18n_strings}
*/
ModifiedEuler.i18n = goog.LOCALE === 'de' ? ModifiedEuler.de_strings :
    ModifiedEuler.en;

}); // goog.scope
