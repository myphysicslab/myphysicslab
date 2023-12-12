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

import { CollisionAdvance } from '../lab/model/CollisionAdvance.js';
import { CollisionHandling } from '../lab/engine2D/CollisionHandling.js';
import { ContactSim } from '../lab/engine2D/ContactSim.js';
import { CoordType } from '../lab/model/CoordType.js';
import { DampingLaw } from '../lab/model/DampingLaw.js';
import { ExtraAccel } from '../lab/engine2D/ExtraAccel.js';
import { GravityLaw } from '../lab/model/GravityLaw.js';
import { ImpulseSim } from '../lab/engine2D/ImpulseSim.js';
import { JointUtil } from '../lab/engine2D/JointUtil.js';
import { RigidBodyCollision } from '../lab/engine2D/RigidBody.js';
import { RungeKutta } from '../lab/model/RungeKutta.js';
import { Shapes } from '../lab/engine2D/Shapes.js';
import { Util } from '../lab/util/Util.js';
import { Vector } from '../lab/util/Vector.js';
import { Walls } from '../lab/engine2D/Walls.js';

import { schedule, setTestName } from './TestRig.js';
import { makeVars, setBodyVars, runTest, runExceptionTest }
    from './Engine2DTestRig.js';

const groupName = 'MultipleCollisionTest.';

/**  Unit tests of {@link ImpulseSim}, for cases involving multiple simultaneous
collisions.

Note that these tests are sensitive to the settings for
`VELOCITY_TOL` and `DISTANCE_TOL` in ImpulseSim.
*/
export class MultipleCollisionTest {

constructor() { throw ''; };

static test() {
  schedule(MultipleCollisionTest.test1_0.bind(null, CollisionHandling.SIMULTANEOUS));
  schedule(MultipleCollisionTest.test1_0.bind(null, CollisionHandling.HYBRID));
  schedule(MultipleCollisionTest.test1_1.bind(null, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  schedule(MultipleCollisionTest.test2_0.bind(null, CollisionHandling.SIMULTANEOUS, MultipleCollisionTest.BALL));
  schedule(MultipleCollisionTest.test2_0.bind(null, CollisionHandling.SIMULTANEOUS, MultipleCollisionTest.BLOCK));
  schedule(MultipleCollisionTest.test2_1.bind(null, CollisionHandling.SERIAL_GROUPED_LASTPASS, MultipleCollisionTest.BALL));
  schedule(MultipleCollisionTest.test2_1.bind(null, CollisionHandling.HYBRID,  MultipleCollisionTest.BALL));
  schedule(MultipleCollisionTest.test2_1.bind(null, CollisionHandling.HYBRID,  MultipleCollisionTest.BLOCK));
  schedule(MultipleCollisionTest.test3_0.bind(null, CollisionHandling.SIMULTANEOUS));
  schedule(MultipleCollisionTest.test3_0.bind(null, CollisionHandling.HYBRID));
  schedule(MultipleCollisionTest.test3_1.bind(null, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  schedule(MultipleCollisionTest.test4_0.bind(null, CollisionHandling.SIMULTANEOUS));
  schedule(MultipleCollisionTest.test4_0.bind(null, CollisionHandling.HYBRID));
  schedule(MultipleCollisionTest.test4_1.bind(null, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  schedule(MultipleCollisionTest.test5_0.bind(null, CollisionHandling.SIMULTANEOUS,  MultipleCollisionTest.BALL));
  schedule(MultipleCollisionTest.test5_0.bind(null, CollisionHandling.HYBRID,  MultipleCollisionTest.BALL));
  schedule(MultipleCollisionTest.test5_0.bind(null, CollisionHandling.SERIAL_GROUPED_LASTPASS,  MultipleCollisionTest.BALL));
  schedule(MultipleCollisionTest.test5_0.bind(null, CollisionHandling.SIMULTANEOUS,  MultipleCollisionTest.BLOCK));
  schedule(MultipleCollisionTest.test5_0.bind(null, CollisionHandling.HYBRID,  MultipleCollisionTest.BLOCK));
  schedule(MultipleCollisionTest.test6_0.bind(null, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  schedule(MultipleCollisionTest.test6_1.bind(null, CollisionHandling.SIMULTANEOUS));
  schedule(MultipleCollisionTest.test6_1.bind(null, CollisionHandling.HYBRID));
  schedule(MultipleCollisionTest.test7_0.bind(null, CollisionHandling.SIMULTANEOUS));
  schedule(MultipleCollisionTest.test7_1.bind(null, CollisionHandling.HYBRID));
  schedule(MultipleCollisionTest.test7_2.bind(null, CollisionHandling.SERIAL_GROUPED_LASTPASS));
  schedule(MultipleCollisionTest.test8_0);
  schedule(MultipleCollisionTest.test8_1);
  schedule(MultipleCollisionTest.test8_2);
  schedule(MultipleCollisionTest.test8_3);
  schedule(MultipleCollisionTest.test8_5);
  schedule(MultipleCollisionTest.two_in_box);
  schedule(MultipleCollisionTest.one_hits_two_in_box);
};

/**
@param sim
@param advance
*/
private static commonSetup1(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  sim.addForceLaw(new DampingLaw(0, 0.15, sim.getSimList()));
  sim.setCollisionAccuracy(0.6);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(99999);
  if (sim instanceof ContactSim) {
    sim.setDistanceTol(MultipleCollisionTest.distanceTol_);
    sim.setVelocityTol(MultipleCollisionTest.velocityTol_);
    sim.setExtraAccel(ExtraAccel.VELOCITY);
  }
  advance.setJointSmallImpacts(false);
  advance.setTimeStep(0.025);
  advance.setDiffEqSolver(new RungeKutta(sim));
};

/** 'one hits wall':  Square block collides into a wall, both corners simultaneously.
  The result depends on the collision handling mechanism.
@param sim
@param advance
*/
static one_hits_wall_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const b0 = Shapes.makeBlock(1, 1, 'block');
  b0.setPosition(new Vector(0,  2),  0);
  b0.setVelocity(new Vector(0,  -3),  0);
  sim.addBody(b0);
  const b1 = Shapes.makeBlock(3, 1, 'wall');
  b1.setPosition(new Vector(0,  -2),  0);
  b1.setMass(Infinity);
  sim.addBody(b1);
  sim.setElasticity(1.0);
};

/** With sequential or hybrid collision handling, the block bounces straight off the wall.
@param collisionType
*/
static test1_0(collisionType: CollisionHandling) {
  setTestName(groupName+'test1_0 '+collisionType);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_wall_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 0, 0, 2.01, 3, 0, 0);
  setBodyVars(sim, vars, 1, 0, 0, -2, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** With serial collision handling, the block starts rotating.
@param collisionType
*/
static test1_1(collisionType: CollisionHandling) {
  setTestName(groupName+'test1_1 '+collisionType);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_wall_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 0, 0, 1.7696, 2.76, -2.8848, -2.88);
  setBodyVars(sim, vars, 1, 0, 0, -2, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** 'one hits two': A ball (or square block) on the left moves to hit two balls that are
in resting contact.
The result depends on the type of collision handling being used.
Because resting contact is involved, we need to use ContactSim instead of ImpulseSim.
@param sim  the ImpulseSim to add the objects to
@param advance
@param offset  additional distance between the stationary objects
@param balls  true gives round balls, false gives square blocks
*/
static test2_prep(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>, offset: number, balls: boolean) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const radius = 0.5;
  const b0 = balls ? Shapes.makeBall(radius, 'ball0')
                 : Shapes.makeBlock(2*radius, 2*radius, 'block0');
  b0.setPosition(new Vector(-3,  0),  0);
  b0.setVelocity(new Vector(3,  0),  0);
  sim.addBody(b0);
  const b1 = balls ? Shapes.makeBall(radius, 'ball1')
                 : Shapes.makeBlock(2*radius, 2*radius, 'block1');
  b1.setPosition(new Vector(0,  0),  0);
  sim.addBody(b1);
  const b2 = balls ? Shapes.makeBall(radius, 'ball2')
                 : Shapes.makeBlock(2*radius, 2*radius, 'block2');
  b2.setPosition(new Vector(2*radius + MultipleCollisionTest.distanceTol_/2 + offset,  0),  0);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/**
@param sim
@param advance
*/
static one_hits_two_ball_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.test2_prep(sim, advance, 0, MultipleCollisionTest.BALL);
};

/**
@param sim
@param advance
*/
static one_hits_two_block_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.test2_prep(sim, advance, 0, MultipleCollisionTest.BLOCK);
};

/** With simultaneous collision handling, all the balls are moving after the collision
(which is physically wrong, but it is how it should behave).
@param collisionType
@param balls  true gives round balls, false gives square blocks
*/
static test2_0(collisionType: CollisionHandling, balls: boolean) {
  setTestName(groupName+'test2_0 '+collisionType+' balls='+balls);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.test2_prep(sim, advance, 0, balls);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -2.34, -1, 0, 0, 0, 0);
  setBodyVars(sim, vars, 1, 2.67, 2, 0, 0, 0, 0);
  setBodyVars(sim, vars, 2, 3.675, 2, 0, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** With serial or hybrid collision handling, the result is only the right-most ball is moving.
@param collisionType
@param balls  true gives round balls, false gives square blocks
*/
static test2_1(collisionType: CollisionHandling, balls: boolean) {
  setTestName(groupName+'test2_1 '+collisionType+' balls='+balls);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.test2_prep(sim, advance, 0, balls);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -1.005, 0, 0, 0, 0, 0);
  setBodyVars(sim, vars, 1, 0, 0, 0, 0, 0, 0);
  setBodyVars(sim, vars, 2, 5.01, 3, 0, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/**  'Two hits one asymmetric':  Two balls approach a central stationary ball so that the collisions
happen at the same moment;  the balls have different velocities.  The result should
be that the central ball should remain motionless and the moving balls bounce off but
exchange velocities.
Because there are no static contacts, but only two dynamic collisions, we can use
ImpulseSim here (don't need to use ContactSim).

* Here is why we need to add distTol/2 to starting position of body1:
* The collision happens when the blocks are distTol/2 apart, so the distance
* travelled is slightly less than you would expect.
* Suppose distTol = 0.01; and distTol/2 = 0.005.
* body2.left = 0.5;  body3.right = 2.5; body3 travels 2.5 - 0.5 - 0.005 = 1.995
* If body1 starts at -5, it travels a distance of 3.995 which is more than
* twice the distance that body3 travels, so it arrives after body3 collision.
* To have them collide at the same moment:
* Since body1 travels at twice the speed, it should travel 1.995 * 2 = 3.99
* Therefore body1.right = body2.left - 0.005 - 3.99 = -4.495
* Therefore body1.center = -4.995 = -5 + distTol/2

@param sim
@param advance
*/
static two_hits_one_asymmetric_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const distTol = sim.getDistanceTol();
  const radius = 0.5;
  const b0 = Shapes.makeBall(radius, 'left');
  b0.setPosition(new Vector(-5 + distTol/2,  0),  0);
  b0.setVelocity(new Vector(3,  0),  0);
  sim.addBody(b0);
  const b1 = Shapes.makeBall(radius, 'center');
  b1.setPosition(new Vector(0,  0),  0);
  sim.addBody(b1);
  const b2 = Shapes.makeBall(radius, 'right');
  b2.setPosition(new Vector(3,  0),  0);
  b2.setVelocity(new Vector(-1.5,  0),  0);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/**With simultaneous collision handling, all the balls are moving after the collision
(which is physically wrong, but it is how it should behave).
OCT 2011:  for some unknown reason, the “two hits one asymmetric” multiple collision
test now works identically for all collision solvers.
MAY 2016: I've solved the above problem, see the setup function above.
@param collisionType
*/
static test3_0(collisionType: CollisionHandling) {
  setTestName(groupName+'test3_0 '+collisionType);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.two_hits_one_asymmetric_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -2.345, -2, 0, 0, 0, 0);
  setBodyVars(sim, vars, 1, 0.67, 1, 0, 0, 0, 0);
  setBodyVars(sim, vars, 2, 2.68, 2.5, 0, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/**With serial collision handling, the center ball remains motionless, and
the two balls exchange velocity.
@param collisionType
*/
static test3_1(collisionType: CollisionHandling) {
  setTestName(groupName+'test3_1 '+collisionType);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.two_hits_one_asymmetric_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -2.01, -1.5, 0, 0, 0, 0);
  setBodyVars(sim, vars, 1, 0, 0, 0, 0, 0, 0);
  setBodyVars(sim, vars, 2, 3.015, 3, 0, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** 'one hits two separate':  a moving block hits two separated balls simultaneously.
The result depends on the type of collision handling used.
Because there are no static contacts, but only two dynamic collisions, we can use
ImpulseSim here (don't need to use ContactSim).
@param sim
@param advance
*/
static one_hits_two_separate_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const b0 = Shapes.makeBlock(1, 3, 'block0');
  b0.setPosition(new Vector(-4,  0),  0); // could modify angle slightly here
  b0.setVelocity(new Vector(3,  0),  0);
  b0.setMass(2);
  sim.addBody(b0);
  const b1 = Shapes.makeBall(0.5, 'ball1');
  b1.setPosition(new Vector(0,  1),  0);
  sim.addBody(b1);
  const b2 = Shapes.makeBall(0.5, 'ball2');
  b2.setPosition(new Vector(0,  -1),  0);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/**
@param collisionType
*/
static test4_0(collisionType: CollisionHandling) {
  setTestName(groupName+'test4_0 '+collisionType);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_two_separate_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -1.005, 0, 0, 0, 0, 0);
  setBodyVars(sim, vars, 1, 3.005, 3, 1, 0, 0, 0);
  setBodyVars(sim, vars, 2, 3.005, 3, -1, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/**
@param collisionType
*/
static test4_1(collisionType: CollisionHandling) {
  setTestName(groupName+'test4_1 '+collisionType);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_two_separate_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -0.9981859, 0.0068027, 0, 0, 0.1635374, 0.1632653);
  setBodyVars(sim, vars, 1, 3.1344671, 3.1292517, 1, 0, 0, 0);
  setBodyVars(sim, vars, 2, 2.8619048, 2.8571429, -1, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/**  'one hits two on wall':  two balls (or blocks) are in stationary contact with
a wall (infinite mass);  a third ball collides into them from the left;  the result
is usually that the ball just bounces off and the two balls stay in stationary contact.
The exception is when using serial collision handling and square blocks instead of
round balls (because then the two corner collisions on the blocks are handled
serially instead of simultaneously).
Because this test involves resting contacts, we must use ContactSim.
@param sim
@param advance
@param balls  true gives round balls, false gives square blocks
*/
static test5_prep(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>, balls: boolean) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const radius = 0.5;
  const b0 = balls ? Shapes.makeBall(radius, 'ball0')
                     : Shapes.makeBlock(2*radius, 2*radius, 'block0');
  b0.setPosition(new Vector(-3,  0),  0);
  b0.setVelocity(new Vector(3,  0),  0);
  sim.addBody(b0);
  const b1 = balls ? Shapes.makeBall(radius, 'ball1')
                     : Shapes.makeBlock(2*radius, 2*radius, 'block1');
  b1.setPosition(new Vector(0,  0),  0);
  sim.addBody(b1);
  const b2 = balls ? Shapes.makeBall(radius, 'ball2')
                     : Shapes.makeBlock(2*radius, 2*radius, 'block2');
  b2.setPosition(new Vector(2*radius + MultipleCollisionTest.distanceTol_/2,  0),  0);
  sim.addBody(b2);
  const b3 = Shapes.makeBlock(1, 3, 'wall');
  b3.setMass(Infinity);
  b3.setPosition(new Vector(3*radius + 0.5 + MultipleCollisionTest.distanceTol_,  0),  0);
  sim.addBody(b3);
  sim.setElasticity(1.0);
};

/**
@param sim
@param advance
*/
static one_hits_two_on_wall_ball_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.test5_prep(sim, advance, MultipleCollisionTest.BALL);
};

/**
@param sim
@param advance
*/
static one_hits_two_on_wall_block_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.test5_prep(sim, advance, MultipleCollisionTest.BLOCK);
};

/**
@param collisionType
@param balls  true gives round balls, false gives square blocks
*/
static test5_0(collisionType: CollisionHandling, balls: boolean) {
  setTestName(groupName+'test5_0 '+collisionType+' balls='+balls);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.test5_prep(sim, advance, balls);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -5.01, -3, 0, 0, 0, 0);
  setBodyVars(sim, vars, 1, 0, 0, 0, 0, 0, 0);
  setBodyVars(sim, vars, 2, 1.005, 0, 0, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** 'center spin':  There are two stationary blocks with a third block in between them;
the center block is spinning and will simultaneously hit the other two blocks.
This is similar to the 'one hits two separate' scenario, except its a spinning
block instead of a translating block that causes the collision.
There are no static contacts so either ImpulseSim or ContactSim shows the
same results.
This corresponds to the 'center spin' version of the interactive SimultaneousCollision test.
@param sim
@param advance
*/
static center_spin_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const b0 = Shapes.makeBlock(1, 3, 'block0');
  b0.setPosition(new Vector(0,  0),  0);
  b0.setVelocity(new Vector(0,  0),  2);
  sim.addBody(b0);
  const b1 = Shapes.makeBlock(1, 3, 'block1');
  b1.setPosition(new Vector(2.8,  0),  Math.PI/2);
  sim.addBody(b1);
  const b2 = Shapes.makeBlock(1, 3, 'block2');
  b2.setPosition(new Vector(-2.8,  0),  -Math.PI/2);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/** Serial collision handling case:  non-symmetric result.
@param collisionType
*/
static test6_0(collisionType: CollisionHandling) {
  setTestName(groupName+'test6_0 '+collisionType);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.center_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, 0.1855924, 0.3179762, 0.2040219, 0.3495516, 0.4374322, -0.6771538);
  setBodyVars(sim, vars, 1, 3.0447046, 0.4192534, 0.269004, 0.4608857, 1.2334118, -0.5780423);
  setBodyVars(sim, vars, 2, -3.230297, -0.7372296, -0.473026, -0.8104373, -2.1640649, -1.0164494);
  // runUntil=1.0
  runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Simultaneous collision handling case:  symmetric result.
@param collisionType
*/
static test6_1(collisionType: CollisionHandling) {
  setTestName(groupName+'test6_1 '+collisionType);
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.center_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, 0, 0, 0, 0, 0.3612164, -0.8077347);
  setBodyVars(sim, vars, 1, 3.1539628, 0.6064458, 0.3891116, 0.6666666, 1.082773, -0.8361323);
  setBodyVars(sim, vars, 2, -3.1539628, -0.6064458, -0.3891116, -0.6666666, -2.0588196, -0.8361323);
  runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** 'side spin':  There are two stationary blocks in resting contact, with a third block
nearby;  the third block is spinning and will hit one of the two blocks.
This is similar to the 'one hits two' scenario, except its a spinning
block instead of a translating block that causes the collision.
Because this test involves resting contacts, we must use ContactSim.
This corresponds to the 'side spin' version of the interactive SimultaneousCollision test.
@param sim
@param advance
*/
static side_spin_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const b0 = Shapes.makeBlock(1, 3, 'block0');
  b0.setPosition(new Vector(0,  0),  Math.PI/2);
  sim.addBody(b0);
  const b1 = Shapes.makeBlock(1, 3, 'block1');
  b1.setPosition(new Vector(2.8,  1.001),  0);
  b1.setVelocity(new Vector(0,  0),  2);
  sim.addBody(b1);
  const b2 = Shapes.makeBlock(1, 3, 'block2');
  b2.setPosition(new Vector(-2.8,  1.001),  Math.PI/2);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/** Simultaneous collision handling case.
 Note (March 30 2011):  This failed with ContactSim.VELOCITY_TOL = 0.5, so I lowered
  VELOCITY_TOL to 0.05.
 The problem was that energy was increasing after the collision;  the cause was that a contact
 was being detected that had a relatively high velocity of 0.28, and a contact force
 was acting there (and because work = force * distance, there was energy being added as
 the contact was separating).
@param collisionType
*/
static test7_0(collisionType: CollisionHandling) {
  setTestName(groupName+'test7_0 '+collisionType);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.side_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  sim.setVelocityTol(0.05);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -0, -0, -0.2407811, -1.1140238, 1.3296854, -1.1155496);
  setBodyVars(sim, vars, 1, 2.8, 0, 1.2018587, 0.9293143, 1.6380862, 0.3255308);
  setBodyVars(sim, vars, 2, -2.8, 0, 1.0409225, 0.1847096, 1.6330754, 0.2881469);
  runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Hybrid collision handling case.
@param collisionType
*/
static test7_1(collisionType: CollisionHandling) {
  setTestName(groupName+'test7_1 '+collisionType);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.side_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  sim.setRandomSeed(86161959);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -0, -0, -0.2696156, -1.2474324, 1.4082314, -0.7521404);
  setBodyVars(sim, vars, 1, 2.8, 0, 1.1939246, 0.8926056, 1.6523821, 0.3916737);
  setBodyVars(sim, vars, 2, -2.8, 0, 1.077691, 0.3548268, 1.6904343, 0.5535298);
  runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Serial collision handling case.
@param collisionType
*/
static test7_2(collisionType: CollisionHandling) {
  setTestName(groupName+'test7_2 '+collisionType);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.side_spin_setup(sim, advance);
  sim.setCollisionHandling(collisionType);
  sim.setRandomSeed(86161959);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, -0.0005129, -0.002373, -0.2514185, -1.16324, 1.4220696, -0.6881151);
  setBodyVars(sim, vars, 1, 2.8005129, 0.002373, 1.1681077, 0.7731586, 1.7396203, 0.7952992);
  setBodyVars(sim, vars, 2, -2.8, 0, 1.0853108, 0.3900814, 1.7023212, 0.608527);
  runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Two blocks are connected by a joint and lie on the ground;  a third block collides
into the connected blocks. This is a fairly simple test of joints and contacts during
a collision.
@param sim
@param advance
*/
static joint_collision_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const zel = Walls.make(sim, /*width=*/20, /*height=*/10);
  const j1 = Shapes.makeBlock(1, 3, 'joint1');
  j1.setPosition(new Vector(2,  -5 + 0.5 + 0.005),  Math.PI/2);
  const j2 = Shapes.makeBlock(1, 3, 'joint2');
  j2.setPosition(new Vector(4,  -5 + 0.5 + 0.005),  Math.PI/2);
  sim.addBody(j1);
  sim.addBody(j2);
  JointUtil.attachRigidBody(sim,
      j1, /*attach_body=*/new Vector(0, 1.0),
      j2, /*attach_body=*/new Vector(0, -1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  sim.alignConnectors();
  const f1 = Shapes.makeBlock(1, 3, 'free1');
  f1.setPosition(new Vector(-6,  -5 + 0.5 + 0.005),  Math.PI/2);
  f1.setVelocity(new Vector(3,  0),  0);
  sim.addBody(f1);
  const gravity = new GravityLaw(4.0, sim.getSimList());
  sim.addForceLaw(gravity);
  gravity.setZeroEnergyLevel(zel + 0.5);
  sim.setElasticity(0.8);
};

/**
*/
static test8_0(): void {
  setTestName(groupName+'test8_0');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  const vars = makeVars(6*7);
  setBodyVars(sim, vars, 4, 5.3468095, 1.3378378, -4.4909991, -0, 1.5708394, -0);
  setBodyVars(sim, vars, 5, 3.3468392, 1.3378378, -4.4943779, 0, 1.5741319, 0);
  setBodyVars(sim, vars, 6, -2.1936486, 0.3243243, -4.49445, 0.0000026, 1.5687089, -0.0000012);
  runTest(sim, advance, /*runUntil=*/3.5,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
  runTest(sim, advance, /*runUntil=*/5.5,
               /*expectedVars=*/null, /*tolerance=*/0.000001,
               /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.000001,
               /*expectedCollisions=*/-1);
};

/** Show that get same results with elastic or inelastic joints.
@param sim
@param advance
*/
static joint_collision_2_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const j1 = Shapes.makeBlock(1, 3, 'joint1');
  j1.setPosition(new Vector(2,  0),  Math.PI/2);
  const j2 = Shapes.makeBlock(1, 3, 'joint2');
  j2.setPosition(new Vector(0,  0),  Math.PI/2);
  j2.setVelocity(new Vector(3,  0),  0);
  sim.addBody(j1);
  sim.addBody(j2);
  JointUtil.attachRigidBody(sim,
      j1, /*attach_body=*/new Vector(0, 1.0),
      j2, /*attach_body=*/new Vector(0, -1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  sim.alignConnectors();
  const collisions: RigidBodyCollision[] = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
  sim.setElasticity(0.8);
};

/**
*/
static test8_1(): void {
  setTestName(groupName+'test8_1');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_2_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  const vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 6.5, 1.5, -0, -0, 1.5707963, 0);
  setBodyVars(sim, vars, 1, 4.5, 1.5, 0, 0, 1.5707963, 0);
  runTest(sim, advance, /*runUntil=*/3.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** Show that get same results with elastic or inelastic joints.
@param sim
@param advance
*/
static joint_collision_3_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const j1 = Shapes.makeBlock(1, 3, 'joint1');
  j1.setPosition(new Vector(2,  0),  Math.PI/2);
  sim.addBody(j1);
  const j2 = Shapes.makeBlock(1, 3, 'joint2');
  j2.setPosition(new Vector(0,  0),  Math.PI/2);
  sim.addBody(j2);
  JointUtil.attachRigidBody(sim,
      j1, /*attach_body=*/new Vector(0, 1.0),
      j2, /*attach_body=*/new Vector(0, -1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  sim.alignConnectors();
  const f1 = Shapes.makeBall(/*radius=*/0.5, 'free1');
  f1.setPosition(new Vector(-6,  0),  Math.PI/2);
  f1.setVelocity(new Vector(3,  0),  0);
  sim.addBody(f1);
  sim.setElasticity(1.0);
};

/**
*/
static test8_2(): void {
  setTestName(groupName+'test8_2');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_3_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, 5.3366667, 2, -0, -0, 1.5707963, 0);
  setBodyVars(sim, vars, 1, 3.3366667, 2, -0, -0, 1.5707963, 0);
  setBodyVars(sim, vars, 2, -3.6733333, -1, 0, 0, 1.5707963, 0);
  runTest(sim, advance, /*runUntil=*/3.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** The simplest case of a 'spinning joint': two bodies connected by a joint, they are
rotating about the joint at different rates. This shows that we are unable to keep
spinning joints tight with just contact force calculations.
@param sim
@param advance
*/
static joint_collision_4_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const j1 = Shapes.makeBlock(1, 3, 'joint1');
  j1.setPosition(new Vector(2,  0),  Math.PI/2);
  j1.setVelocity(new Vector(0,  0),  3);
  sim.addBody(j1);
  const j2 = Shapes.makeBlock(1, 3, 'joint2');
  j2.setPosition(new Vector(0,  0),  Math.PI/2);
  j2.setVelocity(new Vector(0,  0),  -5);
  sim.addBody(j2);
  JointUtil.attachRigidBody(sim,
      j1, /*attach_body=*/new Vector(0, 1.0),
      j2, /*attach_body=*/new Vector(0, -1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  sim.alignConnectors();
  sim.setElasticity(0.8);
  const collisions: RigidBodyCollision[] = [];
  sim.findCollisions(collisions, sim.getVarsList().getValues(), 0);
  sim.handleCollisions(collisions);
};

/**
*/
static test8_3(): void {
  setTestName(groupName+'test8_3');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_4_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  const vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 1.4983143, 0.2052494, 0.8618191, -0.5534606, 8.9952832, 3.5216341);
  setBodyVars(sim, vars, 1, 0.5016857, -0.2052494, -0.8618191, 0.5534606, -10.0437751, -4.435186);
  runTest(sim, advance, /*runUntil=*/3.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** Two rectangle blocks are connected by a joint; the blocks are at rest with
a ball object in contact with them on their right;  from left a ball object strikes
the jointed rectangle blocks.
@param sim
@param advance
*/
static joint_collision_5_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const distTol = sim.getDistanceTol();
  let body = Shapes.makeBall(0.5, 'body4');
  body.setMass(2);
  body.setPosition(new Vector(1 + distTol/2,  0));
  sim.addBody(body);
  body = Shapes.makeBall(0.5, 'body1');
  body.setMass(2);
  body.setPosition(new Vector(-5,  0),  0);
  body.setVelocity(new Vector(3,  0),  0);
  sim.addBody(body);

  const body2 = Shapes.makeBlock(2, 1, 'body2');
  body2.setPosition(new Vector(-2,  0));
  sim.addBody(body2);

  const body3 = Shapes.makeBlock(2, 1, 'body3');
  body3.setPosition(new Vector(-0.5,  0));
  sim.addBody(body3);

  JointUtil.attachRigidBody(sim,
    body2, /*attach_body1=*/new Vector(0.75, 0),
    body3, /*attach_body2=*/new Vector(-0.75, 0),
    /*normalType=*/CoordType.BODY
    );
  sim.alignConnectors();
  sim.setElasticity(1.0);
};

/**
*/
static test8_5(): void {
  setTestName(groupName+'test8_5');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.joint_collision_5_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  const vars = makeVars(6*4);
  setBodyVars(sim, vars, 0, 2.51, 3, 0, 0, 0, 0);
  setBodyVars(sim, vars, 1, -3.505, 0, 0, 0, 0, 0);
  setBodyVars(sim, vars, 2, -2, 0, 0, 0, 0, 0);
  setBodyVars(sim, vars, 3, -0.5, 0, 0, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** Two balls are inside a rectangular frame. One ball is given a rightward initial
velocity. This causes an infinite series of collisions, but certain settings for the
collision handling can cope with this problem. See Physics Based Animation by Erleben,
et. al. Chapter 6-2 'Multiple Points of Collision'.
@param sim
@param advance
*/
static two_in_box_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const distTol = sim.getDistanceTol();
  let body = Shapes.makeFrame(/*width=*/2 + 3*distTol/2 + 0.2,
      /*height=*/1 + 2*distTol/2 + 0.2, /*thickness=*/0.2, 'body1');
  body.setPosition(new Vector(0,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body2');
  body.setPosition(new Vector(-0.5-distTol/4,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body3');
  body.setPosition(new Vector(0.5+distTol/4,  0));
  body.setVelocity(new Vector(3,  0),  0);
  sim.addBody(body);
  sim.setElasticity(1.0);
};

/**
*/
static two_in_box(): void {
  setTestName(groupName+'two_in_box');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.two_in_box_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  const vars = makeVars(6*3);
  setBodyVars(sim, vars, 0, 1, 1, 0, 0, 0, 0);
  setBodyVars(sim, vars, 1, 0.4975, 1, 0, 0, 0, 0);
  setBodyVars(sim, vars, 2, 1.5025, 1, 0, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/1.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

/** Two balls are inside a rectangular frame. A third ball strikes the frame from left.
This causes an infinite series of collisions, but certain settings for the
collision handling can cope with this problem. See Physics Based Animation by Erleben,
et. al. Chapter 6-2 'Multiple Points of Collision'.
@param sim
@param advance
*/
static one_hits_two_in_box_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
  MultipleCollisionTest.commonSetup1(sim, advance);
  const distTol = sim.getDistanceTol();
  let body = Shapes.makeFrame(/*width=*/2 + 3*distTol/2 + 0.2,
      /*height=*/1 + 2*distTol/2 + 0.2, /*thickness=*/0.2, 'body1');
  body.setPosition(new Vector(0,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body2');
  body.setPosition(new Vector(-0.5-distTol/4,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body3');
  body.setPosition(new Vector(0.5+distTol/4,  0));
  sim.addBody(body);

  body = Shapes.makeBall(0.5, 'body4');
  body.setPosition(new Vector(-5,  0));
  body.setVelocity(new Vector(3,  0),  0);
  sim.addBody(body);
  sim.setElasticity(1.0);
};

/**
*/
static one_hits_two_in_box(): void {
  setTestName(groupName+'two_in_box');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  MultipleCollisionTest.one_hits_two_in_box_setup(sim, advance);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  sim.setRandomSeed(86161959);
  const vars = makeVars(6*4);
  setBodyVars(sim, vars, 0, 0.9041667, 1, 0, 0, 0, 0);
  setBodyVars(sim, vars, 1, 0.4016667, 1, 0, 0, 0, 0);
  setBodyVars(sim, vars, 2, 1.4066667, 1, 0, 0, 0, 0);
  setBodyVars(sim, vars, 3, -1.7125, 0, 0, 0, 0, 0);
  runTest(sim, advance, /*runUntil=*/2.0,
               /*expectedVars=*/vars, /*tolerance=*/0.000001);
};

static readonly BALL = true;

static readonly BLOCK = false;

static readonly distanceTol_ = 0.01;

static readonly velocityTol_ = 0.5;

} // end class
