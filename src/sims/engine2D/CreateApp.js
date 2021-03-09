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

goog.module('myphysicslab.sims.engine2D.CreateApp');

const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const Arc = goog.require('myphysicslab.lab.model.Arc');
const AutoScale = goog.require('myphysicslab.lab.graph.AutoScale');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const CircularEdge = goog.require('myphysicslab.lab.engine2D.CircularEdge');
const Clock = goog.require('myphysicslab.lab.util.Clock');
const ClockTask = goog.require('myphysicslab.lab.util.ClockTask');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ConcreteVertex = goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
const ConstantForceLaw = goog.require('myphysicslab.lab.model.ConstantForceLaw');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DisplayClock = goog.require('myphysicslab.lab.view.DisplayClock');
const DisplayGraph = goog.require('myphysicslab.lab.graph.DisplayGraph');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DisplayText = goog.require('myphysicslab.lab.view.DisplayText');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const EnergyBarGraph = goog.require('myphysicslab.lab.graph.EnergyBarGraph');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const ExpressionVariable = goog.require('myphysicslab.lab.model.ExpressionVariable');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const Force = goog.require('myphysicslab.lab.model.Force');
const ForceLaw = goog.require('myphysicslab.lab.model.ForceLaw');
const GraphLine = goog.require('myphysicslab.lab.graph.GraphLine');
const Gravity2Law = goog.require('myphysicslab.lab.model.Gravity2Law');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const Joint = goog.require('myphysicslab.lab.engine2D.Joint');
const JointUtil = goog.require('myphysicslab.lab.engine2D.JointUtil');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const Line = goog.require('myphysicslab.lab.model.Line');
const ModifiedEuler = goog.require('myphysicslab.lab.model.ModifiedEuler');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const RungeKutta = goog.require('myphysicslab.lab.model.RungeKutta');
const ScreenRect = goog.require('myphysicslab.lab.view.ScreenRect');
const Scrim = goog.require('myphysicslab.lab.engine2D.Scrim');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const SimView = goog.require('myphysicslab.lab.view.SimView');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const StraightEdge = goog.require('myphysicslab.lab.engine2D.StraightEdge');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const ThrusterSet = goog.require('myphysicslab.lab.engine2D.ThrusterSet');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

const CardioidPath = goog.require('myphysicslab.sims.roller.CardioidPath');
const CirclePath = goog.require('myphysicslab.sims.roller.CirclePath');
const DisplayPath = goog.require('myphysicslab.lab.view.DisplayPath');
const FlatPath = goog.require('myphysicslab.sims.roller.FlatPath');
const HumpPath = goog.require('myphysicslab.sims.roller.HumpPath');
const LemniscatePath = goog.require('myphysicslab.sims.roller.LemniscatePath');
const LoopTheLoopPath = goog.require('myphysicslab.sims.roller.LoopTheLoopPath');
const NumericalPath = goog.require('myphysicslab.lab.model.NumericalPath');
const OvalPath = goog.require('myphysicslab.sims.roller.OvalPath');
const ParametricPath = goog.require('myphysicslab.lab.model.ParametricPath');
const PathEndPoint = goog.require('myphysicslab.lab.engine2D.PathEndPoint');
const PathJoint = goog.require('myphysicslab.lab.engine2D.PathJoint');
const SpiralPath = goog.require('myphysicslab.sims.roller.SpiralPath');

/** CreateApp makes it easier for users to create their own simulation via scripting.
CreateApp provides an editor text field for the script that is being run, and an
execute button to re-run the script.
Intended for scripting, this provides a ContactSim but no RigidBody objects or
ForceLaws. The RigidBody objects and ForceLaws should be created via scripting such as
a URL-script; see {@link Terminal}.
*/
class CreateApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  //this.addPlaybackControls();
  //this.addStandardControls();
  this.makeEasyScript();
  this.graphSetup();
  this.terminal.addRegex('CardioidPath|CirclePath|DisplayPath|FlatPath|HumpPath'+
      '|LemniscatePath|LoopTheLoopPath|OvalPath|SpiralPath',
     'mpl$$sims$$roller$$', /*addToVars=*/false);
  /**@type {!HTMLTextAreaElement}*/
  this.editor_ = /**@type {!HTMLTextAreaElement}*/(document.getElementById('editor'));
  const b = /**@type {!HTMLButtonElement}*/(document.getElementById('execute_button'));
  const bc = new ButtonControl('execute', ()=>this.terminal.eval(this.editor_.value), undefined, b);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @override */
getClassName() {
  return 'CreateApp';
};

/** @override */
start() {
  this.simRun.pause();
  this.simRun.startFiring();
  this.terminal.eval(this.editor_.value);
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!CreateApp}
*/
function makeCreateApp(elem_ids) {
  return new CreateApp(elem_ids);
};
goog.exportSymbol('makeCreateApp', makeCreateApp);

exports = CreateApp;
