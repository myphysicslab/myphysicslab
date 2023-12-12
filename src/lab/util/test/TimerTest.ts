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

import { Util } from "../Util.js";
import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";
import { MockClock } from "../../../test/MockClock.js";
import { Timer } from "../Timer.js";

const groupName = 'TimerTest.';

export default function scheduleTests() {
  schedule(testTimer1);
  schedule(testTimer2);
  schedule(testTimer3);
  schedule(testTimer4);
  schedule(testTimer5);
  schedule(testTimer6);
  schedule(testTimer7);
};

// Use default period of zero = 60 fps (frame per second) with legacy Timer.
function testTimer1() {
  startTest(groupName+'testTimer1');
  const tol = 1E-14;

  const mockClock = new MockClock();
  let testVar = 0;
  const myTimer = new Timer(/*legacy mode=*/true, mockClock);
  myTimer.setCallBack(() => testVar++);
  assertRoughlyEquals(0, myTimer.getPeriod(), 0.001);
  assertFalse(myTimer.isFiring());
  mockClock.tick(1000);
  assertEquals(0, testVar);
  myTimer.startFiring();
  assertTrue(myTimer.isFiring());
  mockClock.tick(1000);
  assertEquals(59, testVar);
  myTimer.stopFiring();
  mockClock.tick(1000);
  assertEquals(59, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(118, testVar);
  // set callback to null, can still run the timer but nothing happens
  myTimer.setCallBack(null);
  assertFalse(myTimer.isFiring());
  myTimer.startFiring();
  assertTrue(myTimer.isFiring());
  mockClock.tick(1000);
  assertEquals(118, testVar);
};

// Set period for 33.33 fps with non-legacy Timer.
// We get 50 fps for requestAnimationFrame (legacy=false) with mockClock.
function testTimer2() {
  startTest(groupName+'testTimer2');
  const tol = 1E-14;

  const mockClock = new MockClock();
  let testVar = 0;
  const myTimer = new Timer(/*legacy mode=*/false, mockClock);
  myTimer.setCallBack(() => testVar++);
  myTimer.setPeriod(0.03);
  mockClock.tick(1000);
  assertEquals(0, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(34, testVar);
  myTimer.stopFiring();
  mockClock.tick(1000);
  assertEquals(34, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(68, testVar);
};

// Set period for frame per second = 30 with legacy Timer.
function testTimer3() {
  startTest(groupName+'testTimer3');
  const tol = 1E-14;

  const mockClock = new MockClock();
  let testVar = 0;
  const myTimer = new Timer(/*legacy mode=*/true, mockClock);
  myTimer.setCallBack(() => testVar++);
  myTimer.setPeriod(1/30);
  assertRoughlyEquals(1/30, myTimer.getPeriod(), 0.001);
  mockClock.tick(1000);
  assertEquals(0, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(30, testVar);
  myTimer.stopFiring();
  mockClock.tick(1000);
  assertEquals(30, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(60, testVar);
};

// Set period for frame per second = 25 with non-legacy Timer.
// We get 50 fps for requestAnimationFrame (legacy=false) with mockClock.
function testTimer4() {
  startTest(groupName+'testTimer4');
  const tol = 1E-14;

  const mockClock = new MockClock();
  let testVar = 0;
  const myTimer = new Timer(/*legacy mode=*/false, mockClock);
  myTimer.setCallBack(() => testVar++);
  myTimer.setPeriod(1/25);
  assertRoughlyEquals(1/25, myTimer.getPeriod(), 0.001);
  mockClock.tick(1000);
  assertEquals(0, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(26, testVar);
  myTimer.stopFiring();
  mockClock.tick(1000);
  assertEquals(26, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(52, testVar);
};

// Use default period of zero with non-legacy Timer.
// We get 50 fps for requestAnimationFrame (legacy=false) with mockClock.
function testTimer5() {
  startTest(groupName+'testTimer5');
  const tol = 1E-14;

  const mockClock = new MockClock();
  let testVar = 0;
  const myTimer = new Timer(/*legacy mode=*/false, mockClock);
  myTimer.setCallBack(() => testVar++);
  assertRoughlyEquals(0, myTimer.getPeriod(), 0.001);
  mockClock.tick(1000);
  assertEquals(0, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(51, testVar);
  myTimer.stopFiring();
  mockClock.tick(1000);
  assertEquals(51, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(102, testVar);
};

// set period to 40 fps with legacy Timer
function testTimer6() {
  startTest(groupName+'testTimer6');
  const tol = 1E-14;

  const mockClock = new MockClock();
  let testVar = 0;
  const myTimer = new Timer(/*legacy mode=*/true, mockClock);
  myTimer.setCallBack(() => testVar++);
  myTimer.setPeriod(1/40);
  assertRoughlyEquals(1/40, myTimer.getPeriod(), 0.001);
  mockClock.tick(1000);
  assertEquals(0, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(41, testVar);
  myTimer.stopFiring();
  mockClock.tick(1000);
  assertEquals(41, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(82, testVar);
};

// set period to 40 fps, with non-legacy Timer
function testTimer7() {
  startTest(groupName+'testTimer7');
  const tol = 1E-14;

  const mockClock = new MockClock();
  let testVar = 0;
  const myTimer = new Timer(undefined, mockClock);
  myTimer.setCallBack(() => testVar++);
  myTimer.setPeriod(1/40);
  assertRoughlyEquals(1/40, myTimer.getPeriod(), 0.001);
  mockClock.tick(1000);
  assertEquals(0, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(41, testVar);
  myTimer.stopFiring();
  mockClock.tick(1000);
  assertEquals(41, testVar);
  myTimer.startFiring();
  mockClock.tick(1000);
  assertEquals(82, testVar);
};
