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

import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { Connector } from '../../lab/engine2D/RigidBody.js';
import { DisplayConnector } from '../../lab/view/DisplayConnector.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DisplayObject } from '../../lab/view/DisplayObject.js';
import { DisplayRope } from '../../lab/view/DisplayRope.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { Force } from '../../lab/model/Force.js';
import { GenericEvent, Observer, Subject, SubjectEvent }
    from '../../lab/util/Observe.js';
import { Impulse } from '../../lab/model/Impulse.js';
import { Joint } from '../../lab/engine2D/Joint.js';
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { PathEndPoint } from '../../lab/engine2D/PathEndPoint.js';
import { PathJoint } from '../../lab/engine2D/PathJoint.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { RigidBodyEventHandler } from '../../lab/app/RigidBodyEventHandler.js';
import { Rope } from '../../lab/engine2D/Rope.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Memorizes a pair of SimObject and it's DisplayObject, so that the DisplayObject
* can be removed when the SimObject disappears from the SimList.
*/
type memPair = { simObj: SimObject, dispObj: DisplayObject };

/** Automatically creates a {@link DisplayObject} for most types
of {@link SimObject} when they are added to a
{@link SimList}. Observes the SimList of a
{@link Simulation}, adding or removing DisplayObjects
to/from a {@link DisplayList} to represent the Simulation.

The constructor processes all the objects currently on the SimList, creating
DisplayObjects for them.

### Setting the Style of a DisplayObject

To control the style (color, line thickness, etc) used for a particular DisplayObject
there are two approaches.

#### 1. Modify the style directly

Modify the DisplayObject's style directly after it has been created.  Here
is an example:
```js
simList.add(polygon1); // RigidBodyObserver creates a DisplayShape here
const dispPoly1 = displayList.findShape(polygon1);
dispPoly1.setFillStyle('red');
```

#### 2. Modify the prototype

Many DisplayObjects allow specifying a **prototype** DisplayObject. When a display
property is `undefined`, then the property is fetched from the prototype. If it is also
`undefined` on the prototype then a default value is used.

RigidBodyObserver sets up around a dozen prototype objects. The DisplayObjects that
RigidBodyObserver creates all have their prototypes set to be these objects. Keep in
mind that **all** objects with that prototype will be affected.

Here is an example where we cause Polygons to draw their names. For apps that extend
{@link sims/engine2D/Engine2DApp.Engine2DApp | Engine2DApp}, the `rbo` property is an instance of
RigidBodyObserver.
```js
this.rbo.protoPolygon.setNameFont('10pt sans-serif');
```

### Displaying Contact Forces

Instances of {@link Force} are displayed with {@link DisplayLine} objects.

The policy used here is to **only show the first contact Force** when there is a pair
of opposing contact Forces. Forces named 'contact_force1' are shown. Forces named
'contact_force2' are assumed to be the second Force of pair and are not displayed.

See {@link lab/util/Observe.GenericObserver | GenericObserver} for example code that sets the
color of the DisplayLine based on contact gap distance.
*/
export class RigidBodyObserver implements Observer {
  private displayList_: DisplayList;
  private simList_: SimList;
  /* List of DisplayObjects added to the DisplayList. This ensures that we only remove
  * objects that we have created.
  */
  private memPairs_: memPair[] = [];
  /** Prototype DisplayLine for showing forces other than contact and thrust forces.
  */
  protoForce: DisplayLine;
  /** Prototype DisplayLine for showing contact forces. */
  protoContactForce: DisplayLine;
  /** Prototype DisplayLine for showing thrust forces. */
  protoThrustForce: DisplayLine;
  /** Prototype DisplayLine for showing ConcreteLines. */
  protoConcreteLine: DisplayLine;
  /** Prototype DisplaySpring for showing Springs. */
  protoSpring: DisplaySpring;
  /** Prototype DisplaySpring for the spring that appears when user clicks mouse
  * near a RigidBody. See RigidBodyEventHandler.
  */
  protoDragSpring: DisplaySpring;
  /** Prototype DisplayRope for showing Ropes. */
  protoRope: DisplayRope;
  /** Prototype DisplayShape for showing Polygon. */
  protoPolygon: DisplayShape;
  /** Prototype DisplayShape for showing collisions. */
  protoCollision: DisplayShape;
  /** Prototype DisplayShape for showing PointMass objects. */
  protoPointMass: DisplayShape;
  /** Prototype DisplayShape for showing fixed, infinite mass Polygons. */
  protoFixedPolygon: DisplayShape;
  /** Prototype DisplayConnector for showing joints. */
  protoJoint: DisplayConnector;
  /** Prototype DisplayConnector for showing PathEndPoint. */
  protoPathEndPoint: DisplayConnector;

/**
@param simList SimList to observe; processes all objects currently on the SimList
@param displayList the DisplayList to add DisplayObjects to
*/
constructor(simList: SimList, displayList: DisplayList) {
  this.displayList_ = displayList;
  this.simList_ = simList;
  this.addBodies(simList.toArray());
  simList.addObserver(this);
  let dl = new DisplayLine();
  dl.setThickness(1);
  dl.setColor('blue');
  dl.setZIndex(10);
  this.protoForce = dl;

  dl = new DisplayLine();
  dl.setThickness(1);
  dl.setColor('red');
  //dl.setLineDash([3,5]);
  dl.setZIndex(10);
  this.protoContactForce = dl;

  dl = new DisplayLine();
  dl.setThickness(2);
  dl.setColor('magenta');
  this.protoThrustForce = dl;

  dl = new DisplayLine();
  dl.setThickness(8);
  this.protoConcreteLine = dl;

  let ds = new DisplaySpring();
  ds.setThickness(3);
  ds.setWidth(0.75);
  this.protoSpring = ds;

  ds = new DisplaySpring();
  ds.setThickness(2);
  ds.setWidth(0.5);
  this.protoDragSpring = ds;

  this.protoRope = new DisplayRope();
  this.protoPolygon = new DisplayShape();

  let dsh = new DisplayShape();
  dsh.setFillStyle('');
  dsh.setStrokeStyle('red');
  dsh.setZIndex(10);
  this.protoCollision = dsh;

  this.protoPointMass = new DisplayShape();

  dsh = new DisplayShape();
  dsh.setFillStyle('lightGray');
  dsh.setZIndex(-1);
  this.protoFixedPolygon = dsh;

  let dc = new DisplayConnector();
  dc.setRadius(2);
  dc.setColor('blue');
  dc.setZIndex(10);
  this.protoJoint = dc;

  dc = new DisplayConnector();
  dc.setRadius(3);
  dc.setColor('red');
  dc.setZIndex(10);
  this.protoPathEndPoint = dc;
};

/** @inheritDoc */
toString() {
  return 'RigidBodyObserver{'
    +'ordering: "'+RigidBodyObserver.ordering+'"'
    +', simList_: '+this.simList_.toStringShort()
    +', displayList_: '+this.displayList_.toStringShort()
    +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'RigidBodyObserver{}';
};

/** Add the DisplayObject to the DisplayList, following the setting of
* {@link ordering}.
* @param dispObj the DisplayObject to add
* @param simObj the SimObject being displayed
*/
private add_(dispObj: DisplayObject, simObj: SimObject): void {
  if (RigidBodyObserver.ordering == 'over') {
    this.displayList_.add(dispObj);
  } else {
    this.displayList_.prepend(dispObj);
  }
  this.memPairs_.push({simObj: simObj, dispObj: dispObj});
};

/** Creates DisplayObjects for the SimObjects, and add to DisplayList.
* @param bodies
*/
private addBodies(bodies: SimObject[]): void {
  bodies.forEach(obj => this.addBody(obj));
};

/** Creates DisplayObject for the SimObject, and adds DisplayObject to DisplayList.
* @param obj
*/
private addBody(obj: SimObject): void {
  if (this.displayList_.find(obj)) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof Polygon) {
    if (isFinite(obj.getMass())) {
      this.add_(new DisplayShape(obj, this.protoPolygon), obj);
    } else {
      this.add_(new DisplayShape(obj, this.protoFixedPolygon), obj);
    }
  } else if (obj instanceof Impulse) {
    const impulse = obj;
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
      const m = PointMass.makeCircle(width, impulse.getName());
      m.setPosition(impulse.getStartPoint());
      this.add_(new DisplayShape(m, this.protoCollision), obj);
    }
  } else if (obj instanceof Force) {
    const f = obj;
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
    this.add_(new DisplayConnector(obj, this.protoPathEndPoint), obj);
  } else if (obj instanceof Joint || obj instanceof PathJoint) {
    this.add_(new DisplayConnector(obj, this.protoJoint), obj);
  } else if (obj instanceof PointMass) {
    this.add_(new DisplayShape(obj, this.protoPointMass), obj);
  } else if (obj instanceof Spring) {
    if (obj.nameEquals(RigidBodyEventHandler.en.DRAG)) {
      this.add_(new DisplaySpring(obj, this.protoDragSpring), obj);
    } else {
      this.add_(new DisplaySpring(obj, this.protoSpring), obj);
    }
  } else if (obj instanceof Rope) {
    this.add_(new DisplayRope(obj, this.protoRope), obj);
  } else if (obj instanceof ConcreteLine) {
    this.add_(new DisplayLine(obj, this.protoConcreteLine), obj);
  } /*else {
    console.log('RigidBodyObserver unknown object '+obj);
  }*/
};

/** Removes DisplayObject for the given SimObject from the DisplayList.
* @param obj
*/
private removeBody(obj: SimObject): void {
  const pair = this.memPairs_.find(element => element.simObj === obj);
  if (pair) {
    this.displayList_.remove(pair.dispObj);
    Util.remove(this.memPairs_, pair);
  }
};

/** @inheritDoc */
observe(event: SubjectEvent) {
  if (event.getSubject() === this.simList_) {
    const obj = event.getValue() as SimObject;
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      this.removeBody(obj);
    }
  }
};

/** Whether to add the next object 'over' or 'under' other DisplayObjects with
* the same `zIndex`. See {@link DisplayObject.getZIndex}.
* 'over' means the next object will appear above other DisplayObjects
*  with the same `zIndex`; 'under' means it will appear below.
*/
static ordering = 'over';

} // end class

Util.defineGlobal('sims$engine2D$RigidBodyObserver', RigidBodyObserver);
