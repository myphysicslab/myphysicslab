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

goog.provide('myphysicslab.sims.springs.Molecule1Sim');

goog.require('goog.asserts');
goog.require('goog.array');
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
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var PointMass = myphysicslab.lab.model.PointMass;
var Spring = myphysicslab.lab.model.Spring;
const Util = goog.module.get('myphysicslab.lab.util.Util');
var VarsList = myphysicslab.lab.model.VarsList;
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Simulation of a 'molecule' made of two masses with a spring between, moving freely
in 2D, and bouncing against the four walls.


Variables and Parameters
-------------------------

Here is a diagram of the two masses showing the definition of the angle `th`:

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
    b1, b2 = damping constants for each atom


Equations of Motion
-------------------------

    F1x = k L sin(th) -b1 V1x = m1 V1x'
    F1y = -m1 g +k L cos(th) -b1 V1y = m1 V1y'
    F2x = -k L sin(th) -b2 V2x = m2 V2x'
    F2y = -m2 g -k L cos(th) -b2 V2y = m2 V2y'
    xx = U2x - U1x
    yy = U2y - U1y
    len = sqrt(xx^2+yy^2)
    L = len - R
    cos(th) = yy / len
    sin(th) = xx / len


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
myphysicslab.sims.springs.Molecule1Sim = function(opt_name) {
  AbstractODESim.call(this, opt_name);
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  var var_names = [
    Molecule1Sim.en.X1_POSITION,
    Molecule1Sim.en.Y1_POSITION,
    Molecule1Sim.en.X1_VELOCITY,
    Molecule1Sim.en.Y1_VELOCITY,
    Molecule1Sim.en.X2_POSITION,
    Molecule1Sim.en.Y2_POSITION,
    Molecule1Sim.en.X2_VELOCITY,
    Molecule1Sim.en.Y2_VELOCITY,
    VarsList.en.TIME,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY
  ];
  var i18n_names = [
    Molecule1Sim.i18n.X1_POSITION,
    Molecule1Sim.i18n.Y1_POSITION,
    Molecule1Sim.i18n.X1_VELOCITY,
    Molecule1Sim.i18n.Y1_VELOCITY,
    Molecule1Sim.i18n.X2_POSITION,
    Molecule1Sim.i18n.Y2_POSITION,
    Molecule1Sim.i18n.X2_VELOCITY,
    Molecule1Sim.i18n.Y2_VELOCITY,
    VarsList.i18n.TIME,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY
  ];
  var va = new VarsList(var_names, i18n_names, this.getName()+'_VARS');
  this.setVarsList(va);
  va.setComputed(9, 10, 11);
  /** true when dragging atom1
  * @type {boolean}
  * @private
  */
  this.dragAtom1_ = false;
  /** true when dragging atom2
  * @type {boolean}
  * @private
  */
  this.dragAtom2_ = false;
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = 9.8;
  /**
  * @type {number}
  * @private
  */
  this.elasticity_ = 1.0;
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
  /**
  * @type {!PointMass}
  * @private
  */
  this.walls_ = PointMass.makeSquare(12, 'walls')
      .setMass(Util.POSITIVE_INFINITY);
  /**
  * @type {!PointMass}
  * @private
  */
  this.atom1_ = PointMass.makeCircle(0.5, 'atom1').setMass(0.5);
  /**
  * @type {!PointMass}
  * @private
  */
  this.atom2_ = PointMass.makeCircle(0.5, 'atom2').setMass(0.5);
  /**
  * @type {!Array<!PointMass>}
  * @private
  */
  this.atoms_ = [this.atom1_, this.atom2_];
  /** Function to paint canvases, for debugging. If defined, this will be called within
  * `moveObjects()` so you can see the simulation state after each
  * time step (you will need to arrange your debugger to pause after
  * each invocation of debugPaint_ to see the state).
  * @type {?function():undefined}
  * @private
  */
  this.debugPaint_ = null;
  /**
  * @type {!Spring}
  * @private
  */
  this.spring_ = new Spring('spring',
      this.atom1_, Vector.ORIGIN,
      this.atom2_, Vector.ORIGIN,
      /*restLength=*/2.0, /*stiffness=*/6.0);
  this.spring_.setDamping(0);
  this.getSimList().add(this.walls_, this.atom1_, this.atom2_, this.spring_);
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  va.setValue(2, 1.5);
  va.setValue(5, 1.7);
  this.saveInitialState();
  this.modifyObjects();
  this.addParameter(new ParameterNumber(this, Molecule1Sim.en.GRAVITY,
      Molecule1Sim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterNumber(this, Molecule1Sim.en.MASS1,
      Molecule1Sim.i18n.MASS1,
      goog.bind(this.getMass1, this), goog.bind(this.setMass1, this)));
  this.addParameter(new ParameterNumber(this, Molecule1Sim.en.MASS2,
      Molecule1Sim.i18n.MASS2,
      goog.bind(this.getMass2, this), goog.bind(this.setMass2, this)));
  this.addParameter(new ParameterNumber(this, Molecule1Sim.en.DAMPING,
      Molecule1Sim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, Molecule1Sim.en.ELASTICITY,
      Molecule1Sim.i18n.ELASTICITY,
      goog.bind(this.getElasticity, this), goog.bind(this.setElasticity, this))
      .setSignifDigits(3).setUpperLimit(1));
  this.addParameter(new ParameterNumber(this, Molecule1Sim.en.SPRING_LENGTH,
      Molecule1Sim.i18n.SPRING_LENGTH,
      goog.bind(this.getSpringRestLength, this),
      goog.bind(this.setSpringRestLength, this)));
  this.addParameter(new ParameterNumber(this, Molecule1Sim.en.SPRING_STIFFNESS,
      Molecule1Sim.i18n.SPRING_STIFFNESS,
      goog.bind(this.getSpringStiffness, this),
      goog.bind(this.setSpringStiffness, this)));
};

var Molecule1Sim = myphysicslab.sims.springs.Molecule1Sim;
goog.inherits(Molecule1Sim, AbstractODESim);

if (!Util.ADVANCED) {
  /** @override */
  Molecule1Sim.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', gravity_: '+Util.NF(this.gravity_)
        +', damping: '+Util.NF(this.getDamping())
        +', elasticity_: '+Util.NF(this.elasticity_)
        +', spring_: '+this.spring_
        +', atom1_: '+this.atom1_
        +', atom2_: '+this.atom2_
        +', walls_: '+this.walls_
        + Molecule1Sim.superClass_.toString.call(this);
  };
};

/** @override */
Molecule1Sim.prototype.getClassName = function() {
  return 'Molecule1Sim';
};

/** @override */
Molecule1Sim.prototype.getEnergyInfo = function() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
Molecule1Sim.prototype.getEnergyInfo_ = function(vars) {
  var ke = this.atom1_.getKineticEnergy() + this.atom2_.getKineticEnergy();
  var bottom = this.walls_.getBoundsWorld().getBottom();
  var pe = this.gravity_ * this.atom1_.getMass() *
      (this.atom1_.getPosition().getY() - (bottom + this.atom1_.getHeight()/2));
  pe += this.gravity_ * this.atom2_.getMass() *
      (this.atom2_.getPosition().getY() - (bottom + this.atom2_.getHeight()/2));
  pe += this.spring_.getPotentialEnergy();
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @override */
Molecule1Sim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @override */
Molecule1Sim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  var ei = this.getEnergyInfo_(vars);
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  va.setValue(9, ei.getTranslational(), true);
  va.setValue(10, ei.getPotential(), true);
  va.setValue(11, ei.getTotalEnergy(), true);
};

/**
@param {!Array<number>} vars
@private
*/
Molecule1Sim.prototype.moveObjects = function(vars) {
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  this.atom1_.setPosition(new Vector(vars[0],  vars[1]));
  this.atom1_.setVelocity(new Vector(vars[2], vars[3], 0));
  this.atom2_.setPosition(new Vector(vars[4],  vars[5]));
  this.atom2_.setVelocity(new Vector(vars[6], vars[7], 0));
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
};

/** @override */
Molecule1Sim.prototype.setDebugPaint = function(fn) {
  this.debugPaint_ = fn;
};

/** @override */
Molecule1Sim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  if (simObject == this.atom1_) {
    this.dragAtom1_ = true;
    return true;
  } else if (simObject == this.atom2_) {
    this.dragAtom2_ = true;
    return true;
  } else {
    return false;
  }
};

/** @override */
Molecule1Sim.prototype.mouseDrag = function(simObject, location, offset, mouseEvent) {
  var va = this.getVarsList();
  var p = location.subtract(offset);
  var x = p.getX();
  var y = p.getY();
  var w = (simObject==this.atom1_) ? this.atom1_.getWidth() : this.atom2_.getWidth();
  var h = (simObject==this.atom1_) ? this.atom1_.getHeight() : this.atom2_.getHeight();
  var walls = this.walls_.getBoundsWorld();
  // disallow drag outside of walls
  if (x < walls.getLeft() + w/2) {
    x = walls.getLeft() + w/2 + 0.0001;
  }
  if (x > walls.getRight() - w/2) {
    x = walls.getRight() - w/2 - 0.0001;
  }
  if (y < walls.getBottom() + h/2) {
    y = walls.getBottom() + h/2 + 0.0001;
  }
  if (y > walls.getTop() - h/2) {
    y = walls.getTop() - h/2 - 0.0001;
  }
  if (simObject == this.atom1_) {
    // vars: 0   1   2   3   4   5   6   7    8  9  10 11
    //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
    va.setValue(0, x);
    va.setValue(1, y);
    va.setValue(2, 0);
    va.setValue(3, 0);
  } else if (simObject == this.atom2_) {
    va.setValue(4, x);
    va.setValue(5, y);
    va.setValue(6, 0);
    va.setValue(7, 0);
  }
  // derived energy variables are discontinuous
  va.incrSequence(9, 10, 11);
  this.moveObjects(va.getValues());
};

/** @override */
Molecule1Sim.prototype.finishDrag = function(simObject, location, offset) {
  this.dragAtom1_ = false;
  this.dragAtom2_ = false;
};

/** @override */
Molecule1Sim.prototype.handleKeyEvent = function(keyCode, pressed, keyEvent) {
};

/**
* @param {!Array<!Collision>} collisions
* @param {!PointMass} atom
* @param {string} side which side of the wall colliding with
* @param {number} time
* @private
*/
Molecule1Sim.prototype.addCollision = function(collisions, atom, side, time) {
  var c = new MoleculeCollision(atom, this.walls_, side, time);
  collisions.push(c);
};

/** @override */
Molecule1Sim.prototype.findCollisions = function(collisions, vars, stepSize) {
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
Molecule1Sim.prototype.handleCollisions = function(collisions, opt_totals) {
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  var va = this.getVarsList();
  var vars = va.getValues();
  goog.array.forEach(collisions, function(collision) {
    var c = /** @type {!MoleculeCollision} */(collision);
    var idx = 4*goog.array.indexOf(this.atoms_, c.atom);
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
  va.incrSequence(9, 10, 11);
  return true;
};

/** @override */
Molecule1Sim.prototype.evaluate = function(vars, change, timeStep) {
  Util.zeroArray(change);
  this.moveObjects(vars);
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  change[8] = 1; // time
  var forces = this.spring_.calculateForces();
  var walls = this.walls_.getBoundsWorld();

  if (!this.dragAtom1_) {
    var sf1 = forces[0];
    goog.asserts.assert(sf1.getBody() == this.atom1_);
    var m1 = this.atom1_.getMass();
    var b1 = this.atom1_.getBoundsWorld();
    change[0] = vars[2]; // Ux' = Vx
    change[1] = vars[3]; // Uy' = Vy

    // V1x' = (k/m1) L sin(th)
    var r = sf1.getVector().getX() / m1;
    if (r<0 && Math.abs(b1.getLeft()-walls.getLeft())<this.distTol_
        && Math.abs(vars[2])<-r*this.timeStep_/(2*m1)) {
      // left wall contact if (leftward force, near left wall, and low velocity)
      r = 0;
    } else if (r>0 && Math.abs(b1.getRight()-walls.getRight())<this.distTol_
        && Math.abs(vars[2])<r*this.timeStep_/(2*m1)) {
      // right wall contact if (rightward force, near right wall, and low velocity)
      r = 0;
    }
    change[2] = r;

    // V1y' = -g -(k/m1) L cos(th)
    r = -this.gravity_ + sf1.getVector().getY() / m1;
    if (r<0 && Math.abs(b1.getBottom() - walls.getBottom())<this.distTol_
        && Math.abs(vars[3])<-r*this.timeStep_/(2*m1)) {
      // floor contact if (downward force, near floor, and low velocity)
      r = 0;
    } else if (r>0 && Math.abs(b1.getTop() - walls.getTop())<this.distTol_
        && Math.abs(vars[3])<r*this.timeStep_/(2*m1)) {
      // ceiling contact if (upward force, near ceiling, and low velocity)
      r = 0;
    }
    change[3] = r;
  }

  if (!this.dragAtom2_) {
    var sf2 = forces[1];
    goog.asserts.assert(sf2.getBody() == this.atom2_);
    var m2 = this.atom2_.getMass();
    var b2 = this.atom2_.getBoundsWorld();
    change[4] = vars[6]; // Ux' = Vx
    change[5] = vars[7]; // Uy' = Vy

    // V2x'
    r = sf2.getVector().getX() / m2;
    if (r<0 && Math.abs(b2.getLeft() - walls.getLeft())<this.distTol_
        && Math.abs(vars[6])<-r*this.timeStep_/(2*m2)) {
      // left wall contact if (leftward force, near left wall, and low velocity)
      r = 0;
    } else if (r>0 && Math.abs(b2.getRight()-walls.getRight())<this.distTol_
        && Math.abs(vars[6])<r*this.timeStep_/(2*m2)) {
      // right wall contact if (rightward force, near right wall, and low velocity)
      r = 0;
    }
    change[6] = r;

    // V2y'
    r = -this.gravity_ + sf2.getVector().getY() / m2;
    if (r<0 && Math.abs(b2.getBottom() - walls.getBottom())<this.distTol_
        && Math.abs(vars[7])<-r*this.timeStep_/(2*m2)) {
      // floor contact if (downward force, near floor, and low velocity)
      r = 0;
    } else if (r>0 && Math.abs(b2.getTop()-walls.getTop())<this.distTol_
        && Math.abs(vars[7])<r*this.timeStep_/(2*m2)) {
      // ceiling contact if (upward force, near ceiling, and low velocity)
      r = 0;
    }
    change[7] = r;
  }
  return null;
};

/** Return gravity strength.
@return {number} gravity strength
*/
Molecule1Sim.prototype.getGravity = function() {
  return this.gravity_;
};

/** Set gravity strength.
@param {number} value gravity strength
*/
Molecule1Sim.prototype.setGravity = function(value) {
  this.gravity_ = value;
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(10, 11);
  this.broadcastParameter(Molecule1Sim.en.GRAVITY);
};

/** Return mass of atom 1
@return {number} mass of atom 1
*/
Molecule1Sim.prototype.getMass1 = function() {
  return this.atom1_.getMass();
};

/** Set mass of atom 1
@param {number} value mass of atom 1
*/
Molecule1Sim.prototype.setMass1 = function(value) {
  this.atom1_.setMass(value);
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(9, 10, 11);
  this.broadcastParameter(Molecule1Sim.en.MASS1);
};

/** Return mass of atom 2
@return {number} mass of atom 2
*/
Molecule1Sim.prototype.getMass2 = function() {
  return this.atom2_.getMass();
};

/** Set mass of atom 2
@param {number} value mass of atom 2
*/
Molecule1Sim.prototype.setMass2 = function(value) {
  this.atom2_.setMass(value);
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(9, 10, 11);
  this.broadcastParameter(Molecule1Sim.en.MASS2);
};

/** Return spring resting length
@return {number} spring resting length
*/
Molecule1Sim.prototype.getSpringRestLength = function() {
  return this.spring_.getRestLength();
};

/** Set spring resting length
@param {number} value spring resting length
*/
Molecule1Sim.prototype.setSpringRestLength = function(value) {
  this.spring_.setRestLength(value);
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(10, 11);
  this.broadcastParameter(Molecule1Sim.en.SPRING_LENGTH);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
Molecule1Sim.prototype.getSpringStiffness = function() {
  return this.spring_.getStiffness();
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
Molecule1Sim.prototype.setSpringStiffness = function(value) {
  this.spring_.setStiffness(value);
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  // discontinuous change in energy
  this.getVarsList().incrSequence(10, 11);
  this.broadcastParameter(Molecule1Sim.en.SPRING_STIFFNESS);
};

/** Return damping
@return {number} damping
*/
Molecule1Sim.prototype.getDamping = function() {
  return this.spring_.getDamping();
};

/** Set damping
@param {number} value damping
*/
Molecule1Sim.prototype.setDamping = function(value) {
  this.spring_.setDamping(value);
  this.broadcastParameter(Molecule1Sim.en.DAMPING);
};

/** Return elasticity
@return {number} elasticity
*/
Molecule1Sim.prototype.getElasticity = function() {
  return this.elasticity_;
};

/** Set elasticity
@param {number} value elasticity
*/
Molecule1Sim.prototype.setElasticity = function(value) {
  this.elasticity_ = value;
  this.broadcastParameter(Molecule1Sim.en.ELASTICITY);
};

/** Set of internationalized strings.
@typedef {{
  X1_POSITION: string,
  Y1_POSITION: string,
  X1_VELOCITY: string,
  Y1_VELOCITY: string,
  X2_POSITION: string,
  Y2_POSITION: string,
  X2_VELOCITY: string,
  Y2_VELOCITY: string,
  DAMPING: string,
  ELASTICITY: string,
  GRAVITY: string,
  MASS1: string,
  MASS2: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string
  }}
*/
Molecule1Sim.i18n_strings;

/**
@type {Molecule1Sim.i18n_strings}
*/
Molecule1Sim.en = {
  X1_POSITION: 'X1 position',
  Y1_POSITION: 'Y1 position',
  X1_VELOCITY: 'X1 velocity',
  Y1_VELOCITY: 'Y1 velocity',
  X2_POSITION: 'X2 position',
  Y2_POSITION: 'Y2 position',
  X2_VELOCITY: 'X2 velocity',
  Y2_VELOCITY: 'Y2 velocity',
  DAMPING: 'damping',
  ELASTICITY: 'elasticity',
  GRAVITY: 'gravity',
  MASS1: 'blue mass',
  MASS2: 'red mass',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness'
};

/**
@private
@type {Molecule1Sim.i18n_strings}
*/
Molecule1Sim.de_strings = {
  X1_POSITION: 'X1 Position',
  Y1_POSITION: 'Y1 Position',
  X1_VELOCITY: 'X1 Geschwindigkeit',
  Y1_VELOCITY: 'Y1 Geschwindigkeit',
  X2_POSITION: 'X2 Position',
  Y2_POSITION: 'Y2 Position',
  X2_VELOCITY: 'X2 Geschwindigkeit',
  Y2_VELOCITY: 'Y2 Geschwindigkeit',
  DAMPING: 'D\u00e4mpfung',
  ELASTICITY: 'Elastizit\u00e4t',
  GRAVITY: 'Gravitation',
  MASS1: 'blaue Masse',
  MASS2: 'rote Masse',
  SPRING_LENGTH: 'Federl\u00e4nge',
  SPRING_STIFFNESS: 'Federsteifheit'
};

/** Set of internationalized strings.
@type {Molecule1Sim.i18n_strings}
*/
Molecule1Sim.i18n = goog.LOCALE === 'de' ? Molecule1Sim.de_strings :
    Molecule1Sim.en;

}); // goog.scope
