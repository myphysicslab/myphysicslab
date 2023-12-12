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

import { Printable, Util } from "./Util.js";

/** Name of event signifying that the set of values and choices returned by
{@link Parameter.getValues} and {@link Parameter.getChoices} has been modified:
choices may have been added or removed, or the name of choices changed.
*/
export const CHOICES_MODIFIED = 'CHOICES_MODIFIED';

// ******************************* Observer ********************************

/** An Observer is notified whenever something changes in a
{@link Subject} it is
observing. The change can be in the value of a Subject's
{@link Parameter}, or the occurrence of an event such
as a {@link GenericEvent}. When a change occurs in
the Subject, the {@link Subject.broadcast}
method calls the Observer's
{@link Observer.observe} method.

The Observer is connected to the Subject via the
{@link Subject.addObserver} method.
This is typically done in the Observer's constructor or by the entity that creates the
Observer.

Implements the [Observer design pattern](http://en.wikipedia.org/wiki/Observer_pattern).
See {@link Subject} for more extensive documentation.
*/
export interface Observer extends Printable {

/** Notifies this Observer that a change has occurred in the Subject.
@param event  contains information about
      what has changed in the Subject: typically either a one-time GenericEvent,
      or a change to the value of a Parameter
*/
observe(event: SubjectEvent): void;
}

// ******************************* SubjectEvent ********************************

/** Provides information about an event that has happened to a
{@link Subject}. A SubjectEvent has a name, a value,
and can identify which Subject broadcast the event.

See {@link Subject} for more extensive documentation.
*/
export interface SubjectEvent extends Printable {

/** Name of this SubjectEvent, either the language-independent name for scripting
purposes or the localized name for display to user.

The [language-independent name](../Building.html#languageindependentnames) should be the
same as the English version but capitalized and with spaces and dashes replaced by
underscore, see {@link Util.toName}
and {@link SubjectEvent.nameEquals}.

@param opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return name of this object
*/
getName(opt_localized?: boolean): string;

/** Returns the Subject to which this SubjectEvent refers.
@return the Subject to which this SubjectEvent refers.
*/
getSubject(): Subject;

/** Returns the value of this SubjectEvent, or `undefined` if there is no assigned
value.
@return the value of this SubjectEvent
*/
getValue(): any;

/** Whether this SubjectEvent has the given name, adjusting for the transformation to a
[language-independent form](../Building.html#languageindependentnames)
of the name, as is
done by {@link Util.toName}.

@param name the English or language-independent version of the name
@return whether this SubjectEvent has the given name (adjusted to
    language-independent form)
*/
nameEquals(name: string): boolean;
}

// ******************************* Parameter ********************************

/** Provides access to a value of a {@link Subject} and
meta-data such as name, a set of possible values and more. Part of the
[Observer design pattern](http://en.wikipedia.org/wiki/Observer_pattern) which
ensures that change notification happens regardless of how the value was changed.
See [Subject, Observer, Parameter](../Architecture.html#subjectobserverparameter) for
an overview.

It is very easy to connect a Parameter to a user interface control like
{@link lab/controls/NumericControl.NumericControl},
{@link lab/controls/ChoiceControl.ChoiceControl}, or
{@link lab/controls/CheckBoxControl.CheckBoxControl}.

Parameter helps to minimize the knowledge that classes have about each other. For
example, a NumericControl can display and modify the ParameterNumber of
a Subject without knowing anything about the Subject other than it implements
the Subject interface.

See [Internationalization](../Building.html#internationalizationi18n) for information
about localized and language-independent strings.


Getter and Setter Methods
-------------------------
A Parameter operates by calling *getter* and *setter* methods on its Subject. These
methods are specified to the Parameter's constructor, and used in the Parameter's
{@link Parameter.getValue}
and `setValue` methods.
We assume that the Subject's *setter*
method will perform notification of changes via
{@link Subject.broadcastParameter}.

Here are examples of *getter* and *setter* methods showing how the Parameter is
broadcast in the *setter* method of the Subject.
```ts
getMass(): number {
  return this.block_.getMass();
};

setMass(value: number) {
  this.block_.setMass(value);
  this.broadcastParameter(SingleSpringSim.en.MASS);
};
```
Here is an example showing how the *getter* and *setter* methods are specified when
creating a ParameterNumber. This is from
{@link sims/springs/SingleSpringSim.SingleSpringSim}:
```
this.addParameter(new ParameterNumber(this, SingleSpringSim.en.MASS,
    SingleSpringSim.i18n.MASS,
    () => this.getMass(), a => this.setMass(a)));
```

Choices and Values
------------------
A Parameter can have a set of choices and values. If they
are specified, then the Parameter value is only allowed to be set to one of those
values.

+ {@link Parameter.getValues} returns a list of *values*
    that the Parameter can be set to.

+ {@link Parameter.getChoices} returns a corresponding list of
    localized (translated) strings
    which are shown to the user as the *choices* for this Parameter, typically in a
    user interface menu such as {@link lab/controls/ChoiceControl.ChoiceControl}.

When the set of Parameter choices is changed, a GenericEvent should be broadcast with
the name {@link CHOICES_MODIFIED}.
Then any control that is displaying the
available choices can update its display.
*/
export interface Parameter extends SubjectEvent {

/** Returns the value of this Parameter in string form.
@return the value of this Parameter in string form
*/
getAsString(): string;

/** Returns the localized strings corresponding to the possible values from
{@link Parameter.getValues}.
See [Internationalization](../Building.html#internationalizationi18n).
@return the localized strings corresponding to the
    possible values
*/
getChoices(): string[];

/** Returns the set of values corresponding to
{@link Parameter.getChoices} that this Parameter can be set to.
@return set of values that this Parameter can be set to, in string form.
*/
getValues(): string[];

/** Returns whether the value is being automatically computed; setting the value of
* this Parameter has no effect.
*
* Examples of automatically computed Parameters: the variables that give the
* current energy of a simulation. Another example is when the size of a graph's
* SimView is under control of an {@link lab/graph/AutoScale.AutoScale}.
* @return whether the value is being automatically computed
*/
isComputed(): boolean;

/** Sets whether the value is being automatically computed.
See {@link Parameter.isComputed}.
@param value whether the value is being automatically computed.
*/
setComputed(value: boolean): void;

/** Sets the value of this Parameter after converting the given string to the
appropriate type (boolean, number or string).
@param value the value to set this Parameter to, in string form
@throws if the string cannot be converted to the needed type
*/
setFromString(value: string): void;
}

// ******************************* Subject ********************************

/** A Subject notifies its {@link Observer} when
something changes in the Subject. This can be a change in the value of a
{@link Parameter}, or the occurrence of a
{@link GenericEvent}. The Subject maintains a list
of its Observers. An Observer is connected to the Subject via the
{@link Subject.addObserver}
method, which is typically called by the Observer's constructor or the entity that
creates the Observer.

See [Subject, Observer, Parameter](../Architecture.html#subjectobserverparameter) for an
overview. The Subject and Observer interfaces are an implementation of the
[Observer design pattern](http://en.wikipedia.org/wiki/Observer_pattern).

When a change occurs in the Subject,
the {@link Subject.broadcast} method should be called to
inform all Observers of the change. For a Parameter, the "setter" method of the Subject
should call {@link Subject.broadcastParameter}
at the end of the setter method.


Language-Independent Names
--------------------------

To enable scripting, we need Parameters and SubjectEvents to have
[language independent names](../Building.html#languageindependentnames). Therefore
`Parameter.getName()` and `SubjectEvent.getName()` return a language independent name
which is derived from the English localized name by converting the English name to
uppercase and replacing spaces and dashes by underscore.

You can use the function {@link Util.toName} to convert an
English name to the language-independent name. Or use `SubjectEvent.nameEquals()` which
handles the conversion to language independent name.

See [Internationalization](../Building.html#internationalizationi18n) for more
about localized and language-independent strings.


Example Scenario
----------------

Here is an example usage of the Subject and Observer interfaces, along with Parameters
and user interface controls.

<img src="../Subject_Observer_Parameters.svg"
  alt="Subject/Observer Relationships with Parameters" />

The diagram shows a {@link lab/engine2D/ContactSim.ContactSim} as the
Subject. It has a list of Parameters, including a Parameter representing the distance
tolerance which determines when objects are in contact. The Subject also has a list of
Observers, including a {@link lab/controls/NumericControl.NumericControl}
which is connected to the distance tolerance
{@link ParameterNumber}. In its constructor, the
NumericControl adds itself to the list of Observers by calling
{@link Subject.addObserver} on
the Subject of the ParameterNumber.

Whenever the distance tolerance is changed, the Subject should notify each Observer by
calling {@link Subject.broadcast}.
The Observer can then get the current value by calling
`ParameterNumber.getValue`.

This design is very decoupled. The Subject knows nothing about the NumericControl
except that it is an Observer. The Parameter is unaware of the NumericControl. The
NumericControl only knows about the ParameterNumber and that it has a Subject which
will provide notification of changes.
*/
export interface Subject extends Printable {

/** Adds the given Observer to the Subject's list of Observers, so that the Observer
will be notified of changes in this Subject. An Observer may call `Subject.addObserver`
during its `observe` method.
@param observer the Observer to add
*/
addObserver(observer: Observer): void;

/** Notifies all Observers that the Subject has changed by calling
{@link Observer.observe} on each Observer.

An Observer may call {@link Subject.addObserver} or
{@link Subject.removeObserver} during its `observe` method.
@param evt a SubjectEvent with information relating to the change
*/
broadcast(evt: SubjectEvent): void;

/** Notifies all Observers that the Parameter with the given `name` has changed by
calling {@link Observer.observe} on each Observer.
@param name the language-independent or English name of the Parameter
    that has changed
@throws if there is no Parameter with the given name
*/
broadcastParameter(name: string): void;

/** Return the language-independent name of this Subject for scripting purposes.
@return name the language-independent name of this Subject
*/
getName(): string;

/** Returns a copy of the list of Observers of this Subject.
@return a copy of the list of Observers of
    this Subject.
*/
getObservers(): Observer[];

/** Returns the Parameter with the given name.
@param name the language-independent or English name of the Parameter
@return the Parameter with the given name
@throws if there is no Parameter with the given name
*/
getParameter(name: string): Parameter;

/** Returns a copy of the list of this Subject's available Parameters.
@return a copy of the list of
        available Parameters for this Subject
*/
getParameters(): Parameter[];

/** Returns the ParameterBoolean with the given name.
@param name the language-independent or English name of the ParameterBoolean
@return the ParameterBoolean with the given name
@throws if there is no ParameterBoolean with the given name
*/
getParameterBoolean(name: string): ParameterBoolean;

/** Returns the ParameterNumber with the given name.
@param name the language-independent or English name of the ParameterNumber
@return the ParameterNumber with the given name
@throws if there is no ParameterNumber with the given name
*/
getParameterNumber(name: string): ParameterNumber;

/** Returns the ParameterString with the given name.
@param name the language-independent or English name of the ParameterString
@return the ParameterString with the given name
@throws if there is no ParameterString with the given name
*/
getParameterString(name: string): ParameterString;

/** Removes the Observer from the Subject's list of Observers. An Observer may
call `Subject.removeObserver` during its `observe` method.
@param observer the Observer to
        detach from list of Observers
*/
removeObserver(observer: Observer): void;
}

// ******************************* SubjectList ********************************

/** Provides a list of {@link Subject} contained
in this object. Used when creating an
{@link lab/util/EasyScriptParser.EasyScriptParser}.
*/
export interface SubjectList extends Printable {

/** Returns list of Subjects contained in this object, possibly including this object
itself.
@return the Subjects contained in this object
*/
getSubjects(): Subject[];
}

// ******************************* GenericEvent ********************************

/** A simple implementation of a SubjectEvent, represents an event that
has occurred in a Subject.

TO DO: allow localized name?
*/
export class GenericEvent implements SubjectEvent {
  private name_: string;
  private subject_: Subject;
  private value_: any;

/**
@param subject the Subject where the event occurred
@param name the name of the event
@param value an optional value associated with the event
*/
constructor(subject: Subject, name: string, value?: any) {
  this.name_ = Util.validName(Util.toName(name));
  this.subject_ = subject;
  this.value_ = value;
};

/** @inheritDoc */
toString() {
  return this.toStringShort();
};

/** @inheritDoc */
toStringShort() {
  // show the value with toStringShort() if possible
  const v = this.value_;
  let s;
  if (typeof v === 'object' && v !== null && v.toStringShort !== undefined) {
    s = v.toStringShort();
  } else {
    s = v;
  }
  return 'GenericEvent{name_:"'+this.name_+'"'
      +', subject_: '+this.subject_.toStringShort()
      +', value_: '+ s
      +'}';
};

/** @inheritDoc */
getName(opt_localized?: boolean): string {
  // this is just to satisfy the compiler, there is no localized name.
  return opt_localized? this.name_: this.name_;
};

/** @inheritDoc */
getSubject(): Subject {
  return this.subject_;
};

/** Returns the value associated with this event.
@return the value associated with this event
*/
getValue(): any {
  return this.value_;
};

/** @inheritDoc */
nameEquals(name: string): boolean {
  return this.name_ == Util.toName(name);
};
} // end GenericEvent class

Util.defineGlobal('lab$util$GenericEvent', GenericEvent);

// ******************************* GenericObserver ********************************

/** Observes a Subject; when the Subject broadcasts a SubjectEvent then this executes a
specified function.

Example 1
---------
Here is an example of a GenericObserver that prints any event broadcast by a
{@link lab/util/Clock.Clock}:
```js
var obs = new GenericObserver(clock, evt => println('event='+evt));
```
Paste that code into the Terminal command line of any
[application](https://www.myphysicslab.com/develop/build/index-en.html), or
[try this link](<https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html?var%20obs%3Dnew%20GenericObserver%28clock%2Cevt%20%3D%3E%20println%28%27event%3D%27%2Bevt%29%29%3Blayout.showTerminal%28true%29%3B>).
which contains the above code running in the pendulum simulation.
Click the rewind, play, and step buttons to see events in the Terminal output area.

Use the following Terminal command to turn off the GenericObserver:
```js
clock.removeObserver(obs);
```

Example 2
---------
This prints only when a particular Clock event occurs:
```js
var obs = new GenericObserver(clock, evt => {
    if (evt.nameEquals(Clock.CLOCK_PAUSE)) {
      println('event='+evt);
    }
});
```
Paste that code into the Terminal command line of any
[application](https://www.myphysicslab.com/develop/build/index-en.html),
or [try this link](<https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html?var%20obs%3Dnew%20GenericObserver%28clock%2Cfunction%28evt%29%7Bif%28evt.nameEquals%28Clock.CLOCK_PAUSE%29%29%7Bprintln%28%27event%3D%27%2Bevt%29%3B%7D%7D%29%3Blayout.showTerminal%28true%29%3B>)
which contains the above code running in the pendulum simulation.
Click the pause button to see events in the Terminal output area.

Example 3
---------
This sets color of a contact force line according to gap distance: red = zero distance,
green = max distance. This is useful to study the effects of using different settings
for {@link lab/engine2D/ExtraAccel.ExtraAccel}.
```js
new GenericObserver(displayList, evt => {
  if (evt.nameEquals(DisplayList.OBJECT_ADDED)) {
    var obj = evt.getValue();
    if (obj instanceof DisplayLine) {
      var f = obj.getSimObjects()[0];
      if (f.getName().match(/^CONTACT_FORCE1/)) {
        var pct = Math.max(0,
            Math.min(1, f.contactDistance/f.contactTolerance));
        obj.setColor(Util.colorString3(1-pct, pct, 0));
      }
    }
  }
});
```
The above script can be entered into the Terminal command line of most
[applications](https://www.myphysicslab.com/develop/build/index-en.html)
which use  {@link lab/engine2D/ContactSim.ContactSim}.
Or [try this link](<https://www.myphysicslab.com/develop/build/sims/engine2D/ContactApp-en.html?NUMBER_OF_OBJECTS%3D1%3BEXTRA_ACCEL%3Dnone%3BELASTICITY%3D0.6%3BSIM_CANVAS.ALPHA%3D1%3BSIM_CANVAS.BACKGROUND%3D%22%22%3Bnew%20GenericObserver%28displayList%2Cfunction%28evt%29%7Bif%28evt.nameEquals%28DisplayList.OBJECT_ADDED%29%29%7Bvar%20obj%3Devt.getValue%28%29%3Bif%28obj%20instanceof%20DisplayLine%29%7Bvar%20f%3Dobj.getSimObjects%28%29%5B0%5D%3Bif%28f.getName%28%29.match%28%2F%5ECONTACT_FORCE1%2F%29%29%7Bvar%20pct%3DMath.max%280%2CMath.min%281%2Cf.contactDistance%2Ff.contactTolerance%29%29%3Bobj.setColor%28Util.colorString3%281-pct%2Cpct%2C0%29%29%3B%7D%7D%7D%7D%29%3B>)
which contains the above code running in ContactApp. That link also
sets `EXTRA_ACCEL=none` so you will see the gap distance color vary periodically.
*/
export class GenericObserver implements Observer {
   /** Describes what this Observer does, for debugging */
  private readonly purpose_: string;
  private readonly subject_: Subject;
  private readonly observeFn_: (s: SubjectEvent)=>void;

/**
@param subject  the Subject to observe
@param observeFn  function to execute when a SubjectEvent is
    broadcast by Subject, takes a single argument of type SubjectEvent
@param opt_purpose Describes what this Observer does, for debugging
*/
constructor(subject: Subject, observeFn: (s: SubjectEvent)=>void,
    opt_purpose?: string)  {
  this.purpose_ = (opt_purpose || '');
  this.subject_ = subject;
  subject.addObserver(this);
  this.observeFn_ = observeFn;
}

/** @inheritDoc */
toString() {
  return this.toStringShort();
};

/** @inheritDoc */
toStringShort() {
  return 'GenericObserver{subject_: '+this.subject_.toStringShort()
      +(this.purpose_.length > 0 ? ', purpose_:"'+this.purpose_+'"' : '')
      +'}';
};

/** Disconnects this GenericObserver from the Subject.
*/
disconnect(): void {
  this.subject_.removeObserver(this);
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  this.observeFn_(event);
};

} // end GenericObserver class

Util.defineGlobal('lab$util$GenericObserver', GenericObserver);

// ******************************* ParameterBoolean ********************************

/** Provides access to a boolean value of a {@link Subject}.
See {@link Parameter} for more information.

See [Internationalization](../Building.html#internationalizationi18n) for information
about localized and language-independent strings.
*/
export class ParameterBoolean implements Parameter, SubjectEvent {
  private subject_: Subject;
  private name_: string;
  private localName_: string
  private getter_: ()=>boolean;
  private setter_: (v:boolean)=>void;
  private isComputed_:boolean = false;
  /** the translated localized strings corresponding to the values */
  private choices_: string[] = [];
  /** the booleans corresponding to the choices */
  private values_: boolean[] = [];

/**
@param subject the Subject whose value this ParameterBoolean represents
@param name the
    [language-independent name](../Building.html#languageindependentnames) of this
    Parameter; the English name can be passed in here because it will be run thru
    {@link lab/util/Util.Util.toName}.
@param localName the localized name of this Parameter
@param getter A function with no arguments that returns
    the value of this Parameter
@param setter A function with one argument that sets
    the value of this Parameter
@param opt_choices the translated localized strings corresponding to
    the values (optional)
@param opt_values the booleans corresponding to the choices that the
    parameter can be set to (optional)
*/
constructor(subject: Subject, name: string, localName: string, getter: ()=>boolean,
    setter: (v:boolean)=>void, opt_choices?: string[], opt_values?: boolean[]) {
  this.subject_ = subject;
  this.name_ = Util.validName(Util.toName(name));
  this.localName_ = localName;
  this.getter_ = getter;
  this.setter_ = setter;
  this.isComputed_ = false;
  if (opt_choices !== undefined) {
    if (opt_values !== undefined) {
      this.setChoices(opt_choices, opt_values, false);
    } else {
      throw 'values not defined';
    }
  }
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', isComputed_: '+this.isComputed_
      +', localName_: "'+this.localName_+'"'
      +', choices_: '+this.choices_
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'ParameterBoolean{name_: "'+this.name_+'"'
      +', subject_: '+this.subject_.toStringShort()
      +', value: '+this.getValue()+'}';
};

/** @inheritDoc */
getAsString(): string {
  return this.getValue().toString();
};

/** @inheritDoc */
getChoices(): string[] {
  return Array.from(this.choices_);
};

/** @inheritDoc */
getName(opt_localized?: boolean): string {
  return opt_localized ? this.localName_ : this.name_;
};

/** @inheritDoc */
getSubject(): Subject {
  return this.subject_;
};

/** Returns the value of this ParameterBoolean.
@return the value of this ParameterBoolean
*/
getValue(): boolean {
  return this.getter_();
};

/** @inheritDoc */
getValues(): string[] {
  return this.values_.map(v => v.toString());
};

/** @inheritDoc */
isComputed(): boolean {
  return this.isComputed_;
};

/** @inheritDoc */
nameEquals(name: string): boolean {
  return this.name_ == Util.toName(name);
};

/**  Sets the choices and values associated with this Parameter.
@param choices  localized strings giving name of each choice
@param values  the values corresponding to each choice
@param opt_broadcast whether to broadcast this change to the Subject's Observers,
    default is true
@throws if `values` is of different length than `choices`
*/
setChoices(choices: string[], values: boolean[], opt_broadcast?: boolean): void {
  if (values.length !== choices.length) {
    throw 'choices and values not same length';
  }
  this.choices_ = choices;
  this.values_ = values;
  if ((opt_broadcast === undefined) || opt_broadcast) {
    const evt = new GenericEvent(this.subject_, CHOICES_MODIFIED, this);
    this.subject_.broadcast(evt);
  }
};

/** @inheritDoc */
setComputed(value: boolean): void {
  this.isComputed_ = value;
};

/** @inheritDoc */
setFromString(value: string): void {
  this.setValue(value == 'true' || value == 'TRUE');
};

/** Sets the value of this ParameterBoolean.
@param value the value to set this ParameterBoolean to
*/
setValue(value: boolean): void {
  if (typeof value !== 'boolean')
    throw 'non-boolean value: '+value;
  if (value !== this.getValue()) {
    this.setter_(value);
  }
};
}; // end ParameterBoolean class

Util.defineGlobal('lab$util$ParameterBoolean', ParameterBoolean);

// ******************************* ParameterNumber ********************************
/** Provides access to a numeric value of a {@link Subject}.
Has options for setting
number of significant digits to show, and upper/lower limit on value. Default is 3
significant digits, lower limit of zero, and upper limit is infinity.
See {@link Parameter} for more information.

See [Internationalization](../Building.html#internationalizationi18n) for information
about localized and language-independent strings.
*/
export class ParameterNumber implements Parameter, SubjectEvent {
  /** the Subject which provides notification of changes in this Parameter */
  private subject_: Subject;
  private name_: string;
  private localName_: string;
  /** units string such as ' (kg)', to be appended to name when displayed in a */
  private units_: string = '';
  /** A method of Subject with no arguments that returns the value of this Parameter */
  private getter_: ()=>number;
  /** A method of Subject with one argument that sets the value of this Parameter */
  private setter_: (n: number)=>void;
  private isComputed_ = false;
  private signifDigits_ = 3;
  /** Fixed number of fractional decimal places to show, or –1 if variable. */
  private decimalPlaces_ = -1;
  private lowerLimit_ = 0;
  private upperLimit_ = Number.POSITIVE_INFINITY;
  /** the translated localized strings corresponding to the values */
  private choices_: string[] = [];
  /** the integers corresponding to the choices */
  private values_ : number[] = [];

/**
@param subject the Subject whose value this ParameterNumber represents
@param name the
    [language-independent name](../Building.html#languageindependentnames) of this
    Parameter; the English name can be passed in here because it will be run thru
    {@link lab/util/Util.Util.toName}.
@param localName the localized name of this Parameter
@param getter A function with no arguments that returns
    the value of this Parameter
@param setter A function with one argument that sets
    the value of this Parameter
@param opt_choices the translated localized strings corresponding to
    the values (optional)
@param opt_values the numbers corresponding to the choices that the
    parameter can be set to (optional). When specified, only these values are allowed.
*/
constructor(subject: Subject, name: string, localName: string, getter: ()=>number,
    setter: (n: number)=>void, opt_choices?: string[], opt_values?: number[]) {
  this.subject_ = subject;
  this.name_ = Util.validName(Util.toName(name));
  this.localName_ = localName;
  this.getter_ = getter;
  this.setter_ = setter;
  if (opt_choices !== undefined) {
    if (opt_values !== undefined) {
      this.setChoices(opt_choices, opt_values, false);
    } else {
      throw 'values is not defined';
    }
  }
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', isComputed_: '+this.isComputed_
      +', localName_: "'+this.localName_+'"'
      +', units_: "'+this.units_+'"'
      +', lowerLimit_: '+ Util.NF(this.lowerLimit_)
      +', upperLimit_: '+ Util.NF(this.upperLimit_)
      +', decimalPlaces_: '+this.decimalPlaces_
      +', signifDigits_: '+this.signifDigits_
      +', choices_: ['+this.choices_+']'
      +', values_: ['+this.values_+']'
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'ParameterNumber{name_: "'+this.name_+'"'
      +', subject_: '+this.subject_.toStringShort()
      +', value: '+ Util.NF(this.getValue())+'}';
};

/** @inheritDoc */
getAsString(): string {
  return this.getValue().toString();
};

/** @inheritDoc */
getChoices(): string[] {
  return Array.from(this.choices_);
};

/** Returns the suggested number of decimal places to show or –1 if variable.
@return suggested number of decimal places to show or –1 if variable
*/
getDecimalPlaces(): number {
  return this.decimalPlaces_;
};

/** Returns the lower limit; the Parameter value is not allowed to be less than this,
{@link ParameterNumber.setValue} will throw an Error in that case.
@return the lower limit of the Parameter value
*/
getLowerLimit(): number {
  return this.lowerLimit_;
};

/** @inheritDoc */
getName(opt_localized?: boolean): string {
  return opt_localized ? this.localName_ : this.name_;
};

/** Returns the suggested number of significant digits to show, see
{@link ParameterNumber.setSignifDigits}.
@return suggested number of significant digits to show
*/
getSignifDigits(): number {
  return this.signifDigits_;
};

/** @inheritDoc */
getSubject(): Subject {
  return this.subject_;
};

/** Returns the units string such as " (kg)", to be appended to name when displayed
in a user interface control.
@return {string}
*/
getUnits(): string {
  return this.units_;
};

/** Returns the upper limit; the Parameter value is not allowed to be greater than
this, {@link ParameterNumber.setValue} will throw an Error in that case.
@return the upper limit of the Parameter value
*/
getUpperLimit(): number {
  return this.upperLimit_;
};

/** Returns the value of this ParameterNumber.
@return the value of this ParameterNumber
*/
getValue(): number {
  return this.getter_();
};

/** @inheritDoc */
getValues(): string[] {
  return this.values_.map(v => v.toString());
};

/** @inheritDoc */
isComputed(): boolean {
  return this.isComputed_;
};

/** @inheritDoc */
nameEquals(name: string): boolean {
  return this.name_ == Util.toName(name);
};

/**  Sets the choices and values associated with this Parameter.
See [Internationalization](../Building.html#internationalizationi18n).
@param choices  localized strings giving name of each choice
@param values  the values corresponding to each choice
@param opt_broadcast whether to broadcast this change to the Subject's Observers,
    default is true
@throws if `values` is of different length than `choices`
*/
setChoices(choices: string[], values: number[], opt_broadcast?: boolean): void {
  if (values.length !== choices.length) {
    throw 'choices and values not same length';
  }
  this.choices_ = choices;
  this.values_ = values;
  if ((opt_broadcast === undefined) || opt_broadcast) {
    const evt = new GenericEvent(this.subject_, CHOICES_MODIFIED, this);
    this.subject_.broadcast(evt);
  }
};

/** @inheritDoc */
setComputed(value: boolean): void {
  this.isComputed_ = value;
};

/** Sets suggested number of decimal places to show.
@param decimals suggested number of decimal places to show, or –1 if variable
@return this Parameter for chaining setters
*/
setDecimalPlaces(decimals: number): ParameterNumber {
  this.decimalPlaces_ = decimals;
  return this;
};

/** @inheritDoc */
setFromString(value: string): void {
  const v = Number(value);
  if (isNaN(v)) {
    throw 'not a number: '+value;
  }
  this.setValue(v);
};

/** Sets the lower limit; the Parameter value is not allowed to be less than this,
{@link ParameterNumber.setValue} will throw an Error in that case.
@param lowerLimit the lower limit of the Parameter value
@return this ParameterNumber for chaining setters
@throws if the value is currently less than the lower limit, or the lower limit
    is not a number
*/
setLowerLimit(lowerLimit: number): ParameterNumber {
  if (lowerLimit > this.getValue() || lowerLimit > this.upperLimit_)
    throw 'out of range: '+lowerLimit+' value='+this.getValue()
        +' upper='+this.upperLimit_;
  this.lowerLimit_ = lowerLimit;
  return this;
};

/** Sets suggested number of significant digits to show. This affects the number of
decimal places that are displayed. Examples: if significant digits is 3, then we would
show numbers as: 12345, 1234, 123, 12.3, 1.23, 0.123, 0.0123, 0.00123.
@param signifDigits suggested number of significant digits to show
@return this ParameterNumber for chaining setters
*/
setSignifDigits(signifDigits: number): ParameterNumber {
  this.signifDigits_ = signifDigits;
  return this;
};

/** Sets the units string such as " (kg)", to be appended to name when displayed
in a user interface control.
@param value
@return this ParameterNumber for chaining setters
*/
setUnits(value: string): ParameterNumber {
  this.units_ = value;
  return this;
};

/** Sets the upper limit; the Parameter value is not allowed to be more than this,
{@link ParameterNumber.setValue} will throw an Error in that case.

@param upperLimit the upper limit of the Parameter value
@return this ParameterNumber for chaining setters
@throws if the value is currently greater than the upper limit, or the upper
    limit is not a number
*/
setUpperLimit(upperLimit: number): ParameterNumber {
  if (upperLimit < this.getValue() || upperLimit < this.lowerLimit_)
    throw 'out of range: '+upperLimit+' value='+this.getValue()
        +' lower='+this.lowerLimit_;
  this.upperLimit_ = upperLimit;
  return this;
};

/** Sets the value of this ParameterNumber.
@param value the value to set this ParameterNumber to
*/
setValue(value: number): void {
  if (typeof value !== 'number') {
    throw 'not a number: '+value;
  }
  if (value < this.lowerLimit_ || value > this.upperLimit_) {
    throw 'out of range. '+value+' is not between '+this.lowerLimit_
        +' and '+this.upperLimit_;
  }
  if (this.values_.length > 0) {
    if (!this.values_.includes(value)) {
      throw value+' is not an allowed value among: ['+this.values_.join(',')+']';
    }
  }
  if (value !== this.getValue()) {
    this.setter_(value);
  }
};
}; // end ParameterNumber class

Util.defineGlobal('lab$util$ParameterNumber', ParameterNumber);

// ******************************* ParameterString ********************************

/** Provides access to a string value of a {@link Subject}.
See {@link Parameter} for more information.

See [Internationalization](../Building.html#internationalizationi18n) for information
about localized and language-independent strings.
*/
export class ParameterString implements Parameter, SubjectEvent {
  private subject_: Subject
  private name_: string;
  private localName_: string;
  private getter_: ()=>string;
  private setter_: (n: string)=>void;
  private isComputed_: boolean = false;
  /** suggested length of string for making a control */
  private suggestedLength_: number = 20;
  /** maximum length of string */
  private maxLength_: number = Number.POSITIVE_INFINITY;
  /** the translated localized strings corresponding to the values */
  private choices_: string[] = [];
  /** the language-independent strings that the parameter can be set to */
  private values_: string[] = [];
  private inputFunction_: ((s:string)=>string)|null = null;

/**
@param subject the Subject whose value this ParameterString represents
@param name the
    [language-independent name](../Building.html#languageindependentnames) of this
    Parameter; the English name can be passed in here because it will be run thru
    {@link lab/util/Util.Util.toName}.
@param localName the localized name of this Parameter
@param getter A function with no arguments that returns
    the value of this Parameter
@param setter A function with one argument that sets
    the value of this Parameter
@param opt_choices the translated localized strings corresponding to
    the values (optional)
@param opt_values the language-independent strings that the parameter
    can be set to (optional) When specified, only these values are allowed.
*/
constructor(subject: Subject, name: string, localName: string, getter: ()=>string,
    setter: (n: string)=>void, opt_choices?: string[], opt_values?: string[]) {
  this.subject_ = subject;
  this.name_ = Util.validName(Util.toName(name));
  this.localName_ = localName;
  this.getter_ = getter;
  this.setter_ = setter;
  if (opt_choices !== undefined) {
    if (opt_values !== undefined) {
      this.setChoices(opt_choices, opt_values, false);
    } else {
      throw 'values is not defined';
    }
  }
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', isComputed_: '+this.isComputed_
      +', localName_: "'+this.localName_+'"'
      +', suggestedLength_: '+this.suggestedLength_
      +', maxLength_: '+this.maxLength_
      +', choices_: ['+this.choices_+']'
      +', values_: ['+this.values_+']'
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'ParameterString{name_: "'+this.name_+'"'
      +', subject_: '+this.subject_.toStringShort()
      +', value: "'+this.getValue()+'"}';
};

/** @inheritDoc */
getAsString(): string {
  return this.getValue();
};

/** @inheritDoc */
getChoices(): string[] {
  return Array.from(this.choices_);
};

/** Returns the maximum length of the string.
{@link ParameterString.setValue} will throw an Error if
trying to set a string longer than this.
@return the maximum length of the string
*/
getMaxLength(): number {
  return this.maxLength_;
};

/** @inheritDoc */
getName(opt_localized?: boolean): string {
  return opt_localized ? this.localName_ : this.name_;
};

/** @inheritDoc */
getSubject(): Subject {
  return this.subject_;
};

/** Returns the suggested length of string when making a user interface control.
@return the suggested length of string when making a control
*/
getSuggestedLength(): number {
  return this.suggestedLength_;
};

/** Returns the value of this ParameterString.
@return the value of this ParameterString
*/
getValue(): string {
  return this.getter_();
};

/** @inheritDoc */
getValues(): string[] {
  return Array.from(this.values_);
};

/** @inheritDoc */
isComputed(): boolean {
  return this.isComputed_;
};

/** @inheritDoc */
nameEquals(name: string): boolean {
  return this.name_ == Util.toName(name);
};

/**  Sets the choices and values associated with this Parameter.
See [Internationalization](../Building.html#internationalizationi18n).
@param choices  localized strings giving name of each choice
@param values  the values corresponding to each choice
@param opt_broadcast whether to broadcast this change to the Subject's Observers,
    default is true
@throws if `values` is of different length than `choices`
*/
setChoices(choices: string[], values: string[], opt_broadcast?: boolean): void {
  if (values.length !== choices.length) {
    throw 'choices and values not same length';
  }
  this.choices_ = choices;
  this.values_ = values;
  if ((opt_broadcast === undefined) || opt_broadcast) {
    const evt = new GenericEvent(this.subject_, CHOICES_MODIFIED, this);
    this.subject_.broadcast(evt);
  }
};

/** @inheritDoc */
setComputed(value: boolean): void {
  this.isComputed_ = value;
};

/** @inheritDoc */
setFromString(value: string): void {
  this.setValue(value);
};

/** Sets a function which transforms the input string passed to
{@link ParameterString.setValue}.
For example, a function to transform strings to uppercase.
@param fn function to be used to transform input passed to
    {@link ParameterString.setValue}
    or `null` for no transformation
@return this ParameterString for chaining setters
*/
setInputFunction(fn: ((s:string)=>string)|null): ParameterString {
  this.inputFunction_ = fn;
  return this;
};

/** Sets the maximum length of the string.
{@link ParameterString.setValue} will throw an Error if
trying to set a string longer than this.
@param len the maximum length of the string
@return this ParameterString for chaining setters
@throws if the max length is less than length of current value of this
    Parameter.
*/
setMaxLength(len: number): ParameterString {
  if (len < this.getValue().length)
    throw 'too long';
  this.maxLength_ = len;
  return this;
};

/** Sets the suggested length of string when making a user interface control.
@param len suggested length of string to show
@return this Parameter for chaining setters
*/
setSuggestedLength(len: number): ParameterString {
  this.suggestedLength_ = len;
  return this;
};

/** Sets the value of this ParameterString.
@param value the value to set this ParameterString to
*/
setValue(value: string): void {
  if (this.inputFunction_ != null) {
    value = this.inputFunction_(value);
  }
  if (typeof value !== 'string') {
    throw 'non-string value: '+value;
  }
  if (value.length > this.maxLength_) {
    throw 'string too long: '+value+' maxLength='+this.maxLength_;
  }
  if (this.values_.length > 0) {
    if (!this.values_.includes(value)) {
      throw '"'+value+'" is not an allowed value among: ['+this.values_.join(',')+']';
    }
  }
  if (value !== this.getValue()) {
    this.setter_(value);
  }
};
}; // end ParameterString class

Util.defineGlobal('lab$util$ParameterString', ParameterString);
