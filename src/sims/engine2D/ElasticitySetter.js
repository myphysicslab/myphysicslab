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

goog.provide('myphysicslab.sims.engine2D.ElasticitySetter');

goog.require('goog.array');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.RigidBodySim');
goog.require('myphysicslab.lab.engine2D.ImpulseSim');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var lab = myphysicslab.lab;

var AbstractSubject = lab.util.AbstractSubject;
var GenericEvent = lab.util.GenericEvent;
var ImpulseSim = lab.engine2D.ImpulseSim;
var Observer = lab.util.Observer;
var ParameterNumber = lab.util.ParameterNumber;
var RigidBody = lab.engine2D.RigidBody;
var RigidBodySim = lab.engine2D.RigidBodySim;
var SimList = lab.model.SimList;
var Subject = lab.util.Subject;
var UtilityCore = lab.util.UtilityCore;

/** Provides a ParameterNumber for setting the elasticity of all RigidBodys in an
RigidBodySim.

ElasticitySetter remembers the last value it had even when there are no
RigidBodys. This is useful in situations where an application makes a new configuration
of RigidBodys and wants to find the user's desired value for elasticity.

WARNING: The elasticity reported here is only accurate if all modifications to
elasticity of RigidBodys are done thru this class or via
{@link myphysicslab.lab.engine2D.ImpulseSim#setElasticity}.

### Parameters Created

+ ParameterNumber named `ElasticitySetter.en.ELASTICITY` see {@link #setElasticity}

@param {!RigidBodySim} sim
@extends {AbstractSubject}
@implements {Subject}
@implements {Observer}
@constructor
@final
@struct
*/
myphysicslab.sims.engine2D.ElasticitySetter = function(sim) {
  AbstractSubject.call(this, 'ELASTICITY_SETTER');
  /**
  * @type {!myphysicslab.lab.engine2D.RigidBodySim}
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
      this.getElasticity, this.setElasticity).setSignifDigits(3));
};
var ElasticitySetter = myphysicslab.sims.engine2D.ElasticitySetter;
goog.inherits(ElasticitySetter, AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  ElasticitySetter.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', sim: '+this.sim_.toStringShort()
        + ElasticitySetter.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
ElasticitySetter.prototype.getClassName = function() {
  return 'ElasticitySetter';
};

/** Returns the minimum elasticity among all RigidBodys in the simulation.
If there are no RigidBodys, then the last value set or calculated is returned.
Elasticity is used when calculating collisions; a value of 1.0 means
perfect elasticity where the kinetic energy after collision is the same as before
(extremely bouncy), while a value of 0 means no elasticity (no bounce).
* @return {number} elasticity used when calculating collisions, a number from 0 to 1.
*/
ElasticitySetter.prototype.getElasticity = function() {
  this.lastValue_ = this.getElasticity_();
  return this.lastValue_;
};

/**
* @private
* @return {number}
*/
ElasticitySetter.prototype.getElasticity_ = function() {
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
ElasticitySetter.prototype.setElasticity = function(value) {
  goog.array.forEach(this.sim_.getBodies(), function(body) {
    body.setElasticity(value);
  });
  this.lastValue_ = value;
  this.broadcastParameter(ElasticitySetter.en.ELASTICITY);
};

/** @inheritDoc */
ElasticitySetter.prototype.observe =  function(event) {
  if (event.getSubject() == this.sim_ && event.nameEquals(ImpulseSim.ELASTICITY_SET)) {
    var nowValue = this.getElasticity_();
    if (this.lastValue_ != nowValue) {
      // only broadcast when last value we publicly have reported is wrong
      this.lastValue_ = nowValue;
      this.broadcastParameter(ElasticitySetter.en.ELASTICITY);
    }
  }
};


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

});  // goog.scope
