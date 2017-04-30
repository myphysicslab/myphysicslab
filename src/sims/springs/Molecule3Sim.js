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
goog.require('myphysicslab.lab.util.RandomLCG');
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
var MutableVector = myphysicslab.lab.util.MutableVector;
var NF = myphysicslab.lab.util.Util.NF;
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var PointMass = myphysicslab.lab.model.PointMass;
var RandomLCG = myphysicslab.lab.util.RandomLCG;
var Spring = myphysicslab.lab.model.Spring;
var Util = myphysicslab.lab.util.Util;
var VarsList = myphysicslab.lab.model.VarsList;
var Vector = myphysicslab.lab.util.Vector;

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

The variables are stored in the VarsList as follows.  Each atom has four variables,
so the `i`-th atom has variables for position and velocity:

    var[4*i + 0] = Ux
    var[4*i + 1] = Uy
    var[4*i + 2] = Vx
    var[4*i + 3] = Vy

At the end of the VarsList are variables for time and energy.  If there are `n` atoms
these will be at:

    var[4*n + 0] = time
    var[4*n + 1] = KE kinetic energy
    var[4*n + 2] = PE potential energy
    var[4*n + 3] = TE total energy


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


* @param {number} nm number of atoms in molecule, from 2 to 6
* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {AbstractODESim}
* @implements {myphysicslab.lab.model.CollisionSim}
* @implements {EnergySystem}
* @implements {myphysicslab.lab.app.EventHandler}
*/
myphysicslab.sims.springs.Molecule3Sim = function(nm, opt_name) {
  if (nm < 2 || nm > 6) {
    throw new Error('number of atoms '+nm);
  }
  AbstractODESim.call(this, opt_name);
  /** Number of atoms.
  * @type {number}
  * @private
  */
  this.nm_ = nm;
  var va = new VarsList(this.makeVarNames(nm, /*localized=*/false),
      this.makeVarNames(nm, /*localized=*/true), this.getName()+'_VARS');
  this.setVarsList(va);
  // the variables for x- and y- position and velocity are auto computed.
  var cv = goog.array.map(va.toArray(),
      function(v) {
        if (v.getName().match(/^(X|Y)_(POSITION|VELOCITY).*/)) {
          v.setComputed(true);
        }
      });
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
  this.walls_ = PointMass.makeSquare(12, 'walls')
      .setMass(Util.POSITIVE_INFINITY);
  this.getSimList().add(this.walls_);
  /** Mass-Spring-Mass matrix says how springs & masses are connected
  * each row corresponds to a spring, with indices of masses connected to that spring.
  * @type {!Array<!Array<number>>}
  * @private
  */
  this.msm_ = Molecule3Sim.getMSM(nm);
  /** Special Group of springs. These are indices in springs_ array.
  * @type {!Array<number>}
  * @private
  */
  this.sg_ = Molecule3Sim.getSG(nm);
  /** Non-Special Group of springs. These are indices in springs_ array.
  * @type {!Array<number>}
  * @private
  */
  this.nsg_ = Molecule3Sim.getNSG(this.msm_.length, this.sg_);
  /**
  * @type {!Array<!PointMass>}
  * @private
  */
  this.atoms_ = [];
  for (var i=0; i<nm; i++) {
    var atom = PointMass.makeCircle(0.5, 'atom'+(i+1)).setMass(0.5);
    this.atoms_.push(atom);
    this.getSimList().add(atom);
  }
  /**
  * @type {!Array<!Spring>}
  * @private
  */
  this.springs_ = [];
  for (i=0; i<this.msm_.length; i++) {
    var special = goog.array.contains(this.sg_, i);
    var name = (special ? 'special ' : '') + 'spring '+i;
    var spring = new Spring(name,
      this.atoms_[this.msm_[i][0]], Vector.ORIGIN,
      this.atoms_[this.msm_[i][1]], Vector.ORIGIN,
      /*restLength=*/3.0, /*stiffness=*/6.0);
    spring.setDamping(0);
    this.springs_.push(spring);
    this.getSimList().add(spring);
  }
  // vars: 0   1   2   3   4   5   6   7    8  9  10 11
  //      U1x U1y V1x V1y U2x U2y V2x V2y time KE PE TE
  this.initialConfig();
  this.saveInitialState();
  this.modifyObjects();
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.GRAVITY,
      Molecule3Sim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.DAMPING,
      Molecule3Sim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.ELASTICITY,
      Molecule3Sim.i18n.ELASTICITY,
      goog.bind(this.getElasticity, this), goog.bind(this.setElasticity, this))
      .setSignifDigits(3).setUpperLimit(1));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.MASS,
      Molecule3Sim.i18n.MASS,
      goog.bind(this.getMass, this), goog.bind(this.setMass, this)));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.MASS_SPECIAL,
      Molecule3Sim.i18n.MASS_SPECIAL,
      goog.bind(this.getMassSpecial, this), goog.bind(this.setMassSpecial, this)));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.LENGTH,
      Molecule3Sim.i18n.LENGTH,
      goog.bind(this.getLength, this), goog.bind(this.setLength, this)));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.LENGTH_SPECIAL,
      Molecule3Sim.i18n.LENGTH_SPECIAL,
      goog.bind(this.getLengthSpecial, this), goog.bind(this.setLengthSpecial, this)));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.STIFFNESS,
      Molecule3Sim.i18n.STIFFNESS,
      goog.bind(this.getStiffness, this), goog.bind(this.setStiffness, this)));
  this.addParameter(new ParameterNumber(this, Molecule3Sim.en.STIFFNESS_SPECIAL,
      Molecule3Sim.i18n.STIFFNESS_SPECIAL,
      goog.bind(this.getStiffnessSpecial, this),
      goog.bind(this.setStiffnessSpecial, this)));
};

var Molecule3Sim = myphysicslab.sims.springs.Molecule3Sim;
goog.inherits(Molecule3Sim, AbstractODESim);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  Molecule3Sim.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +'gravity_: '+NF(this.gravity_)
        +', damping: '+NF(this.getDamping())
        +', elasticity_: '+NF(this.elasticity_)
        +', number_of_atoms: '+this.nm_
        +', walls_: '+this.walls_
        + Molecule3Sim.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
Molecule3Sim.prototype.getClassName = function() {
  return 'Molecule3Sim';
};

/**
* @param {number} nm
* @return {!Array<string>}
* @param {boolean} localized
* @private
*/
Molecule3Sim.prototype.makeVarNames = function(nm, localized) {
  var names = [];
  var n = nm*4 + 4;
  for (var i=0; i<n; i++) {
    names.push(this.getVariableName(i, localized));
  }
  return names;
};

/**
* @param {number} idx
* @return {string}
* @param {boolean} localized
* @private
*/
Molecule3Sim.prototype.getVariableName = function(idx, localized) {
  if (idx < this.nm_*4) {
    // vars: 0   1   2   3   4   5   6   7   8   9  10  11  ...
    //      U0x U0y V0x V0y U1x U1y V1x V1y U2x U2y V2x V2y ...
    var j = idx%4;
    var atom = 1 + Math.floor(idx/4);
    switch (j) {
      case 0:
        return (localized ? Molecule3Sim.i18n.X_POSITION : Molecule3Sim.en.X_POSITION)
            +' '+atom;
      case 1:
        return (localized ? Molecule3Sim.i18n.Y_POSITION : Molecule3Sim.en.Y_POSITION)
            +' '+atom;
      case 2:
        return (localized ? Molecule3Sim.i18n.X_VELOCITY : Molecule3Sim.en.X_VELOCITY)
            +' '+atom;
      case 3:
        return (localized ? Molecule3Sim.i18n.Y_VELOCITY : Molecule3Sim.en.Y_VELOCITY)
            +' '+atom;
    }
  } else {
    switch (idx - this.nm_*4) {
      case 0:
        return localized ? EnergySystem.i18n.KINETIC_ENERGY :
            EnergySystem.en.KINETIC_ENERGY;
      case 1:
        return localized ? EnergySystem.i18n.POTENTIAL_ENERGY :
            EnergySystem.en.POTENTIAL_ENERGY;
      case 2:
        return localized ? EnergySystem.i18n.TOTAL_ENERGY :
            EnergySystem.en.TOTAL_ENERGY;
      case 3:
        return localized ? VarsList.i18n.TIME :
            VarsList.en.TIME;
    }
  }
  throw new Error();
};

/** Returns Mass-Spring-Mass matrix which says how springs & masses are connected.
* Each row corresponds to a spring; with indices of masses connected to that spring.
* @param {number} nm  number of atoms in molecule
* @return {!Array<!Array<number>>}
* @private
*/
Molecule3Sim.getMSM = function(nm) {
  switch (nm) {
    case 2: return [[0,1]];
    case 3: return [[0,1],[1,2],[2,0]];
    case 4: return [[0,1],[1,2],[2,3],[3,0],[1,3],[0,2]];
    case 5: return [[0,1],[1,2],[2,3],[3,4],[4,0],[4,2],[4,1],
                        [0,3],[1,3],[0,2]];
    case 6: return [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,2],[2,4],
                       [4,0],[1,3],[3,5],[5,1],[0,3],[1,4],[2,5]];
  }
  throw new Error();
};

/** Returns Special Groups of springs, these are indices into msm[].
* @param {number} nm  number of atoms in molecule
* @return {!Array<number>}
* @private
*/
Molecule3Sim.getSG = function(nm) {
  switch (nm) {
    case 2: return [];
    case 3: return [0];
    case 4: return [0,3,5];
    case 5: return [0,4,7,9];
    case 6: return [12,13,14];
  }
  throw new Error();
};

/** Returns Non-Special Groups of springs, these are indices into msm[].
* @param {number} num_springs  number of springs in molecule
* @param {!Array<number>} sg the special group
* @return {!Array<number>}
* @private
*/
Molecule3Sim.getNSG = function(num_springs, sg) {
  var nsg = [];
  for (var i=0; i<num_springs; i++) {
    if (!goog.array.contains(sg, i)) {
      nsg.push(i);
    }
  }
  return nsg;
};

/** Sets initial position of atoms.
* @return {undefined}
* @private
*/
Molecule3Sim.prototype.initialConfig = function()  {
  var vars = this.getVarsList().getValues();
  // vars: 0   1   2   3   4   5   6   7   8   9  10  11
  //      U0x U0y V0x V0y U1x U1y V1x V1y U2x U2y V2x V2y
  // arrange all masses around a circle
  var r = 1.0; // radius
  var random = new RandomLCG();
  var n = this.atoms_.length;
  for (var i=0; i<n; i++) {
    var rnd = 1.0 + 0.1*random.nextFloat();
    vars[0 + i*4] = r * Math.cos(rnd*i*2*Math.PI/n);
    vars[1 + i*4] = r * Math.sin(rnd*i*2*Math.PI/n);
  }
  this.getVarsList().setValues(vars);
  /*  rotating star for 4 masses
  var v = 3;  // velocity
  var l = 2;  // length of springs
  // ball 1 at 90 degrees, vel=(-v,0)
  vars[5] = l;
  vars[6] = -v;
  // ball 2 at -30 degrees
  vars[0 + 2*4] = l*Math.cos(Math.PI/6);
  vars[1 + 2*4] = -l*Math.sin(Math.PI/6);
  vars[2 + 2*4] = v*Math.cos(Math.PI/3);
  vars[3 + 2*4] = v*Math.sin(Math.PI/3);
  vars[0 + 3*4] = -l*Math.cos(Math.PI/6);
  vars[1 + 3*4] = -l*Math.sin(Math.PI/6);
  vars[2 + 3*4] = v*Math.cos(Math.PI/3);
  vars[3 + 3*4] = -v*Math.sin(Math.PI/3);
  */
};

/** @inheritDoc */
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

/** @inheritDoc */
Molecule3Sim.prototype.setPotentialEnergy = function(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @inheritDoc */
Molecule3Sim.prototype.modifyObjects = function() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  var ei = this.getEnergyInfo_(vars);
  var n = this.nm_*4;
  va.setValue(n, ei.getTranslational(), true);
  va.setValue(n+1, ei.getPotential(), true);
  va.setValue(n+2, ei.getTotalEnergy(), true);
};

/**
@param {!Array<number>} vars
@private
*/
Molecule3Sim.prototype.moveObjects = function(vars) {
  // vars: 0   1   2   3   4   5   6   7   8   9  10  11
  //      U0x U0y V0x V0y U1x U1y V1x V1y U2x U2y V2x V2y
  goog.array.forEach(this.atoms_, function(atom, i) {
    var idx = 4*i;
    atom.setPosition(new Vector(vars[idx],  vars[1 + idx]));
    atom.setVelocity(new Vector(vars[2 + idx], vars[3 + idx], 0));
  });
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
};

/** @inheritDoc */
Molecule3Sim.prototype.setDebugPaint = function(fn) {
  this.debugPaint_ = fn;
};

/** @inheritDoc */
Molecule3Sim.prototype.startDrag = function(simObject, location, offset, dragBody,
      mouseEvent) {
  this.dragAtom_ = goog.array.indexOf(this.atoms_, simObject);
  return this.dragAtom_ > -1;
};

/** @inheritDoc */
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
    var va = this.getVarsList();
    var idx = 4*this.dragAtom_;
    va.setValue(idx, x);
    va.setValue(1 + idx, y);
    va.setValue(2 + idx, 0);
    va.setValue(3 + idx, 0);
    // derived energy variables are discontinuous
    var n = this.nm_*4;
    va.incrSequence(n, n+1, n+2);
    this.moveObjects(va.getValues());
  }
};

/** @inheritDoc */
Molecule3Sim.prototype.finishDrag = function(simObject, location, offset) {
  this.dragAtom_ = -1;
};

/** @inheritDoc */
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

/** @inheritDoc */
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

/** @inheritDoc */
Molecule3Sim.prototype.handleCollisions = function(collisions, opt_totals) {
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
  var n = this.nm_*4;
  va.incrSequence(n, n+1, n+2);
  return true;
};

/** @inheritDoc */
Molecule3Sim.prototype.evaluate = function(vars, change, timeStep) {
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[this.nm_*4+3] = 1; // time
  var walls = this.walls_.getBoundsWorld();
  goog.array.forEach(this.atoms_, function(atom, listIdx) {
    if (this.dragAtom_ == listIdx) {
      return;
    }
    var idx = 4*listIdx;
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
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
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

/** Return mass of atoms
@return {number} mass of atoms
*/
Molecule3Sim.prototype.getMass = function() {
  return this.atoms_[1].getMass();
};

/** Set mass of atoms
@param {number} value mass of atoms
*/
Molecule3Sim.prototype.setMass = function(value) {
  goog.array.forEach(this.atoms_, function(atom, idx) {
    if (idx > 0) {
      atom.setMass(value);
    }
  });
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n, n+1, n+2);
  this.broadcastParameter(Molecule3Sim.en.MASS);
};

/** Return mass of special atom
@return {number} mass of special atom
*/
Molecule3Sim.prototype.getMassSpecial = function() {
  return this.atoms_[0].getMass();
};

/** Set mass of special atom
@param {number} value mass of special atom
*/
Molecule3Sim.prototype.setMassSpecial = function(value) {
  this.atoms_[0].setMass(value);
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n, n+1, n+2);
  this.broadcastParameter(Molecule3Sim.en.MASS_SPECIAL);
};

/** Return spring resting length
@return {number} spring resting length
*/
Molecule3Sim.prototype.getLength = function() {
  return this.springs_[this.nsg_[0]].getRestLength();
};

/** Set spring resting length
@param {number} value spring resting length
*/
Molecule3Sim.prototype.setLength = function(value) {
  for (var i=0; i<this.nsg_.length; i++) {
    this.springs_[this.nsg_[i]].setRestLength(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(Molecule3Sim.en.LENGTH);
};

/** Return spring resting length
@return {number} spring resting length
*/
Molecule3Sim.prototype.getLengthSpecial = function() {
  return (this.sg_.length>0) ? this.springs_[this.sg_[0]].getRestLength() : 0.0;
};

/** Set spring resting length
@param {number} value spring resting length
*/
Molecule3Sim.prototype.setLengthSpecial = function(value) {
  for (var i=0; i<this.sg_.length; i++) {
    this.springs_[this.sg_[i]].setRestLength(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(Molecule3Sim.en.LENGTH_SPECIAL);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
Molecule3Sim.prototype.getStiffness = function() {
  return this.springs_[this.nsg_[0]].getStiffness();
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
Molecule3Sim.prototype.setStiffness = function(value) {
  for (var i=0; i<this.nsg_.length; i++) {
    this.springs_[this.nsg_[i]].setStiffness(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(Molecule3Sim.en.STIFFNESS);
};

/** Returns spring stiffness of special group of springs
@return {number} spring stiffness of special group of springs
*/
Molecule3Sim.prototype.getStiffnessSpecial = function() {
  return (this.sg_.length>0) ? this.springs_[this.sg_[0]].getStiffness() : 0.0;
};

/** Sets spring stiffness of special group of springs
@param {number} value spring stiffness of special group of springs
*/
Molecule3Sim.prototype.setStiffnessSpecial = function(value) {
  for (var i=0; i<this.sg_.length; i++) {
    this.springs_[this.sg_[i]].setStiffness(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(Molecule3Sim.en.STIFFNESS_SPECIAL);
};

/** Set of internationalized strings.
@typedef {{
  X_POSITION: string,
  Y_POSITION: string,
  X_VELOCITY: string,
  Y_VELOCITY: string,
  DAMPING: string,
  ELASTICITY: string,
  GRAVITY: string,
  MASS: string,
  MASS_SPECIAL: string,
  LENGTH: string,
  LENGTH_SPECIAL: string,
  STIFFNESS: string,
  STIFFNESS_SPECIAL: string
  }}
*/
Molecule3Sim.i18n_strings;

/**
@type {Molecule3Sim.i18n_strings}
*/
Molecule3Sim.en = {
  X_POSITION: 'X position',
  Y_POSITION: 'Y position',
  X_VELOCITY: 'X velocity',
  Y_VELOCITY: 'Y velocity',
  DAMPING: 'damping',
  ELASTICITY: 'elasticity',
  GRAVITY: 'gravity',
  MASS: 'mass',
  MASS_SPECIAL: 'red mass',
  LENGTH: 'spring length',
  LENGTH_SPECIAL: 'red spring length',
  STIFFNESS: 'spring stiffness',
  STIFFNESS_SPECIAL: 'red spring stiffness'
};

/**
@private
@type {Molecule3Sim.i18n_strings}
*/
Molecule3Sim.de_strings = {
  X_POSITION: 'X Position',
  Y_POSITION: 'Y Position',
  X_VELOCITY: 'X Geschwindigkeit',
  Y_VELOCITY: 'Y Geschwindigkeit',
  DAMPING: 'D\u00e4mpfung',
  ELASTICITY: 'Elastizit\u00e4t',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  MASS_SPECIAL: 'rote Masse',
  LENGTH: 'Federl\u00e4nge',
  LENGTH_SPECIAL: 'rote Federl\u00e4nge',
  STIFFNESS: 'Federsteifheit',
  STIFFNESS_SPECIAL: 'rote Federsteifheit'
};

/** Set of internationalized strings.
@type {Molecule3Sim.i18n_strings}
*/
Molecule3Sim.i18n = goog.LOCALE === 'de' ? Molecule3Sim.de_strings :
    Molecule3Sim.en;

}); // goog.scope
