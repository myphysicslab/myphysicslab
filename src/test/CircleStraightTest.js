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

goog.module('myphysicslab.test.CircleStraightTest');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CollisionHandling = goog.require('myphysicslab.lab.engine2D.CollisionHandling');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const Engine2DTestRig = goog.require('myphysicslab.test.Engine2DTestRig');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const Gravity2Law = goog.require('myphysicslab.lab.model.Gravity2Law');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const ImpulseSim = goog.require('myphysicslab.lab.engine2D.ImpulseSim');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const RungeKutta = goog.require('myphysicslab.lab.model.RungeKutta');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TestRig = goog.require('myphysicslab.test.TestRig');
const TestShapes = goog.require('myphysicslab.test.TestShapes');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

const checkContactDistances = Engine2DTestRig.checkContactDistances;
const makeVars = Engine2DTestRig.makeVars;
const runTest = Engine2DTestRig.runTest;
const schedule = TestRig.schedule;
const setBodyVars = Engine2DTestRig.setBodyVars;
const setTestName = Engine2DTestRig.setTestName;

/** Tests interactions between polygons with circular and straight edges.

Why are some of these tests using such small time steps???  to show energy conservation?

@todo  arc (partial circle) tests.
*/
class CircleStraightTest {
/**
@private
*/
constructor() { throw new Error(); };

static test() {
  schedule(CircleStraightTest.ball_block_collide);
  schedule(CircleStraightTest.ball_block_attract);
  schedule(CircleStraightTest.ball_block_contact);
  schedule(CircleStraightTest.circle_arc_block);
  schedule(CircleStraightTest.concave_ball_block_collide);
  schedule(CircleStraightTest.concave_ball_block_contact);
  schedule(CircleStraightTest.concave_ball_block_contact_2);
  schedule(CircleStraightTest.rotating_block_vs_ball_0);
  schedule(CircleStraightTest.rotating_block_vs_ball_1);
  schedule(CircleStraightTest.ball_falls_on_floor_stuck);
  schedule(CircleStraightTest.wedged_ball);
  schedule(CircleStraightTest.elastic_balls);
};

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@param {number=} damping
@private
*/
static commonSetup1(sim, advance, damping) {
  damping = damping === undefined ? 0 : damping;
  sim.addForceLaw(new DampingLaw(damping, 0.5, sim.getSimList()));
  sim.setCollisionAccuracy(0.6);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(99999);
  sim.setDistanceTol(0.01);
  sim.setVelocityTol(0.5);
  if (sim instanceof ContactSim) {
    sim.setExtraAccel(ExtraAccel.VELOCITY);
  }
  advance.setTimeStep(0.025);
  advance.setDiffEqSolver(new RungeKutta(sim));
};

/**  Ball collides with corner of a block.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static ball_block_collide_setup(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance);
  var body0 = Shapes.makeBall(0.75, 'ball');
  body0.setCenterOfMass(0, 0.2);
  body0.setPosition(new Vector(-2,  2),  0);
  body0.setVelocity(new Vector(1,  -1),  1);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(1, 1, 'block');
  body1.setPosition(new Vector(0,  0),  0);
  sim.addBody(body1);
  sim.setElasticity(1.0);
  //sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/**
@return {undefined}
@private
*/
static ball_block_collide() {
  setTestName(CircleStraightTest.groupName+'ball_block_collide');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.ball_block_collide_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, -1.135972, 0.0179439, 1.1812653, 0.0028806, 3.1087039, 1.0499788);
  setBodyVars(sim, vars, 1, 2.135972, 0.9820561, -2.1812653, -1.0028806, 0.1358799, 0.0624735);
  runTest(sim, advance, /*runUntil=*/3.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
               /*expectedCollisions=*/-1);
};

/** Ball collides with corner of a block, then they mutually attract each other and
collide and then have rolling rocking contact. Note this test activates the
HANDLE_COLLISION_FAIL condition in CollisionAdvance.

This resulted in a STUCK condition on June 11 2015. The fix was to turn on binary
search when stuck count > 1. After a bunch of rolling this simulation has the "too
close" tiny distance condition (distance is around 0.0006). And then there is an
unresolveable collision because the pre-collision velocity is positive and tiny
(0.00023). Binary search fails to find a before/after collision with negative velocity
in the before state that can be corrected.

I'm pretty sure what's going on is this: We take two smaller steps during the binary
search which results in no actual collision being found; we gain better accuracy from
the small steps, the contact forces are calculated more frequently and so we correctly
maintain the tiny distance of 0.0006 to the next step. Turning on binary search thus
lets us get past this point, though it doesn't fix the tiny distance.

@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static ball_block_attract_setup(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance);
  var body0 = Shapes.makeBall(0.75, 'ball');
  body0.setCenterOfMass(0, 0.2);
  body0.setPosition(new Vector(-2,  2),  0);
  body0.setVelocity(new Vector(0.1,  -0.1),  1);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(1, 1, 'block');
  body1.setPosition(new Vector(0,  0),  0);
  body1.setVelocity(new Vector(-0.1,  0.1),  -1);
  sim.addBody(body1);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/** On June 11 2015, HANDLE_COLLISION_FAIL was coming up during this test at time
16.925.  June 22 2015: no longer getting HANDLE_COLLISION_FAIL.
@return {undefined}
@private
*/
static ball_block_attract() {
  setTestName(CircleStraightTest.groupName+'ball_block_attract');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.ball_block_attract_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, -1.3699699, 0.2138555, 1.5307076, -0.2372712, 33.3931299, 1.7136164);
  setBodyVars(sim, vars, 1, -0.6300301, -0.2138555, 0.4692924, 0.2372712, -7.2779759, -1.8957024);
  runTest(sim, advance, /*runUntil=*/20.0,
              /*expectedVars=*/vars, /*tolerance=*/0.0001);
};

/** Ball and block start in contact and in motion, with mutual gravitation. Ball has
offset center of mass. Energy should be constant with a small enough time step.
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
static ball_block_contact_setup(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance);
  var body0 = Shapes.makeBall(0.75, 'ball');
  body0.setCenterOfMass(0, 0.2);
  body0.setPosition(new Vector(-0.2525,  0),  0);
  body0.setVelocity(new Vector(0,  0.6),  1);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(1, 3, 'block');
  body1.setPosition(new Vector(1,  0),  0);
  body1.setVelocity(new Vector(0,  -0.6),  0);
  sim.addBody(body1);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
  var collisions = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
};

/** Tests the ball & block scenario, that energy is stable and there are no
collisions, after initial second to stabilize (because a collision happens
in the setup function).
@return {undefined}
@private
*/
static ball_block_contact() {
  setTestName(CircleStraightTest.groupName+'ball_block_contact');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.ball_block_contact_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, -0.2749218, 0.0874195, 0.4044095, 0.1208178, 0.4380613, 0.0903604);
  setBodyVars(sim, vars, 1, 1.0224218, -0.0874195, -0.4044095, -0.1208178, -0.0766021, -0.3218581);
  runTest(sim, advance, /*runUntil=*/1.0,
          /*expectedVars=*/vars, /*tolerance=*/0.00001);
  setBodyVars(sim, vars, 0, -0.0405174, -0.1600652, 0.4408221, -0.0927029, -2.9119182, -1.956407);
  setBodyVars(sim, vars, 1, 0.7880174, 0.1600652, -0.4408221, 0.0927029, -0.4529687, -0.165526);
  runTest(sim, advance, /*runUntil=*/4.0,
          /*expectedVars=*/vars, /*tolerance=*/0.00001,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
          /*expectedCollisions=*/0);
};

/** A block collides into another block that has a circular arc edge, then
they settle into rocking contact under mutual gravitation.
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
static circle_arc_block_setup(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance);
  advance.setTimeStep(0.01);
  var p = TestShapes.makeBlockRoundEdge();
  p.setPosition(new Vector(0,  -1),  0);
  sim.addBody(p);
  var p2 = Shapes.makeBlock(1, 1, 'block');
  p2.setPosition(new Vector(2.5,  0.3),  Math.PI/8 - Math.PI/24);
  sim.addBody(p2);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/**
@return {undefined}
@private
*/
static circle_arc_block() {
  setTestName(CircleStraightTest.groupName+'circle_arc_block');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.circle_arc_block_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 0.8343664, 0.164365, -0.7928884, -0.2694134, -1.0677983, -0.8300614);
  setBodyVars(sim, vars, 1, 1.6656336, -0.164365, 0.0928884, 0.2694134, 0.5765963, 0.188213);
  runTest(sim, advance, /*runUntil=*/8.0,
      /*expectedVars=*/vars, /*tolerance=*/0.0001);
  // run for a few more seconds: there should be no more collision searches,
  // and energy should be constant
  runTest(sim, advance, /*runUntil=*/12.0,
      /*expectedVars=*/null, /*tolerance=*/Util.NaN,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0001,
      /*expectedCollisions=*/0);
};

/** Concave circular edge collides with a block, settles into rocking contact.
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
static concave_ball_block_collide_setup(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance);
  advance.setTimeStep(0.01);
  var p = TestShapes.makeConcaveCirclePoly();
  //p.printAll();
  p.setPosition(new Vector(0,  -2),  0);
  sim.addBody(p);
  var p2 = Shapes.makeBlock(1, 1, 'block');
  p2.setPosition(new Vector(0.5,  -0.22),  Math.PI/8 - Math.PI/24);

  sim.addBody(p2);
  sim.setElasticity(0.8);
  sim.addForceLaw(new Gravity2Law(3.0, sim.getSimList()));
};

/**
@return {undefined}
@private
*/
static concave_ball_block_collide() {
  setTestName(CircleStraightTest.groupName+'concave_ball_block_collide');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.concave_ball_block_collide_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 0.3091927, 0.5475717, -1.5539282, 0.0193363, 0.084485, -0.2984758);
  setBodyVars(sim, vars, 1, 0.1908073, -0.5475717, -0.6660718, -0.0193363, -1.5117501, -1.2518051);
  runTest(sim, advance, /*runUntil=*/8.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // run for a few more seconds: there should be no more collision searches,
  // and energy should be constant
  runTest(sim, advance, /*runUntil=*/12.0,
      /*expectedVars=*/null, /*tolerance=*/Util.NaN,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.001,
      /*expectedCollisions=*/0);
};

/** A body with a concave circle edge starts in contact with a square block, both bodies
attracting each other by mutual gravitation, they start rocking. This test uses a unique
approach for positioning the objects where we look at the collision/contact depth
between the objects while iteratively setting the initial position until it is at a
precise distance. The concave circle object is initially below the block. Each time in
the loop we move the block from the origin, a distance of 1.5 to the current estimated
location for the block. If no collision results, then we continue to increase the
distance which moves the block lower. If a collision results, we reduce the distance by
the depth of the collision plus the desired ending gap, and try again.
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
static concave_ball_block_contact_setup(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance);
  advance.setTimeStep(0.01);
  var p = TestShapes.makeConcaveCirclePoly();
  // p.printAll();  // use this to learn where circle origin is.
  // Set position so the center of the circle is at the origin.
  p.setPosition(new Vector(0,  -2.3228757),  0);
  p.setElasticity(0.8);
  sim.addBody(p);
  var p2 = Shapes.makeBlock(1, 1, 'block');
  p2.setElasticity(0.8);
  var angle = Math.PI/16; // angle to set block at
  var dist = 1.5;  // distance from origin to place block at
  var error = Util.POSITIVE_INFINITY;
  // Loop until error = 0, or equiv: distanceToHalfGap() = 0.001.
  while (Math.abs(error) > 1e-8) {
    //console.log('dist='+Util.NF7(dist)+' error='+Util.NF7(error));
    // Collision testing looks at the current and previous positions of bodies,
    // therefore we must move the body each time.
    p2.setPosition(new Vector(0,  0),  angle);  // move to start position
    p2.saveOldCoords(); // store the previous body position
    p.saveOldCoords();
    // move to current location, at given distance from origin and angle
    p2.setPosition(new Vector(dist*Math.sin(angle), -dist*Math.cos(angle)), angle);
    var collisions = /** @type {!Array<!RigidBodyCollision>} */([]);
    p.checkCollision(collisions, p2, /*time=*/0);
    if (collisions.length == 0) {
      dist += 0.01;
    } else {
      error = Util.POSITIVE_INFINITY;
      // find most negative or least positive depth among all collisions
      for (var i=0, len=collisions.length; i<len; i++) {
        /** @type {!RigidBodyCollision} */
        var c = collisions[i];
        var depth = c.distanceToHalfGap() - 0.001;
        if (depth < error) {
          error = depth;
        }
      }
      dist += error;
    }
  }
  sim.addBody(p2);
  sim.addForceLaw(new Gravity2Law(10.0, sim.getSimList()));
};

/** This situation should have stable constant energy, but instead we see a slow
increase in energy, gap distance, and gap velocity. Adding the following in
CircularEdge.findVertexContact results in near stable contact:
{rbc.radius2 *= 1.000003175;}
@return {undefined}
@private
*/
static concave_ball_block_contact() {
  setTestName(CircleStraightTest.groupName+'concave_ball_block_contact');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.concave_ball_block_contact_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 0.0976832, -0.7068779, -2.3078333, 0.0053314, -0.0510627, 0.3847691);
  setBodyVars(sim, vars, 1, 0.1813533, 0.7068779, -1.417854, -0.0053314, -0.0243965, 1.6129892);
  runTest(sim, advance, /*runUntil=*/8.0,
          /*expectedVars=*/vars, /*tolerance=*/0.0001,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0001,
          /*expectedCollisions=*/0);
};

/** With a very small time step of 0.0025, the energy stays constant to 6 decimal
places.
@return {undefined}
@private
*/
static concave_ball_block_contact_2() {
  setTestName(CircleStraightTest.groupName+'concave_ball_block_contact_2');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.concave_ball_block_contact_setup(sim, advance);
  advance.setTimeStep(0.0025);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 0.0976759, -0.7068614, -2.3078333, 0.0053102, -0.0510571, 0.3847591);
  setBodyVars(sim, vars, 1, 0.1813607, 0.7068614, -1.417854, -0.0053102, -0.024377, 1.6129487);
  runTest(sim, advance, /*runUntil=*/8.0,
          /*expectedVars=*/vars, /*tolerance=*/0.000001,
          /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
          /*expectedCollisions=*/0);
};

/** A slowly rotating rectangle collides into a stationary circle, with no gravity. If
midpoint vertex contacts are turned on then this test should fail; in that case a
contact is falsely detected and a contact force changes the energy when the energy
should be constant. Also this test should fail if RigidBodyCollision.updateCollision()
is not being called for each collision.

Another interesting variant of this is to have the block move at higher velocity,
and use a small time step (like 0.0025) and set time rate to be slow (0.1) to watch it
occur.
<pre>
  body1.setVelocity(new Vector(-3,  0),  6);
</pre>
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@private
*/
static rotating_block_vs_ball_init(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance);
  var body0 = Shapes.makeBall(0.75, 'ball');
  body0.setPosition(new Vector(-0.4,  0),  0);
  body0.setVelocity(new Vector(0,  0),  0);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(1, 3, 'block');
  body1.setPosition(new Vector(1.5,  0),  -Math.PI/4);
  body1.setVelocity(new Vector(-0.2,  0),  0.5);
  sim.addBody(body1);
  sim.setElasticity(0.8);
};

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
static rotating_block_vs_ball_1_setup(sim, advance) {
  CircleStraightTest.rotating_block_vs_ball_init(sim, advance);
  sim.setElasticity(1);
};

/** Compare elasticity 1.0 to elasticity 0.0.
@return {undefined}
@private
*/
static rotating_block_vs_ball_1() {
  setTestName(CircleStraightTest.groupName+'rotating_block_vs_ball_1');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.rotating_block_vs_ball_1_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, -1.6324684, -0.2331973, -0.7357376, -0.1458555, -0, -0);
  setBodyVars(sim, vars, 1, 1.1324684, 0.0331973, 0.7357376, 0.1458555, 1.965865, 0.2512581);
  runTest(sim, advance, /*runUntil=*/8.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/**
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
static rotating_block_vs_ball_0_setup(sim, advance) {
  CircleStraightTest.rotating_block_vs_ball_init(sim, advance);
  sim.setElasticity(0);
};

/** Compare elasticity 1.0 to elasticity 0.0.
@return {undefined}
@private
*/
static rotating_block_vs_ball_0() {
  setTestName(CircleStraightTest.groupName+'rotating_block_vs_ball_0');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.rotating_block_vs_ball_0_setup(sim, advance);
  var vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, -1.6274159, -0.2325424, -0.7371557, -0.1463887, -0, -0);
  setBodyVars(sim, vars, 1, 1.1274159, 0.0325424, 0.7371557, 0.1463887, 1.964511, 0.2505587);
  runTest(sim, advance, /*runUntil=*/8.0,
               /*expectedVars=*/vars, /*tolerance=*/0.00001);
};

/** A ball falls onto a flat infinite mass floor with elasticity &lt; 1 so the bounces
are successively smaller. Using ContactSim this results in a steady contact; but using
ImpulseSim the number of bounces goes to infinity, the time between bounces goes to
zero and the simulation gets stuck.
@param {!ImpulseSim} sim
@param {!CollisionAdvance} advance
@export
*/
static ball_falls_on_floor_setup(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance);
  sim.clearForceLaws();
  var body0 = Shapes.makeBall(0.5, 'ball');
  body0.setPosition(new Vector(0,  0),  0);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(10, 1, 'wall');
  body1.setMass(Util.POSITIVE_INFINITY);
  body1.setPosition(new Vector(0,  -2.5),  0);
  sim.addBody(body1);
  var floor = body1.getTopWorld();
  body0.setZeroEnergyLevel(floor + body0.getMinHeight());
  var g = new GravityLaw(3.0, sim.getSimList());
  sim.addForceLaw(g);
  sim.setElasticity(0.8);
};

/** Shows that a ball falling onto the floor under gravity will get stuck when using
ImpulseSim when elasticity is less than 1.0; this test expects that an
AdvanceException will occur.
@return {undefined}
*/
static ball_falls_on_floor_stuck() {
  setTestName(CircleStraightTest.groupName+'ball_falls_on_floor_stuck');
  var sim = new ImpulseSim();
  var advance = new CollisionAdvance(sim);
  //advance.addWayPoints([CollisionAdvance.WayPoint.HANDLE_COLLISION_FAIL]);
  //advance.setDebugLevel(CollisionAdvance.DebugLevel.HIGH);
  CircleStraightTest.ball_falls_on_floor_setup(sim, advance);
  Engine2DTestRig.runExceptionTest(advance, /*time=*/15);
};

/** A ball falls into the gap between a wall and a fixed block; the space is slightly
smaller than the radius of the ball.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static wedged_ball_setup(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance, /*damping=*/0);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  sim.setCollisionAccuracy(0.6);
  var body0 = Shapes.makeBall(1.5, 'ball');
  body0.setCenterOfMass(0.4, 0.2);
  body0.setPosition(new Vector(-5.5+1.5+.01,  -3),  0);
  sim.addBody(body0);
  var body1 = Shapes.makeBlock(1, 1, 'fixed block');
  body1.setPosition(new Vector(-2.5,  -5),  0);
  body1.setMass(Util.POSITIVE_INFINITY);
  sim.addBody(body1);
  var gravity = new GravityLaw(3.0, sim.getSimList());
  sim.addForceLaw(gravity);
  var zel = Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/1.0);
  gravity.setZeroEnergyLevel(zel);
  sim.setElasticity(0.8);
};

/** Tests scenario where a ball falls into the gap between a wall and a fixed block;
the space is slightly smaller than the radius of the ball.
@return {undefined}
*/
static wedged_ball() {
  setTestName(CircleStraightTest.groupName+'wedged_ball');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.wedged_ball_setup(sim, advance);
  var vars = makeVars(1*6);
  setBodyVars(sim, vars, 0, -4.9277059, -0.1631422, -4.4398357, 0.6282979, -3.3497083, -1.4515518);
  runTest(sim, advance, /*runUntil=*/3,
      /*expectedVars=*/vars, /*tolerance=*/0.00001);
  // run for a few more seconds: there should be no more collision searches
  runTest(sim, advance, /*runUntil=*/8.0,
      /*expectedVars=*/null, /*tolerance=*/Util.NaN,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.0002,
      /*expectedCollisions=*/0);
};

/** Several balls with varying elasticity bounce on floor.
@param {!ContactSim} sim
@param {!CollisionAdvance} advance
@export
*/
static elastic_balls_setup(sim, advance) {
  CircleStraightTest.commonSetup1(sim, advance, /*damping=*/0);
  sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  var body = Shapes.makeBall(0.8, 'ball1');
  body.setPosition(new Vector(-5,  2));
  body.setElasticity(1.0);
  sim.addBody(body);
  body = Shapes.makeBall(0.8, 'ball2');
  body.setPosition(new Vector(-3,  2));
  body.setElasticity(0.8);
  sim.addBody(body);
  body = Shapes.makeBall(0.8, 'ball3');
  body.setPosition(new Vector(-1,  2));
  body.setElasticity(0.6);
  sim.addBody(body);
  body = Shapes.makeBall(0.8, 'ball4');
  body.setPosition(new Vector(1,  2));
  body.setElasticity(0.4);
  sim.addBody(body);
  body = Shapes.makeBall(0.8, 'ball5');
  body.setPosition(new Vector(3,  2));
  body.setElasticity(0.2);
  sim.addBody(body);
  body = Shapes.makeBall(0.8, 'ball6');
  body.setPosition(new Vector(5,  2));
  body.setElasticity(0);
  sim.addBody(body);
  var gravity = new GravityLaw(3.0, sim.getSimList());
  sim.addForceLaw(gravity);
  var zel = Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/1.0);
  gravity.setZeroEnergyLevel(zel);
};

/** Tests several balls with varying elasticity bouncing on floor.
@return {undefined}
*/
static elastic_balls() {
  setTestName(CircleStraightTest.groupName+'elastic_balls');
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  CircleStraightTest.elastic_balls_setup(sim, advance);
  var vars = makeVars(6*6);
  setBodyVars(sim, vars, 0, -5, 0, -0.3044753, -3.7184475, 0, 0);
  setBodyVars(sim, vars, 1, -3, 0, -3.5265603, -1.1428554, 0, 0);
  setBodyVars(sim, vars, 2, -1, 0, -5.195, -0, 0, 0);
  setBodyVars(sim, vars, 3, 1, 0, -5.195, 0, 0, 0);
  setBodyVars(sim, vars, 4, 3, 0, -5.195, -0, 0, 0);
  setBodyVars(sim, vars, 5, 5, 0, -5.195, -0, 0, 0);
  runTest(sim, advance, /*runUntil=*/10,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/NaN, /*energyTol=*/NaN,
      /*expectedCollisions=*/17);
};

} // end class

/**
* @type {string}
* @const
*/
CircleStraightTest.groupName = 'CircleStraightTest.';

exports = CircleStraightTest;
