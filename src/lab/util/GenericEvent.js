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

goog.module('myphysicslab.lab.util.GenericEvent');

const Subject = goog.require('myphysicslab.lab.util.Subject');
const SubjectEvent = goog.require('myphysicslab.lab.util.SubjectEvent');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A simple implementation of a SubjectEvent, represents an event that
has occurred in a Subject.
@implements {SubjectEvent}
*/
class GenericEvent {
/**
@param {!Subject} subject the Subject where the event occurred
@param {string} name the name of the event
@param {*=} value an optional value associated with the event
*/
constructor(subject, name, value) {
  /**
  @type {string}
  @private
  */
  this.name_ = Util.validName(Util.toName(name));
  /**
  @type {!Subject}
  @private
  */
  this.subject_ = subject;
  /**
  @type {*}
  @private
  */
  this.value_ = value;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', subject_: '+this.subject_.toStringShort()
      +', value_: '+this.value_
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'GenericEvent{name_:"'+this.name_+'"}';
};

/** @override */
getName(opt_localized) {
  return this.name_;
};

/** @override */
getSubject() {
  return this.subject_;
};

/** Returns the value associated with this event.
@return {*} the value associated with this event
*/
getValue() {
  return this.value_;
};

/** @override */
nameEquals(name) {
  return this.name_ == Util.toName(name);
};

}
exports = GenericEvent;
