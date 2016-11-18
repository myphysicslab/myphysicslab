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
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.layout.AbstractApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.springs.SingleSpringSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.layout.AbstractApp;
var CommonControls = sims.layout.CommonControls;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
var DoubleRect = lab.util.DoubleRect;
var ExpressionVariable = lab.model.ExpressionVariable;
var NumericControl = lab.controls.NumericControl;
var ParameterNumber = lab.util.ParameterNumber;
var PointMass = lab.model.PointMass;
var SimpleAdvance = lab.model.SimpleAdvance;
var Spring = lab.model.Spring;
var SingleSpringSim = sims.springs.SingleSpringSim;
var TabLayout = sims.layout.TabLayout;
var UtilityCore = lab.util.UtilityCore;

/** SingleSpringApp displays the SingleSpringSim simulation.

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
  UtilityCore.setErrorHandler();
  var simRect = new DoubleRect(-3, -2, 3, 2);
  var sim = new SingleSpringSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  this.block = new DisplayShape(this.simList.getPointMass('block'))
      .setFillStyle('blue');
  this.displayList.add(this.block);
  this.spring = new DisplaySpring(this.simList.getSpring('spring'))
      .setWidth(0.4).setThickness(6);
  this.displayList.add(this.spring);

  // Demo of adding an ExpressionVariable.
  if (!UtilityCore.ADVANCED) {
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
  this.makeScriptParser();
  this.addURLScriptButton();
};
var SingleSpringApp = myphysicslab.sims.springs.SingleSpringApp;
goog.inherits(SingleSpringApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  SingleSpringApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', block: '+this.block.toStringShort()
        +', spring: '+this.spring.toStringShort()
        + SingleSpringApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
SingleSpringApp.prototype.getClassName = function() {
  return 'SingleSpringApp';
};

/** @inheritDoc */
SingleSpringApp.prototype.defineNames = function(myName) {
  SingleSpringApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('block|spring',
      myName);
};

}); // goog.scope
