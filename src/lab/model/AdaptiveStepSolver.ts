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

import { DiffEqSolver } from './DiffEqSolver.js';
import { EnergySystem } from './EnergySystem.js';
import { ODESim } from './ODESim.js';
import { Util } from '../util/Util.js';

/** Experimental differential equation solver which reduces step size as
needed to ensure that energy stays constant over every time step. Uses Decorator design
pattern to wrap another DiffEqSolver.

For each step in solving the differential equation, we solve the step several times,
taking multiple smaller time steps until some criteria tells us that we have achieved
sufficient accuracy.

There are two criteria that can be used:

+ For a constant energy system, we reduce the step size until the change in
energy for the overall step becomes small.

+ For a non-constant energy system, we look at the change in energy during the
overall step; we reduce the step size until this change in energy stabilizes.

**TO DO** Probably a better approach is to use a method like Runge Kutta Fehlberg
which modifies the step size based on error estimates for the diff eqns.

**TO DO** To make this a true Decorator pattern we need to modify the
ODESim interface to support getting energy information and also add some
other methods that are part of the Simulation and ODESim
classes, like `modifyObjects, saveState, restoreState`. Note that the
current CollisionSim interface has several of these methods, so there is
an argument to extend ODESim in this way.

*/
export class AdaptiveStepSolver implements DiffEqSolver {
  private diffEq_: ODESim;
  private energySystem_: EnergySystem;
  private odeSolver_: DiffEqSolver;
  private totSteps_: number = 0;
  private secondDiff_: boolean = true;
  /** enables debug code for particular test */
  private specialTest_: boolean = false;
  private tolerance_: number = 1E-6;

/**
* @param diffEq the ODESim that defines the differential equation to solve
* @param energySystem gives information about energy in the ODESim
* @param diffEqSolver the DiffEqSolver to use with various step sizes.
*/
constructor(diffEq: ODESim, energySystem: EnergySystem, diffEqSolver: DiffEqSolver) {
  this.diffEq_ = diffEq;
  this.energySystem_ = energySystem;
  this.odeSolver_ = diffEqSolver;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', odeSolver_: '+this.odeSolver_.toStringShort()
      +', energySystem_: '+this.energySystem_.toStringShort()
      +', secondDiff_: '+this.secondDiff_
      +', tolerance_: '+Util.NFE(this.tolerance_)
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'AdaptiveStepSolver{diffEq_: '+this.diffEq_.toStringShort()+'}';
};

/** @inheritDoc */
getName(opt_localized?: boolean): string {
  if (opt_localized) {
    return AdaptiveStepSolver.i18n.NAME + '-'
        + this.odeSolver_.getName(/*localized=*/true);
  } else {
    return Util.toName(AdaptiveStepSolver.en.NAME) + '_'
        + this.odeSolver_.getName(/*localized=*/false);
  }
};

/** @inheritDoc */
nameEquals(name: string): boolean {
  return this.getName() == Util.toName(name);
};

/** Returns whether to use second order differences for deciding when to reduce the step
size. See {@link AdaptiveStepSolver.setSecondDiff}.
@return whether to use change in change in energy as the criteria for accuracy
*/
getSecondDiff(): boolean {
  return this.secondDiff_;
};

/** Returns the tolerance used to decide if sufficient accuracy has been achieved.
Default is 1E-6.
@return the tolerance value for deciding if sufficient accuracy has been achieved
*/
getTolerance(): number {
  return this.tolerance_;
};

/** Whether to use second order differences for deciding when to reduce the step size.
The first difference is the change in energy of the system over a time step.
We can only use first differences when the energy of the system is constant.
If the energy of the system changes over time, then we need to reduce the step size
until the change of energy over the step stabilizes.  Put another way:  we reduce
the step size until the change in the change in energy becomes small.
@param value  true means use *change in change in energy* (second derivative)
    as the criteria for accuracy
*/
setSecondDiff(value: boolean): void {
  this.secondDiff_ = value;
};

/** Sets the tolerance used to decide if sufficient accuracy has been achieved.
Default is 1E-6.
@param value the tolerance value for deciding if sufficient accuracy
    has been achieved
*/
setTolerance(value: number): void {
  this.tolerance_ = value;
};

/** @inheritDoc */
step(stepSize: number): null|object {
  // save the vars in case we need to back up and start again
  this.diffEq_.saveState();
  const startTime = this.diffEq_.getTime();
  let d_t = stepSize; // d_t = our smaller step size
  let steps = 0;  // number of diffEqSolver steps taken during this step
  this.diffEq_.modifyObjects(); // to ensure getEnergyInfo gives correct value
  const startEnergy = this.energySystem_.getEnergyInfo().getTotalEnergy();
  let lastEnergyDiff = Infinity;
  let value = Infinity; // the value we are trying to reduce to zero
  let firstTime = true;
  if (stepSize < 1E-15)
    return null;
  do {
    let t = startTime;  // t = current time
    if (!firstTime) {
      // restore state and solve again with smaller step size
      this.diffEq_.restoreState();
      this.diffEq_.modifyObjects();
      Util.assert( Math.abs(this.diffEq_.getTime() - startTime) < 1E-12 );
      const e = this.energySystem_.getEnergyInfo().getTotalEnergy();
      Util.assert( Math.abs(e - startEnergy) < 1E-10 );
      d_t = d_t/5;  // reduce step size
      if (d_t < 1E-15)
        throw 'time step too small '+d_t;
    }
    steps = 0;  // only count steps of the last iteration
    // take multiple steps of size d_t to equal the entire requested stepSize
    while (t < startTime + stepSize) {
      let h = d_t;
      // if this step takes us past the end of the overall step, then shorten it
      if (t + h > startTime + stepSize - 1E-10)
        h = startTime + stepSize - t;
      steps++;
      const error = this.odeSolver_.step(h);
      this.diffEq_.modifyObjects();
      if (error != null)
        return error;
      t += h;
    }
    const finishEnergy = this.energySystem_.getEnergyInfo().getTotalEnergy();
    const energyDiff = Math.abs(startEnergy - finishEnergy);
    if (this.secondDiff_) {
      // reduce time step until change in energy stabilizes
      // (i.e. change in change in energy goes to zero)
      if (!firstTime) {
        value = Math.abs(energyDiff - lastEnergyDiff);
      }
    } else {
      // reduce time step until change in energy goes to zero
      value = energyDiff;
    }
    /*if (Util.DEBUG) {
      if (!this.secondDiff_ || !firstTime) {
        console.log(Util.NF7(startTime)
          +' value='+Util.NF9(value)
          +' d_t='+Util.NF9(d_t)
          +' nowDiff='+Util.NF9(energyDiff)
          +' lastDiff='+Util.NF9(lastEnergyDiff)
          +' finishEnergy='+Util.NF7(finishEnergy)
          );
      }
    }*/
    lastEnergyDiff = energyDiff;
    firstTime = false;
  } while (value > this.tolerance_);
  this.totSteps_ += steps;
  return null;
};

static readonly en: i18n_strings = {
  NAME: 'Adaptive'
};

static readonly de_strings: i18n_strings = {
  NAME: 'Adaptiert'
};

static readonly i18n = Util.LOCALE === 'de' ?
    AdaptiveStepSolver.de_strings : AdaptiveStepSolver.en;

} // end class

type i18n_strings = {
  NAME: string
};

Util.defineGlobal('lab$model$AdaptiveStepSolver', AdaptiveStepSolver);
