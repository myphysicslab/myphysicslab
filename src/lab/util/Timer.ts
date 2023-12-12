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
import { SystemClock, StdSystemClock } from "./Clock.js";

/** Periodically executes a callback function.

Timer uses JavaScript's `requestAnimationFrame` to repeatedly schedule the callback.
On older browsers the `setTimeout` function is used, see {@link Timer.setLegacy}.

If the period is left at the default value of zero, then the callback fires at the
rate determined by `requestAnimationFrame`, usually 60 frames per second.

If the period is set to a slower frame rate than 60 fps then Timer skips firing the
callback occasionally to achieve that slower rate of firing.

See
[BlankSlateApp](https://www.myphysicslab.com/develop/build/sims/experimental/BlankSlateApp-en.html)
for example code using a Timer.
*/
export class Timer {
  private sysClock_: SystemClock;
  /** Whether running under a modern or old browser. */
  private legacy_: boolean;
  /** the ID used to cancel the callback */
  private timeoutID_?: number = undefined;
  /** the callback function */
  private callBack_: (()=>void)|null = null;
  /** the callback function, it must reschedule itself to maintain 'chain of callbacks'
  */
  private timerCallback_ = () => this.timerCallback();
  /** period between callbacks, in seconds */
  private period_: number = 0;
  /** Whether the Timer should be executing the callBacks. */
  private firing_: boolean = false;
  /** When last callback happened */
  private fired_sys_: number = NaN;
  /** How late the last callback was. */
  private delta_: number= 0;

/**
* @param opt_legacy turns on legacy mode, which uses the browser method
*    `setTimeout` instead of `requestAnimationFrame`; default is `false`
* @param opt_sysClock: a SystemClock to use for this Clock (optional)
*/
constructor(opt_legacy?: boolean,  opt_sysClock?: SystemClock) {
  this.sysClock_ = opt_sysClock || new StdSystemClock();
  this.legacy_ = opt_legacy || typeof requestAnimationFrame !== 'function';
};

/** @inheritDoc */
toString() {
  return 'Timer{period_: '+this.period_
      +', firing_: '+this.firing_
      +', timeoutID_: '+this.timeoutID_
      +', fired_sys_: '+Util.nf7(this.fired_sys_)
      +', delta_: '+Util.nf7(this.delta_)
      +'}';
};

private timerCallback(): void {
  if (this.callBack_ === null) {
    return;
  }
  const now = this.sysClock_.systemTime();
  const elapsed = now - (this.fired_sys_ - this.delta_);
  if (elapsed >= this.period_) {
    this.callBack_();
    // adjust "last fired time" by how much this callback was late.
    // https://stackoverflow.com/questions/19764018/
    // controlling-fps-with-requestanimationframe
    this.fired_sys_ = now;
    this.delta_ = this.period_ > 0 ? elapsed % this.period_ : 0;
    /*console.log('FIRED now='+Util.NF7(now)
        +' elapsed='+Util.NF7(elapsed)
        +' fired_sys_='+Util.NF7(this.fired_sys_)
        +' delta_='+Util.NF7(this.delta_)
        +' period='+Util.NF7(this.period_));
    */
  } else {
    /*console.log('skip  now='+Util.NF7(now)
        +' elapsed='+Util.NF7(elapsed)
        +' fired_sys_='+Util.NF7(this.fired_sys_)
        +' delta_='+Util.NF7(this.delta_)
        +' period='+Util.NF7(this.period_));
    */
  }
  if (this.legacy_) {
    // when period is zero use 60 fps which is 1/60 = 0.016666 = 17 ms
    const delay_ms = this.period_ > 0 ? Math.round(this.period_*1000) : 17;
    this.timeoutID_ = this.sysClock_.scheduleCallback(this.timerCallback_, delay_ms);
  } else {
    this.timeoutID_ = this.sysClock_.requestAnimFrame(this.timerCallback_);
  }
};

/** Returns whether the legacy timer is being used.
@return whether the legacy timer is being used
*/
getLegacy(): boolean {
  return this.legacy_;
};

/** Returns the default time period between callbacks in seconds of system clock
time.
@return the number of seconds between successive callbacks
*/
getPeriod(): number {
  return this.period_;
};

/** Whether the chain of callbacks is firing (executing)
@return {boolean}
*/
isFiring(): boolean {
  return this.firing_;
};

/** Sets the callback function to be executed periodically, and calls
* {@link Timer.stopFiring} to stop the Timer and any previously scheduled callback.
* @param callBack the function to be called periodically; can be `null`
*/
setCallBack(callBack: (()=>void)|null): void {
  this.stopFiring();
  this.callBack_ = callBack;
};

/** Sets whether to use the legacy timer.
@param legacy whether to use the legacy timer
*/
setLegacy(legacy: boolean): void {
  if (legacy !== this.legacy_) {
    this.stopFiring();
    this.legacy_ = legacy;
  }
};

/** Sets the default time period between callback execution in seconds of system
clock time. A setting of zero means to use the default period which is usually 60
frames per second.
@param period the number of seconds between successive callbacks, or zero
    to use the default period (usually 60 frames per second).
@throws if period is negative
*/
setPeriod(period: number): void {
  if (period < 0) {
    throw '';
  }
  this.period_ = period;
};

/** Immediately fires the callback and schedules the callback to fire repeatedly in
the future.
*/
startFiring(): void {
  if (!this.firing_) {
    this.firing_ = true;
    this.delta_ = 0;
    this.fired_sys_ = this.sysClock_.systemTime() - this.period_ - 1E-7;
    this.timerCallback();
  }
};

/** Stops the Timer from firing callbacks and cancels the next scheduled callback.
*/
stopFiring(): void {
  this.firing_ = false;
  if (this.timeoutID_ !== undefined) {
    if (this.legacy_) {
      this.sysClock_.cancelCallback(this.timeoutID_);
    } else {
      this.sysClock_.cancelAnimFrame(this.timeoutID_);
    }
    this.timeoutID_ = undefined;
  }
  this.fired_sys_ = NaN;
  this.delta_ = 0;
};

} // end Timer class

Util.defineGlobal('lab$util$Timer', Timer);
