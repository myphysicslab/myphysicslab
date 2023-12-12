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

/** Runs a single test, useful for debugging.
*/

import { schedule, startTests, runTests, finishTests } from "./TestRig.js";
//import scheduleTests from "../lab/util/test/AbstractSubjectTest.ts";
//import scheduleTests from "../lab/util/test/CalculusTest.js";
//import scheduleTests from "../lab/util/test/ClockTest.js";
//import scheduleTests from "../lab/util/test/ConcreteMemoListTest.js";
//import scheduleTests from "../lab/util/test/TerminalTest.js";
//import scheduleTests from "../lab/util/test/TimerTest.js";
import scheduleTests from "../lab/util/test/UtilTest.js";
//import scheduleTests from "../lab/util/test/VectorTest.js";

/** Runs a single test, useful for debugging.

Unlike other tests, the makefile does not set `GOOG_DEBUG` to false for this test, so
`Util.DEBUG` should be true when this is compiled.
*/
export function runSingleTest() {
  startTests();
  scheduleTests();
  schedule(finishTests);
  runTests();
};
