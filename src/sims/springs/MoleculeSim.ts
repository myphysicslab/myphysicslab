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
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js'
import { MoleculeCollision, Side } from './MoleculeCollision.js';
import { MutableVector } from '../../lab/util/MutableVector.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { Spring } from '../../lab/model/Spring.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

const TIME = 0;
export const KE = 1;
export const PE = 2;
export const TE = 3;
export const U1X = 4;
export const U1Y = 5;
export const V1X = 6;
export const V1Y = 7;

/** Simulation of a 'molecule' made of 2 or more masses with springs between, moving
freely in 2D, and bouncing against the four walls.

Variables and Parameters
-------------------------

Here is a diagram of two masses showing the definition of the angle `th`:
```text
       m2     .
        \     .
         \ th .
          \   .
           \  .
            \ .
             m1
```

Variables:
```text
U1, U2 = position of center of mass of atom 1 or 2
V1, V2 = velocity of atom 1 or 2
th = angle with vertical (radians); 0 = up; positive is counter clockwise
L = displacement of spring from rest length
F1, F2 = force on atom
```

Parameters:
```text
m1, m2 = masses of atom 1 and 2
R = rest length of spring
k = spring constant
b = damping constant
```

Equations of Motion
-------------------------
For each pair of masses, they experience the following forces from the spring connecting
them (but the damping force occurs only once for each mass).
```text
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
```

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
```text
h = time step
F = force
m = mass
v0 = initial vertical velocity
```
Then we have (using simple calculus; 2 integrations)
```text
v' = F/m
v = (F/m)t + v0
y = (F/2m)t^2 + v0*t
```
Requiring the atom to be below the floor at time h gives the condition
```text
0 > y = (F/2m)h^2 + v0*h
```
Dividing by h gives
```text
0 > F*h/2m + v0
-F*h/2m > v0
```
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

*/
export class MoleculeSim extends AbstractODESim implements Simulation, ODESim, EventHandler, EnergySystem, CollisionSim<MoleculeCollision> {

  /** the atom being dragged, or -1 when no drag is happening */
  private dragAtom_: number = -1;
  private gravity_: number = 0;
  private elasticity_: number = 1.0;
  private damping_: number = 0;
  /** distance tolerance: how close to a wall to be in resting contact */
  private distTol_: number = 0.02;
  /** length of timeStep, used in resting contact calculation */
  private timeStep_: number = 0.03;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  /** Function to paint canvases, for debugging. If defined, this will be called within
  * `moveObjects()` so you can see the simulation state after each
  * time step (you will need to arrange your debugger to pause after
  * each invocation of debugPaint_ to see the state).
  */
  private debugPaint_: null|(()=>void) = null;
  private walls_: PointMass;
  private atoms_: PointMass[] = [];
  private springs_: Spring[] = [];
  /** Function to print collisions, or null to turn off printing collisions. */
  collisionFunction_: null|((c: MoleculeCollision, t: Terminal)=>void) = null;

/**
* @param opt_name name of this as a Subject
*/
constructor(opt_name?: string) {
  super(opt_name);
  // vars: 0   1   2   3   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  U1x U1y V1x V1y U2x U2y V2x V2y
  const var_names = [
      VarsList.en.TIME,
      EnergyInfo.en.KINETIC_ENERGY,
      EnergyInfo.en.POTENTIAL_ENERGY,
      EnergyInfo.en.TOTAL_ENERGY,
  ];
  const i18n_names = [
      VarsList.i18n.TIME,
      EnergyInfo.i18n.KINETIC_ENERGY,
      EnergyInfo.i18n.POTENTIAL_ENERGY,
      EnergyInfo.i18n.TOTAL_ENERGY,
  ];
  // set up variables so that sim.getTime() can be called during setup.
  this.getVarsList().addVariables(var_names, i18n_names);
  // energy variables are computed from other variables.
  this.getVarsList().setComputed(KE, PE, TE);

  this.walls_ = PointMass.makeSquare(12, 'walls');
  this.walls_.setMass(Infinity);
  this.getSimList().add(this.walls_);
  let pn: ParameterNumber;
  this.addParameter(new ParameterNumber(this, MoleculeSim.en.GRAVITY,
      MoleculeSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(pn = new ParameterNumber(this, MoleculeSim.en.DAMPING,
      MoleculeSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)))
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  this.addParameter(pn = new ParameterNumber(this, MoleculeSim.en.ELASTICITY,
      MoleculeSim.i18n.ELASTICITY,
      () => this.getElasticity(), a => this.setElasticity(a)));
  pn.setSignifDigits(3);
  pn.setUpperLimit(1);
  this.addParameter(pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a)));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +'gravity_: '+Util.NF(this.gravity_)
      +', damping: '+Util.NF(this.getDamping())
      +', elasticity_: '+Util.NF(this.elasticity_)
      +', number_of_atoms: '+this.atoms_.length
      +', walls_: '+this.walls_
      +', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'MoleculeSim';
};

/** Adds a {@link PointMass} to the simulation, and gets the initial conditions
* from that atom.
* @param atom the PointMass to add to the simulation
*/
addAtom(atom: PointMass): void {
  if (!this.atoms_.includes(atom)) {
    // create 4 variables in vars array for this atom
    const names = [];
    for (let k=0; k<4; k++) {
      names.push(this.getVarName(atom, k, /*localized=*/false));
    }
    const localNames = [];
    for (let k=0; k<4; k++) {
      localNames.push(this.getVarName(atom, k, /*localized=*/true));
    }
    const idx = this.getVarsList().addVariables(names, localNames);
    this.atoms_.push(atom);
    this.getSimList().add(atom);
  }
  this.initializeFromAtom(atom);
};

/** Adds a {@link Spring} to the simulation.
* @param spring the Spring to add to the simulation
*/
addSpring(spring: Spring) {
  this.springs_.push(spring);
  this.getSimList().add(spring);
};

/** Returns the set of {@link PointMass}'s in the simulation.
*/
getAtoms(): PointMass[] {
  return Array.from(this.atoms_);
};

/** Returns the set of {@link Spring}'s in the simulation.
*/
getSprings(): Spring[] {
  return Array.from(this.springs_);
};

/** Returns the name of the specified variable for the given atom.
@param atom the PointMass of interest
@param index  which variable name is desired: 0 = x-position, 1 = x-velocity,
    2 = y-position, 3 = y-velocity
@param localized whether to return localized variable name
@return the name of the specified variable for the given atom
*/
getVarName(atom: PointMass, index: number, localized: boolean): string {
  let s = atom.getName(localized)+' ';
  switch (index) {
    case 0: s += 'X';
      break;
    case 1: s += 'Y';
      break;
    case 2: s += 'VX';
      break;
    case 3: s += 'VY';
      break;
    default:
      throw '';
  }
  return s;
};

/** Returns the single {@link PointMass} that represents the walls.
* @return the single {@link PointMass} that represents the walls.
*/
getWalls(): PointMass {
  return this.walls_;
};

/** Sets the simulation variables to match the atom's state (by copying the atom's
* position and velocity to the simulation's VarsList).
* @param atom the PointMass to use for updating the simulation variables
*/
initializeFromAtom(atom: PointMass): void {
  let idx = this.atoms_.indexOf(atom);
  if (idx < 0) {
    throw "atom not found: "+atom;
  }
  // vars: 0   1   2   3   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  U1x U1y V1x V1y U2x U2y V2x V2y
  idx = 4*idx;
  const va = this.getVarsList();
  va.setValue(U1X + idx, atom.getPosition().getX());
  va.setValue(U1Y + idx, atom.getPosition().getY());
  va.setValue(V1X + idx, atom.getVelocity().getX());
  va.setValue(V1Y + idx, atom.getVelocity().getY());
  // discontinuous change to energy
  this.getVarsList().incrSequence(KE, PE, TE);
};

/** Sets the single {@link PointMass} that represents the walls.
* @param walls the single {@link PointMass} that represents the walls.
*/
setWalls(walls: PointMass) {
  this.getSimList().remove(this.walls_);
  this.walls_ = walls;
  this.getSimList().add(this.walls_);
};

/** Removes all springs and atoms from the simulation.
*/
cleanSlate(): void {
  // Don't make a new VarsList, because there are various controls and graphs
  // observing the current VarsList.  Instead, resize it for zero bodies.
  // Note this will delete any Variables that have been added to the end
  // of the VarsList.
  const nv = this.getVarsList().numVariables();
  // set time to zero
  this.getVarsList().setValue(TIME, 0);
  if (nv > U1X) {
    // delete all variables except: 0 = time, 1 = KE, 2 = PE, 3 = TE
    this.getVarsList().deleteVariables(U1X, nv - U1X);
  }
  this.getSimList().removeAll(this.atoms_);
  this.atoms_.length = 0;
  this.getSimList().removeAll(this.springs_);
  this.springs_.length = 0;
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  let ke = 0;
  let pe = 0;
  this.springs_.forEach(spr => pe += spr.getPotentialEnergy());
  const bottom = this.walls_.getBoundsWorld().getBottom();
  this.atoms_.forEach(atom => {
    ke += atom.getKineticEnergy();
    // gravity potential = m g (y - floor)
    pe += this.gravity_ * atom.getMass() *
        (atom.getPosition().getY() - (bottom + atom.getHeight()/2));
  });
  return new EnergyInfo(pe + this.potentialOffset_, ke);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number) {
  this.potentialOffset_ = value;
  // discontinuous change in energy
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  this.moveObjects(vars);
  const ei = this.getEnergyInfo();
  va.setValue(KE, ei.getTranslational(), true);
  va.setValue(PE, ei.getPotential(), true);
  va.setValue(TE, ei.getTotalEnergy(), true);
};

/**
@param vars
*/
private moveObjects(vars: number[]) {
  // vars: 0   1   2   3   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  U1x U1y V1x V1y U2x U2y V2x V2y
  this.atoms_.forEach((atom, i) => {
    const idx = 4*i;
    atom.setPosition(new Vector(vars[U1X + idx], vars[U1Y + idx]));
    atom.setVelocity(new Vector(vars[V1X + idx], vars[V1Y + idx]));
  });
  if (this.debugPaint_ != null) {
    this.debugPaint_();
  }
};

/** @inheritDoc */
setDebugPaint(fn: null|(()=>void)): void {
  this.debugPaint_ = fn;
};

/** @inheritDoc */
startDrag(simObject: null|SimObject, _location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  if (simObject instanceof PointMass) {
    this.dragAtom_ = this.atoms_.indexOf(simObject);
    return this.dragAtom_ > -1;
  } else {
    return false;
  }
};

/** @inheritDoc */
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void {
  if (this.dragAtom_ > -1) {
    const atom = this.atoms_[this.dragAtom_];
    if (simObject != atom) {
      return;
    }
    const p = location.subtract(offset);
    let x = p.getX();
    let y = p.getY();
    const w = atom.getWidth()/2;
    const h = atom.getHeight()/2;
    const walls = this.walls_.getBoundsWorld();
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
    // vars: 0   1   2   3   7    8  9   10  11  12  13  14
    //      time KE  PE  TE  U1x U1y V1x V1y U2x U2y V2x V2y
    const va = this.getVarsList();
    const idx = 4*this.dragAtom_;
    va.setValue(U1X + idx, x);
    va.setValue(U1Y + idx, y);
    va.setValue(V1X + idx, 0);
    va.setValue(V1Y + idx, 0);
    // derived energy variables are discontinuous
    va.incrSequence(KE, PE, TE);
    this.moveObjects(va.getValues());
  }
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
  this.dragAtom_ = -1;
  // modify initial conditions, but only when changes happen at time zero
  if (!Util.veryDifferent(this.getTime(), 0)) {
    this.saveInitialState();
  }
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/**
* @param collisions
* @param atom
* @param side which side of the wall colliding with
* @param time
*/
private addCollision(collisions: Collision[], atom: PointMass, side: Side, time: number) {
  const c = new MoleculeCollision(atom, this.walls_, side, time);
  collisions.push(c);
};

/** @inheritDoc */
findCollisions(collisions: MoleculeCollision[], vars: number[], stepSize: number): void {
  this.moveObjects(vars);
  const w = this.walls_.getBoundsWorld();
  this.atoms_.forEach(atom => {
    const a = atom.getBoundsWorld();
    const t = this.getTime()+stepSize;
    if (a.getLeft() < w.getLeft()) {
      this.addCollision(collisions, atom, Side.LEFT, t);
    }
    if (a.getRight() > w.getRight()) {
      this.addCollision(collisions, atom, Side.RIGHT, t);
    }
    if (a.getBottom() < w.getBottom()) {
      this.addCollision(collisions, atom, Side.BOTTOM, t);
    }
    if (a.getTop() > w.getTop()) {
      this.addCollision(collisions, atom, Side.TOP, t);
    }
  });
};

/** @inheritDoc */
handleCollisions(collisions: MoleculeCollision[], opt_totals?: CollisionTotals): boolean {
  // vars: 0   1   2   3   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  U1x U1y V1x V1y U2x U2y V2x V2y
  const va = this.getVarsList();
  const vars = va.getValues();
  collisions.forEach(c => {
    const idx = 4*this.atoms_.indexOf(c.atom);
    switch (c.side) {
      case Side.LEFT:
      case Side.RIGHT:
        c.impulse = c.atom.getMass() * (-1 -this.elasticity_) * vars[V1X+idx];
        va.setValue(V1X+idx, -this.elasticity_ * vars[V1X+idx]);
        break;
      case Side.TOP:
      case Side.BOTTOM:
        c.impulse = c.atom.getMass() * (-1 -this.elasticity_) * vars[V1Y+idx];
        va.setValue(V1Y+idx, -this.elasticity_ * vars[V1Y+idx]);
        break;
      default:
        throw '';
    }
    if (opt_totals) {
      opt_totals.addImpulses(1);
    }
    if (this.collisionFunction_ && this.terminal_) {
      this.collisionFunction_(c, this.terminal_);
    }
  });
  // derived energy variables are discontinuous
  va.incrSequence(KE, PE, TE);
  return true;
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  Util.zeroArray(change);
  this.moveObjects(vars);
  change[TIME] = 1; // time
  const walls = this.walls_.getBoundsWorld();
  // vars: 0   1   2   3   7    8  9   10  11  12  13  14
  //      time KE  PE  TE  U1x U1y V1x V1y U2x U2y V2x V2y
  this.atoms_.forEach((atom, listIdx) => {
    if (this.dragAtom_ == listIdx) {
      return;
    }
    const idx = 4*listIdx;
    const vx = vars[V1X + idx];
    const vy = vars[V1Y + idx];
    change[U1X + idx] = vx; // Ux' = Vx
    change[U1Y + idx] = vy; // Uy' = Vy
    const mass = atom.getMass();
    const bounds = atom.getBoundsWorld();
    // for each spring, get force from spring
    const force = new MutableVector(0, 0);
    this.springs_.forEach(spr => {
      if (spr.getBody1() == atom) {
        force.add(spr.calculateForces()[0].getVector());
      } else if (spr.getBody2() == atom) {
        force.add(spr.calculateForces()[1].getVector());
      }
    });
    // add gravity force
    force.add(new Vector(0, -this.gravity_*mass));
    // add damping force
    const d = new Vector(vx, vy);
    force.add(d.multiply(-this.damping_));

    let ax = force.getX()/mass;
    if (ax<0 && Math.abs(bounds.getLeft()-walls.getLeft())<this.distTol_
        && Math.abs(vx) < -ax*this.timeStep_/(2*mass)) {
      // left wall contact if (leftward force, near left wall, and low velocity)
      ax = 0;
    } else if (ax>0 && Math.abs(bounds.getRight()-walls.getRight()) < this.distTol_
        && Math.abs(vx) < ax*this.timeStep_/(2*mass)) {
      // right wall contact if (rightward force, near right wall, and low velocity)
      ax = 0;
    }
    change[V1X + idx] = ax; // Vx'

    let ay = force.getY()/mass;
    if (ay<0 && Math.abs(bounds.getBottom() - walls.getBottom()) < this.distTol_
        && Math.abs(vy) < -ay*this.timeStep_/(2*mass)) {
      // floor contact if (downward force, near floor, and low velocity)
      ay = 0;
    } else if (ay>0 && Math.abs(bounds.getTop() - walls.getTop()) < this.distTol_
        && Math.abs(vy) < ay*this.timeStep_/(2*mass)) {
      // ceiling contact if (upward force, near ceiling, and low velocity)
      ay = 0;
    }
    change[V1Y + idx] = ay; // Vy'
  });
  return null;
};

/** Return gravity strength.
@return gravity strength
*/
getGravity(): number {
  return this.gravity_;
};

/** Set gravity strength.
@param value gravity strength
*/
setGravity(value: number) {
  this.gravity_ = value;
  // discontinuous change in energy for PE, TE
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(MoleculeSim.en.GRAVITY);
};

/** Return damping
@return damping
*/
getDamping(): number {
  return this.damping_;
};

/** Set damping
@param value damping
*/
setDamping(value: number) {
  this.damping_ = value;
  this.broadcastParameter(MoleculeSim.en.DAMPING);
};

/** Return elasticity
@return elasticity
*/
getElasticity(): number {
  return this.elasticity_;
};

/** Set elasticity
@param value elasticity
*/
setElasticity(value: number) {
  this.elasticity_ = value;
  this.broadcastParameter(MoleculeSim.en.ELASTICITY);
};

/**  Sets a function for  printing  collisions.  The function is called whenever a
collision occurs.  The function takes two variables: a MoleculeCollision and a Terminal.
This can be defined from within the Terminal by the user. Here is an example usage
```js
sim.setCollisionFunction(function(c,t) {
  const s = c.getDetectedTime().toFixed(2)+"\t"
    +c.getImpulse().toFixed(2)+"\t"
    +c.atom.getPosition().getX().toFixed(2)+"\t"
    +c.atom.getPosition().getY().toFixed(2)+"\t"
    +c.atom.getName()+"\t"
    +c.side;
  t.println(s);
})
```
* @param f the function to print collisions,
*   or null to turn off printing collisions
*/
setCollisionFunction(f: null|((c: MoleculeCollision, t: Terminal)=>void)) {
  this.collisionFunction_ = f;
};

static readonly en: i18n_strings = {
  DAMPING: 'damping',
  ELASTICITY: 'elasticity',
  GRAVITY: 'gravity',
};

static readonly de_strings: i18n_strings = {
  DAMPING: 'Dämpfung',
  ELASTICITY: 'Elastizität',
  GRAVITY: 'Gravitation',
};

static readonly i18n = Util.LOCALE === 'de' ? MoleculeSim.de_strings : MoleculeSim.en;

} // end class

type i18n_strings = {
  DAMPING: string,
  ELASTICITY: string,
  GRAVITY: string,
};

Util.defineGlobal('sims$springs$MoleculeSim', MoleculeSim);
