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

import { Util } from "./Util.js";
import { AbstractSubject } from "./AbstractSubject.js";
import { GenericEvent, ParameterNumber, Subject } from "./Observe.js";

// *************************** SystemClock **************************

/** Defines interface for a system clock. This enables us to instead use
* a {@link test/MockClock.MockClock} for testing.
*/
export interface SystemClock {
  /** Returns the current time as given by the system clock, in seconds.
  * @return the current time as given by the system clock, in seconds
  */
  systemTime(): number;

  /** cancels a pending scheduled callback.
  @param timeoutID the ID of the scheduled callback
  */
  cancelCallback(timeoutID: number): void;

  /** schedules a callback to be executed in the future.
  @param callback the function to be called
  @param delay_ms number of milliseconds to wait before executing the callback
  @return the ID of the callback
  */
  scheduleCallback(callback: ()=>void, delay_ms: number): number;

  /** requests that the callback be executed before the next repaint.
  @param callback the function to be called
  @return the request ID
  */
  requestAnimFrame(callback: ()=>void): number;

  /** cancels a request made with {@link requestAnimFrame}.
  @param requestID the request ID
  */
  cancelAnimFrame(requestID: number): void;
};

// *************************** StdSystemClock **************************

/** The SystemClock that gives real time and schedules callbacks.  As opposed to the
{@link test/MockClock.MockClock} that is used for testing.
*/
export class StdSystemClock implements SystemClock {
  constructor() {};

  /** @inheritDoc */
  systemTime(): number {
    return Util.systemTime();
  };

  /** @inheritDoc */
  cancelCallback(timeoutID: number): void {
    clearTimeout(timeoutID);
  };

  /** @inheritDoc */
  scheduleCallback(callback: ()=>void, delay_ms: number): number {
    return setTimeout(callback, delay_ms);
  };

  /** @inheritDoc */
  requestAnimFrame(callback: ()=>void) {
    return requestAnimationFrame(callback);
  };

  /** @inheritDoc */
  cancelAnimFrame(requestID: number): void {
    cancelAnimationFrame(requestID);
  }

};

// *************************** Clock **************************

/** Advances along with real time when active, and can execute tasks at appointed
times. There are commands to pause, resume, and single-step the Clock, as well as set
its time and speed relative to system time. Clock has a list of
{@link ClockTask}s which it causes to be executed at the times
specified by the ClockTasks. Clock has a parallel *real time clock* for measuring
performance.

Clock time is used by a **client** object such as
{@link lab/app/SimRunner.SimRunner | SimRunner}
to know *how much to advance a simulation*.
This is how
operations on Clock like pause, single-step, setting time rate, etc. affect the display
of the Simulation. (When clock time is in the past, such as at time zero, then the
client can restart the simulation from initial conditions.)

While a *unit of simulation time* can be interpreted to mean anything from
a millisecond to a millenium, we use the Clock to advance the Simulation time along
with real time as though each unit of time is equal to one second of real time.

<a id="typesoftime"></a>
## Types of Time

There are several types of time considered here: system time, clock time, simulation
time, and real time. All of these are measured in seconds, though simulation time might
have a different meaning – see
[About Units Of Measurement](../Architecture.html#aboutunitsofmeasurement).

+ **System Time** is given by {@link SystemClock.systemTime}.
System time is the basis of
the other time measurements. For example, clock time and real time each have a "system
start time" by which they are measured. System time is always running.

<a id="clocktime"></a>
+ **Clock Time** is given by {@link getTime}.
Clock time advances at the current {@link Clock#getTimeRate time rate}
(multiple of system
time). Clock time can be modified directly by calling {@link setTime}. Clock time can
be {@link Clock#pause paused} or {@link Clock#resume resumed}.

+ **Simulation Time** is given by
{@link lab/model/Simulation.Simulation.getTime | Simulation.getTime}.
Simulation time is advanced by the client, usually to keep up with clock time. When
performance problems occur, the clock time can be retarded via {@link setTime} to
match the current simulation time.

<a id="md:realtime"></a>
+ **Real Time** is given by {@link getRealTime}. Closely related to clock time,
real time is used to measure performance: how much the simulation time
has slipped behind real time because the simulation couldn't compute
quickly enough. Real time usually mirrors clock time – they are paused or resumed
together and have the same time rate relative to system time – but real time is not
affected by {@link setTime}. When performance problems happen the usual result is
that clock time is retarded to match simulation time by setting clock time to an
earlier value. In this case, real time is unaffected and will be ahead of clock time by
the amount of time lost to performance problems.


## ClockTask

A {@link ClockTask} contains a function which is to be executed at a particular time.
The time is expressed in *clock time*.

ClockTasks are scheduled as a side effect of Clock methods such as
`setTime()`, `resume()`, `addTask()`. ClockTasks are cancelled as a side
effect of Clock methods such as `pause()`, `removeTask()`.

A typical use of ClockTask is to restart the simulation after a few seconds, which
makes the simulation repeatedly "loop" showing it's first few seconds.


## Step Mode

The {@link step} method puts the Clock into a special *step mode*. Clients should
check for this step mode by calling {@link isStepping}. Step mode being `true`
means that *clock time has advanced even though the clock is paused*. The client should
update the simulation to match the new clock time, and then call
{@link clearStepMode} to indicate that it has advanced the simulation.


Parameters Created
------------------

+ ParameterNumber named `TIME_RATE`, see {@link setTimeRate}


Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `CLOCK_PAUSE`, see {@link pause}

+ GenericEvent named `CLOCK_RESUME`, see {@link resume}

+ GenericEvent named `CLOCK_STEP`, see {@link step}

+ GenericEvent named `CLOCK_SET_TIME`, see {@link setTime}


**TO DO** Should be able to have clock time (and therefore simulation time) start at
something other than zero.
*/
export class Clock extends AbstractSubject implements Subject {
  private sysClock_: SystemClock;
  /** when 'zero clock time' occurs, in system time, in seconds */
  private clockStart_sys_secs_: number;
  /** when 'zero real time' occurs, in system time, in seconds */
  private realStart_sys_secs_: number;
  /** rate at which clock time advances compared to system time */
  private timeRate_: number = 1.0;
  /** remembers clock time while clock is stopped, in seconds  */
  private saveTime_secs_: number = 0;
  /** remembers the real time while clock is stopped, in seconds */
  private saveRealTime_secs_: number = 0;
  /** whether clock time is advancing */
  private isRunning_: boolean = false;
  /** means we are currently in single-step mode: clock time has advanced even
  * though clock is paused.
  */
  private stepMode_: boolean = false;
  /** array of ClockTasks to execute at their appointed times */
  private tasks_: ClockTask[] = [];
  private readonly clockDebug_: boolean = false;

/**
* @param opt_name name of this Clock (optional)
* @param opt_sysClock a SystemClock to use for this Clock (optional)
*/
constructor(opt_name?: string, opt_sysClock?: SystemClock) {
  super(opt_name || 'CLOCK');
  this.sysClock_ = opt_sysClock || new StdSystemClock();
  this.clockStart_sys_secs_ = this.sysClock_.systemTime();
  this.realStart_sys_secs_ = this.clockStart_sys_secs_;
  this.addParameter(new ParameterNumber(this, Clock.en.TIME_RATE,
      Clock.i18n.TIME_RATE,
      () => this.getTimeRate(),
      a => this.setTimeRate(a)));
};

/** @inheritDoc */
override toString(): string {
  return this.toStringShort().slice(0, -1)
      +', timeRate_: '+Util.NF5(this.timeRate_)
      +', saveTime_secs_: '+Util.NF5(this.saveTime_secs_)
      +', saveRealTime_secs_: '+Util.NF5(this.saveRealTime_secs_)
      +', isRunning_: '+this.isRunning_
      +', stepMode_: '+this.stepMode_
      +', clockStart_sys_secs_: '+Util.NF5(this.clockStart_sys_secs_)
      +', realStart_sys_secs_: '+Util.NF5(this.realStart_sys_secs_)
      +', tasks_: ['+this.tasks_+']'
      + super.toString();
};

/** @inheritDoc */
override toStringShort() {
  return super.toStringShort().slice(0, -1)
      +', time: '+Util.NF5(this.getTime())+'}';
};

/** @inheritDoc */
getClassName() {
  return 'Clock';
};

/** Adds a ClockTask to the list of tasks which will be run, and schedules it to be run
if its time is now or in the future. The time to run the task is specified in the
ClockTask.
@param task the ClockTask to add to list of tasks to be run
*/
addTask(task: ClockTask): void {
  if (!this.tasks_.includes(task)) {
    this.tasks_.push(task);
    this.scheduleTask(task);
  }
};

private cancelAllTasks(): void {
  this.tasks_.forEach(task =>  task.cancel());
};

/** Called during [step mode](#md:step-mode), this indicates that the client has
advanced the Simulation to match the clock time.
*/
clearStepMode(): void {
  this.stepMode_ = false;
};

/** Converts clock time to system time. System time is defined by
{@link SystemClock.systemTime}.
@param clockTime in seconds
@return system time equivalent of clockTime
*/
clockToSystem(clockTime: number): number {
  return clockTime/this.timeRate_ + this.clockStart_sys_secs_;
};

/** Schedules tasks for immediate execution that are in the given range of time from
`startTime` to `startTime + timeStep`.
@param startTime
@param timeStep
*/
private executeTasks(startTime: number, timeStep: number): void {
  // A task can delete itself from the list of tasks via removeTask.
  // That would normally be a problem, but here the task.schedule(0) ensures
  // that the task is executed later after this function has completed.
  this.tasks_.forEach(task => {
    if (task.getTime() >= startTime && task.getTime() <= startTime + timeStep) {
      task.schedule(0);
    }
  });
};

/** Returns the [real time](#md:realtime) in seconds which is in the same time scale as
the clock time; used for checking simulation performance. Like clock time, real time
starts at zero time; is paused when the Clock is paused; and runs at the same rate as
clock time.

When a simulation cannot keep up with real time the Clock is **retarded** by client
code calling {@link setTime} to set clock time to an earlier time. In contrast, the
real time is unaffected by `setTime`; therefore the difference between real time
and clock time tells us how far behind real time the simulation is.

When the simulation is reset, the clock is typically set to time zero. In that case
the real time should be set to match clock time by using {@link setRealTime}.
@return current real time in seconds
*/
getRealTime(): number {
  if (this.isRunning_) {
    return (this.sysClock_.systemTime() - this.realStart_sys_secs_)*this.timeRate_;
  } else {
    return this.saveRealTime_secs_;
  }
};

/** Returns array of ClockTasks that are scheduled to run.
@return array of ClockTasks that are scheduled to run
*/
getTasks(): ClockTask[] {
  return Array.from(this.tasks_);
};

/** Returns the [clock time](#clocktime) in seconds. When the Clock
{@link Clock.isRunning | is running}, the clock time advances along with system time at
whatever {@link Clock.getTimeRate | time rate} is specified.
@return the clock time in seconds
*/
getTime(): number {
  if (this.isRunning_) {
    return (this.sysClock_.systemTime() - this.clockStart_sys_secs_)*this.timeRate_;
  } else {
    return this.saveTime_secs_;
  }
};

/** Returns the rate at which clock time passes compared to system time; a value of 2
makes clock time pass twice as fast as system time; a value of 0.5 makes clock time pass
half as fast as system time.
@return the rate at which clock time passes compared to system time
*/
getTimeRate(): number {
  return this.timeRate_;
};

/** Whether the clock time and real time are advancing.
@return `true` when clock time and real time are advancing
*/
isRunning(): boolean {
  return this.isRunning_;
};

/** Returns `true` when in [step mode](#md:step-mode) which means that clock time has
advanced even though the Clock is paused. The client should update the Simulation to
match the new clock time, and call {@link clearStepMode} to indicate that the
Simulation has advanced.
@return `true` when in *step mode*
*/
isStepping(): boolean {
  return this.stepMode_;
};

/** Pauses clock time and real time. Cancels all ClockTasks. Broadcasts a
{@link CLOCK_PAUSE} event.
*/
pause(): void {
  this.clearStepMode();
  if (this.isRunning_) {
    this.saveTime_secs_ = this.getTime();
    this.saveRealTime_secs_ = this.getRealTime();
    this.cancelAllTasks();
    this.isRunning_ = false;
    this.broadcast(new GenericEvent(this, Clock.CLOCK_PAUSE));
    if (Util.DEBUG && this.clockDebug_)
      console.log('Clock.pause '+this.toString());
  }
};

/** Removes the ClockTask from the list of tasks to be run, and cancels the task.
@param task the ClockTask to remove
*/
removeTask(task: ClockTask): void {
  Util.remove(this.tasks_, task);
  task.cancel();
};

/** Resumes increasing clock time and real time. Schedules all ClockTasks that
should run at or after the current clock time. Broadcasts a {@link CLOCK_RESUME} event.
*/
resume(): void {
  this.clearStepMode();
  if (!this.isRunning_) {
    this.isRunning_ = true;
    this.setTimePrivate(this.saveTime_secs_);
    this.setRealTime(this.saveRealTime_secs_);
    if (Util.DEBUG && this.clockDebug_) {
      console.log('Clock.resume '+this.toString());
    }
    this.broadcast(new GenericEvent(this, Clock.CLOCK_RESUME));
  }
};

private scheduleTask(task: ClockTask): void {
  task.cancel();
  if (this.isRunning_) {
    // convert to system time to handle time rate other than 1.0
    const nowTime = this.clockToSystem(this.getTime());
    const taskTime = this.clockToSystem(task.getTime());
    // execute the task immediately if current time matches task time
    if (!Util.veryDifferent(taskTime, nowTime)) {
      task.execute();
    } else if (taskTime > nowTime) {
      task.schedule(taskTime - nowTime);
    }
  }
};

/** Sets the real time to the given time in seconds. See {@link getRealTime}.
@param time_secs the time to set
*/
setRealTime(time_secs: number): void {
  if (Util.DEBUG && this.clockDebug_)
    console.log('Clock.setRealTime '+Util.NF5(time_secs));
  if (this.isRunning_) {
    this.realStart_sys_secs_ = this.sysClock_.systemTime() - time_secs/this.timeRate_;
  } else {
    this.saveRealTime_secs_ = time_secs;
  }
};

/** Sets the [clock time](#clocktime), in seconds. Also schedules all ClockTasks that
should run at or after the given time. Broadcasts a {@link CLOCK_SET_TIME} event.
@param time_secs the time in seconds to set this Clock to
*/
setTime(time_secs: number): void {
  // Ignore when we are close to the requested time; this prevents needless
  // CLOCK_SET_TIME events. Because system clock usually has millisecond resolution
  // we use 0.001 for the threshold to set the time.
  const t = this.getTime();
  if (Util.veryDifferent(t, time_secs, 0.001)) {
    this.setTimePrivate(time_secs);
    if (Util.DEBUG && this.clockDebug_) {
      console.log('Clock.setTime('+time_secs+') getTime='+t
          +' realTime='+Util.NF5(this.getRealTime()));
    }
    this.broadcast(new GenericEvent(this, Clock.CLOCK_SET_TIME));
  }
};

private setTimePrivate(time_secs: number): void {
  if (this.isRunning_) {
    this.clockStart_sys_secs_ = this.sysClock_.systemTime() - time_secs/this.timeRate_;
    // schedule all ClockTasks
    this.tasks_.forEach(task => this.scheduleTask(task));
  } else {
    this.saveTime_secs_ = time_secs;
  }
};

/** Sets the rate at which clock time passes compared to system time. A value of 2 makes
clock time pass twice as fast as system time; a value of 0.5 makes clock time pass half
as fast as system time. Broadcasts the `TIME_RATE` Parameter if the rate changes.
@param rate the rate at which clock time passes compared to system time
*/
setTimeRate(rate: number): void {
  if (Util.veryDifferent(this.timeRate_, rate)) {
    const t = this.getTime();
    const sysT = this.getRealTime();
    this.timeRate_ = rate;
    this.setTimePrivate(t);
    this.setRealTime(sysT);
    let diff = Math.abs(t - this.getTime());
    Util.assert(diff < 2E-3, 'time diff='+diff);
    diff = Math.abs(sysT - this.getRealTime());
    Util.assert(diff < 2E-3, 'realTime diff='+diff);
    this.broadcastParameter(Clock.en.TIME_RATE);
  };
};

/** Performs a single step forward in time; puts the Clock into
[step mode](#md:step-mode); advances the clock time and real time by the specified time
step; pauses the clock; and broadcasts a {@link CLOCK_STEP} event.

When the client sees that {@link isStepping} is `true`, it should advance the
Simulation to match the current clock time, and then call {@link clearStepMode}.

@param timeStep  amount of time to advance the clock in seconds
*/
step(timeStep: number): void {
  this.pause();
  this.stepMode_ = true;
  Util.assert(typeof timeStep === "number");
  const startStepTime = this.saveTime_secs_;
  this.saveTime_secs_ += timeStep;
  this.saveRealTime_secs_ += timeStep;
  this.broadcast(new GenericEvent(this, Clock.CLOCK_STEP));
  if (Util.DEBUG && this.clockDebug_) {
    console.log('Clock.step timeStep='+Util.NFE(timeStep)+' '+this.toString());
  }
  // execute tasks that should fire during this step
  this.executeTasks(startStepTime, timeStep);
};

/** Converts system time to clock time. System time is defined by
{@link SystemClock}.
@param systemTime in seconds
@return clock time equivalent of systemTime
*/
systemToClock(systemTime: number): number {
  return (systemTime - this.clockStart_sys_secs_)*this.timeRate_;
};

/**  Name of the GenericEvent fired when the Clock is paused, see {@link pause}. */
static readonly CLOCK_PAUSE = 'CLOCK_PAUSE';

/** Name of the GenericEvent fired when the Clock is resumed, see {@link resume}. */
static readonly CLOCK_RESUME = 'CLOCK_RESUME';

/** Name of the GenericEvent fired when the Clock time is set, see {@link setTime}.*/
static readonly CLOCK_SET_TIME ='CLOCK_SET_TIME';

/** Name of the GenericEvent fired when the Clock is stepped, see {@link step}.*/
static readonly CLOCK_STEP ='CLOCK_STEP';

static en: Clock_i18n_strings = {
  TIME_RATE: 'time rate'
};
static de_strings: Clock_i18n_strings = {
  TIME_RATE: 'Zeitraffer'
};

static readonly i18n = Util.LOCALE === 'de' ? Clock.de_strings : Clock.en;
}; // end Clock class

type Clock_i18n_strings = {
  TIME_RATE: string
}

Util.defineGlobal('lab$util$Clock', Clock);

// *************************** ClockTask **************************

/** Holds a callback function to be executed at a specified time; used with
{@link Clock}. ClockTasks are scheduled as a side effect of Clock
methods such as `setTime()`, `resume()`, `addTask()`. ClockTasks are cancelled as a
side effect of Clock methods such as `pause()`, `removeTask()`.

Here is an example of a ClockTask that restarts the simulation every 5 seconds. This
script can be entered in the
[command-line Terminal](../Customizing.html#terminalforscriptexecution).
For example in
[Single Spring App](https://www.myphysicslab.com/develop/build/sims/springs/SingleSpringApp-en.html)
```js
var task = () => sim.reset();
clock.addTask(new ClockTask(5, task));
sim.reset();
```

Example of a ClockTask that pauses the Clock after 5 seconds:
```js
var task = new ClockTask(5, () => clock.pause());
clock.addTask(task);
sim.reset();
```

Example of a ClockTask that slows the time rate the Clock after 5 seconds:
```js
var task = new ClockTask(5, () => clock.setTimeRate(0.1));
clock.addTask(task);
sim.reset();
```

See Clock section [Types of Time](./lab_util_Clock.Clock.html#typesoftime)
about *clock time* and *system time*.
*/
export class ClockTask {
  private sysClock_: SystemClock;
  /** the function to execute at the given clock time*/
  private callBack_: (()=>void) | null;
  /** the clock time in seconds when the callBack should start */
  private time_: number;
  /** the ID for cancelling the callback, or NaN if not currently scheduled */
  private timeoutID_: number = NaN;
/**
* @param time the clock time in seconds when the callBack should start
* @param callBack the function to execute at the given clock time
* @param opt_sysClock a SystemClock to use for this Clock (optional)
*/
constructor(time: number, callBack: (()=>void) | null, opt_sysClock?: SystemClock) {
  this.sysClock_ = opt_sysClock || new StdSystemClock();
  this.callBack_ = callBack;
  this.time_ = time;
};

/** @inheritDoc */
toString(): string {
  return 'ClockTask{time_: '+Util.NF(this.time_)
      +', timeoutID_: '+this.timeoutID_
      +', callBack_: '+this.callBack_
      +'}';
};

/** Cancels the scheduled execution of this task. */
cancel(): void {
  if (isFinite(this.timeoutID_)) {
    this.sysClock_.cancelCallback(this.timeoutID_);
    this.timeoutID_ = NaN;
  }
};

/** Execute the ClockTask's callback. */
execute(): void {
  if (typeof this.callBack_ === 'function') {
    this.callBack_();
  }
};

/** Returns the clock time in seconds when the task should be executed.
@return the clock time in seconds when the task should be executed
*/
getTime(): number {
  return this.time_;
};

/** Schedules the task to be executed after given time delay in seconds of
system time
@param delay time delay till execution in seconds of system time
*/
schedule(delay: number): void {
  this.cancel();
  if (typeof this.callBack_ === 'function') {
    const delay_ms = Math.round(delay*1000);
    this.timeoutID_ = this.sysClock_.scheduleCallback(this.callBack_, delay_ms);
  }
};

/** Set the callback to execute.
* @param callBack the function to execute
*/
setCallback(callBack: (()=>void) | null) {
  this.callBack_ = callBack;
};

}; // end ClockTask class

Util.defineGlobal('lab$util$ClockTask', ClockTask);
