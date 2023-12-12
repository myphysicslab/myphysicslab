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

/** Runs several unit tests.
*/

import { schedule, startTests, runTests, finishTests } from "./TestRig.js";
import AbstractSubjTest from "../lab/util/test/AbstractSubjectTest.js";
import AffineTest from "../lab/util/test/AffineTransformTest.js";
import CalcTest from "../lab/util/test/CalculusTest.js";
import CircularEdgeTest from "../lab/engine2D/test/CircularEdgeTest.js";
import CircularListTest from "../lab/util/test/CircularListTest.js";
import ClockTest from "../lab/util/test/ClockTest.js";
import ConcreteLineTest from "../lab/model/test/ConcreteLineTest.js";
import ConcreteMemoListTest from "../lab/util/test/ConcreteMemoListTest.js";
import CoordMapTest from "../lab/view/test/CoordMapTest.js";
import DisplayListTest from "../lab/view/test/DisplayListTest.js";
import DisplayShapeTest from "../lab/view/test/DisplayShapeTest.js";
import DisplaySpringTest from "../lab/view/test/DisplaySpringTest.js";
import DoubleMathTest from "../lab/util/test/DoubleMathTest.js";
import DoublePendulumTest from "../sims/pendulum/test/DoublePendulumTest.js";
import DoubleRectTest from "../lab/util/test/DoubleRectTest.js";
import EasyScriptParserTest from "../lab/util/test/EasyScriptParserTest.js";
import EdgeSetTest from "../lab/engine2D/test/EdgeSetTest.js";
import EnergyInfoTest from "../lab/model/test/EnergyInfoTest.js";
import LabCanvasTest from "../lab/view/test/LabCanvasTest.js";
import MutableVectorTest from "../lab/util/test/MutableVectorTest.js";
import NumericalPathTest from "../lab/model/test/NumericalPathTest.js";
import ParameterBooleanTest from "../lab/util/test/ParameterBooleanTest.js";
import ParameterNumberTest from "../lab/util/test/ParameterNumberTest.js";
import ParameterStringTest from "../lab/util/test/ParameterStringTest.js";
import PointMassTest from "../lab/model/test/PointMassTest.js";
import PolygonTest from "../lab/engine2D/test/PolygonTest.js";
import RandomLCGTest from "../lab/util/test/RandomLCGTest.js";
import RigidBodySimTest from "../lab/engine2D/test/RigidBodySimTest.js";
import ScreenRectTest from "../lab/view/test/ScreenRectTest.js";
import SimListTest from "../lab/model/test/SimListTest.js";
import SimViewTest from "../lab/view/test/SimViewTest.js";
import SpringTest from "../lab/model/test/SpringTest.js";
import StraightEdgeTest from "../lab/engine2D/test/StraightEdgeTest.js";
import TerminalTest from "../lab/util/test/TerminalTest.js";
import TimerTest from "../lab/util/test/TimerTest.js";
import UtilEngineTest from "../lab/engine2D/test/UtilEngineTest.js";
import UtilTest from "../lab/util/test/UtilTest.js";
import VarsListTest from "../lab/model/test/VarsListTest.js";
import VectorTest from "../lab/util/test/VectorTest.js";
import VertexTest from "../lab/engine2D/test/VertexTest.js";

/** Runs several unit tests.

Unlike other tests, the makefile does not set `GOOG_DEBUG` to false for this test, so
`Util.DEBUG` should be true when this is compiled.
*/
export function runUnitTests() {
  startTests();

  AbstractSubjTest();
  AffineTest();
  CalcTest();
  CircularEdgeTest();
  CircularListTest();
  ClockTest();
  ConcreteLineTest();
  ConcreteMemoListTest();
  CoordMapTest();
  DisplayListTest();
  DisplayShapeTest();
  DisplaySpringTest();
  DoubleMathTest();
  DoublePendulumTest();
  DoubleRectTest();
  EasyScriptParserTest();
  EdgeSetTest();
  EnergyInfoTest();
  LabCanvasTest();
  MutableVectorTest();
  NumericalPathTest();
  ParameterBooleanTest();
  ParameterNumberTest();
  ParameterStringTest();
  PointMassTest();
  PolygonTest();
  RandomLCGTest();
  RigidBodySimTest();
  ScreenRectTest();
  SimListTest();
  SimViewTest();
  SpringTest();
  StraightEdgeTest();
  TerminalTest();
  TimerTest();
  UtilEngineTest();
  UtilTest();
  VarsListTest();
  VectorTest();
  VertexTest();

  schedule(finishTests);
  runTests();
};
