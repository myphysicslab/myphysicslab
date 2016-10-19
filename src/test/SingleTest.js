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

goog.provide('myphysicslab.test.SingleTest');

goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.test.CircleCircleTest');
goog.require('myphysicslab.test.CircleStraightTest');
goog.require('myphysicslab.test.DoNothingTest');
goog.require('myphysicslab.test.Engine2DTestRig');
goog.require('myphysicslab.test.JointTest');
goog.require('myphysicslab.test.MiscellanyTest');
goog.require('myphysicslab.test.MultipleCollisionTest');
goog.require('myphysicslab.test.PileTest');
goog.require('myphysicslab.test.RopeTest');
goog.require('myphysicslab.test.SpeedTest');
goog.require('myphysicslab.test.StraightStraightTest');

goog.scope(function() {

var CircleCircleTest = myphysicslab.test.CircleCircleTest;
var CircleStraightTest = myphysicslab.test.CircleStraightTest;
var CollisionHandling = myphysicslab.lab.engine2D.CollisionHandling;
var DoNothingTest = myphysicslab.test.DoNothingTest;
var Engine2DTestRig = myphysicslab.test.Engine2DTestRig;
var JointTest = myphysicslab.test.JointTest;
var MiscellanyTest = myphysicslab.test.MiscellanyTest;
var MultipleCollisionTest = myphysicslab.test.MultipleCollisionTest;
var PileTest = myphysicslab.test.PileTest;
var RopeTest = myphysicslab.test.RopeTest;
var SpeedTest = myphysicslab.test.SpeedTest;
var StraightStraightTest = myphysicslab.test.StraightStraightTest;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Runs a single test of the rigid body physics engine, useful for debugging. See
[Engine2D Overview](Engine2D.html).

Unlike other tests, the makefile does not set `GOOG_DEBUG` to false for this test, so
`goog.DEBUG` should be true when this is compiled.
* @constructor
* @final
* @struct
* @private
*/
myphysicslab.test.SingleTest = function() {
  throw new Error();
};
var SingleTest = myphysicslab.test.SingleTest;

/**
* @return {undefined}
* @export
*/
SingleTest.runTests = function() {
  Engine2DTestRig.startTests();

  //CircleCircleTest.test();
  //CircleStraightTest.ball_falls_on_floor_stuck()
  //CircleStraightTest.concave_ball_block_contact();
  //CircleStraightTest.elastic_balls();
  //CircleStraightTest.test();
  //CircleStraightTest.wedged_ball();
  //DoNothingTest.do_nothing_error();
  //JointTest.pendulum_1_joint_1();
  //JointTest.pendulum_1_joint_2();
  //JointTest.test();
  //MiscellanyTest.chain();
  //MiscellanyTest.clock_with_gears();
  //MiscellanyTest.curved_test_error();
  //MiscellanyTest.damping_legacy();
  //MiscellanyTest.do_nothing_grinder_test1b();
  //MiscellanyTest.non_collide_edges();
  //MiscellanyTest.roller_end_point_test();
  //MiscellanyTest.roller_hump_test();
  //MiscellanyTest.testPerformance();
  //MiscellanyTest.three_body_spin_test1();
  //MiscellanyTest.three_body_spin_test3A();
  //MultipleCollisionTest.one_hits_two_in_box();
  //MultipleCollisionTest.test1_0(CollisionHandling.SIMULTANEOUS);
  //MultipleCollisionTest.test3_1(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  //MultipleCollisionTest.test5_0(CollisionHandling.SERIAL_GROUPED_LASTPASS, true);
  //MultipleCollisionTest.test6_0(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  //MultipleCollisionTest.test7_2(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  //MultipleCollisionTest.test8_5();
  //PileTest.additive_pile_circle_test(28);
  //PileTest.additive_pile_square_test(17);
  //PileTest.connected_blocks_pile_test();
  //PileTest.near_stable_connected_blocks_pile_test();
  //PileTest.pile_10_random_blocks();
  //PileTest.pile_20_random_blocks();
  //PileTest.pile_config_1_test();
  //PileTest.stable_connected_blocks_pile_test();
  //PileTest.test();
  //PileTest.testPerformance();
  //RopeTest.pendulum_rope_bounce_test();
  //RopeTest.pendulum_rope_test();
  //RopeTest.test();
  //SpeedTest.test();
  //StraightStraightTest.block_block_contact_2();
  //StraightStraightTest.diamonds();
  //StraightStraightTest.ngon_block();
  //StraightStraightTest.oblique_corner_collision();
  //StraightStraightTest.one_block();
  StraightStraightTest.six_blocks_4();
  //StraightStraightTest.six_blocks_performance(100);
  //StraightStraightTest.six_blocks_performance(t);
  //StraightStraightTest.six_blocks_settle();
  //StraightStraightTest.test();

  Engine2DTestRig.schedule(Engine2DTestRig.finishTests);
  Engine2DTestRig.runTests();
};

}); // goog.scope
