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

import { AbstractSubject } from '../util/AbstractSubject.js';
import { FunctionVariable } from '../model/FunctionVariable.js';
import { ConcreteLine } from '../model/ConcreteLine.js';
import { DampingLaw } from '../model/DampingLaw.js';
import { DoubleRect } from '../util/DoubleRect.js';
import { EnergySystem, EnergyInfo } from '../model/EnergySystem.js';
import { Force } from '../model/Force.js';
import { ForceLaw } from '../model/ForceLaw.js';
import { GenericEvent, ParameterBoolean, ParameterNumber, ParameterString, Subject }    from '../util/Observe.js';
import { GravityLaw } from '../model/GravityLaw.js';
import { ODESim } from '../model/ODESim.js';
import { PointMass } from '../model/PointMass.js';
import { RigidBody, RB } from './RigidBody.js';
import { Scrim } from './Scrim.js';
import { SimList } from '../model/SimList.js';
import { Simulation } from '../model/Simulation.js';
import { Terminal } from '../util/Terminal.js';
import { Util } from '../util/Util.js';
import { UtilEngine, DebugEngine2D } from './UtilEngine.js';
import { VarsList } from '../model/VarsList.js';
import { Vector, GenericVector } from '../util/Vector.js';

const TIME = 0;
const KE = 1;
const PE = 2;
const TE = 3;

/** Simulation of rigid body movement with external forces like gravity or springs, but
no collisions or contact forces. RigidBodys will pass thru each other unless you use the
{@link lab/engine2D/ImpulseSim.ImpulseSim | ImpulseSim} or
{@link lab/engine2D/ContactSim.ContactSim | ContactSim} sub-class.

The AdvanceStrategy tells the DiffEqSolver to advance the simulation. The DiffEqSolver
advances the simulation by calling {@link evaluate} to calculate rates of
change in each of the simulation variables. The DiffEqSolver then uses an algorithm like
Runge-Kutta to integrate forward over a small time step to reach the new simulation
state. Within `evaluate()`, the forces operate by modifying the rate of change of each
variable.

More information:

+ [2D Physics Engine Overview](../Engine2D.html)

+ The math and physics underlying
    [RigidBodySim](https://www.myphysicslab.com/engine2D/rigid-body-en.html),
    [ImpulseSim](https://www.myphysicslab.com/engine2D/collision-en.html) and
    [ContactSim](https://www.myphysicslab.com/engine2D/contact-en.html) are
    described on the myPhysicsLab website.

### Parameters Created

+ ParameterBoolean named `SHOW_FORCES`, see {@link setShowForces}

### Events Broadcast
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `ELASTICITY_SET`, see {@link setElasticity}.

### RigidBodys

RigidBodySim maintains a list of {@link RigidBody}'s which are
currently part of the simulation. RigidBodys can be added or removed while the
simulation is running. Each RigidBody is added to the SimList (or
removed when the RigidBody is removed).

### ForceLaws

RigidBodySim maintains a list of {@link ForceLaw}'s which are each
given an opportunity to apply their force to RigidBodys during `evaluate()`. Some
ForceLaws such as {@link lab/model/GravityLaw.GravityLaw | GravityLaw} and
{@link lab/model/DampingLaw.DampingLaw | DampingLaw} are set up so that they observe
the SimList and can therefore apply their force to every RigidBody.

### Variables

Variables are stored in a {@link VarsList}. Each RigidBody gets
a set of six contiguous variables that describe its current position, angle, and
velocity. The variables are laid out as follows:

0. `x`  horizontal world coords position of center of mass
1. `x'`  horizontal velocity of center of mass.  AKA `vx`
2. `y`  vertical world coords position of center of mass
3. `y'`  vertical velocity of center of mass.  AKA `vy`
4. `w` angle of rotation from body coordinates in radians with positive rotation
being counter-clockwise. Called `w`, because `w` looks like the greek letter &omega;
(omega) which is often used for angles in math.
5. `w'`  angular velocity.  AKA `vw`.

The starting index of a RigidBody's variables is given by 
{@link RigidBody.getVarsIndex}. To find a particular variable,
add the appropriate offset from the enum {@link RB}. For
example, to find the angular velocity of a RigidBody:
```js
const idx = body.getVarsIndex();
return vars[idx + RB.VW_];
```
Variables at the beginning of the VarsList:

+ time
+ kinetic energy
+ potential energy
+ total energy

The set of RigidBodys can change over time via {@link addBody} and
{@link removeBody}.
Therefore the set of variables can change accordingly. Removing a RigidBody results in
its 6 variables each being marked with the reserved name `deleted` and those slots in
the VarsList are then available for later reuse. Adding a RigidBody either extends the
length of the VarsList or reuses some previously deleted slots of variables. But the 6
variables allocated for a RigidBody are guaranteed to be contiguous.

{@link lab/model/FunctionVariable.FunctionVariable | FunctionVariables} can be added to
a VarsList. Their position in the VarsList remains constant after they are allocated.
*/
export class RigidBodySim extends AbstractSubject implements Subject, Simulation, ODESim, EnergySystem, DebugEngine2D {
  /** The RigidBodys in this simulation. */
  protected bods_: RigidBody[] = [];
  /** Whether to add Forces to the SimList so they can be seen. */
  protected showForces_: boolean = false;
  /** The ForceLaws in this simulation. */
  protected forceLaws_: ForceLaw[] = [];
  /** Suggested size for the SimView.  This is mainly for tests to communicate
  * with TestViewerApp.
  */
  protected simRect_: null|DoubleRect = null;
  /** The SimList holds SimObjects so they can be made visible. */
  protected simList_: SimList = new SimList();
  /** The [variables](./lab_engine2D_RigidBodySim.RigidBodySim.html#md:variables)
  * that determine the state of the simulation; there are six variables
  * for each RigidBody, plus some others for time, energy, etc.
  */
  protected varsList_: VarsList;
  private initialState_: number[]|null = null;
  /** While stepping forward in time, stores the previous values of the simulation
  * state variables, so that we can back up in time if a collision is encountered.
  */
  private recentState_: number[]|null = null;
  /** potential energy offset */
  private potentialOffset_: number = 0;
  protected terminal_: null|Terminal = null;

/**
* @param opt_name name of this Subject
*/
constructor(opt_name?: string) {
  super(opt_name || 'SIM');
  const var_names = [
      VarsList.en.TIME,
      EnergyInfo.en.KINETIC_ENERGY,
      EnergyInfo.en.POTENTIAL_ENERGY,
      EnergyInfo.en.TOTAL_ENERGY
  ];
  const i18n_names = [
      VarsList.i18n.TIME,
      EnergyInfo.i18n.KINETIC_ENERGY,
      EnergyInfo.i18n.POTENTIAL_ENERGY,
      EnergyInfo.i18n.TOTAL_ENERGY
  ];
  this.varsList_ = new VarsList(var_names, i18n_names, this.getName()+'_VARS');
  this.getVarsList().setComputed(KE, PE, TE);
  UtilEngine.debugEngine2D = this;
  this.addParameter(new ParameterBoolean(this, RigidBodySim.en.SHOW_FORCES,
      RigidBodySim.i18n.SHOW_FORCES,
      () => this.getShowForces(), a => this.setShowForces(a)));
  let pn = new ParameterNumber(this, EnergyInfo.en.PE_OFFSET,
      EnergyInfo.i18n.PE_OFFSET,
      () => this.getPEOffset(), a => this.setPEOffset(a));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  pn.setSignifDigits(5);
  this.addParameter(pn);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1) + this.toString_();
};

protected toString_(): string {
  return ', showForces_: '+this.showForces_
      + ', potentialOffset_: '+Util.NF(this.potentialOffset_)
      + ', varsList_: '+ this.varsList_.toStringShort()
      + ', forceLaws_: ['
      + this.forceLaws_.map(f => f.toStringShort())
      + '], bods_: ['
      + this.bods_.map(b => b.toStringShort())
      + ']'
      + super.toString();
};

/** @inheritDoc */
override toStringShort(): string {
  return super.toStringShort().slice(0, -1)
      +', bods_.length: ' + this.bods_.length + '}';
};

/** @inheritDoc */
getClassName(): string {
  return 'RigidBodySim';
};

/** @inheritDoc */
getSimList(): SimList {
  return this.simList_;
};

/** @inheritDoc */
getVarsList(): VarsList {
  return this.varsList_;
};

/** @inheritDoc */
getTime(): number {
  return this.varsList_.getTime();
};

/** Whether to add Forces to the SimList so they can be seen.
* @return whether to add Forces to the SimList so they can be seen
*/
getShowForces(): boolean {
  return this.showForces_;
};

/** Sets whether to add Forces to the SimList so they can be seen.
* @param value whether to add Forces to the SimList so they can be seen
*/
setShowForces(value: boolean): void {
  this.showForces_ = value;
  this.broadcastParameter(RigidBodySim.en.SHOW_FORCES);
};

/** Returns the suggested size for the SimView. This is mainly for tests to communicate
* with {@link test/TestViewerApp.TestViewerApp}.
* @return suggested size for the SimView
*/
getSimRect(): null|DoubleRect {
  return this.simRect_;
};

/** Sets the suggested size for the SimView. This is mainly for tests to communicate
* with {@link test/TestViewerApp.TestViewerApp}.
* @param rect the suggested size for the SimView
*/
setSimRect(rect: null|DoubleRect): void {
  this.simRect_ = rect;
};

/** Returns string showing current variables of each RigidBody, for debugging.
@return string showing current variables of each RigidBody, for debugging.
*/
formatVars(): string {
  const v = this.varsList_.getValues(/*computed=*/true);
  return this.bods_.reduce((str, b) =>
      str + (str != '' ? '\n' : '') + UtilEngine.formatArray(v, b.getVarsIndex(), 6)
      , '');
};

/** @inheritDoc */
reset(): void {
  if (this.initialState_ != null &&
      this.initialState_.length == this.varsList_.numVariables()) {
    this.varsList_.setValues(this.initialState_);
  }
  this.bods_.forEach(b => b.eraseOldCoords());
  this.getSimList().removeTemporary(Infinity);
  this.modifyObjects();
  this.broadcast(new GenericEvent(this, 'RESET'));
};

/** @inheritDoc */
saveInitialState(): void {
  this.initialState_ = this.varsList_.getValues();
  this.broadcast(new GenericEvent(this, 'INITIAL_STATE_SAVED'));
};

/** Removes all RigidBodys, ForceLaws, most Variables, and clears the SimList. This is
used in applications to build a new configuration of RigidBodys. This should give
essentially the same state that you would get from making a new RigidBodySim, except
for parameters (like gravity) that may have been changed.

The alternative is to create a new RigidBodySim; that would be 'cleaner' but then you
must unhook the old RigidBodySim from all the various user controls and graph and such,
and hook up the new one.
*/
cleanSlate(): void {
  this.getSimList().clear();
  // clear force laws AFTER simList, so that forceLaw hears the remove events
  // (in case we re-use the forceLaw later on)
  this.clearForceLaws();
  // Don't make a new VarsList, because there are various controls and graphs
  // observing the current VarsList.  Instead, resize it for zero bodies.
  // Note this will delete any Variables that have been added to the end
  // of the VarsList.
  const nv = this.varsList_.numVariables();
  if (nv > 4) {
    // delete all variables except: 0 = time, 1 = KE, 2 = PE, 3 = TE
    this.varsList_.deleteVariables(4, nv - 4);
  }
  this.varsList_.setTime(0);
  // For safety, erase any varsIndex info in the bodies that are being removed,
  // even though those bodies are about to be deleted.
  this.bods_.forEach(b => b.setVarsIndex(-1));
  this.bods_ = [];
  this.simRect_ = null;
  this.potentialOffset_ = 0;
};

/** @inheritDoc */
saveState(): void {
  this.recentState_ = this.varsList_.getValues();
  this.bods_.forEach(b => b.saveOldCoords());
};

/** @inheritDoc */
restoreState(): void {
  if (this.recentState_ != null) {
    this.varsList_.setValues(this.recentState_, /*continuous=*/true);
  }
  this.bods_.forEach(b => b.eraseOldCoords());
};

/** Add the RigidBody to the simulation and SimList, and add a set of 6 variables for
the RigidBody to the VarsList.

Using {@link FunctionVariable}'s ensures that the variables on the VarsList have
the same values as the RigidBody's (because the FunctionVariables retrieve and
store their values in the RigidBody's).  There is no need for a separate step to
coordinate between the VarsList and the RigidBody's, they are automatically
in sync.

@param body  RigidBody to add to the simulation
*/
addBody(body: RigidBody): void {
  if (body instanceof Scrim)
    return;
  if (!this.bods_.includes(body)) {
    // create 6 variables in vars array for this body
    const idx = this.varsList_.addVariable(
      new FunctionVariable(this.varsList_,
      body.getVarName(RB.X_, /*localized=*/false),
      body.getVarName(RB.X_, /*localized=*/true),
      () => body.getPosition().getX(),
      x => body.setPositionX(x)));
    this.varsList_.addVariable(
      new FunctionVariable(this.varsList_,
      body.getVarName(RB.VX_, /*localized=*/false),
      body.getVarName(RB.VX_, /*localized=*/true),
      () => body.getVelocity().getX(),
      x => body.setVelocityX(x)));
    this.varsList_.addVariable(
      new FunctionVariable(this.varsList_,
      body.getVarName(RB.Y_, /*localized=*/false),
      body.getVarName(RB.Y_, /*localized=*/true),
      () => body.getPosition().getY(),
      y => body.setPositionY(y)));
    this.varsList_.addVariable(
      new FunctionVariable(this.varsList_,
      body.getVarName(RB.VY_, /*localized=*/false),
      body.getVarName(RB.VY_, /*localized=*/true),
      () => body.getVelocity().getY(),
      y => body.setVelocityY(y)));
    this.varsList_.addVariable(
      new FunctionVariable(this.varsList_,
      body.getVarName(RB.W_, /*localized=*/false),
      body.getVarName(RB.W_, /*localized=*/true),
      () => body.getAngle(),
      a => body.setAngle(a)));
    this.varsList_.addVariable(
      new FunctionVariable(this.varsList_,
      body.getVarName(RB.VW_, /*localized=*/false),
      body.getVarName(RB.VW_, /*localized=*/true),
      () => body.getAngularVelocity(),
      a => body.setAngularVelocity(a)));
    body.setVarsIndex(idx);
    // add body to end of list of bodies
    this.bods_.push(body);
    this.getSimList().add(body);
  }
  this.bods_.forEach(b => b.eraseOldCoords());
};

/** Removes the RigidBody from the simulation and SimList, and removes the corresponding
variables from the VarsList.
@param body RigidBody to remove from the simulation
*/
removeBody(body: RigidBody): void {
  if (this.bods_.includes(body)) {
    this.varsList_.deleteVariables(body.getVarsIndex(), 6);
    Util.remove(this.bods_, body);
    body.setVarsIndex(-1);
  }
  this.getSimList().remove(body);
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(KE, PE, TE);
};

/** Returns the list of RigidBodys in this simulation.
@return list of RigidBodys in this RigidBodySim.
*/
getBodies(): RigidBody[] {
  return Array.from(this.bods_);
};

/** Returns a RigidBody in this simulation by specifying its name or index in the list
* of RigidBodys.
* @param numOrName index in list of RigidBodys or name of the RigidBody
*    (either the English or language-independent version of the name)
* @return the RigidBody with the given name or at
*    the given position in the list of RigidBodys
* @throws if requesting a non-existing body.
*/
getBody(numOrName: number|string): RigidBody {
  let bod: RigidBody|undefined;
  if (typeof numOrName === 'string') {
    const bodName = Util.toName(numOrName);
    bod = this.bods_.find(body => body.getName() == bodName);
  } else {
    const bodNum = numOrName;
    if (bodNum < this.bods_.length && bodNum >= 0) {
      bod = this.bods_[bodNum];
    }
  }
  if (bod === undefined)
    throw 'no body '+numOrName;
  return bod;
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.varsList_;
  // update the variables that track energy
  const einfo = this.getEnergyInfo();
  va.setValue(KE, einfo.getTranslational() + einfo.getRotational(), true);
  va.setValue(PE, einfo.getPotential(), true);
  va.setValue(TE, einfo.getTotalEnergy(), true);
};

/** Adds the ForceLaw to the list of ForceLaws operating in this simulation, if it is
not already on the list.
@param forceLaw the ForceLaw to add
@throws if adding a second DampingLaw or GravityLaw
*/
addForceLaw(forceLaw: ForceLaw) {
  // It is a rather common problem to add DampingLaw or GravityLaw twice.
  // When you don't realize you did it, you then get twice the amount of damping
  // or gravity, and it can be difficult to understand why.  Therefore we
  // throw an error when we detect this case.
  // Find a ForceLaw of the same type as the forceLaw passed in.
  const sameLaw = this.forceLaws_.find(f => {
    if (forceLaw instanceof DampingLaw) {
      return f instanceof DampingLaw;
    } else if (forceLaw instanceof GravityLaw) {
      return f instanceof GravityLaw;
    } else {
      return false;
    }
  });
  if (sameLaw !== undefined) {
    throw 'cannot add DampingLaw or GravityLaw twice '+sameLaw;
  }
  if (!this.forceLaws_.includes(forceLaw)) {
    this.forceLaws_.push(forceLaw);
  }
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(KE, PE, TE);
};

/** Removes the ForceLaw from the list of ForceLaws operating in this simulation.
* @param forceLaw the ForceLaw to remove
* @return whether the ForceLaw was removed
*/
removeForceLaw(forceLaw: ForceLaw): boolean {
  forceLaw.disconnect();
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(KE, PE, TE);
  return Util.remove(this.forceLaws_, forceLaw);
};

/** Clears the list of ForceLaws operating in this simulation.
*/
clearForceLaws(): void {
  Util.forEachRight(this.forceLaws_, fl => this.removeForceLaw(fl));
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(KE, PE, TE);
};

/** Returns the list of ForceLaws operating in this simulation.
* @return list of ForceLaws operating in this simulation
*/
getForceLaws(): ForceLaw[] {
  return Array.from(this.forceLaws_);
};

/** @inheritDoc */
getEnergyInfo(): EnergyInfo {
  let pe = 0;
  let re = 0;
  let te = 0;
  this.bods_.forEach(b => {
    if (isFinite(b.getMass())) {
      re += b.rotationalEnergy();
      te += b.translationalEnergy();
    }
  });
  this.forceLaws_.forEach(fl => pe += fl.getPotentialEnergy());
  return new EnergyInfo(pe + this.potentialOffset_, te, re);
};

/** @inheritDoc */
getPEOffset(): number {
  return this.potentialOffset_;
}

/** @inheritDoc */
setPEOffset(value: number): void {
  this.potentialOffset_ = value;
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(EnergyInfo.en.PE_OFFSET);
};

/** @inheritDoc */
setTerminal(terminal: Terminal|null): void {
  this.terminal_ = terminal;
}

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  // varsList_.setValues ensures that rigid body objects know their current state
  this.varsList_.setValues(vars, /*continuous=*/true);
  this.bods_.forEach(body => {
    const idx = body.getVarsIndex();
    if (idx < 0)
      return;
    const mass = body.getMass();
    if (mass == Infinity) {
      for (let k=0; k<6; k++) {
        change[idx + k] = 0;  // infinite mass objects don't move
      }
    } else {
      change[idx + RB.X_] = vars[idx + RB.VX_];
      change[idx + RB.Y_] = vars[idx + RB.VY_];
      change[idx + RB.W_] = vars[idx + RB.VW_];
      change[idx + RB.VX_] = 0;
      change[idx + RB.VY_] = 0;
      change[idx + RB.VW_] = 0;
    }
  });
  this.forceLaws_.forEach(fl => {
    const forces = fl.calculateForces();
    forces.forEach(f => this.applyForce(change, f));
  });
  change[TIME] = 1; // time variable
  return null;
};

/** Applies the Force by modifying the array representing rate of change of each
* variable.  The Force specifies which RigidBody it works on so we can figure out
* which variable rates to modify.  If {@link showForces_} is `true`, adds the Force
* to the SimList with an immediate expiration time.
* @param change vector of rigid body accelerations
* @param force the Force to be applied
*/
protected applyForce(change: number[], force: Force): void {
  const body = force.getBody() as RigidBody;
  if (!this.bods_.includes(body)) {
    return;
  }
  const idx = body.getVarsIndex();
  if (idx < 0) {
    return;
  }
  const forceDir = force.getVector();
  const forceLoc = force.getStartPoint();
  const mass = body.getMass();
  change[idx + RB.VX_] += forceDir.getX() / mass;
  change[idx + RB.VY_] += forceDir.getY() / mass;
  // w'' = R x F / I
  const rx = forceLoc.getX() - body.getPosition().getX();
  const ry = forceLoc.getY() - body.getPosition().getY();
  change[idx + RB.VW_] += (rx * forceDir.getY() - ry * forceDir.getX())/
      body.momentAboutCM();
  const torque = force.getTorque();
  if (torque != 0) {
    change[idx + RB.VW_] += torque/body.momentAboutCM();
  }
  if (this.showForces_) {
    force.setExpireTime(this.getTime());
    this.getSimList().add(force);
  }
};

/** @inheritDoc */
debugLine(name: string, pa: Vector, pb: Vector, expireTime?: number): void {
  expireTime = expireTime ?? this.getTime();
  const v = new ConcreteLine(name, pa, pb);
  v.setExpireTime(expireTime);
  this.getSimList().add(v);
};

/** @inheritDoc */
debugCircle(name: string, center: GenericVector, radius: number, expireTime?: number): void {
  // when debugging, set expireTime = this.getTime() to have collisions
  // disappear after each step.
  expireTime = expireTime ?? this.getTime() + 0.05;
  const width = Math.max(0.02, Math.abs(2*radius));
  const m = PointMass.makeCircle(width, name);
  m.setMass(0);
  m.setPosition(center);
  m.setExpireTime(expireTime);
  this.getSimList().add(m);
};

/** @inheritDoc */
myPrint(message: string, ...colors: string[]): void {
  if (!Util.DEBUG)
    return;
  // console will replace each %c in the string with the colors given
  // example:
  // console.log("%capple %cavocado", 'color:red', 'color:green')
  // we are adding the additional passed-in color arguments
  // after our default string that shows time in blue, message in black.
  let args: string[] = ['%c'+Util.NF7(this.getTime())+'%c '+message,
      'color:blue', 'color:black'];
  if (colors.length > 0) {
    args = args.concat(colors);
  }
  console.log.apply(console, args);
};

/** Sets the elasticity of all RigidBodys to this value. Elasticity is used when
calculating collisions; a value of 1.0 means perfectly elastic where the kinetic energy
after collision is the same as before (extremely bouncy), while a value of 0 means no
elasticity (no bounce).

Broadcasts a 'ELASTICITY_SET' event.
See {@link RigidBody.setElasticity}.
@param value elasticity to set on all RigidBodys, a number from 0 to 1.
@throws if there are no RigidBodys
*/
setElasticity(value: number): void {
  if (this.bods_.length == 0) {
    throw 'setElasticity: no bodies';
  }
  this.bods_.forEach(body => body.setElasticity(value));
  this.broadcast(new GenericEvent(this, RigidBodySim.ELASTICITY_SET, value));
};

/** Name of event broadcast from {@link setElasticity}. */
static ELASTICITY_SET = 'ELASTICITY_SET';

static readonly en: i18n_strings = {
  COLLISION_HANDLING: 'collision method',
  COLLISION_ACCURACY: 'collision accuracy',
  DISTANCE_TOL: 'distance tolerance',
  EXTRA_ACCEL: 'extra accel',
  RANDOM_SEED: 'random seed',
  SHOW_FORCES: 'show forces',
  SHOW_COLLISIONS: 'show collisions',
  VELOCITY_TOL: 'velocity tolerance'
};

static readonly de_strings: i18n_strings = {
  COLLISION_HANDLING: 'Kollisionsmethode',
  COLLISION_ACCURACY: 'Kollisionsgenauigkeit',
  DISTANCE_TOL: 'Distanztoleranz',
  EXTRA_ACCEL: 'extra Beschleunigung',
  RANDOM_SEED: 'Zufallskern',
  SHOW_FORCES: 'Kräfte anzeigen',
  SHOW_COLLISIONS: 'Kollisionen anzeigen',
  VELOCITY_TOL: 'Geschwindigkeitstoleranz'
};

static readonly i18n = Util.LOCALE === 'de' ? RigidBodySim.de_strings : RigidBodySim.en;

} // end RigidBodySim class

type i18n_strings = {
  COLLISION_HANDLING: string,
  COLLISION_ACCURACY: string,
  DISTANCE_TOL: string,
  EXTRA_ACCEL: string,
  RANDOM_SEED: string,
  SHOW_FORCES: string,
  SHOW_COLLISIONS: string,
  VELOCITY_TOL: string
};

Util.defineGlobal('lab$engine2D$RigidBodySim', RigidBodySim);
