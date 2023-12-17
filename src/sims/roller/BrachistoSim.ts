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
import { EventHandler, ModifierKeys } from '../../lab/app/EventHandler.js';
import { GenericEvent } from '../../lab/util/Observe.js';
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';
import { PathPoint } from '../../lab/model/PathPoint.js';
import { PointMass, ShapeType } from '../../lab/model/PointMass.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { Util } from '../../lab/util/Util.js';
import { Variable } from '../../lab/model/Variable.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';
import { Simulation } from '../../lab/model/Simulation.js';

const TIME = 0;
const P0 = 1;
const V0 = 2;
const X0 = 3;
const Y0 = 4;

/** The Brachistochrone is a classic problem about finding the path
between two points where a ball will travel fastest (without friction). From greek:
brachistos (shortest) and chronos (time).

The equations of motion are the same as those of
{@link sims/roller/RollerSingleSim.RollerSingleSim}.
For derivation equations of motion see <https://www.myphysicslab.com/RollerSimple.html>
and <https://www.myphysicslab.com/RollerSpring.html>.

Variables Array
--------------------

The variables are stored in the VarsList as follows
```text
vars[0] time
vars[1] position ball 0
vars[2] velocity ball 0
vars[3] x-position ball 0 (derived from vars[1] and path)
vars[4] y-position ball 0 (derived from vars[1] and path)
vars[5] position ball 1
vars[6] velocity ball 1
vars[7] x-position ball 1 (derived from vars[5] and path)
vars[8] y-position ball 1 (derived from vars[5] and path)
etc.
```

**TO DO**  Graph is not very useful now.  More useful would be to show each ball with
  a different color, and show y position vs. time.  Perhaps name variables after the
  associated path.  Or number the various paths and draw numbers on the balls.

**TO DO**  Puzzle:  if you turn off the repeat time and just let it run, the circle
  ball is ahead of the brachistochrone. Because it is a shorter path? But all the balls
  reach the same height at the same moment on the first repetition. After that they are
  no longer in sync. Why?

**TO DO**  Don't put the x-position and y-position in the vars[] array;  instead
  calculate these in getVariable().  See RollerFlightSim for an example.

**TO DO** could make an array of PathPoint, to avoid creating them so often.

*/
export class BrachistoSim extends AbstractODESim implements Simulation, ODESim, EventHandler {

  /** keep track of our SimObjects so that we can erase them */
  private simObjects_: SimObject[] = [];
  private damping_: number = 0;
  private gravity_: number = 2.0;
  private mass_: number = 1.0;
  /** Which path was chosen by user, or -1 if no path chosen. */
  private choice_: number = -1;
  private balls_: (PointMass|undefined)[];
  private paths_: NumericalPath[];

/**
* @param paths the set of paths to show
* @param opt_name name of this as a Subject
* @param opt_simList optional SimList where SimObjects should be stored
*/
constructor(paths: ParametricPath[], opt_name?: string, opt_simList?: SimList) {
  super(opt_name, opt_simList);
  const plen = paths.length;
  this.balls_ = new Array(plen);
  this.paths_ = new Array(plen);
  for (let i=0; i<plen; i++) {
    this.paths_[i] = new NumericalPath(paths[i]);
    this.getSimList().add(this.paths_[i]);
  }
  this.setVarsList(new VarsList(
      BrachistoSim.makeVarNames(paths, /*localized=*/false),
      BrachistoSim.makeVarNames(paths, /*localized=*/true),
      this.getName()+'_VARS'));
  // the variables for x- and y- position and velocity are auto computed.
  const cv = this.getVarsList().toArray().map(
      (v: Variable) => {
        const j = 1+(v.indexOf()-1)%4;
        if (j == X0 || j == Y0) {
          v.setComputed(true);
        }
      });

  this.addParameter(new ParameterNumber(this, BrachistoSim.en.DAMPING,
      BrachistoSim.i18n.DAMPING,
      () => this.getDamping(), a => this.setDamping(a)));
  this.addParameter(new ParameterNumber(this, BrachistoSim.en.GRAVITY,
      BrachistoSim.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a)));
  this.addParameter(new ParameterNumber(this, BrachistoSim.en.MASS,
      BrachistoSim.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', damping_: '+Util.NF(this.damping_)
      +', gravity_: '+Util.NF(this.gravity_)
      +', mass_: '+Util.NF(this.mass_)
      +', paths: '+this.paths_.length
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'BrachistoSim';
};

/**
* @param paths
* @param localized
*/
private static makeVarNames(paths: ParametricPath[], localized: boolean): string[] {
  const names = new Array(paths.length*4 + 1);
  for (let i=0, len=names.length; i<len; i++) {
    names[i] = BrachistoSim.getVariableName(i, paths, localized);
  }
  return names;
};

/**
* @param i
* @param paths
* @param localized
*/
static getVariableName(i: number, paths: ParametricPath[], localized: boolean): string {
  //   0   1  2  3  4  5  6  7  8  9 10 11 12 ...
  // time p0 v0 x0 y0 p1 v1 x1 y1 p2 v2 x2 y2 ...
  if (i==0) {
    return localized ? VarsList.i18n.TIME : VarsList.en.TIME;
  }
  const j = 1 + (i-1) % 4;  // % is mod, so j tells what variable is wanted
  const obj = Math.floor((i-1) / 4);  // which path: 0, 1, 2, etc.
  const name = paths[obj].getName();
  let type;
  if (j == V0) {
    type = localized ? BrachistoSim.i18n.VELOCITY : BrachistoSim.en.VELOCITY;
  } else {
    type = localized ?BrachistoSim.i18n.POSITION : BrachistoSim.en.POSITION;
  }
  switch (j) {
    case P0:
    case V0: return name+' '+type;
    case X0: return name+' x-'+type;
    case Y0: return name+' y-'+type;
    default:  Util.assert(false);
  }
  return '';
};

/** Returns the set of paths to choose from.
@return the set of paths to choose from
*/
getPaths(): NumericalPath[] {
  return Array.from(this.paths_);
};

/** Which path was chosen by user, or -1 if no path chosen.
@return Which path was chosen by user, or -1 if no path chosen.
*/
getPathChoice(): number {
  return this.choice_;
};

/** Set which path the user has chosen for the 'fastest path'. Resets the variables to
initial conditions. Creates a new set of SimObjects to represent the balls on the path.
Creates the text message to display instructions to the user.

Note: the simulation will still run without choosing a path; the path choice is only
to allow decorating one of the paths with a different colored ball, and to present text
instructions.
* @param choice Which path was chosen by user, or -1 if no path chosen.
*/
setPathChoice(choice: number) {
  this.choice_ = choice;
  // remove from simList all of our old objects
  this.getSimList().removeAll(this.simObjects_);
  this.simObjects_.length = 0; // clears the array
  // specify iniial conditions
  const va = this.getVarsList();
  va.setValue(TIME, 0);  // time
  //   0   1  2  3  4  5  6  7  8  9 10 11 12 ...
  // time p0 v0 x0 y0 p1 v1 x1 y1 p2 v2 x2 y2 ...
  // set each ball to start at the same start point where x = 0
  for (let i=0, len=this.paths_.length; i<len; i++) {
    va.setValue(P0 + 4*i, this.paths_[i].map_x_to_p(0.0));
    va.setValue(V0 + 4*i, 0);  // start velocity is zero
  }
  this.saveInitialState();
  let p = PointMass.makeCircle(0.2, 'start');
  p.setPosition(new Vector(0,  0));
  p.setShape(ShapeType.RECTANGLE);
  this.simObjects_.push(p);
  p = PointMass.makeCircle(0.2, 'end');
  p.setPosition(new Vector(3,  -2));
  p.setShape(ShapeType.RECTANGLE);
  this.simObjects_.push(p);
  // add ball objects, one for each path
  if (choice >= 0) {
    const len = this.balls_.length;
    for (let i=0; i<len; i++) {
      const name = (i==choice) ? 'ball selected' : 'ball';
      p = this.balls_[i] = PointMass.makeCircle(0.1, name);
      this.simObjects_.push(p);
    }
  }
  this.getSimList().addAll(this.simObjects_);
  this.broadcast(new GenericEvent(this, BrachistoSim.PATH_CHOSEN, choice));
};

/** @inheritDoc */
modifyObjects(): void {
  const va = this.getVarsList();
  const vars = va.getValues();
  //   0   1  2  3  4  5  6  7  8  9 10 11 12 ...
  // time p0 v0 x0 y0 p1 v1 x1 y1 p2 v2 x2 y2 ...
  for (let i=0, len=this.paths_.length; i<len; i++) {
    const pathPoint = new PathPoint(vars[P0 + 4*i]);
    this.paths_[i].map_p_to_slope(pathPoint);
    const veloVector = pathPoint.getSlope().multiply(vars[V0 + 4*i]);
    const b = this.balls_[i];
    if (b !== undefined) {
      b.setPosition(pathPoint);
      b.setVelocity(veloVector);
    }
    // update x, y location in vars array
    va.setValue(X0+ 4*i, pathPoint.getX(), /*continuous=*/true);
    va.setValue(Y0+ 4*i, pathPoint.getY(), /*continuous=*/true);
  }
};

/** @inheritDoc */
startDrag(_simObject: null|SimObject, location: Vector, _offset: Vector,
    _dragBody: null|Vector, _modifiers: ModifierKeys): boolean {
  // find the closest path to this point.
  let dist = Infinity;
  let closestPath = -1;
  for (let i=0, len=this.paths_.length; i<len; i++) {
    const pathPoint = this.paths_[i].findNearestGlobal(location);
    const d = pathPoint.getPosition().distanceTo(location);
    if (d < dist) { // found a closer path
      closestPath = i;
      dist = d;
    }
  }
  this.setPathChoice(closestPath);
  return true;
};

/** @inheritDoc */
mouseDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void {
};

/** @inheritDoc */
finishDrag(_simObject: null|SimObject, _location: Vector, _offset: Vector): void{
};

/** @inheritDoc */
handleKeyEvent(_evt: KeyboardEvent, _pressed: boolean, _modifiers: ModifierKeys): void {
};

/** @inheritDoc */
evaluate(vars: number[], change: number[], _timeStep: number): null|object {
  //   0   1  2  3  4  5  6  7  8  9 10 11 12 ...
  // time p0 v0 x0 y0 p1 v1 x1 y1 p2 v2 x2 y2 ...
  change[TIME] = 1; // time
  for (let i=0, len=this.balls_.length; i<len; i++) {
    const idx = 4*i;
    let mass = 0;
    const b = this.balls_[i];
    if (b === undefined) {
      change[P0 + idx] = 0;
      change[V0 + idx] = 0;
      change[X0 + idx] = 0;
      change[Y0 + idx] = 0;
      continue;
    } else {
      mass = b.getMass();
    }
    change[P0 + idx] = vars[V0 + idx];  // p' = v
    // calculate the slope at the given arc-length position on the curve
    // vars[P0] is p = path length position.  xval is the corresponding x value.
    const pathPoint = new PathPoint(vars[P0 + idx]);
    this.paths_[i].map_p_to_slope(pathPoint);
    const k = pathPoint.slope;
    // let k = slope of curve. Then sin(theta) = k/sqrt(1+k^2)
    // v' = - g sin(theta) = - g k/sqrt(1+k^2)
    const sinTheta = isFinite(k) ? k/Math.sqrt(1+k*k) : 1;
    change[V0 + idx] = -this.gravity_*pathPoint.direction*sinTheta;
    // add friction damping:  - b*v/m
    change[V0 + idx] -= this.damping_*vars[V0 + idx]/mass;
    change[X0 + idx] = change[Y0 + idx] = 0; // x,y positions
  }
  return null;
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
  this.broadcastParameter(BrachistoSim.en.GRAVITY);
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
  this.broadcastParameter(BrachistoSim.en.DAMPING);
};

/**
*/
getMass(): number {
  return this.mass_;
};

/**
@param value
*/
setMass(value: number) {
  this.mass_ = value;
  this.balls_.forEach(b => { if (b !== undefined) b.setMass(value); });
  this.broadcastParameter(BrachistoSim.en.MASS);
};

/** Event broadcast when a path is chosen. */
static readonly PATH_CHOSEN = 'PATH_CHOSEN';

static readonly en: i18n_strings = {
  DAMPING: 'damping',
  GRAVITY: 'gravity',
  MASS: 'mass',
  POSITION: 'position',
  VELOCITY: 'velocity'
};

static readonly de_strings: i18n_strings = {
  DAMPING: 'Dämpfung',
  GRAVITY: 'Gravitation',
  MASS: 'Masse',
  POSITION: 'Position',
  VELOCITY: 'Geschwindigkeit'
};

static readonly i18n = Util.LOCALE === 'de' ? BrachistoSim.de_strings : BrachistoSim.en;

} // end class

type i18n_strings = {
  DAMPING: string,
  GRAVITY: string,
  MASS: string,
  POSITION: string,
  VELOCITY: string
};

Util.defineGlobal('sims$roller$BrachistoSim', BrachistoSim);
