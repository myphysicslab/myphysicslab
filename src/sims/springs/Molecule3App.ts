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

import { AbstractApp } from '../common/AbstractApp.js';
import { ElementIDs } from '../common/Layout.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { MoleculeSim, KE, PE, TE, U1X, U1Y, V1X, V1Y } from './MoleculeSim.js';
import { GenericObserver, Observer, ParameterNumber, Subject, SubjectEvent, SubjectList } from '../../lab/util/Observe.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { RandomLCG } from '../../lab/util/Random.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { SpringNonLinear1 } from './SpringNonLinear1.js';
import { SpringNonLinear2 } from './SpringNonLinear2.js';
import { Util } from '../../lab/util/Util.js';
import { VarsList } from '../../lab/model/VarsList.js';
import { Vector } from '../../lab/util/Vector.js';

export const enum SpringType {
  LINEAR = 1,
  NON_LINEAR = 2,
  PSEUDO_GRAVITY = 3,
};

/** Displays the {@link MoleculeSim} simulation.
*/
export class Molecule3App extends AbstractApp<MoleculeSim> implements Subject, SubjectList, Observer {

  numAtoms_: number;
  protoSpring: DisplaySpring;
  protoSpecialSpring: DisplaySpring;
  private random_: RandomLCG = new RandomLCG(78597834798);
  /** Mass-Spring-Mass matrix says how springs & masses are connected
  * each row corresponds to a spring, with indices of masses connected to that spring.
  */
  private msm_: number[][] = [];
  /** Special Group of springs. These are indices in sim.getSprings() array. */
  private sg_: number[] = [];
  /** Non-Special Group of springs. These are indices in sim.getSprings() array. */
  private nsg_: number[] = [];
  /** What type of spring to create: linear, non-linear, or pseudo-gravity */
  private springType_: SpringType = SpringType.LINEAR;
  mass = 0.5;
  redMass = 0.5;
  length = 3;
  redLength = 3;
  stiffness = 6;
  redStiffness = 6;
  /** strength of attraction force in NonLinearSpring2 */
  attract = 30;
  controlLength: LabControl;
  controlLengthSpecial: LabControl;
  controlAttract: LabControl;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param numAtoms number of atoms to make, from 2 to 6
*/
constructor(elem_ids: ElementIDs, numAtoms: number) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new MoleculeSim();
  const advance = new CollisionAdvance(sim);

  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim);

  this.numAtoms_ = numAtoms;

  this.layout.getSimCanvas().setBackground('black');

  this.protoSpring = new DisplaySpring();
  this.protoSpring.setWidth(0.3);
  this.protoSpring.setColorCompressed('#0c0');
  this.protoSpring.setColorExpanded('green');
  this.protoSpring.setThickness(3);
  this.protoSpecialSpring = new DisplaySpring();
  this.protoSpecialSpring.setWidth(0.3);
  this.protoSpecialSpring.setColorCompressed('#b55');
  this.protoSpecialSpring.setColorExpanded('red');
  this.protoSpecialSpring.setThickness(3);

  // The observe() method will make DisplayObjects in response to seeing SimObjects
  // being added to the SimList.  Important that no SimObjects were added prior.
  // Except for the walls.
  Util.assert(this.simList.length() == 1);
  this.simList.addObserver(this);
  this.addBody(this.sim.getWalls());

  this.addPlaybackControls();
  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.NUM_ATOMS,
      Molecule3App.i18n.NUM_ATOMS,
      () => this.getNumAtoms(), a => this.setNumAtoms(a)));
  this.addControl(new SliderControl(pn, 1, 6, /*multiply=*/false, 5));

  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.SPRING_TYPE,
      Molecule3App.i18n.SPRING_TYPE,
      () => this.getSpringType(),
      a => this.setSpringType(a),
      [ Molecule3App.i18n.LINEAR,
        Molecule3App.i18n.NON_LINEAR,
        Molecule3App.i18n.PSEUDO_GRAVITY ],
      [ SpringType.LINEAR,
        SpringType.NON_LINEAR,
        SpringType.PSEUDO_GRAVITY ]));
  this.addControl(new ChoiceControl(pn));

  pn = this.sim.getParameterNumber(MoleculeSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = this.sim.getParameterNumber(MoleculeSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.sim.getParameterNumber(MoleculeSim.en.ELASTICITY);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.MASS,
      Molecule3App.i18n.MASS,
      () => this.getMass(), a => this.setMass(a)));
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.MASS_SPECIAL,
      Molecule3App.i18n.MASS_SPECIAL,
      () => this.getMassSpecial(), a => this.setMassSpecial(a)));
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.LENGTH,
      Molecule3App.i18n.LENGTH,
      () => this.getLength(), a => this.setLength(a)));
  this.addControl(this.controlLength = new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.LENGTH_SPECIAL,
      Molecule3App.i18n.LENGTH_SPECIAL,
      () => this.getLengthSpecial(), a => this.setLengthSpecial(a)));
  this.addControl(this.controlLengthSpecial = new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.STIFFNESS,
      Molecule3App.i18n.STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));
  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.STIFFNESS_SPECIAL,
      Molecule3App.i18n.STIFFNESS_SPECIAL,
      () => this.getStiffnessSpecial(),
      a => this.setStiffnessSpecial(a)));
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.ATTRACT_FORCE,
      Molecule3App.i18n.ATTRACT_FORCE,
      () => this.getAttractForce(), a => this.setAttractForce(a)));
  this.addControl(this.controlAttract = new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, Molecule3App.en.WALL_SIZE,
      Molecule3App.i18n.WALL_SIZE,
      () => this.getWallSize(), a => this.setWallSize(a)));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.config();

  this.makeEasyScript();
  this.addURLScriptButton();

  this.graph.line.setXVariable(U1X);
  this.graph.line.setYVariable(U1Y);
  this.timeGraph.line1.setYVariable(KE);
  this.timeGraph.line2.setYVariable(PE);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'Molecule3App';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('protoSpecialSpring|protoSpring', myName+'.');
};

/**
@param obj
*/
private addBody(obj: SimObject) {
  if (this.displayList.find(obj)) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof PointMass) {
    const pm = obj as PointMass;
    if (pm.getName().match(/^WALL/)) {
      const walls = new DisplayShape(pm);
      walls.setFillStyle('');
      walls.setStrokeStyle('gray');
      this.displayList.add(walls);
    } else {
      let cm = 'black';
      switch (pm.getName()) {
        case 'ATOM1': cm = 'red'; break;
        case 'ATOM2': cm = 'blue'; break;
        case 'ATOM3': cm = 'magenta'; break;
        case 'ATOM4': cm = 'orange'; break;
        case 'ATOM5': cm = 'gray'; break;
        case 'ATOM6': cm = 'green'; break;
        default: cm = 'pink';
      }
      const atom = new DisplayShape(pm);
      atom.setFillStyle(cm);
      this.displayList.add(atom);
    }
  } else if (obj instanceof Spring) {
    const s = obj as Spring;
    const proto = s.getName().match(/^SPECIAL/) ? this.protoSpecialSpring :
        this.protoSpring;
    this.displayList.add(new DisplaySpring(s, proto));
  }
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.simList) {
    const obj = event.getValue() as SimObject;
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      const d = this.displayList.find(obj);
      if (d) {
        this.displayList.remove(d);
      }
    }
  }
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link MoleculeSim.cleanSlate} then recreates all the
* various Molecule's and Spring's.
*/
private config(): void {
  const numAtoms = this.numAtoms_;
  if (numAtoms < 1 || numAtoms > 6) {
    throw 'too many atoms '+numAtoms;
  }
  this.sim.cleanSlate();
  // Mass-Spring-Mass matrix says how springs & masses are connected
  // each row corresponds to a spring, with indices of masses connected to that spring.
  this.msm_ = Molecule3App.getMSM(numAtoms);
  // Special Group of springs. These are indices in springs_ array.
  this.sg_ = Molecule3App.getSG(numAtoms);
  // Non-Special Group of springs. These are indices in springs_ array.
  this.nsg_ = Molecule3App.getNSG(this.msm_.length, this.sg_);
  for (let i=0; i<numAtoms; i++) {
    const atom = PointMass.makeCircle(0.5, 'atom'+(i+1));
    atom.setMass(i==0 ? this.redMass: this.mass);
    this.sim.addAtom(atom);
  }
  const atoms = this.sim.getAtoms();
  for (let i=0; i<this.msm_.length; i++) {
    const special = this.sg_.includes(i);
    const name = (special ? 'special ' : '') + 'spring '+i;
    const atom1 = atoms[this.msm_[i][0]];
    const atom2 = atoms[this.msm_[i][1]];
    const loc = Vector.ORIGIN;
    const len = special ? this.redLength : this.length;
    const stiff = special ? this.redStiffness : this.stiffness;
    let spring: Spring;
    switch (this.springType_) {
      case SpringType.LINEAR:
        spring = new Spring(name, atom1, loc, atom2, loc, len, stiff);
        break;
      case SpringType.NON_LINEAR:
        spring = new SpringNonLinear1(name, atom1, loc, atom2, loc, len, stiff);
        break;
      case SpringType.PSEUDO_GRAVITY:
        spring = new SpringNonLinear2(name, atom1, loc, atom2, loc, len, stiff,
          this.attract);
        break;
      default:
        throw '';
    }
    // spring rest length is only relevant for linear spring
    const linearSpring = this.springType_ == SpringType.LINEAR;
    this.controlLength.setEnabled(linearSpring);
    this.controlLengthSpecial.setEnabled(linearSpring);
    // attract force is only relevant for pseudo-gravity spring
    this.controlAttract.setEnabled(this.springType_ == SpringType.PSEUDO_GRAVITY);
    spring.setDamping(0);
    this.sim.addSpring(spring);
  }
  this.initialPositions(numAtoms);
  this.sim.saveInitialState();
  this.sim.modifyObjects();
  if (this.easyScript) {
    this.easyScript.update();
  }
};

/** Returns Mass-Spring-Mass matrix which says how springs & masses are connected.
* Each row corresponds to a spring; with indices of masses connected to that spring.
* @param numAtoms  number of atoms in molecule
*/
private static getMSM(numAtoms: number): number[][] {
  switch (numAtoms) {
    case 1: return [];
    case 2: return [[0,1]];
    case 3: return [[0,1],[1,2],[2,0]];
    case 4: return [[0,1],[1,2],[2,3],[3,0],[1,3],[0,2]];
    case 5: return [[0,1],[1,2],[2,3],[3,4],[4,0],[4,2],[4,1],
                        [0,3],[1,3],[0,2]];
    case 6: return [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,2],[2,4],
                       [4,0],[1,3],[3,5],[5,1],[0,3],[1,4],[2,5]];
  }
  throw '';
};

/** Returns Special Groups of springs, these are indices into msm[].
* @param numAtoms  number of atoms in molecule
*/
private static getSG(numAtoms: number): number[] {
  switch (numAtoms) {
    case 1: return [];
    case 2: return [];
    case 3: return [0];
    case 4: return [0,3,5];
    case 5: return [0,4,7,9];
    case 6: return [12,13,14];
  }
  throw '';
};

/** Returns Non-Special Groups of springs, these are indices into msm[].
* @param num_springs  number of springs in molecule
* @param sg the special group
*/
private static getNSG(num_springs: number, sg: number[]): number[] {
  const nsg = [];
  for (let i=0; i<num_springs; i++) {
    if (!sg.includes(i)) {
      nsg.push(i);
    }
  }
  return nsg;
};

/** Sets initial position of atoms.
* @param numAtoms
*/
private initialPositions(numAtoms: number): void {
  const vars = this.sim.getVarsList().getValues();
  // vars: 0   1   2   3   4   5   6   7    8  9   10  11
  //      time KE  PE  TE  U1x U1y V1x V1y U2x U2y V2x V2y
  // arrange all masses around a circle
  const r = 1.0; // radius
  for (let i=0; i<numAtoms; i++) {
    const idx = 4*i;
    vars[U1X + idx] = r * Math.cos(i*2*Math.PI/numAtoms);
    vars[U1Y + idx] = r * Math.sin(i*2*Math.PI/numAtoms);
  }
  this.sim.getVarsList().setValues(vars);
  /*  rotating star for 4 masses
  const v = 3;  // velocity
  const l = 2;  // length of springs
  // ball 1 at 90 degrees, vel=(-v,0)
  vars[U1Y] = l;
  vars[V1X] = -v;
  // ball 2 at -30 degrees
  vars[U1X + 1*4] = l*Math.cos(Math.PI/6);
  vars[U1Y + 1*4] = -l*Math.sin(Math.PI/6);
  vars[V1X + 1*4] = v*Math.cos(Math.PI/3);
  vars[V1Y + 1*4] = v*Math.sin(Math.PI/3);
  vars[U1X + 2*4] = -l*Math.cos(Math.PI/6);
  vars[U1Y + 2*4] = -l*Math.sin(Math.PI/6);
  vars[V1X + 2*4] = v*Math.cos(Math.PI/3);
  vars[V1Y + 2*4] = -v*Math.sin(Math.PI/3);
  */
};

/** Return number of atoms
@return number of atoms
*/
getNumAtoms(): number {
  return this.numAtoms_;
};

/** Set number of atoms
@param value number of atoms
*/
setNumAtoms(value: number) {
  if (value < 1 || value > 6) {
    throw 'too many atoms '+value;
  }
  this.numAtoms_ = value;
  this.config();
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(Molecule3App.en.NUM_ATOMS);
};

/** What type of springs to create
@return type of spring to create: 1=linear, 2=non-linear, or 3=pseudo-gravity
*/
getSpringType(): SpringType {
  return this.springType_;
};

/** Sets type of springs to create
@param value type of springs to create: 1=linear, 2=non-linear, or 3=pseudo-gravity
*/
setSpringType(value: SpringType) {
  if (this.springType_ != value) {
    this.springType_ = value;
    this.config();
    // discontinuous change in energy
    this.sim.getVarsList().incrSequence(KE, PE, TE);
    this.broadcastParameter(Molecule3App.en.SPRING_TYPE);
  }
};

/** Return mass of atoms
@return mass of atoms
*/
getMass(): number {
  return this.mass;
};

/** Set mass of atoms
@param value mass of atoms
*/
setMass(value: number) {
  this.mass = value;
  this.sim.getAtoms().forEach((atom, idx) => {
    if (idx > 0) {
      atom.setMass(value);
    }
  });
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(Molecule3App.en.MASS);
};

/** Return mass of special atom
@return mass of special atom
*/
getMassSpecial(): number {
  return this.redMass;
};

/** Set mass of special atom
@param value mass of special atom
*/
setMassSpecial(value: number) {
  this.redMass = value;
  this.sim.getAtoms()[0].setMass(value);
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(Molecule3App.en.MASS_SPECIAL);
};

/** Return spring resting length
@return spring resting length
*/
getLength(): number {
  return this.length;
};

/** Set spring resting length
@param value spring resting length
*/
setLength(value: number) {
  this.length = value;
  for (let i=0; i<this.nsg_.length; i++) {
    this.sim.getSprings()[this.nsg_[i]].setRestLength(value);
  }
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Molecule3App.en.LENGTH);
};

/** Return spring resting length
@return spring resting length
*/
getLengthSpecial(): number {
  return this.redLength;
};

/** Set spring resting length
@param value spring resting length
*/
setLengthSpecial(value: number) {
  this.redLength = value;
  for (let i=0; i<this.sg_.length; i++) {
    this.sim.getSprings()[this.sg_[i]].setRestLength(value);
  }
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Molecule3App.en.LENGTH_SPECIAL);
};

/** Returns spring stiffness
@return spring stiffness
*/
getStiffness(): number {
  return this.stiffness;
};

/** Sets spring stiffness
@param value spring stiffness
*/
setStiffness(value: number) {
  this.stiffness = value;
  for (let i=0; i<this.nsg_.length; i++) {
    this.sim.getSprings()[this.nsg_[i]].setStiffness(value);
  }
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Molecule3App.en.STIFFNESS);
};

/** Returns spring stiffness of special group of springs
@return spring stiffness of special group of springs
*/
getStiffnessSpecial(): number {
  return this.redStiffness;
};

/** Sets spring stiffness of special group of springs
@param value spring stiffness of special group of springs
*/
setStiffnessSpecial(value: number) {
  this.redStiffness = value;
  for (let i=0; i<this.sg_.length; i++) {
    this.sim.getSprings()[this.sg_[i]].setStiffness(value);
  }
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Molecule3App.en.STIFFNESS_SPECIAL);
};

/** Returns strength of attraction force in NonLinearSpring2.
@return strength of attraction force in NonLinearSpring2
*/
getAttractForce(): number {
  return this.attract;
};

/** Sets strength of attraction force in NonLinearSpring2
@param value strength of attraction force in NonLinearSpring2
*/
setAttractForce(value: number) {
  if (this.attract != value) {
    this.attract = value;
    this.sim.getSprings().forEach(spr => {
      if (spr instanceof SpringNonLinear2) {
        spr.setAttract(value);
      }
    });
    // discontinuous change in energy
    this.sim.getVarsList().incrSequence(PE, TE);
    this.broadcastParameter(Molecule3App.en.ATTRACT_FORCE);
  }
};

/** Returns width (and height) of walls.
@return width (and height) of walls
*/
getWallSize(): number {
  return this.sim.getWalls().getWidth();
};

/** Set width and height of walls.
@param value width (and height) of walls
*/
setWallSize(value: number) {
  const w = this.sim.getWalls();
  w.setWidth(value);
  w.setHeight(value);
  // Set the visible area to entire wall region, to help users understand.
  let simRect = w.getBoundsWorld();
  // Limit size of simView, so that we can still see the atoms.
  const max = 60;
  simRect = simRect.intersection(new DoubleRect(-max, -max, max, max));
  this.simView.setSimRect(simRect);
  this.broadcastParameter(Molecule3App.en.WALL_SIZE);
};

static readonly en: i18n_strings = {
  MASS: 'mass',
  MASS_SPECIAL: 'red mass',
  LENGTH: 'spring length',
  LENGTH_SPECIAL: 'red spring length',
  STIFFNESS: 'spring stiffness',
  STIFFNESS_SPECIAL: 'red spring stiffness',
  ATTRACT_FORCE: 'attract force',
  NUM_ATOMS: 'number of atoms',
  LINEAR: 'linear',
  NON_LINEAR: 'non-linear',
  PSEUDO_GRAVITY: 'pseudo-gravity',
  SPRING_TYPE: 'spring type',
  WALL_SIZE: 'wall size',
};

static readonly de_strings: i18n_strings = {
  MASS: 'Masse',
  MASS_SPECIAL: 'rote Masse',
  LENGTH: 'Federlänge',
  LENGTH_SPECIAL: 'rote Federlänge',
  STIFFNESS: 'Federsteifheit',
  STIFFNESS_SPECIAL: 'rote Federsteifheit',
  ATTRACT_FORCE: 'anziehen Kraft',
  NUM_ATOMS: 'zahl Masse',
  LINEAR: 'linear',
  NON_LINEAR: 'nichtlinear',
  PSEUDO_GRAVITY: 'pseudo-Gravitation',
  SPRING_TYPE: 'FederTyp',
  WALL_SIZE: 'Wand Größe',
};

static readonly i18n = Util.LOCALE === 'de' ? Molecule3App.de_strings : Molecule3App.en;

} // end class

type i18n_strings = {
  MASS: string,
  MASS_SPECIAL: string,
  LENGTH: string,
  LENGTH_SPECIAL: string,
  STIFFNESS: string,
  STIFFNESS_SPECIAL: string,
  ATTRACT_FORCE: string,
  NUM_ATOMS: string,
  LINEAR: string,
  NON_LINEAR: string,
  PSEUDO_GRAVITY: string,
  SPRING_TYPE: string,
  WALL_SIZE: string,
};
Util.defineGlobal('sims$springs$Molecule3App', Molecule3App);
