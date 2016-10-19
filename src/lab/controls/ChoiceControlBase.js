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

goog.provide('myphysicslab.lab.controls.ChoiceControlBase');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.controls.LabControl');

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** A pop-up menu which executes a specified `setter` function when selecting a menu
choice.

This is the base class for {@link myphysicslab.lab.controls.ChoiceControl} which
which connects to a {@link myphysicslab.lab.util.Parameter}.

Choices and Values
------------------
+ the array of translated localized **choices** are the strings which are
displayed in the menu.

+ the array of **values** correspond to each choice. The type of the value is that of
the generic template type `T`, which is either `string`, `number`, or `boolean`.


Getter and Setter Functions
---------------------------
The `setter` and `getter` functions synchronize between a target object and the
menu.

+ the `getter` returns the value that corresponds to the target state

+ the `setter` modifies the target state to correspond to the given value

The menu item is initially set to correspond to the position in the array of values of
the target's value returned by the `getter`. When a menu item is selected, we call the
`setter` with the corresponding value in the array of values.


'No Selection' State
--------------------
A ChoiceControlBase can be in a state of 'no selection', which is indicated by the a value
of `–1`, see {@link #setChoice}. This happens when the value is not among the array of
values. When moving into a state of 'no selection', no notification is given via the
specified `setter` function. When moving out of the 'no selection' state, the `setter`
is called as normal.


Updating The Control
--------------------
To keep the control in sync with the target object, call the {@link #update} method
whenever a change in the value of the target object occurs. If the target
object is a {@link myphysicslab.lab.util.Subject} then you can add this control as an
Observer of the Subject.


* @param {!Array<string>} choices an array of localized strings giving the names
   of the menu items.
* @param {!Array<string>} values array of values corresponding to the choices, in
    string form
* @param {function():string} getter function that returns the value that corresponds
  to the target state
* @param {function(string)} setter function that modifies the target state to
  correspond to the given value
* @param {?string=} opt_label the text label to show besides this choice; if `null` or
    `undefined` or empty string then no label is made.
* @constructor
* @struct
* @implements {myphysicslab.lab.controls.LabControl}
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.controls.ChoiceControlBase = function(choices, values, getter, setter,
      opt_label) {
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
  /** choices are the localized translated form of the item, which are presented to
  * the user in the menu items.
  * @type {!Array<string>}
  * @protected
  */
  this.choices_ = choices;
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
      /*callback=*/goog.bind(this.itemStateChanged, this), /*capture=*/true);
  /**
  * @type {boolean}
  * @const
  * @private
  */
  this.DEBUG_ = false;
};

var ChoiceControlBase = myphysicslab.lab.controls.ChoiceControlBase;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  ChoiceControlBase.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', currentIndex_: '+this.currentIndex_
        +', choices_.length: '+this.choices_.length
        +', selected: "'+(this.currentIndex_ > -1 ?
          this.choices_[this.currentIndex_] : '(none)')
        +'"}';
  };

  /** @inheritDoc */
  ChoiceControlBase.prototype.toStringShort = function() {
    return this.getClassName() + '{label_: "'+this.label_+'"}';
  };
}

/**
* @return {undefined}
* @private
*/
ChoiceControlBase.prototype.buildSelectMenu = function() {
  // empty options from list
  this.selectMenu_.options.length = 0;
  for (var i=0, len=this.choices_.length; i<len; i++) {
    // compiler bug: can no longer make an Option this way. April 25, 2016.
    // See https://github.com/google/closure-compiler/issues/1759
    //this.selectMenu_.options[i] = new Option(this.choices_[i]);
    var opt =  /** @type {HTMLOptionElement} */(document.createElement('option'));
    opt.text = this.choices_[i];
    this.selectMenu_.options[i] = opt;
  }
};

/** @inheritDoc */
ChoiceControlBase.prototype.disconnect = function() {
  goog.events.unlistenByKey(this.changeKey_);
};

/** Returns the index of the currently selected choice, or -1 if no item selected. The
first item has index zero. See {@link #setChoice}.
* @return {number} the index of the currently selected choice, or -1 if no item selected
*/
ChoiceControlBase.prototype.getChoice = function() {
  return this.currentIndex_;
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
*/
ChoiceControlBase.prototype.getClassName = function() {
  return 'ChoiceControlBase';
};

/** @inheritDoc */
ChoiceControlBase.prototype.getElement = function() {
  return this.topElement_;
};

/** @inheritDoc */
ChoiceControlBase.prototype.getParameter = function() {
  return null;
};

/**
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
ChoiceControlBase.prototype.itemStateChanged = function(event) {
  if (this.selectMenu_.selectedIndex !== this.currentIndex_) {
    this.setChoice(this.selectMenu_.selectedIndex);
  }
};

/** @inheritDoc */
ChoiceControlBase.prototype.observe =  function(event) {
  // Ensure that the value displayed by the control matches the target value.
  var index = goog.array.indexOf(this.values_, this.getter_());
  this.setChoice(index);
};

/** Changes the value shown by this control, and sets the target to this value.
Sets the choice menu to the specified value, and fires the 'setter function' unless
the index is -1. The first item has index zero. See {@link #getChoice}.
Index -1 goes to the 'no selection' state.
@param {number} index the index of the chosen item, or -1 if no item is selected
*/
ChoiceControlBase.prototype.setChoice = function(index) {
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
      // set this.currentIndex_ first to prevent the update() coming here twice
      this.currentIndex_ = index;
      if (index > -1) {
        // parameter.setValue() broadcasts which causes update() to be called here
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

/** Changes the array of choices and sets the current choice. The setter function is
not be called.
@param {!Array<string>} choices  the new set of choices to display
@param {!Array<string>} values  the new set of values that correspond to the choices
@throws {Error} if choices and values have different length
*/
ChoiceControlBase.prototype.setChoices = function(choices, values) {
  if (choices.length != values.length) {
    throw new Error();
  }
  this.choices_ = choices;
  this.values_ = values;
  this.currentIndex_ = goog.array.indexOf(this.values_, this.getter_());
  this.buildSelectMenu();
  this.selectMenu_.selectedIndex = this.currentIndex_;
};

/** @inheritDoc */
ChoiceControlBase.prototype.setEnabled = function(enabled) {
  this.selectMenu_.disabled = !enabled;
};

}); // goog.scope
