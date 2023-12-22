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
import { SystemClock, Clock, ClockTask } from "../Clock.js";
import { ParameterNumber, ParameterBoolean, ParameterString, SubjectEvent,
     Observer, GenericEvent } from "../Observe.js";

const groupName = 'ClockTest.';

export default function scheduleTests() {
  schedule(testClock1);
  schedule(testClock2);
  schedule(testClock3);
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
function testClock1() {
  startTest(groupName+'testClock1');
  const tol = 1E-14;

  const mockClock = new MockClock();
  const myClock = new Clock('test_clock', mockClock);
  const mockObsvr1 = new MockObserver1();
  // add the observer to the subject
  myClock.addObserver(mockObsvr1);

  assertEquals(0, mockObsvr1.numEvents);
  assertEquals(0, mockObsvr1.numBooleans);
  assertEquals(0, mockObsvr1.numDoubles);
  assertEquals(0, mockObsvr1.numStrings);

  assertEquals(0, mockClock.systemTime());

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
  assertRoughlyEquals(0.049, mockClock.systemTime(), tol);
  assertEquals(1, mockObsvr1.numEvents);
  assertRoughlyEquals(0.049, myClock.getTime(), tol);
  assertRoughlyEquals(0.049, myClock.getRealTime(), tol);
  assertTrue(myClock.isRunning());

  // 4. advance one more tick and callback should fire
  mockClock.tick(1);
  assertRoughlyEquals(0.050, mockClock.systemTime(), tol);
  assertEquals(1, mockObsvr1.numEvents);
  assertRoughlyEquals(0.050, myClock.getTime(), tol);
  assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
  assertTrue(myClock.isRunning());

  // 5. advance time to just before when callback should fire, should be no change
  mockClock.tick(49);
  assertRoughlyEquals(0.099, mockClock.systemTime(), tol);
  assertEquals(1, mockObsvr1.numEvents);
  assertRoughlyEquals(0.099, myClock.getTime(), tol);
  assertRoughlyEquals(0.099, myClock.getRealTime(), tol);
  assertTrue(myClock.isRunning());

  // 6. advance one more tick and callback should fire
  mockClock.tick(1);
  assertRoughlyEquals(0.100, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.150, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.200, mockClock.systemTime(), tol);
  assertFalse(myClock.isRunning());
  assertEquals(2, mockObsvr1.numEvents);
  assertRoughlyEquals(0.100, myClock.getTime(), tol);
  assertRoughlyEquals(0.100, myClock.getRealTime(), tol);

  // 11. resume when not firing and paused.  -->  firing & not-paused mode.
  myClock.resume();
  assertRoughlyEquals(0.200, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.200, mockClock.systemTime(), tol);
  assertRoughlyEquals(0.100, myClock.getTime(), tol);
  assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
  */

  // 12b pause
  myClock.pause();
  assertEquals(2, mockObsvr1.numPauseEvents);
  assertEquals(2, mockObsvr1.numResumeEvents);
  assertEquals(4, mockObsvr1.numEvents);
  assertRoughlyEquals(0.200, mockClock.systemTime(), tol);
  assertRoughlyEquals(0.100, myClock.getTime(), tol);
  assertRoughlyEquals(0.100, myClock.getRealTime(), tol);

  // 13. not firing & paused mode.  Time doesn't advance and callbacks don't fire.
  mockClock.tick(50);  // no callback scheduled
  assertRoughlyEquals(0.250, mockClock.systemTime(), tol);
  assertRoughlyEquals(0.100, myClock.getTime(), tol);
  assertRoughlyEquals(0.100, myClock.getRealTime(), tol);
  assertFalse(myClock.isRunning());

  // 14. start when not firing and paused  -->  firing & paused mode.
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
  assertRoughlyEquals(0.300, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.300, mockClock.systemTime(), tol);
  assertRoughlyEquals(0.125, myClock.getTime(), tol);
  assertRoughlyEquals(0.150, myClock.getRealTime(), tol);

  // 18. change the delay and advance time
  mockClock.tick(50);   // fires callback, reschedules for sys:390
  assertRoughlyEquals(0.350, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.350, mockClock.systemTime(), tol);  // no change
  assertRoughlyEquals(0.215, myClock.getTime(), tol);  // step() changeded this
  assertRoughlyEquals(0.240, myClock.getRealTime(), tol); // realtime is 0.025 ahead
  assertFalse(myClock.isRunning());
  assertTrue(myClock.isStepping());
  myClock.clearStepMode();  // we've done what was needed for the step
  assertFalse(myClock.isStepping());

  // 20. pause mode.  Advance system time, and callback happens, but time
  // doesn't advance.
  mockClock.tick(40);  // fires callback, reschedules for sys:430, sim:255
  assertRoughlyEquals(0.390, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.390, mockClock.systemTime(), tol);
  assertRoughlyEquals(0.255, myClock.getTime(), tol);
  assertRoughlyEquals(0.280, myClock.getRealTime(), tol);
  assertFalse(myClock.isRunning());
  assertTrue(myClock.isStepping());
  myClock.clearStepMode();  // we've done what was needed for the step
  assertFalse(myClock.isStepping());

  // 22. advance the system clock, and the callback occurs
  mockClock.tick(40); // fires callback, reschedules for sys:470, sim:295
  assertRoughlyEquals(0.430, mockClock.systemTime(), tol);
  assertEquals(9, mockObsvr1.numEvents);
  assertRoughlyEquals(0.255, myClock.getTime(), tol);
  assertRoughlyEquals(0.280, myClock.getRealTime(), tol);
  assertFalse(myClock.isRunning());
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
function testClock2() {
  startTest(groupName+'testClock2');
  const tol = 1E-14;

  const mockClock = new MockClock();
  const myClock = new Clock('test_clock', mockClock);
  const mockObsvr1 = new MockObserver1();
  // add the observer to the subject
  myClock.addObserver(mockObsvr1);

  assertEquals(0, mockObsvr1.numEvents);
  assertEquals(0, mockObsvr1.numBooleans);
  assertEquals(0, mockObsvr1.numDoubles);
  assertEquals(0, mockObsvr1.numStrings);

  assertRoughlyEquals(0, mockClock.systemTime(), tol);

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
  assertRoughlyEquals(0.050, mockClock.systemTime(), tol);
  assertEquals(1, mockObsvr1.numEvents);
  assertRoughlyEquals(0.050, myClock.getTime(), tol);
  assertRoughlyEquals(0.050, myClock.getRealTime(), tol);
  assertTrue(myClock.isRunning());

  // 4. change so Clock goes at twice system time rate
  myClock.setTimeRate(2);
  assertEquals(2, myClock.getTimeRate());
  assertRoughlyEquals(0.050, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.100, mockClock.systemTime(), tol);
  assertEquals(2, mockObsvr1.numEvents);
  assertRoughlyEquals(0.150, myClock.getTime(), tol);
  assertRoughlyEquals(0.150, myClock.getRealTime(), tol);
  assertTrue(myClock.isRunning());

  // 6. advance sysTime
  mockClock.tick(50);
  assertRoughlyEquals(0.150, mockClock.systemTime(), tol);
  assertEquals(2, mockObsvr1.numEvents);
  assertRoughlyEquals(0.250, myClock.getTime(), tol);
  assertRoughlyEquals(0.250, myClock.getRealTime(), tol);
  assertTrue(myClock.isRunning());

  // 7. change so Clock goes at half system time rate
  myClock.setTimeRate(0.5);
  assertRoughlyEquals(0.5, myClock.getTimeRate(), tol);
  assertRoughlyEquals(0.150, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.200, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.250, mockClock.systemTime(), tol);
  assertEquals(4, mockObsvr1.numEvents);
  assertRoughlyEquals(0.275, myClock.getTime(), tol);
  assertRoughlyEquals(0.300, myClock.getRealTime(), tol);
  assertTrue(myClock.isRunning());

  // 11. advance sysTime
  mockClock.tick(50);
  assertRoughlyEquals(0.300, mockClock.systemTime(), tol);
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
  assertRoughlyEquals(0.350, mockClock.systemTime(), tol);
  assertRoughlyEquals(0.350, myClock.getTime(), tol);
  assertRoughlyEquals(0.375, myClock.getRealTime(), tol);
  assertTrue(myClock.isRunning());

  // 14. advance sysTime
  mockClock.tick(50);
  assertRoughlyEquals(0.400, mockClock.systemTime(), tol);
  assertEquals(5, mockObsvr1.numEvents);
  assertRoughlyEquals(0.400, myClock.getTime(), tol);
  assertRoughlyEquals(0.425, myClock.getRealTime(), tol);
  assertTrue(myClock.isRunning());
};

// test that ClockTasks are executed at proper times.
function testClock3() {
  startTest(groupName+'testClock3');
  const tol = 1E-3;

  const mockClock = new MockClock();
  const myClock = new Clock('test_clock', mockClock);
  let testVar = '';
  const myTask_0 = new ClockTask(0, () => testVar='0', mockClock);
  const myTask_A = new ClockTask(0.1, () => testVar='A', mockClock);
  const myTask_D = new ClockTask(0.15, null, mockClock);
  myTask_D.setCallback( () => { testVar='D'; myClock.removeTask(myTask_D)});
  const myTask_B = new ClockTask(0.2, () => testVar='B', mockClock);
  const myTask_C = new ClockTask(0.3, () => { testVar='C'; myClock.setTime(0) },
      mockClock);
  myClock.addTask(myTask_0);
  myClock.addTask(myTask_D);
  myClock.addTask(myTask_A);
  myClock.addTask(myTask_B);
  myClock.addTask(myTask_C);

  assertRoughlyEquals(0, mockClock.systemTime(), tol);

  assertEquals(0, myClock.getTime());
  assertFalse(myClock.isRunning());
  assertEquals(1, myClock.getTimeRate());
  myClock.resume();
  assertTrue(myClock.isRunning());
  assertEquals(0, myClock.getTime());
  assertEquals(0, myClock.getRealTime());

  // Observe tasks happening.
  mockClock.tick(50);
  assertRoughlyEquals(0.050, mockClock.systemTime(), tol);
  assertRoughlyEquals(0.050, myClock.getTime(), tol);
  assertTrue(myClock.isRunning());
  assertEquals('0', testVar);
  mockClock.tick(50);
  assertRoughlyEquals(0.100, myClock.getTime(), tol);
  assertEquals('A', testVar);
  mockClock.tick(50);
  assertRoughlyEquals(0.150, myClock.getTime(), tol);
  // myTask_D should have executed, and removed itself.
  // It should not happen again later in this test.
  assertEquals('D', testVar);
  mockClock.tick(50);
  assertRoughlyEquals(0.200, myClock.getTime(), tol);
  assertEquals('B', testVar);
  // this next tick triggers myTask_C which sets clock to time zero, but then
  // goes 50 ticks past zero.
  mockClock.tick(150);
  assertRoughlyEquals(0.050, myClock.getTime(), tol);
  assertEquals('0', testVar);

  // Set to time zero should trigger myTask_0
  myClock.setTime(0);
  assertRoughlyEquals(0.00, myClock.getTime(), tol);
  assertEquals('0', testVar);
  // Remove myTask_A, confirm it has no effect.
  myClock.removeTask(myTask_A);
  mockClock.tick(100);
  assertRoughlyEquals(0.100, myClock.getTime(), tol);
  assertEquals('0', testVar);
  mockClock.tick(50);
  assertRoughlyEquals(0.150, myClock.getTime(), tol);
  // if myTask_D was not removed this would now be 'D'
  assertEquals('0', testVar);
  mockClock.tick(50);
  assertRoughlyEquals(0.200, myClock.getTime(), tol);
  assertEquals('B', testVar);
  mockClock.tick(100);
  assertRoughlyEquals(0, myClock.getTime(), tol);
  assertEquals('0', testVar);
  // add back myTask_A
  myClock.addTask(myTask_A);

  // Faster time rate
  myClock.setTimeRate(2);
  myClock.setTime(0);
  assertRoughlyEquals(0.00, myClock.getTime(), tol);
  assertEquals('0', testVar);
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
  assertEquals('0', testVar);

  // Slower time rate
  myClock.setTimeRate(0.5);
  myClock.setTime(0);
  assertRoughlyEquals(0.00, myClock.getTime(), tol);
  assertEquals('0', testVar);
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
  assertEquals('0', testVar);
};

/**  Observer that counts number of times that parameters are changed or
*    events fire.
*/
class MockObserver1 implements Observer {
    numEvents: number = 0;
    numStartEvents: number = 0;
    numStopEvents: number = 0;
    numPauseEvents: number = 0;
    numResumeEvents: number = 0;
    numStepEvents: number = 0;
    numSetTimeEvents: number = 0;
    numBooleans: number = 0;
    numDoubles: number = 0;
    numStrings: number = 0;
  constructor() {
  };

  observe(event: SubjectEvent): void {
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
}; // end MockObserver1 class
