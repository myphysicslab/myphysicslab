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

goog.provide('myphysicslab.sims.engine2D.MarsMoonApp');

goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.Gravity2Law');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var NumericControl = lab.controls.NumericControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var DampingLaw = lab.model.DampingLaw;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var Gravity2Law = lab.model.Gravity2Law;
var ParameterNumber = lab.util.ParameterNumber;
var Polygon = lab.engine2D.Polygon;
var Shapes = lab.engine2D.Shapes;
var Vector = lab.util.Vector;
var UtilityCore = lab.util.UtilityCore;

/** Simulation of an asteroid orbiting a moon.

This app has a {@link #config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!sims.common.TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.MarsMoonApp = function(elem_ids) {
  var simRect = new DoubleRect(-10, -10, 10, 10);
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(1.0);
  this.mySim.setShowForces(false);
  this.mySim.setShowCollisions(true);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(/*damping=*/0, /*rotateRatio=*/0.15, this.simList);
  /** @type {number} */
  this.moonMass = 100;
  /** @type {number} */
  this.asteroidMass = 0.1;
  /** asteriod starting vertical velocity
  * @type {number}
  */
  this.velocity = 14;
  /** ratio of axes of oval.  1.0 = circle.
  * @type {number}
  */
  this.ovalness = 1.0;
  /** initial moon rotational velocity
  * @type {number}
  */
  this.moonSpin = 0;
  /** @type {!Polygon} */
  this.moon;
  /** @type {!Polygon} */
  this.asteroid;
  /** @type {!Gravity2Law} */
  this.gravityLaw = new Gravity2Law(10.0, this.simList);

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  /** @type {!lab.util.ParameterString} */
  var ps;
  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(Gravity2Law.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.MOON_MASS,
      MarsMoonApp.i18n.MOON_MASS,
      goog.bind(this.getMoonMass, this), goog.bind(this.setMoonMass, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.ASTERIOD_MASS,
      MarsMoonApp.i18n.ASTERIOD_MASS,
      goog.bind(this.getAsteroidMass, this), goog.bind(this.setAsteroidMass, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.VELOCITY,
      MarsMoonApp.i18n.VELOCITY,
      goog.bind(this.getVelocity, this), goog.bind(this.setVelocity, this)));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();

  // show the pan-zoom controls
  this.panZoomParam.setValue(true);
};
var MarsMoonApp = sims.engine2D.MarsMoonApp;
goog.inherits(MarsMoonApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  MarsMoonApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        +', gravityLaw: '+this.gravityLaw.toStringShort()
        + MarsMoonApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
MarsMoonApp.prototype.getClassName = function() {
  return 'MarsMoonApp';
};

/** @inheritDoc */
MarsMoonApp.prototype.defineNames = function(myName) {
  MarsMoonApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName);
  this.terminal.addRegex('MarsMoonApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
MarsMoonApp.prototype.getSubjects = function() {
  var subjects = MarsMoonApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/** @inheritDoc */
MarsMoonApp.prototype.graphSetup = function(body) {
  var idx = this.asteroid.getVarsIndex();
  this.graph.line.setXVariable(idx+0); // 'asteroid x position'
  this.graph.line.setYVariable(idx+2); // 'asteroid y position'
  this.timeGraph.line1.setYVariable(idx+0); // 'asteroid x position'
  this.timeGraph.line2.setYVariable(idx+1); // 'asteroid x velocity'
};

/**
* @return {undefined}
*/
MarsMoonApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  if (this.ovalness == 1.0) {
    this.moon = Shapes.makeBall(/*radius=*/3, MarsMoonApp.en.MOON,
      MarsMoonApp.i18n.MOON);
  } else {
    //this.moon = Shapes.makeOval('moon', 3, ovalness*3);
    throw new Error('oval shape not implemented');
  }
  // Set moon velocity so the combined bodies have zero momentum.
  // asteroid momentum = asteroid_v * asteroid_mass
  // moon_momentum = -asteroid_momentum = moon_v * moon_mass
  var moon_v = -this.velocity * this.asteroidMass / this.moonMass;
  this.moon.setMass(this.moonMass);
  this.moon.setPosition(new Vector(0,  0),  0);
  this.moon.setVelocity(new Vector(0,  moon_v),  this.moonSpin);
  this.moon.setElasticity(elasticity);
  this.mySim.addBody(this.moon);
  this.displayList.findShape(this.moon).setFillStyle('#E0E0E0')
      .setDrawCenterOfMass(true);

  this.asteroid = Shapes.makeBall(0.2, MarsMoonApp.en.ASTERIOD,
      MarsMoonApp.i18n.ASTERIOD);
  this.asteroid.setPosition(new Vector(4,  0),  0);
  this.asteroid.setMass(this.asteroidMass);
  this.asteroid.setVelocity(new Vector(0,  this.velocity),  0);
  this.asteroid.setElasticity(elasticity);
  this.mySim.addBody(this.asteroid);
  this.displayList.findShape(this.asteroid).setFillStyle('Blue')

  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(this.mySim.getTime());
  this.clock.setRealTime(this.mySim.getTime());
  this.easyScript.update();
};

/**
* @return {number}
*/
MarsMoonApp.prototype.getAsteroidMass = function() {
  return this.asteroidMass;
};

/**
* @param {number} value
*/
MarsMoonApp.prototype.setAsteroidMass = function(value) {
  this.asteroidMass = value;
  this.broadcastParameter(MarsMoonApp.en.ASTERIOD_MASS);
};

/**
* @return {number}
*/
MarsMoonApp.prototype.getMoonMass = function() {
  return this.moonMass;
};

/**
* @param {number} value
*/
MarsMoonApp.prototype.setMoonMass = function(value) {
  this.moonMass = value;
  this.broadcastParameter(MarsMoonApp.en.MOON_MASS);
};

/**
* @return {number}
*/
MarsMoonApp.prototype.getVelocity = function() {
  return this.velocity;
};

/**
* @param {number} value
*/
MarsMoonApp.prototype.setVelocity = function(value) {
  this.velocity = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.VELOCITY);
};

/** Set of internationalized strings.
@typedef {{
  ASTERIOD_MASS: string,
  GRAVITY: string,
  MOON_MASS: string,
  MOON_SPIN: string,
  OVALNESS: string,
  VELOCITY: string,
  MOON: string,
  ASTERIOD: string
  }}
*/
MarsMoonApp.i18n_strings;

/**
@type {MarsMoonApp.i18n_strings}
*/
MarsMoonApp.en = {
  ASTERIOD_MASS: 'asteroid mass',
  GRAVITY: 'gravity',
  MOON_MASS: 'moon mass',
  MOON_SPIN: 'moon spin',
  OVALNESS: 'ovalness',
  VELOCITY: 'initial velocity',
  MOON: 'moon',
  ASTERIOD: 'asteroid'
};

/**
@private
@type {MarsMoonApp.i18n_strings}
*/
MarsMoonApp.de_strings = {
  ASTERIOD_MASS: 'Asteroid Masse',
  GRAVITY: 'Gravitation',
  MOON_MASS: 'Mondmasse',
  MOON_SPIN: 'Mondrotation',
  OVALNESS: 'Oval-heit',
  VELOCITY: 'Anfangs Geschwindigkeit',
  MOON: 'Mond',
  ASTERIOD: 'Asteroid'
};


/** Set of internationalized strings.
@type {MarsMoonApp.i18n_strings}
*/
MarsMoonApp.i18n = goog.LOCALE === 'de' ? MarsMoonApp.de_strings :
    MarsMoonApp.en;

}); // goog.scope
