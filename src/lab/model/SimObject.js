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

goog.provide('myphysicslab.lab.model.SimObject');

goog.require('myphysicslab.lab.util.Printable');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericVector');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const GenericVector = goog.module.get('myphysicslab.lab.util.GenericVector');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Represents an object in a Simulation. The purpose of a SimObject is two-fold:

1. To give the outside world a view of what is going on in the Simulation.

2. A SimObject might be used in a Simulation's internal calculations.

A set of SimObjects are stored in a {@link myphysicslab.lab.model.SimList SimList}. The
SimObjects represent the current state of the Simulation.

For an {@link myphysicslab.lab.model.ODESim ODESim} the current state is dictated by
the variables in its {@link myphysicslab.lab.model.VarsList VarsList} and the
SimObjects reflect that state in their positions and velocities.

A SimObject can give additional information that is not in the VarsList, such as size,
shape, and mass of objects. A SimObject can represent forces or anchor objects which
are not available in the VarsList.

SimObjects are updated to reflect the current state when the
{@link myphysicslab.lab.model.Simulation#modifyObjects} method is called.

See {@link myphysicslab.lab.view.DisplayObject} for a discussion of how SimObjects are
made visible to the user.

A SimObject has an *expiration time* so that we can add temporary objects,
representing things like forces or collision impact, and set the time at which they
should be removed from the simulation display.  Permanent SimObjects have infinite
expiration time. See {@link #getExpireTime}.

* @interface
* @extends {myphysicslab.lab.util.Printable}
*/
myphysicslab.lab.model.SimObject = function() {};
var SimObject = myphysicslab.lab.model.SimObject;

/** Returns a rectangle that contains this SimObject in world coordinates.
@return {!DoubleRect} rectangle that contains this SimObject in world coordinates
*/
SimObject.prototype.getBoundsWorld;

/** Returns the expiration time, when this SimObject should be removed from the
SimList. This is intended for temporary SimObjects that illustrate, for example,
contact forces or collisions.
@return {number} the expiration time, in time frame of the
    {@link myphysicslab.lab.model.Simulation#getTime Simulation clock}
*/
SimObject.prototype.getExpireTime;

/** Name of this SimObject, either the language-independent name for scripting
purposes or the localized name for display to user.

The [language-independent name](Building.html#languageindependentnames) should be the
same as the English version but capitalized and with spaces and dashes replaced by
underscore, see {@link Util#toName}, {@link #nameEquals}.

The name should give an idea of the role of the SimObject in the simulation. This
allows us to to treat an object in a special way depending on its name. For example, we
might use the name to decide what type of DisplayObject to create to represent the
SimObject.
@param {boolean=} opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return {string} name of this SimObject
*/
SimObject.prototype.getName;

/** Whether this implements the {@link myphysicslab.lab.model.MassObject} interface.
@return {boolean} Whether this implements the MassObject interface.
*/
SimObject.prototype.isMassObject;

/** Whether this SimObject has the given name, adjusting for transformation to the
[language-independent form](Building.html#languageindependentnames)
of the name, as is done by {@link Util#toName}.
@param {string} name the English or language-independent version of the name
@return {boolean} whether this SimObject has the given name (adjusted to
    language-independent form)
*/
SimObject.prototype.nameEquals;

/** Sets the expiration time, when this SimObject should be removed from the SimList.
This is intended for temporary SimObjects that illustrate, for example, contact forces
or collisions.
@param {number} time the expiration time, in time frame of the
    {@link myphysicslab.lab.model.Simulation#getTime Simulation clock}
@return {!SimObject} this SimObject for chaining setters
*/
SimObject.prototype.setExpireTime;

/** Returns true if the given SimObject is similar to this SimObject for display
purposes. SimObjects are similar when they are the same type and nearly the same size
and location. Mainly used when showing forces - to avoid adding too many objects
to the display. See {@link myphysicslab.lab.model.SimList#getSimilar}.
@param {!SimObject} obj the SimObject to compare to
@param {number=} opt_tolerance the amount the object components can differ by
@return {boolean} true if this SimObject is similar to `obj` for display purposes
*/
SimObject.prototype.similar;

}); // goog.scope
