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

goog.module('myphysicslab.lab.controls.ButtonControl');

goog.require('goog.events');
goog.require('goog.events.Event');
const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A button input element which executes a function when the button is pressed.
Displays an image if provided, otherwise the text name is displayed. The image is
assigned classname `icon` for CSS scripting.

Can be configured so the function is executed repeatedly when the button is held down.
See {@link #repeatDelay} and {@link #repeatFirst}.

* @implements {LabControl}
*/
class ButtonControl {
/**
* @param {string} label name of the button
* @param {!function()} clickFunction the function to execute when button is clicked
* @param {!Node=} opt_image the image to show in the button;  if undefined then
*     the name is displayed as text.
*/
constructor(label, clickFunction, opt_image) {
  /** the name of the button
  * @type {string}
  * @private
  */
  this.label_ = label;
  /**
  * @type {!HTMLButtonElement}
  * @private
  */
  this.button_ = /** @type {!HTMLButtonElement} */(document.createElement('button'));
  this.button_.type = 'button';
  if (!goog.isDef(opt_image)) {
    this.button_.appendChild(document.createTextNode(label));
  } else {
    this.button_.className = 'icon';
    this.button_.appendChild(opt_image);
  }
  /** function to call when the button is clicked
  * @type {function()}
  * @private
  */
  this.clickFunction_ = clickFunction;
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.mouseDownKey_ = goog.events.listen(this.button_, goog.events.EventType.MOUSEDOWN,
      /*callback=*/this.handleClick, /*capture=*/true, this);
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.mouseUpKey_ = goog.events.listen(this.button_, goog.events.EventType.MOUSEUP,
      /*callback=*/this.handleMouseUp, /*capture=*/true, this);
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.dragLeaveKey_ = goog.events.listen(this.button_, goog.events.EventType.DRAGLEAVE,
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
  return Util.ADVANCED ? '' : 'ButtonControl{label_: "'+this.label_+'"}';
};

/** @override */
disconnect() {
  goog.events.unlistenByKey(this.mouseDownKey_);
  goog.events.unlistenByKey(this.mouseUpKey_);
  goog.events.unlistenByKey(this.dragLeaveKey_);
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
* @param {!goog.events.Event} evt the event that caused this callback to fire
* @private
*/
handleClick(evt) {
  this.holdClick();
};

/** This callback fires when a mouseUp or dragLeave occurs on the button.
* @param {!goog.events.Event} evt the event that caused this callback to fire
* @private
*/
handleMouseUp(evt) {
  if (goog.isDef(this.timeoutID_)) {
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
    var d = goog.isDef(this.timeoutID_) ?
        this.repeatDelay : this.repeatFirst * this.repeatDelay;
    this.timeoutID_ = setTimeout(goog.bind(this.holdClick, this), d);
  }
};

/** Set a function to call when the button is clicked.
* @param {function()} clickFunction the function to call when the button is clicked
*/
setClickFunction(clickFunction) {
  this.clickFunction_ = clickFunction;
};

/** @override */
setEnabled(enabled) {
  this.button_.disabled = !enabled;
};

} //end class
exports = ButtonControl;
