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

goog.module('myphysicslab.test.JointTest');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CollisionHandling = goog.require('myphysicslab.lab.engine2D.CollisionHandling');
const ConcreteLine = goog.require('myphysicslab.lab.model.ConcreteLine');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const Engine2DTestRig = goog.require('myphysicslab.test.Engine2DTestRig');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const Joint = goog.require('myphysicslab.lab.engine2D.Joint');
const JointUtil = goog.require('myphysicslab.lab.engine2D.JointUtil');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const RungeKutta = goog.require('myphysicslab.lab.model.RungeKutta');
const Scrim = goog.require('myphysicslab.lab.engine2D.Scrim');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TestShapes = goog.require('myphysicslab.test.TestShapes');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/** Tests various configurations of Joints.

@todo: the tests with two moveable blocks are very confusing.  What would help is to
show both attach points, and the line perpendicular to the normal at each attach
point.

@todo: Joint.align() will only align on ONE point, it only translates one of the objects
(and does not rotate). So, an object that has joints at two distinct places is going to
need custom alignment. Basically, Joint.align() works fine with the usual 'double-joint'
approach, and doesn't work in the other cases you find here in JointTest.

@todo  make tests using each configuration of joints.

*/
class JointTest {
/**
* @private
*/
constructor() { throw new Error(); };

static test() {
  Engine2DTestRig.schedule(JointTest.pendulum_1_joint_1);
  Engine2DTestRig.schedule(JointTest.pendulum_1_joint_2);
  Engine2DTestRig.schedule(JointTest.pendulum_2_joints_1);
  Engine2DTestRig.schedule(JointTest.pendulum_2_joints_offset_1);
  Engine2DTestRig.schedule(JointTest.two_blocks_2_dbl_joint_1);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@private
*/
static commonSetup1(sim, advance) {
  sim.addForceLaw(new DampingLaw(0, 0.15, sim.getSimList()));
  sim.setDistanceTol(0.01);
  sim.setVelocityTol(0.5);
  sim.setCollisionAccuracy(0.6);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(99999);
  if (sim instanceof ContactSim) {
    sim.setExtraAccel(ExtraAccel.NONE);
  }
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
  advance.setDiffEqSolver(new RungeKutta(sim));
};

/**
@param {!ContactSim} sim
@param {!JointTest.JointTestConfig} testConfig
@param {!CoordType} normalType
@private
*/
static buildJointTest(sim, testConfig, normalType) {
  const JointTestConfig = JointTest.JointTestConfig;
  switch (testConfig) {
    case JointTestConfig.PENDULUM_1_JOINT:
    case JointTestConfig.PENDULUM_2_JOINTS:
    case JointTestConfig.PENDULUM_3_JOINTS_OFFSET:
    case JointTestConfig.PENDULUM_2_JOINTS_OFFSET:
      JointTest.makeBlockPendulum(sim, testConfig, normalType);
      break;

    case JointTestConfig.TWO_BLOCKS_1_JOINT:
    case JointTestConfig.TWO_BLOCKS_2_JOINTS:
    case JointTestConfig.TWO_BLOCKS_3_JOINTS:
    case JointTestConfig.TWO_BLOCKS_4_JOINTS:
    case JointTestConfig.TWO_BLOCKS_1_DBL_JOINT:
    case JointTestConfig.TWO_BLOCKS_2_DBL_JOINT:
      JointTest.makeConnectedBlocks(sim, testConfig, normalType);
      break;
  default:
    throw new Error();
  }
};

/**
@param {!ContactSim} sim
@param {!JointTest.JointTestConfig} testConfig
@param {!CoordType} normalType
@private
*/
static makeBlockPendulum(sim, testConfig, normalType) {
  const JointTestConfig = JointTest.JointTestConfig;
  // pendulum from fixed point, start it moving.
  var p1 = Shapes.makeBlock(1.0, 5.0, 'PENDULUM');
  p1.setDragPoints([new Vector(0.0, -2.0)]);
  p1.setPosition(new Vector(0.0,  -2.0),  0.0);
  p1.setZeroEnergyLevel();
  sim.addBody(p1);
  var attach1 = new Vector(0.0, 2.0);
  var attach2 = new Vector(0.0, 0.0);
  var attach3 = new Vector(-0.4, -1.0);
  var normal0 = Vector.NORTH;
  var normal1 = Vector.EAST;
  // optional:  add the 'second' joint in two different places
  switch (testConfig) {
    case JointTestConfig.PENDULUM_2_JOINTS:
      JointUtil.addSingleFixedJoint(sim, p1, attach1, normalType, normal1);
      break;

    case JointTestConfig.PENDULUM_3_JOINTS_OFFSET:
      JointUtil.addSingleFixedJoint(sim, p1, attach3, normalType, normal0);
      // INTENTIONAL FALLTHROUGH
    case JointTestConfig.PENDULUM_2_JOINTS_OFFSET:
      JointUtil.addSingleFixedJoint(sim, p1, attach2, normalType, normal1);
      break;
    default:
  }
  // always add the 'first' joint
  {
    JointUtil.addSingleFixedJoint(sim, p1, attach1, normalType, normal0);
    var pt1 = PointMass.makeCircle(0.2, 'ATTACH1')
        .setMass(Util.POSITIVE_INFINITY);
    pt1.setPosition(p1.bodyToWorld(attach1));
    sim.getSimList().add(pt1);
  }
  sim.setElasticity(0.8);
  sim.alignConnectors();

  if (0 == 1) {  // set initial velocity
    if (0 == 1) {
      // let handle collision work out the initial conditions
      p1.setVelocity(new Vector(10,  0),  0);
    } else {
      // set to result of what handle collision would do
      p1.setVelocity(new Vector(6.4864865,  0),  3.2432432);
    }
    sim.initializeFromBody(p1);
  }

};

/**
@param {!ContactSim} sim
@param {!JointTest.JointTestConfig} testConfig
@param {!CoordType} normalType
@private
*/
static makeConnectedBlocks(sim, testConfig, normalType) {
  const JointTestConfig = JointTest.JointTestConfig;
  var x = 0;
  var y = 0;
  var angle = 0;
  var zeroEnergyLevel = 0;
  var p1 = Shapes.makeBlock(1.0, 1.0, 'connect1');
  var p2 = Shapes.makeBlock(0.9, 1.1, 'connect2');
  p1.setMass(0.6);
  p2.setMass(0.6);
  p1.setPosition(new Vector(x,  y),  angle);
  p2.setPosition(new Vector(x,  y),  angle);
  sim.addBody(p1);
  sim.addBody(p2);
  p1.setZeroEnergyLevel(zeroEnergyLevel);
  p2.setZeroEnergyLevel(zeroEnergyLevel);
  var attach1 = new Vector(0, -0.4);
  var attach2 = new Vector(-0.4, 0);
  var attach3 = new Vector(0.4, 0);
  var attach4 = new Vector(0, 0.4);
  var attach5 = new Vector(0, 0);
  var attach6 = new Vector(-0.4, 0.4);
  var attach7 = new Vector(0.4, -0.4);
  var attach8 = new Vector(0.0, 0.0);
  var normal0 = Vector.NORTH;
  var normal1 = Vector.EAST;
  var normal2 = (new Vector(0.2, 0.8)).normalize();
  var normal6 = (new Vector(-0.5, 0.5)).normalize();
  var normal4 = Vector.EAST;
  var normal8 = (new Vector(0.6, -0.4)).normalize();
  // all configs have at least one joint
  switch (testConfig) {
    // use case statement fall-thru here to get 1,2, 3 or 4 joints
    case JointTestConfig.TWO_BLOCKS_4_JOINTS:
      JointUtil.addSingleJoint(sim, p1, attach7, p2, attach8, normalType, normal8);
      // INTENTIONAL FALLTHROUGH
    case JointTestConfig.TWO_BLOCKS_3_JOINTS:
      JointUtil.addSingleJoint(sim, p1, attach5, p2, attach6, normalType, normal6);
      // INTENTIONAL FALLTHROUGH
    case JointTestConfig.TWO_BLOCKS_2_JOINTS:
      JointUtil.addSingleJoint(sim, p1, attach3, p2, attach4, normalType, normal4);
      // INTENTIONAL FALLTHROUGH
    case JointTestConfig.TWO_BLOCKS_1_JOINT:
      JointUtil.addSingleJoint(sim, p1, attach1, p2, attach2, normalType, normal2);
      break;

    case JointTestConfig.TWO_BLOCKS_2_DBL_JOINT:
      JointUtil.addSingleJoint(sim, p1, attach3, p2, attach4, normalType, normal0);
      JointUtil.addSingleJoint(sim, p1, attach3, p2, attach4, normalType, normal1);
      // INTENTIONAL FALLTHROUGH
    case JointTestConfig.TWO_BLOCKS_1_DBL_JOINT:
      JointUtil.addSingleJoint(sim, p1, attach1, p2, attach2, normalType, normal0);
      JointUtil.addSingleJoint(sim, p1, attach1, p2, attach2, normalType, normal1);
      break;

    default: throw new Error();

  }
  sim.setElasticity(0.8);
  sim.alignConnectors();
};

/** Setup the pendulum with 1 joint scenario;  the pendulum travels on a horizontal
track, rocking back and forth because it starts at an angle.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static pendulum_1_joint_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.PENDULUM_1_JOINT, CoordType.WORLD);
  var pendulum = sim.getBody('pendulum');
  pendulum.setAngle(Math.PI/3);
  sim.alignConnectors();
  sim.addForceLaw(new GravityLaw(5.0, sim.getSimList()));
  // show the line that the joint travels on
  var line = new ConcreteLine('joint-line', new Vector(0, 0), new Vector(4, 0));
  DisplayLine.color = 'yellow';
  sim.getSimList().add(line);
};

/** Shows that pendulum with 1 joint scenario has fairly good energy conservation
and joint tightness using 'small impacts' on joints  and ExtraAccel.VELOCITY.
@return {undefined}
*/
static pendulum_1_joint_1() {
  Engine2DTestRig.testName = JointTest.groupName+'pendulum_1_joint_1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  JointTest.pendulum_1_joint_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 1.7320508, 0, -1.3687651, -1.3515045, -0.8170398, 0.9268013);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/15.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
               /*expectedCollisions=*/-1);
  Engine2DTestRig.checkTightJoints(sim, 0.000001);
};

/** Shows that pendulum with 1 joint scenario has fairly poor energy conservation and
poor joint tightness using extra accel on joints and
ExtraAccel.VELOCITY_AND_DISTANCE, when `CollisionAdvance.setJointSmallImpacts()`
is turned off.
@return {undefined}
*/
static pendulum_1_joint_2() {
  Engine2DTestRig.testName = JointTest.groupName+'pendulum_1_joint_2';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  JointTest.pendulum_1_joint_setup(sim, advance);
  // special settings here:
  advance.setJointSmallImpacts(false);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE_JOINTS);
  var vars = Engine2DTestRig.makeVars(6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 1.7320508, 0, -1.3680947, -1.3501097, -0.8175124, 0.9262573);
  // loose tolerance for energy
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/15.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
               /*expectedCollisions=*/-1);
  Engine2DTestRig.checkTightJoints(sim, 0.00012);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static pendulum_2_joints_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.PENDULUM_2_JOINTS, CoordType.WORLD);
  var pendulum = sim.getBody('pendulum');
  pendulum.setAngle(Math.PI/3);
  sim.alignConnectors();
  sim.addForceLaw(new GravityLaw(5.0, sim.getSimList()));
};

/**
@return {undefined}
*/
static pendulum_2_joints_1() {
  Engine2DTestRig.testName = JointTest.groupName+'pendulum_2_joints_1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  JointTest.pendulum_2_joints_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, -1.7297436, 0.0807141, -1.0039856, -0.1390604, -1.0448949, 0.0803936);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/8.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
               /*expectedCollisions=*/-1);
  Engine2DTestRig.checkTightJoints(sim, 0.000001);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static pendulum_2_joints_offset_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.PENDULUM_2_JOINTS_OFFSET, CoordType.WORLD);
  var pendulum = sim.getBody('pendulum');
  pendulum.setAngle(Math.PI/3);
  sim.alignConnectors();
  sim.addForceLaw(new GravityLaw(5.0, sim.getSimList()));
  // show the line that joint1 travels on
  var joint =  /** @type {?Joint} */(goog.array.find(sim.getSimList().toArray(),
      function(obj, index, array) { return obj.getName() == 'JOINT1';}));
  var line;
  if (joint != null) {
    line = new ConcreteLine('joint1_line', joint.getPosition1().add(new Vector(-4, 0)),
        joint.getPosition1().add(new Vector(4, 0)));
    DisplayLine.color = 'yellow';
    sim.getSimList().add(line);
  }
  // show the line that joint0 travels on
  joint = /** @type {?Joint} */(goog.array.find(sim.getSimList().toArray(),
      function(obj, index, array) { return obj.getName() == 'JOINT0'; }));
  if (joint != null) {
    line = new ConcreteLine('joint0_line', joint.getPosition1().add(new Vector(0, -4)),
        joint.getPosition1().add(new Vector(0, 4)));
    console.log('line='+line);
    DisplayLine.color = 'yellow';
    sim.getSimList().add(line);
  }
};

/**
@return {undefined}
*/
static pendulum_2_joints_offset_1() {
  const JointTestConfig = JointTest.JointTestConfig;
  Engine2DTestRig.testName = JointTest.groupName+'pendulum_2_joints_offset_1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  JointTest.pendulum_2_joints_offset_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 1.7320508, 0, -1.1100682, 0.7857346, 0.9823923, 0.4722942);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/8.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
               /*expectedCollisions=*/-1);
  // BUG: cannot check joint tightness because not correctly aligned at start.
  //Engine2DTestRig.checkTightJoints(sim, 0.000001);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static pendulum_3_joints_offset_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.PENDULUM_3_JOINTS_OFFSET, CoordType.WORLD);
  var pendulum = sim.getBody('pendulum');
  pendulum.setAngle(Math.PI/3);
  sim.alignConnectors();
  sim.addForceLaw(new GravityLaw(5.0, sim.getSimList()));
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static two_blocks_1_joint_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.TWO_BLOCKS_1_JOINT, CoordType.BODY);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static two_blocks_2_joints_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.TWO_BLOCKS_2_JOINTS, CoordType.BODY);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static two_blocks_3_joints_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.TWO_BLOCKS_3_JOINTS, CoordType.BODY);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static two_blocks_4_joints_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.TWO_BLOCKS_4_JOINTS, CoordType.BODY);
  var body1 = sim.getBody('connect1');
  body1.setVelocity(new Vector(0,  0),  6);
  sim.initializeFromBody(body1);
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static two_blocks_1_dbl_joint_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.TWO_BLOCKS_1_DBL_JOINT, CoordType.BODY);
};

/**
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static two_blocks_2_dbl_joint_setup(sim, advance) {
  const JointTestConfig = JointTest.JointTestConfig;
  JointTest.commonSetup1(sim, advance);
  JointTest.buildJointTest(sim, JointTestConfig.TWO_BLOCKS_2_DBL_JOINT, CoordType.BODY);
  var body1 = sim.getBody('connect1');
  body1.setVelocity(new Vector(0,  0),  6);
  sim.setElasticity(0.8);
  sim.initializeFromBody(body1);
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
};

/**
@return {undefined}
*/
static two_blocks_2_dbl_joint_1() {
  const JointTestConfig = JointTest.JointTestConfig;
  Engine2DTestRig.testName = JointTest.groupName+'two_blocks_2_dbl_joint_1';
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  JointTest.two_blocks_2_dbl_joint_setup(sim, advance);
  var vars = Engine2DTestRig.makeVars(6*2);
  Engine2DTestRig.setBodyVars(sim, vars, 0, 0.4674208, 0.1861004, -0.2921196, 0.5402443, 16.1616176, 2.0202021);
  Engine2DTestRig.setBodyVars(sim, vars, 1, -0.0674208, -0.1861004, -0.1078804, -0.5402443, 16.1616176, 2.0202021);
  Engine2DTestRig.runTest(sim, advance, /*runUntil=*/8.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
               /*expectedCollisions=*/-1);
  Engine2DTestRig.checkTightJoints(sim, 0.000001);
};

} //end class

/**
* @enum {number}
*/
JointTest.JointTestConfig = {
  PENDULUM_1_JOINT: 1,
  PENDULUM_2_JOINTS: 2,
  PENDULUM_2_JOINTS_OFFSET: 3,
  PENDULUM_3_JOINTS_OFFSET: 4,
  TWO_BLOCKS_1_JOINT: 5,
  TWO_BLOCKS_2_JOINTS: 6,
  TWO_BLOCKS_3_JOINTS: 7,
  TWO_BLOCKS_4_JOINTS: 8,
  TWO_BLOCKS_1_DBL_JOINT: 9,
  TWO_BLOCKS_2_DBL_JOINT: 10
};

/**
* @type {string}
* @const
*/
JointTest.groupName = 'JointTest.';

exports = JointTest;
