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

goog.provide('myphysicslab.lab.util.test.TimerClock_test');

goog.require('goog.array');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Timer');
goog.require('myphysicslab.lab.util.Clock');
goog.require('goog.testing.MockClock');
goog.require('goog.testing.jsunit');


/** Defines the callback function that the Timer executes.
* @param {!myphysicslab.lab.util.Timer} timer
* @constructor
* @final
* @struct
*/
myphysicslab.lab.util.test.TimerClock_test.MockClass = function(timer) {
  /**
  * @type {number}
  */
  this.timesFired = 0;
  /**
  * @type {!myphysicslab.lab.util.Timer}
  */
  this.timer = timer;
  this.timer.setCallBack(goog.bind(this.myCallBack, this));
};

myphysicslab.lab.util.test.TimerClock_test.MockClass.prototype.myCallBack = function() {
  var Util = myphysicslab.lab.util.Util;
  this.timesFired++;
  var now = Util.getSystemTime();
  assertRoughlyEquals(Util.getSystemTime(), this.timer.getExpectedTime(), 1E-6);
  this.timer.fireAfter(this.timer.getPeriod());
};

/**  Observer that counts number of times that parameters are changed or
*    events fire.
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.util.test.TimerClock_test.MockObserver1 = function() {
  /**
  * @type {number}
  */
  this.numEvents = 0;
  /**
  * @type {number}
  */
  this.numStartEvents = 0;
  /**
  * @type {number}
  */
  this.numStopEvents = 0;
  /**
  * @type {number}
  */
  this.numPauseEvents = 0;
  /**
  * @type {number}
  */
  this.numResumeEvents = 0;
  /**
  * @type {number}
  */
  this.numStepEvents = 0;
  /**
  * @type {number}
  */
  this.numSetTimeEvents = 0;
  /**
  * @type {number}
  */
  this.numBooleans = 0;
  /**
  * @type {number}
  */
  this.numDoubles = 0;
  /**
  * @type {number}
  */
  this.numStrings = 0;
};

myphysicslab.lab.util.test.TimerClock_test.MockObserver1.prototype.observe =  function(event) {
  if (event instanceof myphysicslab.lab.util.GenericEvent) {
    var Clock = myphysicslab.lab.util.Clock;
    this.numEvents++;
    if (event.nameEquals(Clock.CLOCK_PAUSE)) {
      this.numPauseEvents++;
    } else if (event.nameEquals(Clock.CLOCK_RESUME)) {
      this.numResumeEvents++;
    } else if (event.nameEquals(Clock.CLOCK_STEP)) {
      this.numStepEvents++;
    } else if (event.nameEquals(Clock.CLOCK_SET_TIME)) {
      this.numSetTimeEvents++;
    } else {
      fail('unknown event '+event.getName());
    }
  } else if (event instanceof myphysicslab.lab.util.ParameterBoolean) {
    this.numBooleans++;
    this.numEvents++;
  } else if (event instanceof myphysicslab.lab.util.ParameterNumber) {
    this.numDoubles++;
    this.numEvents++;
  } else if (event instanceof myphysicslab.lab.util.ParameterString) {
    this.numStrings++;
    this.numEvents++;
  }
};

myphysicslab.lab.util.test.TimerClock_test.MockObserver1.prototype.toStringShort = function() {
  return 'MockObserver1';
};
/*
stage    system     clock    real    expect  period  events  fired  running?  firing?
1   initial state
        0             0      0        NaN      50      0      0      n        n
2   startFiring()
        0             0      0       0.050     50      1      0      n        y
    resume()
        0             0      0       0.050     50      2      0      y        y
3   tick(49)
        0.049        0.049   0.049   0.050     50      2      0      y        y
4   tick(1)
        0.050        0.050   0.050   0.100     50      2      1      y        y
5   tick(49)
        0.099        0.099   0.099   0.100     50      2      1      y        y
6   tick(1)
        0.100        0.100   0.100   0.150     50      2      2      y        y
7   pause()
        0.100        0.100   0.100   0.150     50      3      2      n        y
8   tick(50)
        0.150        0.100   0.100   0.200     50      3      3      n        y
9   stopFiring()
        0.150        0.100   0.100   NaN       50      4      3      n        n
10  tick(50)
        0.200        0.100   0.100   NaN       50      4      3      n        n
11  resume()
    startFiring()
        0.200        0.100   0.100   0.250     50      6      3      y        y
12  stopFiring()
        0.200        0.100   0.100   NaN       50      8      3      n        n
13  tick(50)
        0.250        0.100   0.100   NaN       50      8      3      n        n
14  startFiring()
        0.250        0.100   0.100   0.300     50      9      3      n        y
15  resume()
        0.250        0.100   0.100   0.300     50     10      3      y        y
16  tick(50)
        0.300        0.150   0.150   0.350     50     10      4      y        y
17  setTime(0.125)
        0.300        0.125   0.150   0.350     50     11      4      y        y
18  setPeriod(0.040)
    tick(50)
        0.350        0.175   0.200   0.390     40     12      5      y        y
19  step()
        0.350        0.215   0.240   0.390     40     14      5      n        y
20  tick(40)
        0.390        0.215   0.240   0.430     40     14      6      n        y
21  step()
        0.390        0.255   0.280   0.430     40     15      6      n        y
22  tick(40)
        0.430        0.255   0.280   0.470     40     15      7      n        y
*/
var testTimerClock1 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var Clock = myphysicslab.lab.util.Clock;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    mockClock.install();

    var myTimer = new Timer();
    myTimer.setPeriod(0.050);
    var myMockClass = new myphysicslab.lab.util.test.TimerClock_test.MockClass(myTimer);
    var myClock = new Clock();
    var mockObsvr1 = new myphysicslab.lab.util.test.TimerClock_test.MockObserver1();
    // add the observer to the subject
    myClock.addObserver(mockObsvr1);

    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, mockObsvr1.numBooleans);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(0, mockObsvr1.numStrings);

    // Note that installing goog.testing.MockClock redefines goog.now()
    assertEquals(0, goog.now());
    assertRoughlyEquals(0, Util.getSystemTime(), tol);

    // 1. initial conditions
    assertEquals(0, myMockClass.timesFired);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());
    assertNaN(myTimer.getExpectedTime());
    assertFalse(myClock.isRunning());
    assertFalse(myTimer.isFiring());
    assertEquals(1, myClock.getTimeRate());
    assertEquals(0.050, myTimer.getPeriod());
    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, myMockClass.timesFired);

    // 2. start callback firing and resume the Clock, but don't advance time
    myTimer.startFiring(); // calls Timer.fireAfter() which schedules callback at 50
    assertFalse(myClock.isRunning());
    assertTrue(myTimer.isFiring());
    assertRoughlyEquals(0.050, myTimer.getExpectedTime(), tol);
    assertRoughlyEquals(0.050, myTimer.getExpectedTime(), tol);
    myClock.resume();
    assertRoughlyEquals(0.050, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());
    assertRoughlyEquals(0.050, myTimer.getExpectedTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(0, myMockClass.timesFired);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());

    // 3. advance time to just before when callback should fire, should be no change
    mockClock.tick(49);
    assertEquals(49, goog.now());
    assertRoughlyEquals(0.049, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(0, myMockClass.timesFired);  // no callback fired
    assertRoughlyEquals(0.049, myClock.getTime(), tol);
    assertRoughlyEquals(0.049, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 4. advance one more tick and callback should fire
    mockClock.tick(1);
    assertRoughlyEquals(0.100, myTimer.getExpectedTime(), tol);
    assertEquals(50, goog.now());
    assertRoughlyEquals(0.050, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(1, myMockClass.timesFired);  // 1 callback fired
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 5. advance time to just before when callback should fire, should be no change
    mockClock.tick(49);
    assertEquals(99, goog.now());
    assertRoughlyEquals(0.099, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(1, myMockClass.timesFired);  // no callback fired
    assertRoughlyEquals(0.099, myClock.getTime(), tol);
    assertRoughlyEquals(0.099, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 6. advance one more tick and callback should fire
    mockClock.tick(1);
    assertRoughlyEquals(0.150, myTimer.getExpectedTime(), tol);
    assertEquals(100, goog.now());
    assertRoughlyEquals(0.100, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(2, myMockClass.timesFired);  // 1 callback fired
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 7. pause.
    myClock.pause();
    assertEquals(2, mockObsvr1.numEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(1, mockObsvr1.numPauseEvents);
    assertEquals(2, myMockClass.timesFired);  // no callback fired
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.150, myTimer.getExpectedTime(), tol);
    assertFalse(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 8. pause mode.  callback should fire, but time doesn't advance
    mockClock.tick(50);
    assertFalse(myClock.isRunning());
    assertTrue(myTimer.isFiring());
    assertEquals(150, goog.now());
    assertRoughlyEquals(0.150, Util.getSystemTime(), tol);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.200, myTimer.getExpectedTime(), tol);
    assertEquals(3, myMockClass.timesFired);  // 1 callback fired

    // 9. stop firing when paused (no pause event happens)
    myTimer.stopFiring();  // cancels the callback
    assertFalse(myClock.isRunning());
    assertFalse(myTimer.isFiring());
    assertEquals(1, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(2, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertNaN(myTimer.getExpectedTime());

    // 10. not firing & paused mode.  Time doesn't advance and callbacks don't fire.
    mockClock.tick(50);  // no callback scheduled
    assertEquals(200, goog.now());
    assertRoughlyEquals(0.200, Util.getSystemTime(), tol);
    assertFalse(myClock.isRunning());
    assertFalse(myTimer.isFiring());
    assertEquals(2, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);  // no callback fired
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertNaN(myTimer.getExpectedTime());

    // 11. resume when not firing and paused.  -->  firing & not-paused mode.
    myClock.resume();
    myTimer.startFiring();
    assertRoughlyEquals(0.200, Util.getSystemTime(), tol);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.250, myTimer.getExpectedTime(), tol);
    assertEquals(1, mockObsvr1.numPauseEvents);
    assertEquals(2, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(3, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);  // no callback fired.
    assertEquals(0.050, myTimer.getPeriod());
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 12. immediately stop callback before any time passes
    myTimer.stopFiring();
    assertEquals(1, mockObsvr1.numPauseEvents);
    assertEquals(2, mockObsvr1.numResumeEvents);
    assertEquals(3, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);  // no callback fired.
    assertRoughlyEquals(0.200, Util.getSystemTime(), tol);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertNaN(myTimer.getExpectedTime());

    // 12b pause
    myClock.pause();
    assertEquals(2, mockObsvr1.numPauseEvents);
    assertEquals(2, mockObsvr1.numResumeEvents);
    assertEquals(4, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);  // no callback fired.
    assertRoughlyEquals(0.200, Util.getSystemTime(), tol);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertNaN(myTimer.getExpectedTime());

    // 13. not firing & paused mode.  Time doesn't advance and callbacks don't fire.
    mockClock.tick(50);  // no callback scheduled
    assertEquals(250, goog.now());
    assertRoughlyEquals(0.250, Util.getSystemTime(), tol);
    assertEquals(3, myMockClass.timesFired);  // no callback fired
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertNaN(myTimer.getExpectedTime());
    assertFalse(myClock.isRunning());
    assertFalse(myTimer.isFiring());

    // 14. start when not firing and paused  -->  firing & paused mode.
    myTimer.startFiring();  // schedules callback at sys:0.300
    assertEquals(250, goog.now());
    assertRoughlyEquals(0.250, Util.getSystemTime(), tol);
    assertEquals(2, mockObsvr1.numPauseEvents);
    assertEquals(2, mockObsvr1.numResumeEvents);
    assertEquals(4, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);  // no callback fired
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.300, myTimer.getExpectedTime(), tol);
    assertFalse(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 15. resume the clock
    myClock.resume();
    assertEquals(2, mockObsvr1.numPauseEvents);
    assertEquals(3, mockObsvr1.numResumeEvents);
    assertEquals(5, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);  // no callback fired
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.300, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 16. firing & not-paused mode.  Time advances and callbacks fire.
    mockClock.tick(50);  // fires callback, reschedules for sys:0.350
    assertEquals(300, goog.now());
    assertRoughlyEquals(0.300, Util.getSystemTime(), tol);
    assertEquals(4, myMockClass.timesFired);  // 1 callback fired
    assertRoughlyEquals(0.150, myClock.getTime(), tol);
    assertRoughlyEquals(0.150, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.350, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 17. retard the Clock time, so it is 0.025 behind real time
    myClock.setTime(0.125);
    assertEquals(2, mockObsvr1.numPauseEvents);
    assertEquals(3, mockObsvr1.numResumeEvents);
    assertEquals(1, mockObsvr1.numSetTimeEvents);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(6, mockObsvr1.numEvents);
    assertEquals(4, myMockClass.timesFired);
    assertRoughlyEquals(0.300, Util.getSystemTime(), tol);
    assertRoughlyEquals(0.125, myClock.getTime(), tol);
    assertRoughlyEquals(0.150, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.350, myTimer.getExpectedTime(), tol);

    // 18. change the delay and advance time
    myTimer.setPeriod(0.040);
    assertEquals(0.040, myTimer.getPeriod());
    //assertNaN(myTimer.getExpectedTime());
    mockClock.tick(50);   // fires callback, reschedules for sys:390
    assertEquals(350, goog.now());
    assertRoughlyEquals(0.350, Util.getSystemTime(), tol);
    assertEquals(6, mockObsvr1.numEvents);
    assertEquals(5, myMockClass.timesFired);  // 1 callback fired
    assertRoughlyEquals(0.175, myClock.getTime(), tol);
    assertRoughlyEquals(0.200, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.390, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 19. step advances timer's time by 40 ms; and does pause(), because was firing.
    // we aren't advancing time (done by mockClock.tick), so the callback
    // will not happen until sys:390.
    myClock.step(0.040);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(3, mockObsvr1.numPauseEvents);  // one more
    assertEquals(3, mockObsvr1.numResumeEvents);
    assertEquals(1, mockObsvr1.numStepEvents); // one more
    assertEquals(1, mockObsvr1.numSetTimeEvents);
    assertEquals(8, mockObsvr1.numEvents);  // pause and step events happened
    assertEquals(350, goog.now());  // no change
    assertRoughlyEquals(0.350, Util.getSystemTime(), tol);  // no change
    assertEquals(5, myMockClass.timesFired);  // no callback fired
    assertRoughlyEquals(0.215, myClock.getTime(), tol);  // step() changeded this
    assertRoughlyEquals(0.240, myClock.getRealTime(), tol); // realtime is 0.025 ahead
    assertRoughlyEquals(0.390, myTimer.getExpectedTime(), tol); // no change
    assertFalse(myClock.isRunning());
    assertTrue(myClock.isStepping());
    assertTrue(myTimer.isFiring());
    myClock.clearStepMode();  // we've done what was needed for the step
    assertFalse(myClock.isStepping());

    // 20. pause mode.  Advance system time, and callback happens, but time doesn't advance.
    mockClock.tick(40);  // fires callback, reschedules for sys:430, sim:255
    assertEquals(390, goog.now());
    assertRoughlyEquals(0.390, Util.getSystemTime(), tol);
    assertEquals(8, mockObsvr1.numEvents);  // pause and step events happened
    assertEquals(6, myMockClass.timesFired);  // 1 callback fired
    assertRoughlyEquals(0.215, myClock.getTime(), tol);
    assertRoughlyEquals(0.240, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.430, myTimer.getExpectedTime(), tol); // =40 ms after 0.215
    assertFalse(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 21. Step from pause mode;  this will increment the time, but the callback
    // only fires when the system time advances.
    myClock.step(0.040);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(3, mockObsvr1.numPauseEvents);
    assertEquals(3, mockObsvr1.numResumeEvents);
    assertEquals(2, mockObsvr1.numStepEvents); // one more
    assertEquals(1, mockObsvr1.numSetTimeEvents);
    assertEquals(9, mockObsvr1.numEvents);
    assertEquals(390, goog.now());
    assertRoughlyEquals(0.390, Util.getSystemTime(), tol);
    assertEquals(6, myMockClass.timesFired);  // no callback fired
    assertRoughlyEquals(0.255, myClock.getTime(), tol);
    assertRoughlyEquals(0.280, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.430, myTimer.getExpectedTime(), tol);
    assertFalse(myClock.isRunning());
    assertTrue(myClock.isStepping());
    assertTrue(myTimer.isFiring());
    myClock.clearStepMode();  // we've done what was needed for the step
    assertFalse(myClock.isStepping());

    // 22. advance the system clock, and the callback occurs
    mockClock.tick(40); // fires callback, reschedules for sys:470, sim:295
    assertEquals(430, goog.now());
    assertRoughlyEquals(0.430, Util.getSystemTime(), tol);
    assertEquals(9, mockObsvr1.numEvents);
    assertEquals(7, myMockClass.timesFired);  // 1 callback fired
    assertRoughlyEquals(0.255, myClock.getTime(), tol);
    assertRoughlyEquals(0.280, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.470, myTimer.getExpectedTime(), tol);
    assertFalse(myClock.isRunning());
    assertTrue(myTimer.isFiring());


  } finally {
    mockClock.uninstall();
  }
};
goog.exportProperty(window, 'testTimerClock1', testTimerClock1);

/*
stage     system     clock    real    expect  period  events  fired  rate
1   initial state
        0             0      0        NaN      50      0      0      1
2   startFiring()
    resume()
        0             0      0       0.050     50      2      0      1
3   tick(50)
        0.050        0.050   0.050   0.100     50      2      1      1
4   setTimeRate(2)
        0.050        0.050   0.050   0.100     50      3      1      2
5   tick(50)
        0.100        0.150   0.150   0.150     50      3      2      2
6   tick(50)
        0.150        0.250   0.250   0.200     50      3      3      2
7   setTimeRate(0.5)
        0.150        0.250   0.250   0.200     50      4      3      0.5
8   tick(50)
        0.200        0.275   0.275   0.250     50      4      4      0.5
9   setTime(0.250)
        0.200        0.250   0.275   0.250     50      5      4      0.5
10  tick(50)
        0.250        0.275   0.300   0.300     50      5      5      0.5
11  tick(50)
        0.300        0.300   0.325   0.350     50      5      6      0.5
12  setTime(1.0)
        0.300        0.300   0.325   0.350     50      6      6      1
13  tick(50)
        0.350        0.350   0.375   0.400     50      6      7      1
14  tick(50)
        0.400        0.400   0.425   0.450     50      6      8      1
*/
// tests changing time rate
var testTimerClock2 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var Clock = myphysicslab.lab.util.Clock;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    mockClock.install();

    var myTimer = new Timer();
    myTimer.setPeriod(0.050);
    var myMockClass = new myphysicslab.lab.util.test.TimerClock_test.MockClass(myTimer);
    var myClock = new Clock();
    var mockObsvr1 = new myphysicslab.lab.util.test.TimerClock_test.MockObserver1();
    // add the observer to the subject
    myClock.addObserver(mockObsvr1);

    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, mockObsvr1.numBooleans);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(0, mockObsvr1.numStrings);

    // Note how installing goog.testing.MockClock redefines goog.now()
    assertEquals(0, goog.now());
    assertRoughlyEquals(0, Util.getSystemTime(), tol);

    // 1. initial conditions
    assertEquals(0, myMockClass.timesFired);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());
    assertNaN(myTimer.getExpectedTime());
    assertFalse(myClock.isRunning());
    assertFalse(myTimer.isFiring());
    assertEquals(1, myClock.getTimeRate());
    assertEquals(0.050, myTimer.getPeriod());
    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, myMockClass.timesFired);

    // 2. start
    myTimer.startFiring();
    assertFalse(myClock.isRunning());
    assertTrue(myTimer.isFiring());
    myClock.resume();
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());
    assertRoughlyEquals(0.050, myTimer.getExpectedTime(), tol);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(0, myMockClass.timesFired);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());

    // 3. advance sysTime
    mockClock.tick(50);
    assertEquals(50, goog.now());
    assertRoughlyEquals(0.050, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(1, myMockClass.timesFired);  // 1 callback fired
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.100, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 4. change so Clock goes at twice system time rate
    myClock.setTimeRate(2);
    assertEquals(2, myClock.getTimeRate());
    assertEquals(50, goog.now());
    assertRoughlyEquals(0.050, Util.getSystemTime(), tol);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(1, mockObsvr1.numDoubles);
    assertEquals(2, mockObsvr1.numEvents);
    assertEquals(1, myMockClass.timesFired);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.100, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 5. advance sysTime
    mockClock.tick(50);
    assertEquals(100, goog.now());
    assertRoughlyEquals(0.100, Util.getSystemTime(), tol);
    assertEquals(2, mockObsvr1.numEvents);
    assertEquals(2, myMockClass.timesFired);
    assertRoughlyEquals(0.150, myClock.getTime(), tol);
    assertRoughlyEquals(0.150, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.150, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 6. advance sysTime
    mockClock.tick(50);
    assertEquals(150, goog.now());
    assertRoughlyEquals(0.150, Util.getSystemTime(), tol);
    assertEquals(2, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);
    assertRoughlyEquals(0.250, myClock.getTime(), tol);
    assertRoughlyEquals(0.250, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.200, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 7. change so Clock goes at half system time rate
    myClock.setTimeRate(0.5);
    assertRoughlyEquals(0.5, myClock.getTimeRate(), tol);
    assertEquals(150, goog.now());
    assertRoughlyEquals(0.150, Util.getSystemTime(), tol);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(2, mockObsvr1.numDoubles);
    assertEquals(3, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);
    assertRoughlyEquals(0.250, myClock.getTime(), tol);
    assertRoughlyEquals(0.250, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.200, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 8. advance sysTime
    mockClock.tick(50);
    assertEquals(200, goog.now());
    assertRoughlyEquals(0.200, Util.getSystemTime(), tol);
    assertEquals(3, mockObsvr1.numEvents);
    assertEquals(4, myMockClass.timesFired);
    assertRoughlyEquals(0.275, myClock.getTime(), tol);
    assertRoughlyEquals(0.275, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.250, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 9. retard the Clock
    myClock.setTime(0.250);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(1, mockObsvr1.numSetTimeEvents);
    assertEquals(2, mockObsvr1.numDoubles);
    assertEquals(4, mockObsvr1.numEvents);
    assertEquals(4, myMockClass.timesFired);
    assertRoughlyEquals(0.250, myClock.getTime(), tol);
    assertRoughlyEquals(0.275, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.250, myTimer.getExpectedTime(), tol);

    // 10. advance sysTime
    mockClock.tick(50);
    assertEquals(250, goog.now());
    assertRoughlyEquals(0.250, Util.getSystemTime(), tol);
    assertEquals(4, mockObsvr1.numEvents);
    assertEquals(5, myMockClass.timesFired);
    assertRoughlyEquals(0.275, myClock.getTime(), tol);
    assertRoughlyEquals(0.300, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.300, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 11. advance sysTime
    mockClock.tick(50);
    assertEquals(300, goog.now());
    assertRoughlyEquals(0.300, Util.getSystemTime(), tol);
    assertEquals(4, mockObsvr1.numEvents);
    assertEquals(6, myMockClass.timesFired);
    assertRoughlyEquals(0.300, myClock.getTime(), tol);
    assertRoughlyEquals(0.325, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.350, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 12. change so Clock goes at same as system time rate
    myClock.setTimeRate(1.0);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(1, mockObsvr1.numSetTimeEvents);
    assertEquals(3, mockObsvr1.numDoubles);
    assertEquals(5, mockObsvr1.numEvents);
    assertEquals(6, myMockClass.timesFired);
    assertRoughlyEquals(1.0, myClock.getTimeRate(), tol);
    assertRoughlyEquals(0.350, myTimer.getExpectedTime(), tol);

    // 13. advance sysTime
    mockClock.tick(50);
    assertEquals(350, goog.now());
    assertRoughlyEquals(0.350, Util.getSystemTime(), tol);
    assertEquals(7, myMockClass.timesFired);
    assertRoughlyEquals(0.350, myClock.getTime(), tol);
    assertRoughlyEquals(0.375, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.400, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 14. advance sysTime
    mockClock.tick(50);
    assertEquals(400, goog.now());
    assertRoughlyEquals(0.400, Util.getSystemTime(), tol);
    assertEquals(5, mockObsvr1.numEvents);
    assertEquals(8, myMockClass.timesFired);
    assertRoughlyEquals(0.400, myClock.getTime(), tol);
    assertRoughlyEquals(0.425, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.450, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

  } finally {
    mockClock.uninstall();
  }
};
goog.exportProperty(window, 'testTimerClock2', testTimerClock2);

/** Defines the callback function that the Timer executes
* @param {!myphysicslab.lab.util.Timer} timer
* @param {!myphysicslab.lab.util.Clock} clock
* @param {!goog.testing.MockClock} mockClock
* @constructor
* @final
* @struct
*/
myphysicslab.lab.util.test.TimerClock_test.MockClass3 = function(timer, clock,
      mockClock) {
  /**
  * @type {number}
  */
  this.timesFired = 0;
  /** amount of time that simTime increases by during callback
  * @type {number}
  */
  this.period = 0.050;
  /** 'simulation time' which the callback is trying to match
  * @type {number}
  */
  this.simTime = 0;
  /**
  * @type {!myphysicslab.lab.util.Timer}
  */
  this.timer = timer;
  this.timer.setCallBack(goog.bind(this.myCallBack3, this));
  /**
  * @type {!myphysicslab.lab.util.Clock}
  */
  this.clock = clock;
  /**
  * @type {!goog.testing.MockClock}
  */
  this.mockClock = mockClock;
};

myphysicslab.lab.util.test.TimerClock_test.MockClass3.prototype.myCallBack3 = function() {
  var Util = myphysicslab.lab.util.Util;
  var now = Util.getSystemTime();
  var late = this.mockClock.getTimeoutDelay()/1000;
  var expect = this.timer.getExpectedTime();
  //console.log('myCallback now='+now+' expect+late='+(expect+late));
  assertRoughlyEquals(now, expect+late, 1E-12);
  this.timesFired++;
  this.simTime += this.period;
  //console.log('myCallback3 clock='+this.timer.getTime()
  //    +' simTime='+this.simTime);
  // show that we keep up with simTime despite having callbacks happening late
  assertTrue(Math.abs(this.simTime - this.clock.getTime()) < 0.011);
  this.timer.finishAt(this.clock.clockToSystem(this.simTime + this.period));
};

/*
stage   system     clock   delay   expect
1   initial
           0         0       0      NaN
2   startFiring(0.050)
    resume()
           0         0       0      0.050
3   tick(50)
           0.050     0.050   0      0.100
4   tick(50)
           0.100     0.100   0      0.150
5   setTimeoutDelay(10)
    tick(60)
           0.160     0.160   10     0.190
6   setTimeoutDelay(0)
    tick(30)
           0.190     0.190    0     0.250
7   tick(60)
           0.250     0.250    0     0.300
8   setTimeoutDelay(-10)
    tick(40)
           0.290     0.290    -10   0.350
9   setTimeoutDelay(10)
    tick(70)
           0.360     0.360    10    0.390
10  tick(40)
           0.400     0.400    10    0.440
11  tick(50)
           0.450     0.450    10    0.490
12  setTimeoutDelay(5)
    tick(45)
           0.495     0.495    5     0.545
13  setTimeoutDelay(-5)
    tick(45)
           0.540     0.540    -5    0.600
14  setTimeoutDelay(10)
    tick(70)
           0.610     0.610    10    0.640
15  tick(40)
           0.650     0.650    10    0.690
*/
// tests the `Timer.finishAt` method, when callback is early or late.
var testTimerClock3 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var Clock = myphysicslab.lab.util.Clock;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    mockClock.install();

    var myTimer = new Timer();
    myTimer.setPeriod(0.050);  // only used during first firing
    var myClock = new Clock();
    var myMockClass = new myphysicslab.lab.util.test.TimerClock_test.MockClass3(myTimer,
        myClock, mockClock);
    var mockObsvr1 = new myphysicslab.lab.util.test.TimerClock_test.MockObserver1();
    // add the observer to the subject
    myClock.addObserver(mockObsvr1);

    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, mockObsvr1.numBooleans);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(0, mockObsvr1.numStrings);

    // Note how installing goog.testing.MockClock redefines goog.now()
    assertEquals(0, goog.now());
    assertRoughlyEquals(0, Util.getSystemTime(), tol);

    // 1. initial conditions
    assertEquals(0, myMockClass.timesFired);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());
    assertNaN(myTimer.getExpectedTime());
    assertFalse(myClock.isRunning());
    assertFalse(myTimer.isFiring());
    assertEquals(1, myClock.getTimeRate());
    assertEquals(0.050, myTimer.getPeriod());
    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, myMockClass.timesFired);

    // 2. start firing callback
    myTimer.startFiring();
    assertFalse(myClock.isRunning());
    assertTrue(myTimer.isFiring());
    myClock.resume();
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());
    assertRoughlyEquals(0.050, myTimer.getExpectedTime(), tol);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(0, myMockClass.timesFired);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());

    // 3. advance sysTime.  Our callback fires for the first time.
    mockClock.tick(50);
    assertEquals(50, goog.now());
    assertRoughlyEquals(0.050, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(1, myMockClass.timesFired);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.100, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 4. advance time
    mockClock.tick(50);
    assertEquals(100, goog.now());
    assertRoughlyEquals(0.100, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(2, myMockClass.timesFired);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertRoughlyEquals(0.150, myTimer.getExpectedTime(), tol);

    // 5. advance time, but have the callback happen late
    mockClock.setTimeoutDelay(10);
    mockClock.tick(60);
    assertEquals(160, goog.now());
    assertRoughlyEquals(0.160, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);
    assertRoughlyEquals(0.160, myClock.getTime(), tol);
    assertRoughlyEquals(0.160, myClock.getRealTime(), tol);
    // because callback was late, we schedule the next one early
    assertRoughlyEquals(0.190, myTimer.getExpectedTime(), tol);

    // 6. advance time, callback is on time
    mockClock.setTimeoutDelay(0);
    mockClock.tick(30);
    assertRoughlyEquals(0.190, Util.getSystemTime(), tol);
    assertEquals(4, myMockClass.timesFired);
    assertRoughlyEquals(0.190, myClock.getTime(), tol);
    // callback was on time, we have a longer delay to get back to old schedule
    assertRoughlyEquals(0.250, myTimer.getExpectedTime(), tol);

    // 7. advance time
    mockClock.setTimeoutDelay(0);
    mockClock.tick(60);
    assertRoughlyEquals(0.250, Util.getSystemTime(), tol);
    assertEquals(5, myMockClass.timesFired);
    assertRoughlyEquals(0.250, myClock.getTime(), tol);
    assertRoughlyEquals(0.300, myTimer.getExpectedTime(), tol);

    // 8. advance time, callback is early
    mockClock.setTimeoutDelay(-10);
    mockClock.tick(40);
    assertRoughlyEquals(0.290, Util.getSystemTime(), tol);
    assertEquals(6, myMockClass.timesFired);
    assertRoughlyEquals(0.290, myClock.getTime(), tol);
    // finishAt doesn't care when callbacks are early... expects just on time
    assertRoughlyEquals(0.350, myTimer.getExpectedTime(), tol);

    // 9. advance time, callback is late
    mockClock.setTimeoutDelay(10);
    mockClock.tick(70);
    assertRoughlyEquals(0.360, Util.getSystemTime(), tol);
    assertEquals(7, myMockClass.timesFired);
    assertRoughlyEquals(0.360, myClock.getTime(), tol);
    assertRoughlyEquals(0.390, myTimer.getExpectedTime(), tol);

    // 10. advance time, callback stays late
    mockClock.tick(40);
    assertRoughlyEquals(0.400, Util.getSystemTime(), tol);
    assertEquals(8, myMockClass.timesFired);
    assertRoughlyEquals(0.400, myClock.getTime(), tol);
    assertRoughlyEquals(0.440, myTimer.getExpectedTime(), tol);

    // 11. advance time, callback stays late
    mockClock.tick(50);
    assertRoughlyEquals(0.450, Util.getSystemTime(), tol);
    assertEquals(9, myMockClass.timesFired);
    assertRoughlyEquals(0.450, myClock.getTime(), tol);
    assertRoughlyEquals(0.490, myTimer.getExpectedTime(), tol);

    // 12. advance time, callback slightly late
    mockClock.setTimeoutDelay(5);
    mockClock.tick(45);
    assertRoughlyEquals(0.495, Util.getSystemTime(), tol);
    assertEquals(10, myMockClass.timesFired);
    assertRoughlyEquals(0.495, myClock.getTime(), tol);
    assertRoughlyEquals(0.545, myTimer.getExpectedTime(), tol);

    // 13. advance time, callback early
    mockClock.setTimeoutDelay(-5);
    mockClock.tick(45);
    assertRoughlyEquals(0.540, Util.getSystemTime(), tol);
    assertEquals(11, myMockClass.timesFired);
    assertRoughlyEquals(0.540, myClock.getTime(), tol);
    assertRoughlyEquals(0.600, myTimer.getExpectedTime(), tol);

    // 14. advance time, callback late
    mockClock.setTimeoutDelay(10);
    mockClock.tick(70);
    assertRoughlyEquals(0.610, Util.getSystemTime(), tol);
    assertEquals(12, myMockClass.timesFired);
    assertRoughlyEquals(0.610, myClock.getTime(), tol);
    assertRoughlyEquals(0.640, myTimer.getExpectedTime(), tol);

    // 14. advance time, callback late
    mockClock.setTimeoutDelay(10);
    mockClock.tick(40);
    assertRoughlyEquals(0.650, Util.getSystemTime(), tol);
    assertEquals(13, myMockClass.timesFired);
    assertRoughlyEquals(0.650, myClock.getTime(), tol);
    assertRoughlyEquals(0.690, myTimer.getExpectedTime(), tol);

  } finally {
    mockClock.uninstall();
  }
};
goog.exportProperty(window, 'testTimerClock3', testTimerClock3);

/** Defines the callback function that the Timer executes
* @param {!myphysicslab.lab.util.Timer} timer
* @param {!myphysicslab.lab.util.Clock} clock
* @param {!goog.testing.MockClock} mockClock
* @constructor
* @final
* @struct
*/
myphysicslab.lab.util.test.TimerClock_test.MockClass4 = function(timer, clock,
      mockClock) {
  /**
  * @type {number}
  */
  this.timesFired = 0;
  /** amount of time that simTime increases by during callback, in millisecond
  * @type {number}
  */
  this.period_MS = 50;
  /** 'simulation time' which the callback is trying to match
  * @type {number}
  */
  this.simTime = 0;
  /**
  * @type {!myphysicslab.lab.util.Timer}
  */
  this.timer = timer;
  this.timer.setCallBack(goog.bind(this.myCallBack4, this));
  /**
  * @type {!myphysicslab.lab.util.Clock}
  */
  this.clock = clock;
  /**
  * @type {!goog.testing.MockClock}
  */
  this.mockClock = mockClock;
};

myphysicslab.lab.util.test.TimerClock_test.MockClass4.prototype.myCallBack4 = function() {
  var Util = myphysicslab.lab.util.Util;
  var now = Util.getSystemTime();
  var late = this.mockClock.getTimeoutDelay()/1000;
  var expect = this.timer.getExpectedTime();
  assertRoughlyEquals(now, expect+late, 1E-12);
  this.timesFired++;
  this.simTime += this.period_MS/1000;
  //console.log('myCallback4 clock='+this.clock.getTime()
  //   +' simTime='+this.simTime);
  // show that we keep up with simTime despite having callbacks happening late
  assertTrue(Math.abs(this.simTime - this.clock.getTime()) < 0.016);
  this.timer.fireAfter(this.period_MS/1000);
};

/*
stage   system     clock   delay   expect
1   initial
           0         0       0      NaN
2   startFiring()
    resume()
           0         0       0      0.050
3   tick(50)
           0.050     0.050   0      0.100
4   tick(50)
           0.100     0.100   0      0.150
5   setTimeoutDelay(10)
    tick(60)
           0.160     0.160   10     0.200
6   setTimeoutDelay(0)
    tick(40)
           0.200     0.200    0     0.250
7   tick(50)
           0.250     0.250    0     0.300
8   setTimeoutDelay(-10)
    tick(40)
           0.290     0.290    -10   0.340
9   setTimeoutDelay(10)
    tick(60)
           0.350     0.350    10    0.390
10  tick(50)
           0.400     0.400    10    0.440
11  tick(50)
           0.450     0.450    10    0.490
12  setTimeoutDelay(5)
    tick(45)
           0.495     0.495    5     0.540
13  setTimeoutDelay(-5)
    tick(40)
           0.535     0.535    -5    0.585
14  setTimeoutDelay(10)
    tick(60)
           0.595     0.595    10    0.635
15  tick(50)
           0.645     0.645    10    0.695
16  tick(50)
           0.695     0.695    10    0.735
*/
// tests the `Timer.fireAfter` method, when callback is early or late.
var testTimerClock4 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Timer = myphysicslab.lab.util.Timer;
  var Clock = myphysicslab.lab.util.Clock;
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    mockClock.install();

    var myTimer = new Timer();
    myTimer.setPeriod(0.050);  // only used during first firing
    var myClock = new Clock();
    var myMockClass = new myphysicslab.lab.util.test.TimerClock_test.MockClass4(myTimer,
        myClock, mockClock);
    var mockObsvr1 = new myphysicslab.lab.util.test.TimerClock_test.MockObserver1();
    // add the observer to the subject
    myClock.addObserver(mockObsvr1);

    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, mockObsvr1.numBooleans);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(0, mockObsvr1.numStrings);

    // Note how installing goog.testing.MockClock redefines goog.now()
    assertEquals(0, goog.now());
    assertRoughlyEquals(0, Util.getSystemTime(), tol);

    // 1. initial conditions
    assertEquals(0, myMockClass.timesFired);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());
    assertNaN(myTimer.getExpectedTime());
    assertFalse(myClock.isRunning());
    assertFalse(myTimer.isFiring());
    assertEquals(1, myClock.getTimeRate());
    assertEquals(0.050, myTimer.getPeriod());
    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, myMockClass.timesFired);

    // 2. start firing callback
    myTimer.startFiring();
    assertFalse(myClock.isRunning());
    assertTrue(myTimer.isFiring());
    myClock.resume();
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());
    assertRoughlyEquals(0.050, myTimer.getExpectedTime(), tol);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(0, myMockClass.timesFired);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());

    // 3. advance sysTime.  Our callback fires for the first time.
    mockClock.tick(50);
    assertEquals(50, goog.now());
    assertRoughlyEquals(0.050, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(1, myMockClass.timesFired);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
    // expect = old expect + period - late = 0.050 + 0.050 - 0.000
    assertRoughlyEquals(0.100, myTimer.getExpectedTime(), tol);
    assertTrue(myClock.isRunning());
    assertTrue(myTimer.isFiring());

    // 4. advance time
    mockClock.tick(50);
    assertEquals(100, goog.now());
    assertRoughlyEquals(0.100, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(2, myMockClass.timesFired);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    // expect = old expect + period - late = 0.100 + 0.050 - 0.000
    assertRoughlyEquals(0.150, myTimer.getExpectedTime(), tol);

    // 5. advance time, but have the callback happen late
    mockClock.setTimeoutDelay(10);
    mockClock.tick(60);
    assertEquals(160, goog.now());
    assertRoughlyEquals(0.160, Util.getSystemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(3, myMockClass.timesFired);
    assertRoughlyEquals(0.160, myClock.getTime(), tol);
    assertRoughlyEquals(0.160, myClock.getRealTime(), tol);
    // because callback was late, we schedule the next one early
    // expect = now + period - late = 0.160 + 0.050 - 0.010
    assertRoughlyEquals(0.200, myTimer.getExpectedTime(), tol);

    // 6. advance time, callback is on time
    mockClock.setTimeoutDelay(0);
    mockClock.tick(40);
    assertRoughlyEquals(0.200, Util.getSystemTime(), tol);
    assertEquals(4, myMockClass.timesFired);
    assertRoughlyEquals(0.200, myClock.getTime(), tol);
    // next expected is expected + period -- (different to testTimerClock3)
    // expect = now + period - late = 0.200 + 0.050 - 0.000
    assertRoughlyEquals(0.250, myTimer.getExpectedTime(), tol);

    // 7. advance time
    mockClock.setTimeoutDelay(0);
    mockClock.tick(50);
    assertRoughlyEquals(0.250, Util.getSystemTime(), tol);
    assertEquals(5, myMockClass.timesFired);
    assertRoughlyEquals(0.250, myClock.getTime(), tol);
    // expect = now + period - late = 0.240 + 0.050 - 0.000
    assertRoughlyEquals(0.300, myTimer.getExpectedTime(), tol);

    // 8. advance time, callback is early
    mockClock.setTimeoutDelay(-10);
    mockClock.tick(40);
    assertRoughlyEquals(0.290, Util.getSystemTime(), tol);
    assertEquals(6, myMockClass.timesFired);
    assertRoughlyEquals(0.290, myClock.getTime(), tol);
    // don't care when callbacks are early... regards early as on time
    // expect = now + period - late = 0.290 + 0.050 - 0.000
    assertRoughlyEquals(0.340, myTimer.getExpectedTime(), tol);

    // 9. advance time, callback is late
    mockClock.setTimeoutDelay(10);
    mockClock.tick(60);
    assertRoughlyEquals(0.350, Util.getSystemTime(), tol);
    assertEquals(7, myMockClass.timesFired);
    assertRoughlyEquals(0.350, myClock.getTime(), tol);
    // expect = now + period - late = 0.350 + 0.050 - 0.010
    assertRoughlyEquals(0.390, myTimer.getExpectedTime(), tol);

    // 10. advance time, callback stays late
    mockClock.tick(50);
    assertRoughlyEquals(0.400, Util.getSystemTime(), tol);
    assertEquals(8, myMockClass.timesFired);
    assertRoughlyEquals(0.400, myClock.getTime(), tol);
    // expect = now + period - late = 0.400 + 0.050 - 0.010
    assertRoughlyEquals(0.440, myTimer.getExpectedTime(), tol);

    // 11. advance time, callback stays late
    mockClock.tick(50);
    assertRoughlyEquals(0.450, Util.getSystemTime(), tol);
    assertEquals(9, myMockClass.timesFired);
    assertRoughlyEquals(0.450, myClock.getTime(), tol);
    // expect = now + period - late = 0.450 + 0.050 - 0.010
    assertRoughlyEquals(0.490, myTimer.getExpectedTime(), tol);

    // 12. advance time, callback slightly late
    mockClock.setTimeoutDelay(5);
    mockClock.tick(45);
    assertRoughlyEquals(0.495, Util.getSystemTime(), tol);
    assertEquals(10, myMockClass.timesFired);
    assertRoughlyEquals(0.495, myClock.getTime(), tol);
    // expect = now + period - late = 0.495 + 0.050 - 0.005
    assertRoughlyEquals(0.540, myTimer.getExpectedTime(), tol);

    // 13. advance time, callback early
    mockClock.setTimeoutDelay(-5);
    mockClock.tick(40);
    assertRoughlyEquals(0.535, Util.getSystemTime(), tol);
    assertEquals(11, myMockClass.timesFired);
    assertRoughlyEquals(0.535, myClock.getTime(), tol);
    // expect = now + period - late = 0.535 + 0.050 - 0.000
    assertRoughlyEquals(0.585, myTimer.getExpectedTime(), tol);

    // 14. advance time, callback late
    mockClock.setTimeoutDelay(10);
    mockClock.tick(60);
    assertRoughlyEquals(0.595, Util.getSystemTime(), tol);
    assertEquals(12, myMockClass.timesFired);
    assertRoughlyEquals(0.595, myClock.getTime(), tol);
    // expect = now + period - late = 0.595 + 0.050 - 0.010
    assertRoughlyEquals(0.635, myTimer.getExpectedTime(), tol);

    // 15. advance time, callback late
    mockClock.setTimeoutDelay(10);
    mockClock.tick(50);
    assertRoughlyEquals(0.645, Util.getSystemTime(), tol);
    assertEquals(13, myMockClass.timesFired);
    assertRoughlyEquals(0.645, myClock.getTime(), tol);
    // expect = now + period - late = 0.645 + 0.050 - 0.010
    assertRoughlyEquals(0.685, myTimer.getExpectedTime(), tol);

    // 16. advance time, callback late
    mockClock.setTimeoutDelay(10);
    mockClock.tick(50);
    assertRoughlyEquals(0.695, Util.getSystemTime(), tol);
    assertEquals(14, myMockClass.timesFired);
    assertRoughlyEquals(0.695, myClock.getTime(), tol);
    // expect = now + period - late = 0.695 + 0.050 - 0.010
    assertRoughlyEquals(0.735, myTimer.getExpectedTime(), tol);
  } finally {
    mockClock.uninstall();
  }
};
goog.exportProperty(window, 'testTimerClock4', testTimerClock4);
