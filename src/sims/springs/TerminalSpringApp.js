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

goog.module('myphysicslab.sims.springs.TerminalSpringApp');

const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const Util = goog.require('myphysicslab.lab.util.Util');
const VerticalLayout = goog.require('myphysicslab.sims.common.VerticalLayout');

// following are only required for possible use in Terminal
const SimController = goog.require('myphysicslab.lab.app.SimController');
const SimRunner = goog.require('myphysicslab.lab.app.SimRunner');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const EnergyBarGraph = goog.require('myphysicslab.lab.graph.EnergyBarGraph');
const DisplayAxes = goog.require('myphysicslab.lab.graph.DisplayAxes');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const DiffEqSolverSubject = goog.require('myphysicslab.lab.model.DiffEqSolverSubject');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const Clock = goog.require('myphysicslab.lab.util.Clock');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const EasyScriptParser = goog.require('myphysicslab.lab.util.EasyScriptParser');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const DisplayClock = goog.require('myphysicslab.lab.view.DisplayClock');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const SimView = goog.require('myphysicslab.lab.view.SimView');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ChainOfSpringsSim = goog.require('myphysicslab.sims.springs.ChainOfSpringsSim');
const CollideBlocksSim = goog.require('myphysicslab.sims.springs.CollideBlocksSim');
const CollideSpringSim = goog.require('myphysicslab.sims.springs.CollideSpringSim');
const DangleStickSim = goog.require('myphysicslab.sims.springs.DangleStickSim');
const Double2DSpringSim = goog.require('myphysicslab.sims.springs.Double2DSpringSim');
const DoubleSpringSim = goog.require('myphysicslab.sims.springs.DoubleSpringSim');
const Molecule1Sim = goog.require('myphysicslab.sims.springs.Molecule1Sim');
const Molecule3Sim = goog.require('myphysicslab.sims.springs.Molecule3Sim');
const SingleSpringSim = goog.require('myphysicslab.sims.springs.SingleSpringSim');
const Spring2DSim = goog.require('myphysicslab.sims.springs.Spring2DSim');
const VarsHistory = goog.require('myphysicslab.lab.graph.VarsHistory');
const ExpressionVariable = goog.require('myphysicslab.lab.model.ExpressionVariable');
const FunctionVariable = goog.require('myphysicslab.lab.model.FunctionVariable');
const ClockTask = goog.require('myphysicslab.lab.util.ClockTask');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const DisplayText = goog.require('myphysicslab.lab.view.DisplayText');

/** Shows a simulation from the `springs` namespace by executing commands in Terminal.
This makes it easy to create and modify an app without needing Closure Compiler,
instead the author can just make a new HTML file which contains the Terminal script to
create all the parts of the app. The end user can see how the app was created by
looking at the Terminal output.

All the simulations in the namespace `myphysicslab.sims.springs` are included (assuming
this is compiled with simple compile, because advanced compile will strip out all
the simulations).
*/
class TerminalSpringApp {
/**
* @param {!Object} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  /** @type {!VerticalLayout} */
  this.layout = new VerticalLayout(elem_ids);
  /** @type {!Terminal} */
  this.terminal = this.layout.getTerminal();
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'myApp.sim' when myName is 'myApp'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
defineNames(myName) {
  if (Util.ADVANCED)
    return;
  const t = this.terminal;
  t.addWhiteList(myName);
  t.addRegex('layout',
      myName+'.');
  t.addRegex('terminal|simCanvas',
      myName+'.layout.');
  t.addRegex('ChainOfSpringsSim|CollideBlocksSim|CollideSpringSim'
      +'|DangleStickSim|Double2DSpringSim|DoubleSpringSim|Molecule1Sim'
      +'|Molecule3Sim|SingleSpringSim|Spring2DSim',
      'sims$$springs$$', /*addToVars=*/false);
  t.addRegex('CommonControls',
      'sims$$common$$', /*addToVars=*/false);
};

/**
* @param {string} script
* @param {boolean=} opt_output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return {*}
* @export
*/
eval(script, opt_output) {
  try {
    return this.terminal.eval(script, opt_output);
  } catch(ex) {
    this.terminal.alertOnce(ex);
  }
};

} // end class

/**
* @param {!Object} elem_ids
* @return {!TerminalSpringApp}
*/
function makeTerminalSpringApp(elem_ids) {
  return new TerminalSpringApp(elem_ids);
};
goog.exportSymbol('makeTerminalSpringApp', makeTerminalSpringApp);

exports = TerminalSpringApp;
