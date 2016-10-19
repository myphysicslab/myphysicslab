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

goog.provide('myphysicslab.sims.springs.Double2DSpringApp');

goog.require('myphysicslab.lab.controls.ButtonControl');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.layout.AbstractApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.springs.Double2DSpringSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.layout.AbstractApp;
var ButtonControl = myphysicslab.lab.controls.ButtonControl;
var CommonControls = sims.layout.CommonControls;
var DisplayLine = lab.view.DisplayLine;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = myphysicslab.lab.view.DisplaySpring;
var Double2DSpringSim = sims.springs.Double2DSpringSim;
var DoubleRect = lab.util.DoubleRect;
var ConcreteLine = lab.model.ConcreteLine;
var PointMass = lab.model.PointMass;
var SimpleAdvance = lab.model.SimpleAdvance;
var SliderControl = lab.controls.SliderControl;
var Spring = myphysicslab.lab.model.Spring;
var TabLayout = sims.layout.TabLayout;
var UtilityCore = lab.util.UtilityCore;

/**  Double2DSpringApp displays the simulation
{@link myphysicslab.sims.springs.Double2DSpringSim Double2DSpringSim}.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @extends {AbstractApp}
* @struct
* @export
*/
myphysicslab.sims.springs.Double2DSpringApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  var simRect = new DoubleRect(-6, -6, 6, 6);
  var sim = new Double2DSpringSim();
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  DisplayShape.drawCenterOfMass = false;
  DisplayShape.drawDragPoints = false;
  DisplayShape.fillStyle = '';
  DisplayShape.strokeStyle = 'red';
  this.topMass = new DisplayShape(this.simList.getPointMass('top'));
  this.displayList.add(this.topMass);
  DisplayShape.fillStyle = 'blue';
  DisplayShape.strokeStyle = '';
  this.bob1 = new DisplayShape(this.simList.getPointMass('bob1'));
  this.displayList.add(this.bob1);
  this.bob2 = new DisplayShape(this.simList.getPointMass('bob2'));
  this.displayList.add(this.bob2);
  DisplaySpring.width = 0.3;
  DisplaySpring.colorCompressed = '#0c0';  // darker green
  DisplaySpring.colorExpanded = '#6f6'; // brighter green
  /** @type {!lab.view.DisplaySpring} */
  this.spring1 = new DisplaySpring(this.simList.getSpring('spring1'));
  this.displayList.add(this.spring1);
  this.spring2 = new DisplaySpring(this.simList.getSpring('spring2'));
  this.displayList.add(this.spring2);

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  pn = sim.getParameterNumber(Double2DSpringSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 50, /*multiply=*/false));

  pn = sim.getParameterNumber(Double2DSpringSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(Double2DSpringSim.en.MASS1);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Double2DSpringSim.en.MASS2);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(Double2DSpringSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(Double2DSpringSim.en.STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 200, /*multiply=*/false));

  this.addStandardControls();

  /** @type {!myphysicslab.lab.controls.ButtonControl} */
  var bc = new ButtonControl(Double2DSpringSim.i18n.REST_STATE,
      goog.bind(sim.restState, sim));
  this.addControl(bc);

  this.makeScriptParser();
  this.addURLScriptButton();
};
var Double2DSpringApp = myphysicslab.sims.springs.Double2DSpringApp;
goog.inherits(Double2DSpringApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  Double2DSpringApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', bob1: '+this.bob1.toStringShort()
        +', bob2: '+this.bob2.toStringShort()
        +', spring1: '+this.spring1.toStringShort()
        +', spring2: '+this.spring2.toStringShort()
        +', topMass: '+this.topMass.toStringShort()
        + Double2DSpringApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
Double2DSpringApp.prototype.getClassName = function() {
  return 'Double2DSpringApp';
};

/** @inheritDoc */
Double2DSpringApp.prototype.defineNames = function(myName) {
  Double2DSpringApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('topMass|bob1|bob2|spring1|spring2',
      myName);
};

}); // goog.scope
