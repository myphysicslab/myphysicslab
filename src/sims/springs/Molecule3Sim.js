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

goog.provide('myphysicslab.sims.springs.Molecule3Sim');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.AbstractODESim');
goog.require('myphysicslab.lab.model.Collision');
goog.require('myphysicslab.lab.model.CollisionSim');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.MutableVector');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.springs.MoleculeCollision');

goog.scope(function() {

var lab = myphysicslab.lab;

var AbstractODESim = myphysicslab.lab.model.AbstractODESim;
var Collision = myphysicslab.lab.model.Collision;
var ConcreteLine = myphysicslab.lab.model.ConcreteLine;
var EnergyInfo = myphysicslab.lab.model.EnergyInfo;
var EnergySystem = myphysicslab.lab.model.EnergySystem;
var MoleculeCollision = myphysicslab.sims.springs.MoleculeCollision;
const MutableVector = goog.module.get('myphysicslab.lab.util.MutableVector');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var PointMass = myphysicslab.lab.model.PointMass;
var Spring = myphysicslab.lab.model.Spring;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const VarsList = goog.module.get('myphysicslab.lab.model.VarsList');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Simulation of a 'molecule' made of 2 to 6 masses with springs between, moving freely
in 2D, and bouncing against the four walls. A small subset of the springs and masses are
designated as 'special' so that their parameters (mass, spring stiffness, spring rest
length) can be set separately from the others.

This uses the same physics as {@link myphysicslab.sims.springs.Molecule1Sim} but allows
for more springs and masses.


Variables and Parameters
-------------------------

Here is a diagram of two masses showing the definition of the angle `th`:

       m2     .
        \     .
         \ th .
          \   .
           \  .
            \ .
             m1

Variables:

    U1, U2 = position of center of mass of atom 1 or 2
    V1, V2 = velocity of atom 1 or 2
    th = angle with vertical (radians); 0 = up; positive is counter clockwise
    L = displacement of spring from rest length
    F1, F2 = force on atom

Parameters:

    m1, m2 = masses of atom 1 and 2
    R = rest length of spring
    k = spring constant
    b = damping constant


Equations of Motion
-------------------------
For each pair of masses, they experience the following forces from the spring connecting
them (but the damping force occurs only once for each mass).

    F1x = k L sin(th) -b V1x = m1 V1x'
    F1y = -m1 g +k L cos(th) -b V1y = m1 V1y'
    F2x = -k L sin(th) -b V2x = m2 V2x'
    F2y = -m2 g -k L cos(th) -b V2y = m2 V2y'
    xx = U2x - U1x
    yy = U2y - U1y
    len = sqrt(xx^2+yy^2)
    L = len - R
    cos(th) = yy / len
    sin(th) = xx / len

Variables Array
-------------------------

Variables are stored in a {@link VarsList}. Each PointMass gets
a set of four contiguous variables that describe its current position and
velocity. The variables are laid out as follows:

1. `x`  horizontal world coords position of center of mass
2. `y`  vertical world coords position of center of mass
3. `x'`  horizontal velocity of center of mass.  AKA `vx`
4. `y'`  vertical velocity of center of mass.  AKA `vy`

Variables at the beginning of the VariablesList:

+ time
+ kinetic energy
+ potential energy
+ total energy


Contact Force
-------------------------

We detect when an atom is in resting contact with floor or wall.
Consider contact with the floor.  Suppose the atom is 'close' to
the floor, then there are 3 cases:

1. vertical velocity is 'large' and positive.  Then the atom is
separating from the floor, so nothing needs to be done.

2. vertical velocity is 'large' and negative.  A collision is imminent,
so let the collision software handle this case.

3. vertical velocity is 'small'.  Now the atom is likely in contact
with the floor.  There are two cases:

a.  Net force positive: atom is being pulled off floor.  In this
case do nothing, there is no reaction force from the floor.

b.  Net force negative: atom is being pulled downwards.
Here, we set the net force to zero, because the force is resisted
by the reaction force from the floor.


How small is 'small' velocity?
--------------------------------

We are trying to avoid the case where there is a tiny upwards velocity
and a large downwards force, which just results in zillions of collisions
over the time step we are solving (typically about 0.03 seconds).
Instead, we assume that the atom stops bouncing and comes into
contact with the floor in this case.

For a given force (assuming it stays approx constant over the time span
of 0.03 seconds), there is an 'escape velocity' that would allow the atom
to leave contact and be above the floor at the end of the time step.

Let

    h = time step
    F = force
    m = mass
    v0 = initial vertical velocity

Then we have (using simple calculus; 2 integrations)

    v' = F/m
    v = (F/m)t + v0
    y = (F/2m)t^2 + v0*t

Requiring the atom to be below the floor at time h gives the condition

    0 > y = (F/2m)h^2 + v0*h

Dividing by h gives

    0 > F*h/2m + v0
    -F*h/2m > v0

For the case of interest, we have that `F` is a large downward force, so `F << 0`.
If the initial velocity `v0` is less than `-F*h/2m` then (assuming constant F over
the timespan `h`) the atom starting at the floor will still be on or below
the floor at the end of the timespan `h`.

This is our definition of a small velocity.  Note that it depends
on the net force.  Because with a large downward force, it would take a big
velocity to actually result in contact being lost at the end of the time period.
Equivalently, if there is just a slight downward force (e.g. spring almost
offsetting gravity), then just a little velocity is enough to result in
contact being broken.

* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {AbstractODESim}
* @implements {myphysicslab.lab.model.CollisionSim}
* @implements {EnergySystem}
* @implements {myphysicslab.lab.app.EventHandler}
*/
myphysicslab.sims.springs.Molecule3Sim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  var var_names = [
      VarsList.en.TIME,
      EnergySystem.en.KINETIC_ENERGY,
      EnergySystem.en.POTENTIAL_ENERGY,
      EnergySystem.en.TOTAL_ENERGY,
      Molecule3Sim.en.FORCE+'1',
      Molecule3Sim.en.FORCE+'2',
      Molecule3Sim.en.FORCE+'3'
  ];
  var i18n_names = [
      VarsList.i18n.TIME,
      EnergySystem.i18n.KINETIC_ENERGY,
      EnergySystem.i18n.POTENTIAL_ENERGY,
      EnergySystem.i18n.TOTAL_ENERGY,
      Molecule3Sim.i18n.FORCE+'1',
      Molecule3Sim.i18n.FORCE+'2',
      Molecule3Sim.i18n.FORCE+'3'
  ];
  // set up variables so that sim.getTime() can be called during setup.
  this.getVarsList().addVariables(var_names, i18n_names);
  // energy variables are computed from other variables.
  this.getVarsList().setComputed(1, 2, 3, 4, 5, 6);

  /** the atom being dragged, or -1 when no drag is happening
  * @type {number}
  * @private
  */
  this.dragAtom_ = -1;
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.elasticity_ = 1.0;
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0;
  /** distance tolerance: how close to a wall to be in resting contact
  * @type {number}
  * @private
  */
  this.distTol_ = 0.02;
  /** length of timeStep, used in resting contact calculation
  * @type {number}
  * @private
  */
  this.timeStep_ = 0.03;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /** Function to paint canvases, for debugging. If defined, this will be called within
  * `moveObjects()` so you can see the simulation state after each
  * time step (you will need to arrange your debugger to pause after
  * each invocation of debugPaint_ to see the state).
  * @type {?function():undefined}
  * @private
  */
  this.debugPaint_ = null;
  /**
  * @type {!PointMass}
  * @private
  */
  this.walls_ = PointMass.makeSquare(12, 'walls').setMass(Util.POSITIVE_INFINITY);
  this.getSimList().add(this.walls_);
  /**
  * @type {!Array<!PointMass>}
  * @private
  */
  this.atoms_ = [];
  /**
  * @type {!Array<!Spring>}
  * @private
  */
  this.springs_ = [];
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.GRAVITY,
      Molecule3Sim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.DAMPING,
      Molecule3Sim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.ELASTICITY,
      Molecule3Sim.i18n.ELASTICITY,
      goog.bind(this.getElasticity, this), goog.bind(this.setElasticity, this))
      .setSignifDigits(3).setUpperLimit(1));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.PE_OFFSET,
      Molecule3Sim.i18n.PE_OFFSET,
      goog.bind(this.getPEOffset, this), goog.bind(this.setPEOffset, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY)
      .setSignifDigits(5));
};

var Molecule3Sim = myphysicslab.sims.springs.Molecule3Sim;
goog.inherits(Molecule3Sim, AbstractODESim);

/** @override */
Molecule3Sim.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +'gravity_: '+Util.NF(this.gravity_)
      +', damping: '+Util.NF(this.getDamping())
      +', elasticity_: '+Util.NF(this.elasticity_)
      +', number_of_atoms: '+this.atoms_.length
      +', walls_: '+this.walls_
      + Molecule3Sim.superClass_.toString.call(this);
};

/** @override */
Molecule3Sim.prototype.getClassName = function() {
  return 'Molecule3Sim';
};

/** Index in variables of first atom.
@type {number}
@static
@const
*/
Molecule3Sim.START_VAR = 7;

/** Adds a {@link PointMass} to the simulation, and gets the initial conditions
from that atom.
* @param {!PointMass} atom the PointMass to add to the simulation
*/
Molecule3Sim.prototype.addAtom = function(atom) {
  if (!goog.array.contains(this.atoms_, atom)) {
    // create 4 variables in vars array for this atom
    var names = [];
    for (var k = 0; k<4; k++) {
      names.push(this.getVarName(atom, k, /*localized=*/false));
    }
    var localNames = [];
    for (var k = 0; k<4; k++) {
      localNames.push(this.getVarName(atom, k, /*localized=*/true));
    }
    var idx = this.getVarsList().addVariables(names, localNames);
    this.atoms_.push(atom);
    this.getSimList().add(atom);
  }
  this.initializeFromAtom(atom);
};

/** Returns the name of the specified variable for the given atom.
@param {!PointMass} atom the PointMass of interest
@param {number} index  which variable name is desired: 0 = x-position, 1 = x-velocity,
    2 = y-position, 3 = y-velocity
@param {boolean} localized whether to return localized variable name
@return {string} the name of the specified variable for the given atom
*/
Molecule3Sim.prototype.getVarName = function(atom, index, localized) {
  var s = atom.getName(localized)+' ';
  switch (index) {
    case 0: s += 'X '+
      (localized ? Molecule3Sim.i18n.POSITION : Molecule3Sim.en.POSITION);
      break;
    case 1: s += 'Y '+
      (localized ? Molecule3Sim.i18n.POSITION : Molecule3Sim.en.POSITION);
      break;
    case 2: s += 'X '+
      (localized ? Molecule3Sim.i18n.VELOCITY : Molecule3Sim.en.VELOCITY);
      break;
    case 3: s += 'Y '+
      (localized ? Molecule3Sim.i18n.VELOCITY : Molecule3Sim.en.VELOCITY);
      break;
    default:
      throw new Error();
  }
  return s;
};

/** Sets the simulation variables to match the atom's state (by copying the atom's
* position and velocity to the simulation's VarsList).
* @param {!PointMass} atom the PointMass to use for updating
*     the simulation variables
*/
Molecule3Sim.prototype.initializeFromAtom = function(atom) {
  var idx = goog.array.indexOf(this.atoms_, atom);
  if (idx < 0) {
    throw new Error("atom not found: "+atom);
  }
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  idx = Molecule3Sim.START_VAR + 4*idx;
  var va = this.getVarsList();
  va.setValue(idx, atom.getPosition().getX());
  va.setValue(idx + 1, atom.getPosition().getY());
  va.setValue(idx + 2, atom.getVelocity().getX());
  va.setValue(idx + 3, atom.getVelocity().getY());
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(1, 2, 3);
};

/** Returns the set of {@link PointMass}'s in the simulation.
* @return {!Array<!PointMass>}
*/
Molecule3Sim.prototype.getAtoms = function() {
  return goog.array.clone(this.atoms_);
};

/** Adds a {@link Spring} to the simulation.
* @param {!Spring} spring the Spring to add to the simulation
*/
Molecule3Sim.prototype.addSpring = function(spring) {
  this.springs_.push(spring);
  this.getSimList().add(spring);
};

/** Returns the set of {@link Spring}'s in the simulation.
* @return {!Array<!Spring>}
*/
Molecule3Sim.prototype.getSprings = function() {
  return goog.array.clone(this.springs_);
};

/** Returns the {@link PointMass} that represents the walls.
* @return {!PointMass} the {@link PointMass} that represents the walls.
*/
Molecule3Sim.prototype.getWalls = function() {
  return this.walls_;
};

/** Sets the {@link PointMass} that represents the walls.
* @param {!PointMass} walls the {@link PointMass} that represents the walls.
*/
Molecule3Sim.prototype.setWalls = function(walls) {
  this.getSimList().remove(this.walls_);
  this.walls_ = walls;
  this.getSimList().add(this.walls_);
};

/** Removes all springs and atoms from the simulation.
* @return {undefined}
*/
Molecule3Sim.prototype.cleanSlate = function() {
  // Don't make a new VarsList, because there are various controls and graphs
  // observing the current VarsList.  Instead, resize it for zero bodies.
  // Note this will delete any Variables that have been added to the end
  // of the VarsList.
  var nv = this.getVarsList().numVariables();
  // set time to zero
  this.getVarsList().setValue(0, 0);
  if (nv > Molecule3Sim.START_VAR) {
    // delete all variables except: 0 = time, 1 = KE, 2 = PE, 3 = TE, F1, F2, F3
    this.getVarsList().deleteVariables(Molecule3Sim.START_VAR,
        nv - Molecule3Sim.START_VAR);
  }
  this.getSimList().removeAll(this.atoms_);
  goog.array.clear(this.atoms_);
  this.getSimList().removeAll(this.springs_);
  goog.array.clear(this.springs_);
};

/** @override */
Molecule3Sim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
Molecule3Sim.prototype.getEnergyInfo_ = function(vars) {
  // We assume that modifyObjects() has been called so the objects have
  // position and velocity corresponding to the vars[] array.
  /** @type {number} */
  var ke = 0;
  /** @type {number} */
  var pe = 0;
  goog.array.forEach(this.springs_, function(spr) {
    pe += spr.getPotentialEnergy();
  });
  var bottom = this.walls_.getBoundsWorld().getBottom();
  goog.array.forEach(this.atoms_, function(atom) {
    ke += atom.getKineticEnergy();
    // gravity potential = m g (y - floor)
    pe += this.gravity_ * atom.getMass() *
        (atom.getPosition().getY() - (bottom + atom.getHeight()/2));
  }, this);
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
Molecule3Sim.prototype.setPotentialEnergy = function(value) {
  this.setPEOffset(0);
  this.setPEOffset(value - this.getEnergyInfo().getPotential());
};

/** @override */
Molecule3Sim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  var ei = this.getEnergyInfo_(vars);
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  va.setValue(1, ei.getTranslational(), true);
  va.setValue(2, ei.getPotential(), true);
  va.setValue(3, ei.getTotalEnergy(), true);

  // find magnitude of force on atoms
  var rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  var m = this.atoms_[0].getMass();
  // F = m a, we have accel, so multiply by mass
  var fx = m * rate[Molecule3Sim.START_VAR + 2];
  var fy = m * rate[Molecule3Sim.START_VAR + 3];
  va.setValue(4, Math.sqrt(fx*fx + fy*fy), true);
  // force on atom 2
  if (this.atoms_.length > 1) {
    m = this.atoms_[1].getMass();
    fx = m * rate[Molecule3Sim.START_VAR + 6];
    fy = m * rate[Molecule3Sim.START_VAR + 7];
    va.setValue(5, Math.sqrt(fx*fx + fy*fy), true);
  } else {
    va.setValue(5, 0, true);
  }
  // force on atom 3
  if (this.atoms_.length > 2) {
    m = this.atoms_[2].getMass();
    fx = m * rate[Molecule3Sim.START_VAR + 10];
    fy = m * rate[Molecule3Sim.START_VAR + 11];
    va.setValue(6, Math.sqrt(fx*fx + fy*fy), true);
  } else {
    va.setValue(6, 0, true);
  }
};

/**
@param {!Array<number>} vars
@private
*/
Molecule3Sim.prototype.moveObjects = function(vars) {
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  goog.array.forEach(this.atoms_, function(atom, i) {
    var idx = Molecule3Sim.START_VAR + 4*i;
    atom.setPosition(new Vector(vars[idx],  vars[1 + idx]));
    atom.setVelocity(new Vector(vars[2 + idx], vars[3 + idx], 0));
  });
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
};

/** @override */
Molecule3Sim.prototype.setDebugPaint = function(fn) {
  this.debugPaint_ = fn;
};

/** @override */
Molecule3Sim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  this.dragAtom_ = goog.array.indexOf(this.atoms_, simObject);
  return this.dragAtom_ > -1;
};

/** @override */
Molecule3Sim.prototype.mouseDrag = function(simObject, location, offset, mouseEvent) {
  if (this.dragAtom_ > -1) {
    var atom = this.atoms_[this.dragAtom_];
    if (simObject != atom) {
      return;
    }
    var p = location.subtract(offset);
    var x = p.getX();
    var y = p.getY();
    var w = atom.getWidth()/2;
    var h = atom.getHeight()/2;
    var walls = this.walls_.getBoundsWorld();
    // disallow drag outside of walls
    if (x < walls.getLeft() + w) {
      x = walls.getLeft() + w + 0.0001;
    }
    if (x > walls.getRight() - w) {
      x = walls.getRight() - w - 0.0001;
    }
    if (y < walls.getBottom() + h) {
      y = walls.getBottom() + h + 0.0001;
    }
    if (y > walls.getTop() - h) {
      y = walls.getTop() - h - 0.0001;
    }
    // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
    //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
    var va = this.getVarsList();
    var idx = Molecule3Sim.START_VAR + 4*this.dragAtom_;
    va.setValue(0 + idx, x);
    va.setValue(1 + idx, y);
    va.setValue(2 + idx, 0);
    va.setValue(3 + idx, 0);
    // derived energy variables are discontinuous
    va.incrSequence(1, 2, 3);
    this.moveObjects(va.getValues());
  }
};

/** @override */
Molecule3Sim.prototype.finishDrag = function(simObject, location, offset) {
  this.dragAtom_ = -1;
  // modify initial conditions, but only when changes happen at time zero
  if (!Util.veryDifferent(this.getTime(), 0)) {
    this.saveInitialState();
  }
};

/** @override */
Molecule3Sim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/**
* @param {!Array<!myphysicslab.lab.model.Collision>} collisions
* @param {!myphysicslab.lab.model.PointMass} atom
* @param {string} side which side of the wall colliding with
* @param {number} time
* @private
*/
Molecule3Sim.prototype.addCollision = function(collisions, atom, side, time) {
  var c = new MoleculeCollision(atom, this.walls_, side, time);
  collisions.push(c);
};

/** @override */
Molecule3Sim.prototype.findCollisions = function(collisions, vars, stepSize) {
  this.moveObjects(vars);
  var w = this.walls_.getBoundsWorld();
  goog.array.forEach(this.atoms_, function(atom) {
    var a = atom.getBoundsWorld();
    var t = this.getTime()+stepSize;
    if (a.getLeft() < w.getLeft()) {
      this.addCollision(collisions, atom, MoleculeCollision.LEFT_WALL, t);
    }
    if (a.getRight() > w.getRight()) {
      this.addCollision(collisions, atom, MoleculeCollision.RIGHT_WALL, t);
    }
    if (a.getBottom() < w.getBottom()) {
      this.addCollision(collisions, atom, MoleculeCollision.BOTTOM_WALL, t);
    }
    if (a.getTop() > w.getTop()) {
      this.addCollision(collisions, atom, MoleculeCollision.TOP_WALL, t);
    }
  }, this);
};

/** @override */
Molecule3Sim.prototype.handleCollisions = function(collisions, opt_totals) {
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  var va = this.getVarsList();
  var vars = va.getValues();
  goog.array.forEach(collisions, function(collision) {
    var c = /** @type {!MoleculeCollision} */(collision);
    var idx = Molecule3Sim.START_VAR + 4*goog.array.indexOf(this.atoms_, c.atom);
    switch (c.side) {
      case MoleculeCollision.LEFT_WALL:
      case MoleculeCollision.RIGHT_WALL:
        va.setValue(2+idx, -this.elasticity_ * vars[2+idx]);
        break;
      case MoleculeCollision.TOP_WALL:
      case MoleculeCollision.BOTTOM_WALL:
        va.setValue(3+idx, -this.elasticity_ * vars[3+idx]);
        break;
      default:
        throw new Error();
    }
    if (opt_totals) {
      opt_totals.addImpulses(1);
    }
  }, this);
  // derived energy variables are discontinuous
  va.incrSequence(1, 2, 3);
  return true;
};

/** @override */
Molecule3Sim.prototype.evaluate = function(vars, change, timeStep) {
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[0] = 1; // time
  var walls = this.walls_.getBoundsWorld();
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  goog.array.forEach(this.atoms_, function(atom, listIdx) {
    if (this.dragAtom_ == listIdx) {
      return;
    }
    var idx = Molecule3Sim.START_VAR + 4*listIdx;
    var vx = vars[idx+2];
    var vy = vars[idx+3];
    change[idx] = vx; // Ux' = Vx
    change[idx+1] = vy; // Uy' = Vy
    var mass = atom.getMass();
    var bounds = atom.getBoundsWorld();
    // for each spring, get force from spring
    var force = new MutableVector(0, 0);
    goog.array.forEach(this.springs_, function(spr) {
      if (spr.getBody1() == atom) {
        force.add(spr.calculateForces()[0].getVector());
      } else if (spr.getBody2() == atom) {
        force.add(spr.calculateForces()[1].getVector());
      }
    });
    // add gravity force
    force.add(new Vector(0, -this.gravity_*mass));
    // add damping force
    var d = new Vector(vx, vy);
    force.add(d.multiply(-this.damping_));

    var ax = force.getX()/mass;
    if (ax<0 && Math.abs(bounds.getLeft()-walls.getLeft())<this.distTol_
        && Math.abs(vx) < -ax*this.timeStep_/(2*mass)) {
      // left wall contact if (leftward force, near left wall, and low velocity)
      ax = 0;
    } else if (ax>0 && Math.abs(bounds.getRight()-walls.getRight()) < this.distTol_
        && Math.abs(vx) < ax*this.timeStep_/(2*mass)) {
      // right wall contact if (rightward force, near right wall, and low velocity)
      ax = 0;
    }
    change[idx+2] = ax; // Vx'

    var ay = force.getY()/mass;
    if (ay<0 && Math.abs(bounds.getBottom() - walls.getBottom()) < this.distTol_
        && Math.abs(vy) < -ay*this.timeStep_/(2*mass)) {
      // floor contact if (downward force, near floor, and low velocity)
      ay = 0;
    } else if (ay>0 && Math.abs(bounds.getTop() - walls.getTop()) < this.distTol_
        && Math.abs(vy) < ay*this.timeStep_/(2*mass)) {
      // ceiling contact if (upward force, near ceiling, and low velocity)
      ay = 0;
    }
    change[idx+3] = ay; // Vy'
  }, this);
  return null;
};

/** Return gravity strength.
@return {number} gravity strength
*/
Molecule3Sim.prototype.getGravity = function() {
  return this.gravity_;
};

/** Set gravity strength.
@param {number} value gravity strength
*/
Molecule3Sim.prototype.setGravity = function(value) {
  this.gravity_ = value;
  // discontinuous change in energy for PE, TE
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  F1  F2  F3  U1x U1y V1x V1y U2x U2y V2x V2y
  this.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(Molecule3Sim.en.GRAVITY);
};

/** Return damping
@return {number} damping
*/
Molecule3Sim.prototype.getDamping = function() {
  return this.damping_;
};

/** Set damping
@param {number} value damping
*/
Molecule3Sim.prototype.setDamping = function(value) {
  this.damping_ = value;
  this.broadcastParameter(Molecule3Sim.en.DAMPING);
};

/** Return elasticity
@return {number} elasticity
*/
Molecule3Sim.prototype.getElasticity = function() {
  return this.elasticity_;
};

/** Set elasticity
@param {number} value elasticity
*/
Molecule3Sim.prototype.setElasticity = function(value) {
  this.elasticity_ = value;
  this.broadcastParameter(Molecule3Sim.en.ELASTICITY);
};

/** Return potential energy offset; this amount is added to the reported potential
* energy.
@return {number} potential energy offset
*/
Molecule3Sim.prototype.getPEOffset = function() {
  return this.potentialOffset_;
};

/** Set potential energy offset; this amount is added to the reported potential energy.
@param {number} value potential energy offset
*/
Molecule3Sim.prototype.setPEOffset = function(value) {
  this.potentialOffset_ = value;
  this.broadcastParameter(Molecule3Sim.en.PE_OFFSET);
};

/** Set of internationalized strings.
@typedef {{
  DAMPING: string,
  ELASTICITY: string,
  GRAVITY: string,
  POSITION: string,
  VELOCITY: string,
  PE_OFFSET: string,
  FORCE: string
  }}
*/
Molecule3Sim.i18n_strings;

/**
@type {Molecule3Sim.i18n_strings}
*/
Molecule3Sim.en = {
  DAMPING: 'damping',
  ELASTICITY: 'elasticity',
  GRAVITY: 'gravity',
  POSITION: 'position',
  VELOCITY: 'velocity',
  PE_OFFSET: 'PE offset',
  FORCE: 'force'
};

/**
@private
@type {Molecule3Sim.i18n_strings}
*/
Molecule3Sim.de_strings = {
  DAMPING: 'D\u00e4mpfung',
  ELASTICITY: 'Elastizit\u00e4t',
  GRAVITY: 'Gravitation',
  POSITION: 'Position',
  VELOCITY: 'Geschwindigkeit',
  PE_OFFSET: 'PE offset',
  FORCE: 'Kraft'
};

/** Set of internationalized strings.
@type {Molecule3Sim.i18n_strings}
*/
Molecule3Sim.i18n = goog.LOCALE === 'de' ? Molecule3Sim.de_strings :
    Molecule3Sim.en;

}); // goog.scope
