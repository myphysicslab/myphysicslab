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
import { ButtonControl } from '../../lab/controls/ButtonControl.js';
import { ChainOfSpringsSim } from './ChainOfSpringsSim.js';
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DrawingMode } from '../../lab/view/DrawingMode.js';
import { EnergyInfo } from '../../lab/model/EnergySystem.js';
import { GraphLine } from '../../lab/graph/GraphLine.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { GenericObserver, Observer, ParameterBoolean, ParameterNumber, Subject, SubjectList, SubjectEvent } from '../../lab/util/Observe.js';
import { PointMass, ShapeType } from '../../lab/model/PointMass.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';

/** Displays the {@link ChainOfSpringsSim} simulation.
*/
export class ChainOfSpringsApp extends AbstractApp<ChainOfSpringsSim> implements Subject, SubjectList, Observer {

  numAtoms: number;
  attachRight: boolean;
  mySim: ChainOfSpringsSim;
  protoMass: DisplayShape;
  protoAnchor: DisplayShape;
  protoSpring: DisplaySpring;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param numAtoms number of chain links to make
* @param attachRight whether to attach to fixed block on right
*/
constructor(elem_ids: ElementIDs, numAtoms?: number, attachRight?: boolean) {
  Util.setErrorHandler();
  numAtoms = typeof numAtoms === 'number' ? numAtoms : 10;
  attachRight = attachRight !== undefined ? attachRight : true;
  const simRect = new DoubleRect(-6.4, -6, 6.4, 6);
  const sim = new ChainOfSpringsSim();
  sim.makeChain(numAtoms, attachRight);
  const advance = new SimpleAdvance(sim);

  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim);

  this.numAtoms = numAtoms;
  this.attachRight = attachRight;
  this.mySim = sim;

  this.protoMass = new DisplayShape();
  this.protoMass.setFillStyle('blue');
  this.protoAnchor = new DisplayShape();
  this.protoAnchor.setFillStyle('gray');
  this.protoSpring = new DisplaySpring();
  this.protoSpring.setWidth(0.3);
  this.protoSpring.setColorCompressed('#0c0');
  this.protoSpring.setColorExpanded('#6f6');
  this.protoSpring.setZIndex(-1);

  // Make DisplayObjects for all SimObjects currently on the SimList.
  this.simList.toArray().forEach(obj => this.addBody(obj));
  // The observe() method will make DisplayObjects in response to seeing
  // SimObjects being added to the SimList.
  this.simList.addObserver(this);

  this.addPlaybackControls();
  let pb: ParameterBoolean;
  let pn: ParameterNumber;

  this.addParameter(pn = new ParameterNumber(this, ChainOfSpringsSim.en.NUM_LINKS,
      ChainOfSpringsSim.i18n.NUM_LINKS,
      () => this.getNumLinks(), a => this.setNumLinks(a)));
  pn.setDecimalPlaces(0);
  this.addControl(new SliderControl(pn, 0, 30, /*multiply=*/false));

  this.addParameter(pb = new ParameterBoolean(this, ChainOfSpringsSim.en.ATTACH_RIGHT,
      ChainOfSpringsSim.i18n.ATTACH_RIGHT,
      () => this.getAttachRight(), a => this.setAttachRight(a)));
  this.addControl(new CheckBoxControl(pb));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 40, /*multiply=*/false));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.SPRING_DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 50.2, /*multiply=*/true));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  pn = sim.getParameterNumber(EnergyInfo.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  const bc = new ButtonControl(ChainOfSpringsSim.i18n.STRAIGHT_LINE,
      () => this.mySim.straightLine());
  this.addControl(bc);

  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  this.graph.line.setXVariable(9);
  this.graph.line.setYVariable(11);
  this.graph.line.setDrawingMode(DrawingMode.LINES);
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(2);

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', numAtoms: '+this.numAtoms
      +', attachRight: '+this.attachRight
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'ChainOfSpringsApp';
};

/**
@param obj
*/
private addBody(obj: SimObject) {
  if (this.displayList.find(obj)) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof PointMass) {
    const proto = obj.getShape() == ShapeType.OVAL ? this.protoMass : this.protoAnchor;
    this.displayList.add(new DisplayShape(obj, proto));
  } else if (obj instanceof Spring) {
    this.displayList.add(new DisplaySpring(obj, this.protoSpring));
  }
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.simList) {
    const obj = event.getValue() as SimObject;
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      const d = this.displayList.find(obj);
      if (d) {
        this.displayList.remove(d);
      }
    }
  }
};

/**
*/
getNumLinks(): number {
  return this.numAtoms;
};

/**
* @param value
*/
setNumLinks(value: number) {
  value = Math.floor(value+0.5);
  if (this.numAtoms != value) {
    this.numAtoms = value;
    this.mySim.makeChain(this.numAtoms, this.attachRight);
    this.broadcastParameter(ChainOfSpringsSim.en.NUM_LINKS);
    this.easyScript.update();
  }
};

/**
*/
getAttachRight(): boolean {
  return this.attachRight;
};

/**
* @param value
*/
setAttachRight(value: boolean) {
  if (this.attachRight != value) {
    this.attachRight = value;
    this.mySim.makeChain(this.numAtoms, this.attachRight);
    this.broadcastParameter(ChainOfSpringsSim.en.ATTACH_RIGHT);
    this.easyScript.update();
  }
};

} // end class
