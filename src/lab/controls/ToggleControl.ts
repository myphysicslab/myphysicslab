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
import { Observer, Parameter, ParameterBoolean, SubjectEvent }
    from '../util/Observe.js';
import { Util } from '../util/Util.js';

/** Creates and manages an HTMLButtonElement that toggles between two images; the
state is connected to a ParameterBoolean. The button is assigned classname `icon` for
CSS scripting.
*/
export class ToggleControl implements Observer, LabControl {
  private parameter_: ParameterBoolean;
  private name_: string;
  /**  The state of the user control (which might not match the state of the target)*/
  private state_: boolean;
  private imageOff_: HTMLImageElement;
  private imageOn_: HTMLImageElement;
  private button_: HTMLButtonElement;
  private clickFn_: (e:Event)=>void;

/**
* @param parameter  the ParameterBoolean to connect to
* @param imageOn the HTMLImageElement to show for the 'on' state
* @param imageOff the HTMLImageElement to show for the 'off' state
*/
constructor(parameter: ParameterBoolean, imageOn: HTMLImageElement,
    imageOff: HTMLImageElement) {
  this.parameter_ = parameter;
  this.name_ = this.parameter_.getName();
  this.state_ = this.parameter_.getValue();
  this.imageOn_ = imageOn;
  this.imageOff_ = imageOff;
  this.button_ = document.createElement('button') as HTMLButtonElement;
  this.button_.type = 'button';
  this.button_.className = 'icon';
  // we show the icon that is opposite of the current state, because that is what will
  // happen when user clicks the button
  imageOff.style.display = this.state_ ? 'block' : 'none'
  imageOn.style.display = this.state_ ? 'none' : 'block'
  this.button_.appendChild(imageOn);
  this.button_.appendChild(imageOff);
  this.clickFn_ = this.handleClick.bind(this);
  this.button_.addEventListener('click', this.clickFn_, /*capture=*/true);
  this.parameter_.getSubject().addObserver(this);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      + ', state_: '+this.state_
      + '}';
};

/** @inheritDoc */
toStringShort() {
  return 'ToggleControl{parameter_: '+
      this.parameter_.toStringShort()+'}';
};

/** @inheritDoc */
disconnect(): void {
  this.parameter_.getSubject().removeObserver(this);
  this.button_.removeEventListener('click', this.clickFn_, /*capture=*/true);
};

/** @inheritDoc */
getElement(): HTMLElement {
  return this.button_;
};

/** @inheritDoc */
getParameter(): null|Parameter {
  return this.parameter_;
};

/** Returns the state of this control (which should match the target state when
{@link observe} is being called).
@return the state of this control, `true` means 'on'
*/
getState(): boolean {
  return this.state_;
};

/** This callback fires when the button is clicked.
* @param event the event that caused this callback to fire
*/
private handleClick(_event: Event): void {
  this.setState(!this.state_);
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  // only update when this parameter has changed
  if (event == this.parameter_) {
    // Ensure that the value displayed by the control matches the Parameter value
    this.setState(this.parameter_.getValue());
  }
};

/** @inheritDoc */
setEnabled(enabled: boolean): void {
  this.button_.disabled = !enabled;
};

/** Sets the state of the control, and modifies the ParameterBoolean to match.
* @param newState the new state of the control, `true` means 'on'
*/
setState(newState: boolean): void {
  if (this.state_ != newState) {
    this.parameter_.setValue(newState);
    this.state_ = newState;
    // we show the icon that is opposite of the current state, because that is what will
    // happen when user clicks the button
    this.imageOff_.style.display = newState ? 'block' : 'none'
    this.imageOn_.style.display = newState ? 'none' : 'block'
  }
};

} // end class
Util.defineGlobal('lab$controls$ToggleControl', ToggleControl);
