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

import { AbstractSubject } from '../../lab/util/AbstractSubject.js';
import { Observer, ParameterNumber, SubjectEvent, Subject } from '../../lab/util/Observe.js';
import { RigidBodySim } from '../../lab/engine2D/RigidBodySim.js';
import { Util } from '../../lab/util/Util.js';

/** Provides a ParameterNumber for setting the elasticity of all RigidBodys in an
RigidBodySim.

ElasticitySetter remembers the last value it had even when there are no
RigidBodys. This is useful in situations where an application makes a new configuration
of RigidBodys and wants to find the user's desired value for elasticity.

**WARNING** The elasticity reported here is only accurate if all modifications to
elasticity of RigidBodys are done thru this class or via
{@link RigidBodySim.setElasticity}.

### Parameters Created

+ ParameterNumber named `ELASTICITY`, see {@link ElasticitySetter.setElasticity}

*/
export class ElasticitySetter extends AbstractSubject implements Subject, Observer {
  private sim_: RigidBodySim;
  /** last value that was reported to an outside entity. */
  private lastValue_: number = 0;

constructor(sim: RigidBodySim) {
  super('ELASTICITY_SETTER');
  this.sim_ = sim;
  sim.addObserver(this);
  let pn = new ParameterNumber(this, ElasticitySetter.en.ELASTICITY,
      ElasticitySetter.i18n.ELASTICITY,
      () => this.getElasticity(), a => this.setElasticity(a));
  pn.setSignifDigits(3);
  pn.setUpperLimit(1);
  pn.setLowerLimit(0);
  this.addParameter(pn);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', sim: '+this.sim_.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'ElasticitySetter';
};

/** Returns the minimum elasticity among all RigidBodys in the simulation.
If there are no RigidBodys, then the last value set or calculated is returned.
Elasticity is used when calculating collisions; a value of 1.0 means
perfect elasticity where the kinetic energy after collision is the same as before
(extremely bouncy), while a value of 0 means no elasticity (no bounce).
@return elasticity used when calculating collisions, a number from 0 to 1.
*/
getElasticity(): number {
  this.lastValue_ = this.getElasticity_();
  return this.lastValue_;
};

private getElasticity_(): number {
  const bods = this.sim_.getBodies();
  if (bods.length == 0) {
    return this.lastValue_;
  } else {
    return bods.reduce((min, body) => Math.min(min, body.getElasticity()), 1);
  }
};

/** Sets the elasticity of all RigidBodys in the simulation.
If there are no RigidBodys, then stores the value internally.
Elasticity is used when calculating collisions; a value of 1.0 means
perfect elasticity where the kinetic energy after collision is the same as before
(extremely bouncy), while a value of 0 means no elasticity (no bounce).
@param value elasticity used when calculating collisions, a number from 0 to 1.
*/
setElasticity(value: number): void {
  this.sim_.getBodies().forEach(body => body.setElasticity(value));
  this.lastValue_ = value;
  this.broadcastParameter(ElasticitySetter.en.ELASTICITY);
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.sim_ && event.nameEquals(RigidBodySim.ELASTICITY_SET)) {
    const nowValue = this.getElasticity_();
    if (this.lastValue_ != nowValue) {
      // only broadcast when last value we publicly have reported is wrong
      this.lastValue_ = nowValue;
      this.broadcastParameter(ElasticitySetter.en.ELASTICITY);
    }
  }
};

static readonly en: i18n_strings = {
  ELASTICITY : 'elasticity'
};

static readonly de_strings: i18n_strings = {
  ELASTICITY : 'Elastizität'
};

static readonly i18n = Util.LOCALE === 'de' ? ElasticitySetter.de_strings : ElasticitySetter.en;

} // end class

type i18n_strings = {
  ELASTICITY: string
};

Util.defineGlobal('sims$engine2D$ElasticitySetter', ElasticitySetter);
