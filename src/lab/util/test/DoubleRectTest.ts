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

import { DoubleRect } from "../DoubleRect.js";
import { Vector } from "../Vector.js";
import { MutableVector } from "../MutableVector.js";
import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals }
    from "../../../test/TestRig.js";

const groupName = 'DoubleRectTest.';

export default function scheduleTests() {
  schedule(testDoubleRect);
};

function testDoubleRect() {
  startTest(groupName+'testDoubleRect');

  const r1 = new DoubleRect(/*left=*/-5, /*bottom=*/-6, /*right=*/5, /*top=*/6);
  assertEquals(-5, r1.getLeft());
  assertEquals(5, r1.getRight());
  assertEquals(-6, r1.getBottom());
  assertEquals(6, r1.getTop());
  assertEquals(10, r1.getWidth());
  assertEquals(12, r1.getHeight());
  assertEquals(0, r1.getCenterX());
  assertEquals(0, r1.getCenterY());

  const r2 = DoubleRect.makeCentered(Vector.ORIGIN, /*width=*/2, /*height=*/2);
  assertEquals(-1, r2.getLeft());
  assertEquals(1, r2.getRight());
  assertEquals(-1, r2.getBottom());
  assertEquals(1, r2.getTop());
  assertEquals(2, r2.getWidth());
  assertEquals(2, r2.getHeight());
  assertTrue(r2.contains(Vector.ORIGIN));
  assertTrue(r2.contains(new Vector(0.9, 0.9)));

  const r3 = DoubleRect.clone(r2);
  assertTrue(r2.nearEqual(r3));
  assertTrue(r2.nearEqual(r3, 1E-16));
  assertTrue(r2.equals(r3));

  const r4 = r2.translate(1E-15, 1E-15);
  assertTrue(r2.nearEqual(r4));
  assertFalse(r2.nearEqual(r4, 1E-16));
  assertFalse(r2.equals(r4));

  const r5 = r2.translate(2E-14, 2E-14);
  assertFalse(r2.nearEqual(r5));
  assertTrue(r2.nearEqual(r5, 1E-13));
  assertFalse(r2.equals(r5));

  const r6 = r2.translate(3, -3);
  assertEquals(2, r6.getLeft());
  assertEquals(4, r6.getRight());
  assertEquals(-4, r6.getBottom());
  assertEquals(-2, r6.getTop());
  assertEquals(3, r6.getCenterX());
  assertEquals(-3, r6.getCenterY());
  assertEquals(2, r6.getWidth());
  assertEquals(2, r6.getHeight());

  const r7 = r6.union(r2);
  assertEquals(5, r7.getWidth());
  assertEquals(5, r7.getHeight());
  assertEquals(-1, r7.getLeft());
  assertEquals(4, r7.getRight());
  assertEquals(-4, r7.getBottom());
  assertEquals(1, r7.getTop());

  const r8 = r2.scale(0.5);
  assertRoughlyEquals(1, r8.getWidth(), 1E-15);
  assertRoughlyEquals(1, r8.getHeight(), 1E-15);
  assertRoughlyEquals(-0.5, r8.getLeft(), 1E-15);
  assertRoughlyEquals(0.5, r8.getRight(), 1E-15);
  assertRoughlyEquals(-0.5, r8.getBottom(), 1E-15);
  assertRoughlyEquals(0.5, r8.getTop(), 1E-15);

  const r9 = r2.translate(new Vector(3, -3));
  assertTrue(r9.equals(r6));

  const r10 = r2.unionPoint(new Vector(4, -4));
  assertTrue(r10.equals(r7));

  const r11 = DoubleRect.makeCentered2(new Vector(2, -2), new Vector(3, 1));
  assertEquals(3, r11.getWidth());
  assertEquals(1, r11.getHeight());
  assertEquals(0.5, r11.getLeft());
  assertEquals(3.5, r11.getRight());
  assertEquals(-2.5, r11.getBottom());
  assertEquals(-1.5, r11.getTop());

  assertThrows(() => r2.translate(3));
  assertThrows(() => new DoubleRect(1, -1, -1, 1));
  assertThrows(() => new DoubleRect(-1, 1, 1, -1));
  assertThrows(() => new DoubleRect(-1, -1, 1, NaN));

  // infinite values are allowed
  const neg_inf = Number.NEGATIVE_INFINITY;
  const pos_inf = Number.POSITIVE_INFINITY;
  const r12 = new DoubleRect(neg_inf, neg_inf, pos_inf, pos_inf);
  assertTrue(r12.contains(Vector.ORIGIN));
  const v1000 = new Vector(1000, 1000);
  assertTrue(r12.contains(v1000));
  const r13 = r12.translate(v1000);
  assertTrue(r13.equals(r12));

  const r14 = new DoubleRect(neg_inf, neg_inf, 1, 1);
  assertTrue(r14.contains(Vector.ORIGIN));
  assertFalse(r14.contains(new Vector(2, 2)));
  assertFalse(r14.contains(new Vector(0, 2)));

  assertTrue(r2.equals(r2.intersection(r1)));
  assertTrue(r2.intersection(r2.translate(10, 10)).isEmpty());
  const r15 = DoubleRect.makeCentered(Vector.ORIGIN, /*width=*/4, /*height=*/4);
  assertTrue(r15.intersection(r6).isEmpty());
  const r16 = new DoubleRect(-1, 1, 4, 3);
  assertTrue(r15.intersection(r16).nearEqual(new DoubleRect(-1, 1, 2, 2)));
};
