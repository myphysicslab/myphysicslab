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

goog.module('myphysicslab.sims.misc.MagnetWheelSim');

goog.require('goog.events.KeyCodes');

const AbstractODESim = goog.require('myphysicslab.lab.model.AbstractODESim');
const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const MagnetWheel = goog.require('myphysicslab.sims.misc.MagnetWheel');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** 

* @implements {EnergySystem}
* @implements {EventHandler}
*/
class MagnetWheelSim extends AbstractODESim {
/**
* @param {string=} opt_name name of this as a Subject
*/
constructor(opt_name) {
  super(opt_name);
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  var var_names = [
    MagnetWheelSim.en.ANGLE,
    MagnetWheelSim.en.ANGULAR_VELOCITY,
    VarsList.en.TIME,
    EnergySystem.en.KINETIC_ENERGY,
    EnergySystem.en.POTENTIAL_ENERGY,
    EnergySystem.en.TOTAL_ENERGY
  ];
  var i18n_names = [
    MagnetWheelSim.i18n.ANGLE,
    MagnetWheelSim.i18n.ANGULAR_VELOCITY,
    VarsList.i18n.TIME,
    EnergySystem.i18n.KINETIC_ENERGY,
    EnergySystem.i18n.POTENTIAL_ENERGY,
    EnergySystem.i18n.TOTAL_ENERGY
  ];
  this.setVarsList(new VarsList(var_names, i18n_names,
      this.getName()+'_VARS'));
  this.getVarsList().setComputed(3,4,5);
  /**
  * @type {!MagnetWheel}
  * @private
  */
  this.wheel_ = MagnetWheel.make(1, 'wheel').setMass(1);
  /**
  * @type {number}
  * @private
  */
  this.magnetStrength_ = 1;
  /**
  * @type {number}
  * @private
  */
  this.damping_ = 0.7;
  /**
  * @type {number}
  * @private
  */
  this.initialEnergy_ = 0;
  /** potential energy offset
  * @type {number}
  * @private
  */
  this.potentialOffset_ = 0;
  /**
  * @type {boolean}
  * @private
  */
  this.isDragging = false;
  /**
  * @type {boolean}
  * @private
  */
  this.keyLeft_ = false;
  /**
  * @type {boolean}
  * @private
  */
  this.keyRight_ = false;
  /**
  * @type {number}
  * @private
  */
  this.keyForce_ = 5;

  this.getVarsList().setValue(1, 3); // initial angular velocity
  this.saveInitialState();
  this.getSimList().add(this.wheel_);

  this.addParameter(new ParameterNumber(this, MagnetWheelSim.en.DAMPING,
      MagnetWheelSim.i18n.DAMPING,
      goog.bind(this.getDamping, this), goog.bind(this.setDamping, this)));
  this.addParameter(new ParameterNumber(this, MagnetWheelSim.en.MASS,
      MagnetWheelSim.i18n.MASS,
      goog.bind(this.getMass, this), goog.bind(this.setMass, this)));
  this.addParameter(new ParameterNumber(this, MagnetWheelSim.en.MAGNET_STRENGTH,
      MagnetWheelSim.i18n.MAGNET_STRENGTH,
      goog.bind(this.getMagnetStrength, this),
      goog.bind(this.setMagnetStrength, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY));
  this.addParameter(new ParameterNumber(this, MagnetWheelSim.en.NUM_MAGNETS,
      MagnetWheelSim.i18n.NUM_MAGNETS,
      goog.bind(this.getNumMagnets, this), goog.bind(this.setNumMagnets, this))
      .setDecimalPlaces(0));

};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', wheel_: '+this.wheel_
      +', damping_: '+Util.NF(this.damping_)
      + super.toString();
};

/** @override */
getClassName() {
  return 'MagnetWheelSim';
};

/** @override */
getEnergyInfo() {
  var vars = this.getVarsList().getValues();
  this.moveObjects(vars);
  return this.getEnergyInfo_(vars);
};

/**
* @param {!Array<number>} vars
* @return {!EnergyInfo}
* @private
*/
getEnergyInfo_(vars) {
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  var ke = this.wheel_.getKineticEnergy();
  var pe = 0;
  return new EnergyInfo(pe, ke, NaN, NaN, this.initialEnergy_);
};

/** @override */
setPotentialEnergy(value) {
  this.potentialOffset_ = 0;
  this.potentialOffset_ = value - this.getEnergyInfo().getPotential();
};

/** @override */
modifyObjects() {
  var va = this.getVarsList();
  var vars = va.getValues();
  this.moveObjects(vars);
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  var rate = new Array(vars.length);
  this.evaluate(vars, rate, 0);
  var ei = this.getEnergyInfo_(vars);
  vars[3] = ei.getTranslational();
  vars[4] = ei.getPotential();
  vars[5] = ei.getTotalEnergy();
  va.setValues(vars, /*continuous=*/true);
};

/**
@param {!Array<number>} vars
@private
*/
moveObjects(vars) {
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  this.wheel_.setAngle(vars[0]);
  this.wheel_.setAngularVelocity(vars[1]);
};

/** @override */
startDrag(simObject, location, offset, dragBody, mouseEvent) {
  if (simObject == this.wheel_) {
    this.isDragging = true;
    return true;
  }
  return false;
};

/** @override */
mouseDrag(simObject, location, offset, mouseEvent) {
};

/** @override */
finishDrag(simObject, location, offset) {
  this.isDragging = false;
};

/** @override */
handleKeyEvent(keyCode, pressed, keyEvent) {
  // console.log('handleKeyEvent keyCode:'+keyCode+'  pressed: '+pressed
  //  +' event:'+Util.propertiesOf(keyEvent, true));
  var KeyCodes = goog.events.KeyCodes;
  if (keyEvent.ctrlKey || keyEvent.metaKey || keyEvent.altKey)
    return;
  switch (keyCode) {
    case KeyCodes.LEFT:
    case KeyCodes.J:
      this.keyLeft_ = pressed;
      keyEvent.preventDefault();
      break;
    case KeyCodes.RIGHT:
    case KeyCodes.L:
      this.keyRight_ = pressed;
      keyEvent.preventDefault();
      break;
    default:
      break;
  }
};

/** @override */
evaluate(vars, change, timeStep) {
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  Util.zeroArray(change);
  // technically it's rotational inertia we should use here, not mass.
  var m = this.wheel_.getMass();
  
  change[0] = vars[1];
  change[1] = -this.damping_*vars[1]/m;
  change[2] = 1.0;  // time
  
  this.moveObjects(vars);
  // the fixed magnet is at (xf, yf)
  var fm = this.wheel_.getFixedMagnet();
  var magnets = this.wheel_.getMagnets();
  for (var i=0, n=magnets.length; i<n; i++) {
    // r = vector from center of wheel to magnet
    var r = this.wheel_.bodyToWorld(magnets[i]);
    // force from magnet to fixed magnet is proportional to inverse square of distance
    var f = new Vector(fm.getX() - r.getX(), fm.getY() - r.getY());
    f = f.multiply(this.magnetStrength_ / f.lengthSquared());
    // cross product of r x f = the torque due to the magnet
    var t = r.getX() * f.getY() - r.getY() * f.getX();
    change[1] += t/m;
  }
  
  // add constant force while left or right arrow key is pressed
  // (note that we are ignoring mass here).
  if (this.keyLeft_) {
    change[1] += this.keyForce_;
  } else if (this.keyRight_) {
    change[1] += -this.keyForce_;
  }
  return null;
};

/**
@return {number}
*/
getMass() {
  return this.wheel_.getMass();
};

/**
@param {number} value
*/
setMass(value) {
  this.wheel_.setMass(value);
  // 0  1   2     3   4   5
  // a, w, time,  ke, pe, te
  // discontinuous change in energy
  this.getVarsList().incrSequence(3, 4, 5);
  this.broadcastParameter(MagnetWheelSim.en.MASS);
};

/**
@return {number}
*/
getDamping() {
  return this.damping_;
};

/**
@param {number} value
*/
setDamping(value) {
  this.damping_ = value;
  this.broadcastParameter(MagnetWheelSim.en.DAMPING);
};

/**
@return {number}
*/
getMagnetStrength() {
  return this.magnetStrength_;
};

/**
@param {number} value
*/
setMagnetStrength(value) {
  this.magnetStrength_ = value;
  this.broadcastParameter(MagnetWheelSim.en.MAGNET_STRENGTH);
};

/**
@return {number}
*/
getNumMagnets() {
  return this.wheel_.getMagnets().length;
};

/**
@param {number} value
*/
setNumMagnets(value) {
  this.wheel_.setNumMagnets(value);
  this.broadcastParameter(MagnetWheelSim.en.NUM_MAGNETS);
};

} // end class

/** Set of internationalized strings.
@typedef {{
  DAMPING: string,
  MASS: string,
  ANGLE: string,
  ANGULAR_VELOCITY: string,
  MAGNET_STRENGTH: string,
  NUM_MAGNETS: string
  }}
*/
MagnetWheelSim.i18n_strings;

/**
@type {MagnetWheelSim.i18n_strings}
*/
MagnetWheelSim.en = {
  DAMPING: 'damping',
  MASS: 'mass',
  ANGLE: 'angle',
  ANGULAR_VELOCITY: 'angular velocity',
  MAGNET_STRENGTH: 'magnet strength',
  NUM_MAGNETS: 'number of magnets'
};

/**
@private
@type {MagnetWheelSim.i18n_strings}
*/
MagnetWheelSim.de_strings = {
  DAMPING: 'Dämpfung',
  MASS: 'Masse',
  ANGLE: 'Winkel',
  ANGULAR_VELOCITY: 'Winkel Geschwindigkeit',
  MAGNET_STRENGTH: 'Magnet Stärke',
  NUM_MAGNETS: 'Anzahl Magnete'
};

/** Set of internationalized strings.
@type {MagnetWheelSim.i18n_strings}
*/
MagnetWheelSim.i18n = goog.LOCALE === 'de' ? MagnetWheelSim.de_strings :
    MagnetWheelSim.en;

exports = MagnetWheelSim;
