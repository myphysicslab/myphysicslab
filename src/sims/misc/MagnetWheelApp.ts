// Copyright 2020 Erik Neumann.  All Rights Reserved.
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
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { CommonControls } from '../common/CommonControls.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayMagnetWheel } from './DisplayMagnetWheel.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { EnergySystem, EnergyInfo } from '../../lab/model/EnergySystem.js';
import { Force } from '../../lab/model/Force.js';
import { GenericMemo } from '../../lab/util/Memo.js';
import { MagnetWheel } from './MagnetWheel.js';
import { MagnetWheelSim } from './MagnetWheelSim.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { Observer, ParameterBoolean, ParameterNumber, SubjectEvent, Subject, SubjectList } from '../../lab/util/Observe.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimpleAdvance } from '../../lab/model/SimpleAdvance.js';
import { SliderControl } from '../../lab/controls/SliderControl.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Displays the {@link MagnetWheelSim} simulation.
*/
export class MagnetWheelApp extends AbstractApp<MagnetWheelSim> implements Subject, Observer, SubjectList {
  magnetWheel: MagnetWheel;
  dispWheel: DisplayMagnetWheel;
  private numMagnets_: number = 12;
  /** Symmetric arrangement of magnets spaces them evenly around circle.
  * Unsymmetric arrangement spaces them by this.angle_.
  */
  private symmetric_: boolean = true;
  /** Angle between magnets in degrees, used when symmetric flag is false. */
  private magnetAngle_: number = 25;
  private magnetAngleControl_: NumericControl;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param opt_name name of this as a Subject
*/
constructor(elem_ids: ElementIDs, opt_name?: string) {
  Util.setErrorHandler();
  const simRect = new DoubleRect(-3, -2, 3, 2);
  const sim = new MagnetWheelSim();
  sim.getVarsList().setValue(1, 3); // set initial angular velocity
  const advance = new SimpleAdvance(sim);
  // Set smaller time step, because the interaction when magnets are close is
  // very strong and fast.
  advance.setTimeStep(0.01);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim, opt_name);

  this.magnetWheel = sim.getMagnetWheel();
  this.magnetWheel.setMass(5);
  this.makeMagnets();

  this.dispWheel = new DisplayMagnetWheel(this.magnetWheel);
  this.displayList.add(this.dispWheel);

  this.sim.getSimList().addObserver(this);
  this.addPlaybackControls();

  let pn: ParameterNumber;
  pn = sim.getParameterNumber(MagnetWheelSim.en.MASS);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(MagnetWheelSim.en.DAMPING);
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(MagnetWheelSim.en.MAGNET_STRENGTH);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MagnetWheelSim.en.NUM_MAGNETS,
      MagnetWheelSim.i18n.NUM_MAGNETS,
      () => this.getNumMagnets(), a => this.setNumMagnets(a))
      .setDecimalPlaces(0));
  this.addControl(new SliderControl(pn, 1, 12, /*multiply=*/false));

  let pb: ParameterBoolean;
  this.addParameter(pb = new ParameterBoolean(this, MagnetWheelSim.en.SYMMETRIC,
      MagnetWheelSim.i18n.SYMMETRIC,
      () => this.getSymmetric(), a => this.setSymmetric(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, MagnetWheelSim.en.MAGNET_ANGLE,
      MagnetWheelSim.i18n.MAGNET_ANGLE,
      () => this.getMagnetAngle(), a => this.setMagnetAngle(a))
      .setDecimalPlaces(1));
  this.magnetAngleControl_ = new NumericControl(pn);
  this.magnetAngleControl_.setEnabled(!this.symmetric_);
  this.addControl(this.magnetAngleControl_);

  pn = sim.getParameterNumber(EnergyInfo.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();

  // turn off the clock quickly, for debugging.
  /*const memo = new GenericMemo( () => {
    if (this.sim.getTime() > 0.1) {
      this.simRun.pause();
    }
  });
  this.simRun.addMemo(memo);
  */
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', dispWheel: '+this.dispWheel.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'MagnetWheelApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('magnetWheel|dispWheel',
      myName+'.');
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.sim.getSimList()) {
    const obj = event.getValue() as SimObject;
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      if (this.displayList.find(obj)) {
        // we already have a DisplayObject for this SimObject, don't add a new one.
        return;
      }
      if (obj instanceof Force) {
        const dl = new DisplayLine(obj).setThickness(1);
        dl.setColor('blue');
        dl.setZIndex(10);
        this.displayList.add(dl);
      }
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
getNumMagnets(): number {
  return this.numMagnets_;
};

/**
@param value
*/
setNumMagnets(value: number): void {
  value = Math.floor(value);
  if (value < 1 || value >12) {
    throw 'number of magnets must be from 1 to 12';
  }
  this.numMagnets_ = value;
  this.makeMagnets();
  this.broadcastParameter(MagnetWheelSim.en.NUM_MAGNETS);
};

/**
*/
getSymmetric(): boolean {
  return this.symmetric_;
};

/**
* @param value
*/
setSymmetric(value: boolean): void {
  this.symmetric_ = value;
  this.makeMagnets();
  this.magnetAngleControl_.setEnabled(!this.symmetric_);
  this.broadcastParameter(MagnetWheelSim.en.SYMMETRIC);
};

/**
*/
getMagnetAngle(): number {
  return this.magnetAngle_;
};

/**
@param value
*/
setMagnetAngle(value: number): void {
  if (value < 1 || value >360) {
    throw 'magnet angle must be from 1 to 360';
  }
  this.magnetAngle_ = value;
  this.makeMagnets();
  this.broadcastParameter(MagnetWheelSim.en.MAGNET_ANGLE);
};


/** Makes magnets according to current parameters.
*/
private makeMagnets(): void {
  const magnets = [];
  const n = this.numMagnets_;
  const r = this.magnetWheel.getRadius() * 0.85;
  for (let i = 0; i<n; i++) {
    const a = i * 2*Math.PI * (this.symmetric_ ? 1/n : this.magnetAngle_/360);
    magnets.push(new Vector(r * Math.cos(a), r * Math.sin(a)));
  }
  this.magnetWheel.setMagnets(magnets);
};

} // end class
