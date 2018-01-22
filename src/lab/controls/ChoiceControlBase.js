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

goog.module('myphysicslab.lab.controls.ChoiceControlBase');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');

const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const Util = goog.require('myphysicslab.lab.util.Util');

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

<a id="noselectionstate"></a>
'No Selection' State
--------------------
A ChoiceControlBase can be in a state of 'no selection', which is indicated by index of
`–1` in {@link #setChoice} or {@link #getChoice}. In this case, the menu item shown is
blank (no text is shown, just empty space). This happens when the value returned by the
`getter` function is not among the array of ChoiceControlBase values.

When moving into a state of 'no selection', no notification is given via the
specified `setter` function. When moving out of the 'no selection' state, the `setter`
is called as normal.

Updating The Control
--------------------
To keep the control in sync with the target object, call the {@link #observe} method
whenever a change in the value of the target object occurs. If the target
object is a {@link myphysicslab.lab.util.Subject} then you can add this control as an
Observer of the Subject.

* @implements {LabControl}
* @implements {Observer}
*/
class ChoiceControlBase {
/**
* @param {!Array<string>} choices an array of localized strings giving the names
   of the menu items.
* @param {!Array<string>} values array of values corresponding to the choices, in
    string form; these values will be supplied to the setter function when the
    corresponding menu item is chosen
* @param {function():string} getter function that returns the value that corresponds
    to the target's current state
* @param {function(string)} setter function that modifies the target's state to
    be the given string value
* @param {?string=} opt_label the text label to show besides this choice; if `null` or
    `undefined` or empty string then no label is made.
*/
constructor(choices, values, getter, setter, opt_label) {
  /**
  * @type {function():string}
  * @private
  */
  this.getter_ = getter;
  /**
  * @type {function(string)}
  * @private
  */
  this.setter_ = setter;
  /** The menu items shown to the user for each choice, an array of localized
  * (translated) strings.
  * @type {!Array<string>}
  * @protected
  */
  this.choices = choices;
  /**
  * @type {!Array<string>}
  * @private
  */
  this.values_ = values;
  /** the currently selected item, or -1 if no item selected
  * @type {number}
  * @private
  */
  this.currentIndex_ = goog.array.indexOf(this.values_, getter());
  /**
  * @type {!HTMLSelectElement}
  * @private
  */
  this.selectMenu_ =
      /** @type {!HTMLSelectElement} */(document.createElement('select'));
  goog.asserts.assert(!this.selectMenu_.multiple);
  // `type` is a read-only field for SelectElement
  goog.asserts.assert(this.selectMenu_.type == 'select-one');
  this.buildSelectMenu();
  /**
  * @type {string}
  * @private
  */
  this.label_ = goog.isString(opt_label) ? opt_label : '';
  /** text label to show next to the choice control, or null if no label desired.
  * @type {?HTMLLabelElement}
  */
  var myLabel = null;
  if (this.label_.length > 0) {
    var html_label = /** @type {!HTMLLabelElement} */(document.createElement('LABEL'));
    html_label.appendChild(document.createTextNode(this.label_));
    html_label.appendChild(this.selectMenu_);
    myLabel = html_label;
  }
  // HTML Javascript bug? selectedIndex changes after selectMenu is appended to label.
  // Therefore must do this after append to label.
  this.selectMenu_.selectedIndex = this.currentIndex_;
  /**
  * @type {!Element}
  * @private
  */
  this.topElement_ = myLabel !== null ? myLabel : this.selectMenu_;
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.changeKey_ = goog.events.listen(this.selectMenu_, goog.events.EventType.CHANGE,
      /*callback=*/this.itemStateChanged, /*capture=*/true, this);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', currentIndex_: '+this.currentIndex_
      +', choices.length: '+this.choices.length
      +', selected: "'+(this.currentIndex_ > -1 ?
        this.choices[this.currentIndex_] : '(none)')
      +'"}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : this.getClassName() + '{label_: "'+this.label_+'"}';
};

/**
* @return {undefined}
* @private
*/
buildSelectMenu() {
  // remove any existing options from list
  this.selectMenu_.options.length = 0;
  for (var i=0, len=this.choices.length; i<len; i++) {
    this.selectMenu_.options[i] = new Option(this.choices[i]);
  }
};

/** @override */
disconnect() {
  goog.events.unlistenByKey(this.changeKey_);
};

/** Returns the index of the currently selected choice, or -1 if no item selected. The
first item has index zero. See {@link #setChoice}.
* @return {number} the index of the currently selected choice, or -1 if no item selected
*/
getChoice() {
  return this.currentIndex_;
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
*/
getClassName() {
  return 'ChoiceControlBase';
};

/** @override */
getElement() {
  return this.topElement_;
};

/** @override */
getParameter() {
  return null;
};

/**
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
itemStateChanged(event) {
  if (this.selectMenu_.selectedIndex !== this.currentIndex_) {
    this.setChoice(this.selectMenu_.selectedIndex);
  }
};

/** @override */
observe(event) {
  // Ensure that the value displayed by the control matches the target value.
  var index = goog.array.indexOf(this.values_, this.getter_());
  this.setChoice(index);
};

/** Changes the menu item shown by this control, and sets the target to have the
corresponding value by firing the `setter` function. An index of -1 causes this control
to enter the
["no selection" state](myphysicslab.lab.controls.ChoiceControlBase.html#noselectionstate).
@param {number} index the index of the chosen item within array of choices,
    where the first item has index zero and -1 means no item is selected
*/
setChoice(index) {
  if (this.currentIndex_ !== index) {
    var n = this.selectMenu_.options.length;
    if (this.values_.length != n) {
      throw new Error('ChoiceControl: values_.length='+this.values_.length+
          ' but menu.options.length='+n);
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
      this.currentIndex_ = goog.array.indexOf(this.values_, this.getter_());
    }
    this.selectMenu_.selectedIndex = this.currentIndex_;
  }
};

/** Changes the array of choices and modifies the current choice to match the target's
state. The `setter` function is not called.
@param {!Array<string>} choices  the new set of choices to display
@param {!Array<string>} values  the new set of values that correspond to the choices
@throws {!Error} if choices and values have different length
*/
setChoices(choices, values) {
  if (choices.length != values.length) {
    throw new Error();
  }
  this.choices = choices;
  this.values_ = values;
  this.currentIndex_ = goog.array.indexOf(this.values_, this.getter_());
  this.buildSelectMenu();
  this.selectMenu_.selectedIndex = this.currentIndex_;
};

/** @override */
setEnabled(enabled) {
  this.selectMenu_.disabled = !enabled;
};

} //end class
exports = ChoiceControlBase;
