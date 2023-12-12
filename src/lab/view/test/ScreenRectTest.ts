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

import { ScreenRect } from "../ScreenRect.js";
import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

export default function scheduleTests() {
  schedule(testScreenRect);
};

const groupName = 'ScreenRectTest.';

function testScreenRect() {
  startTest(groupName+'testScreenRect');
  var sr1 = new ScreenRect(0, 0, 500, 300);
  assertEquals(0, sr1.getLeft());
  assertEquals(0, sr1.getTop());
  assertEquals(500, sr1.getWidth());
  assertEquals(300, sr1.getHeight());

  var sr2 = ScreenRect.clone(sr1);
  assertEquals(0, sr2.getLeft());
  assertEquals(0, sr2.getTop());
  assertEquals(500, sr2.getWidth());
  assertEquals(300, sr2.getHeight());
  assertTrue(sr1.nearEqual(sr2));
  assertTrue(sr1.equals(sr2));

  var sr3 = new ScreenRect(10, 10, 1000, 500);
  assertFalse(sr3.equals(sr1));
  assertFalse(sr3.nearEqual(sr1));

  assertThrows(() => new ScreenRect(0, 0, -100, 100));
};
