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

goog.module('myphysicslab.sims.engine2D.TestBodyApp');

const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CollisionHandling = goog.require('myphysicslab.lab.engine2D.CollisionHandling');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const Scrim = goog.require('myphysicslab.lab.engine2D.Scrim');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/** TestBodyApp is meant for close observation of contacts and collisions for
debugging.
*/
class TestBodyApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-10, -6, 10, 6);
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.mySim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  this.mySim.addForceLaw(this.dampingLaw);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(0, this.simList);
  this.mySim.addForceLaw(this.gravityLaw);
  /** @type {!Polygon} */
  this.block = Shapes.makeBlock2(1, 3, TestBodyApp.en.BLOCK, TestBodyApp.i18n.BLOCK);
  this.block.setPosition(new Vector(0,  -5.49500),  -7.85398);
  this.mySim.addBody(this.block);
  this.displayList.findShape(this.block).setFillStyle('#ccf').setNameColor('gray')
      .setNameFont('12pt sans-serif').setNameRotate(Math.PI/2);

  /** @type {!Spring} */
  this.spring = new Spring('spring',
      this.block, new Vector(0.5, 2.7),
      Scrim.getScrim(), new Vector(-1, -2),
      /*restLength=*/0, /*stiffness=*/3.0);
  this.mySim.addForceLaw(this.spring);
  this.simList.add(this.spring);

  var zel = Walls.make2(this.mySim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);

  this.addPlaybackControls();

  /** @type {!ParameterString} */
  var ps = this.mySim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  this.addControl(new ChoiceControl(ps));
  ps = this.mySim.getParameterString(RigidBodySim.en.EXTRA_ACCEL);
  this.addControl(new ChoiceControl(ps));

  /** @type {!ParameterNumber} */
  var pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup(this.mySim.getBody('block'));
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
  return 'TestBodyApp';
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'myApp.sim' when myName is 'myApp'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw|block|spring',
       myName+'.');
  this.terminal.addRegex('TestBodyApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/** Start the application running.
* @return {undefined}
* @export
*/
setup() {
  var t = this.terminal;
  t.eval('//setup commands');
  t.eval('gravityLaw.setGravity(8);');
  t.eval('dampingLaw.setDamping(0);');
  t.eval('sim.setElasticity(0.2);');
  t.eval('sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);');
  t.eval('sim.setShowForces(true);');
  t.eval('simView.setSimRect(new DoubleRect(-1.73762, -6.09127, -1.29572, -5.82613));');
  t.eval('clock.setTimeRate(0.1);');
  t.eval('statusList.add(displayClock);');
  t.eval('statusList.add(energyGraph);');
  t.eval('simRun.setTimeStep(0.01);');
  t.eval('block.setZeroEnergyLevel(-4.5);');
  t.eval('//end of setup commands');
  super.setup();
};

} // end class

/** Set of internationalized strings.
@typedef {{
  BLOCK: string
  }}
*/
TestBodyApp.i18n_strings;

/**
@type {TestBodyApp.i18n_strings}
*/
TestBodyApp.en = {
  BLOCK: 'block'
};

/**
@private
@type {TestBodyApp.i18n_strings}
*/
TestBodyApp.de_strings = {
  BLOCK: 'Block'
};

/** Set of internationalized strings.
@type {TestBodyApp.i18n_strings}
*/
TestBodyApp.i18n = goog.LOCALE === 'de' ? TestBodyApp.de_strings :
    TestBodyApp.en;

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!TestBodyApp}
*/
function makeTestBodyApp(elem_ids) {
  return new TestBodyApp(elem_ids);
};
goog.exportSymbol('makeTestBodyApp', makeTestBodyApp);

exports = TestBodyApp;
