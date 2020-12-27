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

goog.module('myphysicslab.sims.engine2D.NewtonsCradleApp');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const JointUtil = goog.require('myphysicslab.lab.engine2D.JointUtil');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Scrim = goog.require('myphysicslab.lab.engine2D.Scrim');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/**  The NewtonsCradleApp simulation shows six pendulums side-by-side, you
lift one at the end and let it strike the others;  only the pendulum on the far side
flies away and the pendulum that you let fall becomes motionless when it strikes.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
class NewtonsCradleApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-5, -3, 5, 5);
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(1.0);
  this.mySim.setShowForces(false);
  // JointSmallImpacts==true seems to help with energy stability and joint tightness,
  // but then we get lots of small collisions, which is kind of distracting.
  var collisionAdvance = /** @type {!CollisionAdvance} */(this.advance);
  collisionAdvance.setJointSmallImpacts(false);
  //this.advance.setDebugLevel(CollisionAdvance.DebugLevel.OPTIMAL);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(32, this.simList);

  /** @type {!NewtonsCradleApp.options} */
  this.options = {
      stickLength: 3.0,
      radius: 0.6,
      gapDistance: 0,
      numBods: 5,
      startAngle: -Math.PI/4
    };

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, NewtonsCradleApp.en.NUM_BODIES,
      NewtonsCradleApp.i18n.NUM_BODIES,
      () => this.getNumBodies(), a => this.setNumBodies(a))
      .setDecimalPlaces(0).setLowerLimit(1).setUpperLimit(6));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, NewtonsCradleApp.en.LENGTH,
      NewtonsCradleApp.i18n.LENGTH,
      () => this.getStickLength(), a => this.setStickLength(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(
      pn = new ParameterNumber(this, NewtonsCradleApp.en.GAP_DISTANCE,
      NewtonsCradleApp.i18n.GAP_DISTANCE,
      () => this.getGapDistance(), a => this.setGapDistance(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, NewtonsCradleApp.en.RADIUS,
      NewtonsCradleApp.i18n.RADIUS,
      () => this.getRadius(), a => this.setRadius(a)));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
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
  return 'NewtonsCradleApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('NewtonsCradleApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/** @override */
graphSetup(body) {
  body = this.mySim.getBody('pendulum1');
  this.graph.line.setXVariable(body.getVarsIndex()+4); // angle
  this.graph.line.setYVariable(body.getVarsIndex()+5); // angular velocity
  this.timeGraph.line1.setYVariable(body.getVarsIndex()+4); // angle
  this.timeGraph.line2.setYVariable(body.getVarsIndex()+5); // angular velocity
};

/**
* @return {number}
*/
getNumBodies() {
  return this.options.numBods;
};

/**
* @param {number} value
*/
setNumBodies(value) {
  this.options.numBods = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.NUM_BODIES);
};

/**
* @return {number}
*/
getStickLength() {
  return this.options.stickLength;
};

/**
* @param {number} value
*/
setStickLength(value) {
  this.options.stickLength = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.LENGTH);
};

/**
* @return {number}
*/
getGapDistance() {
  return this.options.gapDistance;
};

/**
* @param {number} value
*/
setGapDistance(value) {
  this.options.gapDistance = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.GAP_DISTANCE);
};

/**
* @return {number}
*/
getRadius() {
  return this.options.radius;
};

/**
* @param {number} value
*/
setRadius(value) {
  this.options.radius = value;
  this.config();
  this.broadcastParameter(NewtonsCradleApp.en.RADIUS);
};

/**
* @return {undefined}
*/
config() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  NewtonsCradleApp.make(this.mySim, this.options);
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @param {!ContactSim} sim
* @param {!NewtonsCradleApp.options} options
*/
static make(sim, options) {
  // each pendulum is 2*radius wide.
  // We have a gap between pendulums of distTol/2 + gapDistance
  // total width of all pendulums:
  var n = options.numBods;
  var r = options.radius;
  var between = sim.getDistanceTol()/2  + options.gapDistance;
  var tw = n * 2 * r + (n - 1) * between;
  var x = -tw/2 + r;
  for (var i=0; i<options.numBods; i++) {
    var body = Shapes.makePendulum(0.05, options.stickLength,
        options.radius, NewtonsCradleApp.en.PENDULUM+(i+1),
        NewtonsCradleApp.i18n.PENDULUM+(i+1));
    body.setAngle(0);
    sim.addBody(body);
    JointUtil.attachRigidBody(sim,
        Scrim.getScrim(), /* fixed point in world coords=*/new Vector(x, 2),
        body, /* attach point in body coords=*/new Vector(0, options.stickLength),
        /*normalType=*/CoordType.WORLD);
    body.setZeroEnergyLevel();
    // first align with angle = 0, to get zero energy level
    sim.alignConnectors();
    x += body.getWidth() + between;
  }
  // move a body to start position
  sim.getBody('pendulum1').setAngle(options.startAngle); //-Math.PI/4;
  sim.alignConnectors();
};

} // end class

/**
* @typedef {{stickLength: number,
    radius: number,
    gapDistance: number,
    numBods: number,
    startAngle: number
    }}
*/
NewtonsCradleApp.options;

/** Set of internationalized strings.
@typedef {{
  GAP_DISTANCE: string,
  PENDULUM: string,
  NUM_BODIES: string,
  LENGTH: string,
  RADIUS: string
  }}
*/
NewtonsCradleApp.i18n_strings;

/**
@type {NewtonsCradleApp.i18n_strings}
*/
NewtonsCradleApp.en = {
  GAP_DISTANCE: 'offset',
  PENDULUM: 'pendulum',
  NUM_BODIES: 'pendulums',
  LENGTH: 'pendulum length',
  RADIUS: 'radius'
};

/**
@private
@type {NewtonsCradleApp.i18n_strings}
*/
NewtonsCradleApp.de_strings = {
  GAP_DISTANCE: 'Zwischenraum',
  PENDULUM: 'Pendel',
  NUM_BODIES: 'Pendelanzahl',
  LENGTH: 'Pendellänge',
  RADIUS: 'Radius'
};

/** Set of internationalized strings.
@type {NewtonsCradleApp.i18n_strings}
*/
NewtonsCradleApp.i18n = goog.LOCALE === 'de' ? NewtonsCradleApp.de_strings :
    NewtonsCradleApp.en;

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!NewtonsCradleApp}
*/
function makeNewtonsCradleApp(elem_ids) {
  return new NewtonsCradleApp(elem_ids);
};
goog.exportSymbol('makeNewtonsCradleApp', makeNewtonsCradleApp);

exports = NewtonsCradleApp;
