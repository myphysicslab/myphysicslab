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

goog.module('myphysicslab.test.MiscellanyTest');

goog.require('goog.asserts');

const AdaptiveStepSolver = goog.require('myphysicslab.lab.model.AdaptiveStepSolver');
const ChainConfig = goog.require('myphysicslab.sims.engine2D.ChainConfig');
const CirclePath = goog.require('myphysicslab.sims.roller.CirclePath');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CollisionHandling = goog.require('myphysicslab.lab.engine2D.CollisionHandling');
const ConstantForceLaw = goog.require('myphysicslab.lab.model.ConstantForceLaw');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const CurvedTestApp = goog.require('myphysicslab.sims.engine2D.CurvedTestApp');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const EdgeRange = goog.require('myphysicslab.lab.engine2D.EdgeRange');
const Engine2DTestRig = goog.require('myphysicslab.test.Engine2DTestRig');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const Force = goog.require('myphysicslab.lab.model.Force');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const HumpPath = goog.require('myphysicslab.sims.roller.HumpPath');
const JointUtil = goog.require('myphysicslab.lab.engine2D.JointUtil');
const NewtonsCradleApp = goog.require('myphysicslab.sims.engine2D.NewtonsCradleApp');
const NumericalPath = goog.require('myphysicslab.lab.model.NumericalPath');
const PathEndPoint = goog.require('myphysicslab.lab.engine2D.PathEndPoint');
const PathJoint = goog.require('myphysicslab.lab.engine2D.PathJoint');
const PendulumClockConfig = goog.require('myphysicslab.sims.engine2D.PendulumClockConfig');
const RungeKutta = goog.require('myphysicslab.lab.model.RungeKutta');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TestRig = goog.require('myphysicslab.test.TestRig');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

const checkContactDistances = Engine2DTestRig.checkContactDistances;
const makeVars = Engine2DTestRig.makeVars;
const runTest = Engine2DTestRig.runTest;
const schedule = TestRig.schedule;
const setBodyVars = Engine2DTestRig.setBodyVars;
const setTestName = Engine2DTestRig.setTestName;

/** Miscellaneous tests of engine2D physics engine.
*/
class MiscellanyTest {
/**
* @private
*/
constructor() { throw new Error(); };

static test() {
  schedule(MiscellanyTest.non_collide_edges);
  schedule(MiscellanyTest.damping_standard);
  schedule(MiscellanyTest.clock_with_gears);
  schedule(MiscellanyTest.chain);
  schedule(MiscellanyTest.newtons_cradle);
  schedule(MiscellanyTest.three_body_spin_test1);
  schedule(MiscellanyTest.three_body_spin_test2);
  schedule(MiscellanyTest.three_body_spin_test3A);
  schedule(MiscellanyTest.three_body_spin_test3B);
  schedule(MiscellanyTest.three_body_spin_test4A);
  schedule(MiscellanyTest.three_body_spin_test4B);
  schedule(MiscellanyTest.curved_test_error);
  schedule(MiscellanyTest.roller_hump_test);
  schedule(MiscellanyTest.roller_end_point_test);
};

static testPerformance() {
  schedule(MiscellanyTest.clock_gears_perf);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static newtons_cradle_setup(sim, advance) {
  sim.setShowForces(true);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setDistanceTol(0.01);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  sim.setSimRect(new DoubleRect(-5, -3, 5, 5));
  // JointSmallImpacts==true seems to help with energy stability and joint tightness,
  // but then we get lots of small collisions, which is kind of distracting.
  advance.setJointSmallImpacts(false);
  advance.setDiffEqSolver(new RungeKutta(sim));
  advance.setTimeStep(0.025);
  /** @type {!NewtonsCradleApp.options} */
  var options = {
      stickLength: 3.0,
      radius: 0.6,
      gapDistance: 0,
      numBods: 5,
      startAngle: -Math.PI/4
    };
  NewtonsCradleApp.make(sim, options);
  sim.setElasticity(1.0);
  sim.addForceLaw(new DampingLaw(0.0, 0.15, sim.getSimList()));
  sim.addForceLaw(new GravityLaw(32,  sim.getSimList()));
};

/**
* @return {undefined}
*/
static newtons_cradle() {
  setTestName(MiscellanyTest.groupName+'newtons_cradle');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.newtons_cradle_setup(sim, advance);
  var vars = makeVars(3*5);
  setBodyVars(sim, vars, 0, -2.4099971, 0.0000096, -0.9999987, 0, 0.0000002, 0.0000032);
  setBodyVars(sim, vars, 1, -1.2008376, 0.0000096, -1, 0, 0.000001, 0.0000032);
  setBodyVars(sim, vars, 2, 0.0083218, 0.0000096, -1, 0, 0.000001, 0.0000032);
  setBodyVars(sim, vars, 3, 1.2174815, 0.0000096, -1, 0, 0.0000011, 0.0000032);
  setBodyVars(sim, vars, 4, 2.6955475, -7.3437744, -0.9879222, -0.6609408, 0.0897584, -2.4578176);
  runTest(sim, advance, /*runUntil=*/3.5,
       /*expectedVars=*/vars, /*tolerance=*/0.0001,
       /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0002,
       /*expectedCollisions=*/3);
 Engine2DTestRig.checkTightJoints(sim, /*tolerance=*/0.00001);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static chain_setup(sim, advance) {
  sim.setShowForces(true);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setDistanceTol(0.01);
  sim.setExtraAccel(ExtraAccel.VELOCITY_JOINTS);
  // JointSmallImpacts==true seems to help with energy stability and joint tightness,
  // but then we get lots of small collisions, which is kind of distracting.
  advance.setJointSmallImpacts(false);
  advance.setDiffEqSolver(new RungeKutta(sim));
  advance.setTimeStep(0.025);
  /** @type {!ChainConfig.options} */
  var options = {
      wallPivotX: -5,
      wallPivotY: 4,
      fixedLeft: true,
      fixedRight: true,
      blockWidth: 1.0,
      blockHeight: 3.0,
      numLinks: 7
    };
  var r = ChainConfig.makeChain(sim, options);
  sim.setElasticity(0.8);
  sim.setSimRect(r.scale(1.15));
  sim.addForceLaw(new DampingLaw(0.0, 0.15, sim.getSimList()));
  sim.addForceLaw(new GravityLaw(4.0,  sim.getSimList()));
};

/**
* @return {undefined}
*/
static chain() {
  setTestName(MiscellanyTest.groupName+'chain');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.chain_setup(sim, advance);
  var vars = makeVars(3*7);
  setBodyVars(sim, vars, 0, -4.3917922, 0.2739492, 3.1440883, 0.1946673, -2.5237903, 0.3200673);
  setBodyVars(sim, vars, 1, -3.1342985, 0.3464647, 1.4629927, 0.230839, -2.4749292, -0.2441077);
  setBodyVars(sim, vars, 2, -1.628153, 0.0725155, 0.0309381, -0.0300435, -2.1870376, -0.1194909);
  setBodyVars(sim, vars, 3, 0.2787065, -0, -0.5759324, -0.1324303, -1.5707963, 0.0000001);
  setBodyVars(sim, vars, 4, 2.185566, -0.0725155, 0.0309382, -0.0300434, -0.954555, 0.1194908);
  setBodyVars(sim, vars, 5, 3.6917114, -0.3464645, 1.4629927, 0.230839, -0.6666634, 0.2441076);
  setBodyVars(sim, vars, 6, 4.9492051, -0.2739491, 3.1440884, 0.1946673, -0.6178024, -0.3200672);
  runTest(sim, advance, /*runUntil=*/3.5,
       /*expectedVars=*/vars, /*tolerance=*/0.0001,
       /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0002,
       /*expectedCollisions=*/0);
 Engine2DTestRig.checkTightJoints(sim, /*tolerance=*/0.00001);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static clock_with_gears_setup(sim, advance) {
  sim.setSimRect(new DoubleRect(-2, -2, 6, 4.5))
  sim.setShowForces(true);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setDistanceTol(0.01);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  advance.setJointSmallImpacts(true);
  advance.setDiffEqSolver(new RungeKutta(sim));
  advance.setTimeStep(0.025);
  PendulumClockConfig.makeClockWithGears(sim, /*pendulum_length=*/4.0,
      /*center=*/Vector.ORIGIN);
  sim.setElasticity(0.3);
  var body = sim.getBody(PendulumClockConfig.en.ESCAPE_WHEEL);
  var f = new Force('turning', body,
      /*location=*/new Vector(2, 0), CoordType.BODY,
      /*direction=*/new Vector(0, -1.0), CoordType.BODY);
  sim.addForceLaw(new ConstantForceLaw(f));

  sim.addForceLaw(new DampingLaw(0.05, 0.15, sim.getSimList()));
  sim.addForceLaw(new GravityLaw(10.0,  sim.getSimList()));
};

/**
* @return {undefined}
*/
static clock_with_gears() {
  setTestName(MiscellanyTest.groupName+'clock_with_gears');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.clock_with_gears_setup(sim, advance);
  var vars = makeVars(3*6);
  setBodyVars(sim, vars, 0, 0.2576836, 0.7900146, 0.0072232, 0.0443248, 0.0560475, 0.1720124);
  setBodyVars(sim, vars, 1, 4.728, 0, -0, -0, 0.190146, 0.1462387);
  setBodyVars(sim, vars, 2, -0, -0, -0, 0, -0.2306657, -0.1377898);
  runTest(sim, advance, /*runUntil=*/3.5,
              /*expectedVars=*/vars, /*tolerance=*/0.0001);
};

/**  Performance test that runs the clock_with_gears test.
*/
static clock_gears_perf() {
  var testName = 'clock_gears_perf';
  var expected = TestRig.perfExpected(testName);
  var startTime = Util.systemTime();
  MiscellanyTest.clock_with_gears();
  setTestName(MiscellanyTest.groupName+testName);
  var endTime = Util.systemTime();
  var duration = endTime - startTime;
  var s = TestRig.perfResult(duration, expected);
  var timeLimit = TestRig.getPerfLimit(expected);
  TestRig.reportTestResults(duration <= timeLimit, 'performance', s);
};

/**
* @param {!ContactSim} sim
* @param {!CollisionAdvance} advance
*/
static commonSetup1(sim, advance) {
  sim.setDistanceTol(0.01);
  sim.setVelocityTol(0.5);
  sim.setCollisionAccuracy(0.6);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  advance.setDiffEqSolver(new RungeKutta(sim));
};

/** Test the feature whereby a body can selectively not collide with certain edges of
another body; here a ball and an pendulum are bouncing on the floor under gravity; the
ball collides with the pendulum bob, but not with the pendulum rod; however, the
pendulum rod does collide with the floor.
* @param {!ContactSim} sim
* @param {!CollisionAdvance} advance
* @export
*/
static non_collide_edges_setup(sim, advance) {
  MiscellanyTest.commonSetup1(sim, advance);
  var p1 = Shapes.makePendulum(0.05, 3.0, 0.6, 'pendulum1');
  p1.setPosition(new Vector(0,  0),  5*Math.PI/4);
  sim.addBody(p1);
  var p2 = Shapes.makeBall(0.5, 'ball');
  p2.setMass(0.7);
  p2.setPosition(new Vector(-0.2,  -2),  0);
  var pendulumStart = p1.getEdges()[0].getIndex();
  var pendulumEnd = p1.getEdges()[2].getIndex();
  p2.setNonCollideEdge(new EdgeRange(p1, pendulumStart, pendulumEnd));
  goog.asserts.assert(p2.nonCollideEdge(p1.getEdges()[0]));
  sim.addBody(p2);
  var p3 = Shapes.makeBlock(10, 0.5, 'floor');
  p3.setMass(Util.POSITIVE_INFINITY);
  p3.setPosition(new Vector(0,  -6),  0);
  var floor = p3.getTopWorld();
  p1.setZeroEnergyLevel(floor + 0.6);
  p2.setZeroEnergyLevel(floor + 0.5);
  sim.addBody(p3);
  sim.setElasticity(0.8);
  sim.addForceLaw(new GravityLaw(3.0, sim.getSimList()));
  sim.addForceLaw(new DampingLaw(0.1, 0.15, sim.getSimList()));
};

/** Tests the non-collide edges feature.
* @private
* @return {undefined}
*/
static non_collide_edges() {
  setTestName(MiscellanyTest.groupName+'non_collide_edges');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.non_collide_edges_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 2.677745, 0.67036, -4.8452014, -0.4877325, 7.9760692, 2.9017526);
  setBodyVars(sim, vars, 1, -3.776975, -0.8291956, -4.2064328, -0.4007804, -0, -0);
  runTest(sim, advance, /*runUntil=*/5.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/**
@param {!ContactSim} sim
@private
*/
static damping_init(sim) {
  var p1 = Shapes.makeBall(0.5, 'small');
  //console.log('small moment '+p1.momentAboutCM());
  p1.setPosition(new Vector(2,  0),  0);
  p1.setVelocity(new Vector(0,  0),  2.0);
  sim.addBody(p1);
  var p2 = Shapes.makeBall(1.0, 'large');
  //console.log('large moment '+p2.momentAboutCM());
  p2.setPosition(new Vector(-2,  0),  0);
  p2.setVelocity(new Vector(0,  0),  2.0);
  sim.addBody(p2);
  sim.setElasticity(0.8);
};

/** Two balls rotate at the same initial angular velocity, the larger ball has a
bigger moment of rotation and therefore spins longer under the standard
DampingLaw.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static damping_standard_setup(sim, advance) {
  MiscellanyTest.commonSetup1(sim, advance);
  MiscellanyTest.damping_init(sim);
  sim.addForceLaw(new DampingLaw(0.1, 0.15, sim.getSimList()));
};

/**
* @return {undefined}
*/
static damping_standard() {
  setTestName(MiscellanyTest.groupName+'damping_standard');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.damping_standard_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 2, 0, 0, 0, 6.3536101, 1.2375668);
  setBodyVars(sim, vars, 1, -2, 0, 0, 0, 7.5386376, 1.7738409);
  runTest(sim, advance, /*runUntil=*/4.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/** Three blocks are connected by joints to mimic the arrangement of
{@link myphysicslab.test.RopeTest#double_rod_spin_setup}.
This is intended to be a further test of Joints.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@param {number=} damping
@export
*/
static three_body_spin_setup(sim, advance, damping) {
  if (damping === undefined) {
    damping = 0;
  }
  sim.addForceLaw(new DampingLaw(damping, /*rotateRatio=*/0.15, sim.getSimList()));
  sim.setDistanceTol(0.01);
  sim.setVelocityTol(0.5);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setShowForces(false);
  sim.setCollisionAccuracy(0.6);
  sim.setExtraAccel(ExtraAccel.VELOCITY);
  advance.setDiffEqSolver(new RungeKutta(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  var block1 = Shapes.makeBlock(1, 3, 'block1');
  block1.setMass(2);
  block1.setVelocity(new Vector(-6,  0),  -6);
  sim.addBody(block1);
  var block2 = Shapes.makeBlock(1, 6, 'block2');
  block2.setMass(0.2);
  sim.addBody(block2);
  var block3 = Shapes.makeBlock(1, 3, 'block3');
  block3.setAngle(Math.PI);
  block3.setMass(1);
  block3.setVelocity(new Vector(12,  0),  -6);
  sim.addBody(block3);
  block2.addNonCollide([block1, block3]);
  block1.addNonCollide([block3]);
  block3.addNonCollide([block1]); // just to test removeNonCollide
  block3.removeNonCollide([block1]); // just to test removeNonCollide
  JointUtil.attachRigidBody(sim,
    block2, /*attach point on block2=*/new Vector(0, 2.7),
    block1, /*attach point on block1=*/new Vector(0, -1.3),
    /*normalType=*/CoordType.BODY
    );
  JointUtil.attachRigidBody(sim,
    block2, /*attach point on block2=*/new Vector(0, -2.7),
    block3, /*attach point on block3=*/new Vector(0, -1.3),
    /*normalType=*/CoordType.BODY
    );
  sim.alignConnectors();
  sim.setElasticity(0.8);
  sim.setSimRect(new DoubleRect(-7, -7, 7, 7));
  // The above initial conditions for velocity are approximate and sloppy.
  // To get the joints to stop moving with respect to each other
  // we first find and handle collisions at the joints.
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
  Engine2DTestRig.checkTightJoints(sim, 0.005);
};

/** For three-body-spin setup, confirm that energy is conserved and joints stay tight.
* @return {undefined}
*/
static three_body_spin_test1() {
  setTestName(MiscellanyTest.groupName+'three_body_spin_test1');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.three_body_spin_setup(sim, advance);
  var vars = makeVars((3)*6);
  setBodyVars(sim, vars, 0, 2.3679591, 2.5231233, 0.1758214, 4.7692645, 11.1720974, 6.6244896);
  setBodyVars(sim, vars, 1, -1.070704, -0.9423498, 1.5687438, -10.3375145, 10.3514746, 3.0702532);
  setBodyVars(sim, vars, 2, -4.5217775, -4.8577766, 3.3346085, -7.4710261, 14.0257479, -7.3496166);
  runTest(sim, advance, /*runUntil=*/4,
       /*expectedVars=*/vars, /*tolerance=*/0.00001);
  Engine2DTestRig.checkTightJoints(sim, 0.005);
};

/** For three-body-spin setup, confirm that with smaller time step, energy is
conserved and joints stay tight, with much smaller tolerance.  Here we use time step
of 0.0025 and tolerance of 0.0001 for energy compared to 0.025 and 0.01.
* @return {undefined}
*/
static three_body_spin_test2() {
  setTestName(MiscellanyTest.groupName+'three_body_spin_test2');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.three_body_spin_setup(sim, advance);
  advance.setTimeStep(0.0025);
  var vars = makeVars((3)*6);
  setBodyVars(sim, vars, 0, 2.3693978, 2.5157571, 0.1774004, 4.7723935, 11.1720697, 6.6244608);
  setBodyVars(sim, vars, 1, -1.0715336, -0.9428909, 1.5676422, -10.3428559, 10.3527691, 3.0711914);
  setBodyVars(sim, vars, 2, -4.5244888, -4.8429361, 3.3316707, -7.4762159, 14.0249841, -7.3569172);
  runTest(sim, advance, /*runUntil=*/4,
       /*expectedVars=*/vars, /*tolerance=*/0.00001,
       /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0001,
       /*expectedCollisions=*/-1);
  // check that joints are tight, with smaller tolerance
  Engine2DTestRig.checkTightJoints(sim, 0.000001);
};

/** Uses experimental AdaptiveStepSolver on three-body-spin setup,
confirming that energy is conserved and joints stay tight, although a rather large
time step is specified.
* @return {undefined}
*/
static three_body_spin_test3A() {
  setTestName(MiscellanyTest.groupName+'three_body_spin_test3A');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.three_body_spin_setup(sim, advance);
  var solver = new AdaptiveStepSolver(sim, sim, new RungeKutta(sim));
  solver.setSecondDiff(false);
  advance.setDiffEqSolver(solver);
  var vars = makeVars((3)*6);
  setBodyVars(sim, vars, 0, 2.3693976, 2.515764, 0.1774025, 4.772389, 11.1720697, 6.624474);
  setBodyVars(sim, vars, 1, -1.0715337, -0.9428688, 1.5676466, -10.3428519, 10.3527684, 3.0711811);
  setBodyVars(sim, vars, 2, -4.5244885, -4.8429543, 3.3316656, -7.4762076, 14.0249893, -7.3568965);
  // there are initial collisions that change the energy, handle those first.
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
  // now we can record the true starting energy (after initial collision)
  var startEnergy = sim.getEnergyInfo().getTotalEnergy();
  runTest(sim, advance, /*runUntil=*/4,
       /*expectedVars=*/vars, /*tolerance=*/0.00001,
       /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0001,
       /*expectedCollisions=*/-1);
  if (0 == 1 && Util.DEBUG) {
    console.log('start energy '+Util.NF7(startEnergy)
      +' ending energy '
      +Util.NF7(sim.getEnergyInfo().getTotalEnergy()));
  }
  Engine2DTestRig.checkTightJoints(sim, 0.00001);
};

/** Same test as three_body_spin_test3, but shows that setting
AdaptiveStepSolver to use second differences results in greater accuracy
(at expense of taking more steps). The tolerance on energy difference is much tighter
here.
* @return {undefined}
*/
static three_body_spin_test3B() {
  setTestName(MiscellanyTest.groupName+'three_body_spin_test3B');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.three_body_spin_setup(sim, advance);
  var solver = new AdaptiveStepSolver(sim, sim, new RungeKutta(sim));
  solver.setSecondDiff(true);
  advance.setDiffEqSolver(solver);
  var vars = makeVars((3)*6);
  setBodyVars(sim, vars, 0, 2.3693979, 2.5157564, 0.1774006, 4.7723939, 11.1720697, 6.6244607);
  setBodyVars(sim, vars, 1, -1.0715337, -0.942891, 1.5676421, -10.3428564, 10.3527692, 3.0711915);
  setBodyVars(sim, vars, 2, -4.5244891, -4.8429346, 3.3316704, -7.4762165, 14.024984, -7.356918);
  // there are initial collisions that change the energy, handle those first.
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
  // now we can record the true starting energy (after initial collision)
  var startEnergy = sim.getEnergyInfo().getTotalEnergy();
  runTest(sim, advance, /*runUntil=*/4,
       /*expectedVars=*/vars, /*tolerance=*/0.00001,
       /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
       /*expectedCollisions=*/-1);
  if (0 == 1 && Util.DEBUG) {
    console.log('start energy '+Util.NF7(startEnergy)
      +' ending energy '
      +Util.NF7(sim.getEnergyInfo().getTotalEnergy()));
  }
  Engine2DTestRig.checkTightJoints(sim, 0.00001);
};

/** Runs the three_body_spin setup with damping and a very small step size of 0.001,
using the standard RungeKutta DiffEqSolver. This small step size is
needed to get the same accuracy as the AdaptiveStepSolver, see
{@link #three_body_spin_test4B}.
* @return {undefined}
*/
static three_body_spin_test4A() {
  setTestName(MiscellanyTest.groupName+'three_body_spin_test4A');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.three_body_spin_setup(sim, advance, /*damping=*/0.1);
  advance.setTimeStep(0.001);
  var vars = makeVars((3)*6);
  setBodyVars(sim, vars, 0, -0.3914985, 4.2712576, -0.9371374, -0.2752856, 7.1893131, 2.9115049);
  setBodyVars(sim, vars, 1, 0.999713, 1.1355909, 0.9358352, 3.456432, 9.2880734, 2.0450875);
  setBodyVars(sim, vars, 2, 0.4230309, -8.8727579, 4.5037653, -0.5909616, 13.3797935, 5.0812079);
  // there are initial collisions that change the energy, handle those first.
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
  // now we can record the true starting energy (after initial collision)
  var startEnergy = sim.getEnergyInfo().getTotalEnergy();
  runTest(sim, advance, /*runUntil=*/4,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  if (0 == 1 && Util.DEBUG) {
    console.log('start energy '+Util.NF7(startEnergy)
      +' ending energy '
      +Util.NF7(sim.getEnergyInfo().getTotalEnergy()));
  }
  Engine2DTestRig.checkTightJoints(sim, 0.00001);
};

/** Runs the three_body_spin setup with damping using the experimental
AdaptiveStepSolver. This gives same accuracy as regular
RungeKutta solver with a very small step size of 0.001, see
{@link #three_body_spin_test4A}.
* @return {undefined}
*/
static three_body_spin_test4B() {
  setTestName(MiscellanyTest.groupName+'three_body_spin_test4B');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.three_body_spin_setup(sim, advance, /*damping=*/0.1);
  var solver = new AdaptiveStepSolver(sim, sim, new RungeKutta(sim));
  solver.setSecondDiff(true);
  advance.setDiffEqSolver(solver);
  var vars = makeVars((3)*6);
  setBodyVars(sim, vars, 0, -0.3914985, 4.2712576, -0.9371374, -0.2752856, 7.1893131, 2.9115049);
  setBodyVars(sim, vars, 1, 0.999713, 1.1355909, 0.9358352, 3.456432, 9.2880734, 2.0450875);
  setBodyVars(sim, vars, 2, 0.4230309, -8.8727579, 4.5037653, -0.5909616, 13.3797935, 5.0812079);
  // there are initial collisions that change the energy, handle those first.
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
  // now we can record the true starting energy (after initial collision)
  var startEnergy = sim.getEnergyInfo().getTotalEnergy();
  runTest(sim, advance, /*runUntil=*/4,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  if (0 == 1 && Util.DEBUG) {
    console.log('start energy '+Util.NF7(startEnergy)
      +' ending energy '
      +Util.NF7(sim.getEnergyInfo().getTotalEnergy()));
  }
  Engine2DTestRig.checkTightJoints(sim, 0.00001);
};

/** Sets up error condition found on Sept 15, 2015. Results in simulation getting
'stuck', because ComputeForces is unable to find reasonable set of forces. The problem
is the rectangle gets jammed between two fixed objects, and the distance between them
is very tight.
* @param {!ContactSim} sim
* @return {undefined}
*/
static setupCurvedError(sim) {
  sim.getVarsList().setValue(0, 51.324999999998155);
  sim.getVarsList().setValue(1, 4.938388182728488);
  sim.getVarsList().setValue(2, 77.95311071780354);
  sim.getVarsList().setValue(3, 82.89149890053203);
  sim.getVarsList().setValue(4, -0.4);
  sim.getVarsList().setValue(5, 0);
  sim.getVarsList().setValue(6, -4.6);
  sim.getVarsList().setValue(7, 0);
  sim.getVarsList().setValue(8, -0.19634954084936207);
  sim.getVarsList().setValue(9, 0);
  sim.getVarsList().setValue(10, 3);
  sim.getVarsList().setValue(11, 0);
  sim.getVarsList().setValue(12, -2.1);
  sim.getVarsList().setValue(13, 0);
  sim.getVarsList().setValue(14, 0);
  sim.getVarsList().setValue(15, 0);
  sim.getVarsList().setValue(16, -3.4);
  sim.getVarsList().setValue(17, 0);
  sim.getVarsList().setValue(18, -4.6);
  sim.getVarsList().setValue(19, 0);
  sim.getVarsList().setValue(20, 0.19634954084936207);
  sim.getVarsList().setValue(21, 0);
  sim.getVarsList().setValue(22, 6.7);
  sim.getVarsList().setValue(23, 0);
  sim.getVarsList().setValue(24, -1);
  sim.getVarsList().setValue(25, 0);
  sim.getVarsList().setValue(26, -0.2);
  sim.getVarsList().setValue(27, 0);
  sim.getVarsList().setValue(28, -2.030795390390061);
  sim.getVarsList().setValue(29, 4.512865458735808e-15);
  sim.getVarsList().setValue(30, -4.281663998539167);
  sim.getVarsList().setValue(31, -1.1584129699182643e-14);
  sim.getVarsList().setValue(32, 0.19634954084936204);
  sim.getVarsList().setValue(33, 3.3977124756576173e-17);
  sim.getVarsList().setValue(34, -3.508908223390306);
  sim.getVarsList().setValue(35, -0.0022134459375859725);
  sim.getVarsList().setValue(36, -3.071233147002327);
  sim.getVarsList().setValue(37, -0.18982118035546516);
  sim.getVarsList().setValue(38, -0.7162029577728759);
  sim.getVarsList().setValue(39, -0.007014474875197854);
  sim.getVarsList().setValue(40, -1.4131244157697151);
  sim.getVarsList().setValue(41, -0.06857331596331266);
  sim.getVarsList().setValue(42, -2.408589255520962);
  sim.getVarsList().setValue(43, 0.12595281822724558);
  sim.getVarsList().setValue(44, -112.72011439193216);
  sim.getVarsList().setValue(45, -3.7286560279187655);
  sim.getVarsList().setValue(46, 0.48658427652460706);
  sim.getVarsList().setValue(47, 0.23366497836499053);
  sim.getVarsList().setValue(48, -2.764524317030443);
  sim.getVarsList().setValue(49, -0.19591156901509027);
  sim.getVarsList().setValue(50, 3.7792677989200723);
  sim.getVarsList().setValue(51, 0.30948577445391096);
  sim.getVarsList().setValue(52, 0.6997935247254902);
  sim.getVarsList().setValue(53, -0.022239653137489386);
  sim.getVarsList().setValue(54, -1.858830272934958);
  sim.getVarsList().setValue(55, -0.1391275239412234);
  sim.getVarsList().setValue(56, -20.117731072015484);
  sim.getVarsList().setValue(57, -1.700213190810039);
  sim.getVarsList().setValue(58, -2.8164864386930573);
  sim.getVarsList().setValue(59, -0.31043319580664064);
  sim.getVarsList().setValue(60, -0.936849316206379);
  sim.getVarsList().setValue(61, -0.2824877573186655);
  sim.getVarsList().setValue(62, 88.5596358892376);
  sim.getVarsList().setValue(63, 2.1012464824287935);
  sim.getVarsList().setValue(64, 2);
  sim.getVarsList().setValue(65, 0);
  sim.getVarsList().setValue(66, -6.5);
  sim.getVarsList().setValue(67, 0);
  sim.getVarsList().setValue(68, 0);
  sim.getVarsList().setValue(69, 0);
  sim.getVarsList().setValue(70, 8.5);
  sim.getVarsList().setValue(71, 0);
  sim.getVarsList().setValue(72, 0);
  sim.getVarsList().setValue(73, 0);
  sim.getVarsList().setValue(74, 0);
  sim.getVarsList().setValue(75, 0);
  sim.getVarsList().setValue(76, 2);
  sim.getVarsList().setValue(77, 0);
  sim.getVarsList().setValue(78, 6.5);
  sim.getVarsList().setValue(79, 0);
  sim.getVarsList().setValue(80, 0);
  sim.getVarsList().setValue(81, 0);
  sim.getVarsList().setValue(82, -4.5);
  sim.getVarsList().setValue(83, 0);
  sim.getVarsList().setValue(84, 0);
  sim.getVarsList().setValue(85, 0);
  sim.getVarsList().setValue(86, 0);
  sim.getVarsList().setValue(87, 0);
  sim.modifyObjects();
};

/** Sets up same error condition found on Sept 15, 2015, but at an earlier time. This
results in success the first time it is run, but clicking the 'rewind' button results
in 'stuck' error. The difference is due to random number generator being different. The
first time thru the rectangle doesn't quite get its corner around the vertex of the
fixed block, so it never gets wedged.
* @param {!ContactSim} sim
* @return {undefined}
*/
static setupCurvedError2(sim) {
  sim.getVarsList().setValue(0, 51.12499999999817);
  sim.getVarsList().setValue(1, 6.478454831100117);
  sim.getVarsList().setValue(2, 78.2937280301735);
  sim.getVarsList().setValue(3, 84.7721828612736);
  sim.getVarsList().setValue(4, -0.4);
  sim.getVarsList().setValue(5, 0);
  sim.getVarsList().setValue(6, -4.6);
  sim.getVarsList().setValue(7, 0);
  sim.getVarsList().setValue(8, -0.19634954084936207);
  sim.getVarsList().setValue(9, 0);
  sim.getVarsList().setValue(10, 3);
  sim.getVarsList().setValue(11, 0);
  sim.getVarsList().setValue(12, -2.1);
  sim.getVarsList().setValue(13, 0);
  sim.getVarsList().setValue(14, 0);
  sim.getVarsList().setValue(15, 0);
  sim.getVarsList().setValue(16, -3.4);
  sim.getVarsList().setValue(17, 0);
  sim.getVarsList().setValue(18, -4.6);
  sim.getVarsList().setValue(19, 0);
  sim.getVarsList().setValue(20, 0.19634954084936207);
  sim.getVarsList().setValue(21, 0);
  sim.getVarsList().setValue(22, 6.7);
  sim.getVarsList().setValue(23, 0);
  sim.getVarsList().setValue(24, -1);
  sim.getVarsList().setValue(25, 0);
  sim.getVarsList().setValue(26, -0.2);
  sim.getVarsList().setValue(27, 0);
  sim.getVarsList().setValue(28, -2.030795390390061);
  sim.getVarsList().setValue(29, 4.486604247268123e-15);
  sim.getVarsList().setValue(30, -4.281663998539167);
  sim.getVarsList().setValue(31, -1.1482042636211469e-14);
  sim.getVarsList().setValue(32, 0.19634954084936204);
  sim.getVarsList().setValue(33, 6.87584713690115e-17);
  sim.getVarsList().setValue(34, -3.5068728064155477);
  sim.getVarsList().setValue(35, -0.0874969015117061);
  sim.getVarsList().setValue(36, -3.0837385588443746);
  sim.getVarsList().setValue(37, 0.07482157890600774);
  sim.getVarsList().setValue(38, -0.7072350241865812);
  sim.getVarsList().setValue(39, -0.2398496168863216);
  sim.getVarsList().setValue(40, -1.3893431889644212);
  sim.getVarsList().setValue(41, -0.5206175787053673);
  sim.getVarsList().setValue(42, -2.4214297727639043);
  sim.getVarsList().setValue(43, -0.014224841467205651);
  sim.getVarsList().setValue(44, -111.9743831863484);
  sim.getVarsList().setValue(45, -3.7286560279187637);
  sim.getVarsList().setValue(46, 0.47166508910136906);
  sim.getVarsList().setValue(47, -0.40304993344813866);
  sim.getVarsList().setValue(48, -2.743910140325693);
  sim.getVarsList().setValue(49, -0.12191494516360103);
  sim.getVarsList().setValue(50, 3.741142959521461);
  sim.getVarsList().setValue(51, 0.4530709924506108);
  sim.getVarsList().setValue(52, 0.715136246541778);
  sim.getVarsList().setValue(53, -0.19113181678962832);
  sim.getVarsList().setValue(54, -1.791390854044903);
  sim.getVarsList().setValue(55, -1.2998646084755212);
  sim.getVarsList().setValue(56, -19.77768843385348);
  sim.getVarsList().setValue(57, -1.7002131908100488);
  sim.getVarsList().setValue(58, -2.754399799531728);
  sim.getVarsList().setValue(59, -0.31043319580664064);
  sim.getVarsList().setValue(60, -0.9403517647426459);
  sim.getVarsList().setValue(61, 0.31751224268133454);
  sim.getVarsList().setValue(62, 88.13938659275185);
  sim.getVarsList().setValue(63, 2.1012464824287935);
  sim.getVarsList().setValue(64, 2);
  sim.getVarsList().setValue(65, 0);
  sim.getVarsList().setValue(66, -6.5);
  sim.getVarsList().setValue(67, 0);
  sim.getVarsList().setValue(68, 0);
  sim.getVarsList().setValue(69, 0);
  sim.getVarsList().setValue(70, 8.5);
  sim.getVarsList().setValue(71, 0);
  sim.getVarsList().setValue(72, 0);
  sim.getVarsList().setValue(73, 0);
  sim.getVarsList().setValue(74, 0);
  sim.getVarsList().setValue(75, 0);
  sim.getVarsList().setValue(76, 2);
  sim.getVarsList().setValue(77, 0);
  sim.getVarsList().setValue(78, 6.5);
  sim.getVarsList().setValue(79, 0);
  sim.getVarsList().setValue(80, 0);
  sim.getVarsList().setValue(81, 0);
  sim.getVarsList().setValue(82, -4.5);
  sim.getVarsList().setValue(83, 0);
  sim.getVarsList().setValue(84, 0);
  sim.getVarsList().setValue(85, 0);
  sim.getVarsList().setValue(86, 0);
  sim.getVarsList().setValue(87, 0);
  sim.modifyObjects();
};

/** Shows an error discovered by ERN on Sept 15, 2015.

TO DO: This error state should be fixed or prevented from happening.

@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static curved_test_error_setup(sim, advance) {
  sim.setShowForces(true);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setCollisionAccuracy(0.6);
  sim.setDistanceTol(0.01);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  var r = new DoubleRect(-4, -6, 8, 6);
  sim.setSimRect(r);
  advance.setTimeStep(0.025);
  /** @type {!DampingLaw} */
  var damping = new DampingLaw(0, 0.15);
  /** @type {!GravityLaw} */
  var gravity = new GravityLaw(3.0);
  CurvedTestApp.make(sim, gravity, damping, /*numBods=*/6, r, /*displayList=*/null);
  MiscellanyTest.setupCurvedError(sim);
};

/** Shows an error discovered by ERN on Sept 15, 2015.

TO DO: This error state should be fixed or prevented from happening.

* @return {undefined}
*/
static curved_test_error() {
  setTestName(MiscellanyTest.groupName+'curved_test_error');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.curved_test_error_setup(sim, advance);
  Engine2DTestRig.runExceptionTest(advance, /*time=*/sim.getTime()+1.0);
};

/** Setup a RigidBody connected to a 'roller coaster' hump shaped NumericalPath
with a PathJoint.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static roller_hump_setup(sim, advance) {
  MiscellanyTest.commonSetup1(sim, advance);
  advance.setJointSmallImpacts(false);
  sim.setExtraAccel(ExtraAccel.VELOCITY_JOINTS);
  var path = new NumericalPath(new HumpPath());
  sim.getSimList().add(path);
  var block = Shapes.makeBlock(1, 3, 'block');
  block.setPosition(new Vector(-4,  4),  Math.PI/4);
  block.setVelocity(new Vector(0,  0),  0);
  sim.addBody(block);
  var attach = block.getDragPoints()[1];
  var pathJoint = new PathJoint(path, block, attach);
  sim.addConnector(pathJoint);
  sim.alignConnectors();
  sim.addForceLaw(new GravityLaw(3.0, sim.getSimList()));
};

/** Tests a RigidBody connected to a 'roller coaster' hump shaped NumericalPath
with a PathJoint.
* @return {undefined}
*/
static roller_hump_test() {
  setTestName(MiscellanyTest.groupName+'roller_hump_test');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.roller_hump_setup(sim, advance);
  var vars = makeVars(1*6);
  setBodyVars(sim, vars, 0, 0.9930475, 0.7033436, 3.1804777, -2.0938717, 6.084699, 0.8542802);
  runTest(sim, advance, /*runUntil=*/4,
       /*expectedVars=*/vars, /*tolerance=*/0.00001,
       /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.002,
       /*expectedCollisions=*/-1);
  // check that joints are tight, with smaller tolerance
  Engine2DTestRig.checkTightJoints(sim, 0.0003);
};

/** Setup a RigidBody connected to a 'roller coaster' circle shaped NumericalPath
with a PathJoint; also there is a PathEndPoint that limits travel of the RigidBody.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static roller_end_point_setup(sim, advance) {
  MiscellanyTest.commonSetup1(sim, advance);
  advance.setJointSmallImpacts(false);
  sim.setExtraAccel(ExtraAccel.VELOCITY_JOINTS);
  var path = new NumericalPath(new CirclePath(/*radius=*/3));
  sim.getSimList().add(path);
  var block = Shapes.makeBlock(1, 3, 'block');
  block.setPosition(new Vector(-4,  4),  Math.PI/4);
  block.setVelocity(new Vector(0,  0),  0);
  block.setElasticity(0.5);
  sim.addBody(block);
  var attach = block.getDragPoints()[1];
  var pathJoint = new PathJoint(path, block, attach);
  sim.addConnector(pathJoint);
  // stop-point at 45 degrees southwest of center.
  var endPt = path.findNearestGlobal(new Vector(-2, -2));
  sim.addConnector(new PathEndPoint('stop point', path, block,
    attach, endPt.p, /*upperLimit=*/true));
  sim.alignConnectors();
  sim.addForceLaw(new GravityLaw(3.0, sim.getSimList()));
};

/** Tests a RigidBody connected to a 'roller coaster' circle shaped NumericalPath
with a PathJoint; also there is a PathEndPoint that limits travel of the RigidBody.
* @return {undefined}
*/
static roller_end_point_test() {
  setTestName(MiscellanyTest.groupName+'roller_end_point_test');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  MiscellanyTest.roller_end_point_setup(sim, advance);
  var vars = makeVars(1*6);
  setBodyVars(sim, vars, 0, -1.7363317, 0.5083806, -2.9337104, 0.2411583, 9.8677229, 0.6252024);
  runTest(sim, advance, /*runUntil=*/10,
       /*expectedVars=*/vars, /*tolerance=*/0.00001);
  runTest(sim, advance, /*runUntil=*/15,
       /*expectedVars=*/null, /*tolerance=*/NaN,
       /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.002,
       /*expectedCollisions=*/-1);
  // check that joints are tight, with smaller tolerance
  Engine2DTestRig.checkTightJoints(sim, 0.003);
};

} // end class

/**
* @type {string}
* @const
*/
MiscellanyTest.groupName = 'MiscellanyTest.';

exports = MiscellanyTest;
