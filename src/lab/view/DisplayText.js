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

goog.provide('myphysicslab.lab.view.DisplayText');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

var DisplayObject = myphysicslab.lab.view.DisplayObject;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Displays text. Can set display attributes {@link #font}, {@link #fillStyle},
{@link #textAlign}, and {@link #textBaseline}.
@param {string=} opt_text the text to display (default is empty string)
@param {!Vector=} opt_position the position in simulation coords to display the text
    (default is origin)
* @param {?DisplayText=} proto the prototype DisplayText to inherit properties from
* @constructor
* @final
* @struct
* @implements {DisplayObject}
*/
myphysicslab.lab.view.DisplayText = function(opt_text, opt_position, proto) {
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
  this.proto_ = goog.isDefAndNotNull(proto) ? proto : null;
};
var DisplayText = myphysicslab.lab.view.DisplayText;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayText.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', location: '+this.location_
        +', font: '+this.getFont()
        +', fillStyle: "'+this.getFillStyle()+'"'
        +', textAlign: '+this.getTextAlign()
        +', textBaseline: '+this.getTextBaseline()
        +', zIndex: '+this.getZIndex()
        +'}';
  };

  /** @inheritDoc */
  DisplayText.prototype.toStringShort = function() {
    return 'DisplayText{text_: '+this.text_+'}';
  };
};

/** @inheritDoc */
DisplayText.prototype.contains = function(point) {
  return false; // could figure out bounds?
};

/** @inheritDoc */
DisplayText.prototype.draw = function(context, map) {
  context.save()
  context.fillStyle = this.getFillStyle();
  context.font = this.getFont();
  context.textAlign = this.getTextAlign();
  context.textBaseline = this.getTextBaseline();
  var x1 = map.simToScreenX(this.location_.getX());
  var y1 = map.simToScreenY(this.location_.getY());
  /*if (this.centered_) {
    var textWidth = context.measureText(this.text_).width;
    x1 = x1 - textWidth/2;
  }*/
  context.fillText(this.text_, x1, y1);
  context.restore();
};

/** Color used when drawing the text, a CSS3 color value.
* @return {string}
*/
DisplayText.prototype.getFillStyle = function() {
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
DisplayText.prototype.getFont = function() {
  if (this.font_ !== undefined) {
    return this.font_;
  } else if (this.proto_ != null) {
    return this.proto_.getFont();
  } else {
    return '12pt sans-serif';
  }
};

/** @inheritDoc */
DisplayText.prototype.getMassObjects = function() {
  return [ ];
};

/** @inheritDoc */
DisplayText.prototype.getPosition = function() {
  return this.location_;
};

/** @inheritDoc */
DisplayText.prototype.getSimObjects = function() {
  return [ ];
};

/** The horizontal alignment of text; allowed values are 'left', 'center', 'right',
* 'start' and 'end'.
* @return {string}
*/
DisplayText.prototype.getTextAlign = function() {
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
DisplayText.prototype.getTextBaseline = function() {
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
DisplayText.prototype.getText = function() {
  return this.text_;
};

/** @inheritDoc */
DisplayText.prototype.getZIndex = function() {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 0;
  }
};

/** @inheritDoc */
DisplayText.prototype.isDragable = function() {
  return this.dragable_;
};

/** @inheritDoc */
DisplayText.prototype.setDragable = function(dragable) {
  this.dragable_ = dragable;
};

/** Color used when drawing the text, a CSS3 color value.
* @param {string|undefined} value
* @return {!DisplayText} this object for chaining setters
*/
DisplayText.prototype.setFillStyle = function(value) {
  this.fillStyle_ = value;
  return this;
};

/** Sets the font used when drawing the text.
* @param {string|undefined} value a CSS font specification, or undefined
* @return {!DisplayText} this object for chaining setters
*/
DisplayText.prototype.setFont = function(value) {
  this.font_ = value;
  return this;
};

/** @inheritDoc */
DisplayText.prototype.setPosition = function(position) {
  this.location_ = position;
};

/** Sets the text to draw.
* @param {string} text the text to draw.
*/
DisplayText.prototype.setText = function(text) {
  this.text_ = text;
};

/** The horizontal alignment of text; allowed values are 'left', 'center', 'right',
* 'start' and 'end'.
* @param {string|undefined} value
* @return {!DisplayText} this object for chaining setters
*/
DisplayText.prototype.setTextAlign = function(value) {
  this.textAlign_ = value;
  return this;
};

/** The vertical alignment of text; allowed values are 'top', 'middle', 'bottom',
* 'alphabetic', 'hanging', and 'ideographic'.
* @param {string|undefined} value
* @return {!DisplayText} this object for chaining setters
*/
DisplayText.prototype.setTextBaseline = function(value) {
  this.textBaseline_ = value;
  return this;
};

/** @inheritDoc */
DisplayText.prototype.setZIndex = function(zIndex) {
  this.zIndex_ = zIndex;
};

});  // goog.scope
