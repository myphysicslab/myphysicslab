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
import { DisplayShape } from '../lab/view/DisplayShape.js';
import { DoubleRect } from '../lab/util/DoubleRect.js';
import { ExtraAccel } from '../lab/engine2D/ExtraAccel.js';
import { ImpulseSim } from '../lab/engine2D/ImpulseSim.js';
import { ModifiedEuler } from '../lab/model/ModifiedEuler.js';
import { RigidBodyCollision } from '../lab/engine2D/RigidBody.js';
import { RungeKutta } from '../lab/model/RungeKutta.js';
import { Shapes } from '../lab/engine2D/Shapes.js';
import { Util } from '../lab/util/Util.js';
import { Vector } from '../lab/util/Vector.js';
import { Walls } from '../lab/engine2D/Walls.js';

import { schedule, setTestName } from './TestRig.js';
import { makeVars, setBodyVars, runTest }
    from './Engine2DTestRig.js';

const groupName = 'SpeedTest.';

/** Tests high speed collisions.  Some are between small object and thin walls.
Some are between two small objects.
*/
export class SpeedTest {

constructor() { throw ''; };

static test() {
  schedule(SpeedTest.ball_vs_wall_0);
  schedule(SpeedTest.ball_vs_wall_1);
  schedule(SpeedTest.ball_vs_circle_0);
  schedule(SpeedTest.small_small);
};

/**
@param sim
@param advance
@param damping
*/
private static commonSetup1(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>, damping: number = 0.05) {
  sim.addForceLaw(new DampingLaw(damping, 0.15, sim.getSimList()));
  if (sim instanceof ContactSim) {
    sim.setDistanceTol(0.01);
    sim.setVelocityTol(0.5);
    sim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  }
  sim.setCollisionAccuracy(0.6);
  sim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  advance.setDiffEqSolver(new RungeKutta(sim));
  advance.setJointSmallImpacts(true);
  advance.setTimeStep(0.025);
};

/**
@param sim
@param advance
*/
static ball_vs_wall_setup(sim: ImpulseSim, advance: CollisionAdvance<RigidBodyCollision>) {
  SpeedTest.commonSetup1(sim, advance);
  const p = Shapes.makeBall(0.2, 'fast_ball');
  p.setMass(0.1);
  p.setPosition(new Vector(-5,  0),  0);
  p.setVelocity(new Vector(200,  153),  0);
  p.setElasticity(0.95);
  sim.addBody(p);
  // super-thin walls
  Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/0.01);
};

/** Small high speed ball collides into very thin walls.
*/
private static ball_vs_wall_0(): void {
  setTestName(groupName+'ball_vs_wall_0');
  const sim = new ImpulseSim();
  const advance = new CollisionAdvance(sim);
  SpeedTest.ball_vs_wall_setup(sim, advance);
  const vars = makeVars(6*1);
  setBodyVars(sim, vars, 0, -4.349276, 0.4830918, 4.4247788, -0.4310427, 0, 0);
  runTest(sim, advance, /*runUntil=*/10.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/NaN, /*energyTol=*/NaN,
      /*expectedCollisions=*/37);
};

/** Same as ball_vs_wall_0 but with ContactSim instead of ImpulseSim.
*/
private static ball_vs_wall_1(): void {
  setTestName(groupName+'ball_vs_wall_1');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  SpeedTest.ball_vs_wall_setup(sim, advance);
  const vars = makeVars(6*1);
  setBodyVars(sim, vars, 0, -4.3493183, 0.4830918, 4.4248186, -0.4310427, 0, 0);
  runTest(sim, advance, /*runUntil=*/10.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/NaN, /*energyTol=*/NaN,
      /*expectedCollisions=*/37);
};

/** Small high speed ball collides into very thin walls and fixed circle.
@param sim
@param advance
*/
static ball_vs_circle_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
  SpeedTest.commonSetup1(sim, advance);
  const p = Shapes.makeBall(0.2, 'fast_ball');
  p.setMass(0.1);
  p.setPosition(new Vector(-5,  0),  0);
  p.setVelocity(new Vector(200,  153),  0);
  sim.addBody(p);
  // super-thin walls
  Walls.make(sim, /*width=*/12.0, /*height=*/12.0, /*thickness=*/0.01);
  const b = Shapes.makeBall(4, 'fixBall');
  b.setMass(Infinity);
  b.setPosition(new Vector(0,  0),  0);
  sim.addBody(b);
  sim.setElasticity(0.95);
};

/**
*/
private static ball_vs_circle_0(): void {
  setTestName(groupName+'ball_vs_circle_0');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  SpeedTest.ball_vs_circle_setup(sim, advance);
  const vars = makeVars(6*1);
  let expectedCollisions;
  if (Util.isChrome()) {
    setBodyVars(sim, vars, 0, -5.6805659, -0.1123115, 5.6022192, 0.2347565, -0.0000012, -0);
    expectedCollisions = 55;
  } else {
    setBodyVars(sim, vars, 0, 4.2864427, 0.1090598, 5.7947777, -0.0042925, -0.0000012, -0);
    expectedCollisions = 52;
  }
  runTest(sim, advance, /*runUntil=*/10,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/NaN, /*energyTol=*/0,
      /*expectedCollisions=*/expectedCollisions, /*expectedSearches=*/6);
};

/** High speed collision of two small objects, the goal is to have the fast object
pass entirely thru the small object in a time step, so that just checking if the objects
are penetrating will not detect the collision.  Note that if using Runge-Kutta
solver that the state is evaluated at mid-time step also.  Therefore, use modified Euler
here instead.

To check that this test is working:  in `Polygon.checkVertexes` set
`travelDist = 0` (the distance travelled by the vertex), and in `ImpulseSim` set
`PROXIMITY_TEST = false`.  Note that if trying this interactively, be sure to use the
same large time step used here
@param sim
@param advance
*/
static small_small_setup(sim: ContactSim, advance: CollisionAdvance<RigidBodyCollision>) {
  SpeedTest.commonSetup1(sim, advance, /*damping=*/0);
  sim.setSimRect(new DoubleRect(-32, -12, 32, 12));
  advance.setDiffEqSolver(new ModifiedEuler(sim));
  // use large time step of 0.1 to ensure that object passes thru in single step
  advance.setTimeStep(0.1);
  const b1 = Shapes.makeBlock(1, 1, 'block0');
  b1.setPosition(new Vector(-30,  0),  Math.PI/4);
  b1.setVelocity(new Vector(100,  0),  0);  // high speed moving rightwards
  const b2 = Shapes.makeBlock(1, 1.3, 'block1');
  b2.setPosition(new Vector(5,  0));  // stationary
  sim.addBody(b1);
  sim.addBody(b2);
  sim.setElasticity(1.0);
};

/** High speed collision of two small objects.
*/
private static small_small(): void {
  setTestName(groupName+'small_small');
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  SpeedTest.small_small_setup(sim, advance);
  const vars = makeVars(6*2);
  setBodyVars(sim, vars, 0, 3.7878932, 0, 0, 0, 0.7853982, -0);
  setBodyVars(sim, vars, 1, 71.2121068, 100, 0, 0, 0, 0);
  // use large time step of 0.1 to ensure that object passes thru in single step
  runTest(sim, advance, /*runUntil=*/1.0,
      /*expectedVars=*/vars, /*tolerance=*/0.00001,
      /*expectedEnergyDiff=*/0.0, /*energyTol=*/0.00001,
      /*expectedCollisions=*/1);
};

} // end class
