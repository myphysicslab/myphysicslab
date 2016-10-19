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

goog.provide('myphysicslab.sims.springs.CollideBlocksApp');

goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.layout.AbstractApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.springs.CollideBlocksSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var NumericControl = lab.controls.NumericControl;
var AbstractApp = sims.layout.AbstractApp;
var CollideBlocksSim = sims.springs.CollideBlocksSim;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.layout.CommonControls;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
var DoubleRect = lab.util.DoubleRect;
var PointMass = lab.model.PointMass;
var Spring = lab.model.Spring;
var TabLayout = sims.layout.TabLayout;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/**  CollideBlocksApp displays the CollideBlocksSim simulation.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @extends {AbstractApp}
* @struct
* @export
*/
myphysicslab.sims.springs.CollideBlocksApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  var simRect = new DoubleRect(-0.5, -2, 7.5, 2);
  var sim = new CollideBlocksSim();
  var advance = new CollisionAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  //this.advance.setDebugLevel(DebugLevel.OPTIMAL);

  DisplayShape.drawCenterOfMass = false;
  DisplayShape.drawDragPoints = false;
  DisplayShape.fillStyle = 'blue';
  this.block1 = new DisplayShape(this.simList.getPointMass('block1'));
  this.displayList.add(this.block1);
  this.block2 = new DisplayShape(this.simList.getPointMass('block2'));
  this.displayList.add(this.block2);
  DisplayShape.fillStyle = 'lightGray';
  this.wallLeft = new DisplayShape(this.simList.getPointMass('wallLeft'));
  this.displayList.add(this.wallLeft);
  this.wallRight = new DisplayShape(this.simList.getPointMass('wallRight'));
  this.displayList.add(this.wallRight);
  this.spring1 = new DisplaySpring(this.simList.getSpring('spring1'));
  this.displayList.add(this.spring1);
  this.spring2 = new DisplaySpring(this.simList.getSpring('spring2'));
  this.displayList.add(this.spring2);

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;
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
  this.makeScriptParser();
  this.addURLScriptButton();
};
var CollideBlocksApp = myphysicslab.sims.springs.CollideBlocksApp;
goog.inherits(CollideBlocksApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  CollideBlocksApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', block1: '+this.block1.toStringShort()
        +', block2: '+this.block2.toStringShort()
        +', wallLeft: '+this.wallLeft.toStringShort()
        +', wallRight: '+this.wallRight.toStringShort()
        +', spring1: '+this.spring1.toStringShort()
        +', spring2: '+this.spring2.toStringShort()
        + CollideBlocksApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
CollideBlocksApp.prototype.getClassName = function() {
  return 'CollideBlocksApp';
};

/** @inheritDoc */
CollideBlocksApp.prototype.defineNames = function(myName) {
  CollideBlocksApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('block1|block2|wallLeft|wallRight|spring1|spring2',
      myName);
};

}); // goog.scope
