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

goog.module('myphysicslab.sims.springs.CollideBlocksApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CollideBlocksSim = goog.require('myphysicslab.sims.springs.CollideBlocksSim');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/**  CollideBlocksApp displays the CollideBlocksSim simulation.
*/
class CollideBlocksApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-0.5, -2, 7.5, 2);
  const sim = new CollideBlocksSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  //this.advance.setDebugLevel(DebugLevel.OPTIMAL);

  /** @type {!DisplayShape} */
  this.protoBlock = new DisplayShape().setFillStyle('blue');
  /** @type {!DisplayShape} */
  this.protoWall = new DisplayShape().setFillStyle('lightGray');
  /** @type {!DisplaySpring} */
  this.protoSpring = new DisplaySpring();

  /** @type {!DisplayShape} */
  this.block1 = new DisplayShape(this.simList.getPointMass('block1'), this.protoBlock);
  this.displayList.add(this.block1);
  /** @type {!DisplayShape} */
  this.block2 = new DisplayShape(this.simList.getPointMass('block2'), this.protoBlock);
  this.displayList.add(this.block2);
  /** @type {!DisplayShape} */
  this.wallLeft = new DisplayShape(this.simList.getPointMass('wallLeft'),
      this.protoWall);
  this.displayList.add(this.wallLeft);
  /** @type {!DisplayShape} */
  this.wallRight = new DisplayShape(this.simList.getPointMass('wallRight'),
      this.protoWall);
  this.displayList.add(this.wallRight);
  /** @type {!DisplaySpring} */
  this.spring1 = new DisplaySpring(this.simList.getSpring('spring1'), this.protoSpring);
  this.displayList.add(this.spring1);
  /** @type {!DisplaySpring} */
  this.spring2 = new DisplaySpring(this.simList.getSpring('spring2'), this.protoSpring);
  this.displayList.add(this.spring2);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  let pn;
  pn = sim.getParameterNumber(CollideBlocksSim.en.MASS_1);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.MASS_2);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.STIFFNESS_1);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.LENGTH_1);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.STIFFNESS_2);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.LENGTH_2);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(2);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(2);
  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', block1: '+this.block1.toStringShort()
      +', block2: '+this.block2.toStringShort()
      +', wallLeft: '+this.wallLeft.toStringShort()
      +', wallRight: '+this.wallRight.toStringShort()
      +', spring1: '+this.spring1.toStringShort()
      +', spring2: '+this.spring2.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'CollideBlocksApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('block1|block2|wallLeft|wallRight|spring1|spring2'
      +'|protoBlock|protoWall|protoSpring',
      myName+'.');
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!CollideBlocksApp}
*/
function makeCollideBlocksApp(elem_ids) {
  return new CollideBlocksApp(elem_ids);
};
goog.exportSymbol('makeCollideBlocksApp', makeCollideBlocksApp);

exports = CollideBlocksApp;
