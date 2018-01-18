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

goog.require('myphysicslab.lab.app.RigidBodyEventHandler');
goog.require('myphysicslab.lab.engine2D.Connector');
goog.require('myphysicslab.lab.engine2D.Joint');
goog.require('myphysicslab.lab.engine2D.PathEndPoint');
goog.require('myphysicslab.lab.engine2D.PathJoint');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.Rope');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.Impulse');
goog.require('myphysicslab.lab.model.NumericalPath');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayConnector');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.DisplayRope');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');

goog.scope(function() {

var lab = myphysicslab.lab;

var ConcreteLine = lab.model.ConcreteLine;
var Connector = lab.engine2D.Connector;
var DisplayConnector = lab.view.DisplayConnector;
var DisplayLine = lab.view.DisplayLine;
var DisplayList = lab.view.DisplayList;
var DisplayObject = lab.view.DisplayObject;
var DisplayRope = lab.view.DisplayRope;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
var Force = lab.model.Force;
const GenericEvent = goog.module.get('myphysicslab.lab.util.GenericEvent');
var Impulse = lab.model.Impulse;
var Joint = lab.engine2D.Joint;
var NumericalPath = lab.model.NumericalPath;
const Observer = goog.module.get('myphysicslab.lab.util.Observer');
var PathEndPoint = lab.engine2D.PathEndPoint;
var PathJoint = lab.engine2D.PathJoint;
var PointMass = lab.model.PointMass;
var Polygon = lab.engine2D.Polygon;
var RigidBodyEventHandler = lab.app.RigidBodyEventHandler;
var Rope = lab.engine2D.Rope;
var SimList = lab.model.SimList;
var SimObject = lab.model.SimObject;
var Spring = lab.model.Spring;
var Subject = lab.util.Subject;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Automatically creates a {@link DisplayObject} for most types of {@link SimObject}
when they are added to a {@link SimList}. Observes the SimList of a
{@link myphysicslab.lab.model.Simulation Simulation}, adding or removing DisplayObjects
to/from a {@link DisplayList} to represent the Simulation.

The constructor processes all the objects currently on the SimList.

### Setting the Style of a DisplayObject

To control the style (color, line thickness, etc) used for a particular DisplayObject
there are two approaches.

#### 1. Modify the style directly

Modify the DisplayObject's style directly after it has been created.  Here
is an example:

    simList.add(polygon1); // RigidBodyObserver creates a DisplayShape here
    var dispPoly1 = displayList.findShape(polygon1);
    dispPoly1.setFillStyle('red');


#### 2. Modify the prototype

Many DisplayObjects allow specifying a **prototype** DisplayObject. When a display
property is `undefined`, then the property is fetched from the prototype. If it is also
`undefined` on the prototype then a default value is used.

RigidBodyObserver sets up around a dozen prototype objects. The DisplayObjects that
RigidBodyObserver creates all have their prototypes set to be these objects. Keep in
mind that **all** objects with that prototype will be affected.

Here is an example where we cause Polygons to draw their names. For apps that extend
{@link myphysicslab.sims.engine2D.Engine2DApp}, the `rbo` property is an instance of
RigidBodyObserver.

    this.rbo.protoPolygon.setNameFont('10pt sans-serif');


### Displaying Contact Forces

Instances of {@link Force} are displayed with
{@link DisplayLine} objects.

The policy used here is to **only show the first contact Force** when there is a pair
of opposing contact Forces. Forces named 'contact_force1' are shown. Forces named
'contact_force2' are assumed to be the second Force of pair and are not displayed.

See {@link myphysicslab.lab.util.GenericObserver} for example code that sets the color
of the DisplayLine based on contact gap distance.


@param {!SimList} simList SimList to observe; processes all objects currently on the
    SimList
@param {!DisplayList} displayList the DisplayList to add DisplayObjects to
@implements {Observer}
@constructor
@final
@struct
*/
myphysicslab.sims.engine2D.RigidBodyObserver = function(simList, displayList) {
  /**
  * @type {!DisplayList}
  * @private
  */
  this.displayList_ = displayList;
  /**
  @type {!SimList}
  @private
  */
  this.simList_ = simList;
  this.addBodies(simList.toArray());
  simList.addObserver(this);
  /** List of DisplayObjects added to the DisplayList. This ensures that we only remove
  * objects that we have created.
  * @type {!Array<!RigidBodyObserver.memPair>}
  * @private
  */
  this.memPairs_ = [];
  /** Prototype DisplayLine for showing forces other than contact and thrust forces.
  * @type {!DisplayLine}
  */
  this.protoForce = new DisplayLine().setThickness(1).setColor('blue');
  this.protoForce.setZIndex(10);
  /** Prototype DisplayLine for showing contact forces.
  * @type {!DisplayLine}
  */
  this.protoContactForce = new DisplayLine().setThickness(1).setColor('red');
  // .setLineDash([3,5]);
  this.protoContactForce.setZIndex(10);
  /** Prototype DisplayLine for showing thrust forces.
  * @type {!DisplayLine}
  */
  this.protoThrustForce = new DisplayLine().setThickness(2).setColor('magenta');
  /** Prototype DisplayLine for showing ConcreteLines.
  * @type {!DisplayLine}
  */
  this.protoConcreteLine = new DisplayLine().setThickness(8);
  /** Prototype DisplaySpring for showing Springs.
  * @type {!DisplaySpring}
  */
  this.protoSpring = new DisplaySpring().setThickness(3).setWidth(0.75);
  /** Prototype DisplaySpring for the spring that appears when user clicks mouse
  * near a RigidBody. See RigidBodyEventHandler.
  * @type {!DisplaySpring}
  */
  this.protoDragSpring = new DisplaySpring().setThickness(2).setWidth(0.5);
  /** Prototype DisplayRope for showing Ropes.
  * @type {!DisplayRope}
  */
  this.protoRope = new DisplayRope();
  /** Prototype DisplayShape for showing Polygon.
  * @type {!DisplayShape}
  */
  this.protoPolygon = new DisplayShape();
  /** Prototype DisplayShape for showing collisions.
  * @type {!DisplayShape}
  */
  this.protoCollision = new DisplayShape().setFillStyle('').setStrokeStyle('red');
  this.protoCollision.setZIndex(10);
  /** Prototype DisplayShape for showing PointMass objects.
  * @type {!DisplayShape}
  */
  this.protoPointMass = new DisplayShape();
  /** Prototype DisplayShape for showing fixed, infinite mass Polygons.
  * @type {!DisplayShape}
  */
  this.protoFixedPolygon = new DisplayShape()
      .setFillStyle('').setFillStyle('lightGray');
  this.protoFixedPolygon.setZIndex(-1);
  /** Prototype DisplayConnector for showing joints.
  * @type {!DisplayConnector}
  */
  this.protoJoint = new DisplayConnector().setRadius(2).setColor('blue');
  this.protoJoint.setZIndex(10);
  /** Prototype DisplayConnector for showing PathEndPoint.
  * @type {!DisplayConnector}
  */
  this.protoPathEndPoint = new DisplayConnector().setRadius(3).setColor('red');
  this.protoPathEndPoint.setZIndex(10);
};
var RigidBodyObserver = myphysicslab.sims.engine2D.RigidBodyObserver;

/** @override */
RigidBodyObserver.prototype.toString = function() {
  return Util.ADVANCED ? '' : 'RigidBodyObserver{'
    +'ordering: "'+RigidBodyObserver.ordering+'"'
    +', simList_: '+this.simList_.toStringShort()
    +', displayList_: '+this.displayList_.toStringShort()
    +'}';
};

/** @override */
RigidBodyObserver.prototype.toStringShort = function() {
  return Util.ADVANCED ? '' : 'RigidBodyObserver{}';
};

/**
* @typedef {{simObj: !SimObject, dispObj: !DisplayObject}}
*/
RigidBodyObserver.memPair;

/** Whether to add the next object 'over' or 'under' other DisplayObjects with
the same `zIndex`. See {@link DisplayObject#getZIndex}.
@type {string} 'over' means the next object will appear above other DisplayObjects
    with the same `zIndex`; 'under' means it will appear below.
*/
RigidBodyObserver.ordering = 'over';

/** Add the DisplayObject to the DisplayList, following the setting of
{@link #ordering}.
* @param {!DisplayObject} dispObj the DisplayObject to add
* @param {!SimObject} simObj the SimObject being displayed
* @private
*/
RigidBodyObserver.prototype.add_ = function(dispObj, simObj) {
  if (RigidBodyObserver.ordering == 'over') {
    this.displayList_.add(dispObj);
  } else {
    this.displayList_.prepend(dispObj);
  }
  this.memPairs_.push({simObj: simObj, dispObj: dispObj});
};

/** Creates DisplayObjects for the SimObjects, and add to DisplayList.
* @param {!Array<!SimObject>} bodies
* @private
*/
RigidBodyObserver.prototype.addBodies = function(bodies) {
  goog.array.forEach(bodies, goog.bind(this.addBody, this));
};

/** Creates DisplayObject for the SimObject, and adds DisplayObject to DisplayList.
* @param {!SimObject} obj
* @private
*/
RigidBodyObserver.prototype.addBody = function(obj) {
  if (this.displayList_.find(obj) != null) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof Polygon) {
    var p = /** @type {!Polygon} */(obj);
    if (isFinite(p.getMass())) {
      this.add_(new DisplayShape(p, this.protoPolygon), obj);
    } else {
      this.add_(new DisplayShape(p, this.protoFixedPolygon), obj);
    }
  } else if (obj instanceof Impulse) {
    var impulse = /** @type {!Impulse} */(obj);
    if (impulse.getName().match(/^IMPULSE2/) != null) {
      // Avoid showing second impulse in a pair of opposing impulses;
      // the name indicates this is second force of pair.
      return;
    }
    if (impulse.getName().match(/^IMPULSE1/) != null) {
      // Show impulse as a circle with area proportional to magnitude
      var radius = Math.sqrt(Math.abs(5 * impulse.getMagnitude())/Math.PI);
      // minimum diameter is 0.02
      var width = Math.max(0.02, Math.abs(2*radius));
      var m = PointMass.makeCircle(width, impulse.getName()).setMass(0);
      m.setPosition(impulse.getStartPoint());
      this.add_(new DisplayShape(m, this.protoCollision), obj);
    }
  } else if (obj instanceof Force) {
    var f = /** @type {!Force} */(obj);
    if (f.getName().match(/^CONTACT_FORCE2/) != null) {
      // Avoid showing second force in a pair of opposing forces;
      // the name indicates this is second force of pair.
      return;
    }
    if (f.getName().match(/^CONTACT_FORCE1/) != null) {
      // See myphysicslab.lab.util.GenericObserver example about setting color
      // of the DisplayLine based on contact gap distance.
      this.add_(new DisplayLine(f, this.protoContactForce), obj);
    } else if (f.getName().match(/^THRUSTER/) != null) {
      this.add_(new DisplayLine(f, this.protoThrustForce), obj);
    } else {
      this.add_(new DisplayLine(f, this.protoForce), obj);
    }
  } else if (obj instanceof PathEndPoint) {
    p = /** @type {!Connector} */(obj);
    this.add_(new DisplayConnector(p, this.protoPathEndPoint), obj);
  } else if (obj instanceof Joint || obj instanceof PathJoint) {
    p = /** @type {!Connector} */(obj);
    this.add_(new DisplayConnector(p, this.protoJoint), obj);
  } else if (obj instanceof PointMass) {
    p = /** @type {!PointMass} */(obj);
    this.add_(new DisplayShape(p, this.protoPointMass), obj);
  } else if (obj instanceof Spring) {
    p = /** @type {!Spring} */(obj);
    if (p.nameEquals(RigidBodyEventHandler.en.DRAG)) {
      this.add_(new DisplaySpring(p, this.protoDragSpring), obj);
    } else {
      this.add_(new DisplaySpring(p, this.protoSpring), obj);
    }
  } else if (obj instanceof Rope) {
    p = /** @type {!Rope} */(obj);
    this.add_(new DisplayRope(p, this.protoRope), obj);
  } else if (obj instanceof ConcreteLine) {
    p = /** @type {!ConcreteLine} */(obj);
    this.add_(new DisplayLine(p, this.protoConcreteLine), obj);
  } else {
    //console.log('RigidBodyObserver unknown object '+obj);
  }
};

/** Removes DisplayObject for the given SimObject from the DisplayList.
* @param {!SimObject} obj
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

/** @override */
RigidBodyObserver.prototype.observe =  function(event) {
  if (event.getSubject() == this.simList_) {
    var obj = /** @type {!SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      this.removeBody(obj);
    }
  }
};

});  // goog.scope
