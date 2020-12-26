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

goog.module('myphysicslab.lab.util.test.TimerTest');

goog.require('goog.array');
goog.require('goog.testing.MockClock');
const Util = goog.require('myphysicslab.lab.util.Util');
const Timer = goog.require('myphysicslab.lab.util.Timer');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);

class TimerTest {

static test() {
  schedule(TimerTest.testTimer1);
  schedule(TimerTest.testTimer2);
  schedule(TimerTest.testTimer3);
  schedule(TimerTest.testTimer4);
  schedule(TimerTest.testTimer5);
  schedule(TimerTest.testTimer6);
  schedule(TimerTest.testTimer7);
};

// Use default period of zero = 60 fps (frame per second) with legacy Timer.
static testTimer1() {
  startTest(TimerTest.groupName+'testTimer1');
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/true);
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

  } finally {
    Util.MOCK_CLOCK = true;
    mockClock.uninstall();
  }
};

// Set period for 33.33 fps with non-legacy Timer.
// We get 50 fps for requestAnimationFrame (legacy=false) with mockClock.
static testTimer2() {
  startTest(TimerTest.groupName+'testTimer2');
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/false);
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

  } finally {
    Util.MOCK_CLOCK = true;
    mockClock.uninstall();
  }
};

// Set period for frame per second = 30 with legacy Timer.
static testTimer3() {
  startTest(TimerTest.groupName+'testTimer3');
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/true);
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

  } finally {
    Util.MOCK_CLOCK = true;
    mockClock.uninstall();
  }
};

// Set period for frame per second = 25 with non-legacy Timer.
// We get 50 fps for requestAnimationFrame (legacy=false) with mockClock.
static testTimer4() {
  startTest(TimerTest.groupName+'testTimer4');
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/false);
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

  } finally {
    Util.MOCK_CLOCK = true;
    mockClock.uninstall();
  }
};

// Use default period of zero with non-legacy Timer.
// We get 50 fps for requestAnimationFrame (legacy=false) with mockClock.
static testTimer5() {
  startTest(TimerTest.groupName+'testTimer5');
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/false);
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

  } finally {
    Util.MOCK_CLOCK = true;
    mockClock.uninstall();
  }
};

// set period to 40 fps with legacy Timer
static testTimer6() {
  startTest(TimerTest.groupName+'testTimer6');
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/true);
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

  } finally {
    Util.MOCK_CLOCK = true;
    mockClock.uninstall();
  }
};

// set period to 40 fps, with non-legacy Timer
static testTimer7() {
  startTest(TimerTest.groupName+'testTimer7');
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer();
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

  } finally {
    Util.MOCK_CLOCK = true;
    mockClock.uninstall();
  }
};


} // end class

/**
* @type {string}
* @const
*/
TimerTest.groupName = 'TimerTest.';

exports = TimerTest;
