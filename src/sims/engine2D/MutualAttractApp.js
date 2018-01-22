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

goog.provide('myphysicslab.sims.engine2D.MutualAttractApp');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.Gravity2Law');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const CheckBoxControl = goog.module.get('myphysicslab.lab.controls.CheckBoxControl');
var ChoiceControl = lab.controls.ChoiceControl;
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DApp = sims.engine2D.Engine2DApp;
const Gravity2Law = goog.module.get('myphysicslab.lab.model.Gravity2Law');
var NumericControl = lab.controls.NumericControl;
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var Polygon = myphysicslab.lab.engine2D.Polygon;
var Shapes = lab.engine2D.Shapes;
var TabLayout = sims.common.TabLayout;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Simulation showing several objects experiencing mutual attraction from gravity.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.MutualAttractApp = function(elem_ids) {
  var simRect = new DoubleRect(-6, -6, 6, 6);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(0.8);
  this.mySim.setShowForces(false);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  /** @type {!Gravity2Law} */
  this.gravityLaw = new Gravity2Law(2, this.simList);

  /** @type {number} */
  this.numBods = 4;
  /** @type {boolean} */
  this.circleBody = true;

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  var choices = [];
  var values = [];
  for (var i=2; i<=6; i++) {
    choices.push(i+' '+MutualAttractApp.i18n.OBJECTS);
    values.push(i);
  }
  this.addParameter(pn = new ParameterNumber(this, MutualAttractApp.en.NUMBER_BODIES,
      MutualAttractApp.i18n.NUMBER_BODIES,
      goog.bind(this.getNumBodies, this), goog.bind(this.setNumBodies, this), choices, values)
      .setLowerLimit(1).setUpperLimit(6));
  this.addControl(new ChoiceControl(pn));

  pn = this.gravityLaw.getParameterNumber(Gravity2Law.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);
  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var MutualAttractApp = sims.engine2D.MutualAttractApp;
goog.inherits(MutualAttractApp, Engine2DApp);

/** @override */
MutualAttractApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + MutualAttractApp.superClass_.toString.call(this);
};

/** @override */
MutualAttractApp.prototype.getClassName = function() {
  return 'MutualAttractApp';
};

/** @override */
MutualAttractApp.prototype.defineNames = function(myName) {
  MutualAttractApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('MutualAttractApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
MutualAttractApp.prototype.getSubjects = function() {
  var subjects = MutualAttractApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {!Polygon}
* @private
*/
MutualAttractApp.prototype.makeBody = function() {
  return this.circleBody ?  Shapes.makeBall(0.2) : Shapes.makeBlock(1, 1);
};

/**
* @return {undefined}
*/
MutualAttractApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  var v = 0.6;
  for (var i=0; i<this.numBods; i++) {
    var body;
    switch (i) {
    case 0:
      body = this.makeBody();
      body.setPosition(new Vector(-4,  0.5),  0);
      body.setVelocity(new Vector(-0.5,  1.0*v));
      this.mySim.addBody(body);
      this.displayList.findShape(body).setFillStyle('green');
      break;
    case 1:
      body = this.makeBody();
      body.setPosition(new Vector(-2.5,  1),  0);
      body.setVelocity(new Vector(1.5*v,  -0.5*v));
      this.mySim.addBody(body);
      this.displayList.findShape(body).setFillStyle('blue');
      break;
    case 2:
      body = this.makeBody();
      body.setPosition(new Vector(-0.5,  -3),  0);
      body.setVelocity(new Vector(-1.5*v,  0));
      this.mySim.addBody(body);
      this.displayList.findShape(body).setFillStyle('lightGray');
      break;
    case 3:
      body = this.makeBody();
      body.setPosition(new Vector(1,  1),  0);
      body.setVelocity(new Vector(0.5*v,  -0.5*v));
      this.mySim.addBody(body);
      this.displayList.findShape(body).setFillStyle('cyan');
      break;
    case 4:
      body = this.makeBody();
      body.setPosition(new Vector(3,  -1),  0);
      this.mySim.addBody(body);
      this.displayList.findShape(body).setFillStyle('magenta');
      break;
    case 5:
      body = this.makeBody();
      body.setPosition(new Vector(5,  2),  0);
      this.mySim.addBody(body);
      this.displayList.findShape(body).setFillStyle('orange');
      break;
    default:
      throw new Error('too many bodies');
    }
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(this.mySim.getTime());
  this.clock.setRealTime(this.mySim.getTime());
  this.easyScript.update();
};

/**
* @return {number}
*/
MutualAttractApp.prototype.getNumBodies = function() {
  return this.numBods;
};

/**
* @param {number} value
*/
MutualAttractApp.prototype.setNumBodies = function(value) {
  this.numBods = value;
  this.config();
  this.broadcastParameter(MutualAttractApp.en.NUMBER_BODIES);
};

/** Set of internationalized strings.
@typedef {{
  NUMBER_BODIES: string,
  OBJECTS: string
  }}
*/
MutualAttractApp.i18n_strings;

/**
@type {MutualAttractApp.i18n_strings}
*/
MutualAttractApp.en = {
  NUMBER_BODIES: 'number of bodies',
  OBJECTS: 'bodies'
};

/**
@private
@type {MutualAttractApp.i18n_strings}
*/
MutualAttractApp.de_strings = {
  NUMBER_BODIES: 'Anzahl von K\u00f6rpern',
  OBJECTS: 'K\u00f6rpern'
};


/** Set of internationalized strings.
@type {MutualAttractApp.i18n_strings}
*/
MutualAttractApp.i18n = goog.LOCALE === 'de' ? MutualAttractApp.de_strings :
    MutualAttractApp.en;

}); // goog.scope
