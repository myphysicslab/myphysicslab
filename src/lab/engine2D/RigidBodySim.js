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

goog.provide('myphysicslab.lab.engine2D.RigidBodySim');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Float64Array');
goog.require('myphysicslab.lab.engine2D.DebugEngine2D');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Scrim');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ForceLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.model.ODESim');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.Simulation');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Printable');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var lab = myphysicslab.lab;

var AbstractSubject = lab.util.AbstractSubject;
var ConcreteLine = lab.model.ConcreteLine;
var DampingLaw = lab.model.DampingLaw;
var DebugEngine2D = lab.engine2D.DebugEngine2D;
var DoubleRect = lab.util.DoubleRect;
var EnergyInfo = lab.model.EnergyInfo;
var EnergySystem = lab.model.EnergySystem;
var Force = lab.model.Force;
var ForceLaw = lab.model.ForceLaw;
var GenericEvent = lab.util.GenericEvent;
var GravityLaw = lab.model.GravityLaw;
var NF = lab.util.Util.NF;
var NF5 = lab.util.Util.NF5;
var NF5E = lab.util.Util.NF5E;
var NF7 = lab.util.Util.NF7;
var NF7E = lab.util.Util.NF7E;
var NF9 = lab.util.Util.NF9;
var NFE = lab.util.Util.NFE;
var NFSCI = lab.util.Util.NFSCI;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var ParameterString = lab.util.ParameterString;
var PointMass = lab.model.PointMass;
var Polygon = lab.engine2D.Polygon;
var Printable = lab.util.Printable;
var RigidBody = lab.engine2D.RigidBody;
var Scrim = lab.engine2D.Scrim;
var SimList = lab.model.SimList;
var Simulation = lab.model.Simulation;
var UtilEngine = lab.engine2D.UtilEngine;
var Util = lab.util.Util;
var VarsList = lab.model.VarsList;
var Vector = lab.util.Vector;

/** Simulation of rigid body movement with external forces like gravity or springs, but
no collisions or contact forces. RigidBodys will pass thru each other unless you use the
{@link myphysicslab.lab.engine2D.ImpulseSim} sub-class.

The AdvanceStrategy tells the DiffEqSolver to advance the simulation. The DiffEqSolver
advances the simulation by calling {@link RigidBodySim#evaluate} to calculate rates of
change in each of the simulation variables. The DiffEqSolver then uses an algorithm like
Runge-Kutta to integrate forward over a small time step to reach the new simulation
state. Within `evaluate()`, the forces operate by modifying the rate of change of each
variable.

More information:

+ [2D Physics Engine Overview](Engine2D.html)

+ The math and physics underlying
    [RigidBodySim](http://www.myphysicslab.com/engine2D/rigid-body-en.html),
    [ImpulseSim](http://www.myphysicslab.com/engine2D/collision-en.html) and
    [ContactSim](http://www.myphysicslab.com/engine2D/contact-en.html) are
    described on the myPhysicsLab website.


### Parameters Created

+ ParameterBoolean named `SHOW_FORCES`, see {@link #setShowForces}

### Events Broadcast
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `ELASTICITY_SET`, see {@link #setElasticity}.


### RigidBodys

RigidBodySim maintains a list of {@link RigidBody}s which are
currently part of the simulation. RigidBodys can be added or removed while the
simulation is running. Each RigidBody is added to the SimList (or
removed when the RigidBody is removed).

### ForceLaws

RigidBodySim maintains a list of {@link ForceLaw}s which are each
given an opportunity to apply their force to RigidBodys during `evaluate()`. Some
ForceLaws such as {@link GravityLaw} and
{@link DampingLaw} are set up so that they observe the SimList and
can therefore apply their force to every RigidBody.

### Variables

Variables are stored in a {@link VarsList}. Each RigidBody gets
a set of six contiguous variables that describe its current position, angle, and
velocity. The variables are laid out as follows:

1. `x`  horizontal world coords position of center of mass
2. `x'`  horizontal velocity of center of mass.  AKA `vx`
3. `y`  vertical world coords position of center of mass
4. `y'`  vertical velocity of center of mass.  AKA `vy`
5. `w` angle of rotation from body coordinates in radians with positive rotation
being counter-clockwise. Called `w`, because `w` looks like the greek letter &omega;
(omega) which is often used for angles in math.
6. `w'`  angular velocity.  AKA `vw`.

The starting index of a RigidBody's variables is given by
{@link RigidBody#getVarsIndex}. To
find a particular variable, add the appropriate offset: `RigidBodySim.X_,
RigidBodySim.VX_, RigidBodySim.Y_, RigidBodySim.VY_, RigidBodySim.W_, RigidBodySim.VW_`.
For example, to find the angular velocity of a RigidBody:

    var idx = body.getVarsIndex();
    return vars[idx + RigidBodySim.VW_];

Variables at the beginning of the VariablesList:

+ time
+ kinetic energy
+ potential energy
+ total energy

The set of RigidBodys can change over time via {@link #addBody} and {@link #removeBody}.
Therefore the set of variables can change accordingly. Removing a RigidBody results in
its 6 variables each being marked with the reserved name `deleted` and those slots in
the VarsList are then available for later reuse. Adding a RigidBody either extends the
length of the VarsList or reuses some previously deleted slots of variables. But the 6
variables allocated for a RigidBody are guaranteed to be contiguous.

{@link myphysicslab.lab.model.ExpressionVariable ExpressionVariables} or
{@link myphysicslab.lab.model.FunctionVariable FunctionVariables} can be added to a
VarsList. Their position in the VarsList remains constant after they are allocated.


* @param {string=} opt_name name of this Subject
* @constructor
* @struct
* @extends {AbstractSubject}
* @implements {DebugEngine2D}
* @implements {EnergySystem}
* @implements {myphysicslab.lab.model.ODESim}
*/
myphysicslab.lab.engine2D.RigidBodySim = function(opt_name) {
  AbstractSubject.call(this, opt_name || 'SIM');
  /** The Polygons in this simulation.
  * @type {!Array<!Polygon>}
  * @protected
  */
  this.bods_ = [];
  /** Whether to add Forces to the SimList so they can be seen.
  * @type {boolean}
  * @protected
  */
  this.showForces_ = false;
  /** The ForceLaws in this simulation.
  * @type {!Array<!ForceLaw>}
  * @protected
  */
  this.forceLaws_ = [];
  /** Suggested size for the SimView.  This is mainly for tests to communicate
  * with TestViewerApp.
  * @type {?DoubleRect}
  * @protected
  */
  this.simRect_ = null;
  /** The SimList holds SimObjects so they can be made visible.
  * @type {!SimList}
  * @protected
  */
  this.simList_ = new SimList();
  var var_names = [
      VarsList.en.TIME,
      EnergySystem.en.KINETIC_ENERGY,
      EnergySystem.en.POTENTIAL_ENERGY,
      EnergySystem.en.TOTAL_ENERGY
  ];
  var i18n_names = [
      VarsList.i18n.TIME,
      EnergySystem.i18n.KINETIC_ENERGY,
      EnergySystem.i18n.POTENTIAL_ENERGY,
      EnergySystem.i18n.TOTAL_ENERGY
  ];
  /** The variables that determine the state of the simulation; there are six
  * variables for each RigidBody, plus some others for time, energy, etc.
  * @type {!VarsList}
  * @protected
  */
  this.varsList_ = new VarsList(var_names, i18n_names,
      this.getName()+'_VARS');
  this.getVarsList().setComputed(1, 2, 3);
  /**
  * @type {?Array<number>}
  * @private
  */
  this.initialState_ = null;
  /** While stepping forward in time, stores the previous values of the simulation
  * state variables, so that we can back up in time if a collision is encountered.
  * @type {?Array<number>}
  * @private
  */
  this.recentState_ = null;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /* How to use debugPaint_:
  * Note that RigidBodySim has a debugPaint_, it is called inside moveObjects()
  * Note that CollisionAdvance has a debugPaint_; ensure it calls sim.setDebugPaint().
  * Ensure that advance.setDebugPaint is called at startup in SimRunner:
  *    advance.setDebugPaint(goog.bind(this.paintAll, this));
  * Ensure the moving object is drawn above walls (otherwise can't see overlap).
  * Ensure test does not start running when loaded:  do clock.pause() at start.
  * Ensure you are zoomed in enough to see the overlap of the objects.
  * Run the test from source code (easier to understand code while in debugger).
  * Click 'stop script execution' button in console (else can't set a breakpoint).
  * Set a break point in SimRunner.callback, but not in the 'idle loop'.
  * Hit step or play button in web page, to start the simulation.
  * Set a break point in RigidBodySim.moveObjects on the debugPaint_ call.
  * Hit console debugger's 'continue execution' button.
  * Each time you stop at moveObjects, the debugPaint_ shows new situation.
  */
  /** Function to paint canvases, for debugging.  If defined, this will be called within
  * `moveObjects()` so you can see the simulation state after each
  * time step (you will need to arrange your debugger to pause after
  * each invocation of debugPaint_ to see the state).
  * @type {?function():undefined}
  * @protected
  */
  this.debugPaint_ = null;
  UtilEngine.debugEngine2D = this;
  this.addParameter(new ParameterBoolean(this, RigidBodySim.en.SHOW_FORCES,
      RigidBodySim.i18n.SHOW_FORCES,
      goog.bind(this.getShowForces, this), goog.bind(this.setShowForces, this)));
};
var RigidBodySim = myphysicslab.lab.engine2D.RigidBodySim;
goog.inherits(RigidBodySim, AbstractSubject);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  RigidBodySim.prototype.toString = function() {
    return this.toStringShort().slice(0, -1) + this.toString_();
  };

  /**
  * @return {string}
  * @protected
  */
  RigidBodySim.prototype.toString_ = function() {
    return ', showForces_: '+this.showForces_
        + ', potentialOffset_: '+NF(this.potentialOffset_)
        + ', varsList_: '+ this.varsList_.toStringShort()
        + ', forceLaws_: ['
        + goog.array.map(this.forceLaws_, function(f) { return f.toStringShort();})
        + '], bods_: ['
        + goog.array.map(this.bods_, function(b) { return b.toStringShort();})
        + ']'
        + RigidBodySim.superClass_.toString.call(this);
  };

  /** @inheritDoc */
  RigidBodySim.prototype.toStringShort = function() {
    return RigidBodySim.superClass_.toStringShort.call(this).slice(0, -1)
        +', bods_.length: ' + this.bods_.length + '}';
  };

};

/** @inheritDoc */
RigidBodySim.prototype.getClassName = function() {
  return 'RigidBodySim';
};

/** Offset in the VarsList for a RigidBody's x position
* @type {number}
* @const
*/
RigidBodySim.X_ = 0;
/** Offset in the VarsList for a RigidBody's x velocity
* @type {number}
* @const
*/
RigidBodySim.VX_ = 1;
/** Offset in the VarsList for a RigidBody's y position
* @type {number}
* @const
*/
RigidBodySim.Y_ = 2;
/** Offset in the VarsList for a RigidBody's y velocity
* @type {number}
* @const
*/
RigidBodySim.VY_ = 3;
/** Offset in the VarsList for a RigidBody's angle
* @type {number}
* @const
*/
RigidBodySim.W_ = 4;
/** Offset in the VarsList for a RigidBody's angular velocity
* @type {number}
* @const
*/
RigidBodySim.VW_ = 5;
/** Name of event broadcast from {@link #setElasticity}.
* @type {string}
* @const
*/
RigidBodySim.ELASTICITY_SET = 'ELASTICITY_SET';


/** @inheritDoc */
RigidBodySim.prototype.getSimList = function() {
  return this.simList_;
};

/** @inheritDoc */
RigidBodySim.prototype.getVarsList = function() {
  return this.varsList_;
};

/** @inheritDoc */
RigidBodySim.prototype.getTime = function() {
  return this.varsList_.getTime();
};

/** Whether to add Forces to the SimList so they can be seen.
* @return {boolean} whether to add Forces to the SimList so they can be seen
*/
RigidBodySim.prototype.getShowForces = function() {
  return this.showForces_;
};

/** Sets whether to add Forces to the SimList so they can be seen.
* @param {boolean} value whether to add Forces to the SimList so they can be seen
*/
RigidBodySim.prototype.setShowForces = function(value) {
  this.showForces_ = value;
  this.broadcastParameter(RigidBodySim.en.SHOW_FORCES);
};

/** Returns the suggested size for the SimView. This is mainly for tests to communicate
* with {@link myphysicslab.test.TestViewerApp}.
* @return {?DoubleRect} suggested size for the SimView
*/
RigidBodySim.prototype.getSimRect = function() {
  return this.simRect_;
};

/** Sets the suggested size for the SimView. This is mainly for tests to communicate
* with {@link myphysicslab.test.TestViewerApp}.
* @param {?DoubleRect} rect the suggested size for the SimView
*/
RigidBodySim.prototype.setSimRect = function(rect) {
  this.simRect_ = rect;
};

/** Returns string showing current variables of each RigidBody, for debugging.
@return {string} string showing current variables of each RigidBody, for debugging.
*/
RigidBodySim.prototype.formatVars = function() {
  var v = this.varsList_.getValues(/*computed=*/true);
  var s = goog.array.reduce(this.bods_,
    function(str, b) {
      return str + (str != '' ? '\n' : '') +
        UtilEngine.formatArray(v, b.getVarsIndex(), 6);
    }, '');
  return s;
};

/** @inheritDoc */
RigidBodySim.prototype.reset = function() {
  if (this.initialState_ != null &&
      this.initialState_.length == this.varsList_.numVariables()) {
    this.varsList_.setValues(this.initialState_);
  }
  goog.array.forEach(this.bods_, function(b) {
    b.eraseOldCoords();
  });
  this.getSimList().removeTemporary(Util.POSITIVE_INFINITY);
  this.modifyObjects();
  this.broadcast(new GenericEvent(this, Simulation.RESET));
};

/** @inheritDoc */
RigidBodySim.prototype.saveInitialState = function() {
  this.initialState_ = this.varsList_.getValues();
  this.broadcast(new GenericEvent(this, Simulation.INITIAL_STATE_SAVED));
};

/** Removes all RigidBodys, ForceLaws, SpecialVariables, and clears the SimList. This is
used in applications to build a new configuration of RigidBodys. This should give
essentially the same state that you would get from making a new RigidBodySim, except for
parameters that have been changed.

The alternative is to create a new RigidBodySim; that would be 'cleaner' but then you
must unhook the old RigidBodySim from all the various user controls and graph and such,
and hook up the new one.
* @return {undefined}
*/
RigidBodySim.prototype.cleanSlate = function() {
  this.getSimList().clear();
  // clear force laws AFTER simList, so that forceLaw hears the remove events
  // (in case we re-use the forceLaw later on)
  this.clearForceLaws();
  // Don't make a new VarsList, because there are various controls and graphs
  // observing the current VarsList.  Instead, resize it for zero bodies.
  // Note this will delete any SpecialVariables that have been added to the end
  // of the VarsList.
  var nv = this.varsList_.numVariables();
  if (nv > 4) {
    // delete all variables except: 0 = time, 1 = KE, 2 = PE, 3 = TE
    this.varsList_.deleteVariables(4, nv - 4);
  }
  for (var i=0, n=this.bods_.length; i<n; i++) {
    // For safety, erase any varsIndex info in the bodies that are being removed,
    // even though those bodies are about to be deleted.
    this.bods_[i].setVarsIndex(-1);
  }
  this.bods_ = [];
  this.simRect_ = null;
};

/** @inheritDoc */
RigidBodySim.prototype.saveState = function() {
  this.recentState_ = this.varsList_.getValues();
  goog.array.forEach(this.bods_, function(b) {
    b.saveOldCoords();
  });
};

/** @inheritDoc */
RigidBodySim.prototype.restoreState = function() {
  if (this.recentState_ != null) {
    this.varsList_.setValues(this.recentState_, /*continuous=*/true);
  }
  goog.array.forEach(this.bods_, function(b) {
    b.eraseOldCoords();
  });
};

/** Add the Polygon to the simulation and SimList, adds a set of variables to the
VarsList, and sets the simulation state to match the Polygon state (by copying the
Polygon's position and velocity to the simulation's VarsList).
* @param {!Polygon} body  Polygon to add to the simulation
*/
RigidBodySim.prototype.addBody = function(body) {
  if (body instanceof Scrim)
    return;
  if (!goog.array.contains(this.bods_, body)) {
    // create 6 variables in vars array for this body
    var names = [];
    for (var k = 0; k<6; k++) {
      names.push(body.getVarName(k, /*localized=*/false));
    }
    var localNames = [];
    for (var k = 0; k<6; k++) {
      localNames.push(body.getVarName(k, /*localized=*/true));
    }
    var idx = this.varsList_.addVariables(names, localNames);
    body.setVarsIndex(idx);
    // add body to end of list of bodies
    this.bods_.push(body);
    this.getSimList().add(body);
  }
  this.initializeFromBody(body);
  goog.array.forEach(this.bods_, function(b) {
    b.eraseOldCoords();
  });
};


/** Removes the Polygon from the simulation and SimList, and removes the corresponding
variables from the VarsList.
* @param {!Polygon} body Polygon to remove from the simulation
*/
RigidBodySim.prototype.removeBody = function(body) {
  if (goog.array.contains(this.bods_, body)) {
    this.varsList_.deleteVariables(body.getVarsIndex(), 6);
    goog.array.remove(this.bods_, body);
    body.setVarsIndex(-1);
  }
  this.getSimList().remove(body);
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(1, 2, 3);
};

/** Returns the list of Polygons in this simulation.
@return {!Array<!Polygon>} list of Polygons in this
    RigidBodySim.
*/
RigidBodySim.prototype.getBodies = function() {
  return goog.array.clone(this.bods_);
};

/** Returns a Polygon in this simulation by specifying its name or index in the list
* of Polygons.
* @param {number|string} numOrName index in list of Polygons or name of the Polygon
*    (either the English or language-independent version of the name)
* @return {!Polygon} the Polygon with the given name or at
*    the given position in the list of Polygons
* @throws exception if requesting a non-existing body.
*/
RigidBodySim.prototype.getBody = function(numOrName) {
  /** @type {Polygon} */
  var bod = null;
  if (goog.isString(numOrName)) {
    var bodName = Util.toName(numOrName);
    bod = goog.array.find(this.bods_,
      function(body, index, array) {
        return body.getName() == bodName;
      });
  } else {
    var bodNum = numOrName;
    if (bodNum < this.bods_.length && bodNum >= 0) {
      bod = this.bods_[bodNum];
    }
  }
  if (bod == null)
    throw new Error('no body '+numOrName);
  return bod;
};

/** Sets the simulation variables to match the Polygon state (by copying the Polygon's
* position and velocity to the simulation's VarsList).
* @param {!Polygon} body the Polygon to use for updating
*     the simulation variables
*/
RigidBodySim.prototype.initializeFromBody = function(body) {
  body.eraseOldCoords();
  var idx = body.getVarsIndex();
  if (idx < 0) {
    throw new Error("unknown body "+body);
  }
  var va = this.varsList_;
  va.setValue(RigidBodySim.X_ + idx, body.getPosition().getX());
  va.setValue(RigidBodySim.Y_ + idx, body.getPosition().getY());
  va.setValue(RigidBodySim.W_ + idx, body.getAngle());
  va.setValue(RigidBodySim.VX_ + idx, body.getVelocity().getX());
  va.setValue(RigidBodySim.VY_ + idx, body.getVelocity().getY());
  va.setValue(RigidBodySim.VW_ + idx, body.getAngularVelocity());
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(1, 2, 3);
};

/** @inheritDoc */
RigidBodySim.prototype.modifyObjects = function() {
  var va = this.varsList_;
  var vars = va.getValues();
  this.moveObjects(vars);
  // update the variables that track energy
  var einfo = this.getEnergyInfo_(vars);
  va.setValue(1, einfo.getTranslational() + einfo.getRotational(), true);
  va.setValue(2, einfo.getPotential(), true);
  va.setValue(3, einfo.getTotalEnergy(), true);
};

/** Adds the ForceLaw to the list of ForceLaws operating in this simulation, if it is
not already on the list.
@param {!ForceLaw} forceLaw the ForceLaw to add
*/
RigidBodySim.prototype.addForceLaw = function(forceLaw) {
  // It is a rather common problem to add DampingLaw or GravityLaw twice.
  // When you don't realize you did it, you then get twice the amount of damping
  // or gravity, and it can be difficult to understand why.  Therefore we
  // throw an error when we detect this case.
  var sameLaw = goog.array.find(this.forceLaws_, function(f, index, array) {
    if (forceLaw instanceof DampingLaw) {
      return f instanceof DampingLaw;
    } else if (forceLaw instanceof GravityLaw) {
      return f instanceof GravityLaw;
    } else {
      return false;
    }
  });
  if (sameLaw != null) {
    throw new Error('cannot add DampingLaw or GravityLaw twice '+sameLaw);
  }
  if (!goog.array.contains(this.forceLaws_, forceLaw)) {
    this.forceLaws_.push(forceLaw);
  }
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(1, 2, 3);
};

/** Removes the ForceLaw from the list of ForceLaws operating in this simulation.
* @param {!ForceLaw} forceLaw the ForceLaw to remove
* @return {boolean} whether the ForceLaw was removed
*/
RigidBodySim.prototype.removeForceLaw = function(forceLaw) {
  forceLaw.disconnect();
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(1, 2, 3);
  return goog.array.remove(this.forceLaws_, forceLaw);
};

/** Clears the list of ForceLaws operating in this simulation.
* @return {undefined}
*/
RigidBodySim.prototype.clearForceLaws = function() {
  goog.array.forEachRight(this.forceLaws_, this.removeForceLaw, this);
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(1, 2, 3);
};

/** Returns the list of ForceLaws operating in this simulation.
* @return {!Array<!ForceLaw>} list of ForceLaws operating in
*     this simulation
*/
RigidBodySim.prototype.getForceLaws = function() {
  return goog.array.clone(this.forceLaws_);
};

/** @inheritDoc */
RigidBodySim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
RigidBodySim.prototype.getEnergyInfo_ = function(vars) {
  // assumes bodies match current vars
  /** @type {number} */
  var pe = 0;
  /** @type {number} */
  var re = 0;
  /** @type {number} */
  var te = 0;
  goog.array.forEach(this.bods_, function(b) {
    if (isFinite(b.getMass())) {
      re += b.rotationalEnergy();
      te += b.translationalEnergy();
    }
  });
  goog.array.forEach(this.forceLaws_, function(forceLaw) {
    pe += forceLaw.getPotentialEnergy();
  });
  return new EnergyInfo(pe + this.potentialOffset_, te, re);
};

/** @inheritDoc */
RigidBodySim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** Update the RigidBodys to have the position and velocity specified by the given
* array of variables.
* @param {!Array<number>} vars array of variables to update from
* @protected
*/
RigidBodySim.prototype.moveObjects = function(vars) {
  goog.array.forEach(this.bods_, function(b) {
    var idx = b.getVarsIndex();
    if (idx < 0)
      return;
    b.setPosition(new Vector(vars[idx +RigidBodySim.X_], vars[idx +RigidBodySim.Y_]),
        vars[idx +RigidBodySim.W_]);
    b.setVelocity(new Vector(vars[idx +RigidBodySim.VX_], vars[idx +RigidBodySim.VY_]),
        vars[idx +RigidBodySim.VW_]);
  }, this);
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
};

/** @inheritDoc */
RigidBodySim.prototype.evaluate = function(vars, change, timeStep) {
  this.moveObjects(vars);  // so that rigid body objects know their current state.
  goog.array.forEach(this.bods_, function(body) {
    var idx = body.getVarsIndex();
    if (idx < 0)
      return;
    var mass = body.getMass();
    if (mass == Util.POSITIVE_INFINITY) {
      for (var k=0; k<6; k++)
        change[idx + k] = 0;  // infinite mass objects don't move
    } else {
      change[idx + RigidBodySim.X_] = vars[idx + RigidBodySim.VX_];
      change[idx + RigidBodySim.Y_] = vars[idx + RigidBodySim.VY_];
      change[idx + RigidBodySim.W_] = vars[idx + RigidBodySim.VW_];
      change[idx + RigidBodySim.VX_] = 0;
      change[idx + RigidBodySim.VY_] = 0;
      change[idx + RigidBodySim.VW_] = 0;
    }
  }, this);
  goog.array.forEach(this.forceLaws_, function(forceLaw) {
    var forces = forceLaw.calculateForces();
    goog.array.forEach(forces, function(force) {
      this.applyForce(change, force);
    }, this);
  }, this);
  change[this.varsList_.timeIndex()] = 1; // time variable
  return null;
};

/** Applies the Force by modifying the array representing rate of change of each
* variable.  The Force specifies which RigidBody it works on so we can figure out
* which variable rates to modify.  Adds the Force to the SimList with an immediate
* expiration time.
* @param {!Array<number>} change vector of rigid body accelerations
* @param {!Force} force the Force to be applied
* @protected
*/
RigidBodySim.prototype.applyForce = function(change, force) {
  var obj = force.getBody();
  if (!(goog.array.contains(this.bods_, obj))) {
    return;
  }
  var body = /** @type {!RigidBody} */(obj);
  var idx = body.getVarsIndex();
  if (idx < 0) {
    return;
  }
  var forceDir = force.getVector();
  var forceLoc = force.getStartPoint();
  var mass = body.getMass();
  change[idx + RigidBodySim.VX_] += forceDir.getX() / mass;
  change[idx + RigidBodySim.VY_] += forceDir.getY() / mass;
  // w'' = R x F / I
  var rx = forceLoc.getX() - body.getPosition().getX();
  var ry = forceLoc.getY() - body.getPosition().getY();
  change[idx + RigidBodySim.VW_] += (rx * forceDir.getY() - ry * forceDir.getX())/
      body.momentAboutCM();
  var torque = force.getTorque();
  if (torque != 0) {
    change[idx + RigidBodySim.VW_] += torque/body.momentAboutCM();
  }
  if (this.showForces_) {
    force.setExpireTime(this.getTime());
    this.getSimList().add(force);
  }
};

/** @inheritDoc */
RigidBodySim.prototype.debugLine = function(name, pa, pb, expireTime) {
  if (expireTime === undefined)
    expireTime = this.getTime();
  var v = new ConcreteLine(name, pa, pb);
  v.setExpireTime(expireTime);
  this.getSimList().add(v);
};

/** @inheritDoc */
RigidBodySim.prototype.debugCircle = function(name, center, radius, expireTime) {
  if (expireTime === undefined) {
    // when debugging, set expireTime = this.getTime() to have collisions
    // disappear after each step.
    expireTime = this.getTime() + 0.05;
  }
  var width = Math.max(0.02, Math.abs(2*radius));
  var m = PointMass.makeCircle(width, name).setMass(0);
  m.setPosition(center);
  m.setExpireTime(expireTime);
  this.getSimList().add(m);
};

/** @inheritDoc */
RigidBodySim.prototype.myPrint = function(message, colors) {
  if (Util.DEBUG) {
    var args = goog.array.slice(arguments, 1);
    args.unshift('%c'+NF7(this.getTime())+'%c '+message, 'color:green', 'color:black');
    console.log.apply(console, args);
  }
};

/** Sets the elasticity of all RigidBodys to this value.
Elasticity is used when calculating collisions; a value of 1.0 means perfectly
elastic where the kinetic energy after collision is the same as before (extremely
bouncy), while a value of 0 means no elasticity (no bounce).
Broadcasts a {@link #ELASTICITY_SET} event. See {@link RigidBody#setElasticity}.
* @param {number} value elasticity to set on all RigidBodys, a number from 0 to 1.
* @throws {!Error} if there are no RigidBodys
*/
RigidBodySim.prototype.setElasticity = function(value) {
  if (this.bods_.length == 0) {
    throw new Error('setElasticity: no bodies');
  }
  goog.array.forEach(this.bods_, function(body) {
    body.setElasticity(value);
  });
  this.broadcast(new GenericEvent(this, RigidBodySim.ELASTICITY_SET, value));
};


/** Set of internationalized strings.
@typedef {{
  COLLISION_HANDLING: string,
  COLLISION_ACCURACY: string,
  DISTANCE_TOL: string,
  EXTRA_ACCEL: string,
  RANDOM_SEED: string,
  SHOW_FORCES: string,
  SHOW_COLLISIONS: string,
  VELOCITY_TOL: string
  }}
*/
RigidBodySim.i18n_strings;

/**
@type {RigidBodySim.i18n_strings}
*/
RigidBodySim.en = {
  COLLISION_HANDLING: 'collision method',
  COLLISION_ACCURACY: 'collision accuracy',
  DISTANCE_TOL: 'distance tolerance',
  EXTRA_ACCEL: 'extra accel',
  RANDOM_SEED: 'random seed',
  SHOW_FORCES: 'show forces',
  SHOW_COLLISIONS: 'show collisions',
  VELOCITY_TOL: 'velocity tolerance'
};

/**
@private
@type {RigidBodySim.i18n_strings}
*/
RigidBodySim.de_strings = {
  COLLISION_HANDLING: 'Kollisionsmethode',
  COLLISION_ACCURACY: 'Kollisionsgenauigkeit',
  DISTANCE_TOL: 'Distanztoleranz',
  EXTRA_ACCEL: 'extra Beschleunigung',
  RANDOM_SEED: 'Zufallskern',
  SHOW_FORCES: 'Kr\u00e4fte anzeigen',
  SHOW_COLLISIONS: 'Kollisionen anzeigen',
  VELOCITY_TOL: 'Geschwindigkeitstoleranz'
};

/** Set of internationalized strings.
@type {RigidBodySim.i18n_strings}
*/
RigidBodySim.i18n = goog.LOCALE === 'de' ? RigidBodySim.de_strings :
    RigidBodySim.en;

}); // goog.scope
