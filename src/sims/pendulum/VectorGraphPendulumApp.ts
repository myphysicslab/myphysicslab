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

import { AbstractApp } from '../common/AbstractApp.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConcreteLine } from '../../lab/model/ConcreteLine.js';
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DrawingMode } from '../../lab/view/DrawingMode.js';
import { GenericObserver, SubjectEvent, Subject, SubjectList } from '../../lab/util/Observe.js';
import { Layout, ElementIDs } from '../common/Layout.js';
import { ParameterNumber } from '../../lab/util/Observe.js';
import { PendulumSim } from './PendulumSim.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { TabLayout3 } from '../common/TabLayout3.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { VectorGraph } from '../../lab/graph/VectorGraph.js';

/** Displays the {@link PendulumSim} simulation with a {@link VectorGraph}.
*/
export class VectorGraphPendulumApp extends AbstractApp<PendulumSim> implements Subject, SubjectList {
  rod: DisplayLine;
  bob: DisplayShape;
  vectorGraph: VectorGraph;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-2, -2.2, 2, 1.5);
  const sim = new PendulumSim();
  const advance = new SimpleAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  sim.setDriveAmplitude(0);
  sim.setDamping(0);
  sim.setGravity(9.8);
  sim.setLength(1);

  this.rod = new DisplayLine(this.simList.getConcreteLine('rod'));
  this.displayList.add(this.rod);
  this.bob = new DisplayShape(this.simList.getPointMass('bob'));
  this.bob.setFillStyle('blue');
  this.displayList.add(this.bob);

  this.graph.line.setDrawingMode(DrawingMode.LINES);
  this.vectorGraph = new VectorGraph(sim, /*xVariable=*/0, /*yVariable=*/1);
  this.vectorGraph.setScreenRect(this.graph.view.getScreenRect());
  // the VectorGraph overlays the regular DisplayGraph
  this.graph.displayList.add(this.vectorGraph);

  // remove the VectorGraph when the variables are any other than
  // the specific 2 variables it works with.
  new GenericObserver(this.graph.line, (_evt: SubjectEvent) => {
    const yVar = this.graph.line.getYVariable();
    const xVar = this.graph.line.getXVariable();
    const isOK = yVar == 1 && xVar == 0;
    const isVis = this.graph.displayList.contains(this.vectorGraph);
    if (isOK && !isVis) {
      this.graph.displayList.add(this.vectorGraph);
    } else if (!isOK && isVis) {
      this.graph.displayList.remove(this.vectorGraph);
    }
  }, 'remove VectorGraph when other variables shown');

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(PendulumSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0.1, 10.1, /*multiply=*/true));

  pn = sim.getParameterNumber(PendulumSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(PendulumSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 20.2, /*multiply=*/true));

  pn = sim.getParameterNumber(PendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', bob: '+this.bob.toStringShort()
      +', rod: '+this.rod.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'VectorGraphPendulumApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('rod|bob',
      myName+'.');
};

/** @inheritDoc */
override makeLayout(elem_ids: ElementIDs): Layout {
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  const canvasWidth = 800;
  const canvasHeight = Math.round(canvasWidth * this.simRect.getHeight() /
      this.simRect.getWidth());
  return new TabLayout3(elem_ids, canvasWidth, canvasHeight);
};

} // end class
Util.defineGlobal('sims$pendulum$VectorGraphPendulumApp', VectorGraphPendulumApp);
