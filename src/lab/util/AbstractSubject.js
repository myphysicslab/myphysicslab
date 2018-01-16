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

goog.module('myphysicslab.lab.util.AbstractSubject');

goog.require('goog.array');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const Parameter = goog.require('myphysicslab.lab.util.Parameter');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Implementation of {@link Subject} interface.

@implements {Subject}
@abstract
*/
class AbstractSubject {
/**
@param {string=} name
*/
constructor(name) {
  /* This implementation makes some direct calls on itself, so it is not
  * appropriate for a [decorator class](http://en.wikipedia.org/wiki/Decorator_pattern)
  * that needs to override methods of this class. If a class calls a method on itself,
  * then that method cannot be overridden by a decorator.
  */
  if (!name) {
    throw new Error('no name');
  }
  /**
  * @type {string}
  * @private
  */
  this.name_ = Util.validName(Util.toName(name));
  /** The list of Observers of this Subject.
  * @type {!Array<!Observer>}
  * @private
  */
  this.observers_ = [];
  /**
  * @type {!Array<!Parameter>}
  * @private
  */
  this.paramList_ = [];
  /**
  * @type {boolean}
  * @private
  */
  this.doBroadcast_ = true;
  /**
  * @type {boolean}
  * @private
  */
  this.isBroadcasting_ = false;
  /**
  * @type {!Array<!AbstractSubject.Command>}
  * @private
  */
  this.commandList_ = [];
};

/** @override */
toString() {
  // assumes that className and name are displayed by sub-class
  return Util.ADVANCED ? '' : ', parameters: ['
      + goog.array.map(this.paramList_, function(p) { return p.toStringShort(); })
      +'], observers: ['
      + goog.array.map(this.observers_, function(p) { return p.toStringShort(); })
      +']}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : this.getClassName()
      + '{name_: "' + this.getName() + '"}';
};

/** @override */
addObserver(observer) {
  /** @type {!AbstractSubject.Command} */
  var cmd = {
    action: true,
    observer: observer
  };
  this.commandList_.push(cmd);
  this.doCommands(); // if not broadcasting, this happens immediately
};

/** Execute the set of delayed commands to add/remove observers.
* This addresses the issue that an Observer can call addObserver or removeObserver
* during it's observe() method.
* @return {undefined}
* @private
*/
doCommands() {
  if (!this.isBroadcasting_) {
    for (var i=0, len=this.commandList_.length; i<len; i++) {
      var cmd = this.commandList_[i];
      if (cmd.action) {
        if (!goog.array.contains(this.observers_, cmd.observer)) {
          this.observers_.push(cmd.observer);
        }
      } else {
        goog.array.remove(this.observers_, cmd.observer);
      }
    }
    this.commandList_ = [];
  }
};

/** Adds the Parameter to the list of this Subject's available Parameters.
@throws {!Error} if a Parameter with the same name already exists.
@param {!Parameter} parameter the Parameter to add
*/
addParameter(parameter) {
  var name = parameter.getName();
  var p = this.getParam(name);
  if (p != null) {
    throw new Error('parameter '+name+' already exists: '+p);
  }
  this.paramList_.push(parameter);
};

/** @override */
broadcast(evt) {
  if (this.doBroadcast_) {
    this.isBroadcasting_ = true;
    try {
      // For debugging: can see events being broadcast here.
      //if (!this.getName().match(/.*GRAPH.*/i)) { console.log('broadcast '+evt); }
      goog.array.forEach(this.observers_, function(o) { o.observe(evt); });
    } finally {
      this.isBroadcasting_ = false;
      // do add/remove commands afterwards, in case an Observer called addObserver or
      // removeObserver during observe()
      this.doCommands();
    }
  }
};

/** @override */
broadcastParameter(name) {
  var p = this.getParam(name);
  if (p == null) {
    throw new Error('unknown Parameter '+name);
  }
  this.broadcast(p);
};

/** Returns whether broadcasting is enabled for this Subject.
See {@link #setBroadcast}.
@return {boolean} whether broadcasting is enabled for this Subject
@protected
*/
getBroadcast() {
  return this.doBroadcast_;
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
* @abstract
*/
getClassName() {};

/** @override */
getName() {
  return this.name_;
};

/** @override */
getObservers() {
  return goog.array.clone(this.observers_);
};

/** Returns the Parameter with the given name, or null if not found
* @param {string} name name of parameter to search for
* @return {?Parameter} the Parameter with the given name, or
    null if not found
* @private
*/
getParam(name) {
  name = Util.toName(name);
  return goog.array.find(this.paramList_, function(p) {
    return p.getName() == name;
  });
};

/** @override */
getParameter(name) {
  var p = this.getParam(name);
  if (p != null) {
    return p;
  }
  throw new Error('Parameter not found '+name);
};

/** @override */
getParameterBoolean(name) {
  var p = this.getParam(name);
  if (p instanceof ParameterBoolean) {
    return p;
  }
  throw new Error('ParameterBoolean not found '+name);
};

/** @override */
getParameterNumber(name) {
  var p = this.getParam(name);
  if (p instanceof ParameterNumber) {
    return p;
  }
  throw new Error('ParameterNumber not found '+name);
};

/** @override */
getParameterString(name) {
  var p = this.getParam(name);
  if (p instanceof ParameterString) {
    return p;
  }
  throw new Error('ParameterString not found '+name);
};

/** @override */
getParameters() {
  return goog.array.clone(this.paramList_);
};

/** @override */
removeObserver(observer) {
  /** @type {!AbstractSubject.Command} */
  var cmd = {
    action: false,
    observer: observer
  };
  this.commandList_.push(cmd);
  this.doCommands(); // if not broadcasting, this happens immediately
};

/** Removes the Parameter from the list of this Subject's available Parameters.
@param {!Parameter} parameter the Parameter to remove
*/
removeParameter(parameter) {
  goog.array.remove(this.paramList_, parameter);
};

/** Sets whether this Subject will broadcast events, typically used to temporarily
disable broadcasting. Intended to be used in situations where a subclass overrides a
method that broadcasts an event. This allows the subclass to prevent the superclass
broadcasting that event, so that the subclass can broadcast the event when the method is
completed.
@param {boolean} value whether this Subject should broadcast events
@return {boolean} the previous value
@protected
*/
setBroadcast(value) {
  var saveBroadcast = this.doBroadcast_;
  this.doBroadcast_ = value;
  return saveBroadcast;
};

}

/** A delayed command to add (`action=true`) or remove (`action=false`) an Observer.
* @typedef {{action: boolean, observer: !Observer}}
* @private
*/
AbstractSubject.Command;

exports = AbstractSubject;
