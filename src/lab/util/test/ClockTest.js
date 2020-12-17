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

goog.module('myphysicslab.lab.util.test.ClockTest');

goog.require('goog.array');
goog.require('goog.testing.MockClock');
const Util = goog.require('myphysicslab.lab.util.Util');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const Clock = goog.require('myphysicslab.lab.util.Clock');
const ClockTask = goog.require('myphysicslab.lab.util.ClockTask');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = TestRig.assertEquals;
const assertRoughlyEquals = TestRig.assertRoughlyEquals;
const assertTrue = TestRig.assertTrue;
const assertFalse = TestRig.assertFalse;
const assertThrows = TestRig.assertThrows;
const schedule = TestRig.schedule;
const startTest = TestRig.startTest;


/**  Observer that counts number of times that parameters are changed or
*    events fire.
* @implements {Observer}
*/
class MockObserver1 {
  constructor() {
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

  observe(event) {
    if (event instanceof GenericEvent) {
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
        throw 'unknown event '+event.getName();
      }
    } else if (event instanceof ParameterBoolean) {
      this.numBooleans++;
      this.numEvents++;
    } else if (event instanceof ParameterNumber) {
      this.numDoubles++;
      this.numEvents++;
    } else if (event instanceof ParameterString) {
      this.numStrings++;
      this.numEvents++;
    }
  };

  toStringShort() {
    return 'MockObserver1';
  };
} // end class

class ClockTest {

static test() {
  schedule(ClockTest.testClock1);
  schedule(ClockTest.testClock2);
  schedule(ClockTest.testClock3);
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
static testClock1() {
  startTest(ClockTest.groupName+'testClock1');
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();

    var myClock = new Clock();
    var mockObsvr1 = new MockObserver1();
    // add the observer to the subject
    myClock.addObserver(mockObsvr1);

    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, mockObsvr1.numBooleans);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(0, mockObsvr1.numStrings);

    // Note that installing goog.testing.MockClock redefines goog.now()
    assertEquals(0, goog.now());
    assertRoughlyEquals(0, Util.systemTime(), tol);

    // 1. initial conditions
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());
    assertFalse(myClock.isRunning());
    assertEquals(1, myClock.getTimeRate());
    assertEquals(0, mockObsvr1.numEvents);

    // 2. start callback firing and resume the Clock, but don't advance time
    //assertFalse(myClock.isRunning());
    myClock.resume();
    assertTrue(myClock.isRunning());
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());

    // 3. advance time to just before when callback should fire, should be no change
    mockClock.tick(49);
    assertEquals(49, goog.now());
    assertRoughlyEquals(0.049, Util.systemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertRoughlyEquals(0.049, myClock.getTime(), tol);
    assertRoughlyEquals(0.049, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 4. advance one more tick and callback should fire
    mockClock.tick(1);
    assertEquals(50, goog.now());
    assertRoughlyEquals(0.050, Util.systemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 5. advance time to just before when callback should fire, should be no change
    mockClock.tick(49);
    assertEquals(99, goog.now());
    assertRoughlyEquals(0.099, Util.systemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertRoughlyEquals(0.099, myClock.getTime(), tol);
    assertRoughlyEquals(0.099, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 6. advance one more tick and callback should fire
    mockClock.tick(1);
    assertEquals(100, goog.now());
    assertRoughlyEquals(0.100, Util.systemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 7. pause.
    myClock.pause();
    assertEquals(2, mockObsvr1.numEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(1, mockObsvr1.numPauseEvents);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertFalse(myClock.isRunning());

    // 8. pause mode.  callback should fire, but time doesn't advance
    mockClock.tick(50);
    assertFalse(myClock.isRunning());
    assertEquals(150, goog.now());
    assertRoughlyEquals(0.150, Util.systemTime(), tol);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);

    // 9. stop firing when paused (no pause event happens)
    //assertFalse(myClock.isRunning());
    assertEquals(1, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(2, mockObsvr1.numEvents);
    //assertRoughlyEquals(0.100, myClock.getTime(), tol);
    //assertRoughlyEquals(0.100, myClock.getRealTime(), tol);

    // 10. not firing & paused mode.  Time doesn't advance and callbacks don't fire.
    mockClock.tick(50);  // no callback scheduled
    assertEquals(200, goog.now());
    assertRoughlyEquals(0.200, Util.systemTime(), tol);
    assertFalse(myClock.isRunning());
    assertEquals(2, mockObsvr1.numEvents);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);

    // 11. resume when not firing and paused.  -->  firing & not-paused mode.
    myClock.resume();
    assertRoughlyEquals(0.200, Util.systemTime(), tol);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertEquals(1, mockObsvr1.numPauseEvents);
    assertEquals(2, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(3, mockObsvr1.numEvents);
    assertTrue(myClock.isRunning());

    // 12. immediately stop callback before any time passes
    /*assertEquals(1, mockObsvr1.numPauseEvents);
    assertEquals(2, mockObsvr1.numResumeEvents);
    assertEquals(3, mockObsvr1.numEvents);
    assertRoughlyEquals(0.200, Util.systemTime(), tol);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    */

    // 12b pause
    myClock.pause();
    assertEquals(2, mockObsvr1.numPauseEvents);
    assertEquals(2, mockObsvr1.numResumeEvents);
    assertEquals(4, mockObsvr1.numEvents);
    assertRoughlyEquals(0.200, Util.systemTime(), tol);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);

    // 13. not firing & paused mode.  Time doesn't advance and callbacks don't fire.
    mockClock.tick(50);  // no callback scheduled
    assertEquals(250, goog.now());
    assertRoughlyEquals(0.250, Util.systemTime(), tol);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertFalse(myClock.isRunning());

    // 14. start when not firing and paused  -->  firing & paused mode.
    //assertEquals(250, goog.now());
    //assertRoughlyEquals(0.250, Util.systemTime(), tol);
    assertEquals(2, mockObsvr1.numPauseEvents);
    assertEquals(2, mockObsvr1.numResumeEvents);
    assertEquals(4, mockObsvr1.numEvents);
    //assertRoughlyEquals(0.100, myClock.getTime(), tol);
    //assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    //assertFalse(myClock.isRunning());

    // 15. resume the clock
    myClock.resume();
    assertEquals(2, mockObsvr1.numPauseEvents);
    assertEquals(3, mockObsvr1.numResumeEvents);
    assertEquals(5, mockObsvr1.numEvents);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 16. firing & not-paused mode.  Time advances and callbacks fire.
    mockClock.tick(50);  // fires callback, reschedules for sys:0.350
    assertEquals(300, goog.now());
    assertRoughlyEquals(0.300, Util.systemTime(), tol);
    assertRoughlyEquals(0.150, myClock.getTime(), tol);
    assertRoughlyEquals(0.150, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 17. retard the Clock time, so it is 0.025 behind real time
    myClock.setTime(0.125);
    assertEquals(2, mockObsvr1.numPauseEvents);
    assertEquals(3, mockObsvr1.numResumeEvents);
    assertEquals(1, mockObsvr1.numSetTimeEvents);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(6, mockObsvr1.numEvents);
    assertRoughlyEquals(0.300, Util.systemTime(), tol);
    assertRoughlyEquals(0.125, myClock.getTime(), tol);
    assertRoughlyEquals(0.150, myClock.getRealTime(), tol);

    // 18. change the delay and advance time
    mockClock.tick(50);   // fires callback, reschedules for sys:390
    assertEquals(350, goog.now());
    assertRoughlyEquals(0.350, Util.systemTime(), tol);
    assertEquals(6, mockObsvr1.numEvents);
    assertRoughlyEquals(0.175, myClock.getTime(), tol);
    assertRoughlyEquals(0.200, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

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
    assertRoughlyEquals(0.350, Util.systemTime(), tol);  // no change
    assertRoughlyEquals(0.215, myClock.getTime(), tol);  // step() changeded this
    assertRoughlyEquals(0.240, myClock.getRealTime(), tol); // realtime is 0.025 ahead
    assertFalse(myClock.isRunning());
    assertTrue(myClock.isStepping());
    myClock.clearStepMode();  // we've done what was needed for the step
    assertFalse(myClock.isStepping());

    // 20. pause mode.  Advance system time, and callback happens, but time doesn't advance.
    mockClock.tick(40);  // fires callback, reschedules for sys:430, sim:255
    assertEquals(390, goog.now());
    assertRoughlyEquals(0.390, Util.systemTime(), tol);
    assertEquals(8, mockObsvr1.numEvents);  // pause and step events happened
    assertRoughlyEquals(0.215, myClock.getTime(), tol);
    assertRoughlyEquals(0.240, myClock.getRealTime(), tol);
    assertFalse(myClock.isRunning());

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
    assertRoughlyEquals(0.390, Util.systemTime(), tol);
    assertRoughlyEquals(0.255, myClock.getTime(), tol);
    assertRoughlyEquals(0.280, myClock.getRealTime(), tol);
    assertFalse(myClock.isRunning());
    assertTrue(myClock.isStepping());
    myClock.clearStepMode();  // we've done what was needed for the step
    assertFalse(myClock.isStepping());

    // 22. advance the system clock, and the callback occurs
    mockClock.tick(40); // fires callback, reschedules for sys:470, sim:295
    assertEquals(430, goog.now());
    assertRoughlyEquals(0.430, Util.systemTime(), tol);
    assertEquals(9, mockObsvr1.numEvents);
    assertRoughlyEquals(0.255, myClock.getTime(), tol);
    assertRoughlyEquals(0.280, myClock.getRealTime(), tol);
    assertFalse(myClock.isRunning());

  } finally {
    Util.MOCK_CLOCK = true;
    mockClock.uninstall();
  }
};

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
// tests changing time rateClock
static testClock2() {
  startTest(ClockTest.groupName+'testClock2');
  var tol = 1E-14;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();

    var myClock = new Clock();
    var mockObsvr1 = new MockObserver1();
    // add the observer to the subject
    myClock.addObserver(mockObsvr1);

    assertEquals(0, mockObsvr1.numEvents);
    assertEquals(0, mockObsvr1.numBooleans);
    assertEquals(0, mockObsvr1.numDoubles);
    assertEquals(0, mockObsvr1.numStrings);

    // Note how installing goog.testing.MockClock redefines goog.now()
    assertEquals(0, goog.now());
    assertRoughlyEquals(0, Util.systemTime(), tol);

    // 1. initial conditions
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());
    assertFalse(myClock.isRunning());
    assertEquals(1, myClock.getTimeRate());
    assertEquals(0, mockObsvr1.numEvents);

    // 2. start
    //assertFalse(myClock.isRunning());
    myClock.resume();
    assertTrue(myClock.isRunning());
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(1, mockObsvr1.numEvents);
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());

    // 3. advance sysTime
    mockClock.tick(50);
    assertEquals(50, goog.now());
    assertRoughlyEquals(0.050, Util.systemTime(), tol);
    assertEquals(1, mockObsvr1.numEvents);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 4. change so Clock goes at twice system time rate
    myClock.setTimeRate(2);
    assertEquals(2, myClock.getTimeRate());
    assertEquals(50, goog.now());
    assertRoughlyEquals(0.050, Util.systemTime(), tol);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(1, mockObsvr1.numDoubles);
    assertEquals(2, mockObsvr1.numEvents);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 5. advance sysTime
    mockClock.tick(50);
    assertEquals(100, goog.now());
    assertRoughlyEquals(0.100, Util.systemTime(), tol);
    assertEquals(2, mockObsvr1.numEvents);
    assertRoughlyEquals(0.150, myClock.getTime(), tol);
    assertRoughlyEquals(0.150, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 6. advance sysTime
    mockClock.tick(50);
    assertEquals(150, goog.now());
    assertRoughlyEquals(0.150, Util.systemTime(), tol);
    assertEquals(2, mockObsvr1.numEvents);
    assertRoughlyEquals(0.250, myClock.getTime(), tol);
    assertRoughlyEquals(0.250, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 7. change so Clock goes at half system time rate
    myClock.setTimeRate(0.5);
    assertRoughlyEquals(0.5, myClock.getTimeRate(), tol);
    assertEquals(150, goog.now());
    assertRoughlyEquals(0.150, Util.systemTime(), tol);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(0, mockObsvr1.numSetTimeEvents);
    assertEquals(2, mockObsvr1.numDoubles);
    assertEquals(3, mockObsvr1.numEvents);
    assertRoughlyEquals(0.250, myClock.getTime(), tol);
    assertRoughlyEquals(0.250, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 8. advance sysTime
    mockClock.tick(50);
    assertEquals(200, goog.now());
    assertRoughlyEquals(0.200, Util.systemTime(), tol);
    assertEquals(3, mockObsvr1.numEvents);
    assertRoughlyEquals(0.275, myClock.getTime(), tol);
    assertRoughlyEquals(0.275, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 9. retard the Clock
    myClock.setTime(0.250);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(1, mockObsvr1.numSetTimeEvents);
    assertEquals(2, mockObsvr1.numDoubles);
    assertEquals(4, mockObsvr1.numEvents);
    assertRoughlyEquals(0.250, myClock.getTime(), tol);
    assertRoughlyEquals(0.275, myClock.getRealTime(), tol);

    // 10. advance sysTime
    mockClock.tick(50);
    assertEquals(250, goog.now());
    assertRoughlyEquals(0.250, Util.systemTime(), tol);
    assertEquals(4, mockObsvr1.numEvents);
    assertRoughlyEquals(0.275, myClock.getTime(), tol);
    assertRoughlyEquals(0.300, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 11. advance sysTime
    mockClock.tick(50);
    assertEquals(300, goog.now());
    assertRoughlyEquals(0.300, Util.systemTime(), tol);
    assertEquals(4, mockObsvr1.numEvents);
    assertRoughlyEquals(0.300, myClock.getTime(), tol);
    assertRoughlyEquals(0.325, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 12. change so Clock goes at same as system time rate
    myClock.setTimeRate(1.0);
    assertEquals(0, mockObsvr1.numPauseEvents);
    assertEquals(1, mockObsvr1.numResumeEvents);
    assertEquals(0, mockObsvr1.numStepEvents);
    assertEquals(1, mockObsvr1.numSetTimeEvents);
    assertEquals(3, mockObsvr1.numDoubles);
    assertEquals(5, mockObsvr1.numEvents);
    assertRoughlyEquals(1.0, myClock.getTimeRate(), tol);

    // 13. advance sysTime
    mockClock.tick(50);
    assertEquals(350, goog.now());
    assertRoughlyEquals(0.350, Util.systemTime(), tol);
    assertRoughlyEquals(0.350, myClock.getTime(), tol);
    assertRoughlyEquals(0.375, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

    // 14. advance sysTime
    mockClock.tick(50);
    assertEquals(400, goog.now());
    assertRoughlyEquals(0.400, Util.systemTime(), tol);
    assertEquals(5, mockObsvr1.numEvents);
    assertRoughlyEquals(0.400, myClock.getTime(), tol);
    assertRoughlyEquals(0.425, myClock.getRealTime(), tol);
    assertTrue(myClock.isRunning());

  } finally {
    mockClock.uninstall();
    Util.MOCK_CLOCK = false;
  }
};

// test that ClockTasks are executed at proper times.
static testClock3() {
  startTest(ClockTest.groupName+'testClock3');
  var tol = 1E-3;

  var mockClock = new goog.testing.MockClock();
  try {
    Util.MOCK_CLOCK = true;
    mockClock.install();

    var myClock = new Clock();
    var testVar = '';
    var myTask_0 = new ClockTask(0, function() { testVar=''; });
    var myTask_A = new ClockTask(0.1, function() { testVar='A'; });
    var myTask_B = new ClockTask(0.2, function() { testVar='B'; });
    var myTask_C = new ClockTask(0.3, function() { testVar='C'; myClock.setTime(0); });
    myClock.addTask(myTask_0);
    myClock.addTask(myTask_A);
    myClock.addTask(myTask_B);
    myClock.addTask(myTask_C);

    // Note how installing goog.testing.MockClock redefines goog.now()
    assertEquals(0, goog.now());
    assertRoughlyEquals(0, Util.systemTime(), tol);

    assertEquals(0, myClock.getTime());
    assertFalse(myClock.isRunning());
    assertEquals(1, myClock.getTimeRate());
    myClock.resume();
    assertTrue(myClock.isRunning());
    assertEquals(0, myClock.getTime());
    assertEquals(0, myClock.getRealTime());

    // Observe tasks happening.
    mockClock.tick(50);
    assertEquals(50, goog.now());
    assertRoughlyEquals(0.050, Util.systemTime(), tol);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertTrue(myClock.isRunning());
    assertEquals('', testVar);
    mockClock.tick(50);
    assertEquals(100, goog.now());
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertEquals('A', testVar);
    mockClock.tick(50);
    assertRoughlyEquals(0.150, myClock.getTime(), tol);
    assertEquals('A', testVar);
    mockClock.tick(50);
    assertRoughlyEquals(0.200, myClock.getTime(), tol);
    assertEquals('B', testVar);
    // this next tick triggers myTask_C which sets clock to time zero, but then
    // goes 50 ticks past zero.
    mockClock.tick(150);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertEquals('', testVar);

    // Set to time zero should trigger myTask_0
    myClock.setTime(0);
    assertRoughlyEquals(0.00, myClock.getTime(), tol);
    assertEquals('', testVar);
    // Remove myTask_A, confirm it has no effect.
    myClock.removeTask(myTask_A);
    mockClock.tick(100);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertEquals('', testVar);
    mockClock.tick(50);
    assertRoughlyEquals(0.150, myClock.getTime(), tol);
    assertEquals('', testVar);
    mockClock.tick(50);
    assertRoughlyEquals(0.200, myClock.getTime(), tol);
    assertEquals('B', testVar);
    mockClock.tick(100);
    assertRoughlyEquals(0, myClock.getTime(), tol);
    assertEquals('', testVar);
    // add back myTask_A
    myClock.addTask(myTask_A);

    // Faster time rate
    myClock.setTimeRate(2);
    myClock.setTime(0);
    assertRoughlyEquals(0.00, myClock.getTime(), tol);
    assertEquals('', testVar);
    mockClock.tick(50);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertEquals('A', testVar);
    mockClock.tick(25);
    assertRoughlyEquals(0.150, myClock.getTime(), tol);
    assertEquals('A', testVar);
    mockClock.tick(25);
    assertRoughlyEquals(0.200, myClock.getTime(), tol);
    assertEquals('B', testVar);
    // this next tick triggers myTask_C which sets clock to time zero, but then
    // goes 25 ticks past zero.
    mockClock.tick(75);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertEquals('', testVar);

    // Slower time rate
    myClock.setTimeRate(0.5);
    myClock.setTime(0);
    assertRoughlyEquals(0.00, myClock.getTime(), tol);
    assertEquals('', testVar);
    mockClock.tick(200);
    assertRoughlyEquals(0.100, myClock.getTime(), tol);
    assertEquals('A', testVar);
    mockClock.tick(100);
    assertRoughlyEquals(0.150, myClock.getTime(), tol);
    assertEquals('A', testVar);
    mockClock.tick(100);
    assertRoughlyEquals(0.200, myClock.getTime(), tol);
    assertEquals('B', testVar);
    // this next tick triggers myTask_C which sets clock to time zero, but then
    // goes 25 ticks past zero.
    mockClock.tick(300);
    assertRoughlyEquals(0.050, myClock.getTime(), tol);
    assertEquals('', testVar);
  } finally {
    mockClock.uninstall();
    Util.MOCK_CLOCK = false;
  }
};

} // end class

/**
* @type {string}
* @const
*/
ClockTest.groupName = 'ClockTest.';

exports = ClockTest;
