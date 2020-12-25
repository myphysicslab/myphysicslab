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

goog.module('myphysicslab.sims.misc.MagnetWheelApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayLine = goog.require('myphysicslab.lab.view.DisplayLine');
const DisplayMagnetWheel = goog.require('myphysicslab.sims.misc.DisplayMagnetWheel');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const Force = goog.require('myphysicslab.lab.model.Force');
const GenericMemo = goog.require('myphysicslab.lab.util.GenericMemo');
const MagnetWheel = goog.require('myphysicslab.sims.misc.MagnetWheel');
const MagnetWheelSim = goog.require('myphysicslab.sims.misc.MagnetWheelSim');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays the {@link MagnetWheelSim} simulation.
* @implements {Observer}
*/
class MagnetWheelApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {string=} opt_name name of this as a Subject
*/
constructor(elem_ids, opt_name) {
  Util.setErrorHandler();
  console.log('compiled '+Util.COMPILE_TIME);
  var simRect = new DoubleRect(-3, -2, 3, 2);
  var sim = new MagnetWheelSim();
  sim.getVarsList().setValue(1, 3); // set initial angular velocity
  var advance = new SimpleAdvance(sim);
  // Set smaller time step, because the interaction when magnets are close is
  // very strong and fast.
  advance.setTimeStep(0.01);
  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim, opt_name);

  /**
  * @type {!MagnetWheel}
  * @private
  */
  this.magnetWheel_ = sim.getMagnetWheel();
  this.magnetWheel_.setMass(5);
  /**
  * @type {number}
  * @private
  */
  this.numMagnets_ = 12;
  /** Symmetric arrangement of magnets spaces them evenly around circle.
  * Unsymmetric arrangement spaces them by this.angle_.
  * @type {boolean}
  * @private
  */
  this.symmetric_ = true;
  /** Angle between magnets in degrees, used when symmetric flag is false.
  * @type {number}
  * @private
  */
  this.magnetAngle_ = 25;
  this.makeMagnets();

  /**
  * @type {!DisplayMagnetWheel}
  * @private
  */
  this.dispWheel_ = new DisplayMagnetWheel(this.magnetWheel_);
  this.displayList.add(this.dispWheel_);

  this.sim.getSimList().addObserver(this);
  this.addPlaybackControls();

  /** @type {!ParameterNumber} */
  var pn;
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

  /** @type {!ParameterBoolean} */
  var pb;
  this.addParameter(pb = new ParameterBoolean(this, MagnetWheelSim.en.SYMMETRIC,
      MagnetWheelSim.i18n.SYMMETRIC,
      () => this.getSymmetric(), a => this.setSymmetric(a)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, MagnetWheelSim.en.MAGNET_ANGLE,
      MagnetWheelSim.i18n.MAGNET_ANGLE,
      () => this.getMagnetAngle(), a => this.setMagnetAngle(a))
      .setDecimalPlaces(1));
  /**
  * @type {!NumericControl}
  * @private
  */
  this.magnetAngleControl_ = new NumericControl(pn);
  this.magnetAngleControl_.setEnabled(!this.symmetric_);
  this.addControl(this.magnetAngleControl_);

  pn = sim.getParameterNumber(EnergySystem.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();

  // turn off the clock quickly, for debugging.
  /*var memo = new GenericMemo( () => {
    if (this.sim.getTime() > 0.1) {
      this.simRun.pause();
    }
  });
  this.simRun.addMemo(memo);
  */
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', wheel: '+this.dispWheel_.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'MagnetWheelApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('wheel',
      myName+'.');
};

/** @override */
observe(event) {
  if (event.getSubject() == this.sim.getSimList()) {
    var obj = /** @type {!SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      if (this.displayList.find(obj) != null) {
        // we already have a DisplayObject for this SimObject, don't add a new one.
        return;
      }
      if (obj instanceof Force) {
        var line = /** @type {!Force} */(obj);
        var dl = new DisplayLine(line).setThickness(1);
        dl.setColor('blue');
        dl.setZIndex(10);
        this.displayList.add(dl);
      }
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      var d = this.displayList.find(obj);
      if (d != null) {
        this.displayList.remove(d);
      }
    }
  }
};

/**
@return {number}
*/
getNumMagnets() {
  return this.numMagnets_;
};

/**
@param {number} value
*/
setNumMagnets(value) {
  value = Math.floor(value);
  if (value < 1 || value >12) {
    throw 'number of magnets must be from 1 to 12';
  }
  this.numMagnets_ = value;
  this.makeMagnets();
  this.broadcastParameter(MagnetWheelSim.en.NUM_MAGNETS);
};

/**
* @return {boolean}
*/
getSymmetric() {
  return this.symmetric_;
};

/**
* @param {boolean} value
*/
setSymmetric(value) {
  this.symmetric_ = value;
  this.makeMagnets();
  this.magnetAngleControl_.setEnabled(!this.symmetric_);
  this.broadcastParameter(MagnetWheelSim.en.SYMMETRIC);
};

/**
@return {number}
*/
getMagnetAngle() {
  return this.magnetAngle_;
};

/**
@param {number} value
*/
setMagnetAngle(value) {
  if (value < 1 || value >360) {
    throw 'magnet angle must be from 1 to 360';
  }
  this.magnetAngle_ = value;
  this.makeMagnets();
  this.broadcastParameter(MagnetWheelSim.en.MAGNET_ANGLE);
};


/** Makes magnets according to current parameters.
* @return {undefined}
* @private
*/
makeMagnets() {
  var magnets = [];
  var n = this.numMagnets_;
  var r = this.magnetWheel_.getRadius() * 0.85;
  var i;
  for (i = 0; i<n; i++) {
    var a = i * 2*Math.PI * (this.symmetric_ ? 1/n : this.magnetAngle_/360);
    magnets.push(new Vector(r * Math.cos(a), r * Math.sin(a)));
  }
  this.magnetWheel_.setMagnets(magnets);
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!MagnetWheelApp}
*/
function makeMagnetWheelApp(elem_ids) {
  return new MagnetWheelApp(elem_ids);
};
goog.exportSymbol('makeMagnetWheelApp', makeMagnetWheelApp);

exports = MagnetWheelApp;
