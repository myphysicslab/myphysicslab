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

goog.provide('myphysicslab.lab.util.Subject');

goog.require('myphysicslab.lab.util.Printable');

goog.scope(function() {

/** A Subject notifies its {@link myphysicslab.lab.util.Observer Observers} when
something changes in the Subject. This can be a change in the value of a
{@link myphysicslab.lab.util.Parameter Parameter}, or the occurrence of an
{@link myphysicslab.lab.util.GenericEvent GenericEvent}. The Subject maintains a list
of its Observers. An Observer is connected to the Subject via the {@link #addObserver}
method, which is typically called by the Observer's constructor or the entity that
creates the Observer.

See the MyPhysicsLab Overview section
[Subject, Observer, Parameter](Architecture.html#subjectobserverparameter).

When a change occurs in the Subject, the {@link #broadcast} method should be called to inform all
Observers of the change. For a Parameter, the 'setter' method of the Subject should call
{@link #broadcastParameter} at the end of the setter method.

To enable universal scripting of simulations, we need Parameters and SubjectEvents to
have language independent names. Therefore `Parameter.getName()` and
`SubjectEvent.getName()` return a language independent name which is derived from the
English localized name by converting the English name to uppercase and replacing spaces
and dashes by underscore. You can use the function
{@link myphysicslab.lab.util.UtilityCore#toName} to convert an English name to the
universal name. Or use `SubjectEvent.nameEquals()` which handles the conversion
to language independent name.

The Subject and Observer interfaces are an implementation of the well known
[Observer design pattern](http://en.wikipedia.org/wiki/Observer_pattern).



Example Scenario
----------------

This section shows an example usage of the Subject and Observer interfaces, along
with Parameters and user interface controls.

TO DO: ***ELASTICITY IS NO LONGER DEFINED ON RIGIDBODYSIM NEED TO UPDATE THIS*** 

<img src="Subject_Observer_Parameters.svg" alt="Subject/Observer Relationships with Parameters" />

The diagram shows a {@link myphysicslab.lab.engine2D.RigidBodySim RigidBodySim} as the
Subject. It has a list of Parameters, including a Parameter representing the elasticity
of the rigid bodies. The Subject also has a list of Observers, including a
{@link myphysicslab.lab.controls.NumericControl NumericControl} which is connected to the elasticity
{@link myphysicslab.lab.util.ParameterNumber ParameterNumber}. In its constructor, the
NumericControl adds itself to the list of Observers by calling {@link #addObserver} on
the Subject.

Whenever the elasticity is changed, the Subject should notify each Observer by
calling {@link #broadcast}. In this example only the NumericControl cares about the
elasticity Parameter. The NumericControl will then call `ParameterNumber.getValue` to
get the new value, and the ParameterNumber in turn finds the value by calling a
certain 'getter' method on the Subject.

If the user modifies the value of the NumericControl, the NumericControl will then
call `ParameterNumber.setValue` to modify the value; the ParameterNumber in turn calls
a certain 'setter' method on the Subject to change the value. This also causes the
Subject to notify all Observers of this change by calling `Subject.broadcast`.

This design is very decoupled. The Subject knows nothing about the NumericControl
except that it is an Observer. The Parameter is entirely unaware of the
NumericControl. The NumericControl only knows that the Parameter is of type
ParameterNumber and that it has a Subject providing notification of changes.

* @interface
* @extends {myphysicslab.lab.util.Printable}
*/
myphysicslab.lab.util.Subject = function() {};
var Subject = myphysicslab.lab.util.Subject;

/** Adds the given Observer to the Subject's list of Observers, so that the
Observer will be notified of changes in this Subject. Does nothing if the Observer
is already on the list. An Observer may call `Subject.addObserver` during its
`observe` method.
@param {!myphysicslab.lab.util.Observer} observer  the Observer to add to
        list of Observers
*/
Subject.prototype.addObserver;

/** Notifies all Observers that the Subject has changed by calling
{@link myphysicslab.lab.util.Observer#observe} on each Observer.
An Observer may call `Subject.addObserver` or `Subject.removeObserver` during its
`observe` method.
@param {!myphysicslab.lab.util.SubjectEvent} evt a SubjectEvent
    with information relating to the change
*/
Subject.prototype.broadcast;

/** Notifies all Observers that the Parameter with the given `name` has changed by
calling {@link myphysicslab.lab.util.Observer#observe} on each Observer.
@param {string} name the universal or English name of the Parameter that has changed
@throws {Error} if there is no Parameter with the given name
*/
Subject.prototype.broadcastParameter;

/** Return the language-independent name of this Subject for scripting purposes.
@return {string} name the language-independent name of this Subject
*/
Subject.prototype.getName;

/** Returns a copy of the list of Observers of this Subject.
@return {!Array<!myphysicslab.lab.util.Observer>} a copy of the list of Observers of
    this Subject.
*/
Subject.prototype.getObservers;

/** Returns the Parameter with the given name.
@param {string} name the language-independent or English name of the Parameter
@return {!myphysicslab.lab.util.Parameter} the Parameter with the given name
@throws {Error} if there is no Parameter with the given name
*/
Subject.prototype.getParameter;

/** Returns a copy of the list of this Subject's available Parameters.
@return {!Array<!myphysicslab.lab.util.Parameter>} a copy of the list of
        available Parameters for this Subject
*/
Subject.prototype.getParameters;

/** Returns the ParameterBoolean with the given name.
@param {string} name the universal or English name of the ParameterBoolean
@return {!myphysicslab.lab.util.ParameterBoolean} the ParameterBoolean with
    the given name
@throws {Error} if there is no ParameterBoolean with the given name
*/
Subject.prototype.getParameterBoolean;

/** Returns the ParameterNumber with the given name.
@param {string} name the universal or English name of the ParameterNumber
@return {!myphysicslab.lab.util.ParameterNumber} the ParameterNumber with
    the given name
@throws {Error} if there is no ParameterNumber with the given name
*/
Subject.prototype.getParameterNumber;

/** Returns the ParameterString with the given name.
@param {string} name the universal or English name of the ParameterString
@return {!myphysicslab.lab.util.ParameterString} the ParameterString with
    the given name
@throws {Error} if there is no ParameterString with the given name
*/
Subject.prototype.getParameterString;

/** Removes the Observer from the Subject's list of Observers. An Observer may
call `Subject.removeObserver` during its `observe` method.
@param {!myphysicslab.lab.util.Observer} observer the Observer to
        detach from list of Observers
*/
Subject.prototype.removeObserver;

}); // goog.scope
