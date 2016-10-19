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

goog.provide('myphysicslab.lab.view.DisplayLine');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.model.Line');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

var DisplayObject = myphysicslab.lab.view.DisplayObject;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Displays a {@link myphysicslab.lab.model.Line} as a colored line.

The position is determined by the position of the Line, so {@link #setPosition}
has no effect, and the DisplayLine is never dragable.
The position is reported as the midpoint of the Line by {@link #getPosition}.

* @param {!myphysicslab.lab.model.Line} line the Line to display
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
*/
myphysicslab.lab.view.DisplayLine = function(line) {
  /**
  * @type {!myphysicslab.lab.model.Line}
  * @private
  */
  this.line_ =line;
  /** Color used when drawing the line, a CSS3 color value.
  * @type {string}
  */
  this.color = DisplayLine.color;
  /** Thickness to use when drawing the line, in screen coordinates, so a unit
  * is a screen pixel.
  * @type {number}
  */
  this.thickness = DisplayLine.thickness;
  /** Line dash array used when drawing the line.  Corresponds to lengths of dashes
  * and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
  * length 3 with spaces of length 5. Empty array indicates solid line.
  * @type {!Array<number>}
  */
  this.lineDash = DisplayLine.lineDash;
};
var DisplayLine = myphysicslab.lab.view.DisplayLine;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayLine.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', thickness: '+NF(this.thickness)
        +', color: "'+this.color+'"'
        +'}';
  };

  /** @inheritDoc */
  DisplayLine.prototype.toStringShort = function() {
    return 'DisplayLine{line_: '+this.line_.toStringShort()+'}';
  };
};

/** Default value for {@link #color}, used when creating a DisplayLine.
* @type {string}
*/
DisplayLine.color = 'black';

/** Default value for {@link #lineDash}, used when creating a DisplayLine.
* @type {!Array<number>}
*/
DisplayLine.lineDash = [ ];

/** Default value for {@link #thickness}, used when creating a DisplayLine.
* @type {number}
*/
DisplayLine.thickness = 1.0;

/**  Sets the defaults to match the given DisplayLine.
* @param {!myphysicslab.lab.view.DisplayLine} dispObj the DisplayLine to get style from
*/
DisplayLine.setStyle = function(dispObj) {
  DisplayLine.color = dispObj.color;
  DisplayLine.thickness = dispObj.thickness;
  DisplayLine.lineDash = dispObj.lineDash;
};

/** @inheritDoc */
DisplayLine.prototype.contains = function(point) {
  return false;
};

/** @inheritDoc */
DisplayLine.prototype.draw = function(context, map) {
  var p1 = map.simToScreen(this.line_.getStartPoint());
  var p2 = map.simToScreen(this.line_.getEndPoint());
  var len = p1.distanceTo(p2);
  if (len < 1e-6)
    return;
  context.save()
  if (this.lineDash.length > 0 && context.setLineDash) {
    context.setLineDash(this.lineDash);
  }
  context.lineWidth = this.thickness;
  context.strokeStyle = this.color;
  context.beginPath();
  context.moveTo(p1.getX(), p1.getY());
  context.lineTo(p2.getX(), p2.getY());
  context.stroke();
  context.restore();
};

/** @inheritDoc */
DisplayLine.prototype.isDragable = function() {
  return false;
};

/** @inheritDoc */
DisplayLine.prototype.getMassObjects = function() {
  return [ ];
};

/** @inheritDoc */
DisplayLine.prototype.getPosition = function() {
  // return midpoint of the line
  return this.line_.getStartPoint().add(this.line_.getEndPoint()).multiply(0.5);
};

/** @inheritDoc */
DisplayLine.prototype.getSimObjects = function() {
  return [ this.line_ ];
};

/** @inheritDoc */
DisplayLine.prototype.setDragable = function(dragable) {
  // does nothing
};

/** @inheritDoc */
DisplayLine.prototype.setPosition = function(position) {
};

});  // goog.scope
