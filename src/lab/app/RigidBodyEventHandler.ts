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

import { Clock } from '../util/Clock.js';
import { EventHandler, ModifierKeys } from './EventHandler.js';
import { PointMass } from '../model/PointMass.js';
import { RigidBody } from '../engine2D/RigidBody.js';
import { RigidBodySim } from '../engine2D/RigidBodySim.js';
//import { Shapes } from '../engine2D/Shapes.js';
import { SimObject } from '../model/SimObject.js';
import { Spring } from '../model/Spring.js';
import { ThrusterSet } from '../engine2D/ThrusterSet.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** User interface controller for {@link RigidBodySim}, provides mouse dragging of
nearest moveable {@link RigidBody}, and keyboard thrust controls for one or two
selected RigidBodys.

Mouse Drag
----------
When the Clock is running, mouse dragging is accomplished by connecting a spring between
the RigidBody and the mouse position. The spring has zero rest length. The spring
stiffness can be set via {@link setDragStiffness}.

When the Clock is not running, mouse dragging will move the RigidBody. Holding down the
alt, meta, or control key will rotate the RigidBody when moving the mouse.

Thrusters
---------
One or two RigidBodys can be specified to have keyboard activated thruster controls with
{@link setThrusters}. You can specify a {@link ThrusterSet} of thrust forces for each
RigidBody. The keyboard commands to fire thrusters are:

+ Right hand controls: keys J, K, L, I and arrow keys.
+ Left hand controls: keys S, D, F, E.

Some of the key commands will fire pairs of 'side ways' thrust controls. Holding shift
key changes the pair of thrusters to give a rotation effect.

**TO DO** extract the stuff about thrusters into a subclass or decorating class, so that
the mouse drag stuff could be reused separately.

*/
export class RigidBodyEventHandler implements EventHandler  {
  private sim_: RigidBodySim;
  private clock_: Clock;
  private thrustRight_: null|ThrusterSet = null;
  private thrustLeft_: null|ThrusterSet = null;
  private dragStiffness_: number = 3.0;
  private dragSpring_: null|Spring  = null;
  private mousePoint_: PointMass;
  private dragObj_: number = -1;
  /**  whether alt, meta or control key is down */
  private optionKey_: boolean = false;
  /**  for rotating a body */
  private startDragAngle_: number = 0;
  /**  for rotating a body */
  private startBodyAngle_: number = 0;
  /**
  * Remember whether shift key was down when these keys (left, right, S, F)
  * are first pressed, so that we use the same value for shift key when
  * the key is released.  (Fixes the 'stuck thruster' problem).
  */
  private shiftLeft_: boolean = false;
  private shiftRight_: boolean = false;
  private shiftS_: boolean = false;
  private shiftF_: boolean = false;

/**
* @param sim the simulation to handle events for
* @param clock the clock that determines whether the simulation is running
*/
constructor(sim: RigidBodySim, clock: Clock) {
  this.sim_ = sim;
  this.clock_ = clock;
  this.mousePoint_ = PointMass.makeCircle(1, 'mouse position');
  this.mousePoint_.setMass(Infinity);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', clock_: '+this.clock_.toStringShort()
      +', thrustRight_: '+this.thrustRight_
      +', thrustLeft_: '+this.thrustLeft_
      +', dragStiffness_: '+Util.NF(this.dragStiffness_)
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'RigidBodyEventHandler{sim: '+this.sim_.toStringShort()+'}';
};

/** Set the given ThrusterSet to be activated by keyboard thrust controls.
Right hand controls: keys `J, K, L, I` and arrow keys.
Left hand controls: keys `S, D, F, E`.
@param thrusters the ThrusterSet to be activated by keyboard commands, or null to turn
    off this set of thruster controls
@param side 'right' sets right hand controls, 'left' sets left hand controls
*/
setThrusters(thrusters: null|ThrusterSet, side: string) {
  if (side == 'right') {
    this.thrustRight_ = thrusters;
  } else if (side == 'left') {
    this.thrustLeft_ = thrusters;
  } else {
    throw 'unknown side '+side;
  }
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, location: Vector, offset: Vector,
    dragBody: null|Vector, modifiers: ModifierKeys): boolean {
  this.optionKey_ = modifiers.alt || modifiers.meta || modifiers.control || false;
  this.resetDrag();
  const numBods = this.sim_.getBodies().length;
  for (let i=0; i<numBods; i++) {
    if (simObject === this.sim_.getBody(i))
      this.dragObj_ = i;
  }
  if (this.dragObj_ > -1) {
    const body = this.sim_.getBody(this.dragObj_);
    if (!this.clock_.isRunning()) {
      if (this.optionKey_) {
        // record starting angles
        this.startBodyAngle_ = body.getAngle();
        this.startDragAngle_ = Math.atan2(offset.getY(), offset.getX());
      }
    } else if (dragBody != null) {
      this.dragSpring_ = new Spring(RigidBodyEventHandler.en.DRAG,
          /*body1=*/body, /*attach1_body=*/dragBody,
          /*body2=*/this.mousePoint_, /*attach2_body=*/Vector.ORIGIN,
          /*restLength=*/0, /*stiffness=*/this.dragStiffness_);
      this.mouseDrag(simObject, location, offset);
      this.sim_.addForceLaw(this.dragSpring_);
      this.sim_.getSimList().add(this.dragSpring_);
    }
  }
  return this.dragObj_ > -1;
};

/** @inheritDoc */
mouseDrag(_simObject: null|SimObject, location: Vector, offset: Vector): void {
  if (!this.clock_.isRunning() && this.dragObj_ > -1) {
    const body = this.sim_.getBody(this.dragObj_);
    if (this.optionKey_) {
      // rotate the body around body's CM
      const angle = Math.atan2(location.getY() - body.getPosition().getY(),
          location.getX() - body.getPosition().getX());
      body.setAngle(this.startBodyAngle_ + angle - this.startDragAngle_);
    } else {
      // when paused, move the body with the mouse.
      body.setPosition(location.subtract(offset));
    }
  } else {
    this.mousePoint_.setPosition(location);
  }
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void {
  /*if (1 == 0) {
    // demonstration of giving a onMouseUp action to a RigidBody.
    // Clicking on the body named 'click' causes a ball to be created.
    if (simObject != null && simObject.nameEquals(RigidBodyEventHandler.en.CLICK)) {
      const b = Shapes.makeBlock(0.2, 0.2, RigidBodyEventHandler.en.CLICK,
          RigidBodyEventHandler.i18n.CLICK);
      b.setPosition(new Vector(-2,  2));
      b.setVelocity(new Vector(10.0,  1.0),  0.0);
      this.sim_.addBody(b);
    }
  }*/
  this.resetDrag();
};

/** Delete the spring and forget the object being dragged.
*/
private resetDrag(): void {
  const spring = this.dragSpring_;
  if (spring != null) {
    this.sim_.removeForceLaw(spring);
    this.sim_.getSimList().remove(spring);
    this.dragSpring_ = null;
  }
  this.dragObj_ = -1;
};

/** @inheritDoc */
handleKeyEvent(evt: KeyboardEvent, pressed: boolean, modifiers: ModifierKeys): void {
  const thrustRight = this.thrustRight_;
  const thrustLeft = this.thrustLeft_;
  if (modifiers.alt || modifiers.meta || modifiers.control) {
    return;
  }
  switch (evt.key) {
    case "ArrowLeft":
    case "J":
    case "j":
      if (thrustRight != null) {
        if (pressed)
          this.shiftLeft_ = modifiers.shift || false;
        thrustRight.setActive(1, pressed);
        thrustRight.setActive(this.shiftLeft_ ? 4 : 5, pressed);
        // ensure the other thruster of the pair is off
        thrustRight.setActive(this.shiftLeft_ ? 5 : 4, false);
        // don't let the keyEvent bubble up to browser window (arrow causes scrolling)
        evt.preventDefault();
      }
      break;
    case "ArrowRight":
    case "L":
    case "l":
      if (thrustRight != null) {
        if (pressed)
          this.shiftRight_ = modifiers.shift || false;
        thrustRight.setActive(0, pressed);
        thrustRight.setActive(this.shiftRight_ ? 5 : 4, pressed);
        // ensure the other thruster of the pair is off
        thrustRight.setActive(this.shiftRight_ ? 4 : 5, false);
        // don't let the keyEvent bubble up to browser window (arrow causes scrolling)
        evt.preventDefault();
      }
      break;
    case "ArrowUp":
    case "I":
    case "i":
      if (thrustRight != null) {
        thrustRight.setActive(3, pressed);
        // don't let the keyEvent bubble up to browser window (arrow causes scrolling)
        evt.preventDefault();
      }
      break;
    case"ArrowDown":
    case "K":
    case "k":
      if (thrustRight != null) {
        thrustRight.setActive(2, pressed);
        // don't let the keyEvent bubble up to browser window (arrow causes scrolling)
        evt.preventDefault();
      }
      break;
    case "S":
    case "s":
      if (thrustLeft != null) {
        if (pressed)
          this.shiftS_ = modifiers.shift || false;
        thrustLeft.setActive(1, pressed);
        thrustLeft.setActive(this.shiftS_ ? 4 : 5, pressed);
        // ensure the other thruster of the pair is off
        thrustLeft.setActive(this.shiftS_ ? 5 : 4, false);
        evt.preventDefault();
      }
      break;
    case "F":
    case "f":
      if (thrustLeft != null) {
        if (pressed)
          this.shiftF_ = modifiers.shift || false;
        thrustLeft.setActive(0, pressed);
        thrustLeft.setActive(this.shiftF_ ? 5 : 4, pressed);
        // ensure the other thruster of the pair is off
        thrustLeft.setActive(this.shiftF_ ? 4 : 5, false);
        evt.preventDefault();
      }
      break;
    case "E":
    case "e":
      if (thrustLeft != null) {
        thrustLeft.setActive(3, pressed);
        evt.preventDefault();
      }
      break;
    case "D":
    case "d":
    case "C":
    case "c":
      if (thrustLeft != null) {
        thrustLeft.setActive(2, pressed);
        evt.preventDefault();
      }
      break;
    default:
      break;
  }
};

/** Returns stiffness of the drag spring.
@return stiffness of the drag spring
*/
getDragStiffness(): number {
  return this.dragStiffness_;
};

/** Sets stiffness of the drag spring.
@param stiffness of the drag spring
*/
setDragStiffness(stiffness: number): void {
  this.dragStiffness_ = stiffness;
};

static readonly en: i18n_strings = {
  CLICK: 'click',
  DRAG: 'drag'
};

static readonly de_strings: i18n_strings = {
  CLICK: 'klicken',
  DRAG: 'ziehen'
};

static readonly i18n = Util.LOCALE === 'de' ? RigidBodyEventHandler.de_strings :
    RigidBodyEventHandler.en;

} // end RigidBodyEventHandler class

type i18n_strings = {
  CLICK: string,
  DRAG: string
};

Util.defineGlobal('lab$app$RigidBodyEventHandler', RigidBodyEventHandler);
