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
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

const Util = goog.module.get('myphysicslab.lab.util.Util');
const Parameter = goog.module.get('myphysicslab.lab.util.Parameter');
const GenericEvent = goog.module.get('myphysicslab.lab.util.GenericEvent');
const Subject = goog.module.get('myphysicslab.lab.util.Subject');

/** Represents a variable in a {@link myphysicslab.lab.model.VarsList}.

@param {!Subject} varsList the VarsList which contains this Variable
@param {string} name the name of this Variable; this will be underscorized so the
    English name can be passed in here. See {@link Util#toName}.
@param {string} localName the localized name of this Variable
@constructor
@struct
@implements {myphysicslab.lab.model.Variable}
*/
myphysicslab.lab.model.ConcreteVariable = function(varsList, name, localName) {
  /** the VarsList which contains this Variable
  @type {!Subject}
  @private
  */
  this.varsList_ = varsList;
  /**
  @type {string}
  @private
  */
  this.name_ = Util.validName(Util.toName(name));
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

/** @override */
ConcreteVariable.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', isComputed_: '+this.isComputed_
      +', localName_: "'+this.localName_+'"'
      +', varsList_: '+this.varsList_.toStringShort()
      +'}';
};

/** @override */
ConcreteVariable.prototype.toStringShort = function() {
  return Util.ADVANCED ? '' : this.getClassName()+'{name_: "'+this.name_+'"'
      +', value_: '+Util.NF(this.getValue())+'}';
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
*/
ConcreteVariable.prototype.getClassName = function() {
  return 'ConcreteVariable';
};

/** @override */
ConcreteVariable.prototype.getAsString = function() {
  return this.value_.toString();
};

/** @override */
ConcreteVariable.prototype.getBroadcast = function() {
  return this.doesBroadcast_;
};

/** @override */
ConcreteVariable.prototype.getChoices = function() {
  return [];
};

/** @override */
ConcreteVariable.prototype.getName = function(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @override */
ConcreteVariable.prototype.getSequence = function() {
  return this.seq_;
};

/** @override */
ConcreteVariable.prototype.getSubject = function() {
  return this.varsList_;
};

/** @override */
ConcreteVariable.prototype.getValue = function() {
  return this.value_;
};

/** @override */
ConcreteVariable.prototype.getValues = function() {
  return [];
};

/** @override */
ConcreteVariable.prototype.incrSequence = function() {
  this.seq_++;
};

/** @override */
ConcreteVariable.prototype.isComputed = function() {
  return this.isComputed_;
};

/** @override */
ConcreteVariable.prototype.nameEquals = function(name) {
  return this.name_ == Util.toName(name);
};

/** @override */
ConcreteVariable.prototype.setBroadcast = function(value) {
  this.doesBroadcast_ = value;
};

/** @override */
ConcreteVariable.prototype.setComputed = function(value) {
  this.isComputed_ = value;
};

/** @override */
ConcreteVariable.prototype.setFromString = function(value) {
  var v = Number(value);
  if (isNaN(v)) {
    throw new Error('not a number: '+value+' (ConcreteVariable)');
  }
  this.setValue(v);
};

/** @override */
ConcreteVariable.prototype.setValue = function(value) {
  if (this.value_ != value) {
    this.value_ = value;
    this.seq_++;
    if (this.doesBroadcast_) {
      this.varsList_.broadcast(this);
    }
  }
};

/** @override */
ConcreteVariable.prototype.setValueSmooth = function(value) {
  this.value_ = value;
};

}); // goog.scope
