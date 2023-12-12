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

import { SystemClock } from "../lab/util/Clock.js";
import { Util } from "../lab/util/Util.js";

type mockCallback = {
  fnc: ()=>void;
  id: number;
  firetime_ms: number;  // time to execute in milliseconds
};

/** Implementation of a {@link SystemClock} for testing.
We can advance the time manually via {@link MockClock.tick},
and then scheduled callbacks will be executed as appropriate.
*/
export class MockClock implements SystemClock {
  private time_ms: number = 0; // time in milliseconds
  private callbacks_: mockCallback[] = [];
  private nextID: number = 1001;

  constructor() {};

  /** @inheritDoc */
  systemTime(): number {
    return this.time_ms/1000;
  };

  /** @inheritDoc */
  cancelCallback(timeoutID: number): void {
    let idx = this.callbacks_.findIndex(
        (elem:mockCallback)=> elem.id === timeoutID);
    if (idx >= 0) {
      this.callbacks_.splice(idx, 1);
      // make sure no duplicate ids
      Util.assert(-1 === this.callbacks_.findIndex(
          (elem:mockCallback)=> elem.id === timeoutID));
    }
  };

  /** @inheritDoc */
  scheduleCallback(callback: ()=>void, delay_ms: number): number {
    const my_id = this.nextID++;
    this.callbacks_.push(
    { fnc: callback,
      id: my_id,
      firetime_ms: this.time_ms+delay_ms
    });
    return my_id;
  };

  /** @inheritDoc */
  requestAnimFrame(callback: ()=>void) {
    // 50 fps is 20 millisec
    return this.scheduleCallback(callback, 20);
  };

  /** @inheritDoc */
  cancelAnimFrame(requestID: number): void {
    this.cancelCallback(requestID);
  }

  /** Advances the system time and executes any scheduled callbacks whose time
  has come.
  @param advance_ms how much time to advance in milliseconds
  */
  tick(advance_ms: number): void {
    const finishTime = this.time_ms + advance_ms;
    let fired: mockCallback[] = [];
    while (this.time_ms < finishTime) {
      let nextTime = finishTime;
      // find the next scheduled callback time
      this.callbacks_.forEach(
        (cb: mockCallback)=> {
          if (cb.firetime_ms <= nextTime && cb.firetime_ms > this.time_ms) {
            nextTime = cb.firetime_ms;
          }
        }, this);
      Util.assert(nextTime - this.time_ms <= advance_ms);
      // advance to nextTime
      this.time_ms = nextTime;
      // execute the callbacks that are due
      this.callbacks_.forEach(
        (cb:mockCallback)=> {
          if (cb.firetime_ms <= this.time_ms) {
            cb.fnc();
            fired.push(cb);
          }
        }, this);
      // delete the fired callbacks
      fired.forEach((cb)=>{ Util.remove(this.callbacks_, cb); }, this);
    }
  };
}; // end MockClock class
