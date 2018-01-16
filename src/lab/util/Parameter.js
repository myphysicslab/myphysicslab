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

goog.module('myphysicslab.lab.util.Parameter');

const SubjectEvent = goog.require('myphysicslab.lab.util.SubjectEvent');

/** Provides access to a value of a {@link myphysicslab.lab.util.Subject Subject} and
meta-data such as name, a set of possible values and more. Part of the
[Observer design pattern](http://en.wikipedia.org/wiki/Observer_pattern) which
ensures that change notification happens regardless of how the value was changed.
See [Subject, Observer, Parameter](Architecture.html#subjectobserverparameter) for
an overview.

It is very easy to connect a Parameter to a user interface control like
{@link myphysicslab.lab.controls.NumericControl NumericControl},
{@link myphysicslab.lab.controls.ChoiceControl ChoiceControl}, or
{@link myphysicslab.lab.controls.CheckBoxControl CheckBoxControl}.

Parameter helps to minimize the knowledge that classes have about each other. For
example, a NumericControl can display and modify the ParameterNumber of
a Subject without knowing anything about the Subject other than it implements
the Subject interface.

See [Internationalization](Building.html#internationalizationi18n) for information
about localized and language-independent strings.


Getter and Setter Methods
-------------------------
A Parameter operates by calling *getter* and *setter* methods on its Subject. These
methods are specified to the Parameter's constructor, and used in the Parameter's
{@link #getValue} and {@link #setValue} methods. We assume that the Subject's *setter*
method will perform notification of changes via
{@link myphysicslab.lab.util.Subject#broadcastParameter Subject.broadcastParameter}.

Here are examples of *getter* and *setter* methods showing how the Parameter is
broadcast in the *setter* method of the Subject.

    SingleSpringSim.prototype.getMass = function() {
      return this.block_.getMass();
    };

    SingleSpringSim.prototype.setMass = function(value) {
      this.block_.setMass(value);
      this.broadcastParameter(SingleSpringSim.en.MASS);
    };

Here is an example showing how the *getter* and *setter* methods are specified when
creating a ParameterNumber. This is from the
{@link myphysicslab.sims.springs.SingleSpringSim SingleSpringSim constructor}:

    this.addParameter(new ParameterNumber(this, SingleSpringSim.en.MASS,
        SingleSpringSim.i18n.MASS,
        goog.bind(this.getMass, this),
        goog.bind(this.setMass, this)));


Choices and Values
------------------
A Parameter can have a set of choices and values. If they
are specified, then the Parameter value is only allowed to be set to one of those
values.

+ {@link #getValues} returns a list of *values* that the Parameter can be set to.

+ {@link #getChoices} returns a corresponding list of localized (translated) strings
    which are shown to the user as the *choices* for this Parameter, typically in a
    user interface menu such as {@link myphysicslab.lab.controls.ChoiceControl}.

When the set of Parameter choices is changed, a GenericEvent should be broadcast with
the name {@link #CHOICES_MODIFIED}. Then any control that is displaying the
available choices can update its display.

@interface
*/
class Parameter extends SubjectEvent {

/** Returns the value of this Parameter in string form.
@return {string} the value of this Parameter in string form
*/
getAsString() {}

/** Returns the localized strings corresponding to the possible values from
{@link #getValues}. See [Internationalization](Building.html#internationalizationi18n).
@return {!Array<string>} the localized strings corresponding to the
    possible values
*/
getChoices() {}

/** Returns the set of values corresponding to {@link #getChoices} that this Parameter
can be set to.
@return {!Array<string>} set of values that this Parameter can be set to, in string
form.
*/
getValues() {}

/** Returns whether the value is being automatically computed; setting the value of
* this Parameter has no effect.
*
* Examples of automatically computed Parameters: the variables that give the
* current energy of a simulation. Another example is when the size of a graph's
* SimView is under control of an {@link myphysicslab.lab.graph.AutoScale AutoScale}.
* @return {boolean} whether the value is being automatically computed
*/
isComputed() {}

/** Sets whether the value is being automatically computed. See {@link #isComputed}.
@param {boolean} value whether the value is being automatically computed.
*/
setComputed(value) {}

/** Sets the value of this Parameter after converting the given string to the
appropriate type (boolean, number or string).
@param {string} value the value to set this Parameter to, in string form
@throws {!Error} if the string cannot be converted to the needed type
*/
setFromString(value) {}

}

/** Name of event signifying that the set of values and choices returned by
{@link #getValues} and {@link #getChoices} has been modified: choices may have been added or
removed, or the name of choices changed.
@type {string}
@const
*/
Parameter.CHOICES_MODIFIED = 'CHOICES_MODIFIED';

exports = Parameter;
