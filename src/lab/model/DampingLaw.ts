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

/** Applies damping forces to a set of {@link MassObject}'s.
Damping is a friction force like air resistance, or the surface friction of objects
sliding on a table.

The set of objects can be specified with the {@link addBody} method, or the
DampingLaw can observe a SimList and automatically add all bodies that have mass to the
set of objects.

The damping force slows both the translational velocity and rotational velocity of a
MassObject. The translational force is `(-k*vx, -k*vy)` where

+ `k` is the damping constant
+ `(vx, vy)` is the translational velocity of the body

The torque is `-k*rotateRatio*vw` where

+ `k` is the damping constant
+ `rotateRatio` is a constant used to calculate rotational damping
+ `vw` is the angular velocity of the body

The reason to have `rotateRatio` is so that it is easy to modify both translational and
rotational damping by adjusting only the damping constant.

Parameters Created
------------------

+ ParameterNumber named `DAMPING`, see {@link setDamping}

+ ParameterNumber named `ROTATE_RATIO`, see {@link setRotateRatio}

*/
export class DampingLaw extends AbstractSubject implements Subject, Observer, ForceLaw {
  private damping_: number;
  /** rotational damping is this fraction of damping */
  private rotateRatio_: number;
  private bods_: MassObject[] = [];
  private simList_: null|SimList = null;

/**
@param damping translational damping factor
@param rotateRatio the ratio used to calculate rotational damping, as
    a fraction of translational damping
@param opt_simList optional SimList to observe for when objects are added;
    also adds all existing bodies on that SimList.
*/
constructor(damping: number, rotateRatio?: number, opt_simList?: SimList) {
  const id = DampingLaw.NAME_ID++;
  const nm = 'DAMPING_LAW' + (id > 0 ? '_'+id : '');
  super(nm);
  this.damping_ = damping;
  this.rotateRatio_ = rotateRatio || 1.0;
  if (opt_simList !== undefined) {
    this.connect(opt_simList);
  };
  let pn = new ParameterNumber(this, DampingLaw.en.DAMPING,
      DampingLaw.i18n.DAMPING, () => this.getDamping(), a => this.setDamping(a));
  pn.setSignifDigits(3);
  this.addParameter(pn);
  pn = new ParameterNumber(this, DampingLaw.en.ROTATE_RATIO,
      DampingLaw.i18n.ROTATE_RATIO,
      () => this.getRotateRatio(), a => this.setRotateRatio(a));
  pn.setSignifDigits(3);
  this.addParameter(pn);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', rotateRatio: '+Util.NF5(this.rotateRatio_)
      +', bodies: '+this.bods_.length
      + super.toString();
};

/** @inheritDoc */
override toStringShort() {
  return super.toStringShort().slice(0, -1)
      +', damping: '+Util.NF5(this.damping_)+'}';
};

/** @inheritDoc */
getClassName() {
  return 'DampingLaw';
};

/** Adds the SimObjects to list of objects that DampingLaw applies forces to,
* but only those with mass.
* @param bodies set of SimObjects to possibly add
*/
addBodies(bodies: SimObject[]): void {
  bodies.forEach(b => this.addBody(b));
};

/** Adds the SimObject to list of objects that DampingLaw applies forces to, but only
* if it has positive finite mass.
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
  if (this.damping_ == 0) {
    return forces;
  }
  this.bods_.forEach(bod => {
    if (!isFinite(bod.getMass())) // skip infinite mass objects
      return;
    // translational damping: location is center of mass;
    // direction/magnitude is  -k*body.vx, -k*body.vy
    const cm = bod.getPosition();
    const f = new Force('damping', bod,
        /*location=*/cm, CoordType.WORLD,
        /*direction=*/bod.getVelocity().multiply(-this.damping_), CoordType.WORLD,
        /*torque=*/-this.damping_*this.rotateRatio_* bod.getAngularVelocity());
    forces.push(f);
  });
  return forces;
};

/** Connect to the given SimList, so that the force applies to all objects in the
* SimList. Also adds all existing bodies on that SimList.
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
  }
};

/** @inheritDoc */
getBodies(): MassObject[] {
  return Array.from(this.bods_);
};

/** Returns the strength of the damping force.
* @return the strength of the damping force.
*/
getDamping(): number {
  return this.damping_;
};

/** @inheritDoc */
getPotentialEnergy(): number {
  return 0;
};

/** Returns the ratio used to calculate rotational damping, as fraction of
* translational damping.
* @return ratio used to calculate rotational damping
*/
getRotateRatio(): number {
  return this.rotateRatio_;
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

/** Sets the strength of the damping force.
* @param value strength of the damping force
*/
setDamping(value: number): void {
  this.damping_ = value;
  this.broadcastParameter(DampingLaw.en.DAMPING);
};

/** Sets the ratio used to calculate rotational damping, as fraction of translational
* damping.
* @param value ratio used to calculate rotational damping
*/
setRotateRatio(value: number): void {
  this.rotateRatio_ = value;
  this.broadcastParameter(DampingLaw.en.ROTATE_RATIO);
};

static NAME_ID = 0;

static readonly en: i18n_strings = {
  DAMPING: 'damping',
  ROTATE_RATIO: 'rotate ratio'
};

static readonly de_strings: i18n_strings = {
  DAMPING: 'Dämpfung',
  ROTATE_RATIO: 'Drehquotient'
};

static readonly i18n = Util.LOCALE === 'de' ? DampingLaw.de_strings : DampingLaw.en;

} // end DampingLaw class

type i18n_strings = {
  DAMPING: string,
  ROTATE_RATIO: string
};

Util.defineGlobal('lab$model$DampingLaw', DampingLaw);
