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

import { AffineTransform } from '../../lab/util/AffineTransform.js';
import { Arc } from '../../lab/model/Arc.js';
import { AutoScale } from '../../lab/graph/AutoScale.js';
import { ButtonControl } from '../../lab/controls/ButtonControl.js';
import { CircularEdge } from '../../lab/engine2D/CircularEdge.js';
import { Clock, ClockTask } from '../../lab/util/Clock.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConcreteVertex } from '../../lab/engine2D/ConcreteVertex.js';
import { ConstantForceLaw } from '../../lab/model/ConstantForceLaw.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DisplayClock } from '../../lab/view/DisplayClock.js';
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DisplayText } from '../../lab/view/DisplayText.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { EnergyBarGraph } from '../../lab/graph/EnergyBarGraph.js';
import { Engine2DApp } from './Engine2DApp.js';
import { FunctionVariable } from '../../lab/model/FunctionVariable.js';
import { ExtraAccel } from '../../lab/engine2D/ExtraAccel.js';
import { Force } from '../../lab/model/Force.js';
import { ForceLaw } from '../../lab/model/ForceLaw.js';
import { GraphLine } from '../../lab/graph/GraphLine.js';
import { Gravity2Law } from '../../lab/model/Gravity2Law.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { HorizAlign } from '../../lab/view/HorizAlign.js';
import { Joint } from '../../lab/engine2D/Joint.js';
import { JointUtil } from '../../lab/engine2D/JointUtil.js';
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { Line } from '../../lab/model/Line.js';
import { ModifiedEuler } from '../../lab/model/ModifiedEuler.js';
import { ParameterBoolean, ParameterNumber, ParameterString, Subject, SubjectList } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { RandomLCG } from '../../lab/util/Random.js';
import { RungeKutta } from '../../lab/model/RungeKutta.js';
import { ScreenRect } from '../../lab/view/ScreenRect.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimView } from '../../lab/view/SimView.js';
import { Spring } from '../../lab/model/Spring.js';
import { StraightEdge } from '../../lab/engine2D/StraightEdge.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { ThrusterSet } from '../../lab/engine2D/ThrusterSet.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { VerticalAlign } from '../../lab/view/VerticalAlign.js';
import { Walls } from '../../lab/engine2D/Walls.js';

import { CardioidPath } from '../roller/CardioidPath.js';
import { CirclePath } from '../roller/CirclePath.js';
import { DisplayPath } from '../../lab/view/DisplayPath.js';
import { FlatPath } from '../roller/FlatPath.js';
import { HumpPath } from '../roller/HumpPath.js';
import { LemniscatePath } from '../roller/LemniscatePath.js';
import { LoopTheLoopPath } from '../roller/LoopTheLoopPath.js';
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { OvalPath } from '../roller/OvalPath.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';
import { PathEndPoint } from '../../lab/engine2D/PathEndPoint.js';
import { PathJoint } from '../../lab/engine2D/PathJoint.js';
import { SpiralPath } from '../roller/SpiralPath.js';

/** Intended for scripting, this provides a ContactSim with no RigidBody objects or
ForceLaws. The RigidBody objects and ForceLaws should be created via scripting such as
a URL-script; see {@link Terminal}.
*/
export class BlankApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.addPlaybackControls();
  //this.addStandardControls();
  this.makeEasyScript();
  this.graphSetup();
  this.terminal.addRegex('CardioidPath|CirclePath|DisplayPath|FlatPath|HumpPath'+
      '|LemniscatePath|LoopTheLoopPath|OvalPath|SpiralPath',
     'sims$$roller$$', /*addToVars=*/false);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'BlankApp';
};

/** @inheritDoc */
override start() {
  this.simRun.pause();
  this.simRun.startFiring();
};

/** Force classes to be bundled (by esbuild), so they can be used in Terminal
* scripts.
*/
static override loadClass(): void {
  super.loadClass();
  var s;
  s = CoordType.BODY;
  s = ExtraAccel.VELOCITY;
  s = VerticalAlign.TOP;
  s = HorizAlign.LEFT;
  var f = AffineTransform.toString;
  f = Arc.toString;
  f = AutoScale.toString;
  f = ButtonControl.toString;
  f = CardioidPath.toString;
  f = CirclePath.toString;
  f = CircularEdge.toString;
  f = Clock.toString;
  f = ClockTask.toString;
  f = CollisionAdvance.toString;
  f = CommonControls.toString;
  f = ConcreteVertex.toString;
  f = ConstantForceLaw.toString;
  f = ContactSim.toString;
  f = DampingLaw.toString;
  f = DisplayClock.toString;
  f = DisplayGraph.toString;
  f = DisplayLine.toString;
  f = DisplayPath.toString;
  f = DisplayShape.toString;
  f = DisplaySpring.toString;
  f = DisplayText.toString;
  f = DoubleRect.toString;
  f = EnergyBarGraph.toString;
  f = Engine2DApp.toString;
  f = FunctionVariable.toString;
  f = FlatPath.toString;
  f = Force.toString;
  f = GraphLine.toString;
  f = Gravity2Law.toString;
  f = GravityLaw.toString;
  f = HumpPath.toString;
  f = Joint.toString;
  f = JointUtil.toString;
  f = LabCanvas.toString;
  f = LemniscatePath.toString;
  f = LoopTheLoopPath.toString;
  f = ModifiedEuler.toString;
  f = NumericalPath.toString;
  f = OvalPath.toString;
  f = ParameterBoolean.toString;
  f = ParameterNumber.toString;
  f = ParameterString.toString;
  f = PathEndPoint.toString;
  f = PathJoint.toString;
  f = PointMass.toString;
  f = Polygon.toString;
  f = RandomLCG.toString;
  f = RungeKutta.toString;
  f = ScreenRect.toString;
  f = Scrim.toString;
  f = Shapes.toString;
  f = SimList.toString;
  f = SimView.toString;
  f = SpiralPath.toString;
  f = Spring.toString;
  f = StraightEdge.toString;
  f = Terminal.toString;
  f = ThrusterSet.toString;
  f = Util.toString;
  f = Vector.toString;
  f = Walls.toString;
};

} // end class
