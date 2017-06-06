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

goog.provide('myphysicslab.sims.springs.TerminalSpringApp');

goog.require('myphysicslab.lab.app.SimController');
goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.LabControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.graph.EnergyBarGraph');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.DiffEqSolverSubject');
goog.require('myphysicslab.lab.model.ExpressionVariable');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.Clock');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.EasyScriptParser');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.VerticalLayout');
goog.require('myphysicslab.sims.springs.ChainOfSpringsSim');
goog.require('myphysicslab.sims.springs.CollideBlocksSim');
goog.require('myphysicslab.sims.springs.CollideSpringSim');
goog.require('myphysicslab.sims.springs.DangleStickSim');
goog.require('myphysicslab.sims.springs.Double2DSpringSim');
goog.require('myphysicslab.sims.springs.DoubleSpringSim');
goog.require('myphysicslab.sims.springs.Molecule1Sim');
goog.require('myphysicslab.sims.springs.Molecule3Sim');
goog.require('myphysicslab.sims.springs.SingleSpringSim');
goog.require('myphysicslab.sims.springs.Spring2DSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var Terminal = lab.util.Terminal;
var Util = lab.util.Util;
var VerticalLayout = sims.common.VerticalLayout;

/** Shows a simulation from the `springs` namespace by executing commands in Terminal.
This makes it easy to create and modify an app without needing Closure Compiler,
instead the author can just make a new HTML file which contains the Terminal script to
create all the parts of the app. The end user can see how the app was created by
looking at the Terminal output.

All the simulations in the namespace `myphysicslab.sims.springs` are included (assuming
this is compiled with simple compile, because advanced compile will strip out all
the simulations).

* @param {!VerticalLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @export
*/
myphysicslab.sims.springs.TerminalSpringApp = function(elem_ids) {
  Util.setErrorHandler();
  /** @type {!VerticalLayout} */
  this.layout = new VerticalLayout(elem_ids);
  /** @type {!Terminal} */
  this.terminal = this.layout.terminal;
};
var TerminalSpringApp = myphysicslab.sims.springs.TerminalSpringApp;

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'myApp.sim' when myName is 'myApp'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
TerminalSpringApp.prototype.defineNames = function(myName) {
  if (Util.ADVANCED)
    return;
  var t = this.terminal;
  t.addWhiteList(myName);
  t.addRegex('layout',
      myName);
  t.addRegex('terminal|simCanvas',
      myName+'.layout');
  t.addRegex('ChainOfSpringsSim|CollideBlocksSim|CollideSpringSim'
      +'|DangleStickSim|Double2DSpringSim|DoubleSpringSim|Molecule1Sim'
      +'|Molecule3Sim|SingleSpringSim|Spring2DSim',
      'myphysicslab.sims.springs', /*addToVars=*/false);
  t.addRegex('CommonControls',
      'myphysicslab.sims.common', /*addToVars=*/false);
};

/**
* @param {string} script
* @param {boolean=} opt_output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return {*}
* @export
*/
TerminalSpringApp.prototype.eval = function(script, opt_output) {
  try {
    return this.terminal.eval(script, opt_output);
  } catch(ex) {
    alert(ex);
  }
};

}); // goog.scope
