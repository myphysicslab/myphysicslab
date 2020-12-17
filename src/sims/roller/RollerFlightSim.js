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

goog.module('myphysicslab.sims.roller.RollerFlightSim');

const AbstractODESim = goog.require('myphysicslab.lab.model.AbstractODESim');
const Collision = goog.require('myphysicslab.lab.model.Collision');
const CollisionSim = goog.require('myphysicslab.lab.model.CollisionSim');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const NumericalPath = goog.require('myphysicslab.lab.model.NumericalPath');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PathPoint = goog.require('myphysicslab.lab.model.PathPoint');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const RollerCollision = goog.require('myphysicslab.sims.roller.RollerCollision');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

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

    kappa = |d phi / d s|
    phi = slope angle of curve = taninverse(dy/dx)
    s = arc length.

Another way to get it is:

    kappa = |d^2 y / d x^2|
            ---------------
           (1 + (dy/dx)^2)^(3/2)

On Track vs. Off Track
-----------------------------
There is a different set of variables and equations depending on whether the ball is on
or off the track. We keep a 'track/free mode' flag in the VarsList:

    vars[6] = track or free mode (1 or 0 respectively)

That Variable broadcasts itself whenever it changes.

On the track, the equations are similar to those of
{@link myphysicslab.sims.roller.RollerDoubleSim}; we have 2 variables:

    vars[0] = p = distance along track
    vars[1] = v = velocity on track

When the ball leaves the track, the equations are similar to those of
{@link myphysicslab.sims.springs.Spring2DSim}; we have 4 variables:

    vars[2] = Ux = x position
    vars[3] = Uy = y position
    vars[4] = Vx = x velocity
    vars[5] = Vy = y velocity

Storing track or free mode in `vars[6]` is useful for backing up
in time; it allows the `vars` to hold the complete state.

Equations of Motion
---------------------------
See RollerDoubleSim and Spring2DSim for derivations.

On the track:

    let k = slope of curve. Then sin(theta) = k/sqrt(1+k^2)
    let b = damping constant
    let g = gravity
    v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v

Off the track:

    let U = position of mass, V = velocity vector
    vars[2] = Ux
    vars[3] = Uy
    vars[4] = Vx
    vars[5] = Vy
    vars[6] = sim_mode (0=TRACK_MODE, 1=FREE_MODE)

Without a spring force, the off-the-track equations of motion are:

    Ux' = Vx
    Uy' = Vy
    Vx' = 0
    Vy' = -g

Collisions
-----------------------------
To detect collisions: see if the ball is below the track. We require that the track has
no loops, so each x has a single point of the track above or below it. To handle the
collision, we reflect the velocity in the tangent of the curve.

Math in `handleCollisions`
-----------------------------
From vector algebra:

    Let B = (1,k) be vector of line with slope k
    Let A = (vx, vy) be vector of velocity
            (A·B)
    Let C = ----- B  = component of A in B direction
            (B·B)

    Let N = A - C = component of A normal to B

    Then the reflection of A across the line B = C - N

    But we multiply the normal by the elasticity e, so
    result = C - e*N

@todo Add to docs the mathematica file 'roller.nb' where curves like Hump and others
  were worked out.

@todo To have a track with loops and vertical lines we need to have a
  way to determine what is inside or outside, or which direction the
  track inhibits movement. Need to deal with track sections that are
  vertical lines (infinite slope) & straight lines (infinite
  radius).

* @implements {EnergySystem}
* @implements {CollisionSim}
* @implements {EventHandler}
*/
class RollerFlightSim extends AbstractODESim {
/**
* @param {!NumericalPath} thePath
* @param {string=} opt_name name of this as a Subject
*/
constructor(thePath, opt_name) {
  super(opt_name);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  var var_names = [
    RollerFlightSim.en.TRACK_POSITION,
    RollerFlightSim.en.TRACK_VELOCITY,
    RollerFlightSim.en.X_POSITION,
    RollerFlightSim.en.Y_POSITION,
    RollerFlightSim.en.X_VELOCITY,
    RollerFlightSim.en.Y_VELOCITY,
    RollerFlightSim.en.TRACK_MODE,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY,
    VarsList.en.TIME,
    RollerFlightSim.en.ANCHOR_X,
    RollerFlightSim.en.ANCHOR_Y
  ];
  var i18n_names = [
    RollerFlightSim.i18n.TRACK_POSITION,
    RollerFlightSim.i18n.TRACK_VELOCITY,
    RollerFlightSim.i18n.X_POSITION,
    RollerFlightSim.i18n.Y_POSITION,
    RollerFlightSim.i18n.X_VELOCITY,
    RollerFlightSim.i18n.Y_VELOCITY,
    RollerFlightSim.i18n.TRACK_MODE,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY,
    VarsList.i18n.TIME,
    RollerFlightSim.i18n.ANCHOR_X,
    RollerFlightSim.i18n.ANCHOR_Y
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(7, 8, 9);
  // the TRACK_MODE variable should broadcast when it changes
  this.getVarsList().getVariable(6).setBroadcast(true);
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 9.8;
  /** stickiness of track, determines when ball jumps from free flight onto track
  * @type {number}
  * @private
  */
  this.stickiness_ = 0.1;
  /** bounciness of ball when colliding with track
  * @type {number}
  * @private
  */
  this.elasticity_ = 0.8;
  /**
  * @type {!PointMass}
  * @private
  */
  this.ball1_ = PointMass.makeCircle(0.3, 'ball1').setMass(0.5);
  /**
  * @type {!PointMass}
  * @private
  */
  this.anchor_ = PointMass.makeSquare(0.4, 'anchor');
  /**
  * @type {!Spring}
  * @private
  */
  this.spring_ = new Spring('spring',
      this.ball1_, Vector.ORIGIN,
      this.anchor_, Vector.ORIGIN,
      /*restLength=*/1.0, /*stiffness=*/0);
  /**
  * @type {!NumericalPath}
  * @private
  */
  this.path_ = thePath;
  var r = this.path_.getBoundsWorld();
  /** lowest possible y coordinate of path
  * @type {number}
  * @private
  */
  this.lowestPoint_ = r.getBottom();
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  // determine starting position, somewhere at top left
  var start = new Vector(r.getLeft() + r.getWidth()*0.1,
        r.getTop() - r.getHeight()*0.1);
  // find closest starting point to a certain x-y position
  var pathPoint = this.path_.findNearestGlobal(start);
  /** range of x values of the path
  * @type {number}
  * @private
  */
  this.xLow_ = this.path_.map_p_to_x(this.path_.getStartPValue());
  /** range of x values of the path
  * @type {number}
  * @private
  */
  this.xHigh_ = this.path_.map_p_to_x(this.path_.getFinishPValue());
  /** Function to paint canvases, for debugging. If defined, this will be called within
  * `moveObjects()` so you can see the simulation state after each
  * time step (you will need to arrange your debugger to pause after
  * each invocation of debugPaint_ to see the state).
  * @type {?function():undefined}
  * @private
  */
  this.debugPaint_ = null;
  /**
  * @type {?SimObject}
  * @private
  */
  this.dragObj_ = null;
  var va = this.getVarsList();
  va.setValue(0, pathPoint.p);
  va.setValue(1, 0);  // velocity
  va.setValue(RollerFlightSim.TRACK_VAR, RollerFlightSim.ON_TRACK);
  va.setValue(11, r.getLeft() + r.getWidth()*0.2); // anchorX
  va.setValue(12, r.getTop() - r.getHeight()*0.5); // anchorY
  this.modifyObjects();
  this.saveInitialState();
  this.getSimList().add(this.path_, this.ball1_, this.anchor_, this.spring_);

  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.STICKINESS,
      RollerFlightSim.i18n.STICKINESS,
      goog.bind(this.getStickiness, this), goog.bind(this.setStickiness, this))
      .setSignifDigits(3));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.ELASTICITY,
      RollerFlightSim.i18n.ELASTICITY,
      goog.bind(this.getElasticity, this), goog.bind(this.setElasticity, this))
      .setSignifDigits(3).setUpperLimit(1));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.DAMPING,
      RollerFlightSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.GRAVITY,
      RollerFlightSim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.MASS,
      RollerFlightSim.i18n.MASS,
      goog.bind(this.getMass, this), goog.bind(this.setMass, this)));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.SPRING_LENGTH,
      RollerFlightSim.i18n.SPRING_LENGTH,
      goog.bind(this.getSpringLength, this), goog.bind(this.setSpringLength, this)));
  this.addParameter(new ParameterNumber(this, RollerFlightSim.en.SPRING_STIFFNESS,
      RollerFlightSim.i18n.SPRING_STIFFNESS,
      goog.bind(this.getSpringStiffness, this),
      goog.bind(this.setSpringStiffness, this)));
  this.addParameter(new ParameterNumber(this, EnergySystem.en.PE_OFFSET,
      EnergySystem.i18n.PE_OFFSET,
      goog.bind(this.getPEOffset, this), goog.bind(this.setPEOffset, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY)
      .setSignifDigits(5));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
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

/** @override */
getClassName() {
  return 'RollerFlightSim';
};

/** @override */
modifyObjects() {
  var va = this.getVarsList();
  var vars = va.getValues();
  var currentPoint = this.moveObjects(vars);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  if (vars[RollerFlightSim.TRACK_VAR] == RollerFlightSim.ON_TRACK) {
    // update the position variables when ball is on the track
    va.setValue(2, this.ball1_.getPosition().getX(), true);
    va.setValue(3, this.ball1_.getPosition().getY(), true);
    va.setValue(4, this.ball1_.getVelocity().getX(), true);
    va.setValue(5, this.ball1_.getVelocity().getY(), true);
  }
  var ei = this.getEnergyInfo_(vars);
  va.setValue(7, ei.getTranslational(), true);
  va.setValue(8, ei.getPotential(), true);
  va.setValue(9, ei.getTotalEnergy(), true);
  if (vars[RollerFlightSim.TRACK_VAR] == RollerFlightSim.ON_TRACK) {
    // NOTE: would be more accurate to generate a collision to get very close to the
    // moment in time when ball jumps off track.
    if (currentPoint != null) {
      this.jumpOffTrack(currentPoint);
    } else {
      goog.asserts.fail('advance: currentPoint is null, TRACK_VAR='
          +vars[RollerFlightSim.TRACK_VAR]);
    }
  }
};

/** @override */
setDebugPaint(fn) {
  this.debugPaint_ = fn;
};

/**
* @return {undefined}
* @private
*/
updateVars() {
};

/**
* @param {!Array<number>} vars
* @return {?PathPoint} PathPoint corresponding to position
*   on track when in TRACK_MODE, or null if in FREE_MODE
* @private
*/
moveObjects(vars) {
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  var pathPoint = null;
  this.anchor_.setPosition(new Vector(vars[11],  vars[12]));
  if (vars[RollerFlightSim.TRACK_VAR] == RollerFlightSim.ON_TRACK) {
    pathPoint = new PathPoint(vars[0], /*calculate radius=*/true);
    this.path_.map_p_to_slope(pathPoint);
    this.ball1_.setPosition(pathPoint);
    this.ball1_.setVelocity(new Vector(pathPoint.slopeX*vars[1],
          pathPoint.slopeY*vars[1]));
  } else if (vars[RollerFlightSim.TRACK_VAR] == RollerFlightSim.OFF_TRACK) {
    this.ball1_.setPosition(new Vector(vars[2],  vars[3]));
    this.ball1_.setVelocity(new Vector(vars[4], vars[5], 0));
  } else {
    goog.asserts.fail('moveObjects: TRACK_VAR='+vars[RollerFlightSim.TRACK_VAR]);
  }
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
  return pathPoint;
}

/** Possibly switch mode from track to free-flying.
* @param {!PathPoint} pathPoint1
* @private
*/
jumpOffTrack(pathPoint1) {
  var va = this.getVarsList();
  goog.asserts.assert (va.getValue(RollerFlightSim.TRACK_VAR) ==
      RollerFlightSim.ON_TRACK);
  // Compare the circular acceleration a = v^2/r to the actual
  // acceleration from gravity and spring that is normal to track.
  // If not enough to hold ball on track, then switch to free flight.
  var r = pathPoint1.radius;
  //NOTE: should check for infinite radius, but for now assume not possible
  // the accel from gravity, normal to track, is g sin(theta)
  // where theta = angle between tangent vector & gravity vector
  // (see Mathematica file for derivation)
  var direction = pathPoint1.direction;
  var k = pathPoint1.slope;
  var slopeDenom = Math.sqrt(1+k*k);
  //NOTE: should check for infinite slope, but for now assume not possible
  var g = this.gravity_ / slopeDenom;
  // for positive curvature, gravity decreases radial accel
  if (r>0) {
    g = -g;
  }
  var ar = g;  // ar = radial acceleration

  if (this.spring_.getStiffness() > 0) {
    // Need to figure out sign based on whether spring endpoint
    // is above or below the tangent line.
    // Tangent line is defined by: y = k*x + b.
    var x = pathPoint1.getX();
    var y = pathPoint1.getY();
    var b = y - k*x;
    var p2 = this.spring_.getEndPoint();
    var below = (p2.getY() < k * p2.getX() + b) ? 1 : -1;
    // Add in the normal component of spring force
    // it is similar to tangent calculation in diff eq, except its sin(theta).
    // Let sx, sy be the x & y components of the spring length.
    var sv = this.spring_.getVector();
    var costh = direction*(sv.getX() + k*sv.getY())/this.spring_.getLength();
    costh = costh / slopeDenom;
    // calculate sin(theta) from cos(theta)
    var sinth = Math.sqrt(1 - costh*costh);
    if (isNaN(sinth) || sinth > 1 || sinth < 0) {
      throw 'sin(theta) out of range '+sinth;
    }
    // Component due to spring is
    var as = (sinth*this.spring_.getStretch() * this.spring_.getStiffness()) /
        this.ball1_.getMass();
    // assume spring is stretched
    // if negative curve, being below tangent increases ar
    if (r<0) {
      ar = ar + below*as;
    } else {
      // if positive curve, being below tangent decreases ar
      ar = ar - below*as;
    }
  }
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  var v = va.getValue(1);  // velocity
  var av = v*v/r;
  if (av<0) {
    av = -av;  // use absolute value
  }
  // to switch to free flight:
  // for negative curvature, must have ar < av
  // for positive curvature, must have ar > av
  if (r<0 && ar < av || r>0 && ar > av) {    // switch to free flight
    va.setValue(RollerFlightSim.TRACK_VAR, RollerFlightSim.OFF_TRACK);
    va.setValue(2, pathPoint1.getX(), /*continuous=*/true);
    va.setValue(3, pathPoint1.getY(), /*continuous=*/true);
    var point2 = new PathPoint();
    point2.x = pathPoint1.getX();
    this.path_.map_x_to_y_p(point2);
    // ball must not be below the track
    if (va.getValue(3) < point2.getY()) {
      //console.log('ball is below track by '+(point2.getY() - vars[1]));
      va.setValue(3, point2.getY());
    }
    // the magnitude of current velocity is v, direction
    //  is given by the slope
    // if you make a right triangle with horiz = 1, vert = k,
    //  then diagonal is sqrt(1+k^2).  Then divide each side
    //  by sqrt(1+k^2) and you get horiz = 1/sqrt(1+k^2) and
    //  vert = k/sqrt(1+k^2)
    va.setValue(4, v/slopeDenom, true);  // x-component of velocity
    va.setValue(5, v*k/slopeDenom, true);  // y-component of velocity
  }
};

/** @override */
getEnergyInfo() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
getEnergyInfo_(vars) {
  var ke = this.ball1_.getKineticEnergy();
  // gravity potential = m g y
  var pe = this.ball1_.getMass() * this.gravity_ *
      (this.ball1_.getPosition().getY() - this.lowestPoint_);
  pe += this.spring_.getPotentialEnergy();
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
getPEOffset() {
  return this.potentialOffset_;
}

/** @override */
setPEOffset(value) {
  this.potentialOffset_ = value;
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(8, 9);
  this.broadcastParameter(EnergySystem.en.PE_OFFSET);
};

/** @override */
startDrag(simObject, location, offset, dragBody, mouseEvent) {
  if (simObject == this.ball1_) {
    this.dragObj_ = simObject;
    return true;
  } else if (simObject == this.anchor_) {
    return true;
  }
  return false;
};

/**
* @param {number} x
* @return {boolean}
* @private
*/
off_track(x) {
  if (this.path_.isClosedLoop())
    return false;
  else {
    return ((x < this.xLow_) || (x > this.xHigh_));
  }
}

/**
* @param {number} x
* @return {number}
* @private
*/
off_track_adjust(x) {
  if (x < this.xLow_)
    x = this.xLow_ + 0.1;
  if (x > this.xHigh_)
    x = this.xHigh_ - 0.1;
  return x;
}

/** @override */
mouseDrag(simObject, location, offset,
    mouseEvent) {
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  var va = this.getVarsList();
  var p = location.subtract(offset);
  if (simObject == this.ball1_)  {
    // are we within the x-range of the track?
    if (this.off_track(p.getX())) {  // out of x-range of track
      // find nearest point on track
      var point1 = this.path_.findNearestGlobal(p);
      va.setValue(0, point1.p);
      va.setValue(1, 0);
      va.setValue(RollerFlightSim.TRACK_VAR, RollerFlightSim.ON_TRACK);
      va.incrSequence(2, 3, 4, 5, 7, 8, 9);
    } else {  // we are within x-range
      // if below the track, then find closest point on the track
      if (p.getY() < this.path_.map_x_to_y(p.getX())) {
        var point2 = this.path_.findNearestGlobal(p);
        va.setValue(0, point2.p);
        va.setValue(1, 0);
        va.setValue(RollerFlightSim.TRACK_VAR, RollerFlightSim.ON_TRACK);
        va.incrSequence(2, 3, 4, 5, 7, 8, 9);
      } else {
        // above track in FREE_MODE
        va.setValue(2, p.getX());
        va.setValue(3, p.getY());
        va.setValue(4, 0);
        va.setValue(5, 0);
        va.setValue(RollerFlightSim.TRACK_VAR, RollerFlightSim.OFF_TRACK);
        va.incrSequence(0, 1, 7, 8, 9);
      }
    }
  } else if (simObject == this.anchor_) {
    va.setValue(11, p.getX());
    va.setValue(12, p.getY());
  }
  this.moveObjects(va.getValues());
};

/** @override */
finishDrag(simObject, location, offset) {
  this.dragObj_ = null;
};

/** @override */
handleKeyEvent(keyCode, pressed, keyEvent) {
};

/** @override */
evaluate(vars, change, timeStep) {
  Util.zeroArray(change);
  change[10] = 1; // time
  if (this.dragObj_ != null) {
    // when dragging, don't make any changes
    return null;
  }
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  var sv, cosTheta;
  if (vars[RollerFlightSim.TRACK_VAR] == RollerFlightSim.ON_TRACK) {
    // calculate the slope at the given arc-length position on the curve
    // vars[0] is p = path length position.
    // do moveObjects() so that we can reference spring position directly
    var pathPoint = this.moveObjects(vars);
    if (pathPoint == null) {
      throw '';
    }
    change[0] = vars[1];  // p' = v
    // see Mathematica file 'roller.nb' for derivation of the following
    // let k = slope of curve. Then sin(theta) = k/sqrt(1+k^2)
    // Component due to gravity is v' = - g sin(theta) = - g k/sqrt(1+k^2)
    var k = pathPoint.slope;
    var sinTheta = isFinite(k) ? k/Math.sqrt(1+k*k) : 1;
    // v' = - g sin(theta) - (b/m) v= - g k/sqrt(1+k^2) - (b/m) v
    change[1] = -this.gravity_ * pathPoint.direction * sinTheta
        - this.damping_ * vars[1] / this.ball1_.getMass();
    if (this.spring_.getStiffness() > 0) {
      sv = this.spring_.getVector();
      if (!isFinite(k)) {
        cosTheta = pathPoint.direction*sv.getY()/this.spring_.getLength();
      } else {
        cosTheta = pathPoint.direction*(sv.getX() + k*sv.getY()) /
             (this.spring_.getLength() * Math.sqrt(1+k*k));
      }
      if (isNaN(cosTheta) || cosTheta > 1 || cosTheta < -1) {
        throw 'cosTheta out of range '+cosTheta;
      }
      change[1] += this.spring_.getStiffness()*cosTheta*this.spring_.getStretch() /
           this.ball1_.getMass();
    }
  } else if (vars[RollerFlightSim.TRACK_VAR] == RollerFlightSim.OFF_TRACK) {
    //    0         1    2  3  4   5        6       7   8   9   10
    // track_p, track_v, x, y, x', y', track_mode, ke, pe, te, time
    // free flight mode; forces are from spring & gravity
    // do moveObjects() so that we can refer to spring directly
    this.moveObjects(vars);
    change[2] = vars[4];  // Ux' = Vx
    change[3] = vars[5];  // Uy' = Vy
    var m = this.ball1_.getMass();
    if (this.spring_.getStiffness() > 0) {
      //xx = Ux - Sx
      //yy = Uy - Sy
      //len = Sqrt(xx^2+yy^2)
      sv = this.spring_.getVector().multiply(-1);
      var xx = sv.getX();
      var yy = sv.getY();
      var len = this.spring_.getLength();
      //L = len - R
      //sin(th) = xx / len
      //Vx' = -(k/m)L sin(th)
      change[4] = -(this.spring_.getStiffness()/m)*this.spring_.getStretch() * xx / len;
      //L = len - R
      //cos(th) = yy / len
      //Vy' = -g - (k/m)L cos(th)
      change[5] = -(this.spring_.getStiffness()/m)*this.spring_.getStretch() * yy / len;
    }
    change[5] += -this.gravity_;
    // damping:  - (b/m) Vx
    change[4] -= (this.damping_/m)*vars[4];
    // damping:  - (b/m) Vy
    change[5] -= (this.damping_/m)*vars[5];
  } else {
    goog.asserts.fail();
  }
  return null;
};

/** @override */
findCollisions(collisions, vars, stepSize) {
  this.moveObjects(vars);
  if (vars[RollerFlightSim.TRACK_VAR] == RollerFlightSim.OFF_TRACK) {
    var c = new RollerCollision(this.ball1_, this.path_, this.getTime());
    if (c.isColliding()) {
      collisions.push(c);
    }
  }
};

/** @override */
handleCollisions(collisions, opt_totals) {
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  var va = this.getVarsList();
  var vars = va.getValues();
  // only deal with the case where we are currently off the track
  if (collisions.length == 0 ||
      vars[RollerFlightSim.TRACK_VAR] == RollerFlightSim.ON_TRACK) {
    return true;
  }
  // Find slope at closest point on track.
  // Use the point of the collision as a starting guess.
  var c = /** @type {!RollerCollision}*/(collisions[0]);
  var m_Point = new PathPoint(c.getPathPoint().p);
  m_Point.idx = this.path_.map_p_to_index(m_Point.p);
  this.path_.findNearestLocal(new Vector(vars[2], vars[3]), m_Point);
  this.path_.map_p_to_slope(m_Point);
  var k = m_Point.slope;
  // End Of Track Cludge:
  //   Beyond ends of track we just want something that doesn't crash!
  //   Otherwise have to have a whole separate model for the track
  //   extension, including calculating distance along the track;
  if (this.off_track(vars[2])) {
    va.setValue(2, this.off_track_adjust(vars[2]));  // put ball back in-bounds
    va.setValue(4, 0);  // set velocity to zero
    va.setValue(5, 0);
  } else {
    // modify the velocities according to track geometry
    var cx, cy, d;
    var vx = vars[4];
    var vy = vars[5];

    // Find C = velocity component in track direction
    d = (vx + k*vy)/(1 + k*k);
    cx = d;
    cy = d*k;
    // Find N = A - C = velocity normal to track
    var nx, ny;  // normal velocity
    nx = vx - cx;
    ny = vy - cy;
    var rx, ry;  // result velocity
    // Result = C - e*N
    rx = cx - this.elasticity_*nx;
    ry = cy - this.elasticity_*ny;
    va.setValue(4, rx);
    va.setValue(5, ry);

    var nv = Math.sqrt(nx*nx + ny*ny);
    c.impulse = nv * (1 + this.elasticity_) * this.ball1_.getMass();
    nv = this.elasticity_ * nv;
    c.velocity = nv;
    var rv = Math.sqrt(rx*rx + ry*ry);
    // BUG note: if bouncing straight up and down on a flat surface, then nv = rv
    // and nv/rv = 1 no matter how small nv becomes;
    // so maybe add an absolute value test too?
    // Switch to Track mode when velocity is small.
    if (nv/rv < this.stickiness_) {
      // normal velocity is small compared to total velocity
      va.setValue(0, m_Point.p);
      va.setValue(1, Math.sqrt(cx*cx + cy*cy) * (cx > 0 ? 1 : -1));
      va.setValue(RollerFlightSim.TRACK_VAR, RollerFlightSim.ON_TRACK);
    }
  }
  if (opt_totals) {
    opt_totals.addImpulses(1);
  }
  // derived energy variables are discontinuous
  va.incrSequence(7, 8, 9);
  return true;
};

/**
@return {number}
*/
getGravity() {
  return this.gravity_;
};

/**
@param {number} value
*/
setGravity(value) {
  this.gravity_ = value;
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(8, 9);
  this.broadcastParameter(RollerFlightSim.en.GRAVITY);
};

/**
@return {number}
*/
getDamping() {
  return this.damping_;
};

/**
@param {number} value
*/
setDamping(value) {
  this.damping_ = value;
  this.broadcastParameter(RollerFlightSim.en.DAMPING);
};

/**
@return {number}
*/
getMass() {
  return this.ball1_.getMass();
};

/**
@param {number} value
*/
setMass(value) {
  this.ball1_.setMass(value);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(7, 8, 9);
  this.broadcastParameter(RollerFlightSim.en.MASS);
};

/**
@return {number}
*/
getSpringStiffness() {
  return this.spring_.getStiffness();
};

/**
@param {number} value
*/
setSpringStiffness(value) {
  this.spring_.setStiffness(value);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(8, 9);
  this.broadcastParameter(RollerFlightSim.en.SPRING_STIFFNESS);
};

/**
@return {number}
*/
getSpringLength() {
  return this.spring_.getRestLength();
};

/**
@param {number} value
*/
setSpringLength(value) {
  this.spring_.setRestLength(value);
  //    0         1    2  3  4   5        6       7   8   9   10    11       12
  // track_p  track_v  x  y  x'  y'  track_mode  ke  pe  te  time anchorX  anchorY
  // discontinuous change in energy
  this.getVarsList().incrSequence(8, 9);
  this.broadcastParameter(RollerFlightSim.en.SPRING_LENGTH);
};

/**
@return {number}
*/
getElasticity() {
  return this.elasticity_;
};

/**
@param {number} value
*/
setElasticity(value) {
  this.elasticity_ = value;
  this.broadcastParameter(RollerFlightSim.en.ELASTICITY);
};

/**
@return {number}
*/
getStickiness() {
  return this.stickiness_;
};

/**
@param {number} value
*/
setStickiness(value) {
  var v = value;
  // stickiness = 0 leads to insanity, so prevent it here
  if (v < 0.001)
    v = 0.001;
  if (v > 1)
    v = 1;
  this.stickiness_ = v;
  this.broadcastParameter(RollerFlightSim.en.STICKINESS);
};

} // end class

/** Value of TRACK_VAR that indicates the ball is on the track
* @type {number}
* @const
* @private
*/
RollerFlightSim.ON_TRACK = 1;

/** Value of TRACK_VAR that indicates the ball is in free flight
* @type {number}
* @const
* @private
*/
RollerFlightSim.OFF_TRACK = 0;

/** index of the track mode in vars array
* @type {number}
* @const
* @private
*/
RollerFlightSim.TRACK_VAR = 6;

/** Set of internationalized strings.
@typedef {{
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
  }}
*/
RollerFlightSim.i18n_strings;

/**
@type {RollerFlightSim.i18n_strings}
*/
RollerFlightSim.en = {
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

/**
@private
@type {RollerFlightSim.i18n_strings}
*/
RollerFlightSim.de_strings = {
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

/** Set of internationalized strings.
@type {RollerFlightSim.i18n_strings}
*/
RollerFlightSim.i18n = goog.LOCALE === 'de' ? RollerFlightSim.de_strings :
    RollerFlightSim.en;

exports = RollerFlightSim;
