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

import { AdvanceStrategy } from '../../lab/model/AdvanceStrategy.js';
import { DiffEqSolver } from '../../lab/model/DiffEqSolver.js'
import { MemoList } from '../../lab/util/Memo.js'
import { StringSim } from './StringSim.js';
import { Util } from '../../lab/util/Util.js';

/** This is an [Adapter](https://en.wikipedia.org/wiki/Adapter_pattern) that forwards
* to {@link StringSim}.
*/
export class StringAdvance implements AdvanceStrategy {
  private sim_: StringSim;

/**
* @param sim
*/
constructor(sim: StringSim) {
  this.sim_ = sim;
};

/** @inheritDoc */
toString(): string {
  return this.toStringShort();
};

/** @inheritDoc */
toStringShort(): string {
  return 'StringAdvance{sim_: '+this.sim_.toStringShort()+'}';
};

/** @inheritDoc */
advance(timeStep: number, opt_memoList?: MemoList): void {
  const startTime = this.getTime();
  while (this.getTime() < startTime + timeStep) {
    this.sim_.advance();
  }
  this.sim_.getSimList().removeTemporary(this.sim_.getTime());
  this.sim_.modifyObjects();
  if (opt_memoList !== undefined) {
    opt_memoList.memorize();
  }
};

/** @inheritDoc */
getTime(): number {
  return this.sim_.getTime();
};

/** @inheritDoc */
getTimeStep(): number {
  return this.sim_.getTimeStep();
};

/** @inheritDoc */
setTimeStep(value: number): void {
  if (this.sim_.getTimeStep() != value) {
    this.sim_.setTimeStep(value);
  }
};

/** @inheritDoc */
reset(): void {
  this.sim_.reset();
};

/** @inheritDoc */
save(): void {
  this.sim_.saveInitialState();
};

} // end class

Util.defineGlobal('sims$pde$StringAdvance', StringAdvance);
