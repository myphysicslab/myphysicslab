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

goog.module('myphysicslab.lab.app.SimRunner');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyEvent');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const AdvanceStrategy = goog.require('myphysicslab.lab.model.AdvanceStrategy');
const Clock = goog.require('myphysicslab.lab.util.Clock');
const ClockTask = goog.require('myphysicslab.lab.util.ClockTask');
const ConcreteMemoList = goog.require('myphysicslab.lab.util.ConcreteMemoList');
const ErrorObserver = goog.require('myphysicslab.lab.util.ErrorObserver');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const MemoList = goog.require('myphysicslab.lab.util.MemoList');
const Memorizable = goog.require('myphysicslab.lab.util.Memorizable');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Timer = goog.require('myphysicslab.lab.util.Timer');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Uses an {@link AdvanceStrategy} to advance the
{@link myphysicslab.lab.model.Simulation Simulation} state; the process is driven by a
{@link Timer} and a {@link Clock} to synchronize the Simulation with real time; updates
the {@link LabCanvas} to show the current Simulation state.

How Simulation Advances with Clock
----------------------------------
SimRunner advances the Simulation state, keeping it in sync with the Clock time, and
therefore we see the Simulation advancing in real time.  Here are the details:

+ The {@link Timer} repeatedly executes the SimRunner's {@link #callback}.
The callback continues being fired regardless of whether the Clock is paused,
stepping, or running.

+ When the Clock is **running or stepping**, `callback()` advances the Simulation up to
(or just beyond) the current {@link Clock#getTime clock time} by calling
{@link AdvanceStrategy#advance}. This keeps the Simulation in sync with the Clock.

+ **Stepping** forward by a single time step employs the special
[step mode](myphysicslab.lab.util.Clock.html#stepmode) of Clock. When `callback()`
sees the Clock is in step mode, it advances the Simulation by a single time step
and then clears the Clock's step mode so that the Clock will thereafter be in the
regular "paused" state.

+ Sometimes the Simulation cannot be computed in real time. In that case `callback()`
will **retard the clock time** when it is too far ahead of simulation time, by calling
{@link Clock#setTime}. Once that happens {@link Clock#getRealTime} will be greater than
{@link Clock#getTime}. We can calculate how much time has been lost due to performance
problems by comparing these.

+ When the Clock is **paused** `callback()` still updates the LabCanvas, so any changes
to objects will be seen. This allows the user to position objects while the simulation
is paused.

+ The Timer period (the callback frequency) determines the **frame rate** of the
simulation display, because a new frame is drawn each time the `callback()`
callback fires. See {@link #setDisplayPeriod}.

+ The Timer period has no effect on how often the Simulation's differential equation is
calculated; that is determined separately by the **time step** used when calling
{@link AdvanceStrategy#advance}. See {@link #setTimeStep}.

Stop Simulation When Window is Not Active
-----------------------------------------
SimRunner listens for blur and focus events to stop and start the Timer. Those events
occur when the browser window changes from being the front most active window to some
other window or browser tab being active. This means the simulation will only run when
the browser window is the frontmost active window. This helps reduce CPU usage when the
user is not viewing the simulation.

There is a "non-stop" Parameter which allows the simulation to run even when the window
is not active. This is useful if you want to view two simulations running in separate
browser windows. See {@link #setNonStop}.

Parameters Created
------------------
+ ParameterNumber named `TIME_STEP`, see {@link #setTimeStep}

+ ParameterNumber named `DISPLAY_PERIOD`, see {@link #setDisplayPeriod}

+ ParameterBoolean named `RUNNING`, see {@link #setRunning}

+ ParameterBoolean named `FIRING`, see {@link #setFiring}

+ ParameterBoolean named `NON_STOP`, see {@link #setNonStop}

Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `RESET`, see {@link #reset}.

* @implements {Observer}
* @implements {MemoList}
*/
class SimRunner extends AbstractSubject {
/**
* @param {!AdvanceStrategy} advance  the AdvanceStrategy which
*     runs advances the Simulation
* @param {string=} opt_name name of this SimRunner.
*/
constructor(advance, opt_name) {
  super(opt_name || 'SIM_RUNNER');
  /** Name of the application that created this SimRunner, for debugging.
  * Useful when multiple apps are running simultaneously on a page: this tells which
  * app this SimRunner belongs to.
  * @type {string}
  * @private
  */
  this.appName_ = '';
  /** The AdvanceStrategys to run.
  * @type {!Array<!AdvanceStrategy>}
  * @private
  */
  this.advanceList_ = [advance];
  /** Amount of time to advance the simulation, in seconds.
  * @type {number}
  * @private
  */
  this.timeStep_ = advance.getTimeStep();
  /** Amount of time between displaying frames of the simulation, in seconds.
  * @type {number}
  * @private
  */
  this.displayPeriod_ = 0;
  /** Whether the Timer stops firing when the window is not active (when a blur
  * event occurs).
  * @type {boolean}
  * @private
  */
  this.nonStop_ = false;
  /**
  * @type {!Timer}
  * @private
  */
  this.timer_ = new Timer();
  this.timer_.setPeriod(this.displayPeriod_);
  this.timer_.setCallBack(goog.bind(this.callback, this));
  // Clock name should be just 'CLOCK' when opt_name is not specified.
  // When opt_name is specified, prefix it to the clock name.
  var clockName = (opt_name ? opt_name + '_' : '')+'CLOCK';
  /**
  * @type {!Clock}
  * @private
  */
  this.clock_ = new Clock(clockName);
  // set Clock to match simulation time.
  var t = advance.getTime();
  this.clock_.setTime(t);
  this.clock_.setRealTime(t);
  this.clock_.addObserver(this);
  /**
  * @type {!Array<!LabCanvas>}
  * @private
  */
  this.canvasList_ = [];
  /**
  * @type {!MemoList}
  * @private
  */
  this.memoList_ = new ConcreteMemoList();
  /**
  * @type {!Array<!ErrorObserver>}
  * @private
  */
  this.errorObservers_ = [];
  this.addParameter(new ParameterNumber(this, SimRunner.en.TIME_STEP,
      SimRunner.i18n.TIME_STEP,
      goog.bind(this.getTimeStep, this), goog.bind(this.setTimeStep, this))
      .setSignifDigits(3));
  this.addParameter(new ParameterNumber(this, SimRunner.en.DISPLAY_PERIOD,
      SimRunner.i18n.DISPLAY_PERIOD,
      goog.bind(this.getDisplayPeriod, this), goog.bind(this.setDisplayPeriod, this))
      .setSignifDigits(3));
  this.addParameter(new ParameterBoolean(this, SimRunner.en.RUNNING,
      SimRunner.i18n.RUNNING,
      goog.bind(this.getRunning, this), goog.bind(this.setRunning, this)));
  this.addParameter(new ParameterBoolean(this, SimRunner.en.FIRING,
      SimRunner.i18n.FIRING,
      goog.bind(this.getFiring, this), goog.bind(this.setFiring, this)));
  this.addParameter(new ParameterBoolean(this, SimRunner.en.NON_STOP,
      SimRunner.i18n.NON_STOP,
      goog.bind(this.getNonStop, this), goog.bind(this.setNonStop, this)));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', advanceList_: ['
      + goog.array.map(this.advanceList_, function(a) { return a.toStringShort(); })
      +'], clock_: '+this.clock_.toStringShort()
      +', timer_: '+this.timer_
      +', timeStep_: '+Util.NF(this.timeStep_)
      +', displayPeriod_: '+Util.NF(this.displayPeriod_)
      +', nonStop_: '+this.nonStop_
      +', canvasList_: ['
      + goog.array.map(this.canvasList_, function(a) { return a.toStringShort(); })
      +'], memoList_: '+this.memoList_
      + super.toString();
};

/** @override */
getClassName() {
  return 'SimRunner';
};

/** Adds the LabCanvas to the list of LabCanvas's that need to be
repainted and memorized after each advance of the Simulation.
@param {!LabCanvas} canvas the LabCanvas to add to the list of
    LabCanvas's to update
*/
addCanvas(canvas) {
  if (!goog.array.contains(this.canvasList_, canvas)) {
    this.canvasList_.push(canvas);
    this.addMemo(canvas);
  }
};

/** Adds an object to the list of ErrorObserver objects to be notified when an
error occurs.
@param {!ErrorObserver} errorObserver object to add to the list of
    ErrorObserver objects
*/
addErrorObserver(errorObserver) {
  if (!goog.array.contains(this.errorObservers_, errorObserver)) {
    this.errorObservers_.push(errorObserver);
  }
};

/** @override */
addMemo(memorizable) {
  this.memoList_.addMemo(memorizable);
};

/** Adds an AdvanceStrategy to the set being advanced.
* @param {!AdvanceStrategy} advance  the AdvanceStrategy to add
*/
addStrategy(advance) {
  this.advanceList_.push(advance);
};

/** Advances the simulation(s) to the target time and calls `memorize` on the list of
Memorizables after each time step.
* @param {!AdvanceStrategy} strategy  the AdvanceStrategy which advances the simulation
* @param {number} targetTime the time to advance to
* @private
*/
advanceSims(strategy, targetTime) {
  var  simTime = strategy.getTime();
  var n = 0;
  while (simTime < targetTime) {
    // the AdvanceStrategy is what actually calls `memorize`
    strategy.advance(this.timeStep_, /*memoList=*/this);
    // Prevent infinite loop when time doesn't advance.
    var lastSimTime = simTime;
    simTime = strategy.getTime();
    if (simTime - lastSimTime <= 1e-15) {
      throw 'SimRunner: time did not advance';
    }
    // Avoid multiple timesteps so that each frame can draw.
    // This makes the "trails" look continuous with no missing frames.
    // Test: RollerSingleApp with trails, timestep and display_period = 0.025.
    // Very small timesteps (like 0.001) still need to do multiple steps here.
    if (targetTime - simTime < this.timeStep_) {
      break;
    }
  }
};

/** Advances the Simulation AdvanceStrategy(s) to match the current Clock time and
repaints the LabCanvas's. Calls `memorize` on the list of Memorizables after each time
step. This is the callback function that is being run by the {@link Timer}.
* @return {undefined}
* @private
*/
callback() {
  try {
    if (this.clock_.isRunning() || this.clock_.isStepping()) {
      var clockTime = this.clock_.getTime();
      var simTime = this.advanceList_[0].getTime();
      // If clockTime is VERY far ahead or behind of simTime, assume simTime was
      // intentionally modified. Match clock to simTime, but just a little ahead
      // by a timeStep so that the simulation advances.
      if (clockTime > simTime + 1 || clockTime < simTime - 1) {
        var t = simTime + this.timeStep_;
        this.clock_.setTime(t);
        this.clock_.setRealTime(t);
        clockTime = t;
      }
      // If sim reaches almost current clock time, that is good enough.
      var targetTime = clockTime;// - this.timeStep_/10;
      for (var i=0, n=this.advanceList_.length; i<n; i++) {
        this.advanceSims(this.advanceList_[i], targetTime);
      }
      if (this.clock_.isStepping()) {
        this.clock_.clearStepMode();
      } else {
        clockTime = this.clock_.getTime();
        simTime = this.advanceList_[0].getTime();
        if (clockTime - simTime > 20*this.timeStep_) {
          // Retard the clock because simuliation is too far behind to catch up.
          this.clock_.setTime(simTime);
        }
      }
    }
    this.paintAll();
  } catch(ex) {
    this.handleException(ex);
  }
};

/** Remove connections to other objects to facilitate garbage collection.
* @return {undefined}
*/
destroy() {
  this.stopFiring();
};

/** Returns the list of LabCanvas's that need to be repainted after each advance of the
Simulation.
* @return {!Array<!LabCanvas>} the list of LabCanvas that need to be repainted
*/
getCanvasList() {
  return goog.array.clone(this.canvasList_);
};

/** Returns the Clock which the Simulation is synchronized to.
* @return {!Clock} the Clock which the Simulation is synchronized to.
*/
getClock() {
  return this.clock_;
};

/** Returns the amount of time between displaying frames of the Simulation, in seconds.
@return {number} amount of time between displaying frames of the Simulation, in seconds.
*/
getDisplayPeriod() {
  return this.displayPeriod_;
};

/** Whether the Timer is executing `callback()`.
@return {boolean}
*/
getFiring() {
  return this.timer_.isFiring();
};

/** @override */
getMemos() {
  return this.memoList_.getMemos();
};

/** Returns `true` if the Timer keeps firing even when the window is not active (not
frontmost window). The default is for the Timer to be stoppable, which prevents the
simulation from wasting CPU cycles when the user does not have the simulation window
active.
@return {boolean} `true` means the Timer keeps firing even when the browser window is
    inactive
*/
getNonStop() {
  return this.nonStop_;
};

/** Returns true if the Clock is running.
@return {boolean} true if the Clock is running
*/
getRunning() {
  return this.clock_.isRunning();
};

/** Returns the small increment of time by which to advance the Simulation's state.
Several steps of this size may be taken to advance the Simulation time to be equal to or
beyond the Clock time.
@return {number} the length of a time step, in seconds.
*/
getTimeStep() {
  return this.timeStep_;
};

/** Presents an alert to the user about the exception with instructions about how to
* get the Simulation running again; calls {@link #pause} to stop the Simulation.
* @param {*} error the error that caused the exception
*/
handleException(error) {
  this.pause();
  this.timer_.stopFiring();
  goog.array.forEach(this.errorObservers_, function(e) { e.notifyError(error); });
  var s = goog.isDefAndNotNull(error) ? ' '+error : '';
  alert(SimRunner.i18n.STUCK + s);
};

/** @override */
memorize() {
  this.memoList_.memorize();
};

/** @override */
observe(event) {
  if (event.getSubject() == this.clock_) {
    if (event.nameEquals(Clock.CLOCK_RESUME) || event.nameEquals(Clock.CLOCK_PAUSE)) {
      // sync clock to simulation time
      var t = this.advanceList_[0].getTime();
      this.clock_.setTime(t);
      this.clock_.setRealTime(t);
      this.broadcastParameter(SimRunner.en.RUNNING);
    } else if (event.nameEquals(Clock.CLOCK_SET_TIME)) {
      this.memorize();
    }
  }
};

/** Paints all the LabCanvas's, which causes them to redraw their contents.
* @return {undefined}
*/
paintAll() {
  goog.array.forEach(this.canvasList_, function(c) {
    c.paint();
  });
};

/** Pause the Clock, which therefore also pauses the Simulation.
@return {number} the current time on the Clock
*/
pause() {
  this.clock_.pause();
  return this.clock_.getTime();
};

/** Play the Simulation until the given time. Resumes the Clock, which therefore also
resumes advancing the Simulation, and creates a ClockTask to stop the Clock.
@param {number} pauseTime time when the Clock should be paused
@return {number} the current time on the Clock
*/
playUntil(pauseTime) {
  var pauseTask = new ClockTask(pauseTime, null);
  pauseTask.setCallback(goog.bind(function() {
      this.clock_.pause();
      this.clock_.removeTask(pauseTask);
    }, this));
  this.clock_.addTask(pauseTask);
  return this.resume();
};

/** Remove the LabCanvas from the list of LabCanvas's that need to be
repainted and memorized after each advance of the Simulation.
@param {!LabCanvas} canvas the LabCanvas to remove from the list
    of LabCanvas's to update
*/
removeCanvas(canvas) {
  goog.array.remove(this.canvasList_, canvas);
  this.removeMemo(canvas);
};

/** Removes an object from the list of ErrorObserver objects to be notified when an
error occurs.
@param {!ErrorObserver} errorObserver object to remove from
    the list of ErrorObserver objects
*/
removeErrorObserver(errorObserver) {
  goog.array.remove(this.errorObservers_, errorObserver);
};

/** @override */
removeMemo(memorizable) {
  this.memoList_.removeMemo(memorizable);
};

/** Sets the Simulation to its initial conditions by calling
{@link AdvanceStrategy#reset}, sets the Clock to match the simulation time (usually
zero), and pauses the Clock. Broadcasts a {@link SimRunner.RESET} event.
@return {number} the current time on the Clock after resetting
*/
reset() {
  this.timer_.startFiring(); // in case the timer was stopped.
  this.clock_.pause();
  goog.array.forEach(this.advanceList_, function(strategy) {
    strategy.reset();
  });
  // sync clock to simulation time
  var t = this.advanceList_[0].getTime();
  this.clock_.setTime(t);
  this.clock_.setRealTime(t);
  this.paintAll();
  this.broadcast(new GenericEvent(this, SimRunner.RESET));
  return this.clock_.getTime();
};

/** Resume the Clock, which therefore also resumes advancing the Simulation.
@return {number} the current time on the Clock
*/
resume() {
  this.timer_.startFiring(); // in case the timer was stopped.
  this.clock_.resume();
  return this.clock_.getTime();
};

/** Save the initial conditions, which can be returned to with {@link #reset}.
@return {number} the current time on the Clock
*/
save() {
  goog.array.forEach(this.advanceList_, function(strategy) {
    strategy.save();
  });
  // must return something besides 'undefined' to work with EasyScriptParser.
  return this.clock_.getTime();
};

/** Set name of the application that created this SimRunner, for debugging.
@param {string} name the name of the application that created this SimRunner
*/
setAppName(name) {
  this.appName_ = name;
};

/** Sets amount of time between displaying frames of the Simulation, in seconds.
Can be set to zero, in which case the fastest possible frame rate will happen,
which is usually 60 frames per second.
@param {number} displayPeriod amount of time between displaying frames of the
    Simulation, in seconds.
*/
setDisplayPeriod(displayPeriod) {
  this.displayPeriod_ = displayPeriod;
  this.timer_.setPeriod(displayPeriod);
  this.broadcastParameter(SimRunner.en.DISPLAY_PERIOD);
};

/** Sets whether the Timer is executing `callback()`. However, if
non-stop mode is on, then this will not stop the Timer, see {@link #setNonStop}.
@param {boolean} value `true` causes the Timer to start firing
*/
setFiring(value) {
  if (value) {
    this.startFiring();
  } else {
    this.stopFiring();
  }
  this.broadcastParameter(SimRunner.en.FIRING);
};

/** Sets whether the Timer keeps firing when the window is not active (not the
frontmost window). The default is for the Timer to be stoppable, which prevents the
simulation from wasting CPU cycles when the user does not have the simulation window
active.
@param {boolean} value `true` means the Timer keeps firing even when the browser
    window is not active
*/
setNonStop(value) {
  this.nonStop_ = value;
  this.broadcastParameter(SimRunner.en.NON_STOP);
};

/** Sets whether the Clock is running or paused.
@param {boolean} value true means the Clock will be running
*/
setRunning(value) {
  if (value) {
    this.resume();
  } else {
    this.pause();
  }
};

/** Sets the length of a time step, the small increment of time by which to
advance the Simulation's state.  Several steps of this size may be taken to advance the
Simulation time to be equal to or beyond the Clock time.
@param {number} timeStep the length of a time step, in seconds.
*/
setTimeStep(timeStep) {
  this.timeStep_ = timeStep;
  this.broadcastParameter(SimRunner.en.TIME_STEP);
};

/** Starts the Timer executing `callback()`.
@return {undefined}
*/
startFiring() {
  this.timer_.startFiring();
};

/** Steps the Clock and Simulation forward by a single timestep.
@return {number} the current time on the clock after stepping
*/
step() {
  //this.clock_.pause();
  // advance clock to be exactly one timeStep past current sim time
  var dt = this.advanceList_[0].getTime() + this.timeStep_ - this.clock_.getTime();
  this.clock_.step(dt);
  this.timer_.startFiring(); // in case the timer was stopped.
  return this.clock_.getTime();
};

/** Stops the Timer from executing `callback()`, but only if the non-stop flag is
* `false`, see {@link #setNonStop}.
@return {undefined}
*/
stopFiring() {
  if (!this.nonStop_) {
    this.timer_.stopFiring();
  }
};

} // end class

/** Name of GenericEvent that is broadcast when {@link #reset} method occurs.
* @type {string}
* @const
*/
SimRunner.RESET = 'RESET';

/** Set of internationalized strings.
@typedef {{
  TIME_STEP: string,
  DISPLAY_PERIOD: string,
  RESTART: string,
  RUNNING: string,
  FIRING: string,
  PAUSE: string,
  RESUME: string,
  NON_STOP: string,
  STEP: string,
  STUCK: string
  }}
*/
SimRunner.i18n_strings;

/**
@type {SimRunner.i18n_strings}
*/
SimRunner.en = {
  TIME_STEP: 'time step',
  DISPLAY_PERIOD: 'display period',
  RESTART: 'restart',
  RUNNING: 'running',
  FIRING: 'firing',
  PAUSE: 'pause',
  RESUME: 'resume',
  NON_STOP: 'non-stop',
  STEP: 'step',
  STUCK: 'Simulation is stuck; click reset and play to continue.'
};

/**
@private
@type {SimRunner.i18n_strings}
*/
SimRunner.de_strings = {
  TIME_STEP: 'Zeitschritt',
  DISPLAY_PERIOD: 'Bilddauer',
  RESTART: 'Neustart',
  RUNNING: 'laufend',
  FIRING: 'tätigend',
  PAUSE: 'pausieren',
  RESUME: 'weiter',
  NON_STOP: 'durchgehend',
  STEP: 'kleine Schritte',
  STUCK: 'Simulation hat sich aufgehängt; drücken Sie Neustart und Weiter um fort zu fahren.'
};

/** Set of internationalized strings.
@type {SimRunner.i18n_strings}
*/
SimRunner.i18n = goog.LOCALE === 'de' ? SimRunner.de_strings :
    SimRunner.en;

exports = SimRunner;
