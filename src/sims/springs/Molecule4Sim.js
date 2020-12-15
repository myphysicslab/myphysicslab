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

goog.module('myphysicslab.sims.springs.Molecule4Sim');

goog.require('goog.array');
goog.require('goog.asserts');

const AbstractODESim = goog.require('myphysicslab.lab.model.AbstractODESim');
const Collision = goog.require('myphysicslab.lab.model.Collision');
const CollisionSim = goog.require('myphysicslab.lab.model.CollisionSim');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const MoleculeCollision = goog.require('myphysicslab.sims.springs.MoleculeCollision');
const MutableVector = goog.require('myphysicslab.lab.util.MutableVector');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const SpringNonLinear = goog.require('myphysicslab.sims.springs.SpringNonLinear');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Simulation of a 'molecule' made of 2 to 6 masses with springs between, moving freely
in 2D, and bouncing against the four walls. This is an experimental version derived
from Molecule3Sim. This uses a non-linear spring force. Note that the spring length
controls will have no effect.

A small subset of the springs and masses are
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
(The following is out of date, see SpringNonLinear for how the spring force is defined.)

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

    var[4*n + 0] = KE kinetic energy
    var[4*n + 1] = PE potential energy
    var[4*n + 2] = TE total energy
    var[4*n + 3] = time

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

* @implements {CollisionSim}
* @implements {EnergySystem}
* @implements {EventHandler}
*/
class Molecule4Sim extends AbstractODESim {
/**
* @param {number} nm number of atoms in molecule, from 2 to 6
* @param {string=} opt_name name of this as a Subject
*/
constructor(nm, opt_name) {
  if (nm < 2 || nm > 6) {
    throw new Error('number of atoms '+nm);
  }
  super(opt_name);
  /** Number of atoms.
  * @type {number}
  * @private
  */
  this.nm_ = nm;
  var va = new VarsList(this.makeVarNames(nm, /*localized=*/false),
      this.makeVarNames(nm, /*localized=*/true), this.getName()+'_VARS');
  this.setVarsList(va);
  // variables other than time and x- and y- position and velocity are auto computed.
  goog.array.map(va.toArray(),
      function(v) {
        if (v.getName().match(/^(X|Y)_(POSITION|VELOCITY).*/)) {
          v.setComputed(false);
          return;
        }
        if (v.getName() == Util.toName(VarsList.en.TIME)) {
          v.setComputed(false);
          return;
        }
        // all other vars are auto computed
        v.setComputed(true);
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
  * @type {!RandomLCG}
  * @private
  */
  this.random_ = new RandomLCG(78597834798);
  /**
  * @type {!PointMass}
  * @private
  */
  this.walls_ = PointMass.makeSquare(16, 'walls')
      .setMass(Util.POSITIVE_INFINITY);
  this.getSimList().add(this.walls_);
  /** Mass-SpringNonLinear-Mass matrix says how springs & masses are connected
  * each row corresponds to a spring, with indices of masses connected to that spring.
  * @type {!Array<!Array<number>>}
  * @private
  */
  this.msm_ = Molecule4Sim.getMSM(nm);
  /** Special Group of springs. These are indices in springs_ array.
  * @type {!Array<number>}
  * @private
  */
  this.sg_ = Molecule4Sim.getSG(nm);
  /** Non-Special Group of springs. These are indices in springs_ array.
  * @type {!Array<number>}
  * @private
  */
  this.nsg_ = Molecule4Sim.getNSG(this.msm_.length, this.sg_);
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
  * @type {!Array<!SpringNonLinear>}
  * @private
  */
  this.springs_ = [];
  for (i=0; i<this.msm_.length; i++) {
    var special = goog.array.contains(this.sg_, i);
    var name = (special ? 'special ' : '') + 'spring '+i;
    var spring = new SpringNonLinear(name,
      this.atoms_[this.msm_[i][0]], Vector.ORIGIN,
      this.atoms_[this.msm_[i][1]], Vector.ORIGIN,
      /*restLength=*/3.0, /*stiffness=*/1.0);
    spring.setDamping(0);
    this.springs_.push(spring);
    this.getSimList().add(spring);
  }
  this.addParameter(new ParameterNumber(this, Molecule4Sim.en.GRAVITY,
      Molecule4Sim.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this)));
  this.addParameter(new ParameterNumber(this, Molecule4Sim.en.DAMPING,
      Molecule4Sim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY));
  this.addParameter(new ParameterNumber(this, Molecule4Sim.en.ELASTICITY,
      Molecule4Sim.i18n.ELASTICITY,
      goog.bind(this.getElasticity, this), goog.bind(this.setElasticity, this))
      .setSignifDigits(3).setUpperLimit(1));
  this.addParameter(new ParameterNumber(this, Molecule4Sim.en.MASS,
      Molecule4Sim.i18n.MASS,
      goog.bind(this.getMass, this), goog.bind(this.setMass, this))
      .setSignifDigits(5));
  this.addParameter(new ParameterNumber(this, Molecule4Sim.en.MASS_SPECIAL,
      Molecule4Sim.i18n.MASS_SPECIAL,
      goog.bind(this.getMassSpecial, this), goog.bind(this.setMassSpecial, this))
      .setSignifDigits(5));
  this.addParameter(new ParameterNumber(this, Molecule4Sim.en.LENGTH,
      Molecule4Sim.i18n.LENGTH,
      goog.bind(this.getLength, this), goog.bind(this.setLength, this)));
  this.addParameter(new ParameterNumber(this, Molecule4Sim.en.LENGTH_SPECIAL,
      Molecule4Sim.i18n.LENGTH_SPECIAL,
      goog.bind(this.getLengthSpecial, this), goog.bind(this.setLengthSpecial, this)));
  this.addParameter(new ParameterNumber(this, Molecule4Sim.en.STIFFNESS,
      Molecule4Sim.i18n.STIFFNESS,
      goog.bind(this.getStiffness, this), goog.bind(this.setStiffness, this)));
  this.addParameter(new ParameterNumber(this, Molecule4Sim.en.STIFFNESS_SPECIAL,
      Molecule4Sim.i18n.STIFFNESS_SPECIAL,
      goog.bind(this.getStiffnessSpecial, this),
      goog.bind(this.setStiffnessSpecial, this)));
  this.addParameter(new ParameterNumber(this, EnergySystem.en.PE_OFFSET,
      EnergySystem.i18n.PE_OFFSET,
      goog.bind(this.getPEOffset, this), goog.bind(this.setPEOffset, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY)
      .setSignifDigits(5));
  // vars: 0   1   2   3   4   5   6   7      4n 4n+1 4n+2 4n+3
  //      U1x U1y V1x V1y U2x U2y V2x V2y ... KE   PE   TE time
  this.initialConfig();
  this.saveInitialState();
  this.modifyObjects();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +'gravity_: '+Util.NF(this.gravity_)
      +', damping: '+Util.NF(this.getDamping())
      +', elasticity_: '+Util.NF(this.elasticity_)
      +', number_of_atoms: '+this.nm_
      +', walls_: '+this.walls_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @override */
getClassName() {
  return 'Molecule4Sim';
};

/**
* @param {number} nm
* @return {!Array<string>}
* @param {boolean} localized
* @private
*/
makeVarNames(nm, localized) {
  var names = [];
  // add energy and force variables, depends on number of atoms
  var n = nm*4 + (this.nm_ > 2 ? 7 : 6);
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
getVariableName(idx, localized) {
  if (idx < this.nm_*4) {
    // vars: 0   1   2   3   4   5   6   7      4n 4n+1 4n+2 4n+3
    //      U1x U1y V1x V1y U2x U2y V2x V2y ... KE   PE   TE time
    var j = idx%4;
    var atom = 1 + Math.floor(idx/4);
    switch (j) {
      case 0:
        return (localized ? Molecule4Sim.i18n.X_POSITION : Molecule4Sim.en.X_POSITION)
            +' '+atom;
      case 1:
        return (localized ? Molecule4Sim.i18n.Y_POSITION : Molecule4Sim.en.Y_POSITION)
            +' '+atom;
      case 2:
        return (localized ? Molecule4Sim.i18n.X_VELOCITY : Molecule4Sim.en.X_VELOCITY)
            +' '+atom;
      case 3:
        return (localized ? Molecule4Sim.i18n.Y_VELOCITY : Molecule4Sim.en.Y_VELOCITY)
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
      case 4:
        return (localized ? Molecule4Sim.i18n.FORCE : Molecule4Sim.en.FORCE) + ' 1';
      case 5:
        return (localized ? Molecule4Sim.i18n.FORCE : Molecule4Sim.en.FORCE) + ' 2';
      case 6:
        return (localized ? Molecule4Sim.i18n.FORCE : Molecule4Sim.en.FORCE) + ' 3';
    }
  }
  throw new Error('unknown variable');
};

/** Returns Mass-SpringNonLinear-Mass matrix which says how springs & masses are connected.
* Each row corresponds to a spring; with indices of masses connected to that spring.
* @param {number} nm  number of atoms in molecule
* @return {!Array<!Array<number>>}
* @private
*/
static getMSM(nm) {
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
static getSG(nm) {
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
static getNSG(num_springs, sg) {
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
initialConfig()  {
  var vars = this.getVarsList().getValues();
  // vars: 0   1   2   3   4   5   6   7      4n 4n+1 4n+2 4n+3
  //      U1x U1y V1x V1y U2x U2y V2x V2y ... KE   PE   TE time
  // arrange all masses around a circle
  var r = 1.0; // radius
  var n = this.atoms_.length;
  for (var i=0; i<n; i++) {
    var rnd = 1.0 + 0.1 * this.random_.nextFloat();
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
getPEOffset() {
  return this.potentialOffset_;
}

/** @override */
setPEOffset(value) {
  this.potentialOffset_ = value;
  // vars: 0   1   2   3   4   5   6   7      4n 4n+1 4n+2 4n+3
  //      U1x U1y V1x V1y U2x U2y V2x V2y ... KE   PE   TE time
  // discontinuous change in energy
  this.getVarsList().incrSequence(4*this.nm_ + 1, 4*this.nm_ + 2);
  this.broadcastParameter(EnergySystem.en.PE_OFFSET);
};

/** @override */
modifyObjects() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  var ei = this.getEnergyInfo_(vars);
  var n = this.nm_*4;
  va.setValue(n, ei.getTranslational(), true);
  va.setValue(n+1, ei.getPotential(), true);
  va.setValue(n+2, ei.getTotalEnergy(), true);
  var rate = new Array(vars.length);
  // find magnitude of force on atom 1
  this.evaluate(vars, rate, 0);
  var m = this.atoms_[0].getMass();
  // F = m a, we have accel, so multiply by mass
  // vars: 0   1   2   3   4   5   6   7      4n 4n+1 4n+2 4n+3
  //      U1x U1y V1x V1y U2x U2y V2x V2y ... KE   PE   TE time
  var fx = m * rate[2];
  var fy = m * rate[3];
  va.setValue(n+4, Math.sqrt(fx*fx + fy*fy), true);
  // force on atom 2
  m = this.atoms_[1].getMass();
  fx = m * rate[6];
  fy = m * rate[7];
  va.setValue(n+5, Math.sqrt(fx*fx + fy*fy), true);
  // force on atom 3
  if (this.nm_ > 2) {
    m = this.atoms_[2].getMass();
    fx = m * rate[10];
    fy = m * rate[11];
    va.setValue(n+6, Math.sqrt(fx*fx + fy*fy), true);
  }
};

/**
@param {!Array<number>} vars
@private
*/
moveObjects(vars) {
  // vars: 0   1   2   3   4   5   6   7      4n 4n+1 4n+2 4n+3
  //      U1x U1y V1x V1y U2x U2y V2x V2y ... KE   PE   TE time
  goog.array.forEach(this.atoms_, function(atom, i) {
    var idx = 4*i;
    atom.setPosition(new Vector(vars[idx],  vars[1 + idx]));
    atom.setVelocity(new Vector(vars[2 + idx], vars[3 + idx], 0));
  });
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
};

/** @override */
setDebugPaint(fn) {
  this.debugPaint_ = fn;
};

/** @override */
startDrag(simObject, location, offset, dragBody, mouseEvent) {
  this.dragAtom_ = goog.array.indexOf(this.atoms_, simObject);
  return this.dragAtom_ > -1;
};

/** @override */
mouseDrag(simObject, location, offset, mouseEvent) {
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
    // set all velocities to zero.
    for (var i=0; i<this.nm_; i++) {
      va.setValue(2 + i*4, 0);
      va.setValue(3 + i*4, 0);
    }
  }
};

/** @override */
finishDrag(simObject, location, offset) {
  this.dragAtom_ = -1;
  // modify initial conditions ONLY when changes happen at time zero
  if (!Util.veryDifferent(this.getTime(), 0)) {
    this.saveInitialState();
  }
};

/** @override */
handleKeyEvent(keyCode, pressed, keyEvent) {
};

/**
* @param {!Array<!myphysicslab.lab.model.Collision>} collisions
* @param {!myphysicslab.lab.model.PointMass} atom
* @param {string} side which side of the wall colliding with
* @param {number} time
* @private
*/
addCollision(collisions, atom, side, time) {
  var c = new MoleculeCollision(atom, this.walls_, side, time);
  collisions.push(c);
};

/** @override */
findCollisions(collisions, vars, stepSize) {
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
handleCollisions(collisions, opt_totals) {
  // vars: 0   1   2   3   4   5   6   7      4n 4n+1 4n+2 4n+3
  //      U1x U1y V1x V1y U2x U2y V2x V2y ... KE   PE   TE time
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

/** @override */
evaluate(vars, change, timeStep) {
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
getGravity() {
  return this.gravity_;
};

/** Set gravity strength.
@param {number} value gravity strength
*/
setGravity(value) {
  this.gravity_ = value;
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(Molecule4Sim.en.GRAVITY);
};

/** Return damping
@return {number} damping
*/
getDamping() {
  return this.damping_;
};

/** Set damping
@param {number} value damping
*/
setDamping(value) {
  this.damping_ = value;
  this.broadcastParameter(Molecule4Sim.en.DAMPING);
};

/** Return elasticity
@return {number} elasticity
*/
getElasticity() {
  return this.elasticity_;
};

/** Set elasticity
@param {number} value elasticity
*/
setElasticity(value) {
  this.elasticity_ = value;
  this.broadcastParameter(Molecule4Sim.en.ELASTICITY);
};

/** Return mass of atoms
@return {number} mass of atoms
*/
getMass() {
  return this.atoms_[1].getMass();
};

/** Set mass of atoms
@param {number} value mass of atoms
*/
setMass(value) {
  goog.array.forEach(this.atoms_, function(atom, idx) {
    if (idx > 0) {
      atom.setMass(value);
    }
  });
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n, n+1, n+2);
  this.broadcastParameter(Molecule4Sim.en.MASS);
};

/** Return mass of special atom
@return {number} mass of special atom
*/
getMassSpecial() {
  return this.atoms_[0].getMass();
};

/** Set mass of special atom
@param {number} value mass of special atom
*/
setMassSpecial(value) {
  this.atoms_[0].setMass(value);
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n, n+1, n+2);
  this.broadcastParameter(Molecule4Sim.en.MASS_SPECIAL);
};

/** Return spring resting length
@return {number} spring resting length
*/
getLength() {
  return this.springs_[this.nsg_[0]].getRestLength();
};

/** Set spring resting length
@param {number} value spring resting length
*/
setLength(value) {
  for (var i=0; i<this.nsg_.length; i++) {
    this.springs_[this.nsg_[i]].setRestLength(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(Molecule4Sim.en.LENGTH);
};

/** Return spring resting length
@return {number} spring resting length
*/
getLengthSpecial() {
  return (this.sg_.length>0) ? this.springs_[this.sg_[0]].getRestLength() : 0.0;
};

/** Set spring resting length
@param {number} value spring resting length
*/
setLengthSpecial(value) {
  for (var i=0; i<this.sg_.length; i++) {
    this.springs_[this.sg_[i]].setRestLength(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(Molecule4Sim.en.LENGTH_SPECIAL);
};

/** Returns spring stiffness
@return {number} spring stiffness
*/
getStiffness() {
  return this.springs_[this.nsg_[0]].getStiffness();
};

/** Sets spring stiffness
@param {number} value spring stiffness
*/
setStiffness(value) {
  for (var i=0; i<this.nsg_.length; i++) {
    this.springs_[this.nsg_[i]].setStiffness(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(Molecule4Sim.en.STIFFNESS);
};

/** Returns spring stiffness of special group of springs
@return {number} spring stiffness of special group of springs
*/
getStiffnessSpecial() {
  return (this.sg_.length>0) ? this.springs_[this.sg_[0]].getStiffness() : 0.0;
};

/** Sets spring stiffness of special group of springs
@param {number} value spring stiffness of special group of springs
*/
setStiffnessSpecial(value) {
  for (var i=0; i<this.sg_.length; i++) {
    this.springs_[this.sg_[i]].setStiffness(value);
  }
  // discontinuous change in energy
  // vars[n] = KE, vars[n+1] = PE, vars[n+2] = TE
  var n = this.nm_*4;
  this.getVarsList().incrSequence(n+1, n+2);
  this.broadcastParameter(Molecule4Sim.en.STIFFNESS_SPECIAL);
};

} // end class

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
  STIFFNESS_SPECIAL: string,
  FORCE: string
  }}
*/
Molecule4Sim.i18n_strings;

/**
@type {Molecule4Sim.i18n_strings}
*/
Molecule4Sim.en = {
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
  STIFFNESS_SPECIAL: 'red spring stiffness',
  FORCE: 'force'
};

/**
@private
@type {Molecule4Sim.i18n_strings}
*/
Molecule4Sim.de_strings = {
  X_POSITION: 'X Position',
  Y_POSITION: 'Y Position',
  X_VELOCITY: 'X Geschwindigkeit',
  Y_VELOCITY: 'Y Geschwindigkeit',
  DAMPING: 'Dämpfung',
  ELASTICITY: 'Elastizität',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  MASS_SPECIAL: 'rote Masse',
  LENGTH: 'Federlänge',
  LENGTH_SPECIAL: 'rote Federlänge',
  STIFFNESS: 'Federsteifheit',
  STIFFNESS_SPECIAL: 'rote Federsteifheit',
  FORCE: 'Kraft'
};

/** Set of internationalized strings.
@type {Molecule4Sim.i18n_strings}
*/
Molecule4Sim.i18n = goog.LOCALE === 'de' ? Molecule4Sim.de_strings :
    Molecule4Sim.en;

exports = Molecule4Sim;
