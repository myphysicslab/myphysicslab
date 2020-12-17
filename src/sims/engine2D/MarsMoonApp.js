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

goog.module('myphysicslab.sims.engine2D.MarsMoonApp');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const Gravity2Law = goog.require('myphysicslab.lab.model.Gravity2Law');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Simulation of an asteroid orbiting a moon.

This app has a {@link #config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
class MarsMoonApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-10, -10, 10, 10);
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
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
  /** @type {number} */
  this.moonRadius = 3;
  /** @type {number} */
  this.asteroidRadius = 0.2;
  /** asteriod starting vertical velocity
  * @type {number}
  */
  this.velocity = 14;
  /** asteriod starting distance
  * @type {number}
  */
  this.distance = 0.8;
  /** ratio of axes of oval.  1.0 = circle.
  * @type {number}
  */
  this.ovalness = 1.0;
  /** initial moon rotational velocity.  Only relevant for oval shaped moon.
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
  /** @type {!ParameterNumber} */
  var pn;
  /** @type {!ParameterString} */
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

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.DISTANCE,
      MarsMoonApp.i18n.DISTANCE,
      goog.bind(this.getDistance, this), goog.bind(this.setDistance, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.MOON_RADIUS,
      MarsMoonApp.i18n.MOON_RADIUS,
      goog.bind(this.getMoonRadius, this), goog.bind(this.setMoonRadius, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.ASTERIOD_RADIUS,
      MarsMoonApp.i18n.ASTERIOD_RADIUS,
      goog.bind(this.getAsteroidRadius, this),
      goog.bind(this.setAsteroidRadius, this)));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();

  // show the pan-zoom controls
  this.panZoomParam.setValue(true);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'MarsMoonApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('MarsMoonApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/** @override */
graphSetup(body) {
  var idx = this.asteroid.getVarsIndex();
  this.graph.line.setXVariable(idx+0); // 'asteroid x position'
  this.graph.line.setYVariable(idx+2); // 'asteroid y position'
  this.timeGraph.line1.setYVariable(idx+0); // 'asteroid x position'
  this.timeGraph.line2.setYVariable(idx+1); // 'asteroid x velocity'
};

/**
* @return {undefined}
*/
config() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  if (this.ovalness == 1.0) {
    this.moon = Shapes.makeBall(this.moonRadius, MarsMoonApp.en.MOON,
      MarsMoonApp.i18n.MOON);
  } else {
    //this.moon = Shapes.makeOval('moon', 3, ovalness*3);
    throw 'oval shape not implemented';
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

  this.asteroid = Shapes.makeBall(this.asteroidRadius, MarsMoonApp.en.ASTERIOD,
      MarsMoonApp.i18n.ASTERIOD);
  var dist = this.asteroidRadius + this.moonRadius + this.distance;
  this.asteroid.setPosition(new Vector(dist,  0),  0);
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
getAsteroidMass() {
  return this.asteroidMass;
};

/**
* @param {number} value
*/
setAsteroidMass(value) {
  this.asteroidMass = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.ASTERIOD_MASS);
};

/**
* @return {number}
*/
getMoonMass() {
  return this.moonMass;
};

/**
* @param {number} value
*/
setMoonMass(value) {
  this.moonMass = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.MOON_MASS);
};

/**
* @return {number}
*/
getAsteroidRadius() {
  return this.asteroidRadius;
};

/**
* @param {number} value
*/
setAsteroidRadius(value) {
  this.asteroidRadius = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.ASTERIOD_RADIUS);
};

/**
* @return {number}
*/
getMoonRadius() {
  return this.moonRadius;
};

/**
* @param {number} value
*/
setMoonRadius(value) {
  this.moonRadius = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.MOON_RADIUS);
};

/**
* @return {number}
*/
getVelocity() {
  return this.velocity;
};

/**
* @param {number} value
*/
setVelocity(value) {
  this.velocity = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.VELOCITY);
};

/**
* @return {number}
*/
getDistance() {
  return this.distance;
};

/**
* @param {number} value
*/
setDistance(value) {
  this.distance = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.DISTANCE);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  ASTERIOD_MASS: string,
  ASTERIOD_RADIUS: string,
  GRAVITY: string,
  MOON_MASS: string,
  MOON_RADIUS: string,
  MOON_SPIN: string,
  OVALNESS: string,
  VELOCITY: string,
  MOON: string,
  ASTERIOD: string,
  DISTANCE: string
  }}
*/
MarsMoonApp.i18n_strings;

/**
@type {MarsMoonApp.i18n_strings}
*/
MarsMoonApp.en = {
  ASTERIOD_MASS: 'asteroid mass',
  ASTERIOD_RADIUS: 'asteroid radius',
  GRAVITY: 'gravity',
  MOON_MASS: 'moon mass',
  MOON_RADIUS: 'moon radius',
  MOON_SPIN: 'moon spin',
  OVALNESS: 'ovalness',
  VELOCITY: 'initial velocity',
  MOON: 'moon',
  ASTERIOD: 'asteroid',
  DISTANCE: 'distance'
};

/**
@private
@type {MarsMoonApp.i18n_strings}
*/
MarsMoonApp.de_strings = {
  ASTERIOD_MASS: 'Asteroid Masse',
  ASTERIOD_RADIUS: 'Asteroid Radius',
  GRAVITY: 'Gravitation',
  MOON_MASS: 'Mondmasse',
  MOON_RADIUS: 'Mond Radius',
  MOON_SPIN: 'Mondrotation',
  OVALNESS: 'Oval-heit',
  VELOCITY: 'Anfangs Geschwindigkeit',
  MOON: 'Mond',
  ASTERIOD: 'Asteroid',
  DISTANCE: 'Entfernung'
};

/** Set of internationalized strings.
@type {MarsMoonApp.i18n_strings}
*/
MarsMoonApp.i18n = goog.LOCALE === 'de' ? MarsMoonApp.de_strings :
    MarsMoonApp.en;

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!MarsMoonApp}
*/
function makeMarsMoonApp(elem_ids) {
  return new MarsMoonApp(elem_ids);
};
goog.exportSymbol('makeMarsMoonApp', makeMarsMoonApp);

exports = MarsMoonApp;
