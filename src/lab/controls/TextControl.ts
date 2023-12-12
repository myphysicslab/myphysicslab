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
import { Observer, Parameter, SubjectEvent, ParameterBoolean, ParameterString }
    from '../util/Observe.js';
import { Util } from '../util/Util.js';

/** A user interface control for displaying and editing the text value of an object.
Synchronizes with the target object's string value by executing specified `getter` and
`setter` functions. Creates (or uses an existing) text input element to display and
edit the text.

Because this is an {@link Observer}, you can connect it to a Subject;
when the Subject broadcasts events, this will update the value it displays.
*/
export class TextControlBase implements Observer, LabControl {
  /** the name shown in a label next to the textField */
  private label_: string;
  /** function that returns the current target value */
  private getter_: ()=>string;
  /** function to change the target value */
  private setter_: (value: string)=>void;
  /** The value of the target as last seen by this control; */
  private value_: string;
  /** The number of columns (characters) shown in the text field. */
  private columns_: number = 40;
  /** the text field showing the double value */
  private textField_: HTMLInputElement;
  private topElement_: HTMLElement;
  /** The last value that the text field was set to, used to detect when user has
  intentionally changed the value.
  */
  private lastValue_: string = '';
  private changeFn_: (e:Event)=>void;
  private focusFn_: (e:Event)=>void;
  private clickFn_: (e:Event)=>void;
  /**  True when first click in field after gaining focus. */
  private firstClick_: boolean = false;

/**
* @param label the text shown in a label next to the text input area
* @param getter function that returns the target value
* @param setter function to change the target value
* @param textField  the text field to use; if not provided, then
*     a text input field is created.
*/
constructor(label: string, getter: ()=>string, setter: (value: string)=>void,
    textField?: HTMLInputElement) {
  this.label_ = label;
  this.getter_ = getter;
  this.setter_ = setter;
  this.value_ = getter();
  if (typeof this.value_ !== 'string') {
    throw 'not a string '+this.value_;
  }
  let labelElement: HTMLLabelElement|null = null;
  if (textField !== undefined) {
    // see if the parent is a label
    const parent = textField.parentElement;
    if (parent != null && parent.tagName == 'LABEL') {
      labelElement = parent as HTMLLabelElement;
    }
  } else {
    // create input text field and label
    textField = document.createElement('input');
    textField.type = 'text';
    textField.size = this.columns_;
    labelElement = document.createElement('label');
    labelElement.appendChild(document.createTextNode(this.label_));
    labelElement.appendChild(textField);
  }
  this.textField_ = textField;
  this.topElement_ = labelElement !== null ? labelElement : this.textField_;
  this.textField_.style.textAlign = 'left';
  
  this.changeFn_ = this.validate.bind(this);
  this.textField_.addEventListener('change', this.changeFn_, /*capture=*/true);
  this.focusFn_ = this.gainFocus.bind(this);
  this.textField_.addEventListener('focus', this.focusFn_, /*capture=*/false);
  this.clickFn_ = this.doClick.bind(this);
  this.textField_.addEventListener('click', this.clickFn_, /*capture=*/false);
  this.formatTextField();
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', columns_: '+this.columns_
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return this.getClassName() + '{label_: "'+this.label_+'"}';
};

/** @inheritDoc */
disconnect() {
  this.textField_.removeEventListener('change', this.changeFn_, /*capture=*/true);
  this.textField_.removeEventListener('focus', this.focusFn_, /*capture=*/false);
  this.textField_.removeEventListener('click', this.clickFn_, /*capture=*/false);
};

/**
* @param event the event that caused this callback to fire
*/
private doClick(_event: Event): void {
  if (this.firstClick_) {
    // first click after gaining focus should select entire field
    this.textField_.select();
    this.firstClick_ = false;
  }
};

/**  Sets the text field to match this.value_.
*/
private formatTextField(): void {
  this.lastValue_ = this.value_;
  this.textField_.value = this.value_;
  this.textField_.size =this.columns_;
};

/**
* @param event the event that caused this callback to fire
*/
private gainFocus(_event: Event): void {
  this.firstClick_ = true;
};

/** Returns name of class of this object.
* @return name of class of this object.
*/
getClassName(): string {
  return 'TextControlBase';
};

/** Returns width of the text input field (number of characters).
@return the width of the text input field.
*/
getColumns(): number {
  return this.columns_;
};

/** @inheritDoc */
getElement(): HTMLElement {
  return this.topElement_;
};

/** @inheritDoc */
getParameter(): null|Parameter {
  return null;
};

/** Returns the value of this control (which should match the target value if
{@link TextControlBase.observe} is being called).
@return the value of this control
*/
getValue(): string {
  return this.value_;
};

/** @inheritDoc */
observe(_event: SubjectEvent): void {
  // Ensures that the value displayed by the control matches the target value.
  this.setValue(this.getter_());
};

/** Sets the width of the text input field (number of characters).
@param value the width of the text input field
@return this object for chaining setters
*/
setColumns(value: number): TextControlBase {
  if (this.columns_ != value) {
    this.columns_ = value;
    this.formatTextField();
  }
  return this;
};

/** @inheritDoc */
setEnabled(enabled: boolean): void {
  this.textField_.disabled = !enabled;
};

/** Changes the value shown by this control, and sets the target to this value.
@throws if value is not a string
@param value  the new value
*/
setValue(value: string): void {
  if (value != this.value_) {
    /*if (Util.DEBUG) {
      console.log('TextControlBase.setValue value='+value+' vs '+this.value_);
    }
    */
    try {
      if (typeof value !== 'string') {
        throw 'not a string '+value;
      }
      // set this.value_ first to prevent the observe() coming here twice
      this.value_ = value;
      // parameter_.setValue() broadcasts which causes observe() to be called here
      this.setter_(value);
    } catch(ex) {
      alert(ex);
      this.value_ = this.getter_();
    }
    this.formatTextField();
  }
};

/** Checks that an entered number is a valid number, updates the target value
* if valid; if an exception occurs then shows an alert and restores the old value.
* @param event the event that caused this callback to fire
*/
private validate(_event: Event): void {
  // trim whitespace from start and end of string
  const nowValue = this.textField_.value.replace(/^\s*|\s*$/g, '');
  // Compare the current and previous text value of the field.
  // Note that the double value may be different from the text value because
  // of rounding.
  if (nowValue != this.lastValue_) {
    const value = nowValue;
    if (typeof value !== 'string') {
      alert('not a string: '+nowValue);
      this.formatTextField();
    } else {
      this.setValue(value);
    }
  }
};

} // end class
Util.defineGlobal('lab$controls$TextControlBase', TextControlBase);

// ***************************** TextControl ****************************

/** A user interface control for displaying and editing the value of a
{@link ParameterString}.
*/
export class TextControl extends TextControlBase {
  private parameter_: ParameterString;

/**
* @param parameter the ParameterString to display and edit
* @param textField  the text field to use; if not provided, then
*     a text field is created.
*/
constructor(parameter: ParameterString, textField?: HTMLInputElement) {
  super(parameter.getName(/*localized=*/true),
      () => parameter.getValue(), a => parameter.setValue(a), textField);
  this.parameter_ = parameter;
  this.setColumns(this.parameter_.getSuggestedLength());
  this.parameter_.getSubject().addObserver(this);
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      + ', parameter_: '+this.parameter_.toStringShort()+'}';
};

/** @inheritDoc */
override disconnect() {
  super.disconnect();
  this.parameter_.getSubject().removeObserver(this);
};

/** @inheritDoc */
override getClassName(): string {
  return 'TextControl';
};

/** @inheritDoc */
override getParameter(): null|Parameter {
  return this.parameter_;
};

} // end class
Util.defineGlobal('lab$controls$TextControl', TextControl);
