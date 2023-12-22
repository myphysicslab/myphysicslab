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

import { DoubleRect } from "../util/DoubleRect.js"
import { GenericVector, Vector } from "../util/Vector.js"
import { Util, Printable } from "../util/Util.js"

/** Represents an object in a Simulation. The purpose of a SimObject is two-fold:

1. To give the outside world a view of what is going on in the Simulation.

2. A SimObject might be used in a Simulation's internal calculations.

A set of SimObjects are stored in a {@link lab/model/SimList.SimList | SimList}. The
SimObjects represent the current state of the Simulation.

For an {@link lab/model/ODESim.ODESim | ODESim} the current state is dictated by
the variables in its {@link lab/model/VarsList.VarsList | VarsList} and the
SimObjects reflect that state in their positions and velocities.

A SimObject can give additional information that is not in the VarsList, such as size,
shape, and mass of objects. A SimObject can represent forces or anchor objects which
are not available in the VarsList.

SimObjects are updated to reflect the current state when
{@link lab/model/Simulation.Simulation.modifyObjects | Simulation.modifyObjects}
is called.

See {@link lab/view/DisplayObject.DisplayObject | DisplayObject} for a discussion of
how SimObjects are made visible to the user.

A SimObject has an *expiration time* so that we can add temporary objects,
representing things like forces or collision impact, and set the time at which they
should be removed from the simulation display.  Permanent SimObjects have infinite
expiration time. See {@link getExpireTime}.
*/
export interface SimObject extends Printable {

/** Returns a rectangle that contains this SimObject in world coordinates.
@return rectangle that contains this SimObject in world coordinates
*/
getBoundsWorld(): DoubleRect;

/** Returns whether this SimObject has changed, and sets the state to "unchanged".
@return whether this SimObject has changed
*/
getChanged(): boolean;

/** Returns the expiration time, when this SimObject should be removed from the
SimList. This is intended for temporary SimObjects that illustrate, for example,
contact forces or collisions.
@return the expiration time, in time frame of the
    {@link lab/model/Simulation.Simulation.getTime Simulation clock}
*/
getExpireTime(): number;

/** Name of this SimObject, either the language-independent name for scripting
purposes or the localized name for display to user.

The [language-independent name](../Building.html#languageindependentnames) should be the
same as the English version but capitalized and with spaces and dashes replaced by
underscore, see {@link Util.toName},
{@link nameEquals}.

The name should give an idea of the role of the SimObject in the simulation. This
allows us to to treat an object in a special way depending on its name. For example, we
might use the name to decide what type of DisplayObject to create to represent the
SimObject.
@param opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return name of this SimObject
*/
getName(opt_localized?: boolean): string;

/** Whether this implements the {@link lab/model/MassObject.MassObject | MassObject}
interface.
@return Whether this implements the MassObject interface.
*/
isMassObject(): boolean;

/** Whether this SimObject has the given name, adjusting for transformation to the
[language-independent form](../Building.html#languageindependentnames)
of the name, as is done by {@link Util.toName}.
@param name the English or language-independent version of the name
@return whether this SimObject has the given name (adjusted to
    language-independent form)
*/
nameEquals(name: string): boolean;

/** Marks that this SimObject has changed.
*/
setChanged(): void;

/** Sets the expiration time, when this SimObject should be removed from the SimList.
This is intended for temporary SimObjects that illustrate, for example, contact forces
or collisions.
@param time the expiration time, in time frame of the
    {@link lab/model/Simulation.Simulation.getTime Simulation clock}
*/
setExpireTime(time: number): void;

/** Returns true if the given SimObject is similar to this SimObject for display
purposes. SimObjects are similar when they are the same type and nearly the same size
and location. Mainly used when showing forces - to avoid adding too many objects
to the display. See {@link lab/model/SimList.SimList.getSimilar | SimList.getSimilar}.
@param obj the SimObject to compare to
@param opt_tolerance the amount the object components can differ by
@return true if this SimObject is similar to `obj` for display purposes
*/
similar(obj: SimObject, opt_tolerance?: number): boolean;

}; // end SimObject interface

// ********************* AbstractSimObject ****************************

/** Base class that provides common methods for SimObjects.
*/
export abstract class AbstractSimObject implements SimObject {
  private name_: string;
  private localName_: string;
  private expireTime_: number = Infinity;
  protected changed_: boolean = true;

/**
* @param opt_name language-independent name of this SimObject (optional)
* @param opt_localName localized name of this SimObject (optional)
*/
constructor(opt_name?: string, opt_localName?: string) {
  const name = opt_name || 'SIM_OBJ'+AbstractSimObject.ID++;
  this.name_ = Util.validName(Util.toName(name));
  this.localName_ = opt_localName || name;
};

/** @inheritDoc */
toString() {
  return this.getClassName()+ '{name_: "' + this.getName() + '"'
      +', expireTime_: '+Util.NF(this.expireTime_)+'}';
};

/** @inheritDoc */
toStringShort() {
  return this.getClassName() + '{name_: "' + this.getName() + '"}';
};

/** @inheritDoc */
abstract getBoundsWorld(): DoubleRect;

/** @inheritDoc */
getChanged() {
  if (this.changed_) {
    this.changed_ = false;
    return true;
  } else {
    return false;
  }
};

/** Returns name of class of this object.
* @return name of class of this object.
*/
abstract getClassName(): string;

/** @inheritDoc */
getExpireTime(): number {
  return this.expireTime_;
};

/** @inheritDoc */
getName(opt_localized?: boolean): string {
  return opt_localized ? this.localName_ : this.name_;
};

/** @inheritDoc */
isMassObject(): boolean {
  return false;
};

/** @inheritDoc */
nameEquals(name: string): boolean {
  return this.name_ == Util.toName(name);
};

/** @inheritDoc */
setChanged(): void {
  this.changed_ = true;
};

/** @inheritDoc */
setExpireTime(time: number): void {
  this.expireTime_ = time;
};

/** @inheritDoc */
similar(obj: SimObject, _opt_tolerance?: number): boolean {
  return obj == this;
};

/** Counter used for naming SimObjects.*/
static ID = 1;

}; // end AbstractSimObject class

Util.defineGlobal('lab$model$AbstractSimObject', AbstractSimObject);
