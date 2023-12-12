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
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CollideSpringSim } from './CollideSpringSim.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { Observer, ParameterNumber, Subject, SubjectList, SubjectEvent } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';

/** Displays the {@link CollideSpringSim} simulation.
*/
export class CollideSpringApp extends AbstractApp<CollideSpringSim> implements Subject, SubjectList, Observer {

  private startPosition: number = CollideSpringSim.START_MIDDLE;
  private numBlocks: number = 3;
  /* Gap between objects in starting position */
  private startGap: number = 0.1;
  protoBlock: DisplayShape = new DisplayShape();
  protoWall: DisplayShape = new DisplayShape();
  protoSpring: DisplaySpring = new DisplaySpring();

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-6.4, -2, 6.4, 2);
  const sim = new CollideSpringSim();
  const advance = new SimpleAdvance(sim);

  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim);

  this.layout.getSimCanvas().setBackground('black');
  this.protoBlock.setFillStyle('blue');
  this.protoWall.setFillStyle('lightGray');
  this.protoSpring.setWidth(0.3);
  this.protoSpring.setColorCompressed('#0c0');
  this.protoSpring.setColorExpanded('#6f6');

  // The observe() method will make DisplayObjects in response to seeing SimObjects
  // being added to the SimList.  Important that no SimObjects were added prior.
  Util.assert(this.simList.length() == 0);
  this.simList.addObserver(this);
  this.sim.config(this.numBlocks, this.startPosition, this.startGap);

  // smaller time step results in nearly-stationary blocks
  this.simRun.setTimeStep(0.0025);

  this.addPlaybackControls();
  let pn: ParameterNumber;
  this.addParameter(pn = new ParameterNumber(this, CollideSpringSim.en.NUM_BLOCKS,
      CollideSpringSim.i18n.NUM_BLOCKS,
      () => this.getNumBlocks(), a => this.setNumBlocks(a)));
  pn.setDecimalPlaces(0);
  pn.setLowerLimit(1);
  pn.setUpperLimit(3);
  this.addControl(new SliderControl(pn, 1, 3, /*multiply=*/false));

  this.addParameter(pn = new ParameterNumber(this, CollideSpringSim.en.START_POSITION,
      CollideSpringSim.i18n.START_POSITION,
      () => this.getStartPosition(), a => this.setStartPosition(a),
      /*choices=*/[CollideSpringSim.i18n.START_IN_MIDDLE,
      CollideSpringSim.i18n.START_ON_WALL],
      /*values=*/[CollideSpringSim.START_MIDDLE, CollideSpringSim.START_ON_WALL]));
  this.addControl(new ChoiceControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CollideSpringSim.en.START_GAP,
      CollideSpringSim.i18n.START_GAP,
      () => this.getStartGap(), a => this.setStartGap(a)));
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(CollideSpringSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(CollideSpringSim.en.SPRING_DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(CollideSpringSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 50.2, /*multiply=*/true));

  pn = sim.getParameterNumber(CollideSpringSim.en.SPRING_LENGTH);
  this.addControl(new SliderControl(pn, 0, 1.5, /*multiply=*/false));

  pn = sim.getParameterNumber(CollideSpringSim.en.SPRING_STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();

  // vars: 0   1   2   3   4   5   6   7   8   9
  //     time  KE PE  TE  U0  V0  U1  V1  U2  V2
  pn = this.timeGraph.line1.getParameterNumber('y-variable');
  pn.setValue(1); // kinetic energy
  pn = this.timeGraph.line2.getParameterNumber('y-variable');
  pn.setValue(2); // potential energy
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', startGap: '+Util.NF(this.startGap)
      +', numBlocks: '+Util.NF(this.numBlocks)
      +', startPosition: '+Util.NF(this.startPosition)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'CollideSpringApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('protoBlock|protoWall|protoSpring',
      myName+'.');
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
    const rm = obj as PointMass;
    const proto = rm.getName().match(/^WALL/) ? this.protoWall : this.protoBlock;
    this.displayList.add(new DisplayShape(rm, proto));
  } else if (obj instanceof Spring) {
    const s = obj as Spring;
    this.displayList.add(new DisplaySpring(s, this.protoSpring));
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

/** Return gap between objects in starting position
@return gap between objects in starting position
*/
getStartGap(): number {
  return this.startGap;
};

/** Set gap between objects in starting position
@param value gap between objects in starting position
*/
setStartGap(value: number) {
  if (value != this.startGap) {
    this.startGap = value;
    this.sim.config(this.numBlocks, this.startPosition, this.startGap);
    this.broadcastParameter(CollideSpringSim.en.START_GAP);
    this.easyScript.update();
  }
};

/**
*/
getNumBlocks(): number {
  return this.numBlocks;
};

/**
* @param value
*/
setNumBlocks(value: number) {
  value = Math.floor(value+0.5);
  if (this.numBlocks != value) {
    this.numBlocks = value;
    this.sim.config(this.numBlocks, this.startPosition, this.startGap);
    this.broadcastParameter(CollideSpringSim.en.NUM_BLOCKS);
    this.easyScript.update();
  }
};

/**
*/
getStartPosition(): number {
  return this.startPosition;
};

/**
* @param value
*/
setStartPosition(value: number) {
  if (this.startPosition != value) {
    this.startPosition = value;
    this.sim.config(this.numBlocks, this.startPosition, this.startGap);
    this.broadcastParameter(CollideSpringSim.en.START_POSITION);
    this.easyScript.update();
  }
};

} // end class
