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

goog.provide('myphysicslab.lab.util.ParameterBoolean');

goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;
var GenericEvent = myphysicslab.lab.util.GenericEvent;
var Parameter = myphysicslab.lab.util.Parameter;

/** Provides access to a boolean value of a {@link myphysicslab.lab.util.Subject
Subject}. See {@link myphysicslab.lab.util.Parameter} for more documentation.

@param {!myphysicslab.lab.util.Subject} subject the Subject whose value this
    ParameterBoolean represents
@param {string} name the name of this Parameter; this will be underscorized so the
    English name can be passed in here.
    See {@link myphysicslab.lab.util.UtilityCore#toName}.
@param {string} localName the localized name of this Parameter
@param {function(this: myphysicslab.lab.util.Subject): boolean} getter A method of
    `subject` with no arguments that returns the value of this Parameter
@param {function(this: myphysicslab.lab.util.Subject, boolean)} setter A method of
    `subject` with one argument that sets the value of this Parameter
@param {!Array<string>=} opt_choices the translated localized strings corresponding to
    the values (optional)
@param {!Array<boolean>=} opt_values the booleans corresponding to the choices that the
    parameter can be set to (optional)
@constructor
@final
@struct
@implements {myphysicslab.lab.util.Parameter}
*/
myphysicslab.lab.util.ParameterBoolean = function(subject, name, localName, getter,
    setter, opt_choices, opt_values) {
  /**
  @type {!myphysicslab.lab.util.Subject}
  @private
  */
  this.subject_ = subject;
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
  @type {function(this:myphysicslab.lab.util.Subject): boolean}
  @private
  */
  this.getter_ = getter;
  /**
  @type {function(this:myphysicslab.lab.util.Subject, boolean)}
  @private
  */
  this.setter_ = setter;
  /**
  @type {boolean}
  @private
  */
  this.isComputed_ = false;
  /** the translated localized strings corresponding to the values
  @type {!Array<string>}
  @private
  */
  this.choices_ = [];
  /** the booleans corresponding to the choices
  @type {!Array<boolean>}
  @private
  */
  this.values_ = [];
  if (goog.isDefAndNotNull(opt_choices)) {
    if (goog.isDefAndNotNull(opt_values)) {
      this.setChoices_(opt_choices, opt_values);
    } else {
      throw new Error('values not defined');
    }
  }
};
var ParameterBoolean = myphysicslab.lab.util.ParameterBoolean;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  ParameterBoolean.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', isComputed_: '+this.isComputed_
        +', subject_: '+this.subject_.toStringShort()
        +', localName_: "'+this.localName_+'"'
        +', choices_: '+this.choices_
        +'}';
  };

  /** @inheritDoc */
  ParameterBoolean.prototype.toStringShort = function() {
    return 'ParameterBoolean{name_: "'+this.name_+'"'
        +', value: '+this.getValue()+'}';
  };
};

/** @inheritDoc */
ParameterBoolean.prototype.getAsString = function() {
  return this.getValue().toString();
};

/** @inheritDoc */
ParameterBoolean.prototype.getChoices = function() {
  return goog.array.clone(this.choices_);
};

/** @inheritDoc */
ParameterBoolean.prototype.getName = function(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @inheritDoc */
ParameterBoolean.prototype.getSubject = function() {
  return this.subject_;
};

/** Returns the value of this ParameterBoolean.
@return {boolean} the value of this ParameterBoolean
*/
ParameterBoolean.prototype.getValue = function() {
  return this.getter_.call(this.subject_);
};

/** @inheritDoc */
ParameterBoolean.prototype.getValues = function() {
  return goog.array.map(this.values_, function(v) { return v.toString(); });
};

/** @inheritDoc */
ParameterBoolean.prototype.isComputed = function() {
  return this.isComputed_;
};

/** @inheritDoc */
ParameterBoolean.prototype.nameEquals = function(name) {
  return this.name_ == UtilityCore.toName(name);
};

/**  Sets the choices and values associated with this Parameter.
@param {!Array<string>} choices  localized strings giving name of each choice
@param {!Array<boolean>} values  the values corresponding to each choice
@throws {Error} if `values` is of different length than `choices`
*/
ParameterBoolean.prototype.setChoices = function(choices, values) {
  this.setChoices_(choices, values);
  var evt = new GenericEvent(this.subject_,Parameter.CHOICES_MODIFIED, this);
  this.subject_.broadcast(evt);
};

/**  Sets the choices and values associated with this ParameterBoolean.
@param {!Array<string>} choices  localized strings giving name of each choice
@param {!Array<boolean>} values  the boolean values corresponding to each choice
@private
*/
ParameterBoolean.prototype.setChoices_ = function(choices, values) {
  this.choices_ = choices;
  if (values.length !== choices.length) {
    throw new Error('choices and values not same length');
  }
  this.values_ = values;
};

/** @inheritDoc */
ParameterBoolean.prototype.setComputed = function(value) {
  this.isComputed_ = value;
};

/** @inheritDoc */
ParameterBoolean.prototype.setFromString = function(value) {
  this.setValue(value == 'true' || value == 'TRUE');
};

/** Sets the value of this ParameterBoolean.
@param {boolean} value the value to set this ParameterBoolean to
*/
ParameterBoolean.prototype.setValue = function(value) {
  if (!goog.isBoolean(value))
    throw new Error('non-boolean value: '+value);
  if (value !== this.getValue()) {
    this.setter_.call(this.subject_, value);
  }
};

}); // goog.scope
