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

goog.provide('myphysicslab.sims.springs.SingleSpringApp');

goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.model.ExpressionVariable');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.Clock');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.springs.SingleSpringSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const AbstractApp = goog.module.get('myphysicslab.sims.common.AbstractApp');
const CommonControls = goog.module.get('myphysicslab.sims.common.CommonControls');
const DisplayShape = goog.module.get('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.module.get('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const ExpressionVariable = goog.module.get('myphysicslab.lab.model.ExpressionVariable');
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.module.get('myphysicslab.lab.model.PointMass');
const SimpleAdvance = goog.module.get('myphysicslab.lab.model.SimpleAdvance');
var SingleSpringSim = sims.springs.SingleSpringSim;
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
const TabLayout = goog.module.get('myphysicslab.sims.common.TabLayout');
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Displays the {@link SingleSpringSim} simulation.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @extends {AbstractApp}
* @struct
* @export
*/
myphysicslab.sims.springs.SingleSpringApp = function(elem_ids, opt_name) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-3, -2, 3, 2);
  var sim = new SingleSpringSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  /** @type {!DisplayShape} */
  this.block = new DisplayShape(this.simList.getPointMass('block'))
      .setFillStyle('blue');
  this.displayList.add(this.block);
  /** @type {!DisplaySpring} */
  this.spring = new DisplaySpring(this.simList.getSpring('spring'))
      .setWidth(0.4).setThickness(6);
  this.displayList.add(this.spring);

  // Demo of adding an ExpressionVariable.
  if (!Util.ADVANCED) {
    var va = sim.getVarsList();
    va.addVariable(new ExpressionVariable(va, 'sin_time', 'sin(time)',
        this.terminal, 'Math.sin(sim.getTime());'));
  }

  this.addPlaybackControls();

  /** @type {!ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(SingleSpringSim.en.MASS);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(SingleSpringSim.en.DAMPING);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(SingleSpringSim.en.SPRING_STIFFNESS);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(SingleSpringSim.en.SPRING_LENGTH);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(SingleSpringSim.en.FIXED_POINT);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
};
var SingleSpringApp = myphysicslab.sims.springs.SingleSpringApp;
goog.inherits(SingleSpringApp, AbstractApp);

/** @override */
SingleSpringApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', block: '+this.block.toStringShort()
      +', spring: '+this.spring.toStringShort()
      + SingleSpringApp.superClass_.toString.call(this);
};

/** @override */
SingleSpringApp.prototype.getClassName = function() {
  return 'SingleSpringApp';
};

/** @override */
SingleSpringApp.prototype.defineNames = function(myName) {
  SingleSpringApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('block|spring',
      myName+'.');
};

}); // goog.scope
