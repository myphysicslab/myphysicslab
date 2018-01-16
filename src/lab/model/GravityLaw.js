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

goog.provide('myphysicslab.lab.model.GravityLaw');

goog.require('goog.array');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ForceLaw');
goog.require('myphysicslab.lab.model.MassObject');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var CoordType = myphysicslab.lab.model.CoordType;
var Force = myphysicslab.lab.model.Force;
var ForceLaw = myphysicslab.lab.model.ForceLaw;
var MassObject = myphysicslab.lab.model.MassObject;
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var SimList = myphysicslab.lab.model.SimList;
var SimObject = myphysicslab.lab.model.SimObject;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Applies constant downward gravitational force to a set of MassObjects.

The set of objects can be specified with the {@link #addBody} method, or the GravityLaw
can observe a SimList and automatically add all bodies that have mass to the set of
objects.

Zero Energy Level
-----------------

GravityLaw has a default zero potential energy level which is used for MassObjects that
return null from {@link #getZeroEnergyLevel}. This allows adding objects to a simulation
without needing to set the zero energy level on each object. You can override this
default zero energy level for an object with {@link MassObject#setZeroEnergyLevel}.

Parameters Created
------------------

+ ParameterNumber named `GRAVITY`, see {@link #setGravity}

+ ParameterNumber named `ZERO_ENERGY`, see {@link #setZeroEnergyLevel}

@param {number} gravity magnitude of gravity
@param {!SimList=} opt_simList optional SimList to observe for
  when objects are added; also adds all existing bodies on that SimList.
@constructor
@final
@struct
@extends {AbstractSubject}
@implements {ForceLaw}
@implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.model.GravityLaw = function(gravity, opt_simList) {
  var id = GravityLaw.NAME_ID++;
  var nm = 'GRAVITY_LAW' + (id > 0 ? '_'+id : '');
  AbstractSubject.call(this, nm);
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = gravity;
  /**
  * @type {number}
  * @private
  */
  this.zeroEnergyLevel_ = 0;
  /**
  * @type {!Array<!MassObject>}
  * @private
  */
  this.bods_ = [];
  /**
  * @type {?SimList}
  * @private
  */
  this.simList_ = null;
  if (goog.isDefAndNotNull(opt_simList)) {
    this.connect(opt_simList);
  };
  this.addParameter(new ParameterNumber(this, GravityLaw.en.GRAVITY,
      GravityLaw.i18n.GRAVITY,
      goog.bind(this.getGravity, this), goog.bind(this.setGravity, this))
      .setSignifDigits(4));
  this.addParameter(new ParameterNumber(this, GravityLaw.en.ZERO_ENERGY,
      GravityLaw.i18n.ZERO_ENERGY,
      goog.bind(this.getZeroEnergyLevel, this),
      goog.bind(this.setZeroEnergyLevel, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY));
};
var GravityLaw = myphysicslab.lab.model.GravityLaw;
goog.inherits(GravityLaw, AbstractSubject);

if (!Util.ADVANCED) {
  /** @override */
  GravityLaw.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', bodies: '+this.bods_.length
        + GravityLaw.superClass_.toString.call(this);
  };

  /** @override */
  GravityLaw.prototype.toStringShort = function() {
    return GravityLaw.superClass_.toStringShort.call(this).slice(0, -1)
        +', gravity: '+Util.NF5(this.gravity_)+'}';
  };
};

/** @override */
GravityLaw.prototype.getClassName = function() {
  return 'GravityLaw';
};

/**
* @type {number}
*/
GravityLaw.NAME_ID = 0;

/** Adds any MassObjects with finite mass among the given list of SimObjects.
* @param {!Array<!SimObject>} bodies set of SimObjects to
  possibly add
*/
GravityLaw.prototype.addBodies = function(bodies) {
  goog.array.forEach(bodies, goog.bind(this.addBody, this));
};

/** Adds the SimObject to list of objects that GravityLaw applies forces to, but only
* if it has positive finite mass
* @param {!SimObject} obj the SimObject to possibly add
*/
GravityLaw.prototype.addBody = function(obj) {
  if (!obj.isMassObject() || goog.array.contains(this.bods_, obj)) {
    return;
  }
  var mobj = /** @type {!MassObject}*/(obj);
  var m = mobj.getMass();
  if (m > 0 && isFinite(m)) {
    this.bods_.push(mobj);
  }
};

/** @override */
GravityLaw.prototype.calculateForces = function() {
  var forces = [];
  /** @type {function(this:GravityLaw, !MassObject)} */
  var f = function(body) {
    if (isFinite(body.getMass())) { // skip infinite mass objects
      forces.push(new Force('gravity', body,
        /*location=*/body.getPosition(), CoordType.WORLD,
        /*direction=*/new Vector(0, -this.gravity_ * body.getMass(), 0),
        CoordType.WORLD));
    }
  };
  goog.array.forEach(this.bods_, goog.bind(f, this));
  return forces;
};

/** Connect to the given SimList, so that the force applies to all objects in the
SimList. Also adds all existing bodies on that SimList.
* @param {!SimList} simList  the SimList to connect with
*/
GravityLaw.prototype.connect = function(simList) {
  this.addBodies(simList.toArray());
  simList.addObserver(this);
  this.simList_ = simList;
};

/** @override */
GravityLaw.prototype.disconnect = function() {
  if (this.simList_ != null) {
    this.simList_.removeObserver(this);
    this.simList_ = null;
  }
};

/** @override */
GravityLaw.prototype.getBodies = function() {
  return goog.array.clone(this.bods_);
};

/** Returns the magnitude of the gravity force.
* @return {number} the magnitude of the gravity force
*/
GravityLaw.prototype.getGravity = function() {
  return this.gravity_;
};

/** @override */
GravityLaw.prototype.getPotentialEnergy = function() {
  var pe = 0;
  goog.array.forEach(this.bods_, function(body) {
    if (isFinite(body.getMass())) { // skip infinite mass objects
      if (0 == 1 && Util.DEBUG) {
        console.log('body '+body.getName()
          +' cmy='+Util.NF(body.getPosition().getY())
          +' zel='+Util.NF(body.getZeroEnergyLevel())
          );
      }
      var zel = body.getZeroEnergyLevel();
      zel = goog.isDefAndNotNull(zel) ? zel : this.zeroEnergyLevel_;
      pe += (body.getPosition().getY() - zel) * body.getMass() * this.gravity_;
    }
  }, this);
  return pe;
};

/** Returns the default vertical world coordinate where a body has zero potential
energy. Can override for a particular body with {@link MassObject#setZeroEnergyLevel}.
@return {number} the default vertical world coordinate where a body has zero potential
    energy
*/
GravityLaw.prototype.getZeroEnergyLevel = function() {
  return this.zeroEnergyLevel_;
};

/** @override */
GravityLaw.prototype.observe =  function(event) {
  var obj = /** @type {!SimObject} */ (event.getValue());
  if (event.nameEquals(SimList.OBJECT_ADDED)) {
    this.addBody(obj);
  } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
    goog.array.remove(this.bods_, obj);
    goog.asserts.assert( !goog.array.contains(this.bods_, obj));
  }
};

/** Sets the magnitude of the gravity force.
* @param {number} gravity the magnitude of the gravity force
*/
GravityLaw.prototype.setGravity = function(gravity) {
  this.gravity_ = gravity;
  this.broadcastParameter(GravityLaw.en.GRAVITY);
};

/** Sets the default vertical world coordinate where a body has zero potential energy.
Can override for a particular body with {@link MassObject#setZeroEnergyLevel}.
@param {number} value the default vertical world coordinate where a body has zero
    potential energy
*/
GravityLaw.prototype.setZeroEnergyLevel = function(value) {
  this.zeroEnergyLevel_ = value;
  this.broadcastParameter(GravityLaw.en.ZERO_ENERGY);
};

/** Set of internationalized strings.
@typedef {{
  GRAVITY: string,
  ZERO_ENERGY: string
  }}
*/
GravityLaw.i18n_strings;

/**
@type {GravityLaw.i18n_strings}
*/
GravityLaw.en = {
  GRAVITY: 'gravity',
  ZERO_ENERGY: 'zero energy level'
};

/**
@private
@type {GravityLaw.i18n_strings}
*/
GravityLaw.de_strings = {
  GRAVITY: 'Gravitation',
  ZERO_ENERGY: 'Null-Energie Level'
};

/** Set of internationalized strings.
@type {GravityLaw.i18n_strings}
*/
GravityLaw.i18n = goog.LOCALE === 'de' ? GravityLaw.de_strings :
    GravityLaw.en;

}); // goog.scope
