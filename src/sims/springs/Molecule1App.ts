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
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { MoleculeSim, KE, PE, TE } from './MoleculeSim.js';
import { ParameterNumber, Subject, SubjectEvent, SubjectList } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Displays the {@link MoleculeSim} simulation.
*/
export class Molecule1App extends AbstractApp<MoleculeSim> implements Subject, SubjectList {

  walls: DisplayShape;
  spring: DisplaySpring;
  atom1: DisplayShape;
  atom2: DisplayShape;

  atom1_: PointMass;
  atom2_: PointMass;
  spring_: Spring;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new MoleculeSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
  this.layout.getSimCanvas().setBackground('white');
  //this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);

  this.atom1_ = PointMass.makeCircle(0.5, 'atom1');
  this.atom1_.setMass(0.5);
  this.atom1_.setVelocityX(1.5);
  this.atom2_ = PointMass.makeCircle(0.5, 'atom2');
  this.atom2_.setMass(0.5);
  this.atom2_.setPositionY(1.7);
  this.spring_ = new Spring('spring',
      this.atom1_, Vector.ORIGIN,
      this.atom2_, Vector.ORIGIN,
      /*restLength=*/2.0, /*stiffness=*/6.0);
  this.spring_.setDamping(0);
  sim.addAtom(this.atom1_);
  sim.addAtom(this.atom2_);
  sim.addSpring(this.spring_);
  sim.saveInitialState();

  this.walls = new DisplayShape(this.simList.getPointMass('walls'));
  this.walls.setFillStyle('');
  this.walls.setStrokeStyle('gray');
  this.displayList.add(this.walls);
  this.spring = new DisplaySpring(this.spring_);
  this.spring.setWidth(0.3);
  this.spring.setThickness(3);
  this.displayList.add(this.spring);
  this.atom1 = new DisplayShape(this.atom1_);
  this.atom1.setFillStyle('blue');
  this.displayList.add(this.atom1);
  this.atom2 = new DisplayShape(this.atom2_);
  this.atom2.setFillStyle('red');
  this.displayList.add(this.atom2);

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(MoleculeSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  pn = sim.getParameterNumber(MoleculeSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(MoleculeSim.en.ELASTICITY);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  this.addParameter(pn = new ParameterNumber(this, Molecule1App.en.MASS1,
      Molecule1App.i18n.MASS1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  this.addParameter(pn = new ParameterNumber(this, Molecule1App.en.MASS2,
      Molecule1App.i18n.MASS2,
      () => this.getMass2(), a => this.setMass2(a)));
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  this.addParameter(pn = new ParameterNumber(this, Molecule1App.en.SPRING_LENGTH,
      Molecule1App.i18n.SPRING_LENGTH,
      () => this.getLength(), a => this.setLength(a)));
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  this.addParameter(pn = new ParameterNumber(this, Molecule1App.en.SPRING_STIFFNESS,
      Molecule1App.i18n.SPRING_STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', atom1: '+this.atom1.toStringShort()
      +', atom2: '+this.atom2.toStringShort()
      +', spring: '+this.spring.toStringShort()
      +', walls: '+this.walls.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'Molecule1App';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('walls|atom1|atom2|spring',
      myName+'.');
};

/** Return mass of atoms
@return mass of atoms
*/
getMass1(): number {
  return this.atom1_.getMass();
};

/** Set mass of atom 1
@param value mass of atom 1
*/
setMass1(value: number) {
  this.atom1_.setMass(value);
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(Molecule1App.en.MASS1);
};

/** Return mass of atom 2
@return mass of atom 2
*/
getMass2(): number {
  return this.atom2_.getMass();
};

/** Set mass of atom 2
@param value mass of atom 2
*/
setMass2(value: number) {
  this.atom2_.setMass(value);
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(KE, PE, TE);
  this.broadcastParameter(Molecule1App.en.MASS2);
};

/** Return spring resting length
@return spring resting length
*/
getLength(): number {
  return this.spring_.getRestLength();
};

/** Set spring resting length
@param value spring resting length
*/
setLength(value: number) {
  this.spring_.setRestLength(value);
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Molecule1App.en.SPRING_LENGTH);
};

/** Returns spring stiffness
@return spring stiffness
*/
getStiffness(): number {
  return this.spring_.getStiffness();
};

/** Sets spring stiffness
@param value spring stiffness
*/
setStiffness(value: number) {
  this.setStiffness(value);
  // discontinuous change in energy
  this.sim.getVarsList().incrSequence(PE, TE);
  this.broadcastParameter(Molecule1App.en.SPRING_STIFFNESS);
};

static readonly en: i18n_strings = {
  MASS1: 'blue mass',
  MASS2: 'red mass',
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness'
};

static readonly de_strings: i18n_strings = {
  MASS1: 'blaue Masse',
  MASS2: 'rote Masse',
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit'
};

static readonly i18n = Util.LOCALE === 'de' ? Molecule1App.de_strings : Molecule1App.en;

} // end class

type i18n_strings = {
  MASS1: string,
  MASS2: string,
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string
};

Util.defineGlobal('sims$springs$Molecule1App', Molecule1App);
