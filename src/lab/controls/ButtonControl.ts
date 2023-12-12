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

import { LabControl } from './LabControl.js'
import { Parameter } from '../util/Observe.js'
import { Util } from '../util/Util.js'

/** A button input element which executes a function when the button is pressed.
Displays an image if provided, otherwise the text name is displayed. The button is
assigned classname `icon` for CSS scripting.

Can be configured so the function is executed repeatedly when the button is held down.
See {@link ButtonControl.repeatDelay} and {@link ButtonControl.repeatFirst}.
*/
export class ButtonControl implements LabControl {
  /** the name of the button */
  private label_: string;
  private button_: HTMLButtonElement;
  /** function to call when the button is clicked */
  private clickFunction_: ()=>void;
  private mouseDownFn_: (e:Event)=>void;
  private mouseUpFn_: (e:Event)=>void;
  /** the ID used to cancel the callback */
  private timeoutID_: number|undefined;
  /** When button is held down we fire the `clickFunction` repeatedly. This is the delay
  * in milliseconds between firing of the `clickFunction`. Zero means only fire once.
  * The default is zero.
  */
  repeatDelay: number = 0;
  /** The first `repeatDelay` should be longer to avoid unwanted held-button repeats.
  * This is the multiplier used on the first delay.
  */
  repeatFirst: number = 2;

/**
* @param label name of the button
* @param clickFunction the function to execute when button is clicked
* @param opt_image the image to show in the button;  if undefined then
*     the name is displayed as text.
* @param button the button to use; if not provided, then a button is created.
*/
constructor(label: string, clickFunction: ()=>void, opt_image?: Node,
    button?: HTMLButtonElement) {
  this.label_ = label;
  if (button === undefined) {
    button = document.createElement('button');
    button.type = 'button';
    if (opt_image === undefined) {
      button.appendChild(document.createTextNode(label));
    } else {
      button.className = 'icon';
      button.appendChild(opt_image);
    }
  }
  this.button_ = button;
  this.clickFunction_ = clickFunction;
  this.mouseDownFn_ = this.handleClick.bind(this);
  this.button_.addEventListener('mousedown', this.mouseDownFn_, /*capture=*/true);
  this.mouseUpFn_ = this.handleMouseUp.bind(this);
  this.button_.addEventListener('mouseup', this.mouseUpFn_, /*capture=*/true);
  this.button_.addEventListener('dragleave', this.mouseUpFn_, /*capture=*/false);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', timeoutID_: '+this.timeoutID_
      +', repeatDelay: '+Util.NF(this.repeatDelay)
      +', repeatFirst: '+this.repeatFirst
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'ButtonControl{label_: "'+this.label_+'"}';
};

/** @inheritDoc */
disconnect(): void {
  this.button_.removeEventListener('mousedown', this.mouseDownFn_, /*capture=*/true);
  this.button_.removeEventListener('mouseup', this.mouseUpFn_, /*capture=*/true);
  this.button_.removeEventListener('dragleave', this.mouseUpFn_, /*capture=*/false);
};

/** @inheritDoc */
getElement(): HTMLElement {
  return this.button_;
};

/** @inheritDoc */
getParameter(): null|Parameter {
  return null;
};

/** This callback fires when the button is clicked.
* @param evt the event that caused this callback to fire
*/
private handleClick(_evt: Event) {
  this.holdClick();
};

/** This callback fires when a mouseUp or dragLeave occurs on the button.
* @param evt the event that caused this callback to fire
*/
private handleMouseUp(_evt: Event) {
  if (this.timeoutID_ !== undefined) {
    clearTimeout(this.timeoutID_);
    this.timeoutID_ = undefined;
  }
};

/** This callback fires repeatedly while the button is held down. */
private holdClick(): void {
  this.clickFunction_();
  if (this.repeatDelay > 0) {
    // make the first delay longer to avoid unwanted held-button repeats.
    const d = this.timeoutID_ !== undefined ?
        this.repeatDelay : this.repeatFirst * this.repeatDelay;
    this.timeoutID_ = setTimeout( () => this.holdClick(), d);
  }
};

/** Set a function to call when the button is clicked.
* @param clickFunction the function to call when the button is clicked
*/
setClickFunction(clickFunction: ()=>void) {
  this.clickFunction_ = clickFunction;
};

/** @inheritDoc */
setEnabled(enabled: boolean): void {
  this.button_.disabled = !enabled;
};

} // end class
Util.defineGlobal('lab$controls$ButtonControl', ButtonControl);
