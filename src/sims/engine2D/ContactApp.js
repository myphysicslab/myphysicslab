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

goog.module('myphysicslab.sims.engine2D.ContactApp');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConcreteVertex = goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const SixThrusters = goog.require('myphysicslab.sims.engine2D.SixThrusters');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const ThrusterSet = goog.require('myphysicslab.lab.engine2D.ThrusterSet');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/**  ContactApp demonstrates ContactSim with a set of simple rectangular objects.

This app has a {@link #config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------
+ ParameterNumber named `NUM_BODIES`, see {@link #setNumBodies}.

+ ParameterNumber named `THRUST`, see {@link #setThrust}

+ ParameterNumber named `MASS1`, see {@link #setMass1}

*/
class ContactApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-4.5, -3.6, 3.1, 4);
  var sim = new ContactSim();
  // Try different ExtraAccel values here. Can also do this in Terminal.
  //this.mySim.setExtraAccel(ExtraAccel.VELOCITY);
  var advance = new CollisionAdvance(sim);
  //advance.setDebugLevel(CollisionAdvance.DebugLevel.OPTIMAL);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.mySim.setShowForces(true);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.1, this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(3, this.simList);
  this.elasticity.setElasticity(0.8);
  /** @type {number} */
  this.numBods = 6;
  /** @type {number} */
  this.mass1 = 1;
  /** @type {number} */
  this.thrust = 1.5;
  /** @type {!ThrusterSet} */
  this.thrust1;
  /** @type {!ThrusterSet} */
  this.thrust2;

  this.addPlaybackControls();

  /** @type {!ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, ContactApp.en.NUM_BODIES,
      ContactApp.i18n.NUM_BODIES,
      () => this.getNumBodies(), a => this.setNumBodies(a))
      .setDecimalPlaces(0).setLowerLimit(1).setUpperLimit(6));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ContactApp.en.THRUST,
      ContactApp.i18n.THRUST,
      () => this.getThrust(), a => this.setThrust(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ContactApp.en.MASS1,
      ContactApp.i18n.MASS1,
      () => this.getMass1(), a => this.setMass1(a)));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
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

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'ContactApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('ContactApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {undefined}
*/
config() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  var zel = Walls.make2(this.mySim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);
  /** @type {!RigidBody} */
  var p;
  this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  if (this.numBods >= 1) {
    p = Shapes.makeRandomPolygon(/*sides=*/4, /*radius=*/1,
        /*minAngle=*/undefined, /*maxAngle=*/undefined,
        ContactApp.en.BLOCK+1, ContactApp.i18n.BLOCK+1);
    p.setPosition(new Vector(-3.4,  0),  0);
    p.setVelocity(new Vector(0.3858,  -0.3608),  -0.3956);
    p.setMass(this.mass1);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('cyan')
    this.thrust2 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust2, 'left');
    this.mySim.addForceLaw(this.thrust2);
  }
  if (this.numBods >= 2) {
    p = Shapes.makeBlock(1, 3, ContactApp.en.BLOCK+2, ContactApp.i18n.BLOCK+2);
    p.setPosition(new Vector(-1.8,  0),  0);
    p.setVelocity(new Vector(0.26993,  -0.01696),  -0.30647);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('orange')
    this.thrust1 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust1, 'right');
    this.mySim.addForceLaw(this.thrust1);
  }
  if (this.numBods >= 3) {
    p = Shapes.makeRandomPolygon(/*sides=*/4, /*radius=*/1,
        /*minAngle=*/undefined, /*maxAngle=*/undefined,
        ContactApp.en.BLOCK+3, ContactApp.i18n.BLOCK+3);
    p.setPosition(new Vector(2,  -0.113),  0);
    p.setVelocity(new Vector(-0.29445,  -0.11189),  -0.23464);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#9f3'); // light green
  }
  if (this.numBods >= 4) {
    p = Shapes.makeBlock(1, 3, ContactApp.en.BLOCK+4, ContactApp.i18n.BLOCK+4);
    p.setPosition(new Vector(1.36,  2.5),  -Math.PI/4);
    p.setVelocity(new Vector(-0.45535,  -0.37665),  0.36526);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#f6c'); // hot pink
  }
  if (this.numBods >= 5) {
    p = Shapes.makeBlock(1, 3, ContactApp.en.BLOCK+5, ContactApp.i18n.BLOCK+5);
    p.setPosition(new Vector(-2,  2.5),  Math.PI/2+0.1);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#39f');
  }
  if (this.numBods >= 6) {
    p = Shapes.makeRandomPolygon(/*sides=*/4, /*radius=*/1,
        /*minAngle=*/undefined, /*maxAngle=*/undefined,
        ContactApp.en.BLOCK+6, ContactApp.i18n.BLOCK+6);
    p.setPosition(new Vector(0,  0),  0);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#c99');
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @return {number}
*/
getMass1() {
  return this.mass1;
};

/**
* @param {number} value
*/
setMass1(value) {
  if (this.mass1 != value) {
    this.mass1 = value;
    var body1 = this.mySim.getBody(ContactApp.en.BLOCK+'1');
    body1.setMass(value);
    this.broadcastParameter(ContactApp.en.MASS1);
  }
};

/**
* @return {number}
*/
getNumBodies() {
  return this.numBods;
};

/**
* @param {number} value
*/
setNumBodies(value) {
  this.numBods = value;
  this.config();
  this.broadcastParameter(ContactApp.en.NUM_BODIES);
};

/**
* @return {number}
*/
getThrust() {
  return this.thrust;
};

/**
* @param {number} value
*/
setThrust(value) {
  this.thrust = value;
  this.thrust1.setMagnitude(value);
  this.thrust2.setMagnitude(value);
  this.broadcastParameter(ContactApp.en.THRUST);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  NUM_BODIES: string,
  THRUST: string,
  BLOCK: string,
  MASS1: string
  }}
*/
ContactApp.i18n_strings;

/**
@type {ContactApp.i18n_strings}
*/
ContactApp.en = {
  NUM_BODIES: 'number of objects',
  THRUST: 'thrust',
  BLOCK: 'block',
  MASS1: 'mass of block1'
};

/**
@private
@type {ContactApp.i18n_strings}
*/
ContactApp.de_strings = {
  NUM_BODIES: 'Anzahl von Objekten',
  THRUST: 'Schubkraft',
  BLOCK: 'Block',
  MASS1: 'Masse von Block1'
};

/** Set of internationalized strings.
@type {ContactApp.i18n_strings}
*/
ContactApp.i18n = goog.LOCALE === 'de' ? ContactApp.de_strings :
    ContactApp.en;

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!ContactApp}
*/
function makeContactApp(elem_ids) {
  return new ContactApp(elem_ids);
};
goog.exportSymbol('makeContactApp', makeContactApp);

exports = ContactApp;
