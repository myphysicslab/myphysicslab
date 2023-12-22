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

import { AbstractSubject } from '../util/AbstractSubject.js';
import { CoordType } from './CoordType.js';
import { Force } from './Force.js';
import { ForceLaw } from './ForceLaw.js';
import { MassObject } from './MassObject.js';
import { Observer, ParameterNumber, SubjectEvent, Subject } from '../util/Observe.js';
import { SimList } from './SimList.js';
import { SimObject } from './SimObject.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** Applies constant downward gravitational force to a set of MassObjects.

The set of objects can be specified with the {@link addBody} method, or the
GravityLaw can observe a SimList and automatically add all bodies that have mass to the
set of objects.

Zero Energy Level
-----------------

GravityLaw has a default zero potential energy level which is used for MassObjects that
return null from {@link getZeroEnergyLevel}. This allows adding objects to a
simulation without needing to set the zero energy level on each object. You can
override this default zero energy level for an object with
{@link MassObject.setZeroEnergyLevel}.

Parameters Created
------------------

+ ParameterNumber named `GRAVITY`, see {@link setGravity}

+ ParameterNumber named `ZERO_ENERGY`, see {@link setZeroEnergyLevel}

*/
export class GravityLaw extends AbstractSubject implements Subject, Observer, ForceLaw {
  private gravity_: number;
  private zeroEnergyLevel_: number = 0;
  private bods_: MassObject[] = [];
  private simList_: null|SimList = null;

/**
@param gravity magnitude of gravity
@param opt_simList optional SimList to observe for
    when objects are added; also adds all existing bodies on that SimList.
*/
constructor(gravity: number, opt_simList?: SimList) {
  const id = GravityLaw.NAME_ID++;
  const nm = 'GRAVITY_LAW' + (id > 0 ? '_'+id : '');
  super(nm);
  this.gravity_ = gravity;
  if (opt_simList !== undefined) {
    this.connect(opt_simList);
  };
  let pn = new ParameterNumber(this, GravityLaw.en.GRAVITY,
      GravityLaw.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a));
  pn.setSignifDigits(4);
  this.addParameter(pn);
  pn = new ParameterNumber(this, GravityLaw.en.ZERO_ENERGY,
      GravityLaw.i18n.ZERO_ENERGY,
      () => this.getZeroEnergyLevel(),
      a => this.setZeroEnergyLevel(a));
  pn.setLowerLimit(Number.NEGATIVE_INFINITY);
  this.addParameter(pn);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', bodies: '+this.bods_.length
      + super.toString();
};

/** @inheritDoc */
override toStringShort() {
  return super.toStringShort().slice(0, -1)
      +', gravity: '+Util.NF5(this.gravity_)+'}';
};

/** @inheritDoc */
getClassName() {
  return 'GravityLaw';
};

/** Adds any MassObjects with finite mass among the given list of SimObjects.
* @param bodies set of SimObjects to
  possibly add
*/
addBodies(bodies: SimObject[]): void {
  bodies.forEach(body => this.addBody(body));
};

/** Adds the SimObject to list of objects that GravityLaw applies forces to, but only
* if it has positive finite mass
* @param obj the SimObject to possibly add
*/
addBody(obj: SimObject): void {
  if (!obj.isMassObject()) {
    return;
  }
  const mobj = obj as MassObject;
  if (this.bods_.includes(mobj)) {
    return;
  }
  const m = mobj.getMass();
  if (m > 0 && isFinite(m)) {
    this.bods_.push(mobj);
  }
};

/** @inheritDoc */
calculateForces(): Force[] {
  const forces: Force[] = [];
  this.bods_.forEach(body => {
    if (isFinite(body.getMass())) { // skip infinite mass objects
      forces.push(new Force('gravity', body,
        /*location=*/body.getPosition(), CoordType.WORLD,
        /*direction=*/new Vector(0, -this.gravity_ * body.getMass(), 0),
        CoordType.WORLD));
    }
  });
  return forces;
};

/** Connect to the given SimList, so that the force applies to all objects in the
SimList. Also adds all existing bodies on that SimList.
* @param simList  the SimList to connect with
*/
connect(simList: SimList): void {
  this.addBodies(simList.toArray());
  simList.addObserver(this);
  this.simList_ = simList;
};

/** @inheritDoc */
disconnect(): void {
  if (this.simList_ != null) {
    this.simList_.removeObserver(this);
    this.simList_ = null;
  }
};

/** @inheritDoc */
getBodies(): MassObject[] {
  return Array.from(this.bods_);
};

/** Returns the magnitude of the gravity force.
* @return the magnitude of the gravity force
*/
getGravity(): number {
  return this.gravity_;
};

/** @inheritDoc */
getPotentialEnergy(): number {
  let pe = 0;
  this.bods_.forEach(body => {
    if (isFinite(body.getMass())) { // skip infinite mass objects
      /*if (0 == 1 && Util.DEBUG) {
        console.log('body '+body.getName()
          +' cmy='+Util.NF(body.getPosition().getY())
          +' zel='+Util.NF(body.getZeroEnergyLevel())
          );
      }*/
      let zel = body.getZeroEnergyLevel();
      zel = zel ?? this.zeroEnergyLevel_;
      pe += (body.getPosition().getY() - zel) * body.getMass() * this.gravity_;
    }
  });
  return pe;
};

/** Returns the vertical world coordinate where a body has zero potential
energy. Can override for a particular body with
{@link MassObject.setZeroEnergyLevel}.
@return the vertical world coordinate where a body has zero potential energy
*/
getZeroEnergyLevel(): number {
  return this.zeroEnergyLevel_;
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.nameEquals(SimList.OBJECT_ADDED)) {
    const obj = event.getValue() as SimObject;
    this.addBody(obj);
  } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
    const obj = event.getValue() as MassObject;
    Util.remove(this.bods_, obj);
    Util.assert(!this.bods_.includes(obj));
  }
};

/** Sets the magnitude of the gravity force.
* @param gravity the magnitude of the gravity force
*/
setGravity(gravity: number) {
  this.gravity_ = gravity;
  this.broadcastParameter(GravityLaw.en.GRAVITY);
};

/** Sets the vertical world coordinate where a body has zero potential energy.
Can override for a particular body with
{@link MassObject.setZeroEnergyLevel}.
@param value the vertical world coordinate where a body has zero potential energy
*/
setZeroEnergyLevel(value: number): void {
  this.zeroEnergyLevel_ = value;
  this.broadcastParameter(GravityLaw.en.ZERO_ENERGY);
};

static NAME_ID = 0;

static readonly en: i18n_strings = {
  GRAVITY: 'gravity',
  ZERO_ENERGY: 'zero energy level'
};

static readonly de_strings: i18n_strings = {
  GRAVITY: 'Gravitation',
  ZERO_ENERGY: 'Null-Energie Level'
};

static readonly i18n = Util.LOCALE === 'de' ? GravityLaw.de_strings : GravityLaw.en;

} // end GravityLaw class

type i18n_strings = {
  GRAVITY: string,
  ZERO_ENERGY: string
};

Util.defineGlobal('lab$model$GravityLaw', GravityLaw);
