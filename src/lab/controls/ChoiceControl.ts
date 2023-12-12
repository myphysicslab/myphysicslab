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

import { LabControl } from './LabControl.js';
import { Observer, Parameter, Subject, SubjectEvent, CHOICES_MODIFIED }
    from '../util/Observe.js';
import { Util } from '../util/Util.js';

/** A pop-up menu which which synchronizes with a target object's string value by
executing specified `getter` and `setter` functions.

Getter and Setter Functions
---------------------------
The `setter` and `getter` functions are used to synchronize the menu and target object.

+ the `getter` returns the string value that corresponds to the target state

+ the `setter` modifies the target state to correspond to the given string value

The menu is initially set to show the the target's current value, as given by the
`getter`.

When a menu item is selected, the target is modified by calling the `setter` with the
value corresponding to the selected choice.

Choices and Values
------------------
ChoiceControlBase has two (same-length) arrays:

+ The array of **choices** are the strings which are displayed in the menu. These
should be localized (translated) strings.

+ The array of **values** are strings that correspond to each choice. The value is
given to the setter function to change the target object.

No Selection State
--------------------
A ChoiceControlBase can be in a state of 'no selection', which is indicated by index of
`–1` in {@link ChoiceControlBase.setChoice} or {@link ChoiceControlBase.getChoice}. In this case, the menu item shown is
blank (no text is shown, just empty space). This happens when the value returned by the
`getter` function is not among the array of ChoiceControlBase values.

When moving into a state of 'no selection', no notification is given via the
specified `setter` function. When moving out of the 'no selection' state, the `setter`
is called as normal.

Updating The Control
--------------------
To keep the control in sync with the target object, call the
{@link ChoiceControlBase.observe} method whenever a change in the value of the target
object occurs. If the target object is a {@link Subject} then you can
add this control as an Observer of the Subject.

*/
export class ChoiceControlBase implements Observer, LabControl {
  private getter_: ()=>string;
  private setter_: (value: string)=>void;
  /** The menu items shown to the user for each choice, an array of localized
  * (translated) strings.
  */
  protected choices: string[];
  private values_: string[];
  /** the currently selected item, or -1 if no item selected
  */
  private currentIndex_: number;
  private selectMenu_: HTMLSelectElement;
  private label_: string;
  private topElement_: HTMLElement;
  private changeFn_: (e:Event)=>void;

/**
* @param choices an array of localized strings giving the names
*   of the menu items.
* @param values array of values corresponding to the choices, in
*    string form; these values will be supplied to the setter function when the
*    corresponding menu item is chosen
* @param getter function that returns the value that corresponds
*    to the target's current state
* @param setter function that modifies the target's state to
*    be the given string value
* @param opt_label the text label to show besides this choice; if `null` or
*    `undefined` or empty string then no label is made.
*/
constructor(choices: string[], values: string[], getter: ()=>string, 
    setter: (value: string)=>void, opt_label?: null|string) {
  this.getter_ = getter;
  this.setter_ = setter;
  this.choices = choices;
  this.values_ = values;
  this.currentIndex_ = this.values_.indexOf(getter());
  this.selectMenu_ = document.createElement('select');
  Util.assert(!this.selectMenu_.multiple);
  // `type` is a read-only field for SelectElement
  Util.assert(this.selectMenu_.type == 'select-one');
  this.buildSelectMenu();
  this.label_ = opt_label ?? '';
  /** text label to show next to the choice control, or null if no label desired.
  */
  let myLabel: HTMLLabelElement|null = null;
  if (this.label_.length > 0) {
    const labelElement = document.createElement('label');
    labelElement.appendChild(document.createTextNode(this.label_));
    labelElement.appendChild(this.selectMenu_);
    myLabel = labelElement;
  }
  // HTML Javascript bug? selectedIndex changes after selectMenu is appended to label.
  // Therefore must do this after append to label.
  this.selectMenu_.selectedIndex = this.currentIndex_;
  this.topElement_ = myLabel !== null ? myLabel : this.selectMenu_;
  this.changeFn_ = this.itemStateChanged.bind(this);
  this.selectMenu_.addEventListener('change', this.changeFn_, /*capture=*/true);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', currentIndex_: '+this.currentIndex_
      +', choices.length: '+this.choices.length
      +', selected: "'+(this.currentIndex_ > -1 ?
        this.choices[this.currentIndex_] : '(none)')
      +'"}';
};

/** @inheritDoc */
toStringShort() {
  return this.getClassName() + '{label_: "'+this.label_+'"}';
};

private buildSelectMenu(): void {
  // remove any existing options from list
  this.selectMenu_.options.length = 0;
  for (let i=0, len=this.choices.length; i<len; i++) {
    this.selectMenu_.options[i] = new Option(this.choices[i]);
  }
};

/** @inheritDoc */
disconnect(): void {
  this.selectMenu_.removeEventListener('change', this.changeFn_, /*capture=*/true);
};

/** Returns the index of the currently selected choice, or -1 if no item selected. The
* first item has index zero. See {@link ChoiceControlBase.setChoice}.
* @return the index of the currently selected choice, or -1 if no item selected
*/
getChoice(): number {
  return this.currentIndex_;
};

/** Returns name of class of this object.
* @return name of class of this object.
*/
getClassName(): string {
  return 'ChoiceControlBase';
};

/** @inheritDoc */
getElement(): HTMLElement {
  return this.topElement_;
};

/** @inheritDoc */
getParameter(): null|Parameter {
  return null;
};

/**
* @param event the event that caused this callback to fire
*/
private itemStateChanged(_event: Event) {
  if (this.selectMenu_.selectedIndex !== this.currentIndex_) {
    this.setChoice(this.selectMenu_.selectedIndex);
  }
};

/** @inheritDoc */
observe(_event: SubjectEvent): void {
  // Ensure that the value displayed by the control matches the target value.
  const index = this.values_.indexOf(this.getter_());
  this.setChoice(index);
};

/** Changes the menu item shown by this control, and sets the target to have the
corresponding value by firing the `setter` function. An index of -1 causes this control
to enter the
["no selection" state](./lab_controls_ChoiceControl.ChoiceControlBase.html#md:no-selection-state).
@param index the index of the chosen item within array of choices,
    where the first item has index zero and -1 means no item is selected
*/
setChoice(index: number): void {
  if (this.currentIndex_ !== index) {
    const n = this.selectMenu_.options.length;
    if (this.values_.length != n) {
      throw 'ChoiceControl: values_.length='+this.values_.length+
          ' but menu.options.length='+n;
    }
    try {
      if (index < -1) {
        index = -1;
      } else if (index > n-1) {
        index = n-1;
      }
      // set this.currentIndex_ first to prevent the observe() coming here twice
      this.currentIndex_ = index;
      if (index > -1) {
        // parameter.setValue() broadcasts which causes observe() to be called here
        this.setter_(this.values_[index]);
      }
    } catch(ex) {
      // How to test this: in a running app, find a ChoiceControl, using browser
      // console change one of the values_ to be a non-allowed value (not in
      // Parameter's list of values), then select the corresponding choice. Example:
      //    app.diffEqChoice.values_[0]='Foo'
      // Alternately, change one of the entries in the Parameter's values_, so
      // that the ChoiceControl has a now invalid value at the corresponding spot.
      //    app.diffEqSolver.getParameter('DIFF_EQ_SOLVER').values_[0]='Foo'
      alert(ex);
      this.currentIndex_ = this.values_.indexOf(this.getter_());
    }
    this.selectMenu_.selectedIndex = this.currentIndex_;
  }
};

/** Changes the array of choices and modifies the current choice to match the target's
state. The `setter` function is not called.
@param choices  the new set of choices to display
@param values  the new set of values that correspond to the choices
@throws if choices and values have different length
*/
setChoices(choices: string[], values: string[]): void {
  if (choices.length != values.length) {
    throw '';
  }
  this.choices = choices;
  this.values_ = values;
  this.currentIndex_ = this.values_.indexOf(this.getter_());
  this.buildSelectMenu();
  this.selectMenu_.selectedIndex = this.currentIndex_;
};

/** @inheritDoc */
setEnabled(enabled: boolean): void {
  this.selectMenu_.disabled = !enabled;
};

} // end ChoiceControlBase class
Util.defineGlobal('lab$controls$ChoiceControlBase', ChoiceControlBase);

// ***************************** ChoiceControl ****************************

/** A pop-up menu which synchronizes its state with the
{@link Parameter} of a {@link Subject}.

When the value of the ChoiceControl is changed, the Parameter's value is changed
accordingly and therefore the Subject broadcasts the Parameter's value to all its
Observers.

ChoiceControl extends {@link ChoiceControlBase}, which has
getter and setter functions that operate on strings. Therefore the getter and setter
functions used here are {@link Parameter.getAsString} and
{@link Parameter.setFromString}.

Choices and Values
------------------
If the choices and values are *not* specified as arguments to the constructor, then the
choices and values of the Parameter are used, see
{@link Parameter.getChoices} and
{@link Parameter.getValues}.

If the choices and values *are* specified as arguments to the constructor, those will
override the choices and values of the Parameter.

*/
export class ChoiceControl extends ChoiceControlBase {
  private parameter_: Parameter;

/**
@param parameter the parameter to modify
@param opt_label the text label to show besides this choice, or `null` or
    empty string for no label.  If `undefined`, then the Parameter's name is used.
@param opt_choices an array of localized strings giving the names
    of the menu items; if not specified, then the Parameter's choices are used.
@param opt_values array of values corresponding to the choices;
    if not specified, then the Parameter's values are used.
*/
constructor(parameter: Parameter, opt_label?: null|string, opt_choices?: string[],
    opt_values?: string[]) {
  const choices = opt_choices ?? parameter.getChoices();
  const values = opt_values ?? parameter.getValues();
  const label = opt_label ?? parameter.getName(/*localized=*/true);
  super(choices, values, () => parameter.getAsString(),
      a => parameter.setFromString(a), label);
  this.parameter_ = parameter;
  this.parameter_.getSubject().addObserver(this);
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      + ', parameter_: '+this.parameter_.toStringShort()+'}';
};

/** @inheritDoc */
override disconnect(): void {
  super.disconnect();
  this.parameter_.getSubject().removeObserver(this);
};

/** @inheritDoc */
override getClassName(): string {
  return 'ChoiceControl';
};

/** @inheritDoc */
override getParameter(): null|Parameter {
  return this.parameter_;
};

/** @inheritDoc */
override observe(event: SubjectEvent): void {
  if (event.getValue() == this.parameter_
      && event.nameEquals(CHOICES_MODIFIED)) {
    // For performance reasons: delay rebuilding the menu for cases when many changes
    // are happening at once. To avoid rebuilding the menu each time, we wait 50ms;
    // then likely all the changes have occurred
    // and the first of these to fire will rebuild the menu correctly;
    // the later ones to fire will see that the current menu matches the Parameter
    // choices and do nothing.
    // Example: adding several bodies by calling RigidBodySim.addBody().
    // That results in VarsList.addVariables() broadcasting VARS_MODIFIED event each
    // time a body is added.
    setTimeout( () => this.rebuildMenu(), 50);
  } else if (event == this.parameter_) {
    // only update when this parameter has changed
    super.observe(event);
  }
};

/** Rebuild menu to match Parameter's set of choices and values */
private rebuildMenu(): void {
  const newChoices = this.parameter_.getChoices();
  // Does the current menu match the current set of choices?  If so, do nothing.
  if (!Util.equals(this.choices, newChoices)) {
    this.setChoices(newChoices, this.parameter_.getValues());
  }
};

} // end ChoiceControl class
Util.defineGlobal('lab$controls$ChoiceControl', ChoiceControl);
