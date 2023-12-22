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

import { AbstractSubject } from '../util/AbstractSubject.js'
import { AdvanceStrategy } from '../model/AdvanceStrategy.js'
import { Clock, ClockTask } from '../util/Clock.js'
import { ConcreteMemoList } from '../util/ConcreteMemoList.js'
import { LabCanvas } from '../view/LabCanvas.js'
import { Observer, GenericEvent, ParameterBoolean, ParameterNumber, SubjectEvent, Subject }
    from '../util/Observe.js'
import { MemoList, Memorizable } from '../util/Memo.js'
import { Timer } from '../util/Timer.js'
import { Util, ErrorObserver } from '../util/Util.js'

/** Uses an {@link AdvanceStrategy} to advance the
{@link lab/model/Simulation.Simulation | Simulation} state; the process is driven by a
{@link Timer} and a {@link Clock} to synchronize the
Simulation with real time; updates the {@link LabCanvas} to show the
current Simulation state.

How Simulation Advances with Clock
----------------------------------
SimRunner advances the Simulation state, keeping it in sync with the Clock time, and
therefore we see the Simulation advancing in real time.  Here are the details:

+ The Timer repeatedly executes the SimRunner's {@link callback}.
The callback continues being fired regardless of whether the Clock is paused,
stepping, or running.

+ When the Clock is **running or stepping**, `callback()` advances the Simulation up to
(or just beyond) the current {@link Clock.getTime | clock time} by calling
{@link AdvanceStrategy.advance}.
This keeps the Simulation in sync with the Clock.

+ **Stepping** forward by a single time step employs the special
[step mode](./lab_util_Clock.Clock.html#md:step-mode) of Clock. When `callback()`
sees the Clock is in step mode, it advances the Simulation by a single time step
and then clears the Clock's step mode so that the Clock will thereafter be in the
regular "paused" state.

+ Sometimes the Simulation cannot be computed in real time. In that case `callback()`
will **retard the clock time** when it is too far ahead of simulation time, by calling
{@link Clock.setTime}. Once that happens
{@link Clock.getRealTime} will be greater than
{@link Clock.getTime}. We can calculate how much time has been lost due to
performance problems by comparing these.

+ When the Clock is **paused** `callback()` still updates the LabCanvas, so any changes
to objects will be seen. This allows the user to position objects while the simulation
is paused.

+ The Timer period (the callback frequency) determines the **frame rate** of the
simulation display, because a new frame is drawn each time the `callback()`
callback fires. See {@link setDisplayPeriod}.

+ The Timer period has no effect on how often the Simulation's differential equation is
calculated; that is determined separately by the **time step** used when calling
`AdvanceStrategy.advance()`. See {@link setTimeStep}.

Stop Simulation When Window is Not Active
-----------------------------------------
SimRunner listens for blur and focus events to stop and start the Timer. Those events
occur when the browser window changes from being the front most active window to some
other window or browser tab being active. This means the simulation will only run when
the browser window is the frontmost active window. This helps reduce CPU usage when the
user is not viewing the simulation.

There is a "non-stop" Parameter which allows the simulation to run even when the window
is not active. This is useful if you want to view two simulations running in separate
browser windows. See {@link setNonStop}.

Parameters Created
------------------
+ ParameterNumber named `TIME_STEP`, see {@link setTimeStep}

+ ParameterNumber named `DISPLAY_PERIOD`, see {@link setDisplayPeriod}

+ ParameterBoolean named `RUNNING`, see {@link setRunning}

+ ParameterBoolean named `FIRING`, see {@link setFiring}

+ ParameterBoolean named `NON_STOP`, see {@link setNonStop}

Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `RESET`, see {@link reset}.

*/
export class SimRunner extends AbstractSubject implements Subject, Memorizable, MemoList, Observer {
  /** Name of the application that created this SimRunner, for debugging.
  * Useful when multiple apps are running simultaneously on a page: this tells which
  * app this SimRunner belongs to.
  */
  private appName_: string = '';
  /** The AdvanceStrategys to run. */
  private advanceList_: AdvanceStrategy[];
  /** Amount of time to advance the simulation, in seconds. */
  private timeStep_: number;
  /** Amount of time between displaying frames of the simulation, in seconds. */
  private displayPeriod_: number = 0;
  /** Whether the Timer stops firing when the window is not active (when a blur
  * event occurs).
  */
  private nonStop_: boolean = false;
  private timer_: Timer;
  private clock_: Clock;
  private canvasList_: LabCanvas[] = [];
  private memoList_: MemoList = new ConcreteMemoList();
  private errorObservers_: ErrorObserver[] = [];
  private frames_: number = 0; // number of frames displayed

/**
* @param advance the AdvanceStrategy which runs advances the Simulation
* @param opt_name name of this SimRunner.
*/
constructor(advance: AdvanceStrategy, opt_name?: string) {
  super(opt_name || 'SIM_RUNNER');
  this.advanceList_ = [advance];
  this.timeStep_ = advance.getTimeStep();
  this.timer_ = new Timer();
  this.timer_.setPeriod(this.displayPeriod_);
  this.timer_.setCallBack(() => this.callback());
  // Clock name should be just 'CLOCK' when opt_name is not specified.
  // When opt_name is specified, prefix it to the clock name.
  const clockName = (opt_name ? opt_name + '_' : '')+'CLOCK';
  this.clock_ = new Clock(clockName);
  // set Clock to match simulation time.
  const t = advance.getTime();
  this.clock_.setTime(t);
  this.clock_.setRealTime(t);
  this.clock_.addObserver(this);
  this.addParameter(new ParameterNumber(this, SimRunner.en.TIME_STEP,
      SimRunner.i18n.TIME_STEP,
      () => this.getTimeStep(), a => this.setTimeStep(a))
      .setSignifDigits(3));
  this.addParameter(new ParameterNumber(this, SimRunner.en.DISPLAY_PERIOD,
      SimRunner.i18n.DISPLAY_PERIOD,
      () => this.getDisplayPeriod(), a => this.setDisplayPeriod(a))
      .setSignifDigits(3));
  this.addParameter(new ParameterBoolean(this, SimRunner.en.RUNNING,
      SimRunner.i18n.RUNNING,
      () => this.getRunning(), a => this.setRunning(a)));
  this.addParameter(new ParameterBoolean(this, SimRunner.en.FIRING,
      SimRunner.i18n.FIRING,
      () => this.getFiring(), a => this.setFiring(a)));
  this.addParameter(new ParameterBoolean(this, SimRunner.en.NON_STOP,
      SimRunner.i18n.NON_STOP,
      () => this.getNonStop(), a => this.setNonStop(a)));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', advanceList_: ['
      + this.advanceList_.map(a => a.toStringShort())
      +'], clock_: '+this.clock_.toStringShort()
      +', timer_: '+this.timer_
      +', timeStep_: '+Util.NF(this.timeStep_)
      +', displayPeriod_: '+Util.NF(this.displayPeriod_)
      +', nonStop_: '+this.nonStop_
      +', canvasList_: ['
      + this.canvasList_.map(a => a.toStringShort())
      +'], memoList_: '+this.memoList_
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'SimRunner';
};

/** Adds the LabCanvas to the list of LabCanvas's that need to be
repainted and memorized after each advance of the Simulation.
@param canvas the LabCanvas to add to the list of LabCanvas's to update
*/
addCanvas(canvas: LabCanvas): void {
  if (!this.canvasList_.includes(canvas)) {
    this.canvasList_.push(canvas);
    this.addMemo(canvas);
  }
};

/** Adds an object to the list of ErrorObserver objects to be notified when an
error occurs.
@param errorObserver object to add to the list of ErrorObserver objects
*/
addErrorObserver(errorObserver: ErrorObserver): void {
  if (!this.errorObservers_.includes(errorObserver)) {
    this.errorObservers_.push(errorObserver);
  }
};

/** @inheritDoc */
addMemo(memorizable: Memorizable): void {
  this.memoList_.addMemo(memorizable);
};

/** Adds an AdvanceStrategy to the set being advanced.
* @param advance  the AdvanceStrategy to add
*/
addStrategy(advance: AdvanceStrategy): void {
  this.advanceList_.push(advance);
};

/** Advances the simulation(s) to the target time and calls
* {@link Memorizable.memorize} on the list of Memorizables after each time step.
* @param strategy  the AdvanceStrategy which advances the simulation
* @param targetTime the time to advance to
*/
private advanceSims(strategy: AdvanceStrategy, targetTime: number): void {
  let  simTime = strategy.getTime();
  while (simTime < targetTime) {
    // the AdvanceStrategy is what actually calls `memorize`
    strategy.advance(this.timeStep_, /*memoList=*/this);
    // it is possible that a Memorizable called pause(), so check if running.
    if (!this.getRunning()) {
      break;
    }
    // Prevent infinite loop when time doesn't advance.
    const lastSimTime = simTime;
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
repaints the LabCanvas's. Calls {@link Memorizable.memorize} on the list of
Memorizables after each time step. This is the callback function that is being run by
the Timer.
*/
private callback(): void {
  try {
    if (this.clock_.isRunning() || this.clock_.isStepping()) {
      let clockTime = this.clock_.getTime();
      let simTime = this.advanceList_[0].getTime();
      // If clockTime is VERY far ahead or behind of simTime, assume simTime was
      // intentionally modified. Match clock to simTime, but just a little ahead
      // by a timeStep so that the simulation advances.
      if (clockTime > simTime + 1 || clockTime < simTime - 1) {
        const t = simTime + this.timeStep_;
        this.clock_.setTime(t);
        this.clock_.setRealTime(t);
        clockTime = t;
      }
      // If sim reaches almost current clock time, that is good enough.
      const targetTime = clockTime;// - this.timeStep_/10;
      for (let i=0, n=this.advanceList_.length; i<n; i++) {
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
    this.frames_++;
  } catch(ex) {
    this.handleException(ex);
  }
};

/** Remove connections to other objects to facilitate garbage collection. */
destroy(): void {
  this.stopFiring();
};

/** Returns the list of LabCanvas's that need to be repainted after each advance of the
Simulation.
@return the list of LabCanvas that need to be repainted
*/
getCanvasList(): LabCanvas[] {
  return Array.from(this.canvasList_);
};

/** Returns the Clock which the Simulation is synchronized to.
* @return the Clock which the Simulation is synchronized to.
*/
getClock(): Clock {
  return this.clock_;
};

/** Returns the amount of time between displaying frames of the Simulation, in seconds.
@return amount of time between displaying frames of the Simulation, in seconds.
*/
getDisplayPeriod(): number {
  return this.displayPeriod_;
};

/** Whether the Timer is executing {@link callback}.
*/
getFiring(): boolean {
  return this.timer_.isFiring();
};

/** Returns the average frame rate.
*/
getFrameRate(): number {
  return this.frames_/this.clock_.getTime();
};

/** @inheritDoc */
getMemos(): Memorizable[] {
  return this.memoList_.getMemos();
};

/** Returns `true` if the Timer keeps firing even when the window is not active (not
frontmost window). The default is for the Timer to be stoppable, which prevents the
simulation from wasting CPU cycles when the user does not have the simulation window
active.
@return `true` means the Timer keeps firing even when the browser window is
    inactive
*/
getNonStop(): boolean {
  return this.nonStop_;
};

/** Returns true if the Clock is running.
@return true if the Clock is running
*/
getRunning(): boolean {
  return this.clock_.isRunning();
};

/** Returns the small increment of time by which to advance the Simulation's state.
Several steps of this size may be taken to advance the Simulation time to be equal to or
beyond the Clock time.
@return the length of a time step, in seconds.
*/
getTimeStep(): number {
  return this.timeStep_;
};

/** Presents an alert to the user about the exception with instructions about how to
* get the Simulation running again; calls {@link pause} to stop the
* Simulation.
* @param error the error that caused the exception
*/
handleException(error: any): void {
  this.pause();
  this.timer_.stopFiring();
  this.errorObservers_.forEach(e => e.notifyError(error));
  const s = error != null ? ' '+error : '';
  alert(SimRunner.i18n.STUCK + s);
};

/** @inheritDoc */
memorize(): void {
  this.memoList_.memorize();
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.clock_) {
    if (event.nameEquals(Clock.CLOCK_RESUME) || event.nameEquals(Clock.CLOCK_PAUSE)) {
      // sync clock to simulation time
      const t = this.advanceList_[0].getTime();
      // note that this setTime will cause broadcast of CLOCK_SET_TIME event
      this.clock_.setTime(t);
      this.clock_.setRealTime(t);
      this.broadcastParameter(SimRunner.en.RUNNING);
    } else if (event.nameEquals(Clock.CLOCK_SET_TIME)) {
      this.memorize();
    }
  }
};

/** Paints all the LabCanvas's, which causes them to redraw their contents.
*/
paintAll(): void {
  this.canvasList_.forEach(c => c.paint());
};

/** Pause the Clock, which therefore also pauses the Simulation.
@return the current time on the Clock
*/
pause(): number {
  this.clock_.pause();
  return this.clock_.getTime();
};

/** Play the Simulation until the given time. Resumes the Clock, which therefore also
resumes advancing the Simulation, and creates a ClockTask to stop the Clock.
@param pauseTime time when the Clock should be paused
@return the current time on the Clock
*/
playUntil(pauseTime: number): number {
  const pauseTask = new ClockTask(pauseTime, null);
  pauseTask.setCallback( () => {
      this.clock_.pause();
      this.clock_.removeTask(pauseTask);
  });
  this.clock_.addTask(pauseTask);
  return this.resume();
};

/** Remove the LabCanvas from the list of LabCanvas's that need to be
repainted and memorized after each advance of the Simulation.
@param canvas the LabCanvas to remove from the list
    of LabCanvas's to update
*/
removeCanvas(canvas: LabCanvas): void {
  Util.remove(this.canvasList_, canvas);
  this.removeMemo(canvas);
};

/** Removes an object from the list of ErrorObserver objects to be notified when an
error occurs.
@param errorObserver object to remove from the list of ErrorObserver objects
*/
removeErrorObserver(errorObserver: ErrorObserver): void {
  Util.remove(this.errorObservers_, errorObserver);
};

/** @inheritDoc */
removeMemo(memorizable: Memorizable): void {
  this.memoList_.removeMemo(memorizable);
};

/** Sets the Simulation to its initial conditions by calling
{@link AdvanceStrategy.reset}, sets the Clock to match the
simulation time (usually zero), and pauses the Clock.
Broadcasts a {@link RESET} event.
@return the current time on the Clock after resetting
*/
reset(): number {
  this.frames_ = 0;
  this.timer_.startFiring(); // in case the timer was stopped.
  this.clock_.pause();
  this.advanceList_.forEach(strategy => strategy.reset());
  // sync clock to simulation time
  const t = this.advanceList_[0].getTime();
  this.clock_.setTime(t);
  this.clock_.setRealTime(t);
  this.paintAll();
  this.broadcast(new GenericEvent(this, SimRunner.RESET));
  return this.clock_.getTime();
};

/** Resume the Clock, which therefore also resumes advancing the Simulation.
@return the current time on the Clock
*/
resume(): number {
  this.timer_.startFiring(); // in case the timer was stopped.
  this.clock_.resume();
  return this.clock_.getTime();
};

/** Save the initial conditions, which can be returned to with {@link reset}.
@return the current time on the Clock
*/
save(): number {
  this.advanceList_.forEach(strategy => strategy.save());
  // must return something besides 'undefined' to work with EasyScriptParser.
  return this.clock_.getTime();
};

/** Set name of the application that created this SimRunner, for debugging.
@param name the name of the application that created this SimRunner
*/
setAppName(name: string): void {
  this.appName_ = name;
};

/** Sets amount of time between displaying frames of the Simulation, in seconds.
Can be set to zero, in which case the fastest possible frame rate will happen,
which is usually 60 frames per second.
@param displayPeriod amount of time between displaying frames of the
    Simulation, in seconds.
*/
setDisplayPeriod(displayPeriod: number): void {
  this.displayPeriod_ = displayPeriod;
  this.timer_.setPeriod(displayPeriod);
  this.broadcastParameter(SimRunner.en.DISPLAY_PERIOD);
};

/** Sets whether the Timer is executing {@link callback}. However, if
non-stop mode is on, then this will not stop the Timer, see
{@link setNonStop}.
@param value `true` causes the Timer to start firing
*/
setFiring(value: boolean): void {
  if (value) {
    this.startFiring();
  } else {
    // do any pending paint updates
    this.paintAll();
    this.stopFiring();
  }
  this.broadcastParameter(SimRunner.en.FIRING);
};

/** Sets whether the Timer keeps firing when the window is not active (not the
frontmost window). The default is for the Timer to be stoppable, which prevents the
simulation from wasting CPU cycles when the user does not have the simulation window
active.
@param value `true` means the Timer keeps firing even when the browser
    window is not active
*/
setNonStop(value: boolean): void {
  this.nonStop_ = value;
  this.broadcastParameter(SimRunner.en.NON_STOP);
};

/** Sets whether the Clock is running or paused.
@param value true means the Clock will be running
*/
setRunning(value: boolean): void {
  if (value) {
    this.resume();
  } else {
    this.pause();
  }
};

/** Sets the length of a time step, the small increment of time by which to
advance the Simulation's state.  Several steps of this size may be taken to advance the
Simulation time to be equal to or beyond the Clock time.
@param timeStep the length of a time step, in seconds.
*/
setTimeStep(timeStep: number): void {
  this.timeStep_ = timeStep;
  this.broadcastParameter(SimRunner.en.TIME_STEP);
};

/** Starts the Timer executing `callback()`. */
startFiring(): void {
  this.timer_.startFiring();
};

/** Steps the Clock and Simulation forward by a single timestep.
@return the current time on the clock after stepping
*/
step(): number {
  //this.clock_.pause();
  // advance clock to be exactly one timeStep past current sim time
  const dt = this.advanceList_[0].getTime() + this.timeStep_ - this.clock_.getTime();
  this.clock_.step(dt);
  this.timer_.startFiring(); // in case the timer was stopped.
  return this.clock_.getTime();
};

/** Stops the Timer from executing `callback()`, but only if the non-stop flag is
* `false`, see {@link setNonStop}.
*/
stopFiring(): void {
  if (!this.nonStop_) {
    this.timer_.stopFiring();
  }
};

/** Name of GenericEvent that is broadcast when {@link reset} method occurs.
*/
static readonly RESET = 'RESET';


static en: i18n_strings = {
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

static de_strings: i18n_strings = {
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

static readonly i18n = Util.LOCALE === 'de' ? SimRunner.de_strings : SimRunner.en;

} // end class

type i18n_strings = {
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
};

Util.defineGlobal('lab$app$SimRunner', SimRunner);
