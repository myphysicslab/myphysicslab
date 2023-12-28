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

import { Arc } from './Arc.js'
import { ConcreteLine } from './ConcreteLine.js'
import { AbstractSubject } from '../util/AbstractSubject.js'
import { GenericEvent, Subject } from '../util/Observe.js'
import { MassObject } from './MassObject.js'
import { PointMass } from './PointMass.js'
import { SimObject } from './SimObject.js'
import { Spring } from './Spring.js'
import { Util } from '../util/Util.js'

/** The list of {@link SimObject}s that represent the current state of a
Simulation. For an ODESim the current state is dictated by its VarsList and the
SimObjects reflect that state in their positions. The SimObjects give additional
information that is not in the VarsList, such as size, shape, and mass of objects,
as well as forces like springs. The order of objects in a SimList has no significance,
it should be regarded as an unordered set.

The purpose of SimObjects and the SimList is two-fold:

1. to give the outside world a view of what is going on in the Simulation.

2. SimObjects are often used by the Simulation's internal calculations.

See {@link lab/view/DisplayObject.DisplayObject | DisplayObject} for a discussion of
how SimObjects are made visible to the user.

See {@link lab/app/SimController.SimController | SimController} for
information about how SimObjects participate in user interface interactions like
dragging an object.

Events Broadcast
----------------
A SimList is a Subject, so you can add one or more Observers to it. When SimObjects are
added or removed, the SimList broadcasts a GenericEvent with the name
{@link OBJECT_ADDED} or {@link OBJECT_REMOVED} to inform the Observers.
The value of the GenericEvent is the SimObject that was added or removed.

Similar Objects Are Not Added
-----------------------------
We avoid adding a SimObject when it has finite
{@link SimObject.getExpireTime expiration time} and is similar
to an existing SimObject as found using {@link getSimilar}.
There is a *tolerance setting* that determines when SimObjects are similar,
see {@link getTolerance}.

This is to prevent thousands of similar SimObjects being created which would only slow
performance without adding any significant information to the visual display. An example
of this is when we show forces in ContactSim.

*/
export class SimList extends AbstractSubject implements Subject {
  /** The SimObjectss that this SimList contains.*/
  private elements_: SimObject[] = [];
  private tolerance_: number = 0.1;

constructor() {
  super('SIM_LIST');
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', tolerance_: '+Util.NF(this.tolerance_)
      +', elements_: ['
      + this.elements_.map((e, idx) => idx+': '+e.toStringShort())
      + ']' + super.toString();
};

/** @inheritDoc */
override toStringShort() {
  return super.toStringShort().slice(0, -1)
      + ', length: '+this.elements_.length+'}';
};

/** @inheritDoc */
getClassName() {
  return 'SimList';
};

/** Adds the SimObject to this SimList. Notifies Observers by broadcasting
the {@link OBJECT_ADDED} event. For SimObjects with finite
{@link SimObject.getExpireTime expiration time}, we remove
any existing similar SimObject in this SimList, as found using
{@link getSimilar} with the default tolerance from
{@link getTolerance}.
@param objs the SimObjects to add
*/
add(...objs: SimObject[]) {
  for (let i=0; i<objs.length; i++) {
    const element = objs[i];
    if (!element) {
      throw 'cannot add invalid SimObject';
    }
    const expire = element.getExpireTime();
    if (isFinite(expire)) {
      let similar;
      while (similar = this.getSimilar(element)) {
        this.remove(similar);
      }
    }
    if (!this.elements_.includes(element)) {
      this.elements_.push(element);
      this.broadcast(new GenericEvent(this, SimList.OBJECT_ADDED, element));
    }
  }
};

/** Adds the set of SimObjects to this SimList. Notifies Observers by broadcasting the
{@link OBJECT_ADDED} event for each SimObject added.
@param objList the SimObjects to add
*/
addAll(objList: SimObject[]) {
  for (let i=0, len=objList.length; i<len; i++) {
    this.add(objList[i]);
  }
};

/** Removes all SimObjects from this SimList. Notifies Observers by broadcasting the
{@link OBJECT_REMOVED} event for each SimObject removed.
*/
clear(): void {
  this.removeAll(this.toArray());
};

/** Returns true if the SimObject is in this SimList.
@param simObj the SimObject to look for
@return true if the SimObject is in this SimList.
*/
contains(simObj: SimObject): boolean {
  return this.elements_.includes(simObj);
};

/** Returns the SimObject at the specified position in this SimList, or the first
SimObject in this SimList with the given name.
@param arg  index number or name of SimObject. Name should be English
    or language-independent version of name.
@return the SimObject at the specified position in this SimList,
    or with the given name
@throws if SimObject not found or index out of range
*/
get(arg: number|string): SimObject {
  if (typeof arg === 'number') {
    if (arg >= 0 && arg < this.elements_.length) {
      return this.elements_[arg];
    }
  } else if (typeof arg === 'string') {
    arg = Util.toName(arg);
    const e = this.elements_.find( obj => obj.getName() == arg);
    if (e !== undefined) {
      return e;
    }
  }
  throw 'SimList did not find '+arg;
};

/** Returns the Arc with the given name, if found in this SimList.
@param name name of Arc to find
@return the Arc with the given name
@throws if Arc not found
*/
getArc(name: string): Arc {
  const obj = this.get(name);
  if (obj instanceof Arc) {
    return obj;
  } else {
    throw 'no Arc named '+name;
  }
};

/** Returns the ConcreteLine with the given name, if found in this SimList.
@param name name of ConcreteLine to find
@return the ConcreteLine with the given name
@throws if ConcreteLine not found
*/
getConcreteLine(name: string): ConcreteLine {
  const obj = this.get(name);
  if (obj instanceof ConcreteLine) {
    return obj;
  } else {
    throw 'no ConcreteLine named '+name;
  }
};

/** Returns the MassObject with the given name, if found in this SimList.
@param name name of MassObject to find
@return the MassObject with the given name
@throws if MassObject not found
*/
getMassObject(name: string): MassObject {
  const obj = this.get(name);
  if (obj instanceof PointMass) {
    return obj;
  } else {
    throw 'no MassObject named '+name;
  }
};

/** Returns the PointMass with the given name, if found in this SimList.
@param name name of PointMass to find
@return the PointMass with the given name
@throws if PointMass not found
*/
getPointMass(name: string): PointMass {
  const obj = this.get(name);
  if (obj instanceof PointMass) {
    return obj;
  } else {
    throw 'no PointMass named '+name;
  }
};

/** Returns a similar SimObject already in this SimList, or `null` if there isn't one.
See {@link SimObject.similar} for how similarity is determined.
@param simObj the SimObject to use for comparison
@param tolerance the tolerance used when testing for similarity; default is
    given by {@link getTolerance}
@return a similar looking SimObject on this SimList,
    or `null` if there isn't one
*/
getSimilar(simObj: SimObject, tolerance?: number): null|SimObject {
  const tol = (tolerance === undefined) ? this.tolerance_ : tolerance;
  const r = this.elements_.find( obj => obj.similar(simObj, tol) );
  return r !== undefined ? r : null;
};

/** Returns the Spring with the given name, if found in this SimList.
@param name name of Spring to find
@return the Spring with the given name
@throws if Spring not found
*/
getSpring(name: string): Spring {
  const obj = this.get(name);
  if (obj instanceof Spring) {
    return obj;
  } else {
    throw 'no Spring named '+name;
  }
};

/** Returns the tolerance used for similarity testing when adding objects to this
SimList.
See {@link SimObject.similar} for how similarity is determined.
@return the tolerance used for similarity testing when adding SimObjects
*/
getTolerance(): number {
  return this.tolerance_;
};

/** Returns the index of the first occurrence of the specified SimObject in
this list, or -1 if this list does not contain the SimObject.
@param simObj the SimObject to look for
@return the index of the first occurrence of the specified SimObject in
    this list, or -1 if this list does not contain the SimObject
*/
indexOf(simObj: SimObject): number {
  return this.elements_.indexOf(simObj);
};

/** Returns the number of SimObjects in this SimList.
@return the number of SimObjects in this SimList.
*/
length(): number {
  return this.elements_.length;
};

/** Removes the SimObject from this SimList. Notifies Observers by broadcasting the
{@link OBJECT_REMOVED} event.
@param simObj the SimObject to remove
*/
remove(simObj: SimObject) {
  if (Util.remove(this.elements_, simObj)) {
    this.broadcast(new GenericEvent(this, SimList.OBJECT_REMOVED, simObj));
  }
};

/** Removes the set of SimObjects from this SimList. Notifies Observers by broadcasting
the {@link OBJECT_REMOVED} event for each SimObject removed.
@param objList the SimObjects to remove
*/
removeAll(objList: SimObject[]) {
  for (let i=0, len=objList.length; i<len; i++) {
    this.remove(objList[i]);
  }
};

/** Removes SimObjects from this SimList whose *expiration time* is less than the given
time. Notifies Observers by broadcasting the {@link OBJECT_REMOVED} event for
each SimObject removed.
See {@link SimObject.getExpireTime}
@param time the current simulation time
*/
removeTemporary(time: number) {
  for (let i = this.elements_.length-1; i >= 0; i--) {
    const simobj = this.elements_[i];
    if (simobj.getExpireTime() < time) {
      this.elements_.splice(i, 1);
      this.broadcast(new GenericEvent(this, SimList.OBJECT_REMOVED, simobj));
    }
  }
};

/** Sets the tolerance used for similarity testing when adding objects to this
SimList. See {@link SimObject.similar} for how similarity is determined.
@param tolerance the tolerance used for similarity testing when adding
    SimObjects
*/
setTolerance(tolerance: number) {
  this.tolerance_ = tolerance;
};

/** Returns an array containing all the SimObjects on this SimList.
@return an array containing all the SimObjects on this SimList.
*/
toArray(): SimObject[] {
  return Array.from(this.elements_);
};

/** Name of event broadcast when a SimObject is added to the SimList. */
static readonly OBJECT_ADDED = 'OBJECT_ADDED';

/** Name of event broadcast when a SimObject has been modified, but not added
* or removed from the SimList.
*/
static readonly OBJECT_MODIFIED = 'OBJECT_MODIFIED';

/** Name of event broadcast when a SimObject is removed from the SimList. */
static readonly OBJECT_REMOVED = 'OBJECT_REMOVED';

} // end class
