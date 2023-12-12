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

import { AbstractSubject } from "../util/AbstractSubject.js"
import { CoordMap } from "./CoordMap.js"
import { DisplayObject } from "./DisplayObject.js"
import { DisplayShape } from "./DisplayShape.js"
import { DisplaySpring } from "./DisplaySpring.js"
import { GenericEvent, Subject } from "../util/Observe.js"
import { SimObject } from "../model/SimObject.js"
import { Util } from "../util/Util.js"

/** A set of {@link DisplayObject}'s, which show the state of the simulation. A
DisplayObject typically represents a {@link SimObject}, but not always.

zIndex
------
DisplayObjects with a lower `zIndex` appear underneath those with higher `zIndex`.
The DisplayList is sorted by `zIndex`. See {@link DisplayObject.getZIndex}.

*/
export class DisplayList extends AbstractSubject implements Subject {
  private drawables_: DisplayObject[] = [];
  private changed_: boolean = true;

/**
* @param opt_name name of this DisplayList.
*/
constructor(opt_name?: string) {
  super(opt_name || 'DISPLAY_LIST_'+(DisplayList.NAME_ID++));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', drawables_: ['
      + this.drawables_.map((d, idx) => idx+': '+d.toStringShort())
      + ']' + super.toString();
};

/** @inheritDoc */
override toStringShort() {
  return super.toStringShort().slice(0, -1)
      +', drawables_.length: '+this.drawables_.length +'}';
};

/** @inheritDoc */
getClassName() {
  return 'DisplayList';
};

/** Adds the DisplayObject, inserting it at the end of the group of DisplayObjects
with the same zIndex; the item will appear visually over objects that have
the same (or lower) `zIndex`.
@param dispObjs the DisplayObject's to add
*/
add(...dispObjs: DisplayObject[]): void {
  dispObjs.forEach( dispObj => {
    if (!Util.isObject(dispObj)) {
      throw 'non-object: '+dispObj;
    }
    const zIndex = dispObj.getZIndex();
    if (Util.DEBUG) {
      this.preExist(dispObj);
    }
    this.sort();
    // Objects in drawables_ array should be sorted by zIndex.
    // Starting at front of drawables_ array, find the object with bigger
    // zIndex, insert dispObj just before that object.
    let i = this.drawables_.findIndex(d => zIndex < d.getZIndex());
    i = i < 0 ? this.drawables_.length : i;
    this.drawables_.splice(i, 0, dispObj);
    this.changed_ = true;
    this.broadcast(new GenericEvent(this, DisplayList.OBJECT_ADDED, dispObj));
  });
};

/** Returns true if this DisplayList contains the given DisplayObject.
@param dispObj the item to search for
@return true if the DisplayObject was found
*/
contains(dispObj: DisplayObject): boolean {
  if (!Util.isObject(dispObj)) {
    throw 'non-object passed to DisplayList.contains';
  }
  return this.drawables_.includes(dispObj);
};

/** Draws the DisplayObjects in order, which means that DisplayObjects drawn later (at
the end of the list) will appear to be on top of those drawn earlier (at start of the
list).
@param context the canvas's context to draw this object into
@param map the mapping to use for translating between simulation and screen
    coordinates
*/
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  this.sort();
  this.drawables_.forEach(dispObj => dispObj.draw(context, map));
};

/** Returns the DisplayObject that shows the given SimObject.
@param search  the SimObject to search for, or name of
    SimObject, or index number of DisplayObject.
    Name should be English or language-independent version of name.
@return the DisplayObject on this list that shows
    the given SimObject, or undefined if not found
*/
find(search: SimObject|string|number): DisplayObject|undefined {
  if (typeof search === 'number') {
    const index = search;
    const n = this.drawables_.length;
    if (index < 0 || index >= n) {
      return undefined;
    } else {
      this.sort();
      return this.drawables_[index];
    }
  } else if (typeof search === 'string') {
    const objName = Util.toName(search);
    //return array.find(this.drawables_, element => {
    return this.drawables_.find(element => {
      const simObjs = element.getSimObjects();
      for (let i=0, n=simObjs.length; i<n; i++) {
        if (simObjs[i].getName() == objName) {
          return true;
        }
      }
      return false;
    });
  } else if (Util.isObject(search)) {
    //return array.find(this.drawables_, element => {
    return this.drawables_.find(element => {
      const simObjs = element.getSimObjects();
      //return array.contains(simObjs, search);
      return simObjs.some(element => element === search);
    });
  } else {
    return undefined;
  }
};

/** Returns the DisplayShape that shows the given SimObject.
@param search  the SimObject to search for, or name of
    SimObject, or index number of DisplayObject.
    Name should be English or language-independent version of name.
@return the DisplayShape on this list that shows
    the given SimObject
@throws if DisplayShape is not found
*/
findShape(search: SimObject|string|number): DisplayShape {
  const ds = this.find(search);
  if (ds instanceof DisplayShape) {
    return ds;
  }
  throw 'DisplayShape not found: '+search;
};

/** Returns the DisplaySpring that shows the given SimObject.
@param search  the SimObject to search for, or name of
    SimObject, or index number of DisplayObject.
    Name should be English or language-independent version of name.
@return the DisplaySpring on this list that shows
    the given SimObject
@throws if DisplaySpring is not found
*/
findSpring(search: SimObject|string|number): DisplaySpring {
  const ds = this.find(search);
  if (ds instanceof DisplaySpring) {
    return ds;
  }
  throw 'DisplaySpring not found: '+search;
};

/** Returns the DisplayObject at the specified position in this DisplayList
@param index  index number of DisplayObject
@return the DisplayObject at the specified
    position in this DisplayList
@throws if index out of range
*/
get(index: number): DisplayObject {
  const n = this.drawables_.length;
  if (index < 0 || index >= n) {
    throw index+' is not in range 0 to '+(n-1);
  }
  this.sort();
  return this.drawables_[index];
};

/** Returns true if any DisplayObject on this DisplayList has changed, and sets the
state to "unchanged".
@return whether any DisplayObject on this DisplayList this DisplayObject
    has changed
*/
getChanged(): boolean {
  let chg = false;
  for (let i=0, n=this.drawables_.length; i<n; i++) {
    const c = this.drawables_[i].getChanged();
    chg = chg || c;
  }
  if (chg || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Returns number of DisplayObjects in this DisplayList, minus 1.
@return number of DisplayObjects minus 1
*/
length(): number {
  return this.drawables_.length;
};

private preExist(dispObj: DisplayObject): void {
  if (Util.DEBUG) {
    const simObjs = dispObj.getSimObjects();
    for (let i=0, len=simObjs.length; i<len; i++) {
      const obj = simObjs[i];
      const preExist = this.find(obj);
      if (preExist != null) {
        console.log('*** WARNING PRE-EXISTING DISPLAYOBJECT '+preExist);
        console.log('*** FOR SIMOBJECT=' + obj);
        console.log('*** WHILE ADDING '+dispObj);
        throw 'pre-existing object '+preExist+' for '+obj+' adding '+dispObj;
      }
    }
  }
};

/** Adds the DisplayObject, inserting it at the front of the group of DisplayObjects
with the same zIndex; the item will appear visually under objects that have
the same (or higher) `zIndex`.
@param dispObj the DisplayObject to prepend
*/
prepend(dispObj: DisplayObject) {
  if (!Util.isObject(dispObj)) {
    throw 'non-object passed to DisplayList.add';
  }
  const zIndex = dispObj.getZIndex();
  if (Util.DEBUG) {
    this.preExist(dispObj);
  }
  this.sort();
  // Objects in drawables_ array should be sorted by zIndex.
  // Starting at back of drawables_ array, find the object with smaller
  // zIndex, insert dispObj just after that object.
  let n = this.drawables_.length;
  let i;
  for (i=n; i>0; i--) {
    const z = this.drawables_[i-1].getZIndex();
    if (zIndex > z) {
      break;
    }
  }
  //array.insertAt(this.drawables_, dispObj, i);
  this.drawables_.splice(i, 0, dispObj);
  this.changed_ = true;
  this.broadcast(new GenericEvent(this, DisplayList.OBJECT_ADDED, dispObj));
};

/** Removes the item from the list of DisplayObjects.
@param dispObj the item to remove
*/
remove(dispObj: DisplayObject): void {
  if (!Util.isObject(dispObj)) {
    throw 'non-object passed to DisplayList.remove';
  }
  const idx = this.drawables_.indexOf(dispObj);
  if (idx > -1) {
    //array.removeAt(this.drawables_, idx);
    this.drawables_.splice(idx, 1);
    this.changed_ = true;
    this.broadcast(new GenericEvent(this, DisplayList.OBJECT_REMOVED, dispObj));
  };
};

/** Clears the list of DisplayObjects.*/
removeAll(): void {
  //array.forEachRight(this.drawables_, dispObj => this.remove(dispObj));
  Util.forEachRight(this.drawables_, dispObj => this.remove(dispObj), this);
};

/** Sorts the DisplayList by zIndex. Avoids sorting if the list is already sorted.*/
sort(): void {
  // avoid sorting if the list is already sorted
  let isSorted = true;
  let lastZ = Number.NEGATIVE_INFINITY;
  for (let i=0, n= this.drawables_.length; i<n; i++) {
    const z = this.drawables_[i].getZIndex();
    if (z < lastZ) {
      isSorted = false;
      break;
    }
    lastZ = z;
  }
  if (!isSorted) {
    this.drawables_.sort(function(e1: DisplayObject, e2: DisplayObject) {
      const z1 = e1.getZIndex();
      const z2 = e2.getZIndex();
      if (z1 < z2) {
        return -1;
      } else if (z1 > z2) {
        return 1;
      } else {
        return 0;
      }
    });
    this.changed_ = true;
  }
};

/**  Returns set of the DisplayObjects in proper visual sequence, starting with the
bottom-most object.
@return list of DisplayObjects in visual sequence order
*/
toArray(): DisplayObject[] {
  this.sort();
  return Array.from(this.drawables_);
};

/** Name of event broadcast when a DisplayObject is added, see {@link DisplayList.add},
* {@link DisplayList.prepend}.
*/
static readonly OBJECT_ADDED = 'OBJECT_ADDED';

/** Name of event broadcast when a DisplayObject is removed,
* see {@link DisplayList.remove}, {@link DisplayList.removeAll}.
*/
static readonly OBJECT_REMOVED = 'OBJECT_REMOVED';

static NAME_ID = 1;

}; // end DisplayList class

Util.defineGlobal('lab$view$DisplayList', DisplayList);
