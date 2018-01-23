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

goog.provide('myphysicslab.test.StraightStraightTest');

goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.model.Gravity2Law');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.RungeKutta');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.RandomLCG');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.test.Engine2DTestRig');
goog.require('myphysicslab.test.TestShapes');

goog.scope(function() {

const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
const CollisionHandling = goog.module.get('myphysicslab.lab.engine2D.CollisionHandling');
const ContactSim = goog.module.get('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
var DisplayShape = myphysicslab.lab.view.DisplayShape;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DTestRig = myphysicslab.test.Engine2DTestRig;
const ExtraAccel = goog.module.get('myphysicslab.lab.engine2D.ExtraAccel');
const Gravity2Law = goog.module.get('myphysicslab.lab.model.Gravity2Law');
const GravityLaw = goog.module.get('myphysicslab.lab.model.GravityLaw');
const Polygon = goog.module.get('myphysicslab.lab.engine2D.Polygon');
const RandomLCG = goog.module.get('myphysicslab.lab.util.RandomLCG');
const RigidBody = goog.module.get('myphysicslab.lab.engine2D.RigidBody');
const RungeKutta = goog.module.get('myphysicslab.lab.model.RungeKutta');
const Shapes = goog.module.get('myphysicslab.lab.engine2D.Shapes');
var TestShapes = myphysicslab.test.TestShapes;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
const Walls = goog.module.get('myphysicslab.lab.engine2D.Walls');

/** Tests interactions between polygons with straight edges only.

The 'six_block' tests were created while debugging the engine2D's algorithm for
calculating contact forces. While these tests look rather similar, they represent
particular test cases that caused failures in the past.

@constructor
@final
@struct
@private
*/
myphysicslab.test.StraightStraightTest = function() {};

var StraightStraightTest = myphysicslab.test.StraightStraightTest;

StraightStraightTest.test = function() {
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_settle);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_settle2);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_1);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_2);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_3);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_4);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_5);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_6);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_7);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_8);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_9);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_10);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_11);
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_12);
  Engine2DTestRig.schedule(StraightStraightTest.hexagon_1);
  Engine2DTestRig.schedule(StraightStraightTest.block_block_contact_1);
  Engine2DTestRig.schedule(StraightStraightTest.block_block_contact_2);
  Engine2DTestRig.schedule(StraightStraightTest.block_block_contact_2b);
  Engine2DTestRig.schedule(StraightStraightTest.ngon_block);
  Engine2DTestRig.schedule(StraightStraightTest.diamonds);
  Engine2DTestRig.schedule(StraightStraightTest.one_block1);
  Engine2DTestRig.schedule(StraightStraightTest.one_block2);
  Engine2DTestRig.schedule(StraightStraightTest.fast_close);
  Engine2DTestRig.schedule(StraightStraightTest.corner_collision);
  Engine2DTestRig.schedule(StraightStraightTest.rounded_corner_collision);
  Engine2DTestRig.schedule(StraightStraightTest.oblique_corner_collision);
  Engine2DTestRig.schedule(StraightStraightTest.acute_corners);
};

/**
* @type {string}
* @const
*/
StraightStraightTest.groupName = 'StraightStraightTest.';


/**
@return {undefined}
*/
StraightStraightTest.testPerformance = function() {
  Engine2DTestRig.schedule(StraightStraightTest.six_blocks_perf);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@param {number=} damping
@private
*/
StraightStraightTest.commonSetup1 = function(sim, advance, damping) {
  damping = damping === undefined ? 0 : damping;
  sim.addForceLaw(new DampingLaw(damping, 0.15, sim.getSimList()));
  sim.setDistanceTol(0.01);
  sim.setVelocityTol(0.5);
  sim.setCollisionAccuracy(0.6);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  sim.setRandomSeed(99999);
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  advance.setDiffEqSolver(new RungeKutta(sim));
};

/** Performance test that runs the six_blocks_settle test.
*/
StraightStraightTest.six_blocks_perf = function() {
  var testName = 'six_blocks_perf';
  var expected = Engine2DTestRig.perfExpected(testName);
  var startTime = Util.systemTime();
  StraightStraightTest.six_blocks_settle();
  Engine2DTestRig.testName = StraightStraightTest.groupName+testName;
  var endTime = Util.systemTime();
  var duration = endTime - startTime;
  var s = Engine2DTestRig.perfResult(duration, expected);
  var timeLimit = Engine2DTestRig.getPerfLimit(expected);
  Engine2DTestRig.reportTestResults(duration <= timeLimit, 'performance', s);
};

/** Six blocks fall onto the ground and settle down (mostly) after 6 seconds.
One of the blocks has less mass than the others.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_settle_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  sim.setCollisionAccuracy(0.6);
  for (var i=0; i<6; i++) {
    var p = Shapes.makeBlock(1, 3, 'block'+i);
    if (i==0)
      p.setMass(0.6);
    p.setPosition(new Vector(-4.4+i*1.73, -3+(i%2)*2.0), Math.PI*(0.30 - i*0.15));
    sim.addBody(p);
  }
  var gravity = new GravityLaw(5.0, sim.getSimList());
  sim.setElasticity(0.6);
  sim.addForceLaw(gravity);
  var zel = Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/1.0);
  gravity.setZeroEnergyLevel(zel);
};

/** Tests scenario with six blocks falling onto ground; ensures that no further
collisions happen after blocks settle on the ground.
@return {undefined}
*/
StraightStraightTest.six_blocks_settle = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_settle';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  //advance.setDebugLevel(CollisionAdvance.DebugLevel.OPTIMAL);
  StraightStraightTest.six_blocks_settle_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -4.4957656, 0, -5.4912852, -0, 1.570724, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, -2.487432, -0, -4.4929667, 0, 0.0006014, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -1.4838306, -0, -4.4927091, -0, -0.0006352, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 3, 0.6040017, -0, -4.9812241, 0, -1.2003959, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 4, 3.4838254, 0, -5.4911445, -0, -1.5701177, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 5, 5.4927459, -0, -4.4907594, 0, -3.1415895, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/6.2,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // run for a few more seconds: there should be no more collision searches
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/9.0,
      /*expectedVars=*/null, /*tolerance=*/Util.NaN,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
      /*expectedCollisions=*/0);
};

/** Same as six_blocks_settle_setup, but using 'velocity and distance' extra accel calc
policy.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_settle_2_setup = function(sim, advance) {
  StraightStraightTest.six_blocks_settle_setup(sim, advance);
  // these are the unusual conditions
  advance.setJointSmallImpacts(false);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
};

/** Using 'velocity and distance extra accel calc' policy, tests scenario with six
blocks falling onto ground; ensures that no further collisions happen after blocks
settle on the ground; and checks that the contact distance is close to target gap
at all contacts.
@return {undefined}
*/
StraightStraightTest.six_blocks_settle2 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_settle2';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_settle_2_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -4.495, -0, -5.495, 0, 1.5707963, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, -2.49, -0, -4.495, 0, -0, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -1.485, 0, -4.495, 0, -0, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 3, 0.5994774, 0, -4.9893409, -0, -1.2031983, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 4, 3.49, -0, -5.495, 0, -1.5707963, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 5, 5.495, -0, -4.495, 0, -3.1415927, 0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/6.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // run for a few more seconds: there should be no more collision searches
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/12.0,
      /*expectedVars=*/null, /*tolerance=*/Util.NaN,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.1,
      /*expectedCollisions=*/0);
  // the contact distances should all be zero
  Engine2DTestRig.checkContactDistances(sim, 1E-8);
};

/** Six blocks start in a configuration on the ground, with one block being
nearly vertical and leaning and rocking on neighbors.
History:  previously resulted in a stuck state with many messages about
"probably didn't find a dependent row, zmax=1.0" where the zmax was large
(around 1 or so).  This led to changes in how contact forces are solved for,
specifically the `UtilityCollision.subsetCollisions1()` method was invented
so that only related groups of contacts were solved for together.
This helps to avoid throwing away important contacts in the process of making
the A matrix be non-singular.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_1_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  var zel = Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/1.0);
  for (var i=0; i<6; i++) {
    var p = Shapes.makeBlock(1, 3);
    if (i == 0) {
      var block1 = p;
    }
    sim.addBody(p);
  }
  sim.setElasticity(0.8);
  var gravity = new GravityLaw(3.0, sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel);
  if (!goog.isDefAndNotNull(block1))
    throw new Error();
  var idx = block1.getVarsIndex() - 24;
  var vars = sim.getVarsList();
  vars.setValue(idx + 24, -4.490076631581924);
  vars.setValue(idx + 25, 2.0679515313825692E-25);
  vars.setValue(idx + 26, -5.490392097196945);
  vars.setValue(idx + 27, 0.0);
  vars.setValue(idx + 28, 1.570728988355649);
  vars.setValue(idx + 29, -1.6543612251060553E-24);
  vars.setValue(idx + 30, -1.5396242471983494);
  vars.setValue(idx + 31, -4.0943711582070005E-5);
  vars.setValue(idx + 32, -4.4898881738213126);
  vars.setValue(idx + 33, 8.353404996231836E-4);
  vars.setValue(idx + 34, -2.6278523346345535E-4);
  vars.setValue(idx + 35, -0.001671999187052211);
  vars.setValue(idx + 36, -0.5296767271003119);
  vars.setValue(idx + 37, 9.92762060763532E-4);
  vars.setValue(idx + 38, -4.49018008838388);
  vars.setValue(idx + 39, 0.0011794589874429395);
  vars.setValue(idx + 40, -3.01799353204607E-4);
  vars.setValue(idx + 41, -0.0023610557776990396);
  vars.setValue(idx + 42, 1.4801168847646147);
  vars.setValue(idx + 43, -9.352577078533856E-5);
  vars.setValue(idx + 44, -5.490056858917946);
  vars.setValue(idx + 45, 0.0011493692932998238);
  vars.setValue(idx + 46, -1.5708341618266073);
  vars.setValue(idx + 47, 1.8706997138135463E-4);
  vars.setValue(idx + 48, -2.638125069016346);
  vars.setValue(idx + 49, -0.045351341609523976);
  vars.setValue(idx + 50, -3.5270071804900893);
  vars.setValue(idx + 51, -0.0024453038919747434);
  vars.setValue(idx + 52, 9.271714397689529);
  vars.setValue(idx + 53, -0.07484736093054672);
  vars.setValue(idx + 54, 4.490094678411976);
  vars.setValue(idx + 55, 2.098397952794706E-12);
  vars.setValue(idx + 56, -5.4902652470048166);
  vars.setValue(idx + 57, 6.294899545886009E-12);
  vars.setValue(idx + 58, -1.5708101952854403);
  vars.setValue(idx + 59, -4.1966191264251884E-12);
  sim.modifyObjects();
};

/** Tests scenario with six blocks on ground with one leaning;
ensures that no further collisions happen, and energy is constant.
@return {undefined}
*/
StraightStraightTest.six_blocks_1 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_1_setup(sim, advance);
  var e1 = sim.getEnergyInfo().getTotalEnergy();
  var vars = Engine2DTestRig.makeVars(10*6);
  Engine2DTestRig.setBodyVars(sim, vars, 4, -4.4900766, -0, -5.4903921, -0, 1.570729, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 5, -1.5402974, -0, -4.4900519, -0, 0.0000647, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 6, -0.5301101, 0, -4.4902639, 0, -0.0001342, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 7, 1.4799843, 0, -5.4906737, 0, -1.5703991, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 8, -2.6267689, -0.0085598, -3.5257485, -0.0011358, 9.2914788, -0.0136865);
  Engine2DTestRig.setBodyVars(sim, vars, 9, 4.4900947, 0, -5.4902652, -0, -1.5708102, -0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
          /*expectedVars=*/vars, /*tolerance=*/0.00001,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.01,
          /*expectedCollisions=*/0);
};

/* Six blocks, causes a matrix solve exception.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_2_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  var zel = Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/1.0);
  for (var i=0; i<6; i++) {
    var p = Shapes.makeBlock(1, 3);
    if (i == 0) {
      var block1 = p;
    }
    sim.addBody(p);
  }
  sim.setElasticity(0.8);
  var gravity = new GravityLaw(3.0, sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel);
  if (!goog.isDefAndNotNull(block1))
    throw new Error();
  var idx = block1.getVarsIndex() - 24;
  var vars = sim.getVarsList();
  vars.setValue(idx + 24, -4.4894873151917505);
  vars.setValue(idx + 25, -0.0012904083411035517);
  vars.setValue(idx + 26, -4.69275495630202);
  vars.setValue(idx + 27, 0.0023506491727077173);
  vars.setValue(idx + 28, -0.9299774575604993);
  vars.setValue(idx + 29, 0.0026017616603113036);
  vars.setValue(idx + 30, -2.5375949607881076);
  vars.setValue(idx + 31, -2.7149137000663433E-7);
  vars.setValue(idx + 32, -5.490771425296472);
  vars.setValue(idx + 33, -4.228005163013724E-17);
  vars.setValue(idx + 34, -1.5707396072505904);
  vars.setValue(idx + 35, 2.2280936979728353E-17);
  vars.setValue(idx + 36, -0.7580905729683218);
  vars.setValue(idx + 37, 0.14519873288155424);
  vars.setValue(idx + 38, -4.481080855910306);
  vars.setValue(idx + 39, -9.649486163105028E-8);
  vars.setValue(idx + 40, 1.5706622204638165);
  vars.setValue(idx + 41, -5.554390939812269E-6);
  vars.setValue(idx + 42, 0.4717428399071226);
  vars.setValue(idx + 43, -2.714913700110196E-7);
  vars.setValue(idx + 44, -5.490966275583268);
  vars.setValue(idx + 45, -3.0357660829594124E-18);
  vars.setValue(idx + 46, -1.5708543703747895);
  vars.setValue(idx + 47, 1.4094628242311558E-18);
  vars.setValue(idx + 48, 3.4816552587524017);
  vars.setValue(idx + 49, 2.6673767701546057E-9);
  vars.setValue(idx + 50, -5.490142709133593);
  vars.setValue(idx + 51, 1.3040211547931557E-5);
  vars.setValue(idx + 52, 1.5708531547330657);
  vars.setValue(idx + 53, -3.642381535273742E-13);
  vars.setValue(idx + 54, 5.491657707771588);
  vars.setValue(idx + 55, 5.464059760207363E-13);
  vars.setValue(idx + 56, -4.49106087618007);
  vars.setValue(idx + 57, 1.8172814841451513E-13);
  vars.setValue(idx + 58, -2.0453613774554398E-4);
  vars.setValue(idx + 59, -3.6416009097095525E-13);
  sim.modifyObjects();
};

/** Tests scenario with six blocks that causes a matrix solve exception.
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_2 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_2';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_2_setup(sim, advance);
  var e1 = sim.getEnergyInfo().getTotalEnergy();
  var vars = Engine2DTestRig.makeVars(10*6);
  Engine2DTestRig.setBodyVars(sim, vars, 4, -4.4895196, 0, -4.6926962, -0, -0.9299124, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 5, -2.537595, -0, -5.4907714, -0, -1.5707396, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 6, -0.4676891, 0.1452027, -4.481081, -0.0000001, 1.5706511, -0.0000056);
  Engine2DTestRig.setBodyVars(sim, vars, 7, 0.4717428, -0, -5.4909663, -0, -1.5708544, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 8, 3.4816553, 0, -5.4901424, -0, 1.5708532, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 9, 5.4916577, 0, -4.4910609, 0, -0.0002045, -0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
          /*expectedVars=*/vars, /*tolerance=*/0.00001,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.01,
          /*expectedCollisions=*/0);
};

/* Six blocks, causes a matrix solve exception, where the null space tolerance
needs to be increased.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_3_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance, /*damping=*/0.05);
  var zel = Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/1.0);
  for (var i=0; i<6; i++) {
    var p = Shapes.makeBlock(1, 3);
    if (i == 0) {
      var block1 = p;
    }
    sim.addBody(p);
  }
  sim.setElasticity(0.8);
  var gravity = new GravityLaw(3.0, sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel);
  if (!goog.isDefAndNotNull(block1))
    throw new Error();
  var idx = block1.getVarsIndex() - 24;
  var vars = sim.getVarsList();
  vars.setValue(idx + 24, -5.490049008239955);
  vars.setValue(idx + 25, 8.673617379884035E-19);
  vars.setValue(idx + 26, -4.490068145680414);
  vars.setValue(idx + 27, 5.787049988771518E-4);
  vars.setValue(idx + 28, -3.191194518569883E-5);
  vars.setValue(idx + 29, 2.3852447794681098E-18);
  vars.setValue(idx + 30, -3.4034852077612836);
  vars.setValue(idx + 31, 6.55340916335484E-4);
  vars.setValue(idx + 32, -4.9489748780281);
  vars.setValue(idx + 33, -0.0065526299419487715);
  vars.setValue(idx + 34, -1.1737138100037416);
  vars.setValue(idx + 35, -0.0055067586114682645);
  vars.setValue(idx + 36, -0.6836220547864712);
  vars.setValue(idx + 37, 0.03324312004305001);
  vars.setValue(idx + 38, -5.490309008274907);
  vars.setValue(idx + 39, 5.378375886626091E-4);
  vars.setValue(idx + 40, -1.570710443241491);
  vars.setValue(idx + 41, 3.565652270829615E-5);
  vars.setValue(idx + 42, 2.32616336373851);
  vars.setValue(idx + 43, 0.03338952638032349);
  vars.setValue(idx + 44, -5.490356785928899);
  vars.setValue(idx + 45, 3.85933781038354E-4);
  vars.setValue(idx + 46, 1.5708693042592825);
  vars.setValue(idx + 47, -2.572829294254092E-4);
  vars.setValue(idx + 48, 4.452587985870013);
  vars.setValue(idx + 49, 0.004153362491709371);
  vars.setValue(idx + 50, -4.7775829875476745);
  vars.setValue(idx + 51, 0.012411667363700026);
  vars.setValue(idx + 52, 1.0183548159706541);
  vars.setValue(idx + 53, -0.011488364053258766);
  vars.setValue(idx + 54, 1.0068759360599566);
  vars.setValue(idx + 55, -0.043047976077946734);
  vars.setValue(idx + 56, -4.48080035704158);
  vars.setValue(idx + 57, 0.0015566355113189874);
  vars.setValue(idx + 58, -1.5707888880404421);
  vars.setValue(idx + 59, -1.1404291769566865E-4);
  sim.modifyObjects();
};

/** Tests scenario with six blocks that causes a matrix solve exception.
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_3 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_3';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_3_setup(sim, advance);
  var e1 = sim.getEnergyInfo().getTotalEnergy();
  var vars = Engine2DTestRig.makeVars(10*6);
  Engine2DTestRig.setBodyVars(sim, vars, 4, -5.490049, 0, -4.4900537, -0, -0.0000319, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 5, -3.412413, -0.011482, -4.885132, 0.0631779, -1.1187094, 0.0558667);
  Engine2DTestRig.setBodyVars(sim, vars, 6, -0.9617754, -0.2450511, -5.4902956, 0, -1.5707096, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 7, 2.0480137, -0.2450511, -5.4903471, 0, 1.5708629, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 8, 4.4280123, -0.0141883, -4.8653838, -0.0675684, 1.1009391, 0.060813);
  Engine2DTestRig.setBodyVars(sim, vars, 9, 0.9246188, -0.0393269, -4.4807455, 0.0000158, -1.5707936, -0.0000014);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
          /*expectedVars=*/vars, /*tolerance=*/0.00001,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.01,
          /*expectedCollisions=*/0);
};

/**
* @param {!ContactSim} sim
* @param {!CollisionAdvance} advance
* @param {!Array<number>} v
* @param {boolean=} wallsFirst
* @private
*/
StraightStraightTest.setup_six_blocks = function(sim, advance, v, wallsFirst) {
  if (!goog.isDef(wallsFirst))
    wallsFirst = true;
  StraightStraightTest.commonSetup1(sim, advance, 0.05);
  var zel = 0;
  if (wallsFirst) {
    zel = Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/1.0);
  }
  for (var i=0; i<6; i++) {
    var p = Shapes.makeBlock(1, 3);
    if (i == 0) {
      var block1 = p;
    }
    sim.addBody(p);
  }
  if (!wallsFirst) {
    zel = Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/1.0);
  }
  goog.asserts.assert( v.length >= 36 );
  if (!goog.isDefAndNotNull(block1))
    throw new Error();
  var idx = block1.getVarsIndex();
  var vars = sim.getVarsList();
  for (var i=0; i<36; i++) {
    vars.setValue(idx + i, v[i]);
  }
  sim.setElasticity(0.8);
  var gravity = new GravityLaw(3.0, sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel);
  sim.modifyObjects();
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_4_setup = function(sim, advance) {
  StraightStraightTest.setup_six_blocks(sim, advance,
  [
  -3.3545261663555896,
  -0.355180346288018,
  -4.4091676608815025,
  0.01888840410875564,
  -0.33441693630855124,
  0.78578131361648,
  -1.5175707648198662,
  0.003206135053147014,
  -5.4907362257189956,
  5.436678584988201E-6,
  -4.712417858395409,
  -3.6244872808309476E-6,
  -5.030329202688726,
  -0.9844534862980994,
  -3.109909451638245,
  -0.17187889001353449,
  -0.3350299277503665,
  0.7861778657011144,
  -4.422188956281887,
  -0.06277409660041239,
  -4.40909237120817,
  0.020106263134300622,
  21.655729079144088,
  0.7861180509905386,
  1.4901049976435212,
  0.0023613793610671716,
  -5.490185485906266,
  0.0056322362177322945,
  -7.853916200558516,
  0.0016857384982070047,
  4.490161555800651,
  1.5819651323954016E-4,
  -5.4900738791375066,
  0.0040804895964462965,
  -1.570843916633821,
  -0.0027203695546943584
  ] );
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
};

/**
@return {undefined}
@package
*/
StraightStraightTest.six_blocks_4 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_4';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_4_setup(sim, advance);
  var energyDiff, expectCollisions;
  if (Util.isChrome()) {
    energyDiff = -1.751934748;
    expectCollisions = 7;
  } else {
    energyDiff = -1.7;
    expectCollisions = 5;
  }
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/8.0,
               /*expectedVars=*/null, /*tolerance=*/Util.NaN,
               /*expectedEnergyDiff=*/energyDiff, /*energyTol=*/0.1,
               /*expectedCollisions=*/expectCollisions);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/12.0,
               /*expectedVars=*/null, /*tolerance=*/Util.NaN,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/0);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_5_setup = function(sim, advance) {
  StraightStraightTest.setup_six_blocks(sim, advance,
  [
    -5.489965075066497,
    0.004087251835193464,
    -4.490052900839322,
    0.001362247691451171,
    -4.6677414087053384E-5,
    -0.0027248769565007607,
    -3.401717547428832,
    0.0019117628245731183,
    -4.971189895635601,
    0.008305583285810448,
    -1.1920467322044246,
    0.006870863906211994,
    -0.5748706825516253,
    -0.0417381964456494,
    -5.490251890670699,
    -6.808027313556439E-17,
    -1.5709353569488083,
    -2.42861286636753E-17,
    2.426724225565317,
    -0.04173819644564949,
    -5.4905529523168,
    -3.2612801348363973E-16,
    1.5705328359361475,
    1.1188966420050406E-16,
    4.465167990404531,
    -0.00719303842885928,
    -4.741243000027946,
    -0.016690598972297344,
    0.981668335500221,
    0.017218871182208717,
    0.7783656030362079,
    -0.029240805650546875,
    -4.481170584745237,
    2.783746992588203E-4,
    -1.5714036339542785,
    4.1296827244508794E-5
    ] );
};

/** This tests that the simulation can run for 2 seconds, and that a certain
  number of collisions happen and the energy decreases by a certain amount.
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_5 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_5';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_5_setup(sim, advance);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
          /*expectedVars=*/null, /*tolerance=*/Util.NaN,
          /*expectedEnergyDiff=*/-0.0149, /*energyTol=*/0.1,
          /*expectedCollisions=*/0);
};


/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_6_setup = function(sim, advance) {
  StraightStraightTest.setup_six_blocks(sim, advance,
  [
    -2.479254054598802,
    -0.008383172809440613,
    -4.490192922711039,
    0.0012134875363453183,
    8.791012830956698E-5,
    0.002427615317992623,
    -0.4693351531726902,
    -0.005211501828657076,
    -5.490287752459545,
    0.0014093667389195456,
    -4.712383176065981,
    9.395796500458078E-4,
    0.7911849247646761,
    0.03453590587929963,
    -4.473392209630643,
    0.10383355825723466,
    1.5650945215047225,
    -0.06935148785076672,
    -4.489184128917945,
    -0.0042418646209149355,
    -5.491555977672989,
    0.00150356820555,
    20.420918091036057,
    -0.0010021899368622567,
    2.535618102853626,
    0.0073038373861507525,
    -5.491785588161739,
    -5.204170427930421E-18,
    -7.854694744724996,
    -8.673617379884035E-18,
    4.441714724437791,
    -0.02949542212365918,
    -4.651840897521864,
    -0.04573324755774091,
    0.9731961682115491,
    0.07207352623369913,
    236.15012435916688
  ] );
};

/**
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_6 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_6';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_6_setup(sim, advance);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
          /*expectedVars=*/null, /*tolerance=*/Util.NaN,
          /*expectedEnergyDiff=*/-0.184767922, /*energyTol=*/0.001,
          /*expectedCollisions=*/2);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_7_setup = function(sim, advance) {
  StraightStraightTest.setup_six_blocks(sim, advance,
  [
    -1.4008804821505663,
    -1.0953755183567188E-9,
    -4.981046079045859,
    -1.9992068048789671E-10,
    -1.200071147740437,
    -1.6427989772619893E-10,
    1.4796160598187693,
    1.1235988991072552E-13,
    -5.491714158480645,
    -1.2662785196137558E-15,
    -4.712740442557912,
    -8.417187575915385E-16,
    1.688449935615377,
    -1.0824993284576629E-9,
    -4.4820860141082655,
    3.777030401650401E-13,
    -1.5711430162348365,
    -1.8223005738926858E-15,
    -4.490145272150233,
    2.5960715059151575E-14,
    -5.490437318063508,
    4.230764788816007E-6,
    20.420090322954632,
    -5.203366672719886E-14,
    4.489950496597266,
    1.1283686080194514E-13,
    -5.4917274053566505,
    -3.0534805866899067E-17,
    -7.853654066004802,
    -2.6598913917167402E-17,
    4.418005502150728,
    -2.0572215074183382E-11,
    -3.945734031406925,
    -2.180998329736897E-10,
    1.1777659258720574,
    1.8268885795336528E-10
  ]);
};

/**
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_7 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_7';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_7_setup(sim, advance);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
          /*expectedVars=*/null, /*tolerance=*/Util.NaN,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
          /*expectedCollisions=*/0);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_8_setup = function(sim, advance) {
  StraightStraightTest.setup_six_blocks(sim, advance,
  [
    -1.4006667035152596,
    -9.693089413206307E-4,
    -4.9838649196508955,
    2.2302351400742795E-5,
    -1.202117102796731,
    1.829539682510507E-5,
    1.4797014053709832,
    -0.0010921604658408748,
    -5.496521932131233,
    1.1762751343205065E-8,
    -4.71224974108439,
    7.842198285288454E-9,
    1.6885479215423251,
    -9.706566845123935E-4,
    -4.48778364199535,
    4.1213406048957926E-8,
    -1.5704902770116411,
    1.5105026038341254E-8,
    -4.490015398935664,
    -5.181172627948807E-4,
    -5.4919767634570285,
    0.0015545518282173046,
    20.420313643816957,
    0.0010363545502616025,
    4.489864055427361,
    -0.0010921643777436155,
    -5.496486998294175,
    -4.3368086899420177E-19,
    -7.853455994143339,
    2.3852447794681098E-18,
    4.417991142178613,
    -1.8443050080908566E-5,
    -3.9505739533206237,
    -1.9531414976105667E-4,
    1.1779001844891648,
    1.6408965739089505E-4
  ]);
};

/** Strangely, this configuration gains energy.
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_8 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_8';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_8_setup(sim, advance);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
          /*expectedVars=*/null, /*tolerance=*/Util.NaN,
          /*expectedEnergyDiff=*/9.96657E-5, /*energyTol=*/0.001,
          /*expectedCollisions=*/0);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_9_setup = function(sim, advance) {
  StraightStraightTest.setup_six_blocks(sim, advance,
  [
    -1.4098834956330757,
    -0.011021823548695726,
    -4.901190292092527,
    0.06896168332172642,
    -1.1329171003184435,
    0.06015134284633006,
    1.1048833769390685,
    -0.2383595895375249,
    -5.490575648872165,
    -5.985483064997513E-23,
    -4.7121628015794945,
    1.061957734850305E-22,
    1.6703348810645853,
    -0.021994369069460246,
    -4.481173864069186,
    5.869360705162414E-5,
    -1.570496969228481,
    6.504411289860808E-6,
    -4.490089724681169,
    -8.470329472543003E-22,
    -5.490535827441271,
    2.309033496920736E-5,
    20.4202774547725,
    0.0,
    4.115016540060451,
    -0.23835958953752487,
    -5.491084890522951,
    0.0,
    -7.854124817129153,
    0.0,
    4.413957328404009,
    -4.263125237630913E-4,
    -3.9479177969108523,
    -0.004412366070905673,
    1.1755736147755107,
    0.00367304369690573
    ]);
};

/**
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_9 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_9';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_9_setup(sim, advance);
  if (Util.isChrome()) {
    Engine2DTestRig.runTest(sim, advance, /*runUntil=*/12.0,
       /*expectedVars=*/null, /*tolerance=*/Util.NaN,
       /*expectedEnergyDiff=*/-0.313720709, /*energyTol=*/0.001,
       /*expectedCollisions=*/3);
  } else {
    Engine2DTestRig.runTest(sim, advance, /*runUntil=*/12.0,
       /*expectedVars=*/null, /*tolerance=*/Util.NaN,
       /*expectedEnergyDiff=*/-0.319376774, /*energyTol=*/0.001,
       /*expectedCollisions=*/3);
  }
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/20,
     /*expectedVars=*/null, /*tolerance=*/NaN,
     /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
     /*expectedCollisions=*/0);
};

/** Situation that led to development of the 'near collision' feature on Aug 3 2011,
where there is an imminent collision while handling another collision, which resulted
in the 'stuck count' going to 3. Just increasing the stuck count limit would fix the
situation, but I instead developed the idea that an imminent collision is similar to a
contact for purposes of handling multiple collisions.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_10_setup = function(sim, advance) {
  StraightStraightTest.setup_six_blocks(sim, advance,
  [
    -4.112367787413438,
    0.39026511526212854,
    -3.47432218043552,
    -0.04844606751715124,
    -0.01681971028050594,
    0.15444140342140358,
    -4.4902665319358945,
    0.009708687447405103,
    -5.492362116791236,
    0.04110771891404174,
    -1.5703141789281565,
    -0.019389331575013213,
    -1.1117912478988092,
    -0.08180869895105755,
    -4.472560662315691,
    -0.05278060856444347,
    -1.5653868372165212,
    -0.4933976799463698,
    -0.2864037845545129,
    -0.021580789346602885,
    -5.48855328848715,
    -0.5111254210373286,
    -1.5667732606816016,
    -0.005675550346695361,
    1.4297966380301976,
    -0.6222954049493852,
    -4.380312958037922,
    -1.3388667898420845,
    0.7202422536661243,
    0.3569620001764969,
    4.358511630657416,
    -0.1897987425234288,
    -5.492781293281953,
    1.5820678100908484E-16,
    -1.5724773538024814,
    2.7755575615628914E-17
    ]);
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
};

/**
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_10 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_10';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_10_setup(sim, advance);
  // Note: the expected energy diff given here is less than what you
  // would measure before/after due to the advance(0) doing initial impulses
  // in runTest.
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/20.0,
          /*expectedVars=*/null, /*tolerance=*/NaN,
          /*expectedEnergyDiff=*/-3.386498527, /*energyTol=*/0.01);
};

/** Situation from Aug 20 2011 in ContactTest, with six blocks resting on the floor.
It caused a failure in the matrix solver, which has been repaired.

Note that the problem only occurs when we _do not_ divide up the contacts into
independent subsets of contacts.  So to see this error we must set the flag
{@link ContactSim#SUBSET_COLLISIONS} to `false`.
Also, this error only occurs when the walls are added last, after the moveable blocks.

See also `myphysicslab.lab.engine2D.test.UtilEngine_test.testRedundantMatrix9()`
which has a copy of the matrix that results from this test.

@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_11_setup = function(sim, advance) {
  StraightStraightTest.setup_six_blocks(sim, advance,
  [
    -3.4807418124962246,
    -0.0032609654797268383,
    -4.690642129379,
    0.005884959813226634,
    -4.069471245774962,
    0.006533340019550788,
    -5.490093621397956,
    -1.2407709188295415E-24,
    -4.490584738508103,
    4.576046549796252E-6,
    -3.340109945538294E-6,
    -4.1359030627651384E-24,
    1.4800261549386085,
    -0.0027374555459506204,
    -5.490302215555195,
    3.7694317660346175E-18,
    -1.5708678273429248,
    2.5128946259988686E-18,
    -1.5300317991165833,
    -0.005469762569256994,
    -5.490109925347951,
    3.8857812481217984E-17,
    1.570865119007061,
    1.1102214371068299E-17,
    4.490046868656358,
    -9.997577275171447E-18,
    -5.490157832629273,
    2.346783365031779E-5,
    1.5708320499034099,
    -4.2136073022102525E-18,
    4.47198537447647,
    -0.0029572640614469424,
    -4.480593249937791,
    2.3091036442906875E-5,
    -4.71206604332963,
    1.807523974207076E-7
    ], false);
};

/**
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_11 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_11';
  // set the flag saying to not find related subsets of contacts
  var saveFlag = ContactSim.SUBSET_COLLISIONS;
  ContactSim.SUBSET_COLLISIONS = false;
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_11_setup(sim, advance);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
          /*expectedVars=*/null, /*tolerance=*/Util.NaN,
          /*expectedEnergyDiff=*/-0.0012705, /*energyTol=*/0.001,
          /*expectedCollisions=*/0);
  ContactSim.SUBSET_COLLISIONS = saveFlag;
};

/** Crash Oct 9 2012:  two blocks wind up overlapping with no collision,
but taking out the 'throw exception' in Polygon.testCollisionVertex
fixes the problem:  we are able to find a collision later on and
everything works out OK.

    [java] java.lang.IllegalStateException: corner is inside 2: [-0.48819, -1.5, 0]
    this=com.myphysicslab.lab.engine2D.Polygon@52c00025[ name=1, dragable=true,
    zeroEnergyLevel=-5.5, expireTime=?, 2 attributes(
    color=java.awt.Color[r=0,g=0,b=255],filled=true,), x=-2.96337, y=-4.495, angle=-0,
    vx=-0.25466, vy=-0, vw=-0, cmx=0, cmy=0, width=1, height=3, mass=1,
    momentAboutCM=0.83333]
    other=com.myphysicslab.lab.engine2D.Polygon@4e2016b0[ name=0, dragable=true,
    zeroEnergyLevel=-5.5, expireTime=?, 1 attributes(
    color=java.awt.Color[r=230,g=230,b=230],), x=-3.95156, y=-4.495, angle=-0, vx=0.559,
    vy=-0, vw=0, cmx=0, cmy=0, width=1, height=3, mass=1, momentAboutCM=0.83333]

Update May 27 2013:  Made the tolerance tighter for finding line intersection,
and put back in the 'throw exception' in `Polygon.testCollisionVertex`.  Turns out
that this test is no longer triggering that exception even with tolerance of `1E-10`
in `UtilEngine.linesIntersect`.  So, this test is of questionable usefulness.

@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.six_blocks_12_setup = function(sim, advance) {
  StraightStraightTest.setup_six_blocks(sim, advance,
  [
    -3.9795534864733946,
    0.5603947124399835,
    -4.494999999999999,
    -1.5563590077982844E-14,
    -7.348187395995754E-16,
    -2.9029394275278674E-16,
    -2.950617113946953,
    -0.2553017864528158,
    -4.494999999999999,
    -5.3058849962594086E-15,
    -1.7908831144300597E-15,
    6.608018768607392E-14,
    -0.5200000006730288,
    -9.7046021848972E-19,
    -5.494999999999999,
    -7.96944081510657E-15,
    -1.5707963267948968,
    8.726266789357274E-16,
    2.4849999993269716,
    -2.154014466284064E-15,
    -5.494999999999999,
    -9.922729685802491E-15,
    1.5707963267948963,
    -2.6256274349643637E-15,
    4.489999999326985,
    2.1562780968094406E-15,
    -4.494999999999999,
    -1.2431040096932952E-14,
    9.528498640341283E-16,
    -4.800359450590645E-14,
    5.494999999380792,
    -1.2931512186863026E-18,
    -4.494999999999999,
    -6.99044503042167E-15,
    -1.974518458830297E-16,
    -5.007438423172913E-16
    ], /*wallsFirst=*/false);
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
};

/**
@return {undefined}
@private
*/
StraightStraightTest.six_blocks_12 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'six_blocks_12';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.six_blocks_12_setup(sim, advance);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
      /*expectedVars=*/null, /*tolerance=*/Util.NaN,
      /*expectedEnergyDiff=*/-0.160986774, /*energyTol=*/0.001,
      /*expectedCollisions=*/2);
};

/** A hexagon resting on the floor, with a square block balanced on one corner on top
of the hexagon. The hexagon is rotated, so that the top edge is one of the side edges
that has `outsideIsDown`. This is a rare test that exercises some code related to
down-is-out for edges that are not horizontal or vertical in body position.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.hexagon_1_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  var a = Math.sin(Math.PI/3);
  var hex = Shapes.makeHexagon(1.0, 'hexagon');
  hex.setPosition(new Vector(0,  a + 0.009), -2*Math.PI/3);
  sim.addBody(hex);
  var block = Shapes.makeBlock(1, 1, 'block');
  block.setPosition(new Vector(0, 2*a + 2*0.009 + Math.sqrt(2)/2), Math.PI/4);
  sim.addBody(block);
  var floor = Shapes.makeBlock(6, 1, 'floor');
  floor.setMass(Util.POSITIVE_INFINITY);
  floor.setPosition(new Vector(0,  -0.5),  0);
  sim.addBody(floor);
  sim.setElasticity(0.8);
  sim.addForceLaw(new GravityLaw(3.0, sim.getSimList()));
};

/**
@return {undefined}
@private
*/
StraightStraightTest.hexagon_1 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'hexagon_1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.hexagon_1_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0, 0, 0.8750254, -0, -2.0943951, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, -0, -0, 2.4571576, -0, 0.7853982, -0);
  // Note: in runTest, advance(0) handles the initial small collisions,
  //  which gets the bodies into stable contact and then the energy
  //  is stable after this.
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/3.0,
          /*expectedVars=*/vars, /*tolerance=*/0.00001,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
          /*expectedCollisions=*/0);
};

/** Two blocks start in contact and in motion, with mutual gravitation.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.block_block_contact_1_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  var body0 = Shapes.makeBlock(1, 1, 'block1');
  body0.setPosition(new Vector(-0.502,  0),  0);
  body0.setVelocity(new Vector(0,  0.6),  0);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(1, 2.5, 'block2');
  body1.setPosition(new Vector(0.502,  0),  0);
  body1.setVelocity(new Vector(0,  -0.6),  0);
  sim.addBody(body1);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/** Tests the block/block scenario, that energy is stable and there
are no collisions.
@return {undefined}
@private
*/
StraightStraightTest.block_block_contact_1 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'block_block_contact_1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.block_block_contact_1_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0.0052001, 0.1069955, 0.5355385, -0.0866979, -1.2245951, -0.6316525);
  Engine2DTestRig.setBodyVars(sim, vars, 1, -0.0052001, -0.1069955, -0.5355385, 0.0866979, -1.2245951, -0.6316525);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/3.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
      /*expectedCollisions=*/0);
};

/** A square and a rectangle bounce collide together under mutual gravitation,
eventually settling into rotating/sliding contact.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.block_block_contact_2_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  var body0 = Shapes.makeBlock(1, 1, 'block1');
  body0.setPosition(new Vector(-1,  0),  0);
  body0.setVelocity(new Vector(0,  0.6),  0);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(1, 2, 'block2');
  body1.setPosition(new Vector(1,  0),  0);
  body1.setVelocity(new Vector(0,  -0.6),  0);
  sim.addBody(body1);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/**
@return {undefined}
@private
*/
StraightStraightTest.block_block_contact_2 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'block_block_contact_2';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.block_block_contact_2_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0.5034152, 0.2143205, 0.1531754, -0.330582, -9.4336534, -1.3740094);
  Engine2DTestRig.setBodyVars(sim, vars, 1, -0.5034152, -0.2143205, -0.1531754, 0.330582, -9.4355238, -1.3740094);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10.0,
              /*expectedVars=*/vars, /*tolerance=*/0.0001);
  // run for a few more seconds: there should be no more collision searches,
  // and energy should be constant
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/14.0,
          /*expectedVars=*/null, /*tolerance=*/Util.NaN,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00002,
          /*expectedCollisions=*/0);
};

/** Same as block_block_contact_2, except with smaller time step of 0.0025,
to show that energy remains constant at a very small tolerance of 0.0000001.
@return {undefined}
@private
*/
StraightStraightTest.block_block_contact_2b = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'block_block_contact_2b';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.block_block_contact_2_setup(sim, advance);
  advance.setTimeStep(0.0025);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0.5063086, 0.1469399, 0.1376723, -0.5306998, -9.4363357, -1.0665345);
  Engine2DTestRig.setBodyVars(sim, vars, 1, -0.5063086, -0.1469399, -0.1376723, 0.5306998, -9.4363639, -1.0665345);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/10.0,
              /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // run for a few more seconds: there should be no more collision searches,
  // and energy should be constant
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/14.0,
          /*expectedVars=*/null, /*tolerance=*/Util.NaN,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0000001,
          /*expectedCollisions=*/0);
};

/**  A 16-sided polygon rolls and slides on a rectangular block.

Note that this loses energy due to the policy of applying impact force at contact
points that are colliding (normal velocity is small and negative) to get the contact
point to have zero normal velocity. As the polygon rolls, each vertex of the polygon
winds up in this situation as the vertex rolls to become the new contact point.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.ngon_block_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  var body0 = TestShapes.makeNGon(16, 0.75);
  body0.setCenterOfMass(0, -0.2);
  body0.setPosition(new Vector(-0.255,  0),  0);
  body0.setVelocity(new Vector(0,  0.6),  1);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(1, 3, 'block');
  body1.setPosition(new Vector(1,  0),  0);
  body1.setVelocity(new Vector(0,  -0.6),  0);
  sim.addBody(body1);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/**
@return {undefined}
*/
StraightStraightTest.ngon_block = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'ngon_block';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.ngon_block_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0.8490859, 0.203748, 0.2930717, -0.2101944, -0.1612429, -0.0790571);
  Engine2DTestRig.setBodyVars(sim, vars, 1, -0.1040859, -0.203748, -0.2930717, 0.2101944, -2.3103895, -0.1556946);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/8.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/** Two diamond shaped blocks collide under mutual gravity and wind up in rocking contact.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.diamonds_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  advance.setTimeStep(0.01);
  var body0 = Shapes.makeDiamond(1, 1, Math.PI/4, 'diamond1');
  body0.setPosition(new Vector(-2,  0.5),  0);
  sim.addBody(body0);
  var body1 = Shapes.makeDiamond(1, 2, -Math.PI/4, 'diamond2');
  body1.setPosition(new Vector(2,  -0.5),  0);
  sim.addBody(body1);
  sim.setElasticity(0.5);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/** Note that we use a smaller step size (0.01) to get reasonably constant energy (0.0001).
@return {undefined}
@private
*/
StraightStraightTest.diamonds = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'diamonds';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.diamonds_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -0.571369, 0.463846, 0.147005, 0.1908704, -0.0140063, 0.6080322);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 0.571369, -0.463846, -0.147005, -0.1908704, -0.0137379, 0.6075645);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/7.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  Engine2DTestRig.checkValue('energy', sim.getEnergyInfo().getTotalEnergy(), 0.8168246, 0.0001);
  // run for a few more seconds: there should be no more collision searches,
  // and energy should be constant
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/11.0,
      /*expectedVars=*/null, /*tolerance=*/Util.NaN,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0001,
      /*expectedCollisions=*/0);
};


/** A single rectangle block falls to hit the floor.  This revealed problems in
the collision handling discovered on May 17 2012 in the Chain simulation, although it
had nothing to do with the Chain.  The block Vertexes were reaching exactly
the bottom wall (distance = 0.0 exactly at the moment of collision) and this
resulted in the algorithm becoming stuck.
Note that all the factors are critical to make this test happen: setup, gravity,
time step, etc.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.one_block1_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  var block = Shapes.makeBlock(1, 3, 'blue');
  block.setPosition(new Vector(-4,  -4));
  sim.addBody(block);
  var zel = Walls.make(sim, /*width=*/20, /*height=*/20);
  var gravity = new GravityLaw(4.0, sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel);
  sim.setElasticity(0.8);
};

/** This is a very simple test of a block falling to the floor;  success is
simply that the collision handling is able to cope with this unusual case.
@return {undefined}
*/
StraightStraightTest.one_block1 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'one_block1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.one_block1_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -4, 0, -6.4464191, 1.3062236, 9.9004282, 1.5690463);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/4.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/** A single rectangle block in contact on the floor, but with a small distance
gap and large velocity (-0.3 is large for a contact).
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.one_block2_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  sim.setExtraAccel(ExtraAccel.NONE);
  var block = Shapes.makeBlock(1, 3, 'blue');
  block.setPosition(new Vector(0,  -5 + 1.5 + 0.005),  0.01);
  block.setVelocity(new Vector(0,  -0.3));
  sim.addBody(block);
  var zel = Walls.make(sim, /*width=*/10, /*height=*/10);
  var gravity = new GravityLaw(4.0, sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel);
  sim.setElasticity(0.8);
};

/**
@return {undefined}
*/
StraightStraightTest.one_block2 = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'one_block2';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.one_block2_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0, 0, -3.4970902, 0.0519124, 0.0025727, 0.0153277);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/4.0,
              /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/** A single rectangle block is very close to floor and moving quickly.  This tests
an unusual condition that should probably never happen, except from initial conditions
like this test. See `RigidBodyCollision.closeEnough` which has a special `allowTiny`
parameter which handles cases where a collision has very small distance, but we
cannot backup to a time when distance was around targetGap.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.fast_close_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  sim.setExtraAccel(ExtraAccel.NONE);
  var zel = Walls.make(sim, /*width=*/10, /*height=*/10);
  var block = Shapes.makeBlock(1, 3, 'blue');
  block.setPosition(new Vector(0,  -5 + 1.5 + 0.005),  0.01);
  block.setVelocity(new Vector(0,  -3));
  sim.addBody(block);
  var gravity = new GravityLaw(4.0, sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel);
  sim.setElasticity(0.8);
};

/**
@return {undefined}
*/
StraightStraightTest.fast_close = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'fast_close';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.fast_close_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6);
  Engine2DTestRig.setBodyVars(sim, vars, 4, 0, 0, -4.2240973, 0.9174399, -1.6750292, 0.2982996);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/4.0,
              /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/** Two square blocks collide exactly at their corners.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.corner_collision_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  advance.setTimeStep(0.01);
  var body0 = Shapes.makeDiamond(1, 1, Math.PI/4, 'diamond1');
  body0.setPosition(new Vector(-2,  0),  0);
  body0.setVelocity(new Vector(3,  0),  0);
  sim.addBody(body0);
  var body1 = Shapes.makeDiamond(1, 1, -Math.PI/4, 'diamond2');
  body1.setPosition(new Vector(2,  0),  0);
  sim.addBody(body1);
  sim.setElasticity(0.5);
};

/**
@return {undefined}
*/
StraightStraightTest.corner_collision = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'corner_collision';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.corner_collision_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 1.8204803, 1.0881406, -0.0851541, -0.0746966, -0.3249214, -0.2850188);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 4.1795197, 1.9118594, 0.0851541, 0.0746966, -0.4005913, -0.3513959);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
              /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/** Two rounded corner square blocks collide exactly at their corners.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.rounded_corner_collision_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  advance.setTimeStep(0.01);
  var body0 = Shapes.makeRoundCornerBlock(1, 1, 0.02, 'rounded1');
  body0.setPosition(new Vector(-2,  0),  Math.PI/4);
  body0.setVelocity(new Vector(3,  0),  0);
  sim.addBody(body0);
  var body1 = Shapes.makeRoundCornerBlock(1, 1, 0.02, 'rounded2');
  body1.setPosition(new Vector(2,  0),  Math.PI/4);
  sim.addBody(body1);
  sim.setElasticity(0.5);
};

/**
@return {undefined}
*/
StraightStraightTest.rounded_corner_collision = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'rounded_corner_collision';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.rounded_corner_collision_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 1.4480162, 0.75, -0, -0, 0.7853982, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 4.5519838, 2.25, 0, 0, 0.7853982, -0);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
              /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/** Two square blocks collide at their corners, so that the vertex enters 'sideways'
into very close contact near the corner:
<pre>
.            ------------- distance tolerance
       .
             =.=========== edge
             |      .
             |
             |
</pre>
This is a strange case because the impulse happens well outside of the object.

Prediction: binary search turns on, and the RigidBodyCollision.closeEnough 'allowTiny'
case happens, so the collision backs up to a very small contact distance.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.oblique_corner_collision_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance);
  sim.setSimRect(new DoubleRect(-0.04602673981896506, -0.0309592659798244, 0.029428926297351846, 0.04412223980864299));
  sim.setCollisionAccuracy(0.1);
  advance.setTimeStep(0.025);
  var body0 = Shapes.makeBlock(2, 2, 'fixed');
  body0.setMass(Util.POSITIVE_INFINITY);
  // origin is top-left corner of fixed block
  body0.setPosition(new Vector(1,  -1),  0);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(1, 1, 'moving');
  // bottom right corner starts at (-0.025, 0.01)
  // bottom right corner should end at (0.015, -0.005) after 0.025 second
  // distance is sqrt(0.04^2 + 0.015^2) = 0.0427
  // velocity is 0.0427 / 0.025 = 1.7
  // velocity vector is 1.7 * (0.4, -0.15)/0.427 = (1.5925, -0.597)
  body1.setPosition(new Vector(-0.5-0.025,  0.5+0.01),  0);
  body1.setVelocity(new Vector(1.5925,  -0.597),  0);
  sim.addBody(body1);
  sim.setElasticity(0.5);
};

/**
@return {undefined}
*/
StraightStraightTest.oblique_corner_collision = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'oblique_corner_collision';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.oblique_corner_collision_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 1, 0, -1, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 1.9052262, 1.1502723, 2.4186528, 1.1348587, 1.6275154, 0.7021148);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/2.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/NaN, /*energyTol=*/0,
      /*expectedCollisions=*/-1, /*expectedSearches=*/1);
};


/** Two polygons with acute angle corners both resting on the ground, and their corners
are colliding (there are 4 other Polygons as well).

This test resulted in bringing back CornerCornerCollision, and adding a tolerance
setting to `UtilEngine.linesIntersect`. This was found from a `probablyPointInside`
error on Oct 20, 2016 in `UtilityCollision.testCollisionVertex`.

The error is caused by having two Polygons (numbers 3 and 6) with acute angle corners,
they are both resting on the ground, and their corners are colliding. We can't form
vertex-edge contacts because of the geometry of this particular case. Both corners are
"beyond the edge". This is calculated by looking at the normal to the edge (like
`Edge.distanceToPoint` returns infinity when the point is beyond the endpoint).

My first approach to solving this was to add collision testing between two
StraightEdges, by creating the static class StraightStraight. This did result in
surviving the situation, but there is never a contact force generated, and there are
endless collisions happening at that corner. To fix that I brought back
CornerCornerCollision, which gives a contact force there and stops the collisions.

After looking into why the `probablyPointInside` error occurs (when we don't have
CornerCornerCollision or StraightStraight edge testing) it seems to be a case of a
small floating point calculation error in finding the intersection of lines. Adding a
small tolerance in `UtilEngine.linesIntersect` results in getting collisions instead of
the `probablyPointInside` error (even when we don't have CornerCornerCollision or
StraightStraight edge testing). This shows that the StraightStraight class is not
needed, that we can assume that vertex-edge collisions are sufficient for finding
collisions between StraightEdges, as long as this tolerance is large enough in
`UtilEngine.linesIntersect`.

@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
StraightStraightTest.acute_corners_setup = function(sim, advance) {
  StraightStraightTest.commonSetup1(sim, advance, /*damping=*/0);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE_JOINTS);
  var zel = Walls.make2(sim, new DoubleRect(-4.5, -3.6, 3.1, 4));
  Polygon.ID = 1;
  var p = Shapes.makePolygon([new Vector(1, 0),
      new Vector(-0.513177951173234170, 0.858282232386085031),
      new Vector(-0.969768795922141824, 0.244025577462116117),
      new Vector(0.513177951173234059, -0.858282232386085142)
  ], [true, true, false, false], /*moment=*/1/6);
  sim.addBody(p);
  sim.addBody(Shapes.makeBlock(1, 3));
  p = Shapes.makePolygon([new Vector(1, 0),
      new Vector(-0.516830731524381637, 0.856087609390518200),
      new Vector(-0.814535453253508290, -0.580113777972133482),
      new Vector(0.615548804248536530, -0.788098768929502258)
  ], [true, true, false, false], /*moment=*/1/6);
  sim.addBody(p);
  sim.addBody(Shapes.makeBlock(1, 3));
  sim.addBody(Shapes.makeBlock(1, 3));
  p = Shapes.makePolygon([new Vector(1, 0),
      new Vector(-0.518913825057696454, 0.854826556772770418),
      new Vector(-0.971381139582120134, 0.237526170482626198),
      new Vector(-0.087331206181348126, -0.996179331459406847)
  ], [true, true, false, false], /*moment=*/1/6);
  sim.addBody(p);

  var gravity = new GravityLaw(3.0, sim.getSimList());
  sim.setElasticity(0.8);
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel);
  var va = sim.getVarsList();
  va.setValue(0, 0);
  va.setValue(1, 0.03178706216753517);
  va.setValue(2, 21.275092573513827);
  va.setValue(3, 21.306879635681362);
  va.setValue(4, -0.7);
  va.setValue(5, 0);
  va.setValue(6, -4.1);
  va.setValue(7, 0);
  va.setValue(8, 0);
  va.setValue(9, 0);
  va.setValue(10, 3.5999999999999996);
  va.setValue(11, 0);
  va.setValue(12, 0.19999999999999996);
  va.setValue(13, 0);
  va.setValue(14, 0);
  va.setValue(15, 0);
  va.setValue(16, -0.7);
  va.setValue(17, 0);
  va.setValue(18, 4.5);
  va.setValue(19, 0);
  va.setValue(20, 0);
  va.setValue(21, 0);
  va.setValue(22, -5);
  va.setValue(23, 0);
  va.setValue(24, 0.19999999999999996);
  va.setValue(25, 0);
  va.setValue(26, 0);
  va.setValue(27, 0);
  va.setValue(28, -3.994175423172596);
  va.setValue(29, -3.375246109755061e-7);
  va.setValue(30, -2.7383266394583425);
  va.setValue(31, -5.942141763683848e-9);
  va.setValue(32, -1.0548398616079855);
  va.setValue(33, -9.118912363980537e-9);
  va.setValue(34, -2.003265933175177);
  va.setValue(35, -4.007266059523297e-7);
  va.setValue(36, -3.0949999992492216);
  va.setValue(37, -2.805109218609374e-8);
  va.setValue(38, -1.5707963271905572);
  va.setValue(39, 1.4783921554646415e-8);
  va.setValue(40, 2.1894973957584805);
  va.setValue(41, -0.002607801649199815);
  va.setValue(42, -2.8567099904181865);
  va.setValue(43, -1.137377229716843e-13);
  va.setValue(44, 0.14442290824138998);
  va.setValue(45, -3.3018032752131266e-14);
  va.setValue(46, 0.5531761073947989);
  va.setValue(47, -0.07606659236252189);
  va.setValue(48, -1.7549648725459994);
  va.setValue(49, -0.0375339986382553);
  va.setValue(50, 1.8055032081848377);
  va.setValue(51, -0.030052137616049142);
  va.setValue(52, -1.7979653247900453);
  va.setValue(53, 0.186005234323005);
  va.setValue(54, -1.089999995447982);
  va.setValue(55, -1.7043644812988394e-7);
  va.setValue(56, 3.141592646020941);
  va.setValue(57, 2.8341393571213067e-7);
  va.setValue(58, 0.6357229411480702);
  va.setValue(59, 0.14498910247394578);
  va.setValue(60, -2.9733009783756574);
  va.setValue(61, -4.2449932455742765e-13);
  va.setValue(62, 0.9490286328488056);
  va.setValue(63, 3.497165520156307e-13);
};

/**
@return {undefined}
*/
StraightStraightTest.acute_corners = function() {
  Engine2DTestRig.testName = StraightStraightTest.groupName+'acute_corners';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  StraightStraightTest.acute_corners_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(10*6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -0.7, 0, -4.1, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 1, 3.6, 0, 0.2, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 2, -0.7, 0, 4.5, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 3, -5, 0, 0.2, 0, 0, 0);
  Engine2DTestRig.setBodyVars(sim, vars, 4, -4.1032991, -0.0000002, -2.6832517, 0.0000001, -0.9315825, 0.0000002);
  Engine2DTestRig.setBodyVars(sim, vars, 5, -1.8781805, 0.0192418, -3.095, -0, -1.5707963, -0);
  Engine2DTestRig.setBodyVars(sim, vars, 6, 2.1928624, 0.0025583, -2.852029, 0.0201551, 0.1502213, 0.0250336);
  Engine2DTestRig.setBodyVars(sim, vars, 7, -1.0789055, -0.0480727, -2.0371939, -0.0180137, 1.6062169, -0.0121602);
  Engine2DTestRig.setBodyVars(sim, vars, 8, -3.350931, 0.047195, -1.0558168, -0.0178603, 3.3357669, -0.0708072);
  Engine2DTestRig.setBodyVars(sim, vars, 9, 0.6897072, 0.0187622, -2.9732101, -0.0026702, 0.9488974, 0.0038532);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/5.0,
              /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

}); // goog.scope
