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

goog.module('myphysicslab.lab.util.Clock');

goog.require('goog.array');
goog.require('goog.asserts');
const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const ClockTask = goog.require('myphysicslab.lab.util.ClockTask');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Advances along with real time when active, and can execute tasks at appointed
times. There are commands to pause, resume, and single-step the Clock, as well as set
its time and speed relative to system time. Clock has a list of
{@link ClockTask}s which it causes to be executed at the times
specified by the ClockTasks. Clock has a parallel *real time clock* for measuring
performance.

Clock time is used by a **client** object such as {@link
myphysicslab.lab.app.SimRunner} to know *how much to advance a simulation*. This is how
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
[About Units Of Measurement](Architecture.html#aboutunitsofmeasurement).

+ **System Time** is given by {@link Util#systemTime}. System time is the basis of
the other time measurements. For example, clock time and real time each have a "system
start time" by which they are measured. System time is always running.

<a id="clocktime"></a>
+ **Clock Time** is given by {@link #getTime}.
Clock time advances at the current {@link #getTimeRate time rate} (multiple of system
time). Clock time can be modified directly by calling {@link #setTime}. Clock time can
be {@link #pause paused} or {@link #resume resumed}.

+ **Simulation Time** is given by {@link myphysicslab.lab.model.Simulation#getTime}.
Simulation time is advanced by the client, usually to keep up with clock time. When
performance problems occur, the clock time can be retarded via {@link #setTime} to
match the current simulation time.

<a id="realtime"></a>
+ **Real Time** is given by {@link #getRealTime}. Closely related to clock time, real
time is used to measure performance: how much the simulation time
has slipped behind real time because the simulation couldn't compute
quickly enough. Real time usually mirrors clock time – they are paused or resumed
together and have the same time rate relative to system time – but real time is not
affected by {@link #setTime}. When performance problems happen the usual result is that
clock time is retarded to match simulation time by setting clock time to an earlier
value. In this case, real time is unaffected and will be ahead of clock time by the
amount of time lost to performance problems.


## ClockTask

A {@link ClockTask} contains a function which is to be executed at a particular time.
The time is expressed in *clock time*.

ClockTasks are scheduled as a side effect of Clock methods such as
`setTime()`, `resume()`, `addTask()`. ClockTasks are cancelled as a side
effect of Clock methods such as `pause()`, `removeTask()`.

A typical use of ClockTask is to restart the simulation after a few seconds, which
makes the simulation repeatedly "loop" showing it's first few seconds.


<a id="stepmode"></a>
## Step Mode

The {@link #step} method puts the Clock into a special *step mode*. Clients should check
for this step mode by calling {@link #isStepping}. Step mode being `true` means
that *clock time has advanced even though the clock is paused*. The client should
update the simulation to match the new clock time, and then call {@link #clearStepMode}
to indicate that it has advanced the simulation.


Parameters Created
------------------

+ ParameterNumber named `TIME_RATE`, see {@link #setTimeRate}


Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `CLOCK_PAUSE`, see {@link #pause}

+ GenericEvent named `CLOCK_RESUME`, see {@link #resume}

+ GenericEvent named `CLOCK_STEP`, see {@link #step}

+ GenericEvent named `CLOCK_SET_TIME`, see {@link #setTime}


@todo Should be able to have clock time (and therefore simulation time) start at
something other than zero.
*/
class Clock extends AbstractSubject {
/**
* @param {string=} opt_name name of this Clock.
*/
constructor(opt_name) {
  super(opt_name || 'CLOCK');
  /** when 'zero clock time' occurs, in system time, in seconds
  * @type {number}
  * @private
  */
  this.clockStart_sys_secs_ = Util.systemTime();
  /** when 'zero real time' occurs, in system time, in seconds
  * @type {number}
  * @private
  */
  this.realStart_sys_secs_ = this.clockStart_sys_secs_;
  /** rate at which clock time advances compared to system time
  * @type {number}
  * @private
  */
  this.timeRate_ = 1.0;
  /** remembers clock time while clock is stopped, in seconds
  * @type {number}
  * @private
  */
  this.saveTime_secs_ = 0;
  /** remembers the real time while clock is stopped, in seconds
  * @type {number}
  * @private
  */
  this.saveRealTime_secs_ = 0;
  /** whether clock time is advancing
  * @type {boolean}
  * @private
  */
  this.isRunning_ = false;
  /** means we are currently in single-step mode: clock time has advanced even
  * though clock is paused.
  * @type {boolean}
  * @private
  */
  this.stepMode_ = false;
  /** array of ClockTasks to execute at their appointed times
  * @type {!Array<!ClockTask>}
  * @private
  */
  this.tasks_ = [];
  /**
  * @type {boolean}
  * @private
  * @const
  */
  this.clockDebug_ = false;
  this.addParameter(new ParameterNumber(this, Clock.en.TIME_RATE,
      Clock.i18n.TIME_RATE,
      goog.bind(this.getTimeRate, this),
      goog.bind(this.setTimeRate, this)));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
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

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : super.toStringShort().slice(0, -1)
      +', time: '+Util.NF5(this.getTime())+'}';
};

/** @override */
getClassName() {
  return 'Clock';
};

/** Adds a ClockTask to the list of tasks which will be run, and schedules it to be run
if its time is now or in the future. The time to run the task is specified in the
ClockTask.
@param {!ClockTask} task the ClockTask to add to list of tasks to be run
*/
addTask(task) {
  if (!goog.array.contains(this.tasks_, task)) {
    this.tasks_.push(task);
    this.scheduleTask(task);
  }
};

/**
@return {undefined}
@private
*/
cancelAllTasks() {
  goog.array.forEach(this.tasks_, function(task) { task.cancel(); });
};

/** Called during [step mode](#stepmode), this indicates that the client has advanced
the Simulation to match the clock time.
@return {undefined}
*/
clearStepMode() {
  this.stepMode_ = false;
};

/** Converts clock time to system time. System time is defined by
{@link Util#systemTime}.
@param {number} clockTime in seconds
@return {number} system time equivalent of clockTime
*/
clockToSystem(clockTime) {
  return clockTime/this.timeRate_ + this.clockStart_sys_secs_;
};

/** Schedules tasks for immediate execution that are in the given range of time from
`startTime` to `startTime + timeStep`.
@param {number} startTime
@param {number} timeStep
@private
*/
executeTasks(startTime, timeStep) {
  goog.array.forEach(this.tasks_, function(task) {
    if (task.getTime() >= startTime && task.getTime() <= startTime + timeStep) {
      task.schedule(0);
    }
  });
};

/** Returns the [real time](#realtime) in seconds which is in the same time scale as
the clock time; used for checking simulation performance. Like clock time, real time
starts at zero time; is paused when the Clock is paused; and runs at the same rate as
clock time.

When a simulation cannot keep up with real time the Clock is **retarded** by client
code calling {@link #setTime} to set clock time to an earlier time. In contrast, the
real time is unaffected by `setTime`; therefore the difference between real time
and clock time tells us how far behind real time the simulation is.

When the simulation is reset, the clock is typically set to time zero. In that case
the real time should be set to match clock time by using {@link #setRealTime}.
@return {number} current real time in seconds
*/
getRealTime() {
  if (this.isRunning_) {
    return (Util.systemTime() - this.realStart_sys_secs_)*this.timeRate_;
  } else {
    return this.saveRealTime_secs_;
  }
};

/** Returns array of ClockTasks that are scheduled to run.
@return {!Array<!ClockTask>} array of ClockTasks that are scheduled to run
*/
getTasks() {
  return goog.array.clone(this.tasks_);
};

/** Returns the [clock time](#clocktime) in seconds. When the Clock
{@link #isRunning is running}, the clock time advances along with system time at
whatever {@link #getTimeRate time rate} is specified.
@return {number} the clock time in seconds
*/
getTime() {
  if (this.isRunning_) {
    return (Util.systemTime() - this.clockStart_sys_secs_)*this.timeRate_;
  } else {
    return this.saveTime_secs_;
  }
};

/** Returns the rate at which clock time passes compared to system time; a value of 2
makes clock time pass twice as fast as system time; a value of 0.5 makes clock time pass
half as fast as system time.
* @return {number} the rate at which clock time passes compared to system time
*/
getTimeRate() {
  return this.timeRate_;
};

/** Whether the clock time and real time are advancing.
@return {boolean} `true` when clock time and real time are advancing
*/
isRunning() {
  return this.isRunning_;
};

/** Returns `true` when in [step mode](#stepmode) which means that clock time has
advanced even though the Clock is paused. The client should update the Simulation to
match the new clock time, and call {@link #clearStepMode} to indicate that the
Simulation has advanced.
@return {boolean} `true` when in *step mode*
*/
isStepping() {
  return this.stepMode_;
};

/** Pauses clock time and real time. Cancels all ClockTasks. Broadcasts a
{@link #CLOCK_PAUSE} event.
@return {undefined}
*/
pause() {
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
@param {!ClockTask} task the ClockTask to remove
*/
removeTask(task) {
  goog.array.remove(this.tasks_, task);
  task.cancel();
};

/** Resumes increasing clock time and real time. Schedules all ClockTasks that
should run at or after the current clock time. Broadcasts a {@link #CLOCK_RESUME} event.
@return {undefined}
*/
resume() {
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

/**
@param {!ClockTask} task
@private
*/
scheduleTask(task) {
  task.cancel();
  if (this.isRunning_) {
    // convert to system time to handle time rate other than 1.0
    var nowTime = this.clockToSystem(this.getTime());
    var taskTime = this.clockToSystem(task.getTime());
    // execute the task immediately if current time matches task time
    if (!Util.veryDifferent(taskTime, nowTime)) {
      task.execute();
    } else if (taskTime > nowTime) {
      task.schedule(taskTime - nowTime);
    }
  }
};

/** Sets the real time to the given time in seconds. See {@link #getRealTime}.
@param {number} time_secs the time to set
*/
setRealTime(time_secs) {
  if (Util.DEBUG && this.clockDebug_)
    console.log('Clock.setRealTime '+Util.NF5(time_secs));
  if (this.isRunning_) {
    this.realStart_sys_secs_ = Util.systemTime() - time_secs/this.timeRate_;
  } else {
    this.saveRealTime_secs_ = time_secs;
  }
};

/** Sets the [clock time](#clocktime), in seconds. Also schedules all ClockTasks that
should run at or after the given time. Broadcasts a {@link #CLOCK_SET_TIME} event.
@param {number} time_secs the time in seconds to set this Clock to
*/
setTime(time_secs) {
  // Ignore when we are close to the requested time; this prevents needless
  // CLOCK_SET_TIME events. Because system clock usually has millisecond resolution
  // we use 0.001 for the threshold to set the time.
  var t = this.getTime();
  if (Util.veryDifferent(t, time_secs, 0.001)) {
    this.setTimePrivate(time_secs);
    if (Util.DEBUG && this.clockDebug_) {
      console.log('Clock.setTime('+time_secs+') getTime='+t
          +' realTime='+Util.NF5(this.getRealTime()));
    }
    this.broadcast(new GenericEvent(this, Clock.CLOCK_SET_TIME));
  }
};

/**
@param {number} time_secs
@private
*/
setTimePrivate(time_secs) {
  if (this.isRunning_) {
    this.clockStart_sys_secs_ = Util.systemTime() - time_secs/this.timeRate_;
    // schedule all ClockTasks
    goog.array.forEach(this.tasks_, goog.bind(this.scheduleTask, this));
  } else {
    this.saveTime_secs_ = time_secs;
  }
};

/** Sets the rate at which clock time passes compared to system time. A value of 2 makes
clock time pass twice as fast as system time; a value of 0.5 makes clock time pass half
as fast as system time. Broadcasts the {@link #TIME_RATE} Parameter if it changes.
@param {number} rate the rate at which clock time passes compared to system time
*/
setTimeRate(rate) {
  if (Util.veryDifferent(this.timeRate_, rate)) {
    var t = this.getTime();
    var sysT = this.getRealTime();
    this.timeRate_ = rate;
    this.setTimePrivate(t);
    this.setRealTime(sysT);
    var diff = Math.abs(t - this.getTime());
    goog.asserts.assert(diff < 2E-3, 'time diff='+diff);
    diff = Math.abs(sysT - this.getRealTime());
    goog.asserts.assert(diff < 2E-3, 'realTime diff='+diff);
    this.broadcastParameter(Clock.en.TIME_RATE);
  };
};

/** Performs a single step forward in time; puts the Clock into [step mode](#stepmode);
advances the clock time and real time by the specified time step; pauses the clock; and
broadcasts a {@link #CLOCK_STEP} event.

When the client sees that {@link #isStepping} is `true`, it should advance the
Simulation to match the current clock time, and then call {@link #clearStepMode}.

@param {number} timeStep  amount of time to advance the clock in seconds
*/
step(timeStep) {
  this.pause();
  this.stepMode_ = true;
  goog.asserts.assertNumber(timeStep);
  var startStepTime = this.saveTime_secs_;
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
{@link Util#systemTime}.
@param {number} systemTime in seconds
@return {number} clock time equivalent of systemTime
*/
systemToClock(systemTime) {
  return (systemTime - this.clockStart_sys_secs_)*this.timeRate_;
};
}

/**  Name of the GenericEvent fired when the Clock is paused, see {@link #pause}.
* @type {string}
* @const
*/
Clock.CLOCK_PAUSE = 'CLOCK_PAUSE';

/** Name of the GenericEvent fired when the Clock is resumed, see {@link #resume}.
* @type {string}
* @const
*/
Clock.CLOCK_RESUME = 'CLOCK_RESUME';

/** Name of the GenericEvent fired when the Clock time is set, see {@link #setTime}.
* @type {string}
* @const
*/
Clock.CLOCK_SET_TIME ='CLOCK_SET_TIME';

/** Name of the GenericEvent fired when the Clock is stepped, see {@link #step}.
* @type {string}
* @const
*/
Clock.CLOCK_STEP ='CLOCK_STEP';

/** Set of internationalized strings.
@typedef {{
  TIME_RATE: string
  }}
*/
Clock.i18n_strings;

/**
@type {Clock.i18n_strings}
*/
Clock.en = {
  TIME_RATE: 'time rate'
};

/**
@private
@type {Clock.i18n_strings}
*/
Clock.de_strings = {
  TIME_RATE: 'Zeitraffer'
};

/** Set of internationalized strings.
@type {Clock.i18n_strings}
*/
Clock.i18n = goog.LOCALE === 'de' ? Clock.de_strings :
    Clock.en;

exports = Clock;
