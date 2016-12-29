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

goog.provide('myphysicslab.lab.view.DisplayList');

goog.require('goog.array');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.util.MemoList');
goog.require('myphysicslab.lab.util.Memorizable');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var CoordMap = myphysicslab.lab.view.CoordMap;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var GenericEvent = myphysicslab.lab.util.GenericEvent;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Displays a set of {@link myphysicslab.lab.view.DisplayObject DisplayObjects},
which show the state of the simulation. A DisplayObject typically represents a
SimObject, but not always.

zIndex
------
DisplayObjects with a lower `zIndex` appear underneath those with higher `zIndex`.
The DisplayList is sorted by `zIndex`.
See {@link myphysicslab.lab.view.DisplayObject#getZIndex}.

* @param {string=} opt_name name of this DisplayList.
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.util.Subject}
* @extends {myphysicslab.lab.util.AbstractSubject}
*/
myphysicslab.lab.view.DisplayList = function(opt_name) {
  AbstractSubject.call(this, opt_name || 'DISPLAY_LIST_'+(DisplayList.NAME_ID++));
  /**
  * @type {!Array<!DisplayObject>}
  * @private
  */
  this.drawables_ = [];
};
var DisplayList = myphysicslab.lab.view.DisplayList;
goog.inherits(DisplayList, AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayList.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', drawables_: ['
        + goog.array.map(this.drawables_, function(d, idx) {
            return idx+': '+d.toStringShort();
          })
        + ']' + DisplayList.superClass_.toString.call(this);
  };

  /** @inheritDoc */
  DisplayList.prototype.toStringShort = function() {
    return DisplayList.superClass_.toStringShort.call(this).slice(0, -1)
        +', drawables_.length: '+this.drawables_.length +'}';
  };
};

/** @inheritDoc */
DisplayList.prototype.getClassName = function() {
  return 'DisplayList';
};

/**
* @type {number}
*/
DisplayList.NAME_ID = 1;

/** Name of event broadcast when a DisplayObject is added, see {@link #add},
* {@link #prepend}.
* @type {string}
* @const
*/
DisplayList.OBJECT_ADDED = 'OBJECT_ADDED';

/** Name of event broadcast when a DisplayObject is removed, see {@link #remove},
* {@link #removeAll}.
* @type {string}
* @const
*/
DisplayList.OBJECT_REMOVED = 'OBJECT_REMOVED';

/** Adds the DisplayObject, inserting it at the end of the group of DisplayObjects
with the same zIndex; the item will appear visually over objects that have
the same (or lower) `zIndex`.
@param {!DisplayObject} dispObj the DisplayObject to add
*/
DisplayList.prototype.add = function(dispObj) {
  if (!goog.isObject(dispObj)) {
    throw new Error('non-object passed to DisplayList.add');
  }
  var zIndex = dispObj.getZIndex();
  if (goog.DEBUG) {
    this.preExist(dispObj);
  }
  this.sort();
  // Objects in drawables_ array should be sorted by zIndex.
  // Starting at front of drawables_ array, find the object with bigger
  // zIndex, insert dispObj just before that object.
  for (var i=0, n= this.drawables_.length; i<n; i++) {
    var z = this.drawables_[i].getZIndex();
    if (zIndex < z) {
      break;
    }
  }
  goog.array.insertAt(this.drawables_, dispObj, i);
  this.broadcast(new GenericEvent(this, DisplayList.OBJECT_ADDED, dispObj));
};

/** Returns true if this DisplayList contains the given DisplayObject.
@param {!DisplayObject} dispObj the item to search for
@return {boolean} true if the DisplayObject was found
*/
DisplayList.prototype.contains = function(dispObj) {
  if (!goog.isObject(dispObj)) {
    throw new Error('non-object passed to DisplayList.contains');
  }
  return goog.array.contains(this.drawables_, dispObj);
};

/** Draws the DisplayObjects in order, which means that DisplayObjects drawn later (at
the end of the list) will appear to be on top of those drawn earlier (at start of the
list).
@param {!CanvasRenderingContext2D} context the canvas's context to draw this object into
@param {!CoordMap} map the mapping to use for translating between simulation and screen
    coordinates
*/
DisplayList.prototype.draw = function(context, map) {
  this.sort();
  goog.array.forEach(this.drawables_, function(dispObj) {
    dispObj.draw(context, map);
  });
};

/** Returns the DisplayObject that shows the given SimObject.
@param {!SimObject|string|number} search  the SimObject to search for, or name of
    SimObject, or index number of DisplayObject.
    Name should be English or language-independent version of name.
@return {?DisplayObject} the DisplayObject on this list that shows
    the given SimObject, or null if not found
*/
DisplayList.prototype.find = function(search) {
  if (goog.isNumber(search)) {
    var index = /** @type {number}*/(search);
    var n = this.drawables_.length;
    if (index < 0 || index >= n) {
      return null;
    } else {
      this.sort();
      return this.drawables_[index];
    }
  } else if (goog.isString(search)) {
    var objName = UtilityCore.toName(search);
    return goog.array.find(this.drawables_, function(element, index, array) {
      var simObjs = element.getSimObjects();
      for (var i=0, n=simObjs.length; i<n; i++) {
        if (simObjs[i].getName() == objName) {
          return true;
        }
      }
      return false;
    });
  } else if (goog.isObject(search)) {
    return goog.array.find(this.drawables_, function(element, index, array) {
      var simObjs = element.getSimObjects();
      return goog.array.contains(simObjs, search);
    });
  } else {
    return null;
  }
};

/** Returns the DisplayObject at the specified position in this DisplayList
@param {number} index  index number of DisplayObject
@return {!DisplayObject} the DisplayObject at the specified
    position in this DisplayList
@throws {Error} if index out of range
*/
DisplayList.prototype.get = function(index) {
  var n = this.drawables_.length;
  if (index < 0 || index >= n) {
    throw new Error(index+' is not in range 0 to '+(n-1));
  }
  this.sort();
  return this.drawables_[index];
};

/** Returns number of DisplayObjects in this DisplayList, minus 1.
@return number of DisplayObjects minus 1
*/
DisplayList.prototype.length = function() {
  return this.drawables_.length;
};

/**
@param {!DisplayObject} dispObj
@private
*/
DisplayList.prototype.preExist = function(dispObj) {
  if (goog.DEBUG) {
    var simObjs = dispObj.getSimObjects();
    for (var i=0, len=simObjs.length; i<len; i++) {
      var obj = simObjs[i];
      var preExist = this.find(obj);
      if (preExist != null) {
        console.log('*** WARNING PRE-EXISTING DISPLAYOBJECT '+preExist);
        console.log('*** FOR SIMOBJECT=' + obj);
        console.log('*** WHILE ADDING '+dispObj);
        throw new Error('pre-existing object '+preExist+' for '+obj+' adding '+dispObj);
      }
    }
  }
};

/** Adds the DisplayObject, inserting it at the front of the group of DisplayObjects
with the same zIndex; the item will appear visually under objects that have
the same (or higher) `zIndex`.
@param {!DisplayObject} dispObj the DisplayObject to prepend
*/
DisplayList.prototype.prepend = function(dispObj) {
  if (!goog.isObject(dispObj)) {
    throw new Error('non-object passed to DisplayList.add');
  }
  var zIndex = dispObj.getZIndex();
  if (goog.DEBUG) {
    this.preExist(dispObj);
  }
  this.sort();
  // Objects in drawables_ array should be sorted by zIndex.
  // Starting at back of drawables_ array, find the object with smaller
  // zIndex, insert dispObj just after that object.
  for (var n= this.drawables_.length, i=n; i>0; i--) {
    var z = this.drawables_[i-1].getZIndex();
    if (zIndex > z) {
      break;
    }
  }
  goog.array.insertAt(this.drawables_, dispObj, i);
  this.broadcast(new GenericEvent(this, DisplayList.OBJECT_ADDED, dispObj));
};

/** Removes the item from the list of DisplayObjects.
@param {!DisplayObject} dispObj the item to remove
*/
DisplayList.prototype.remove = function(dispObj) {
  if (!goog.isObject(dispObj)) {
    throw new Error('non-object passed to DisplayList.remove');
  }
  var idx = goog.array.indexOf(this.drawables_, dispObj);
  if (idx > -1) {
    goog.array.removeAt(this.drawables_, idx);
    this.broadcast(new GenericEvent(this, DisplayList.OBJECT_REMOVED, dispObj));
  };
};

/** Clears the list of DisplayObjects.
* @return {undefined}
*/
DisplayList.prototype.removeAll = function() {
  goog.array.forEachRight(this.drawables_, function(dispObj) {
    this.remove(dispObj);
  }, this);
};

/** Sorts the DisplayList by zIndex. Avoids sorting if the list is already sorted.
* @return {undefined}
*/
DisplayList.prototype.sort = function() {
  // avoid sorting if the list is already sorted
  var isSorted = true;
  var lastZ = UtilityCore.NEGATIVE_INFINITY;
  for (var i=0, n= this.drawables_.length; i<n; i++) {
    var z = this.drawables_[i].getZIndex();
    if (z < lastZ) {
      isSorted = false;
      break;
    }
    lastZ = z;
  }
  if (!isSorted) {
    goog.array.stableSort(this.drawables_, function(arg1, arg2) {
      var e1 = /** @type {!DisplayObject}*/(arg1);
      var e2 = /** @type {!DisplayObject}*/(arg2);
      var z1 = e1.getZIndex();
      var z2 = e2.getZIndex();
      if (z1 < z2) {
        return -1;
      } else if (z1 > z2) {
        return 1;
      } else {
        return 0;
      }
    });
  }
};

/**  Returns set of the DisplayObjects in proper visual sequence, starting with the
bottom-most object.
@return {!Array<!DisplayObject>} list of DisplayObjects in visual sequence order
*/
DisplayList.prototype.toArray = function() {
  this.sort();
  return goog.array.clone(this.drawables_);
};

}); // goog.scope
