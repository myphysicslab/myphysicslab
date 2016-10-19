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
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
*/
myphysicslab.lab.view.DisplayText = function(opt_text, opt_position) {
  /**
  * @type {!string}
  * @private
  */
  this.text_ = opt_text || '';
  /**
  * @type {!myphysicslab.lab.util.Vector}
  * @private
  */
  this.location_ = opt_position || Vector.ORIGIN;
  /** The color used when drawing the text, a CSS3 color value.
  * @type {string}
  */
  this.fillStyle = DisplayText.fillStyle;
  /** The font used when drawing the text, a CSS3 font specification.
  * @type {string}
  */
  this.font = DisplayText.font;
  /** The horizontal alignment of text; legal values are 'left', 'center', 'right',
  * 'start' and 'end'.
  * @type {string}
  */
  this.textAlign = DisplayText.textAlign;
  /** The vertical alignment of text; legal values are 'top', 'middle', 'bottom',
  * 'alphabetic', 'hanging', and 'ideographic'.
  * @type {string}
  */
  this.textBaseline = DisplayText.textBaseline;
  /**
  * @type {boolean}
  * @private
  */
  this.dragable_ = false;
};
var DisplayText = myphysicslab.lab.view.DisplayText;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayText.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
      +', location: '+this.location_
      +', font: '+this.font
      +', fillStyle: "'+this.fillStyle+'"'
      +', textAlign: '+this.textAlign
      +', textBaseline: '+this.textBaseline
      +'}';
  };

  /** @inheritDoc */
  DisplayText.prototype.toStringShort = function() {
    return 'DisplayText{text_: '+this.text_+'}';
  };
};

/** Default value for {@link #fillStyle}, used when creating a DisplayText.
* @type {string}
*/
DisplayText.fillStyle = 'black';

/** Default value for {@link #font}, used when creating a DisplayText.
* @type {string}
*/
DisplayText.font = '12pt sans-serif';

/** Default value for {@link #textAlign}, used when creating a DisplayText.
* @type {string}
*/
DisplayText.textAlign = 'left';

/** Default value for {@link #textBaseline}, used when creating a DisplayText.
* @type {string}
*/
DisplayText.textBaseline = 'alphabetic';

/** Sets the default style used when creating a new DisplayText to match
* the given DisplayText.
* @param {!myphysicslab.lab.view.DisplayText} dispObj the DisplayText to get
*    style from
*/
DisplayText.setStyle = function(dispObj) {
  DisplayText.fillStyle = dispObj.fillStyle;
  DisplayText.font = dispObj.font;
  DisplayText.textAlign = dispObj.textAlign;
  DisplayText.textBaseline = dispObj.textBaseline;
};

/** @inheritDoc */
DisplayText.prototype.contains = function(point) {
  return false; // could figure out bounds?
};

/** @inheritDoc */
DisplayText.prototype.draw = function(context, map) {
  context.save()
  context.fillStyle = this.fillStyle;
  context.font = this.font;
  context.textAlign = this.textAlign;
  context.textBaseline = this.textBaseline;
  var x1 = map.simToScreenX(this.location_.getX());
  var y1 = map.simToScreenY(this.location_.getY());
  /*if (this.centered_) {
    var textWidth = context.measureText(this.text_).width;
    x1 = x1 - textWidth/2;
  }*/
  context.fillText(this.text_, x1, y1);
  context.restore();
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

/** Returns the text being drawn.
* @return {string} the text being drawn.
*/
DisplayText.prototype.getText = function() {
  return this.text_;
};

/** @inheritDoc */
DisplayText.prototype.isDragable = function() {
  return this.dragable_;
};

/** @inheritDoc */
DisplayText.prototype.setDragable = function(dragable) {
  this.dragable_ = dragable;
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

});  // goog.scope
