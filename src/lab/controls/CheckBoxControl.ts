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
import { Observer, Parameter, SubjectEvent, ParameterBoolean }
    from '../util/Observe.js';
import { Util } from '../util/Util.js';

/** A checkbox input element which synchronizes with a target boolean value by
executing specified `getter` and `setter` functions.

Because this is an {@link Observer}, you can connect it to a Subject;
when the Subject broadcasts events, the {@link observe} method
ensures that this control reflects the current target value.
*/
export class CheckBoxControlBase implements Observer, LabControl {
  /** the name shown in a label next to the checkbox */
  private label_: string;
  /** function that returns the current target state */
  private getter_: ()=>boolean;
  /** function to change the target state */
  private setter_: (value: boolean)=>void;
  /** The state of the user control (which might not match the state of the target) */
  private state_: boolean;
  private checkBox_: HTMLInputElement;
  private topElement_: HTMLElement;
  private changeFn_: (e:Event)=>void;

/**
* @param label the name shown in a label next to the checkbox
* @param getter function that returns the current target state
* @param setter function to change the target state
* @param checkBox  the checkbox to use; if not provided, then
*     a checkbox and label are created.
*/
constructor(label: string, getter: ()=>boolean, setter: (value: boolean)=>void,
    checkBox?: HTMLInputElement) {
  this.label_ = label;
  this.getter_ = getter;
  this.setter_ = setter;
  this.state_ = getter();
  let labelElement: HTMLLabelElement|null = null;
  if (checkBox !== undefined) {
    // see if the parent is a label
    const parent = checkBox.parentElement;
    if (parent != null && parent.tagName == 'LABEL') {
      labelElement = parent as HTMLLabelElement;
    }
  } else {
    // create check box and label
    checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    labelElement = document.createElement('label');
    labelElement.appendChild(checkBox);
    labelElement.appendChild(document.createTextNode(this.label_));
  }
  this.checkBox_ = checkBox;
  // force passed-in checkBox to match state. This could fire an event, so
  // do it before hooking up our event handlers.
  this.checkBox_.checked = this.state_;
  this.topElement_ = labelElement !== null ? labelElement : this.checkBox_;
  this.changeFn_ = this.handleClick.bind(this);
  this.checkBox_.addEventListener('change', this.changeFn_, /*capture=*/true);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      + ', state_: '+this.state_
      + '}';
};

/** @inheritDoc */
toStringShort() {
  return this.getClassName() + '{label_: "'+this.label_+'"}';
};

/** @inheritDoc */
disconnect(): void {
  this.checkBox_.removeEventListener('change', this.changeFn_, /*capture=*/true);
};

/** Returns name of class of this object.
* @return name of class of this object.
*/
getClassName(): string {
  return 'CheckBoxControlBase';
};

/** @inheritDoc */
getElement(): HTMLElement {
  return this.topElement_;
};

/** @inheritDoc */
getParameter(): null|Parameter {
  return null;
};

/** Returns the checked state of this control (which should match the target state if
{@link observe} is being called).
@return the checked state of this control
*/
getState(): boolean {
  return this.getter_();
};

/** This callback fires when the button is clicked.
* @param _event the event that caused this callback to fire
*/
private handleClick(_event: Event) {
  this.setState(!this.getState());
};

/** @inheritDoc */
observe(_event: SubjectEvent): void {
  // Ensure that the correct value is displayed by the control.
  this.setState(this.getState());
};

/** @inheritDoc */
setEnabled(enabled: boolean): void {
  this.checkBox_.disabled = !enabled;
};

/** Sets the checked state of this control, and modifies the target if necessary.
* @param newState the checked state to set the control to
*/
setState(newState: boolean): void {
  if (this.getState() != newState) {
    this.setter_(newState);
  }
  if (this.state_ != this.getState()) {
    this.state_ = this.getState();
    this.checkBox_.checked = this.state_;
  }
};

} // end CheckBoxControlBase class

Util.defineGlobal('lab$controls$CheckBoxControlBase', CheckBoxControlBase);


// ***************************** CheckBoxControl ****************************

/** A checkbox input element that is synchronized with a
* {@link ParameterBoolean}.
*/
export class CheckBoxControl extends CheckBoxControlBase {
  private parameter_: ParameterBoolean;

/**
* @param parameter the ParameterBoolean to synchronize with
* @param checkBox the check box to use; if not provided, then a check box is created.
*/
constructor(parameter: ParameterBoolean, checkBox?: HTMLInputElement) {
  super(parameter.getName(/*localized=*/true),
      () => parameter.getValue(), a => parameter.setValue(a), checkBox);
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
  return 'CheckBoxControl';
};

/** @inheritDoc */
override getParameter(): null|Parameter {
  return this.parameter_;
};

/** @inheritDoc */
override observe(event: SubjectEvent): void {
  // only update when this parameter has changed
  if (event == this.parameter_) {
    super.observe(event);
  }
};

} // end CheckBoxControl class
Util.defineGlobal('lab$controls$CheckBoxControl', CheckBoxControl);
