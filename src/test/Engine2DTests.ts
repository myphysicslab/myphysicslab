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

import { CircleCircleTest } from './CircleCircleTest.js';
import { CircleStraightTest } from './CircleStraightTest.js';
import { DoNothingTest } from './DoNothingTest.js';
import { JointTest } from './JointTest.js';
import { MiscellanyTest } from './MiscellanyTest.js';
import { MultipleCollisionTest } from './MultipleCollisionTest.js';
import { PileTest } from './PileTest.js';
import { RopeTest } from './RopeTest.js';
import { SpeedTest } from './SpeedTest.js';
import { StraightStraightTest } from './StraightStraightTest.js';

import { startTests, schedule, runTests, finishTests } from './TestRig.js';

/** Runs tests of the [2D Physics Engine](../Engine2D.html) using
{@link test/TestRig}.

These tests are mainly useful as a warning that the behavior of the physics engine has
changed. This can happen when changes are made to the physics engine or when browser
behavior changes (because of an update to a browser). These tests don't specify
"correct" behavior, but rather the historical expected behavior.

See [Engine2D Tests](../Building.html#engine2dtests) for more information.

Usually `Util.DEBUG` should be false when this is compiled to avoid
printing lots of debug messages to console.
*/

export function runEngine2DTests(): void {
  startTests();
  CircleCircleTest.test();
  CircleStraightTest.test();
  DoNothingTest.test();
  JointTest.test();
  MiscellanyTest.test();
  MultipleCollisionTest.test();
  PileTest.test();
  RopeTest.test();
  SpeedTest.test();
  StraightStraightTest.test();
  schedule(finishTests);
  runTests();
};
