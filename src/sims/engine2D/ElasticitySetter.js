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

goog.module('myphysicslab.sims.engine2D.ElasticitySetter');

goog.require('goog.array');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Provides a ParameterNumber for setting the elasticity of all RigidBodys in an
RigidBodySim.

ElasticitySetter remembers the last value it had even when there are no
RigidBodys. This is useful in situations where an application makes a new configuration
of RigidBodys and wants to find the user's desired value for elasticity.

WARNING: The elasticity reported here is only accurate if all modifications to
elasticity of RigidBodys are done thru this class or via
{@link RigidBodySim#setElasticity}.

### Parameters Created

+ ParameterNumber named `ELASTICITY`, see {@link #setElasticity}

@implements {Observer}
*/
class ElasticitySetter extends AbstractSubject {
/**
@param {!RigidBodySim} sim
*/
constructor(sim) {
  super('ELASTICITY_SETTER');
  /**
  * @type {!RigidBodySim}
  * @private
  */
  this.sim_ = sim;
  /** last value that was reported to an outside entity.
  * @type {number}
  * @private
  */
  this.lastValue_ = 0;
  sim.addObserver(this);
  this.addParameter(new ParameterNumber(this, ElasticitySetter.en.ELASTICITY,
      ElasticitySetter.i18n.ELASTICITY,
      goog.bind(this.getElasticity, this),
      goog.bind(this.setElasticity, this)).setSignifDigits(3).setUpperLimit(1));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', sim: '+this.sim_.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'ElasticitySetter';
};

/** Returns the minimum elasticity among all RigidBodys in the simulation.
If there are no RigidBodys, then the last value set or calculated is returned.
Elasticity is used when calculating collisions; a value of 1.0 means
perfect elasticity where the kinetic energy after collision is the same as before
(extremely bouncy), while a value of 0 means no elasticity (no bounce).
* @return {number} elasticity used when calculating collisions, a number from 0 to 1.
*/
getElasticity() {
  this.lastValue_ = this.getElasticity_();
  return this.lastValue_;
};

/**
* @private
* @return {number}
*/
getElasticity_() {
  var bods = this.sim_.getBodies();
  if (bods.length == 0) {
    return this.lastValue_;
  } else {
    return goog.array.reduce(bods, function(value, body) {
      return Math.min(value, body.getElasticity());
    }, 1);
  }
};

/** Sets the elasticity of all RigidBodys in the simulation.
If there are no RigidBodys, then stores the value internally.
Elasticity is used when calculating collisions; a value of 1.0 means
perfect elasticity where the kinetic energy after collision is the same as before
(extremely bouncy), while a value of 0 means no elasticity (no bounce).
* @param {number} value elasticity used when calculating collisions,
*    a number from 0 to 1.
*/
setElasticity(value) {
  goog.array.forEach(this.sim_.getBodies(), function(body) {
    body.setElasticity(value);
  });
  this.lastValue_ = value;
  this.broadcastParameter(ElasticitySetter.en.ELASTICITY);
};

/** @override */
observe(event) {
  if (event.getSubject() == this.sim_ && event.nameEquals(RigidBodySim.ELASTICITY_SET)) {
    var nowValue = this.getElasticity_();
    if (this.lastValue_ != nowValue) {
      // only broadcast when last value we publicly have reported is wrong
      this.lastValue_ = nowValue;
      this.broadcastParameter(ElasticitySetter.en.ELASTICITY);
    }
  }
};

} // end class

/** Set of internationalized strings.
@typedef {{
  ELASTICITY: string
  }}
*/
ElasticitySetter.i18n_strings;

/**
@type {ElasticitySetter.i18n_strings}
*/
ElasticitySetter.en = {
  ELASTICITY : 'elasticity'
};

/**
@private
@type {ElasticitySetter.i18n_strings}
*/
ElasticitySetter.de_strings = {
  ELASTICITY : 'Elastizit\u00e4t'
};

/** Set of internationalized strings.
@type {ElasticitySetter.i18n_strings}
*/
ElasticitySetter.i18n = goog.LOCALE === 'de' ? ElasticitySetter.de_strings :
    ElasticitySetter.en;

exports = ElasticitySetter;
