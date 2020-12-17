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

goog.module('myphysicslab.lab.model.ConcreteVariable');

const Util = goog.require('myphysicslab.lab.util.Util');
const Parameter = goog.require('myphysicslab.lab.util.Parameter');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const Variable = goog.require('myphysicslab.lab.model.Variable');

/** Represents a Variable in a {@link myphysicslab.lab.model.VarsList}.
@implements {Variable}
*/
class ConcreteVariable {
/**
@param {!Subject} varsList the VarsList which contains this Variable
@param {string} name the name of this Variable; this will be underscorized so the
    English name can be passed in here. See {@link Util#toName}.
@param {string} localName the localized name of this Variable
*/
constructor(varsList, name, localName) {
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', isComputed_: '+this.isComputed_
      +', localName_: "'+this.localName_+'"'
      +', varsList_: '+this.varsList_.toStringShort()
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : this.getClassName()+'{name_: "'+this.name_+'"'
      +', value_: '+Util.NF(this.getValue())+'}';
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
*/
getClassName() {
  return 'ConcreteVariable';
};

/** @override */
getAsString() {
  return this.value_.toString();
};

/** @override */
getBroadcast() {
  return this.doesBroadcast_;
};

/** @override */
getChoices() {
  return [];
};

/** @override */
getName(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @override */
getSequence() {
  return this.seq_;
};

/** @override */
getSubject() {
  return this.varsList_;
};

/** @override */
getValue() {
  return this.value_;
};

/** @override */
getValues() {
  return [];
};

/** @override */
incrSequence() {
  this.seq_++;
};

/** @override */
isComputed() {
  return this.isComputed_;
};

/** @override */
nameEquals(name) {
  return this.name_ == Util.toName(name);
};

/** @override */
setBroadcast(value) {
  this.doesBroadcast_ = value;
};

/** @override */
setComputed(value) {
  this.isComputed_ = value;
};

/** @override */
setFromString(value) {
  var v = Number(value);
  if (isNaN(v)) {
    throw 'not a number: '+value+' (ConcreteVariable.setFromString)';
  }
  this.setValue(v);
};

/** @override */
setValue(value) {
  if (this.value_ != value) {
    //if (isNaN(value)) { throw 'NaN (ConcreteVariable.setValue)'; }
    this.value_ = value;
    this.seq_++;
    if (this.doesBroadcast_) {
      this.varsList_.broadcast(this);
    }
  }
};

/** @override */
setValueSmooth(value) {
  //if (isNaN(value)) { throw 'NaN (ConcreteVariable.setValueSmooth)'; }
  this.value_ = value;
};

} // end class
exports = ConcreteVariable;
