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

goog.module('myphysicslab.lab.view.DisplayText');

const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays text. Can set display attributes {@link #font}, {@link #fillStyle},
{@link #textAlign}, and {@link #textBaseline}.
* @implements {DisplayObject}
*/
class DisplayText {
/**
* @param {string=} opt_text the text to display (default is empty string)
* @param {!Vector=} opt_position the position in simulation coords to display the text
*     (default is origin)
* @param {?DisplayText=} proto the prototype DisplayText to inherit properties from
*/
constructor(opt_text, opt_position, proto) {
  /**
  * @type {!string}
  * @private
  */
  this.text_ = opt_text || '';
  /**
  * @type {!Vector}
  * @private
  */
  this.location_ = opt_position || Vector.ORIGIN;
  /** The color used when drawing the text, a CSS3 color value.
  * @type {string|undefined}
  * @private
  */
  this.fillStyle_;
  /** The font used when drawing the text, a CSS3 font specification.
  * @type {string|undefined}
  * @private
  */
  this.font_;
  /** The horizontal alignment of text; legal values are 'left', 'center', 'right',
  * 'start' and 'end'.
  * @type {string|undefined}
  * @private
  */
  this.textAlign_;
  /** The vertical alignment of text; legal values are 'top', 'middle', 'bottom',
  * 'alphabetic', 'hanging', and 'ideographic'.
  * @type {string|undefined}
  * @private
  */
  this.textBaseline_;
  /**
  * @type {number|undefined}
  * @private
  */
  this.zIndex_ = 0;
  /**
  * @type {boolean}
  * @private
  */
  this.dragable_ = false;
  /**
  * @type {?DisplayText}
  * @private
  */
  this.proto_ = proto != null ? proto : null;
  /**
  * @type {boolean}
  * @private
  */
  this.changed_ = true;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', location: '+this.location_
      +', font: '+this.getFont()
      +', fillStyle: "'+this.getFillStyle()+'"'
      +', textAlign: '+this.getTextAlign()
      +', textBaseline: '+this.getTextBaseline()
      +', zIndex: '+this.getZIndex()
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'DisplayText{text_: '+this.text_+'}';
};

/** @override */
contains(point) {
  return false; // could figure out bounds?
};

/** @override */
draw(context, map) {
  context.save()
  context.fillStyle = this.getFillStyle();
  context.font = this.getFont();
  context.textAlign = this.getTextAlign();
  context.textBaseline = this.getTextBaseline();
  const x1 = map.simToScreenX(this.location_.getX());
  const y1 = map.simToScreenY(this.location_.getY());
  /*if (this.centered_) {
    const textWidth = context.measureText(this.text_).width;
    x1 = x1 - textWidth/2;
  }*/
  context.fillText(this.text_, x1, y1);
  context.restore();
};

/** @override */
getChanged() {
  if (this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Color used when drawing the text, a CSS3 color value.
* @return {string}
*/
getFillStyle() {
  if (this.fillStyle_ !== undefined) {
    return this.fillStyle_;
  } else if (this.proto_ != null) {
    return this.proto_.getFillStyle();
  } else {
    return 'black';
  }
};

/** Font used when drawing the text.
* @return {string} a CSS font specification
*/
getFont() {
  if (this.font_ !== undefined) {
    return this.font_;
  } else if (this.proto_ != null) {
    return this.proto_.getFont();
  } else {
    return '12pt sans-serif';
  }
};

/** @override */
getMassObjects() {
  return [ ];
};

/** @override */
getPosition() {
  return this.location_;
};

/** @override */
getSimObjects() {
  return [ ];
};

/** The horizontal alignment of text; allowed values are 'left', 'center', 'right',
* 'start' and 'end'.
* @return {string}
*/
getTextAlign() {
  if (this.textAlign_ !== undefined) {
    return this.textAlign_;
  } else if (this.proto_ != null) {
    return this.proto_.getTextAlign();
  } else {
    return 'left';
  }
};

/** The vertical alignment of text; allowed values are 'top', 'middle', 'bottom',
* 'alphabetic', 'hanging', and 'ideographic'.
* @return {string}
*/
getTextBaseline() {
  if (this.textBaseline_ !== undefined) {
    return this.textBaseline_;
  } else if (this.proto_ != null) {
    return this.proto_.getTextBaseline();
  } else {
    return 'alphabetic';
  }
};

/** Returns the text being drawn.
* @return {string} the text being drawn.
*/
getText() {
  return this.text_;
};

/** @override */
getZIndex() {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 0;
  }
};

/** @override */
isDragable() {
  return this.dragable_;
};

/** @override */
setDragable(dragable) {
  this.dragable_ = dragable;
};

/** Color used when drawing the text, a CSS3 color value.
* @param {string|undefined} value
* @return {!DisplayText} this object for chaining setters
*/
setFillStyle(value) {
  this.fillStyle_ = value;
  this.changed_ = true;
  return this;
};

/** Sets the font used when drawing the text.
* @param {string|undefined} value a CSS font specification, or undefined
* @return {!DisplayText} this object for chaining setters
*/
setFont(value) {
  this.font_ = value;
  this.changed_ = true;
  return this;
};

/** @override */
setPosition(position) {
  this.location_ = position;
  this.changed_ = true;
};

/** Sets the text to draw.
* @param {string} text the text to draw.
*/
setText(text) {
  this.text_ = text;
  this.changed_ = true;
};

/** The horizontal alignment of text; allowed values are 'left', 'center', 'right',
* 'start' and 'end'.
* @param {string|undefined} value
* @return {!DisplayText} this object for chaining setters
*/
setTextAlign(value) {
  this.textAlign_ = value;
  this.changed_ = true;
  return this;
};

/** The vertical alignment of text; allowed values are 'top', 'middle', 'bottom',
* 'alphabetic', 'hanging', and 'ideographic'.
* @param {string|undefined} value
* @return {!DisplayText} this object for chaining setters
*/
setTextBaseline(value) {
  this.textBaseline_ = value;
  this.changed_ = true;
  return this;
};

/** @override */
setZIndex(zIndex) {
  this.zIndex_ = zIndex;
  this.changed_ = true;
};

} // end class
exports = DisplayText;
