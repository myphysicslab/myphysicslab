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

goog.provide('myphysicslab.sims.pendulum.VectorGraphPendulumApp');

goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.VectorGraph');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DrawingMode');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.pendulum.PendulumSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.common.AbstractApp;
var CommonControls = sims.common.CommonControls;
var ConcreteLine = lab.model.ConcreteLine;
var DisplayGraph = lab.graph.DisplayGraph;
var DisplayLine = lab.view.DisplayLine;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var DrawingMode = lab.view.DrawingMode;
var GenericObserver = lab.util.GenericObserver;
var ParameterNumber = lab.util.ParameterNumber;
var PendulumSim = sims.pendulum.PendulumSim;
var PointMass = lab.model.PointMass;
var SimpleAdvance = lab.model.SimpleAdvance;
var SliderControl = lab.controls.SliderControl;
var TabLayout = sims.common.TabLayout;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;
var VectorGraph = lab.graph.VectorGraph;

/** Displays the {@link PendulumSim} simulation with a {@link VectorGraph}.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @extends {AbstractApp}
* @struct
* @export
*/
sims.pendulum.VectorGraphPendulumApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  var simRect = new DoubleRect(-2, -2.2, 2, 1.5);
  var sim = new PendulumSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  sim.setDriveAmplitude(0);
  sim.setDamping(0);
  sim.setGravity(9.8);
  sim.setLength(1);

  /** @type {!DisplayLine} */
  this.rod = new DisplayLine(this.simList.getConcreteLine('rod'));
  this.displayList.add(this.rod);
  /** @type {!DisplayShape} */
  this.bob = new DisplayShape(this.simList.getPointMass('bob')).setFillStyle('blue');
  this.displayList.add(this.bob);

  this.graph.line.setDrawingMode(DrawingMode.LINES);
  /** @type {!VectorGraph} */
  this.vectorGraph = new VectorGraph(sim, /*xVariable=*/0, /*yVariable=*/1);
  this.vectorGraph.setScreenRect(this.graph.view.getScreenRect());
  this.graph.displayList.add(this.vectorGraph);

  // remove the VectorGraph when the variables are any other than
  // the specific 2 variables it works with.
  new GenericObserver(this.graph.line, goog.bind(function(evt) {
    var yVar = this.graph.line.getYVariable();
    var xVar = this.graph.line.getXVariable();
    var isOK = yVar == 1 && xVar == 0;
    var isVis = this.graph.displayList.contains(this.vectorGraph);
    if (isOK && !isVis) {
      this.graph.displayList.add(this.vectorGraph);
    } else if (!isOK && isVis) {
      this.graph.displayList.remove(this.vectorGraph);
    }
  },this), 'remove VectorGraph when other variables shown');

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(PendulumSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(PendulumSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(PendulumSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(PendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};
var VectorGraphPendulumApp = sims.pendulum.VectorGraphPendulumApp;
goog.inherits(VectorGraphPendulumApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  VectorGraphPendulumApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', bob: '+this.bob.toStringShort()
        +', rod: '+this.rod.toStringShort()
        + VectorGraphPendulumApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
VectorGraphPendulumApp.prototype.getClassName = function() {
  return 'VectorGraphPendulumApp';
};

/** @inheritDoc */
VectorGraphPendulumApp.prototype.defineNames = function(myName) {
  VectorGraphPendulumApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('rod|bob',
      myName);
};

}); // goog.scope
