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

import { AutoScale } from "../../lab/graph/AutoScale.js";
import { ButtonControl } from "../../lab/controls/ButtonControl.js"
import { ChainOfSpringsSim } from './ChainOfSpringsSim.js';
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { Clock, ClockTask } from '../../lab/util/Clock.js';
import { CollideBlocksSim } from './CollideBlocksSim.js';
import { CollideSpringSim } from './CollideSpringSim.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { DangleStickSim } from './DangleStickSim.js';
import { DiffEqSolverSubject } from '../../lab/model/DiffEqSolverSubject.js';
import { DisplayAxes } from '../../lab/graph/DisplayAxes.js';
import { DisplayClock } from '../../lab/view/DisplayClock.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DisplayText } from '../../lab/view/DisplayText.js';
import { Double2DSpringSim } from './Double2DSpringSim.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DoubleSpringSim } from './DoubleSpringSim.js';
import { DrawingMode } from '../../lab/view/DrawingMode.js';
import { EasyScriptParser } from '../../lab/util/EasyScriptParser.js';
import { ElementIDs } from '../common/Layout.js';
import { EnergyBarGraph } from '../../lab/graph/EnergyBarGraph.js';
import { FunctionVariable } from '../../lab/model/FunctionVariable.js';
import { GenericMemo } from '../../lab/util/Memo.js';
import { GenericObserver } from '../../lab/util/Observe.js';
import { LabControl } from '../../lab/controls/LabControl.js';
import { MoleculeSim } from './MoleculeSim.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimController } from '../../lab/app/SimController.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SimView } from '../../lab/view/SimView.js';
import { SingleSpringSim } from './SingleSpringSim.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { SpringNonLinear1 } from './SpringNonLinear1.js';
import { SpringNonLinear2 } from './SpringNonLinear2.js';
import { Spring2DSim } from './Spring2DSim.js';
import { StandardGraph1 } from '../common/StandardGraph1.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { Util } from '../../lab/util/Util.js';
import { VarsHistory } from '../../lab/graph/VarsHistory.js';
import { Vector } from '../../lab/util/Vector.js';
import { VerticalLayout } from '../common/VerticalLayout.js';

/** Sets up a {@link VerticalLayout} and loads classes to be ready to show a simulation
from the `springs` namespace. JavaScript commands can be executed via {@link Terminal}
to create the simulation. Those Terminal commands can be specified in an HTML file, or
interactively via the Terminal interface.
*/
export class TerminalSpringApp {

  layout: VerticalLayout;
  terminal: Terminal;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  this.layout = new VerticalLayout(elem_ids);
  this.terminal = this.layout.getTerminal();
};

/** Define short-cut name replacement rules.  For example 'sim' is replaced
* by 'myApp.sim' when myName is 'myApp'.
* @param myName  the name of this object, valid in global Javascript context.
*/
defineNames(myName: string) {
  const t = this.terminal;
  t.addRegex('layout',
      myName+'.');
  t.addRegex('terminal|simCanvas',
      myName+'.layout.');
  t.addRegex('ChainOfSpringsSim|CollideBlocksSim|CollideSpringSim'
      +'|DangleStickSim|Double2DSpringSim|DoubleSpringSim|Molecule1Sim'
      +'|Molecule3Sim|SingleSpringSim|Spring2DSim|SpringNonLinear1'
      +'|SpringNonLinear2',
      'sims$$springs$$', /*addToVars=*/false);
  t.addRegex('CommonControls|StandardGraph1',
      'sims$$common$$', /*addToVars=*/false);
};

/**
* @param script
* @param output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @return the result of evaluating the string
*/
eval(script: string, output: boolean = true): any {
  return this.terminal.eval(script, output);
};


/** Force classes to be bundled (by esbuild), so they can be used in Terminal
* scripts.
*/
static loadClass(): void {
  var f = AutoScale.toString;
  f = ButtonControl.toString;
  f = ChainOfSpringsSim.toString;
  f = CheckBoxControl.toString;
  f = ChoiceControl.toString;
  f = CollideBlocksSim.toString;
  f = CollideSpringSim.toString;
  f = DangleStickSim.toString;
  f = DisplayAxes.toString;
  f = DisplayClock.toString;
  f = DisplayShape.toString;
  f = DisplaySpring.toString;
  f = DisplayText.toString;
  f = DoubleRect.toString;
  f = Double2DSpringSim.toString;
  f = DoubleSpringSim.toString;
  f = EnergyBarGraph.toString;
  f = MoleculeSim.toString;
  f = NumericControl.toString;
  f = SimController.toString;
  f = SimpleAdvance.toString;
  f = SimRunner.toString;
  f = SimView.toString;
  f = SingleSpringSim.toString;
  f = Spring.toString;
  f = Spring2DSim.toString;
  f = StandardGraph1.toString;
  f = SpringNonLinear1.toString;
  f = SpringNonLinear2.toString;
  var p = CommonControls.makeAxes;
};

} // end class
