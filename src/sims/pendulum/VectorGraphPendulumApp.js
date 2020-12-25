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

goog.module('myphysicslab.sims.pendulum.VectorGraphPendulumApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const DisplayGraph = goog.require('myphysicslab.lab.graph.DisplayGraph');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const DrawingMode = goog.require('myphysicslab.lab.view.DrawingMode');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PendulumSim = goog.require('myphysicslab.sims.pendulum.PendulumSim');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VectorGraph = goog.require('myphysicslab.lab.graph.VectorGraph');

/** Displays the {@link PendulumSim} simulation with a {@link VectorGraph}.
*/
class VectorGraphPendulumApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-2, -2.2, 2, 1.5);
  var sim = new PendulumSim();
  var advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
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
  new GenericObserver(this.graph.line, evt => {
    var yVar = this.graph.line.getYVariable();
    var xVar = this.graph.line.getXVariable();
    var isOK = yVar == 1 && xVar == 0;
    var isVis = this.graph.displayList.contains(this.vectorGraph);
    if (isOK && !isVis) {
      this.graph.displayList.add(this.vectorGraph);
    } else if (!isOK && isVis) {
      this.graph.displayList.remove(this.vectorGraph);
    }
  }, 'remove VectorGraph when other variables shown');

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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', bob: '+this.bob.toStringShort()
      +', rod: '+this.rod.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'VectorGraphPendulumApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('rod|bob',
      myName+'.');
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!VectorGraphPendulumApp}
*/
function makeVectorGraphPendulumApp(elem_ids) {
  return new VectorGraphPendulumApp(elem_ids);
};
goog.exportSymbol('makeVectorGraphPendulumApp', makeVectorGraphPendulumApp);

exports = VectorGraphPendulumApp;
