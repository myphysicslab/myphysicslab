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

goog.module('myphysicslab.lab.util.Timer');

const Util = goog.require('myphysicslab.lab.util.Util');

/** Periodically executes a callback function.

Timer uses JavaScript's `requestAnimationFrame` to repeatedly schedule the callback.
On older browsers the `setTimeout` function is used.

If the period is left at the default value of zero, then the callback fires at the
rate determined by `requestAnimationFrame`, usually 60 frames per second.

If the period is set to a slower frame rate than 60 fps then Timer skips firing the
callback occasionally to achieve that slower rate of firing.

See
[BlankSlateApp](https://www.myphysicslab.com/develop/build/sims/experimental/BlankSlateApp-en.html)
for example code using a Timer.
*/
class Timer {
/**
* @param {boolean=} opt_legacy turns on legacy mode, which uses the browser method
*    `setTimeout` instead of `requestAnimationFrame`; default is `false`
*/
constructor(opt_legacy) {
  /** Whether running under a modern or old browser.
  * @type {boolean}
  * @const
  * @private
  */
  this.legacy_ = opt_legacy || typeof requestAnimationFrame !== 'function';
  /** the ID used to cancel the callback
  * @type {number|undefined}
  * @private
  */
  this.timeoutID_ = undefined;
  /** the callback function
  * @type {function()|null}
  * @private
  */
  this.callBack_ = null;
  /** the callback function, it must reschedule itself to maintain 'chain of callbacks'
  * @type {function()}
  * @private
  */
  this.timerCallback_ = () => this.timerCallback();
  /** period between callbacks, in seconds
  * @type {number}
  * @private
  */
  this.period_ = 0;
  /** Whether the Timer should be executing the callBacks.
  * @type {boolean}
  * @private
  */
  this.firing_ = false;
  /** When last callback happened
  * @type {number}
  * @private
  */
  this.fired_sys_ = Util.NaN;
  /** How late the last callback was.
  * @type {number}
  * @private
  */
  this.delta_ = 0;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : 'Timer{period_: '+this.period_
      +', firing_: '+this.firing_
      +', timeoutID_: '+this.timeoutID_
      +', fired_sys_: '+Util.nf7(this.fired_sys_)
      +', delta_: '+Util.nf7(this.delta_)
      +'}';
};

/**
* @return {undefined}
* @private
*/
timerCallback() {
  if (this.callBack_ == null) {
    return;
  }
  const now = Util.systemTime();
  const elapsed = now - (this.fired_sys_ - this.delta_);
  if (elapsed >= this.period_) {
    this.callBack_();
    // adjust "last fired time" by how much this callback was late.
    // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
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
    this.timeoutID_ = setTimeout(this.timerCallback_, delay_ms);
  } else {
    this.timeoutID_ = requestAnimationFrame(this.timerCallback_);
  }
};

/** Returns the default time period between callbacks in seconds of system clock
time.
@return {number} the number of seconds between successive callbacks
*/
getPeriod() {
  return this.period_;
};

/** Whether the chain of callbacks is firing (executing)
@return {boolean}
*/
isFiring() {
  return this.firing_;
};

/** Sets the callback function to be executed periodically, and calls
{@link #stopFiring} to stop the Timer and any previously scheduled callback.
* @param {?function()} callBack the function to be called periodically; can be `null`
*/
setCallBack(callBack) {
  this.stopFiring();
  this.callBack_ = callBack;
};

/** Sets the default time period between callback execution in seconds of system
clock time. A setting of zero means to use the default period which is usually 60
frames per second.
@param {number} period the number of seconds between successive callbacks, or zero
    to use the default period (usually 60 frames per second).
@throws {!Error} if period is negative
*/
setPeriod(period) {
  if (period < 0) {
    throw '';
  }
  this.period_ = period;
};

/** Immediately fires the callback and schedules the callback to fire repeatedly in
the future.
@return {undefined}
*/
startFiring() {
  if (!this.firing_) {
    this.firing_ = true;
    this.delta_ = 0;
    this.fired_sys_ = Util.systemTime() - this.period_ - 1E-7;
    this.timerCallback();
  }
};

/** Stops the Timer from firing callbacks and cancels the next scheduled callback.
@return {undefined}
*/
stopFiring() {
  this.firing_ = false;
  if (this.timeoutID_ !== undefined) {
    if (this.legacy_) {
      clearTimeout(this.timeoutID_);
    } else {
      cancelAnimationFrame(this.timeoutID_);
    }
    this.timeoutID_ = undefined;
  }
  this.fired_sys_ = NaN;
  this.delta_ = 0;
};

} // end class
exports = Timer;
