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
import { ElementIDs } from '../common/Layout.js';
import { CollideBlocksSim } from './CollideBlocksSim.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList, SubjectEvent } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Displays the {@link CollideBlocksSim} simulation.
*/
export class CollideBlocksApp extends AbstractApp<CollideBlocksSim> implements Subject, SubjectList {

  protoBlock: DisplayShape;
  protoWall: DisplayShape;
  protoSpring: DisplaySpring;
  block1: DisplayShape;
  block2: DisplayShape;
  wallLeft: DisplayShape;
  wallRight: DisplayShape;
  spring1: DisplaySpring;
  spring2: DisplaySpring;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-0.5, -2, 7.5, 2);
  const sim = new CollideBlocksSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  //this.advance.setDebugLevel(DebugLevel.OPTIMAL);

  this.protoBlock = new DisplayShape();
  this.protoBlock.setFillStyle('blue');
  this.protoWall = new DisplayShape();
  this.protoWall.setFillStyle('lightGray');
  this.protoSpring = new DisplaySpring();

  this.block1 = new DisplayShape(this.simList.getPointMass('block1'), this.protoBlock);
  this.displayList.add(this.block1);
  this.block2 = new DisplayShape(this.simList.getPointMass('block2'), this.protoBlock);
  this.displayList.add(this.block2);
  this.wallLeft = new DisplayShape(this.simList.getPointMass('wallLeft'),
      this.protoWall);
  this.displayList.add(this.wallLeft);
  this.wallRight = new DisplayShape(this.simList.getPointMass('wallRight'),
      this.protoWall);
  this.displayList.add(this.wallRight);
  this.spring1 = new DisplaySpring(this.simList.getSpring('spring1'), this.protoSpring);
  this.displayList.add(this.spring1);
  this.spring2 = new DisplaySpring(this.simList.getSpring('spring2'), this.protoSpring);
  this.displayList.add(this.spring2);

  this.addPlaybackControls();
  let pn = sim.getParameterNumber(CollideBlocksSim.en.MASS_1);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.MASS_2);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.DAMPING);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.STIFFNESS_1);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.LENGTH_1);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.STIFFNESS_2);
  this.addControl(new NumericControl(pn));
  pn = sim.getParameterNumber(CollideBlocksSim.en.LENGTH_2);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.graph.line.setXVariable(0);
  this.graph.line.setYVariable(2);
  this.timeGraph.line1.setYVariable(0);
  this.timeGraph.line2.setYVariable(2);
  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', block1: '+this.block1.toStringShort()
      +', block2: '+this.block2.toStringShort()
      +', wallLeft: '+this.wallLeft.toStringShort()
      +', wallRight: '+this.wallRight.toStringShort()
      +', spring1: '+this.spring1.toStringShort()
      +', spring2: '+this.spring2.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'CollideBlocksApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('block1|block2|wallLeft|wallRight|spring1|spring2'
      +'|protoBlock|protoWall|protoSpring',
      myName+'.');
};

} // end class
