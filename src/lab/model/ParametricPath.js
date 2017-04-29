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

goog.provide('myphysicslab.lab.model.ParametricPath');

goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var DoubleRect = myphysicslab.lab.util.DoubleRect;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Defines a 2D path with a parametric function `f(t) = (x(t), y(t))`.  For example, a circle of radius 3 with center at the origin is defined by

    f(t) = (3*cos(t), 3*sin(t))

The path has designated start and finish values for the parameter `t`. Note that `t` is
only used to generate the path and usually `t` does not correspond to a length measure
of the path.

@interface
*/
myphysicslab.lab.model.ParametricPath = function() {};
var ParametricPath = myphysicslab.lab.model.ParametricPath;

/** The ending value for `t` in the parameteric equation defining the path.
* @return {number} ending value for `t`
*/
ParametricPath.prototype.getFinishTValue;

/** Name of this object, either the language-independent name for scripting
purposes or the localized name for display to user.

The language-independent name should be the same as the English version but
capitalized and with spaces and dashes replaced by underscore,
see {@link UtilityCore#toName} and {@link #nameEquals}.

@param {boolean=} opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return {string} name of this object
*/
ParametricPath.prototype.getName;

/** The starting value for `t` in the parameteric equation defining the path.
* @return {number} starting value for `t`
*/
ParametricPath.prototype.getStartTValue;

/** Whether the path is a closed loop, ending at the same point it starts.
* @return {boolean} whether the path is a closed loop
*/
ParametricPath.prototype.isClosedLoop;

/** Whether this ParametricPath has the given name, adjusting for the transformation to
a language-independent form of the name, as is done by {@link UtilityCore#toName}.
@param {string} name the English or language-independent version of the name
@return {boolean} whether this ParametricPath has the given name (adjusted to
    language-independent form)
*/
ParametricPath.prototype.nameEquals;

/** Returns the `x` value for the given value of `t` in the parametric equation.
* @param {number} t the value of `t` in the parametric equation
* @return {number} the `x` value for the given value of `t`
*/
ParametricPath.prototype.x_func;

/** Returns the `y` value for the given value of `t` in the parametric equation.
* @param {number} t the value of `t` in the parametric equation
* @return {number} the `y` value for the given value of `t`
*/
ParametricPath.prototype.y_func;

}); // goog.scope
