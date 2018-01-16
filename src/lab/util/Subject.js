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

goog.module('myphysicslab.lab.util.Subject');

const Printable = goog.require('myphysicslab.lab.util.Printable');

/** A Subject notifies its {@link myphysicslab.lab.util.Observer Observers} when
something changes in the Subject. This can be a change in the value of a
{@link myphysicslab.lab.util.Parameter Parameter}, or the occurrence of an
{@link myphysicslab.lab.util.GenericEvent GenericEvent}. The Subject maintains a list
of its Observers. An Observer is connected to the Subject via the {@link #addObserver}
method, which is typically called by the Observer's constructor or the entity that
creates the Observer.

See [Subject, Observer, Parameter](Architecture.html#subjectobserverparameter) for an
overview. The Subject and Observer interfaces are an implementation of the
[Observer design pattern](http://en.wikipedia.org/wiki/Observer_pattern).

When a change occurs in the Subject, the {@link #broadcast} method should be called to
inform all Observers of the change. For a Parameter, the "setter" method of the Subject
should call {@link #broadcastParameter} at the end of the setter method.


Language-Independent Names
--------------------------

To enable scripting, we need Parameters and SubjectEvents to have
[language independent names](Building.html#languageindependentnames). Therefore
`Parameter.getName()` and `SubjectEvent.getName()` return a language independent name
which is derived from the English localized name by converting the English name to
uppercase and replacing spaces and dashes by underscore.

You can use the function {@link myphysicslab.lab.util.Util#toName} to convert an
English name to the language-independent name. Or use `SubjectEvent.nameEquals()` which
handles the conversion to language independent name.

See [Internationalization](Building.html#internationalizationi18n) for more
about localized and language-independent strings.



Example Scenario
----------------

Here is an example usage of the Subject and Observer interfaces, along with Parameters
and user interface controls.

<img src="Subject_Observer_Parameters.svg" alt="Subject/Observer Relationships with Parameters" />

The diagram shows a {@link myphysicslab.lab.engine2D.ContactSim ContactSim} as the
Subject. It has a list of Parameters, including a Parameter representing the distance
tolerance which determines when objects are in contact. The Subject also has a list of
Observers, including a {@link myphysicslab.lab.controls.NumericControl NumericControl}
which is connected to the distance tolerance
{@link myphysicslab.lab.util.ParameterNumber ParameterNumber}. In its constructor, the
NumericControl adds itself to the list of Observers by calling {@link #addObserver} on
the Subject of the ParameterNumber.

Whenever the distance tolerance is changed, the Subject should notify each Observer by
calling {@link #broadcast}. The Observer can then get the current value by calling
`ParameterNumber.getValue`.

This design is very decoupled. The Subject knows nothing about the NumericControl
except that it is an Observer. The Parameter is unaware of the NumericControl. The
NumericControl only knows about the ParameterNumber and that it has a Subject which
will provide notification of changes.

* @interface
*/
class Subject extends Printable {

/** Adds the given Observer to the Subject's list of Observers, so that the Observer
will be notified of changes in this Subject. An Observer may call `Subject.addObserver`
during its `observe` method.
@param {!myphysicslab.lab.util.Observer} observer the Observer to add
*/
addObserver(observer) {}

/** Notifies all Observers that the Subject has changed by calling
{@link myphysicslab.lab.util.Observer#observe observe} on each Observer.
An Observer may call `Subject.addObserver` or `Subject.removeObserver` during its
`observe` method.
@param {!myphysicslab.lab.util.SubjectEvent} evt a SubjectEvent with information
    relating to the change
*/
broadcast(evt) {}

/** Notifies all Observers that the Parameter with the given `name` has changed by
calling {@link myphysicslab.lab.util.Observer#observe observe} on each Observer.
@param {string} name the language-independent or English name of the Parameter
    that has changed
@throws {!Error} if there is no Parameter with the given name
*/
broadcastParameter(name) {}

/** Return the language-independent name of this Subject for scripting purposes.
@return {string} name the language-independent name of this Subject
*/
getName() {}

/** Returns a copy of the list of Observers of this Subject.
@return {!Array<!myphysicslab.lab.util.Observer>} a copy of the list of Observers of
    this Subject.
*/
getObservers() {}

/** Returns the Parameter with the given name.
@param {string} name the language-independent or English name of the Parameter
@return {!myphysicslab.lab.util.Parameter} the Parameter with the given name
@throws {!Error} if there is no Parameter with the given name
*/
getParameter(name) {}

/** Returns a copy of the list of this Subject's available Parameters.
@return {!Array<!myphysicslab.lab.util.Parameter>} a copy of the list of
        available Parameters for this Subject
*/
getParameters() {}

/** Returns the ParameterBoolean with the given name.
@param {string} name the language-independent or English name of the ParameterBoolean
@return {!myphysicslab.lab.util.ParameterBoolean} the ParameterBoolean with
    the given name
@throws {!Error} if there is no ParameterBoolean with the given name
*/
getParameterBoolean(name) {}

/** Returns the ParameterNumber with the given name.
@param {string} name the language-independent or English name of the ParameterNumber
@return {!myphysicslab.lab.util.ParameterNumber} the ParameterNumber with
    the given name
@throws {!Error} if there is no ParameterNumber with the given name
*/
getParameterNumber(name) {}

/** Returns the ParameterString with the given name.
@param {string} name the language-independent or English name of the ParameterString
@return {!myphysicslab.lab.util.ParameterString} the ParameterString with
    the given name
@throws {!Error} if there is no ParameterString with the given name
*/
getParameterString(name) {}

/** Removes the Observer from the Subject's list of Observers. An Observer may
call `Subject.removeObserver` during its `observe` method.
@param {!myphysicslab.lab.util.Observer} observer the Observer to
        detach from list of Observers
*/
removeObserver(observer) {}
}
exports = Subject;
