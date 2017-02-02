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

goog.provide('myphysicslab.lab.model.ConcreteVariable');

goog.require('myphysicslab.lab.model.Variable');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var NFE = myphysicslab.lab.util.UtilityCore.NFE;
var Parameter = myphysicslab.lab.util.Parameter;
var GenericEvent = myphysicslab.lab.util.GenericEvent;
var Subject = myphysicslab.lab.util.Subject;

/** Represents a variable in a {@link myphysicslab.lab.model.VarsList}.

@param {!Subject} varsList the VarsList which contains this Variable
@param {string} name the name of this Variable; this will be underscorized so the
    English name can be passed in here.
    See {@link myphysicslab.lab.util.UtilityCore#toName}.
@param {string} localName the localized name of this Variable
@constructor
@struct
@implements {myphysicslab.lab.model.Variable}
*/
myphysicslab.lab.model.ConcreteVariable = function(varsList, name, localName) {
  /** the VarsList which contains this Variable
  @type {!myphysicslab.lab.util.Subject}
  @private
  */
  this.varsList_ = varsList;
  /**
  @type {string}
  @private
  */
  this.name_ = UtilityCore.validName(UtilityCore.toName(name));
  /**
  @type {string}
  @private
  */
  this.localName_ = localName;
  /**
  @type {number}
  @private
  */
  this.value_ = 0;
  /**
  @type {boolean}
  @private
  */
  this.isComputed_ = false;
  /** Sequence numbers, to detect discontinuity in a variable,
  * see {@link myphysicslab.lab.model.VarsList#getSequence}.
  * @type {number}
  * @private
  */
  this.seq_ = 0;
  /**
  @type {boolean}
  @private
  */
  this.doesBroadcast_ = false;
};
var ConcreteVariable = myphysicslab.lab.model.ConcreteVariable;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  ConcreteVariable.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', isComputed_: '+this.isComputed_
        +', localName_: "'+this.localName_+'"'
        +', varsList_: '+this.varsList_.toStringShort()
        +'}';
  };

  /** @inheritDoc */
  ConcreteVariable.prototype.toStringShort = function() {
    return this.getClassName()+'{name_: "'+this.name_+'"'
        +', value_: '+NF(this.getValue())+'}';
  };
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
*/
ConcreteVariable.prototype.getClassName = function() {
  return 'ConcreteVariable';
};

/** @inheritDoc */
ConcreteVariable.prototype.getAsString = function() {
  return this.value_.toString();
};

/** @inheritDoc */
ConcreteVariable.prototype.getBroadcast = function() {
  return this.doesBroadcast_;
};

/** @inheritDoc */
ConcreteVariable.prototype.getChoices = function() {
  return [];
};

/** @inheritDoc */
ConcreteVariable.prototype.getName = function(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @inheritDoc */
ConcreteVariable.prototype.getSequence = function() {
  return this.seq_;
};

/** @inheritDoc */
ConcreteVariable.prototype.getSubject = function() {
  return this.varsList_;
};

/** @inheritDoc */
ConcreteVariable.prototype.getValue = function() {
  return this.value_;
};

/** @inheritDoc */
ConcreteVariable.prototype.getValues = function() {
  return [];
};

/** @inheritDoc */
ConcreteVariable.prototype.incrSequence = function() {
  this.seq_++;
};

/** @inheritDoc */
ConcreteVariable.prototype.isComputed = function() {
  return this.isComputed_;
};

/** @inheritDoc */
ConcreteVariable.prototype.nameEquals = function(name) {
  return this.name_ == UtilityCore.toName(name);
};

/** @inheritDoc */
ConcreteVariable.prototype.setBroadcast = function(value) {
  this.doesBroadcast_ = value;
};

/** @inheritDoc */
ConcreteVariable.prototype.setComputed = function(value) {
  this.isComputed_ = value;
};

/** @inheritDoc */
ConcreteVariable.prototype.setFromString = function(value) {
  var v = Number(value);
  if (isNaN(v)) {
    throw new Error('not a number: '+value+' (ConcreteVariable)');
  }
  this.setValue(v);
};

/** @inheritDoc */
ConcreteVariable.prototype.setValue = function(value) {
  if (this.value_ != value) {
    this.value_ = value;
    this.seq_++;
    if (this.doesBroadcast_) {
      this.varsList_.broadcast(this);
    }
  }
};

/** @inheritDoc */
ConcreteVariable.prototype.setValueSmooth = function(value) {
  this.value_ = value;
};

}); // goog.scope
