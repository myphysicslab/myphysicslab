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
When a DisplayObject is added, you can assign it a `zIndex` (the default is zero).
Objects with the same `zIndex` are grouped together in the DisplayList.

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
  /** The zIndex corresponding to each DisplayObject in drawables_ list.
  * @type {!Array<number>}
  * @private
  */
  this.zIndexes_ = [];
};
var DisplayList = myphysicslab.lab.view.DisplayList;
goog.inherits(DisplayList, AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayList.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', drawables_: ['
        + goog.array.map(this.drawables_, function(d) { return d.toStringShort(); })
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
@param {number=} opt_zIndex Specifies front-to-back ordering of objects;
    objects with a higher zIndex are drawn over objects with a lower zIndex.
    Default is zero.
*/
DisplayList.prototype.add = function(dispObj, opt_zIndex) {
  if (!goog.isObject(dispObj)) {
    throw new Error('non-object passed to DisplayList.add');
  }
  var zIndex = opt_zIndex || 0;
  if (goog.DEBUG) {
    this.preExist(dispObj);
  }
  if (!goog.array.contains(this.drawables_, dispObj)) {
    // Objects in drawables_ array should be sorted by zIndex.
    // Starting at end of drawables_ array, find the object with same or lower
    // zIndex, insert dispObj just after that object.
    var idx = goog.array.findIndexRight(this.zIndexes_,
      function(element, index, array) {
        var z = /** @type {number}*/(element);
        return z <= zIndex;
      });
    if (idx > -1) {
      goog.array.insertAt(this.drawables_, dispObj, idx+1);
      goog.array.insertAt(this.zIndexes_, zIndex, idx+1);
    } else {
      // all existing zIndexes are larger, so add dispObj to start of array
      this.drawables_.unshift(dispObj);
      this.zIndexes_.unshift(zIndex);
    }
    goog.asserts.assert(this.drawables_.length == this.zIndexes_.length);
  }
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
@param {!CoordMap} map the mapping to use for translating between
simulation and screen coordinates
*/
DisplayList.prototype.draw = function(context, map) {
  goog.array.forEach(this.drawables_, function(dispObj) {
    dispObj.draw(context, map);
  });
};

/** Returns the DisplayObject that shows the given SimObject.
@param {!SimObject} simObj  the SimObject to search for
@return {?DisplayObject} the DisplayObject on this list that shows
    the given SimObject, or null if not found
*/
DisplayList.prototype.findSimObject = function(simObj) {
  if (simObj == null)
    return null;
  return goog.array.find(this.drawables_, function(element, index, array) {
    var simObjs = element.getSimObjects();
    return goog.array.contains(simObjs, simObj);
  });
};

/** Returns the DisplayObject at the specified position in this DisplayList
@param {number} index  index number of DisplayObject
@return {!DisplayObject} the DisplayObject at the specified
    position in this DisplayList
@throws {Error} if index out of range
*/
DisplayList.prototype.get = function(index) {
  if (index < 0 || index >= this.drawables_.length)
    throw new Error();
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
      var preExist = this.findSimObject(obj);
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
@param {number=} opt_zIndex Specifies front-to-back ordering of objects;
    objects with a higher zIndex are drawn over objects with a lower zIndex.
    Default is zero.
*/
DisplayList.prototype.prepend = function(dispObj, opt_zIndex) {
  if (!goog.isObject(dispObj)) {
    throw new Error('non-object passed to DisplayList.prepend');
  }
  var zIndex = opt_zIndex || 0;
  if (goog.DEBUG) {
    this.preExist(dispObj);
  }
  if (!goog.array.contains(this.drawables_, dispObj)) {
    // Objects in drawables_ array should be sorted by zIndex.
    // Starting at beginning of drawables_ array, find the object with same or higher
    // zIndex, insert dispObj just before that object.
    var idx = goog.array.findIndex(this.zIndexes_,
      function(element, index, array) {
        var z = /** @type {number}*/(element);
        return z >= zIndex;
      });
    if (idx > -1) {
      goog.array.insertAt(this.drawables_, dispObj, idx);
      goog.array.insertAt(this.zIndexes_, zIndex, idx);
    } else {
      // all existing zIndexes are smaller, so add dispObj to end of array
      this.drawables_.push(dispObj);
      this.zIndexes_.push(zIndex);
    }
    goog.asserts.assert(this.drawables_.length == this.zIndexes_.length);
  }
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
    goog.array.removeAt(this.zIndexes_, idx);
    goog.asserts.assert(this.drawables_.length == this.zIndexes_.length);
  };
  this.broadcast(new GenericEvent(this, DisplayList.OBJECT_REMOVED, dispObj));
};

/** Clears the list of DisplayObjects.
* @return {undefined}
*/
DisplayList.prototype.removeAll = function() {
  goog.array.forEachRight(this.drawables_, function(dispObj) {
    this.remove(dispObj);
  }, this);
};

/**  Returns set of the DisplayObjects in proper visual sequence, starting with the
bottom-most object.
@return {!Array<!DisplayObject>} list of DisplayObjects in visual sequence order
*/
DisplayList.prototype.toArray = function() {
  return goog.array.clone(this.drawables_);
};

}); // goog.scope
