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

goog.module('myphysicslab.lab.controls.ButtonControl2');

const Event = goog.require('goog.events.Event');
const events = goog.require('goog.events');
const EventType = goog.require('goog.events.EventType');
const Key = goog.require('goog.events.Key');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A button input element which executes a function when the button is pressed and
another function when released.
Displays an image if provided, otherwise the text name is displayed. The image is
assigned classname `icon` for CSS scripting.

* @implements {LabControl}
*/
class ButtonControl2 {
/**
* @param {string} label name of the button
* @param {!function()} clickFunction the function to execute when button is clicked
* @param {!function()} releaseFunction the function to execute when button is released
* @param {!Node=} opt_image the image to show in the button;  if undefined then
*     the name is displayed as text.
* @param {!HTMLButtonElement=} button the button to use; if not provided, then
*     a button is created.
*/
constructor(label, clickFunction, releaseFunction, opt_image, button) {
  /** the name of the button
  * @type {string}
  * @private
  */
  this.label_ = label;
  if (!goog.isObject(button)) {
    button = /** @type {!HTMLButtonElement} */(document.createElement('button'));
    button.type = 'button';
    if (opt_image === undefined) {
      button.appendChild(document.createTextNode(label));
    } else {
      button.className = 'icon';
      button.appendChild(opt_image);
    }
  }
  /**
  * @type {!HTMLButtonElement}
  * @private
  */
  this.button_ = button;
  /** function to call when the button is clicked
  * @type {function()}
  * @private
  */
  this.clickFunction_ = clickFunction;
  /** function to call when the button is released
  * @type {function()}
  * @private
  */
  this.releaseFunction_ = releaseFunction;
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.mouseDownKey_ = events.listen(this.button_, EventType.MOUSEDOWN,
      /*callback=*/this.handleClick, /*capture=*/true, this);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.mouseUpKey_ = events.listen(this.button_, EventType.MOUSEUP,
      /*callback=*/this.handleMouseUp, /*capture=*/true, this);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.dragLeaveKey_ = events.listen(this.button_, EventType.DRAGLEAVE,
      /*callback=*/this.handleMouseUp, /*capture=*/false, this);
  /** the ID used to cancel the callback
  * @type {number|undefined}
  * @private
  */
  this.timeoutID_ = undefined;
  /** When button is held down we fire the `clickFunction` repeatedly. This is the delay
  * in milliseconds between firing of the `clickFunction`. Zero means only fire once.
  * The default is zero.
  * @type {number}
  */
  this.repeatDelay = 0;
  /** The first `repeatDelay` should be longer to avoid unwanted held-button repeats.
  * This is the multiplier used on the first delay.
  * @type {number}
  */
  this.repeatFirst = 2;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', timeoutID_: '+this.timeoutID_
      +', repeatDelay: '+Util.NF(this.repeatDelay)
      +', repeatFirst: '+this.repeatFirst
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'ButtonControl2{label_: "'+this.label_+'"}';
};

/** @override */
disconnect() {
  events.unlistenByKey(this.mouseDownKey_);
  events.unlistenByKey(this.mouseUpKey_);
  events.unlistenByKey(this.dragLeaveKey_);
};

/** @override */
getElement() {
  return this.button_;
};

/** @override */
getParameter() {
  return null;
};

/** This callback fires when the button is clicked.
* @param {!Event} evt the event that caused this callback to fire
* @private
*/
handleClick(evt) {
  this.holdClick();
};

/** This callback fires when a mouseUp or dragLeave occurs on the button.
* @param {!Event} evt the event that caused this callback to fire
* @private
*/
handleMouseUp(evt) {
  this.releaseFunction_();
  if (this.timeoutID_ !== undefined) {
    clearTimeout(this.timeoutID_);
    this.timeoutID_ = undefined;
  }
};

/** This callback fires repeatedly while the button is held down.
* @return {undefined}
* @private
*/
holdClick() {
  this.clickFunction_();
  if (this.repeatDelay > 0) {
    // make the first delay longer to avoid unwanted held-button repeats.
    const d = this.timeoutID_ !== undefined ?
        this.repeatDelay : this.repeatFirst * this.repeatDelay;
    this.timeoutID_ = setTimeout( () => this.holdClick(), d);
  }
};

/** Set a function to call when the button is clicked.
* @param {function()} clickFunction the function to call when the button is clicked
*/
setClickFunction(clickFunction) {
  this.clickFunction_ = clickFunction;
};

/** Set a function to call when the button is released.
* @param {function()} releaseFunction the function to call when the button is released
*/
setReleaseFunction(releaseFunction) {
  this.releaseFunction_ = releaseFunction;
};

/** @override */
setEnabled(enabled) {
  this.button_.disabled = !enabled;
};

} // end class
exports = ButtonControl2;
