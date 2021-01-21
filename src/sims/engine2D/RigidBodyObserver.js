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

goog.module('myphysicslab.sims.engine2D.RigidBodyObserver');

const array = goog.require('goog.array');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const Connector = goog.require('myphysicslab.lab.engine2D.Connector');
const DisplayConnector = goog.require('myphysicslab.lab.view.DisplayConnector');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayList = goog.require('myphysicslab.lab.view.DisplayList');
const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const DisplayRope = goog.require('myphysicslab.lab.view.DisplayRope');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const Force = goog.require('myphysicslab.lab.model.Force');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const Impulse = goog.require('myphysicslab.lab.model.Impulse');
const Joint = goog.require('myphysicslab.lab.engine2D.Joint');
const NumericalPath = goog.require('myphysicslab.lab.model.NumericalPath');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const PathEndPoint = goog.require('myphysicslab.lab.engine2D.PathEndPoint');
const PathJoint = goog.require('myphysicslab.lab.engine2D.PathJoint');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBodyEventHandler = goog.require('myphysicslab.lab.app.RigidBodyEventHandler');
const Rope = goog.require('myphysicslab.lab.engine2D.Rope');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

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
    const dispPoly1 = displayList.findShape(polygon1);
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

@implements {Observer}
*/
class RigidBodyObserver {
/**
@param {!SimList} simList SimList to observe; processes all objects currently on the
    SimList
@param {!DisplayList} displayList the DisplayList to add DisplayObjects to
*/
constructor(simList, displayList) {
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'RigidBodyObserver{'
    +'ordering: "'+RigidBodyObserver.ordering+'"'
    +', simList_: '+this.simList_.toStringShort()
    +', displayList_: '+this.displayList_.toStringShort()
    +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'RigidBodyObserver{}';
};

/** Add the DisplayObject to the DisplayList, following the setting of
{@link #ordering}.
* @param {!DisplayObject} dispObj the DisplayObject to add
* @param {!SimObject} simObj the SimObject being displayed
* @private
*/
add_(dispObj, simObj) {
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
addBodies(bodies) {
  bodies.forEach(obj => this.addBody(obj));
};

/** Creates DisplayObject for the SimObject, and adds DisplayObject to DisplayList.
* @param {!SimObject} obj
* @private
*/
addBody(obj) {
  if (this.displayList_.find(obj) != null) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof Polygon) {
    const p = /** @type {!Polygon} */(obj);
    if (isFinite(p.getMass())) {
      this.add_(new DisplayShape(p, this.protoPolygon), obj);
    } else {
      this.add_(new DisplayShape(p, this.protoFixedPolygon), obj);
    }
  } else if (obj instanceof Impulse) {
    const impulse = /** @type {!Impulse} */(obj);
    if (impulse.getName().match(/^IMPULSE2/) != null) {
      // Avoid showing second impulse in a pair of opposing impulses;
      // the name indicates this is second force of pair.
      return;
    }
    if (impulse.getName().match(/^IMPULSE1/) != null) {
      // Show impulse as a circle with area proportional to magnitude
      const radius = Math.sqrt(Math.abs(5 * impulse.getMagnitude())/Math.PI);
      // minimum diameter is 0.02
      const width = Math.max(0.02, Math.abs(2*radius));
      const m = PointMass.makeCircle(width, impulse.getName()).setMass(0);
      m.setPosition(impulse.getStartPoint());
      this.add_(new DisplayShape(m, this.protoCollision), obj);
    }
  } else if (obj instanceof Force) {
    const f = /** @type {!Force} */(obj);
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
    const p = /** @type {!Connector} */(obj);
    this.add_(new DisplayConnector(p, this.protoPathEndPoint), obj);
  } else if (obj instanceof Joint || obj instanceof PathJoint) {
    const p = /** @type {!Connector} */(obj);
    this.add_(new DisplayConnector(p, this.protoJoint), obj);
  } else if (obj instanceof PointMass) {
    const p = /** @type {!PointMass} */(obj);
    this.add_(new DisplayShape(p, this.protoPointMass), obj);
  } else if (obj instanceof Spring) {
    const p = /** @type {!Spring} */(obj);
    if (p.nameEquals(RigidBodyEventHandler.en.DRAG)) {
      this.add_(new DisplaySpring(p, this.protoDragSpring), obj);
    } else {
      this.add_(new DisplaySpring(p, this.protoSpring), obj);
    }
  } else if (obj instanceof Rope) {
    const p = /** @type {!Rope} */(obj);
    this.add_(new DisplayRope(p, this.protoRope), obj);
  } else if (obj instanceof ConcreteLine) {
    const p = /** @type {!ConcreteLine} */(obj);
    this.add_(new DisplayLine(p, this.protoConcreteLine), obj);
  } else {
    //console.log('RigidBodyObserver unknown object '+obj);
  }
};

/** Removes DisplayObject for the given SimObject from the DisplayList.
* @param {!SimObject} obj
* @private
*/
removeBody(obj) {
  const pair = array.find(this.memPairs_, element => element.simObj == obj);
  if (pair != null) {
    this.displayList_.remove(pair.dispObj);
    array.remove(this.memPairs_, pair);
  }
};

/** @override */
observe(event) {
  if (event.getSubject() == this.simList_) {
    const obj = /** @type {!SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      this.removeBody(obj);
    }
  }
};

} // end class

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

exports = RigidBodyObserver;
