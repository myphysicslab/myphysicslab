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

goog.provide('myphysicslab.lab.util.GenericEvent');

goog.require('myphysicslab.lab.util.SubjectEvent');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** A simple implementation of a SubjectEvent, represents an event that
has occurred in a Subject.

@param {!myphysicslab.lab.util.Subject} subject the Subject where the event occurred
@param {string} name the name of this event
@param {*=} value an optional value associated with this event
@constructor
@final
@struct
@implements {myphysicslab.lab.util.SubjectEvent}
*/
myphysicslab.lab.util.GenericEvent = function(subject, name, value) {
  /**
  @type {string}
  @private
  */
  this.name_ = UtilityCore.validName(UtilityCore.toName(name));
  /**
  @type {!myphysicslab.lab.util.Subject}
  @private
  */
  this.subject_ = subject;
  /**
  @type {*}
  @private
  */
  this.value_ = value;
};
var GenericEvent = myphysicslab.lab.util.GenericEvent;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  GenericEvent.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', subject_: '+this.subject_.toStringShort()
        +', value_: '+this.value_
        +'}';
  };

  /** @inheritDoc */
  GenericEvent.prototype.toStringShort = function() {
    return 'GenericEvent{name_:"'+this.name_+'"}';
  };
};

/** @inheritDoc */
GenericEvent.prototype.getName = function(opt_localized) {
  return this.name_;
};

/** @inheritDoc */
GenericEvent.prototype.getSubject = function() {
  return this.subject_;
};

/** Returns the value associated with this event.
@return {*} the value associated with this event
*/
GenericEvent.prototype.getValue = function() {
  return this.value_;
};

/** @inheritDoc */
GenericEvent.prototype.nameEquals = function(name) {
  return this.name_ == UtilityCore.toName(name);
};

}); // goog.scope
