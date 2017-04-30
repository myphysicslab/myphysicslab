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

goog.provide('myphysicslab.lab.util.Timer');

goog.require('goog.asserts');
goog.require('goog.array');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var NF3 = myphysicslab.lab.util.UtilityCore.NF3;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var NFE = myphysicslab.lab.util.UtilityCore.NFE;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Periodically executes a callback function; Timer is a fancier version of
JavaScript's `setInterval()` function.


## Chain of Callbacks

Timer has a single callback function which is intended to repeatedly execute or 'fire'.
To keep the chain of callbacks going *each callback must reschedule itself* to
execute again in future by calling {@link #fire}, {@link #fireAfter} or
{@link #finishAt}.

Once the callback has been specified via {@link #setCallBack}, the chain of callbacks is
started by calling {@link #startFiring}.

Here is some example code showing how to use a Timer, from
{@link myphysicslab.sims.experimental.BlankSlateApp BlankSlateApp}

    var r = PointMass.makeSquare(4);
    var dr = new DisplayShape(r);
    displayList.add(dr);
    dr.strokeStyle = 'red';
    var clock = new Clock();
    var timer = new Timer();
    var callback = function () {
        r.setAngle(Math.sin(clock.getTime()));
        simCanvas.paint();
        timer.fireAfter();
    };
    timer.setCallBack(callback);
    clock.resume();
    timer.startFiring();

You can try that code out by pasting it into the Terminal on the
[BlankSlateApp example page](http://www.myphysicslab.com/develop/sims/experimental/BlankSlateApp_en.html).


## Timing of Callbacks

The method {@link #fireAfter} schedules the callback to run after a short delay.
The method {@link #finishAt} schedules the callback to finish at
a specified time. Both these methods take into account how late the current callback is
and how long it took to execute in deciding when to schedule the callback to fire.

Here is an example of how using the 'lateness of the current callback' can result in
smoother animation: Suppose we want to draw a frame every 50 milliseconds, and on newer
machines it takes essentially zero time to compute the next frame. Suppose that on older
machines it takes 10 milliseconds to compute the next frame. If (at the conclusion of
the callback) we simply schedule the next callback to happen in 50 milliseconds, then we
achieve the desired frame rate on new machines, but on older machines, the frame period
is a slower 60 milliseconds. If we consider the 'lateness' and ask for a delay of 40
milliseconds on the older machines they would also achieve a 50 millisecond frame
period.

A similar story applies when the compute load varies over time on a machine. When the
compute load is heavier, we need to shorten the delay between callbacks to maintain a
given frame rate.

The 'lateness' of the current callback is derived from {@link #getExpectedTime}.


* @constructor
* @final
* @struct
*/
myphysicslab.lab.util.Timer = function() {
  /** the ID used to cancel the callback
  * @type {number|undefined}
  * @private
  */
  this.timeoutID_ = undefined;
  /** the callback function, it must reschedule itself to maintain 'chain of callbacks'
  * @type {function()|null}
  * @private
  */
  this.callBack_ = null;
  /** default period between callbacks, in seconds
  * @type {number}
  * @private
  */
  this.period_ = 0.033;
  /** when next callBack is expected to fire, in system time; or NaN when unknown.
  * @type {number}
  * @private
  */
  this.expected_sys_ = NaN;
  /** Whether the Timer should be executing the callBacks.
  * @type {boolean}
  * @private
  */
  this.firing_ = false;
  /**
  * @type {boolean}
  * @private
  * @const
  */
  this.timerDebug_ = false;
  /** when the callBack actually last fired, in system time; or NaN when unknown;
  * for debugging only.
  * @type {number}
  * @private
  */
  this.actual_sys_ = UtilityCore.NaN;
  /** when the last callBack fired, in system time; for debugging only.
  * @type {number}
  * @private
  */
  this.last_sys_ = UtilityCore.NaN;
  /** when the callback was requested to fire, in system time; for debugging only.
  * @type {number}
  * @private
  */
  this.request_sys_ = UtilityCore.NaN;
};
var Timer = myphysicslab.lab.util.Timer;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  Timer.prototype.toString = function() {
    return 'Timer{period_: '+this.period_
        +', firing_: '+this.firing_
        +', timeoutID_: '+this.timeoutID_
        +'}';
  };
};

/**  Call this at the start of the callback function so the Timer knows
when the callback happened.  This information (when the callback started) is used
for debugging only.
* @return {number} the current time as given by the system clock, in seconds
*/
Timer.prototype.callBackStarted = function() {
  var nowTime = UtilityCore.getSystemTime();
  this.actual_sys_ = nowTime;
  return nowTime;
};

/** Schedules the callback to fire slightly before the specified time, so that the
callback finishes executing at that time. Uses information about when the current
callback was expected to execute, to determine the starting time. Does nothing if the
callback is `null` or Timer is not firing. Uses JavaScript's `setTimeout()` function to
do the scheduling.

The finish time is in given in *system time*, see
{@link UtilityCore#getSystemTime} for how system time is defined.

@param {number} finishTimeSys the time when the next callback should finish execution, in system time seconds
*/
Timer.prototype.finishAt = function(finishTimeSys) {
  if (!this.firing_ || goog.isNull(this.callBack_)) {
    return;
  }
  // The next callback should finish at finishTimeSys.
  // Assume the next callback takes the same amount of elapsed time as this one,
  // and will be late by same amount as this callback.
  // (perhaps use a moving average for elapsed and late?)
  // Let: elapsed = now - start
  // Let: late = start - expected_start
  // Then: elapsed + late = now - expected_start
  // Next callback should start at
  //     finishTime - (elapsed + late) = finishTime - (now - expected_start)
  // Therefore delay till firing is
  //     delay = finishTime - (now - expected_start) - now
  //           = (finishTime - now) - (now - expected_start)
  var now_secs = UtilityCore.getSystemTime();
  var delay_secs = finishTimeSys - now_secs;
  if (isFinite(this.expected_sys_)) {
    var d = now_secs - this.expected_sys_;
    // Only reduce, never increase the delay.
    // We effectively regard early callbacks as merely 'on time'.
    if (d > 0) {
      delay_secs -= d;
    }
  }
  delay_secs = delay_secs > 0 ? delay_secs : 0;
  //console.log('finishAt delay_secs='+delay_secs+' expect='
  //    +this.expected_sys_+' now='+now_secs);
  this.expected_sys_ = now_secs + delay_secs;
  if (goog.DEBUG && this.timerDebug_) {
    var elapsed_secs = now_secs - this.actual_sys_;
    goog.asserts.assert( isNaN(this.actual_sys_) || elapsed_secs >= 0,
        'elapsed_secs<0' );
    // Show actual start, actual last period, and next expected start
    console.log(
      ' START='+NF3(this.actual_sys_)
      +' EXPECT='+NF3(this.expected_sys_)
      +' PERIOD='+NF3(this.actual_sys_ - this.last_sys_)
      +' ELAPSED='+NF3(elapsed_secs)
      +' DELAY='+delay_secs
      +' FINISH_AT='+NF3(finishTimeSys)
      +' REQUEST='+NF3(this.request_sys_)
      +' NOW='+NF3(now_secs)
      +' BEHIND='+NF3(now_secs - this.request_sys_)
      );
    this.last_sys_ = this.actual_sys_;
    this.actual_sys_ = UtilityCore.NaN;
  }
  this.request_sys_ = finishTimeSys;
  // important to convert to integer (otherwise unit tests fail when delay is
  // slightly more than an integer)
  var delay_ms = Math.round(delay_secs*1000);
  this.timeoutID_ = setTimeout(this.callBack_, delay_ms);
};

/** Schedules the callback to fire after the specified amount of time or the default
period if no time is specified.
Uses information about when the current callback was expected to
execute, to determine the starting time. Does nothing if the callback is `null`. Uses
JavaScript's `setTimeout()` function to do the scheduling.

@param {number=} opt_delay the desired delay in seconds before next callback execution
    in seconds; default is the period given by {@link #getPeriod}
*/
Timer.prototype.fireAfter = function(opt_delay) {
  var delay = goog.isNumber(opt_delay) ? opt_delay : this.period_;
  this.finishAt(UtilityCore.getSystemTime() + delay);
};

/** Expected time when the next callback should occur, in system time, in seconds. This
tells how late the current callback is, which is used when scheduling the next callback.
@return {number} expected time of next callback, in system time, in seconds, or NaN when
    callback is not firing
*/
Timer.prototype.getExpectedTime = function() {
  return this.expected_sys_;
};

/** Returns the default time period between callbacks in seconds of system clock
time.
@return {number} the number of seconds between successive callbacks
*/
Timer.prototype.getPeriod = function() {
  return this.period_;
};

/** Whether the chain of callbacks is firing (executing)
@return {boolean}
*/
Timer.prototype.isFiring = function() {
  return this.firing_;
};

/** Sets the callback function to be executed periodically, and stops any current
callbacks. This specifies the callback that {@link #fireAfter} and {@link #finishAt} will
schedule.
* @param {?function()} callBack the function to be called periodically; can be `null`
*/
Timer.prototype.setCallBack = function(callBack) {
  this.stopFiring();
  this.callBack_ = callBack;
};

/** Sets the default time period between callback execution in seconds of system
clock time.
@param {number} period the number of seconds between successive callbacks
@throws {Error} if period is negative
*/
Timer.prototype.setPeriod = function(period) {
  if (period < 0) {
    throw new Error();
  }
  this.period_ = period;
};

/** Starts the execution of the chain of callbacks.
@return {undefined}
*/
Timer.prototype.startFiring = function() {
  this.firing_ = true;
  this.fireAfter();
};

/** Stops the execution of the chain of callbacks, by canceling the next scheduled
callback.
@return {undefined}
*/
Timer.prototype.stopFiring = function() {
  this.firing_ = false;
  if (goog.isDef(this.timeoutID_)) {
    if (goog.DEBUG && this.timerDebug_) {
      console.log('Timer.stop:clearTimeout '+this.toString());
    }
    clearTimeout(this.timeoutID_);
    this.timeoutID_ = undefined;
  }
  this.expected_sys_ = NaN;
};

}); // goog.scope
