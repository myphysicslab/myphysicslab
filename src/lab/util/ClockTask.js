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

goog.provide('myphysicslab.lab.util.ClockTask');

goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var Util = myphysicslab.lab.util.Util;
var NF = myphysicslab.lab.util.Util.NF;

/** Holds a callback function to be executed at a specified time; used with
{@link myphysicslab.lab.util.Clock}. ClockTasks are scheduled as a side effect of Clock
methods such as `setTime()`, `resume()`, `addTask()`. ClockTasks are cancelled as a
side effect of Clock methods such as `pause()`, `removeTask()`.

Here is an example of a ClockTask that restarts the simulation every 5 seconds. This
script can be entered in the
[command-line Terminal](Customizing.html#terminalforscriptexecution) of most
[simple-compiled](Building.html#advancedvs.simplecompile) apps, for example in
[Single Spring App](https://www.myphysicslab.com/develop/build/sims/springs/SingleSpringApp-en.html)

    var redo = function() { sim.reset(); };
    clock.addTask(new ClockTask(5, redo));
    redo();

Example of a ClockTask that pauses the Clock after 5 seconds:

    var task = new ClockTask(5, function() { clock.pause(); });
    clock.addTask(task);
    sim.reset();


See Clock section {@linkplain myphysicslab.lab.util.Clock#typesoftime Types of Time}
about *clock time* and *system time*.

* @param {number} time the clock time in seconds when the callBack should start
* @param {function():*} callBack the function to execute at the given clock time
* @constructor
* @final
* @struct
*/
myphysicslab.lab.util.ClockTask = function(time, callBack) {
  /** the function to execute at the given clock time
  * @type {function():*}
  * @private
  */
  this.callBack_ = callBack;
  /** the clock time in seconds when the callBack should start
  * @type {number}
  * @private
  */
  this.time_ = time;
  /** the ID for cancelling the callback, or NaN if not currently scheduled
  * @type {number}
  * @private
  */
  this.timeoutID_ = NaN;
};
var ClockTask = myphysicslab.lab.util.ClockTask;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  ClockTask.prototype.toString = function() {
    return 'ClockTask{time_: '+NF(this.time_)
        +', timeoutID_: '+this.timeoutID_
        +', callBack_: '+this.callBack_
        +'}';
  };
};

/** Cancels the scheduled execution of this task.
@return {undefined}
*/
ClockTask.prototype.cancel = function() {
  if (isFinite(this.timeoutID_)) {
    clearTimeout(this.timeoutID_);
    this.timeoutID_ = NaN;
  }
};

/** Returns the clock time in seconds when the task should be executed.
@return {number} the clock time in seconds when the task should be executed
*/
ClockTask.prototype.getTime = function() {
  return this.time_;
};

/** Schedules the task to be executed after given time delay in seconds of
system time
@param {number} delay time delay till execution in seconds of system time
*/
ClockTask.prototype.schedule = function(delay) {
  this.cancel();
  var delay_ms = Math.round(delay*1000);
  this.timeoutID_ = setTimeout(this.callBack_, delay_ms);
};

}); // goog.scope
