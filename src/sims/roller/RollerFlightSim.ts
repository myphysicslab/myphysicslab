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

import { AbstractODESim, ODESim } from '../../lab/model/ODESim.js';
import { Collision, CollisionTotals } from '../../lab/model/Collision.js';
import { CollisionSim } from '../../lab/model/CollisionSim.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js'
import { GenericEvent } from '../../lab/util/Observe.js';
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PathPoint } from '../../lab/model/PathPoint.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { RollerCollision } from './RollerCollision.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Spring } from '../../lab/model/Spring.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const TRACK_P = 0;
const TRACK_V = 1;
const X = 2;
const Y = 3;
const XP = 4;
const YP = 5;
const TRACK_MODE = 6;
const KE = 7;
const PE = 8;
const TE = 9;
const TIME = 10;
const ANCHOR_X = 11;
const ANCHOR_Y = 12;

/** Value of TRACK_MODE that indicates the ball is on the track */
const ON_TRACK = 1;

/** Value of TRACK_MODE that indicates the ball is in free flight */
const OFF_TRACK = 0;


/** Simulation of a ball moving on a track, where the ball can fly off the
track.

See <http://www.myphysicslab.com/RollerFlight.html> for additional explanations
of the math involved here.

Radial Acceleration
----------------------------
This version of the roller coaster simulation has the ball jump off the track when
appropriate.

The acceleration for uniform circular motion is `a = v^2/r`.

Suppose the ball is going over a hill. The minimum radial acceleration to keep the ball
on the track is `v^2/r`, where `r =` radius of curvature of the track (at the point
where the ball currently is).

The actual acceleration normal to the track is given by the component of gravity (and
other forces, eg. spring) that are normal to the track. If the actual acceleration is
less than the minimum acceleration then the ball leaves the track.

Radius of Curvature
------------------------------
The radius of curvature of the track is given by reciprocal of `kappa`
```text
kappa = |d phi / d s|
phi = slope angle of curve = taninverse(dy/dx)
s = arc length.
```
Another way to get it is:
```text
           |d^2 y / d x^2|
kappa =  --------------------
         (1 + (dy/dx)^2)^(3/2)
```

On Track vs. Off Track
-----------------------------
There is a different set of variables and equations depending on whether the ball is on
or off the track. We keep a 'track/free mode' flag in the VarsList:
```text
vars[6] = track or free mode (1 or 0 respectively)
```
That Variable broadcasts itself whenever it changes.

On the track, the equations are similar to those of
{@link sims/roller/RollerDoubleSim.RollerDoubleSim}; we have 2 variables:
```text
vars[0] = p = distance along track
vars[1] = v = velocity on track
```
When the ball leaves the track, the equations are similar to those of
{@link sims/springs/Spring2DSim.Spring2DSim}; we have 4 variables:
```text
vars[2] = Ux = x position
vars[3] = Uy = y position
vars[4] = Vx = x velocity
vars[5] = Vy = y velocity
```
Storing track or free mode in `vars[6]` is useful for backing up
in time; it allows the `vars` to hold the complete state.

Equations of Motion
---------------------------
See RollerDoubleSim and Spring2DSim for derivations.

On the track:
```text
let k = slope of curve. Then sin(theta) = k/sqrt(1+k^2)
let b = damping constant
let g = gravity
v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v
```
Off the track:
```text
let U = position of mass, V = velocity vector
vars[2] = Ux
vars[3] = Uy
vars[4] = Vx
vars[5] = Vy
vars[6] = sim_mode (0=TRACK_MODE, 1=FREE_MODE)
```
Without a spring force, the off-the-track equations of motion are:
```text
Ux' = Vx
Uy' = Vy
Vx' = 0
Vy' = -g
```

Collisions
-----------------------------
To detect collisions: see if the ball is below the track. We require that the track has
no loops, so each x has a single point of the track above or below it. To handle the
collision, we reflect the velocity in the tangent of the curve.

Math in `handleCollisions`
-----------------------------
From vector algebra:
```text
Let B = (1,k) be vector of line with slope k
Let A = (vx, vy) be vector of velocity
        (A·B)
Let C = ----- B  = component of A in B direction
        (B·B)

Let N = A - C = component of A normal to B

Then the reflection of A across the line B = C - N

But we multiply the normal by the elasticity e, so
result = C - e*N
```

**TO DO** Add to docs the mathematica file 'roller.nb' where curves like Hump and
others were worked out.

**TO DO** To have a track with loops and vertical lines we need to have a
  way to determine what is inside or outside, or which direction the
  track inhibits movement. Need to deal with track sections that are
  vertical lines (infinite slope) & straight lines (infinite
  radius).

*/
export class RollerFlightSim extends AbstractODESim implements Simulation, ODESim, EventHandler, CollisionSim<RollerCollision>, EnergySystem {

  private damping_: number = 0;
  private gravity_: number = 9.8;
  /** stickiness of track, determines when ball jumps from free flight onto track */
  private stickiness_: number = 0.1;
  /** bounciness of ball when colliding with track */
  private elasticity_: number = 0.8;
  private ball1_: PointMass;
  private anchor_: PointMass;
  private spring_: Spring;
  private path_: NumericalPath;
  /** lowest possible y coordinate of path */
  private lowestPoint_: number;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  /** range of x values of the path */
  private xLow_: number;
  /** range of x values of the path */
  private xHigh_: number;
  /** Function to paint canvases, for debugging. If defined, this will be called within
  * `moveObjects()` so you can see the simulation state after each
  * time step (you will need to arrange your debugger to pause after
  * each invocation of debugPaint_ to see the state).
  */
  private debugPaint_: null|(()=>void) = null;
  private dragObj_: null|SimObject = null;
  /** Function to print collisions, or null to turn off printing collisions. */
  collisionFunction_: null|((c: RollerCollision, t: Terminal)=>void) = null;

/**
* @param thePath
* @param opt_name name of this as a Subject
*/
constructor(thePath: NumericalPath, opt_name?: string) {
  super(opt_name);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  const var_names = [
    RollerFlightSim.en.TRACK_POSITION,
    RollerFlightSim.en.TRACK_VELOCITY,
    RollerFlightSim.en.X_POSITION,
    RollerFlightSim.en.Y_POSITION,
    RollerFlightSim.en.X_VELOCITY,
    RollerFlightSim.en.Y_VELOCITY,
    RollerFlightSim.en.TRACK_MODE,
    EnergyInfo.en.KINETIC_ENERGY,
    EnergyInfo.en.POTENTIAL_ENERGY,
    EnergyInfo.en.TOTAL_ENERGY,
    VarsList.en.TIME,
    RollerFlightSim.en.ANCHOR_X,
    RollerFlightSim.en.ANCHOR_Y
  ];
  const i18n_names = [
    RollerFlightSim.i18n.TRACK_POSITION,
    RollerFlightSim.i18n.TRACK_VELOCITY,
    RollerFlightSim.i18n.X_POSITION,
    RollerFlightSim.i18n.Y_POSITION,
    RollerFlightSim.i18n.X_VELOCITY,
    RollerFlightSim.i18n.Y_VELOCITY,
    RollerFlightSim.i18n.TRACK_MODE,
    EnergyInfo.i18n.KINETIC_ENERGY,
    EnergyInfo.i18n.POTENTIAL_ENERGY,
    EnergyInfo.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME,
    RollerFlightSim.i18n.ANCHOR_X,
    RollerFlightSim.i18n.ANCHOR_Y
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(KE, PE, TE);
  // the TRACK_MODE variable should broadcast when it changes
  this.getVarsList().getVariable(TRACK_MODE).setBroadcast(true);
  this.ball1_ = PointMass.makeCircle(0.3, 'ball1');
  this.ball1_.setMass(0.5);
  this.anchor_ = PointMass.makeSquare(0.4, 'anchor');
  this.spring_ = new Spring('spring',
      this.ball1_, Vector.ORIGIN,
      this.anchor_, Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/0);
  this.path_ = thePath;
  const r = this.path_.getBoundsWorld();
  this.lowestPoint_ = r.getBottom();
  // determine starting position, somewhere at top left
  const start = new Vector(r.getLeft() + r.getWidth()*0.1,
        r.getTop() - r.getHeight()*0.1);
  // find closest starting point to a certain x-y position
  const pathPoint = this.path_.findNearestGlobal(start);
  this.xLow_ = this.path_.map_p_to_x(this.path_.getStartPValue());
  this.xHigh_ = this.path_.map_p_to_x(this.path_.getFinishPValue());
  const va = this.getVarsList();
  va.setValue(TRACK_P, pathPoint.p);
  va.setValue(TRACK_V, 0);  // velocity
  va.setValue(TRACK_MODE, ON_TRACK);
  va.setValue(ANCHOR_X, r.getLeft() + r.getWidth()*0.2); // anchorX
  va.setValue(ANCHOR_Y, r.getTop() - r.getHeight()*0.5); // anchorY
  this.modifyObjects();
  this.saveInitialState();
  this.getSimList().add(this.path_, this.ball1_, this.anchor_, this.spring_);

  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, RollerFlightSim.en.STICKINESS,
      RollerFlightSim.i18n.STICKINESS,
      () => this.getStickiness(), a => this.setStickiness(a)));
  pn.setSignifDigits(3);
  this.addParameter(pn = new ParameterNumber(this, RollerFlightSim.en.ELASTICITY,
      RollerFlightSim.i18n.ELASTICITY,
      () => this.getElasticity(), a => this.setElasticity(a)));
  pn.setSignifDigits(3);
  pn.setUpperLimit(1);
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.DAMPING,
      RollerFlightSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.GRAVITY,
      RollerFlightSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.MASS,
      RollerFlightSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.SPRING_LENGTH,
      RollerFlightSim.i18n.SPRING_LENGTH,
      () => this.getSpringLength(), a => this.setSpringLength(a)));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.SPRING_STIFFNESS,
      RollerFlightSim.i18n.SPRING_STIFFNESS,
      () => this.getSpringStiffness(),
      a => this.setSpringStiffness(a)));
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', ball1: '+this.ball1_
      +', anchor: '+this.anchor_
      +', spring: '+this.spring_
      +', path: '+this.path_
      +', damping: '+Util.NF(this.damping_)
      +', gravity: '+Util.NF(this.gravity_)
      +', stickiness: '+Util.NF(this.stickiness_)
      +', elasticity: '+Util.NF(this.elasticity_)
      +', lowestPoint: '+Util.NF(this.lowestPoint_)
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RollerFlightSim';
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  const currentPoint = this.moveObjects(vars);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  if (vars[TRACK_MODE] == ON_TRACK) {
    // update the position variables when ball is on the track
    va.setValue(X, this.ball1_.getPosition().getX(), true);
    va.setValue(Y, this.ball1_.getPosition().getY(), true);
    va.setValue(XP, this.ball1_.getVelocity().getX(), true);
    va.setValue(YP, this.ball1_.getVelocity().getY(), true);
  }
  const ei = this.getEnergyInfo();
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
  if (vars[TRACK_MODE] == ON_TRACK) {
    // NOTE: would be more accurate to generate a collision to get very close to the
    // moment in time when ball jumps off track.
    if (currentPoint != null) {
      this.jumpOffTrack(currentPoint);
    } else {
      throw('advance: currentPoint is null, TRACK_MODE='+vars[TRACK_MODE]);
    }
  }
};

/** @inheritDoc */
setDebugPaint(fn: null|(()=>void)): void {
  this.debugPaint_ = fn;
};

/**
* @param vars
* @return PathPoint corresponding to position
*   on track when in TRACK_MODE, or null if in FREE_MODE
*/
private moveObjects(vars: number[]): null|PathPoint {
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  let pathPoint = null;
  this.anchor_.setPosition(new Vector(vars[ANCHOR_X],  vars[ANCHOR_Y]));
  if (vars[TRACK_MODE] == ON_TRACK) {
    pathPoint = new PathPoint(vars[TRACK_P], /*calculate radius=*/true);
    this.path_.map_p_to_slope(pathPoint);
    this.ball1_.setPosition(pathPoint);
    this.ball1_.setVelocity(new Vector(pathPoint.slopeX*vars[TRACK_V],
          pathPoint.slopeY*vars[TRACK_V]));
  } else if (vars[TRACK_MODE] == OFF_TRACK) {
    this.ball1_.setPosition(new Vector(vars[X],  vars[Y]));
    this.ball1_.setVelocity(new Vector(vars[XP], vars[YP], 0));
  } else {
    throw('moveObjects: TRACK_MODE='+vars[TRACK_MODE]);
  }
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
  return pathPoint;
}

/** Possibly switch mode from track to free-flying.
* @param pathPoint1
*/
private jumpOffTrack(pathPoint1: PathPoint) {
  const va = this.getVarsList();
  Util.assert (va.getValue(TRACK_MODE) == ON_TRACK);
  // Compare the circular acceleration a = v^2/r to the actual
  // acceleration from gravity and spring that is normal to track.
  // If not enough to hold ball on track, then switch to free flight.
  const r = pathPoint1.radius;
  //NOTE: should check for infinite radius, but for now assume not possible
  // the accel from gravity, normal to track, is g sin(theta)
  // where theta = angle between tangent vector & gravity vector
  // (see Mathematica file for derivation)
  const direction = pathPoint1.direction;
  const k = pathPoint1.slope;
  const slopeDenom = Math.sqrt(1+k*k);
  //NOTE: should check for infinite slope, but for now assume not possible
  let g = this.gravity_ / slopeDenom;
  // for positive curvature, gravity decreases radial accel
  if (r > 0) {
    g = -g;
  }
  let ar = g;  // ar = radial acceleration

  if (this.spring_.getStiffness() > 0) {
    // Need to figure out sign based on whether spring endpoint
    // is above or below the tangent line.
    // Tangent line is defined by: y = k*x + b.
    const x = pathPoint1.getX();
    const y = pathPoint1.getY();
    const b = y - k*x;
    const p2 = this.spring_.getEndPoint();
    const below = (p2.getY() < k * p2.getX() + b) ? 1 : -1;
    // Add in the normal component of spring force
    // it is similar to tangent calculation in diff eq, except its sin(theta).
    // Let sx, sy be the x & y components of the spring length.
    const sv = this.spring_.getVector();
    let costh = direction*(sv.getX() + k*sv.getY())/this.spring_.getLength();
    costh = costh / slopeDenom;
    // calculate sin(theta) from cos(theta)
    const sinth = Math.sqrt(1 - costh*costh);
    if (isNaN(sinth) || sinth > 1 || sinth < 0) {
      throw 'sin(theta) out of range '+sinth;
    }
    // Component due to spring is
    const as = (sinth*this.spring_.getStretch() * this.spring_.getStiffness()) /
        this.ball1_.getMass();
    // assume spring is stretched
    // if negative curve, being below tangent increases ar
    if (r < 0) {
      ar = ar + below*as;
    } else {
      // if positive curve, being below tangent decreases ar
      ar = ar - below*as;
    }
  }
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  const v = va.getValue(1);  // velocity
  const av = Math.abs(v*v/r);
  // to switch to free flight:
  // for negative curvature, must have ar < av
  // for positive curvature, must have ar > av
  if (r < 0 && ar < av || r > 0 && ar > av) {    // switch to free flight
    va.setValue(TRACK_MODE, OFF_TRACK);
    va.setValue(X, pathPoint1.getX(), /*continuous=*/true);
    va.setValue(Y, pathPoint1.getY(), /*continuous=*/true);
    const point2 = new PathPoint();
    point2.x = pathPoint1.getX();
    this.path_.map_x_to_y_p(point2);
    // ball must not be below the track
    if (va.getValue(3) < point2.getY()) {
      //console.log('ball is below track by '+(point2.getY() - vars[TRACK_V]));
      va.setValue(Y, point2.getY());
    }
    // the magnitude of current velocity is v, direction
    //  is given by the slope
    // if you make a right triangle with horiz = 1, vert = k,
    //  then diagonal is sqrt(1+k^2).  Then divide each side
    //  by sqrt(1+k^2) and you get horiz = 1/sqrt(1+k^2) and
    //  vert = k/sqrt(1+k^2)
    va.setValue(XP, v/slopeDenom, true);  // x-component of velocity
    va.setValue(YP, v*k/slopeDenom, true);  // y-component of velocity
  }
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  const ke = this.ball1_.getKineticEnergy();
  // gravity potential = m g y
  let pe = this.ball1_.getMass() * this.gravity_ *
      (this.ball1_.getPosition().getY() - this.lowestPoint_);
  pe += this.spring_.getPotentialEnergy();
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject == this.ball1_) {
    this.dragObj_ = simObject;
    return true;
  } else if (simObject == this.anchor_) {
    return true;
  }
  return false;
};

/**
* @param x
*/
private off_track(x: number): boolean {
  if (this.path_.isClosedLoop())
    return false;
  else {
    return (x < this.xLow_ || x > this.xHigh_);
  }
}

/**
* @param x
*/
private off_track_adjust(x: number): number {
  if (x < this.xLow_)
    x = this.xLow_ + 0.1;
  if (x > this.xHigh_)
    x = this.xHigh_ - 0.1;
  return x;
}

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  const va = this.getVarsList();
  const p = location.subtract(offset);
  if (simObject == this.ball1_)  {
    // are we within the x-range of the track?
    if (this.off_track(p.getX())) {  // out of x-range of track
      // find nearest point on track
      const point1 = this.path_.findNearestGlobal(p);
      va.setValue(TRACK_P, point1.p);
      va.setValue(TRACK_V, 0);
      va.setValue(TRACK_MODE, ON_TRACK);
      va.incrSequence(X, Y, XP, YP, KE, PE, TE);
    } else {  // we are within x-range
      // if below the track, then find closest point on the track
      if (p.getY() < this.path_.map_x_to_y(p.getX())) {
        const point2 = this.path_.findNearestGlobal(p);
        va.setValue(TRACK_P, point2.p);
        va.setValue(TRACK_V, 0);
        va.setValue(TRACK_MODE, ON_TRACK);
        va.incrSequence(X, Y, XP, YP, KE, PE, TE);
      } else {
        // above track in FREE_MODE
        va.setValue(X, p.getX());
        va.setValue(Y, p.getY());
        va.setValue(XP, 0);
        va.setValue(YP, 0);
        va.setValue(TRACK_MODE, OFF_TRACK);
        va.incrSequence(TRACK_P, TRACK_V, KE, PE, TE);
      }
    }
  } else if (simObject == this.anchor_) {
    va.setValue(ANCHOR_X, p.getX());
    va.setValue(ANCHOR_Y, p.getY());
  }
  this.moveObjects(va.getValues());
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.dragObj_ = null;
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  Util.zeroArray(change);
  change[TIME] = 1; // time
  if (this.dragObj_ != null) {
    // when dragging, don't make any changes
    return null;
  }
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  const stiffness = this.spring_.getStiffness();
  const stretch = this.spring_.getStretch();
  const mass = this.ball1_.getMass();
  if (vars[TRACK_MODE] == ON_TRACK) {
    // calculate the slope at the given arc-length position on the curve
    // vars[TRACK_P] is p = path length position.
    // do moveObjects() so that we can reference spring position directly
    const pathPoint = this.moveObjects(vars);
    if (pathPoint == null) {
      throw '';
    }
    change[TRACK_P] = vars[TRACK_V];  // p' = v
    // see Mathematica file 'roller.nb' for derivation of the following
    // let k = slope of curve. Then sin(theta) = k/sqrt(1+k^2)
    // Component due to gravity is v' = - g sin(theta) = - g k/sqrt(1+k^2)
    const k = pathPoint.slope;
    const sinTheta = isFinite(k) ? k/Math.sqrt(1+k*k) : 1;
    // v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v
    change[TRACK_V] = -this.gravity_ * pathPoint.direction * sinTheta
        - this.damping_ * vars[TRACK_V] / mass;
    if (stiffness > 0) {
      const sv = this.spring_.getVector();
      let cosTheta;
      if (!isFinite(k)) {
        cosTheta = pathPoint.direction*sv.getY()/this.spring_.getLength();
      } else {
        cosTheta = pathPoint.direction*(sv.getX() + k*sv.getY()) /
             (this.spring_.getLength() * Math.sqrt(1+k*k));
      }
      if (isNaN(cosTheta) || cosTheta > 1 || cosTheta < -1) {
        throw 'cosTheta out of range '+cosTheta;
      }
      change[TRACK_V] += stiffness*cosTheta*stretch / mass;
    }
  } else if (vars[TRACK_MODE] == OFF_TRACK) {
    //    0         1    2  3  4   5        6       7   8   9   10
    // track_p, track_v, x, y, x', y', track_mode, ke, pe, te, time
    // free flight mode; forces are from spring & gravity
    // do moveObjects() so that we can refer to spring directly
    this.moveObjects(vars);
    change[X] = vars[XP];  // Ux' = Vx
    change[Y] = vars[YP];  // Uy' = Vy
    if (stiffness > 0) {
      //xx = Ux - Sx
      //yy = Uy - Sy
      //len = Sqrt(xx^2+yy^2)
      const sv = this.spring_.getVector().multiply(-1);
      const xx = sv.getX();
      const yy = sv.getY();
      const len = this.spring_.getLength();
      //L = len - R
      //sin(th) = xx / len
      //Vx' = -(k/m)L sin(th)
      change[XP] = -(stiffness/mass)*stretch * xx / len;
      //L = len - R
      //cos(th) = yy / len
      //Vy' = -g - (k/m)L cos(th)
      change[YP] = -(stiffness/mass)*stretch * yy / len;
    }
    change[YP] += -this.gravity_;
    // damping:  - (b/m) Vx
    change[XP] -= (this.damping_/mass)*vars[XP];
    // damping:  - (b/m) Vy
    change[YP] -= (this.damping_/mass)*vars[YP];
  } else {
    Util.assert(false);
  }
  return null;
};

/** @inheritDoc */
findCollisions(collisions: RollerCollision[], vars: number[], _stepSize: number): void {
  this.moveObjects(vars);
  if (vars[TRACK_MODE] == OFF_TRACK) {
    const c = new RollerCollision(this.ball1_, this.path_, this.getTime());
    if (c.isColliding()) {
      collisions.push(c);
    }
  }
};

/** @inheritDoc */
handleCollisions(collisions: RollerCollision[], opt_totals?: CollisionTotals): boolean {
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  const va = this.getVarsList();
  const vars = va.getValues();
  // only deal with the case where we are currently off the track
  if (collisions.length == 0 || vars[TRACK_MODE] == ON_TRACK) {
    return true;
  }
  // Find slope at closest point on track.
  // Use the point of the collision as a starting guess.
  const c = collisions[0];
  const m_Point = new PathPoint(c.getPathPoint().p);
  m_Point.idx = this.path_.map_p_to_index(m_Point.p);
  this.path_.findNearestLocal(new Vector(vars[X], vars[Y]), m_Point);
  this.path_.map_p_to_slope(m_Point);
  const k = m_Point.slope;
  // End Of Track Cludge:
  //   Beyond ends of track we just want something that doesn't crash!
  //   Otherwise have to have a whole separate model for the track
  //   extension, including calculating distance along the track;
  if (this.off_track(vars[X])) {
    va.setValue(X, this.off_track_adjust(vars[X]));  // put ball back in-bounds
    va.setValue(XP, 0);  // set velocity to zero
    va.setValue(YP, 0);
  } else {
    // modify the velocities according to track geometry
    const vx = vars[XP];
    const vy = vars[YP];
    // Find C = velocity component in track direction
    const d = (vx + k*vy)/(1 + k*k);
    const cx = d;
    const cy = d*k;
    // Find normal velocity N = A - C = velocity normal to track
    const nx = vx - cx;
    const ny = vy - cy;
    // result velocity = C - e*N
    const rx = cx - this.elasticity_*nx;
    const ry = cy - this.elasticity_*ny;
    va.setValue(XP, rx);
    va.setValue(YP, ry);
    let nv = Math.sqrt(nx*nx + ny*ny);
    c.impulse = nv * (1 + this.elasticity_) * this.ball1_.getMass();
    nv = this.elasticity_ * nv;
    c.velocity = nv;
    const rv = Math.sqrt(rx*rx + ry*ry);
    // BUG note: if bouncing straight up and down on a flat surface, then nv = rv
    // and nv/rv = 1 no matter how small nv becomes;
    // so maybe add an absolute value test too?
    // Switch to Track mode when velocity is small.
    if (nv/rv < this.stickiness_) {
      // normal velocity is small compared to total velocity
      va.setValue(TRACK_P, m_Point.p);
      va.setValue(TRACK_V, Math.sqrt(cx*cx + cy*cy) * (cx > 0 ? 1 : -1));
      va.setValue(TRACK_MODE, ON_TRACK);
    }
  }
  if (opt_totals) {
    opt_totals.addImpulses(1);
  }
  if (this.collisionFunction_ && this.terminal_) {
    this.collisionFunction_(c, this.terminal_);
  }
  // derived energy variables are discontinuous
  va.incrSequence(KE, PE, TE);
  return true;
};

/**
*/
getGravity(): number {
  return this.gravity_;
};

/**
@param value
*/
setGravity(value: number) {
  this.gravity_ = value;
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RollerFlightSim.en.GRAVITY);
};

/**
*/
getDamping(): number {
  return this.damping_;
};

/**
@param value
*/
setDamping(value: number) {
  this.damping_ = value;
  this.broadcastParameter(RollerFlightSim.en.DAMPING);
};

/**
*/
getMass(): number {
  return this.ball1_.getMass();
};

/**
@param value
*/
setMass(value: number) {
  this.ball1_.setMass(value);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(RollerFlightSim.en.MASS);
};

/**
*/
getSpringStiffness(): number {
  return this.spring_.getStiffness();
};

/**
@param value
*/
setSpringStiffness(value: number) {
  this.spring_.setStiffness(value);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RollerFlightSim.en.SPRING_STIFFNESS);
};

/**
*/
getSpringLength(): number {
  return this.spring_.getRestLength();
};

/**
@param value
*/
setSpringLength(value: number) {
  this.spring_.setRestLength(value);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(RollerFlightSim.en.SPRING_LENGTH);
};

/**
*/
getElasticity(): number {
  return this.elasticity_;
};

/**
@param value
*/
setElasticity(value: number) {
  this.elasticity_ = value;
  this.broadcastParameter(RollerFlightSim.en.ELASTICITY);
};

/**
*/
getStickiness(): number {
  return this.stickiness_;
};

/**
@param value
*/
setStickiness(value: number) {
  let v = value;
  // stickiness = 0 leads to insanity, so prevent it here
  if (v < 0.001) {
    v = 0.001;
  } else if (v > 1) {
    v = 1;
  }
  this.stickiness_ = v;
  this.broadcastParameter(RollerFlightSim.en.STICKINESS);
};

/**  Sets a function for  printing  collisions.  The function is called whenever a
collision occurs.  The function takes two variables: a RollerCollision and a Terminal.
This can be defined from within the Terminal by the user. Here is an example usage
```js
sim.setCollisionFunction(function(c,t) {
  const s = c.getDetectedTime().toFixed(2)+"\t"
    +c.getImpulse().toFixed(2)+"\t"
    +c.getPathPoint().getX().toFixed(2)+"\t"
    +c.getPathPoint().getY().toFixed(2);
  t.println(s);
})
```
@param f the function to print collisions, or null to turn off printing collisions
*/
setCollisionFunction(f: null|((c: RollerCollision, t: Terminal)=>void)) {
  this.collisionFunction_ = f;
};

static readonly en: i18n_strings = {
  ANCHOR_X: 'anchor X',
  ANCHOR_Y: 'anchor Y',
  DAMPING: 'damping',
  ELASTICITY: 'elasticity',
  GRAVITY: 'gravity',
  MASS: 'mass',
  POSITION: 'position',
  SPRING_DAMPING: 'spring damping',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  STICKINESS: 'stickiness',
  TRACK_MODE: 'track mode',
  TRACK_POSITION: 'track position',
  TRACK_VELOCITY: 'track velocity',
  VELOCITY: 'velocity',
  X_POSITION: 'x position',
  X_VELOCITY: 'x velocity',
  Y_POSITION: 'y position',
  Y_VELOCITY: 'y velocity'
};

static readonly de_strings: i18n_strings = {
  ANCHOR_X: 'Anker X',
  ANCHOR_Y: 'Anker Y',
  DAMPING: 'Dämpfung',
  ELASTICITY: 'Elastizität',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  POSITION: 'Position',
  SPRING_DAMPING: 'Federdämpfung',
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  STICKINESS: 'Klebrigkeit',
  TRACK_MODE: 'Spur mode',
  TRACK_POSITION: 'Spur Position',
  TRACK_VELOCITY: 'Spur Geschwindigkeit',
  VELOCITY: 'Geschwindigkeit',
  X_POSITION: 'x Position',
  X_VELOCITY: 'x Geschwindigkeit',
  Y_POSITION: 'y Position',
  Y_VELOCITY: 'y Geschwindigkeit'
};

static readonly i18n = Util.LOCALE === 'de' ? RollerFlightSim.de_strings : RollerFlightSim.en;

} // end class

type i18n_strings = {
  ANCHOR_X: string,
  ANCHOR_Y: string,
  DAMPING: string,
  ELASTICITY: string,
  GRAVITY: string,
  MASS: string,
  POSITION: string,
  SPRING_DAMPING: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  STICKINESS: string,
  TRACK_MODE: string,
  TRACK_POSITION: string,
  TRACK_VELOCITY: string,
  VELOCITY: string,
  X_POSITION: string,
  X_VELOCITY: string,
  Y_POSITION: string,
  Y_VELOCITY: string
};

Util.defineGlobal('sims$roller$RollerFlightSim', RollerFlightSim);
