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

goog.provide('myphysicslab.test.PileTest');

goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.model.ModifiedEuler');
goog.require('myphysicslab.lab.model.RungeKutta');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.engine2D.PileConfig');
goog.require('myphysicslab.test.Engine2DTestRig');
goog.require('myphysicslab.test.TestShapes');

goog.scope(function() {

var CollisionAdvance = myphysicslab.lab.model.CollisionAdvance;
var CollisionHandling = myphysicslab.lab.engine2D.CollisionHandling;
var ContactSim = myphysicslab.lab.engine2D.ContactSim;
var DampingLaw = myphysicslab.lab.model.DampingLaw;
var DebugLevel = myphysicslab.lab.model.CollisionAdvance.DebugLevel;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var Engine2DTestRig = myphysicslab.test.Engine2DTestRig;
var ExtraAccel = myphysicslab.lab.engine2D.ExtraAccel;
var GravityLaw = myphysicslab.lab.model.GravityLaw;
var ModifiedEuler = myphysicslab.lab.model.ModifiedEuler;
var PileConfig = myphysicslab.sims.engine2D.PileConfig;
var RandomLCG = myphysicslab.lab.util.RandomLCG;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var RungeKutta = myphysicslab.lab.model.RungeKutta;
var Shapes = myphysicslab.lab.engine2D.Shapes;
var TestShapes = myphysicslab.test.TestShapes;
var Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var Walls = myphysicslab.lab.engine2D.Walls;

/**  Tests involving piles of many objects with engine2D physics engine.
@constructor
@final
@struct
@private
*/
myphysicslab.test.PileTest = function() {};
var PileTest = myphysicslab.test.PileTest;

/**
* @type {string}
* @const
*/
PileTest.groupName = 'PileTest.';

PileTest.test = function() {
  Engine2DTestRig.schedule(PileTest.pile_config_1_test);
  Engine2DTestRig.schedule(PileTest.near_stable_connected_blocks_pile_test);
  Engine2DTestRig.schedule(PileTest.stable_connected_blocks_pile_test);
  Engine2DTestRig.schedule(PileTest.pile_10_random_blocks);
  Engine2DTestRig.schedule(PileTest.connected_blocks_pile_test);
};

PileTest.testPerformance = function() {
  Engine2DTestRig.schedule(PileTest.pile_10_perf);
  if (0 == 1 && Util.isChrome()) {
    // this test is too slow on non-Chrome browsers
    Engine2DTestRig.schedule(PileTest.pile_20_perf);
  }
  /*  ERN March 13, 2014:  removing these tests because they are slow and aren't
  very different.
  t = Engine2DTestRig.getGlobalValue('ADDITIVE_PILE_SQUARE_BLOCKS', 17.0);
  Engine2DTestRig.schedule(goog.partial(PileTest.additive_pile_square_test, t));
  t = Engine2DTestRig.getGlobalValue('ADDITIVE_PILE_CIRCLE_BLOCKS', 28.0);
  Engine2DTestRig.schedule(goog.partial(PileTest.additive_pile_circle_test, t));
  */
};

/** Two blocks are rigidly connected by two double joints, so that
the blocks cannot move relative to each other, these fall with a few other blocks
into V shaped walls; the connected blocks rotate very quickly after colliding with
the wall.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
PileTest.connected_blocks_pile_setup = function(sim, advance) {
  sim.setSimRect(new DoubleRect(-3.5, -9.2, 3.5, -1));
  sim.addForceLaw(new DampingLaw(0.05, 0.15, sim.getSimList()));
  sim.setShowForces(false);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setRandomSeed(12);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE); // 6/6/15 was VELOCITY
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  var zel = PileConfig.makeVPit(sim);
  var buildRNG = new RandomLCG(4);
  PileConfig.makeRandomBlocks(sim, /*quantity=*/5, /*x=*/-6, /*y=*/-2, buildRNG);
  PileConfig.makeConnectedBlocks(sim, /*x=*/6, /*y=*/7, /*angle=*/Math.PI/8+0.05);
  sim.setElasticity(0.8);
  var gravityLaw = new GravityLaw(10.0);
  sim.addForceLaw(gravityLaw);
  gravityLaw.addBodies(sim.getBodies());
  gravityLaw.setZeroEnergyLevel(zel);
};

/** Test that the joints on the connected blocks stay reasonably tight, despite rapid
rotation.  Turns out that they do slip a bit from rapid rotation.  Because we check
that energy is constant after the pile settles down, it is important that there are no
rocking blocks (because damping is non-zero, rocking results in loss of energy).

The problem is contact forces are not calculated well enough during rapid rotation;
taking smaller steps pretty much eliminates the problem.

To do: make a test showing that smaller steps results in tight joints.

History: Dec 2012 changed results due to the slight change in contact force
calculation; had to recalculate the results. Also changed the initial conditions
slightly so that the result was not a situation where there was a rocking block which
loses energy over time
@return {undefined}
*/
PileTest.connected_blocks_pile_test = function() {
  Engine2DTestRig.testName = PileTest.groupName+'connected_blocks_pile_test';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  PileTest.connected_blocks_pile_setup(sim, advance);
  // run until collisions end; ignore binary searches
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10.0,
      /*expectedVars=*/null, /*tolerance=*/NaN,
      /*expectedEnergyDiff=*/NaN, /*energyTol=*/0,
      /*expectedCollisions=*/-1, /*expectedSearches=*/-1);
  // run another few seconds to have lots of contact calculations as well
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/15.0,
               /*expectedVars=*/null, /*tolerance=*/Util.NaN,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0001,
               /*expectedCollisions=*/0);
  Engine2DTestRig.checkTightJoints(sim, 0.025);
};

/** Stable resting configuration of blocks derived from a particular run of
{@link #connected_blocks_pile_setup}.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
PileTest.stable_connected_blocks_pile_setup = function(sim, advance) {
  sim.setSimRect(new DoubleRect(-3.5, -9.2, 3.5, -1));
  sim.addForceLaw(new DampingLaw(0.05, 0.15, sim.getSimList()));
  sim.setShowForces(false);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setRandomSeed(0);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE); // 6/6/15 was VELOCITY
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  var zel = PileConfig.makeVPit(sim);
  var buildRNG = new RandomLCG(4);
  PileConfig.makeRandomBlocks(sim, /*quantity=*/5, /*x=*/-6, /*y=*/-2, buildRNG);
  PileConfig.makeConnectedBlocks(sim, /*x=*/6, /*y=*/7, /*angle=*/Math.PI/8+0.05);
  sim.setElasticity(0.8);
  var vars = sim.getVarsList();
  vars.setValue(28, -1.307317532081011);
  vars.setValue(29, 3.4568078175222356e-14);
  vars.setValue(30, -7.679563403384621);
  vars.setValue(31, -4.2635556397879164e-14);
  vars.setValue(32, 3.9269908169872414);
  vars.setValue(33, -1.3993648320570288e-15);
  vars.setValue(34, -0.6338649363183791);
  vars.setValue(35, 2.230623502423369e-14);
  vars.setValue(36, -8.36840450674311);
  vars.setValue(37, -9.196703672775336e-15);
  vars.setValue(38, 3.926990816987241);
  vars.setValue(39, -1.8602527688658332e-14);
  vars.setValue(40, -0.863509453866681);
  vars.setValue(41, 2.5327666670337238e-14);
  vars.setValue(42, -7.443359658566195);
  vars.setValue(43, -3.609941383157646e-14);
  vars.setValue(44, 16.493361431346415);
  vars.setValue(45, -3.834636183127082e-14);
  vars.setValue(46, -0.2794896421175775);
  vars.setValue(47, 2.372714000478332e-14);
  vars.setValue(48, -8.88957479858616);
  vars.setValue(49, -5.4309467895987256e-15);
  vars.setValue(50, 21.205750411731103);
  vars.setValue(51, -7.082394166687482e-14);
  vars.setValue(52, 0.1624361210614297);
  vars.setValue(53, 6.727726003835136e-13);
  vars.setValue(54, -8.875842608812114);
  vars.setValue(55, 1.6018768653977866e-12);
  vars.setValue(56, -0.7853981633975663);
  vars.setValue(57, -1.3844587651630329e-12);
  vars.setValue(58, 0.7732428782686775);
  vars.setValue(59, -4.652887853860082e-11);
  vars.setValue(60, -7.805472491546362);
  vars.setValue(61, -4.652474225205978e-11);
  vars.setValue(62, 3.926990816987241);
  vars.setValue(63, 3.6456541219008105e-15);
  vars.setValue(64, 0.19928633339146276);
  vars.setValue(65, 4.859438051687864e-11);
  vars.setValue(66, -7.791391682401767);
  vars.setValue(67, -4.718455523774639e-11);
  vars.setValue(68, 3.9269908169437704);
  vars.setValue(69, -4.409839525917456e-12);
  sim.modifyObjects();
  sim.saveInitialState();

  sim.setRandomSeed(1);
  var gravityLaw = new GravityLaw(10.0);
  sim.addForceLaw(gravityLaw);
  gravityLaw.addBodies(sim.getBodies());
  gravityLaw.setZeroEnergyLevel(zel);
};

/** Test of stable resting configuration derived from a particular run of
{@link #connected_blocks_pile_setup}. So that we can compare running identical
configuration across different browsers and changes to myPhysicsLab software.
@return {undefined}
*/
PileTest.stable_connected_blocks_pile_test = function() {
  Engine2DTestRig.testName = PileTest.groupName+'stable_connected_blocks_pile_test';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  PileTest.stable_connected_blocks_pile_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(11*6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -5, 0, -5, 0, -0.7853982, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 5, 0, -5, 0, 0.7853982, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 10.5, 0, 7.5, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 3, -10.5, 0, 7.5, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 4, -1.3073175, -0, -7.6795634, 0, 3.9269908, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 5, -0.6338649, -0, -8.3684045, 0, 3.9269908, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 6, -0.8635095, -0, -7.4433597, 0, 16.4933614, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 7, -0.2794896, 0, -8.8895748, 0, 21.2057504, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 8, 0.1624361, 0, -8.8758426, 0, -0.7853982, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 9, 0.7732429, -0, -7.8054725, 0, 3.9269908, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 10, 0.1992863, -0, -7.7913917, 0, 3.9269908, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
      /*expectedCollisions=*/0);
  Engine2DTestRig.checkTightJoints(sim, 0.025);
};

/** Close to stable resting configuration of blocks derived from a particular run of
{@link #connected_blocks_pile_setup} (just moments before the pile settles down).
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
PileTest.near_stable_connected_blocks_pile_setup = function(sim, advance) {
  sim.setSimRect(new DoubleRect(-3.5, -9.2, 3.5, -1));
  sim.addForceLaw(new DampingLaw(0.05, 0.15, sim.getSimList()));
  sim.setShowForces(false);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setRandomSeed(0);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE); // 6/6/15 was VELOCITY
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  var zel = PileConfig.makeVPit(sim);
  var buildRNG = new RandomLCG(4);
  PileConfig.makeRandomBlocks(sim, /*quantity=*/5, /*x=*/-6, /*y=*/-2, buildRNG);
  PileConfig.makeConnectedBlocks(sim, /*x=*/6, /*y=*/7, /*angle=*/Math.PI/8+0.05);
  sim.setElasticity(0.8);
  var vars = sim.getVarsList();
  vars.setValue(28, -1.3074166349097716);
  vars.setValue(29, -0.010840525228905605);
  vars.setValue(30, -7.6748558792433785);
  vars.setValue(31, 0.03162290166164498);
  vars.setValue(32, 3.9269569334324403);
  vars.setValue(33, 0.004326577793446015);
  vars.setValue(34, -0.6295172375406212);
  vars.setValue(35, -0.12156323274219026);
  vars.setValue(36, -8.363693937673977);
  vars.setValue(37, -0.11589631970547537);
  vars.setValue(38, 3.9243199960788253);
  vars.setValue(39, -0.07310382168395342);
  vars.setValue(40, 0.31893418138882307);
  vars.setValue(41, -0.6319951813598994);
  vars.setValue(42, -6.8097160566956365);
  vars.setValue(43, 2.1006107619247305);
  vars.setValue(44, 15.6167669356595);
  vars.setValue(45, 6.9807796520379455);
  vars.setValue(46, -0.2794020111788371);
  vars.setValue(47, 0.005559355507812818);
  vars.setValue(48, -8.889415521500014);
  vars.setValue(49, 0.012931603383049635);
  vars.setValue(50, 21.205702274040966);
  vars.setValue(51, -0.02672084560754362);
  vars.setValue(52, 0.16264515275973984);
  vars.setValue(53, 0.03730970034660824);
  vars.setValue(54, -8.875487287160695);
  vars.setValue(55, 0.0468739543956697);
  vars.setValue(56, -0.7852734225490905);
  vars.setValue(57, 0.017531522195257027);
  vars.setValue(58, 0.7681938978094821);
  vars.setValue(59, -0.22265049769722722);
  vars.setValue(60, -7.787103915157201);
  vars.setValue(61, 0.20258649058167544);
  vars.setValue(62, 3.89184653938446);
  vars.setValue(63, 0.4490870396661657);
  vars.setValue(64, 0.19458710272314095);
  vars.setValue(65, -0.23157678224607303);
  vars.setValue(66, -7.753146072367401);
  vars.setValue(67, -0.05129863223356834);
  vars.setValue(68, 3.89184653938771);
  vars.setValue(69, 0.4490870396647062);
  sim.modifyObjects();
  sim.saveInitialState();

  sim.setRandomSeed(1);
  var gravityLaw = new GravityLaw(10.0);
  sim.addForceLaw(gravityLaw);
  gravityLaw.addBodies(sim.getBodies());
  gravityLaw.setZeroEnergyLevel(zel);
};

/** Test of close-to-stable resting configuration derived from a particular run of
{@link #connected_blocks_pile_setup} (just moments before the pile settles down).
So that we can compare running identical configuration across different browsers and
changes to myPhysicsLab software.

<h2>TO DO</h2>
Figure out why FireFox and Safari have such large SMALL_IMPACTS (like as big as 0.01 or
0.02) in this test. Chrome doesn't have these. What's different between them?
Presumably the small-impacts are due to joint slippage.
Looks like the small body 8 is getting kicked by those impulses and that is why it
is still moving at the time of these test results.

@return {undefined}
*/
PileTest.near_stable_connected_blocks_pile_test = function() {
  Engine2DTestRig.testName =
     PileTest.groupName + 'near_stable_connected_blocks_pile_test';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  PileTest.near_stable_connected_blocks_pile_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(11*6);
  if (Util.isChrome()) {
    Engine2DTestRig.setBodyVars(sim, vars, 0, -5, 0, -5, 0, -0.7853982, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 1, 5, 0, -5, 0, 0.7853982, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 2, 10.5, 0, 7.5, 0, 0, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 3, -10.5, 0, 7.5, 0, 0, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 4, -1.3073175, 0, -7.6795634, -0, 3.9269908, -0);
    Engine2DTestRig.setBodyVars(sim, vars, 5, -0.6338649, -0, -8.3684045, -0, 3.9269908, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 6, -0.48321, -0, -7.392295, -0, 16.4933614, -0);
    Engine2DTestRig.setBodyVars(sim, vars, 7, -0.2794896, 0, -8.8895748, -0, 21.2057504, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 8, 0.1624361, 0, -8.8758426, -0, -0.7853982, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 9, 0.773236, -0, -7.8054793, -0, 3.9269908, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 10, 0.1992931, 0, -7.7913985, -0, 3.9269908, -0);
  } else {
    Engine2DTestRig.setBodyVars(sim, vars, 0, -5, 0, -5, 0, -0.7853982, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 1, 5, 0, -5, 0, 0.7853982, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 2, 10.5, 0, 7.5, 0, 0, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 3, -10.5, 0, 7.5, 0, 0, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 4, -1.3073175, 0, -7.6795634, -0, 3.9269908, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 5, -0.6338649, 0, -8.3684045, -0, 3.9269908, -0);
    Engine2DTestRig.setBodyVars(sim, vars, 6, -0.8635095, 0, -7.4433597, -0, 16.4933614, 0);
    Engine2DTestRig.setBodyVars(sim, vars, 7, -0.2794896, 0, -8.8895748, 0, 21.2057504, -0);
    Engine2DTestRig.setBodyVars(sim, vars, 8, 0.1624361, 0.0000002, -8.8758426, 0.0000004, -0.7853982, -0.0000004);
    Engine2DTestRig.setBodyVars(sim, vars, 9, 0.7732544, -0, -7.8054609, 0, 3.9269908, -0);
    Engine2DTestRig.setBodyVars(sim, vars, 10, 0.1992748, -0, -7.7913801, 0, 3.9269908, -0);
  }
  // run until collisions end; ignore binary searches
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/6.0,
      /*expectedVars=*/vars, /*tolerance=*/0.001,
      /*expectedEnergyDiff=*/NaN, /*energyTol=*/0,
      /*expectedCollisions=*/-1, /*expectedSearches=*/-1);
  // run another few seconds to have lots of contact calculations as well
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10.0,
               /*expectedVars=*/null, /*tolerance=*/Util.NaN,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
               /*expectedCollisions=*/0);
  Engine2DTestRig.checkTightJoints(sim, 0.025);
};

/** This configuration caused a 'checkNoneCollide' exception in versions prior to
May 12, 2016. Originally found in PileApp after clicking the 'random' button once.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
PileTest.pile_config_1_setup = function(sim, advance) {
  sim.setSimRect(new DoubleRect(-7, 0, 7, 8));
  sim.addForceLaw(new DampingLaw(0.05, 0.15, sim.getSimList()));
  sim.setShowForces(false);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setRandomSeed(0);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE); // 6/6/15 was VELOCITY
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  advance.setJointSmallImpacts(false);
  advance.setTimeStep(0.025);
  var buildRNG = new RandomLCG(594074265);
  var zel = PileConfig.makeVPit(sim, 9.348706704297266);
  var half = 3;
  var rest = 3;
  PileConfig.makeRandomBlocks(sim, /*quantity=*/rest, /*x=*/-9.9, /*y=*/19, buildRNG);
  PileConfig.makeRandomBlocks(sim, /*quantity=*/half, /*x=*/-9, /*y=*/16, buildRNG);
  PileConfig.makeConnectedBlocks(sim, /*x=*/3, /*y=*/21, /*angle=*/0);
  sim.setElasticity(0.8);
  var vars = sim.getVarsList();
  vars.setValue(28, -4.826036961610339);
  vars.setValue(29, 5.507262977202934);
  vars.setValue(30, 6.3686904268363635);
  vars.setValue(31, -7.953916554586297);
  vars.setValue(32, -2.4297073283893753);
  vars.setValue(33, -3.2910792690296575);
  vars.setValue(34, -0.39136366049574994);
  vars.setValue(35, 11.596594391854405);
  vars.setValue(36, 6.401989888500372);
  vars.setValue(37, -6.3050312680892455);
  vars.setValue(38, 2.833546728939748);
  vars.setValue(39, 11.84282384112968);
  vars.setValue(40, -2.6677254408578985);
  vars.setValue(41, 7.500061085685241);
  vars.setValue(42, 4.741186660019);
  vars.setValue(43, -7.976266185005914);
  vars.setValue(44, 8.581332736951099);
  vars.setValue(45, 12.121849497962163);
  vars.setValue(46, -0.5750827056429556);
  vars.setValue(47, 11.45349352174985);
  vars.setValue(48, 1.8528786215208863);
  vars.setValue(49, -2.623975579277876);
  vars.setValue(50, -4.0009341616207355);
  vars.setValue(51, -11.167073162011471);
  vars.setValue(52, 0.4901868773177362);
  vars.setValue(53, 10.209045158895574);
  vars.setValue(54, 0.8991047151294028);
  vars.setValue(55, 9.426218453147095);
  vars.setValue(56, -1.0250437996613715);
  vars.setValue(57, 58.10877825300471);
  vars.setValue(58, 0.38386358504151985);
  vars.setValue(59, -1.1422881143836392);
  vars.setValue(60, 3.346206103148756);
  vars.setValue(61, 6.623070984882051);
  vars.setValue(62, 23.57586164417926);
  vars.setValue(63, 35.37119888296379);
  vars.setValue(64, -0.674508123401993);
  vars.setValue(65, -7.960427953540814);
  vars.setValue(66, 4.248616367886464);
  vars.setValue(67, 0.683655285060861);
  vars.setValue(68, -2.0251585739061584);
  vars.setValue(69, -8.34224694613519);
  vars.setValue(70, -1.2106565077697318);
  vars.setValue(71, -9.494215020773796);
  vars.setValue(72, 4.065566370010308);
  vars.setValue(73, 5.146494032387025);
  vars.setValue(74, -2.0251585739061584);
  vars.setValue(75, -8.34224694613518);
  sim.modifyObjects();
  sim.saveInitialState();
  sim.setRandomSeed(0);
  var gravityLaw = new GravityLaw(10.0);
  sim.addForceLaw(gravityLaw);
  gravityLaw.addBodies(sim.getBodies());
  gravityLaw.setZeroEnergyLevel(zel);
};

/** Test of configuration that caused a 'checkNoneCollide' exception in versions prior
to May 12, 2016.
@return {undefined}
*/
PileTest.pile_config_1_test = function() {
  Engine2DTestRig.testName = PileTest.groupName+'pile_config_1_test';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  PileTest.pile_config_1_setup(sim, advance);
  // run until collisions are done; ignore binary searches
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/9.0,
      /*expectedVars=*/null, /*tolerance=*/NaN,
      /*expectedEnergyDiff=*/NaN, /*energyTol=*/0,
      /*expectedCollisions=*/-1, /*expectedSearches=*/-1);
  // run another few seconds to have lots of contact calculations as well
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/15.0,
               /*expectedVars=*/null, /*tolerance=*/Util.NaN,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
               /*expectedCollisions=*/0);
  Engine2DTestRig.checkTightJoints(sim, 0.025);
};

/**
* @param {!ContactSim} sim
* @param {!CollisionAdvance} advance
* @export
*/
PileTest.pile_10_random_blocks_setup = function(sim, advance) {
  sim.setSimRect(new DoubleRect(-3.5, -9.2, 3.5, -1));
  sim.addForceLaw(new DampingLaw(0.05, 0.15, sim.getSimList()));
  sim.setShowForces(false);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  var buildSeed = 0;
  var seed = 13;
  //console.log(' buildSeed= '+buildSeed+'  seed = '+seed);
  sim.setRandomSeed(seed);
  var zel = PileConfig.makeVPit(sim);
  var buildRNG = new RandomLCG(buildSeed);
  PileConfig.makeRandomBlocks(sim, /*n=*/10, /*x=*/-5.5, /*y=*/-2,
      buildRNG);
  sim.setElasticity(0.5);
  var gravityLaw = new GravityLaw(3.0);
  sim.addForceLaw(gravityLaw);
  gravityLaw.addBodies(sim.getBodies());
  gravityLaw.setZeroEnergyLevel(zel);
};

/** Runs pile_10_random_blocks_setup.
@return {undefined}
*/
PileTest.pile_10_random_blocks = function() {
  Engine2DTestRig.testName = PileTest.groupName+'pile_10_random_blocks';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  PileTest.pile_10_random_blocks_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(14*6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -5, 0, -5, 0, -0.7853982, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 5, 0, -5, 0, 0.7853982, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, 10.5, 0, 7.5, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 3, -10.5, 0, 7.5, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 4, -1.4688341, 0, -7.366921, -0, 5.507218, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 5, -1.2888741, 0, -6.8611893, -0, 2.3604327, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 6, -1.0893343, 0, -7.5132601, -0, 0.7919455, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 7, -0.5829513, 0, -8.0161773, -0, 0.7896626, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 8, -0.0678191, -0, -8.6057224, -0, 0.7853285, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 9, 0.1123147, -0, -7.4965551, -0, -0.771069, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 10, 0.0843676, 0, -7.8743626, -0, 0.8066319, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 11, 0.7205631, 0, -8.2682827, -0, 0.7924107, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 12, 0.7795149, 0, -7.7446799, 0, 3.9304584, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 13, 0.3485821, 0, -6.9817453, -0, 2.3673243, -0);
  var startTime = Util.systemTime();
  // run until all collisions are done and energy is stable.
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/8.0,
              /*expectedVars=*/vars, /*tolerance=*/0.01);
  // run another few seconds to have lots of contact calculations as well
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10.0,
               /*expectedVars=*/null, /*tolerance=*/Util.NaN,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
               /*expectedCollisions=*/0); // new Jan '13: test expected collisions
  var s = ' collisions='+advance.getCollisionTotals().getCollisions()
      +', steps='+advance.getCollisionTotals().getSteps()
      +', contacts='+sim.getNumContacts();
  Engine2DTestRig.myPrintln('info: '+Engine2DTestRig.testName+s);
};

/** Performance test that runs pile_10_random_blocks; this is a stress test for
contact force calculation.
*/
PileTest.pile_10_perf = function() {
  var testName = 'pile_10_perf';
  var expected = Engine2DTestRig.perfExpected(testName);
  var startTime = Util.systemTime();
  PileTest.pile_10_random_blocks();
  var duration = Util.systemTime() - startTime;
  Engine2DTestRig.testName = PileTest.groupName+testName;
  var s = Engine2DTestRig.perfResult(duration, expected);
  var timeLimit = Engine2DTestRig.getPerfLimit(expected);
  Engine2DTestRig.reportTestResults(duration < timeLimit, 'performance', s);
};

/** Makes a V-shaped set of walls for shapes to fall into, and sets various simulation
parameters.
* @param {!ContactSim} sim
* @param {!CollisionAdvance} advance
* @param {number} damping
* @param {number} gravity
* @private
*/
PileTest.pile_make_v_pit = function(sim, advance, damping, gravity) {
  sim.addForceLaw(new DampingLaw(damping, 0.15, sim.getSimList()));
  sim.setShowForces(false);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  sim.setRandomSeed(14);
  var zel = PileConfig.makeVPit(sim);
  var gravityLaw = new GravityLaw(gravity, sim.getSimList());
  sim.addForceLaw(gravityLaw);
  gravityLaw.setZeroEnergyLevel(zel);
};

/**
* @param {!ContactSim} sim
* @param {!CollisionAdvance} advance
* @export
*/
PileTest.pile_uniform_balls_setup = function(sim, advance) {
  PileTest.pile_make_v_pit(sim, advance, /*damping=*/0.05, /*gravity=*/3.0);
  var rect = new DoubleRect(-9, 5, 9, 20);
  PileConfig.makeUniformBlocks(sim, rect, /*circular=*/true, /*size=*/2.0,
      /*buffer=*/0.2, /*limit=*/10);
  sim.setElasticity(0.8);
};

/**
* @param {!ContactSim} sim
* @param {!CollisionAdvance} advance
* @export
*/
PileTest.pile_uniform_blocks_setup = function(sim, advance) {
  PileTest.pile_make_v_pit(sim, advance, /*damping=*/0.05, /*gravity=*/3.0);
  var rect = new DoubleRect(-9, 5, 9, 20);
  PileConfig.makeUniformBlocks(sim, rect, /*circular=*/false, /*size=*/2.0,
      /*buffer=*/0.2, /*limit=*/10);
  sim.setElasticity(0.8);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
PileTest.pile_20_random_blocks_setup = function(sim, advance) {
  sim.setSimRect(new DoubleRect(-3.5, -9.2, 3.5, -1));
  sim.addForceLaw(new DampingLaw(0.05, 0.15, sim.getSimList()));
  sim.setShowForces(false);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  var buildSeed = 0;
  var seed = 14;
  //console.log(' buildSeed= '+buildSeed+'  seed = '+seed);
  sim.setRandomSeed(seed);
  var zel = PileConfig.makeVPit(sim);
  var buildRNG = new RandomLCG(buildSeed);
  PileConfig.makeRandomBlocks(sim, /*n=*/10, /*x=*/-5.5, /*y=*/-2, buildRNG);
  PileConfig.makeRandomBlocks(sim, /*n=*/10, /*x=*/-6, /*y=*/-0.5, buildRNG);
  sim.setElasticity(0.5);
  var gravityLaw = new GravityLaw(3.0);
  sim.addForceLaw(gravityLaw);
  gravityLaw.addBodies(sim.getBodies());
  gravityLaw.setZeroEnergyLevel(zel);
};

/** Runs pile_20_random_blocks_setup.
@return {undefined}
*/
PileTest.pile_20_random_blocks = function() {
  Engine2DTestRig.testName = PileTest.groupName+'pile_20_random_blocks';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  PileTest.pile_20_random_blocks_setup(sim, advance);
  if (!Util.isChrome()) {
    // this test takes too long on non-Chrome browsers
    throw new Error();
  }
  var startTime = Util.systemTime();
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/9.0,
              /*expectedVars=*/null, /*tolerance=*/NaN);
  // run another few seconds to have lots of contact calculations as well
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/12.0,
               /*expectedVars=*/null, /*tolerance=*/Util.NaN,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
               /*expectedCollisions=*/0);
  var s = ' collisions='+advance.getCollisionTotals().getCollisions()
      +', steps='+advance.getCollisionTotals().getSteps()
      +', contacts='+sim.getNumContacts();
  Engine2DTestRig.myPrintln('info: '+Engine2DTestRig.testName+s);
};

/** Performance test that runs pile_20_random_blocks; this is a stress test for
contact force calculation.

Note that the performance measurement is only valid for comparing different
versions of code if the same results are found in each run.  Slight changes in
collision handling or other algorithms can completely change the resulting positions
of the blocks.  This can result in different runs having different numbers of
contacts which is the factor that most affects performance because the number
of contacts determines the size of the matrix that is solve for finding
contact forces, and this is currently an O(n^3) process.

Java vs. Javascript:  The test results (and setup) are different than in the Java
version for a couple of reasons.  1) because Java and Javascript give slightly different
results from Math.cos (see DoubleMath_test.js) and because this test is so sensitive
with all the collisions, there is no way to match the Java results.  2) The setup was
changed so that the blocks are not moving after 7 or 8 seconds.

@return {undefined}
*/
PileTest.pile_20_perf = function() {
  var testName = 'pile_20_perf';
  var expected = Engine2DTestRig.perfExpected(testName);
  var startTime = Util.systemTime();
  PileTest.pile_20_random_blocks();
  var duration = Util.systemTime() - startTime;
  Engine2DTestRig.testName = PileTest.groupName+testName;
  var s = Engine2DTestRig.perfResult(duration, expected);
  var timeLimit = Engine2DTestRig.getPerfLimit(expected);
  Engine2DTestRig.reportTestResults(duration < timeLimit, 'performance', s);
};

/**  Setup for additive_pile_test.  The name ends with underscore to prevent
this test from showing up in the TestViewer menu of available tests (because
the additive_pile_test is added to over time).
* @param {!ContactSim} sim
* @param {!CollisionAdvance} advance
* @private
*/
PileTest.additive_pile_setup_ = function(sim, advance) {
  sim.addForceLaw(new DampingLaw(0.05, 0.15, sim.getSimList()));
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setDistanceTol(0.01);
  sim.setCollisionAccuracy(0.6);
  sim.setRandomSeed(99999);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  var zel = PileConfig.makeVPit(sim);
  sim.addForceLaw(new GravityLaw(3.0, sim.getSimList()));
};

/** Adds same sized square or round blocks to a pile until performance degrades
to the point that the sim is barely keeping up with real time.
@param {boolean} square  true means make a square block, false means make a round ball
@param {number} start_num_blocks the number of blocks to quickly add at the start, which
  helps to speed up the running time of this test
@return {number} the number of blocks at the point where performance started to degrade
@private
*/
PileTest.additive_pile_test = function(square, start_num_blocks) {
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  PileTest.additive_pile_setup_(sim, advance);
  var simTime = 0;
  var TIME_SPAN = 5.0;
  var LIMIT_TIME = 0.9*TIME_SPAN;
  var num_blocks = 0;
  var startTime = Util.systemTime();
  // feed in blocks at start more quickly, to speed up the test.
  while (num_blocks < start_num_blocks) {
    simTime += 1.0;
    num_blocks++;
    PileTest.add_block_and_run(sim, advance, simTime, square);
  }
  while (true) {
    simTime += TIME_SPAN;
    num_blocks++;
    var realTime = PileTest.add_block_and_run(sim, advance, simTime, square);
    Engine2DTestRig.myPrintln('num_bodies='+num_blocks
        +' time='+Util.NF2(realTime)
        +' limit='+Util.NF2(LIMIT_TIME)
        +' totalTime='+Util.NF5(Util.systemTime() - startTime)
        +' contacts='+sim.getNumContacts()
        );
    if (realTime > LIMIT_TIME) {
      break;
    }
  }
  return num_blocks;
};

/**  Add a block and run the simulation till the given time.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance  the AdvanceStrategy for
    advancing the simulation
@param {number} runUntil the simulation time to run until
@param {boolean} square  true means make a square block, false means make a round ball
@return {number} the elapsed real time that it took to run the simulation to the given time
@private
*/
PileTest.add_block_and_run = function(sim, advance, runUntil, square) {
  var startTime = Util.systemTime();
  var p = square ? Shapes.makeBlock(1.0, 1.0, 'block')
                 : Shapes.makeBall(0.5, 'ball');
  // move a bit right of center and tilted, to avoid 'perfect' bounces
  p.setPosition(new Vector(0.5,  0),  0.5);
  p.setElasticity(0.5);
  sim.addBody(p);
  // run till requested time, without any expected results
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/runUntil);
  return (Util.systemTime() - startTime);
};

/** Adds same sized square blocks to a pile until performance degrades
to the point that the sim is barely keeping up with real time
@param {number} expectedBlocks
*/
PileTest.additive_pile_square_test = function(expectedBlocks) {
  Engine2DTestRig.testName = PileTest.groupName+'additive_pile_square_test';
  var startTime = Util.systemTime();
  var num_blocks = PileTest.additive_pile_test(/*square=*/true,
    /*start_num_blocks=*/expectedBlocks-3);
  var totalTime = Util.systemTime() - startTime;
  var s = 'reached '+num_blocks
        +' blocks; expected='+expectedBlocks
        +' totalTime='+Util.NF5(totalTime);
  Engine2DTestRig.myPrintln('additive_pile_square_test '+s);
  Engine2DTestRig.reportTestResults(num_blocks >= expectedBlocks, 'performance', s);
};

/** Adds same sized round balls to a pile until performance degrades
to the point that the sim is barely keeping up with real time
@param {number} expectedBlocks
*/
PileTest.additive_pile_circle_test = function(expectedBlocks) {
  Engine2DTestRig.testName = PileTest.groupName+'additive_pile_circle_test';
  var startTime = Util.systemTime();
  var num_blocks = PileTest.additive_pile_test(/*square=*/false,
      /*start_num_blocks=*/expectedBlocks-3);
  var totalTime = Util.systemTime() - startTime;
  var s = 'reached '+num_blocks
        +' blocks; expected='+expectedBlocks
        +' totalTime='+Util.NF5(totalTime);
  Engine2DTestRig.myPrintln('additive_pile_circle_test '+s);
  Engine2DTestRig.reportTestResults(num_blocks >= expectedBlocks, 'performance', s);
};

}); // goog.scope
