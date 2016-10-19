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

goog.provide('myphysicslab.sims.engine2D.RigidBodyObserver');

goog.require('myphysicslab.lab.engine2D.Joint');
goog.require('myphysicslab.lab.engine2D.PathEndPoint');
goog.require('myphysicslab.lab.engine2D.PathJoint');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.Rope');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.NumericalPath');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayConnector');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplayRope');
goog.require('myphysicslab.lab.view.DisplaySpring');

goog.scope(function() {

var lab = myphysicslab.lab;

var DisplayConnector = lab.view.DisplayConnector;
var DisplayLine = lab.view.DisplayLine;
var DisplayList = lab.view.DisplayList;
var DisplayObject = lab.view.DisplayObject;
var DisplayShape = lab.view.DisplayShape;
var DisplayRope = lab.view.DisplayRope;
var DisplaySpring = lab.view.DisplaySpring;
var Force = lab.model.Force;
var GenericEvent = lab.util.GenericEvent;
var Joint = lab.engine2D.Joint;
var ConcreteLine = lab.model.ConcreteLine;
var NumericalPath = lab.model.NumericalPath;
var Observer = lab.util.Observer;
var PathEndPoint = lab.engine2D.PathEndPoint;
var PathJoint = lab.engine2D.PathJoint;
var PointMass = lab.model.PointMass;
var Polygon = lab.engine2D.Polygon;
var Rope = lab.engine2D.Rope;
var SimList = lab.model.SimList;
var SimObject = lab.model.SimObject;
var Spring = lab.model.Spring;
var Subject = lab.util.Subject;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/** Automatically creates a {@link myphysicslab.lab.view.DisplayObject DisplayObject}
for most types of
{@link myphysicslab.lab.model.SimObject SimObject} when they are added to a
{@link myphysicslab.lab.model.SimList SimList}. Observes the SimList of a
{@link myphysicslab.lab.model.Simulation Simulation},
adding or removing DisplayObjects to a
{@link myphysicslab.lab.view.DisplayList DisplayList} to represent the Simulation.
The constructor processes all the objects currently on the SimList.

### Setting the Style of DisplayObject

To control the style (color, line thickness, etc) used for a particular DisplayObject
there are two approaches.

#### 1. Set the Default Style

Set the default style **before adding the SimObject** to the SimList. RigidBodyObserver
creates the DisplayObject at the moment when the SimObject is added to the SimList.
Here is an example:

    DisplayShape.fillStyle = 'red';
    simList.add(polygon1);

#### 2. Modify the style directly

Modify the DisplayObject's style directly after it has been created. Here
is an example:

    var dispPoly1 = displayList.findSimObject(polygon1);
    dispPoly1.fillStyle = 'red';


### Displaying Forces

Instances of {@link myphysicslab.lab.model.Force} are displayed with
{@link myphysicslab.lab.view.DisplayLine} objects.

The policy used here is to **only show the first contact Force** when there is a pair
of opposing contact Forces.

Forces named 'contact_force1' are displayed with a color correlated to the distance gap
of the contact point, from red (zero distance) to green (maximum contact distance).

Forces named 'contact_force2' are assumed to be the second Force of pair and are not
displayed.


@param {!myphysicslab.lab.model.SimList} simList SimList to observe, and will process
    all the objects currently on the SimList
@param {!myphysicslab.lab.view.DisplayList} displayList the DisplayList to add
    DisplayObjects to
@implements {myphysicslab.lab.util.Observer}
@constructor
@final
@struct
*/
myphysicslab.sims.engine2D.RigidBodyObserver = function(simList, displayList) {
  /**
  * @type {!myphysicslab.lab.view.DisplayList}
  * @private
  */
  this.displayList_ = displayList;
  /**
  @type {!myphysicslab.lab.model.SimList}
  @private
  */
  this.simList_ = simList;
  this.addBodies(simList.toArray());
  simList.addObserver(this);
  /** List of DisplayObjects added to the DisplayList. This ensures that we only remove
  * objects that we have created.
  * @type {Array<!RigidBodyObserver.memPair>}
  * @private
  */
  this.memPairs_ = [];
};
var RigidBodyObserver = myphysicslab.sims.engine2D.RigidBodyObserver;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  RigidBodyObserver.prototype.toString = function() {
    return 'RigidBodyObserver{'
      +'ordering: "'+RigidBodyObserver.ordering+'"'
      +', zIndex: '+RigidBodyObserver.zIndex
      +', simList_: '+this.simList_.toStringShort()
      +', displayList_: '+this.displayList_.toStringShort()
      +'}';
  };

  /** @inheritDoc */
  RigidBodyObserver.prototype.toStringShort = function() {
    return 'RigidBodyObserver{}';
  };
};

/**
* @typedef {{simObj: !SimObject, dispObj: !DisplayObject}}
*/
RigidBodyObserver.memPair;

/** Whether to add the next object 'over' or 'under' other DisplayObjects with
the same `zIndex`.
@type {string} 'over' means the next object will appear above other DisplayObjects
    with the same `zIndex`; 'under' means it will appear below.
*/
RigidBodyObserver.ordering = 'over';

/** The `zIndex` to use when adding objects to the DisplayList.
@type {number} the `zIndex` to use when adding objects to the DisplayList
*/
RigidBodyObserver.zIndex = 0;

/** Add the DisplayObject to the DisplayList, following the setting of
{@link #ordering}.
* @param {!DisplayObject} dispObj the DisplayObject to add
* @param {!SimObject} simObj the SimObject being displayed
* @param {number=} opt_zIndex
* @private
*/
RigidBodyObserver.prototype.add_ = function(dispObj, simObj, opt_zIndex) {
  var zIndex = opt_zIndex || RigidBodyObserver.zIndex;
  if (RigidBodyObserver.ordering == 'over') {
    this.displayList_.add(dispObj, zIndex);
  } else {
    this.displayList_.prepend(dispObj, zIndex);
  }
  this.memPairs_.push({simObj: simObj, dispObj: dispObj});
};

/** Creates DisplayObjects for the SimObjects, and add to DisplayList.
* @param {!Array<!myphysicslab.lab.model.SimObject>} bodies
* @private
*/
RigidBodyObserver.prototype.addBodies = function(bodies) {
  goog.array.forEach(bodies, goog.bind(this.addBody, this));
};

/** Creates DisplayObject for the SimObject, and adds DisplayObject to DisplayList.
* @param {!myphysicslab.lab.model.SimObject} obj
* @private
*/
RigidBodyObserver.prototype.addBody = function(obj) {
  if (this.displayList_.findSimObject(obj) != null) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof Polygon) {
    var p = /** @type {!myphysicslab.lab.engine2D.Polygon} */(obj);
    var d = new DisplayShape(p);
    this.add_(d, obj);
  } else if (obj instanceof Force) {
    var f = /** @type {!myphysicslab.lab.model.Force} */(obj);
    if (f.getName().match(/^CONTACT_FORCE2/) != null) {
      // Avoid showing second force in a pair of opposing forces;
      // the name indicates this is second force of pair.
      return;
    }
    var dl = new DisplayLine(f);
    dl.lineDash = [ ]; // [ 3, 5 ]
    if (f.getName().match(/^CONTACT_FORCE1/) != null) {
      // color by gap distance:  red = zero distance, green = max distance
      var pct = Math.max(0, Math.min(1, f.contactDistance/f.contactTolerance));
      dl.color = UtilityCore.colorToString6([1-pct, pct, 0]);
    } else if (f.getName().match(/^THRUSTER/) != null) {
      dl.color = 'magenta';
    } else {
      dl.color = 'blue';
    }
    this.add_(dl, obj, /*zIndex=*/10);
  } else if (obj instanceof PathEndPoint) {
    p = /** @type {!myphysicslab.lab.engine2D.Connector} */(obj);
    var dj = new DisplayConnector(p);
    dj.radius = 3;
    dj.color = 'gray';
    this.add_(dj, obj);
  } else if (obj instanceof Joint || obj instanceof PathJoint) {
    p = /** @type {!myphysicslab.lab.engine2D.Connector} */(obj);
    var dj = new DisplayConnector(p);
    dj.radius = 2;
    dj.color = 'blue';
    this.add_(dj, obj);
  } else if (obj instanceof PointMass) {
    p = /** @type {!myphysicslab.lab.model.PointMass} */(obj);
    var dp = new DisplayShape(p);
    if (p.getName() == 'COLLISION') {
      dp.fillStyle = '';
      dp.strokeStyle = 'red';
      dp.thickness = 1;
      dp.nameFont = '';
      dp.drawCenterOfMass = false;
      dp.drawDragPoints = false;
      this.add_(dp, obj, /*zIndex=*/10);
    } else {
      this.add_(dp, obj);
    }
  } else if (obj instanceof Spring) {
    p = /** @type {!myphysicslab.lab.model.Spring} */(obj);
    var ds = new DisplaySpring(p);
    this.add_(ds, obj);
  } else if (obj instanceof Rope) {
    p = /** @type {!myphysicslab.lab.engine2D.Rope} */(obj);
    var dr = new DisplayRope(p);
    this.add_(dr, obj);
  } else if (obj instanceof ConcreteLine) {
    p = /** @type {!myphysicslab.lab.model.ConcreteLine} */(obj);
    var dl2 = new DisplayLine(p);
    this.add_(dl2, obj);
  } else {
    //console.log('RigidBodyObserver unknown object '+obj);
  }
};

/** Removes DisplayObject for the given SimObject from the DisplayList.
* @param {!myphysicslab.lab.model.SimObject} obj
* @private
*/
RigidBodyObserver.prototype.removeBody = function(obj) {
  var pair = goog.array.find(this.memPairs_, function(element) {
    return element.simObj == obj;
  });
  if (pair != null) {
    this.displayList_.remove(pair.dispObj);
    goog.array.remove(this.memPairs_, pair);
  }
};

/** @inheritDoc */
RigidBodyObserver.prototype.observe =  function(event) {
  if (event.getSubject() == this.simList_) {
    var obj = /** @type {!myphysicslab.lab.model.SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      this.removeBody(obj);
    }
  }
};

});  // goog.scope
