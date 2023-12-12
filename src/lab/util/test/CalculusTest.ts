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

import { adaptQuad } from "../Calculus.js";
import { schedule, startTest, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function test() {
  schedule(testCalculus);
};

function myFn(x: number): number {
  return Math.sin(10/x)*100/(x*x);
};

function testCalculus() {
  startTest('CalculusTest.testCalculus');
  assertRoughlyEquals(-54.40211, myFn(1), 0.0001);
  assertRoughlyEquals(-1.426014, adaptQuad(myFn, 1, 3, 0.0001), 0.00001);
};
