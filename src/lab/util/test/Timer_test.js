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

goog.provide('myphysicslab.lab.util.test.Timer_test');

goog.require('goog.array');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Timer');
goog.require('goog.testing.MockClock');
goog.require('goog.testing.jsunit');


// Use default period of zero = 60 fps (frame per second) with legacy Timer.
var testTimer1 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/true);
    myTimer.setCallBack(function() { testVar++; });
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
goog.exportProperty(window, 'testTimer1', testTimer1);

// Set period for 33.33 fps with non-legacy Timer.
// We get 50 fps for requestAnimationFrame (legacy=false) with mockClock.
var testTimer2 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/false);
    myTimer.setCallBack(function() { testVar++; });
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
goog.exportProperty(window, 'testTimer2', testTimer2);

// Set period for frame per second = 30 with legacy Timer.
var testTimer3 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/true);
    myTimer.setCallBack(function() { testVar++; });
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
goog.exportProperty(window, 'testTimer3', testTimer3);

// Set period for frame per second = 25 with non-legacy Timer.
// We get 50 fps for requestAnimationFrame (legacy=false) with mockClock.
var testTimer4 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/false);
    myTimer.setCallBack(function() { testVar++; });
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
goog.exportProperty(window, 'testTimer4', testTimer4);

// Use default period of zero with non-legacy Timer.
// We get 50 fps for requestAnimationFrame (legacy=false) with mockClock.
var testTimer5 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/false);
    myTimer.setCallBack(function() { testVar++; });
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
goog.exportProperty(window, 'testTimer5', testTimer5);

// set period to 40 fps with legacy Timer
var testTimer6 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer(/*legacy mode=*/true);
    myTimer.setCallBack(function() { testVar++; });
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
goog.exportProperty(window, 'testTimer6', testTimer6);

// set period to 40 fps, with non-legacy Timer
var testTimer7 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();
    var testVar = 0;
    var myTimer = new Timer();
    myTimer.setCallBack(function() { testVar++; });
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
goog.exportProperty(window, 'testTimer7', testTimer7);

