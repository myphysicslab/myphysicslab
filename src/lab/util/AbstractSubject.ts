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

import { Printable, Util } from "./Util.js";
import { Observer, Parameter, ParameterBoolean, ParameterNumber, ParameterString,
    Subject, SubjectEvent } from "./Observe.js";

/** A delayed command to add (`action=true`) or remove (`action=false`) an Observer.
*/
type Command = {
  action: boolean;
  observer: Observer;
};

/** Implementation of {@link Subject} interface. */
export abstract class AbstractSubject implements Subject {
  private name_: string;
  private observers_: Observer[] = [];
  private paramList_: Parameter[] = [];
  private doBroadcast_ = true;
  private isBroadcasting_ = false;
  private commandList_: Command[] = [];

/**
@param name
*/
constructor(name?: string) {
  /* This implementation makes some direct calls on itself, so it is not
  * appropriate for a [decorator class](http://en.wikipedia.org/wiki/Decorator_pattern)
  * that needs to override methods of this class. If a class calls a method on itself,
  * then that method cannot be overridden by a decorator.
  */
  if (!name) {
    throw 'no name';
  }
  this.name_ = Util.validName(Util.toName(name));
};

/** @inheritDoc */
toString() {
  // assumes that className and name are displayed by sub-class
  return ', parameters: ['
      + this.paramList_.map(p => p.toStringShort())
      +'], observers: ['
      + this.observers_.map(p => p.toStringShort())
      +']}';
};

/** @inheritDoc */
toStringShort() {
  return this.getClassName()
      + '{name_: "' + this.getName() + '"}';
};

/** @inheritDoc */
addObserver(observer: Observer): void {
  const cmd = {
    action: true,
    observer: observer
  };
  this.commandList_.push(cmd);
  this.doCommands(); // if not broadcasting, this happens immediately
};

/** Execute the set of delayed commands to add/remove observers.
* This addresses the issue that an Observer can call addObserver or removeObserver
* during it's observe() method.
*/
private doCommands(): void {
  if (!this.isBroadcasting_) {
    for (let i=0, len=this.commandList_.length; i<len; i++) {
      const cmd = this.commandList_[i];
      if (cmd.action) {
        if (!this.observers_.includes(cmd.observer)) {
          this.observers_.push(cmd.observer);
        }
      } else {
        Util.remove(this.observers_, cmd.observer);
      }
    }
    this.commandList_ = [];
  }
};

/** Adds the Parameter to the list of this Subject's available Parameters.
@throws if a Parameter with the same name already exists.
@param parameter the Parameter to add
*/
addParameter(parameter: Parameter): void {
  const name = parameter.getName();
  const p = this.getParam_(name);
  if (p != null) {
    throw 'parameter '+name+' already exists: '+p;
  }
  this.paramList_.push(parameter);
};

/** @inheritDoc */
broadcast(evt: SubjectEvent): void {
  if (this.doBroadcast_) {
    this.isBroadcasting_ = true;
    try {
      // For debugging: can see events being broadcast here.
      //if (!this.getName().match(/.*GRAPH.*/i)) { console.log('broadcast '+evt); }
      //if (!evt.getName().match(/OBJECT.*|AUTO_SCALE/i) &&
      //    !this.getName().match(/.*GRAPH.*/i)) {
      //  console.log('broadcast '+evt.toStringShort());
      //}
      //console.log('broadcast '+evt.toStringShort());
      this.observers_.forEach(o => o.observe(evt));
    } finally {
      this.isBroadcasting_ = false;
      // do add/remove commands afterwards, in case an Observer called addObserver or
      // removeObserver during observe()
      this.doCommands();
    }
  }
};

/** @inheritDoc */
broadcastParameter(name: string): void {
  const p = this.getParam_(name);
  if (p == null) {
    throw 'unknown Parameter '+name;
  }
  this.broadcast(p);
};

/** Returns whether broadcasting is enabled for this Subject.
See {@link setBroadcast}.
@return whether broadcasting is enabled for this Subject
*/
protected getBroadcast(): boolean {
  return this.doBroadcast_;
};

/** Returns name of class of this object.
* @return name of class of this object.
*/
abstract getClassName(): string;

/** @inheritDoc */
getName(): string {
  return this.name_;
};

/** @inheritDoc */
getObservers(): Observer[] {
  return Array.from(this.observers_);
};

/** Returns the Parameter with the given name, or null if not found
* @param name name of parameter to search for
* @return the Parameter with the given name, or undefined if not found
*/
private getParam_(name: string): Parameter|undefined {
  name = Util.toName(name);
  return this.paramList_.find(p => p.getName() == name);
};

/** @inheritDoc */
getParameter(name: string): Parameter {
  const p = this.getParam_(name);
  if (p !== undefined) {
    return p;
  }
  throw 'Parameter not found '+name;
};

/** @inheritDoc */
getParameterBoolean(name: string): ParameterBoolean {
  const p = this.getParam_(name);
  if (p instanceof ParameterBoolean) {
    return p;
  }
  throw 'ParameterBoolean not found '+name;
};

/** @inheritDoc */
getParameterNumber(name: string): ParameterNumber {
  const p = this.getParam_(name);
  if (p instanceof ParameterNumber) {
    return p;
  }
  throw 'ParameterNumber not found '+name;
};

/** @inheritDoc */
getParameterString(name: string): ParameterString {
  const p = this.getParam_(name);
  if (p instanceof ParameterString) {
    return p;
  }
  throw 'ParameterString not found '+name;
};

/** @inheritDoc */
getParameters(): Parameter[] {
  return Array.from(this.paramList_);
};

/** @inheritDoc */
removeObserver(observer: Observer): void {
  const cmd = {
    action: false,
    observer: observer
  };
  this.commandList_.push(cmd);
  this.doCommands(); // if not broadcasting, this happens immediately
};

/** Removes the Parameter from the list of this Subject's available Parameters.
@param parameter the Parameter to remove
*/
removeParameter(parameter: Parameter): void {
  Util.remove(this.paramList_, parameter);
};

/** Sets whether this Subject will broadcast events, typically used to temporarily
disable broadcasting. Intended to be used in situations where a subclass overrides a
method that broadcasts an event. This allows the subclass to prevent the superclass
broadcasting that event, so that the subclass can broadcast the event when the method is
completed.
@param value whether this Subject should broadcast events
@return the previous value
*/
protected setBroadcast(value: boolean): boolean {
  const saveBroadcast = this.doBroadcast_;
  this.doBroadcast_ = value;
  return saveBroadcast;
};

} // end AbstractSubject class

Util.defineGlobal('lab$util$AbstractSubject', AbstractSubject);
