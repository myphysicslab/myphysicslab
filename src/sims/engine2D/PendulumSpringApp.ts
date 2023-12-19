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

import { AutoScale } from '../../lab/graph/AutoScale.js';
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GraphLine } from '../../lab/graph/GraphLine.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { JointUtil } from '../../lab/engine2D/JointUtil.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/** Simulates a pendulum attached to another body with a spring.
The pendulum is a rigid body with a pivot attached to the background.

Includes demonstration of using a DisplayGraph to show the movement of a body
as trailing lines following the body. Also demonstrates automatically zooming
the view to show the graph as it is drawn.
*/
export class PendulumSpringApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  springs_: Spring[] = [];
  graphLine: GraphLine;
  autoScale: AutoScale;
  dispGraph: DisplayGraph;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-4, -4, 4, 4);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.layout.getSimCanvas().setBackground('black');
  this.sim.setShowForces(false);
  this.dampingLaw = new DampingLaw(0.05, 0.15, this.simList);
  this.sim.addForceLaw(this.dampingLaw);
  this.gravityLaw = new GravityLaw(4, this.simList);
  this.sim.addForceLaw(this.gravityLaw);

  // wallPivot = where in world space the pivot is
  const wallPivotX = 2.0;
  const wallPivotY = 0;
  const map = this.simView.getCoordMap();
  const pendulum = Shapes.makeBlock2(0.3, 1.0, PendulumSpringApp.en.PENDULUM,
      PendulumSpringApp.i18n.PENDULUM);
  const bodyX = 0.5*pendulum.getWidth();
  const bodyY = 0.15*pendulum.getHeight();
  this.sim.addBody(pendulum);
  this.displayList.findShape(pendulum).setFillStyle('#B0C4DE');
  // joints to attach upper pendulum to a fixed point.
  JointUtil.attachRigidBody(this.sim,
      Scrim.getScrim(), /*attach_body=*/new Vector(wallPivotX, wallPivotY),
      pendulum, /*attach_body=*/new Vector(bodyX, bodyY),
      /*normalType=*/CoordType.WORLD);

  const block = Shapes.makeBlock2(0.3, 1.0, PendulumSpringApp.en.BLOCK,
      PendulumSpringApp.i18n.BLOCK);
  block.setPosition(new Vector(-1.2,  -2.5),  0.2);
  this.sim.addBody(block);
   //transparent orange
  this.displayList.findShape(block).setFillStyle('rgba(255, 165, 0, 0.5)');

  this.rbo.protoSpring.setWidth(0.3);
  this.addSpring(new Spring('spring1',
      pendulum, new Vector(0.15, 0.7),
      block, new Vector(0.15, 0.7),
      /*restLength=*/0.75, /*stiffness=*/1.0));
  this.addSpring(new Spring('spring2',
      block, new Vector(0.15, 0.7),
      Scrim.getScrim(), new Vector(-2, 2),
      /*restLength=*/0.75, /*stiffness=*/1.0));
  this.addSpring(new Spring('spring3',
      block, new Vector(0.15, 0.3),
      Scrim.getScrim(), new Vector(-2, -2),
      /*restLength=*/0.75, /*stiffness=*/1.0));

  // Walls.make also sets zero energy level for each block.
  const zel = Walls.make2(this.sim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);

  // Set the pendulum's zero energy level to a custom setting.
  pendulum.setAngle(-Math.PI); // zero energy position, hanging straight down
  this.sim.alignConnectors();
  // reset zero energy for pendulum
  pendulum.setZeroEnergyLevel();
  pendulum.setAngle(0.5); // move to starting position
  this.sim.alignConnectors();
  this.sim.setElasticity(0.3);
  this.sim.saveInitialState();

  this.addPlaybackControls();
  let pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addParameter(
      pn = new ParameterNumber(this, PendulumSpringApp.en.SPRING_STIFFNESS,
      PendulumSpringApp.i18n.SPRING_STIFFNESS,
      () => this.getStiffness(), a => this.setStiffness(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(
      pn = new ParameterNumber(this, PendulumSpringApp.en.SPRING_LENGTH,
      PendulumSpringApp.i18n.SPRING_LENGTH,
      () => this.getRestLength(), a => this.setRestLength(a)));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  // Demonstration of using a DisplayGraph to show the movement of a body
  // as trailing lines following the body.
  this.graphLine = new GraphLine('TRAILS_LINE', this.sim.getVarsList());
  this.simView.addMemo(this.graphLine);
  this.autoScale = new AutoScale('TRAILS_AUTO_SCALE', this.graphLine, this.simView);
  this.dispGraph = new DisplayGraph(this.graphLine);
  this.dispGraph.setZIndex(3);
  this.dispGraph.setScreenRect(this.simView.getScreenRect());
  this.displayList.add(this.dispGraph);

  this.panZoomParam.setValue(true);
  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      +', graphLine: '+this.graphLine.toStringShort()
      +', autoScale: '+this.autoScale.toStringShort()
      + super.toString();
};

/**
* @param s
*/
private addSpring(s: Spring): void {
  this.springs_.push(s);
  this.sim.addForceLaw(s);
  this.simList.add(s);
};

/** @inheritDoc */
getClassName() {
  return 'PendulumSpringApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw|graphLine|autoScale',
       myName+'.');
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.gravityLaw, this.dampingLaw, this.graphLine,
       this.autoScale);
};

/** @inheritDoc */
override graphSetup(_body?: RigidBody): void {
  const bodyIdx = this.sim.getBody('block').getVarsIndex();
  this.graphLine.setXVariable(bodyIdx+0);
  this.graphLine.setYVariable(bodyIdx+2);
  this.graph.line.setXVariable(bodyIdx+0);
  this.graph.line.setYVariable(bodyIdx+2);
  this.timeGraph.line1.setYVariable(bodyIdx+0);
  this.timeGraph.line2.setYVariable(bodyIdx+2);
};

/**
*/
getStiffness(): number {
  return this.springs_[0].getStiffness();
};

/**
* @param value
*/
setStiffness(value: number) {
  this.springs_.forEach(s =>  s.setStiffness(value));
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.sim.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(PendulumSpringApp.en.SPRING_STIFFNESS);
};

/**
*/
getRestLength(): number {
  return this.springs_[0].getRestLength();
};

/**
* @param value
*/
setRestLength(value: number) {
  this.springs_.forEach(s =>  s.setRestLength(value));
  // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
  this.sim.getVarsList().incrSequence(2, 3);
  this.broadcastParameter(PendulumSpringApp.en.SPRING_LENGTH);
};

static readonly en: i18n_strings = {
  SPRING_LENGTH: 'spring length',
  SPRING_STIFFNESS: 'spring stiffness',
  BLOCK: 'block',
  PENDULUM: 'pendulum'
};

static readonly de_strings: i18n_strings = {
  SPRING_LENGTH: 'Federlänge',
  SPRING_STIFFNESS: 'Federsteifheit',
  BLOCK: 'Block',
  PENDULUM: 'Pendel'
};

static readonly i18n = Util.LOCALE === 'de' ? PendulumSpringApp.de_strings : PendulumSpringApp.en;

} // end class

type i18n_strings = {
  SPRING_LENGTH: string,
  SPRING_STIFFNESS: string,
  BLOCK: string,
  PENDULUM: string
};
Util.defineGlobal('sims$engine2D$PendulumSpringApp', PendulumSpringApp);
