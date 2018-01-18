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

goog.module('myphysicslab.lab.util.HistoryIterator');

/** Provides access to items in a {@link myphysicslab.lab.util.HistoryList}.
The iteration can start anywhere in the HistoryList. The iteration ends
with the newest value that was added to the HistoryList.
* @interface
* @template T
*/
class HistoryIterator {

/** Returns the index of the current value. In a HistoryList the index starts at zero
and increases as each value is added to the HistoryList.
* @return {number} the index of the current value
* @throws {!Error} when the index number exceeds the maximum representable integer
*/
getIndex() {}

/** Returns the current value that this iterator points to in the HistoryList.
* @return {T} the current value in the HistoryList
* @throws {!Error} if there is no current value
*/
getValue() {}

/** Returns `true` if there is a next value in this iteration of the HistoryList.
* @return {boolean} `true` if there is a next value in this iteration
*/
hasNext() {}

/** Returns `true` if there is a previous value in this iteration of the HistoryList.
* @return {boolean} `true` if there is a previous value in this iteration
*/
hasPrevious() {}

/** Moves to the next value in the HistoryList.
* @return {T} the next value in the HistoryList
* @throws {!Error} if there is no next value
*/
nextValue() {}

/** Moves to the previous value in the HistoryList.
* @return {T} the previous value in the HistoryList
* @throws {!Error} if there is no previous value
*/
previousValue() {}

}
exports = HistoryIterator;
