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

goog.provide('myphysicslab.lab.view.DisplaySpring');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

var AffineTransform = myphysicslab.lab.util.AffineTransform;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var Spring = myphysicslab.lab.model.Spring;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Displays a {@link myphysicslab.lab.model.Spring}. Can show either a jagged or
straight line, see {@link #drawMode}. Can have a different color when compressed or
expanded, see {@link #colorCompressed} and {@link #colorExpanded}.
The width determines how wide back-and-forth the jagged lines go, see {@link #width}.

The position is reported as the midpoint of the Spring by {@link #getPosition}.
The position is determined by the position of the Spring, so {@link #setPosition}
has no effect, and the DisplaySpring is never dragable.

* @param {!myphysicslab.lab.model.Spring} spring the Spring to display
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
*/
myphysicslab.lab.view.DisplaySpring = function(spring) {
  /**
  * @type {!myphysicslab.lab.model.Spring}
  * @private
  */
  this.spring_ = spring;
  /** How wide back-and-forth the jagged lines go when drawing the Spring,
  * in simulation coordinates.
  * @type {number}
  */
  this.width = DisplaySpring.width;
  /** Color drawn when Spring is compressed to less than its rest length,
  * a CSS3 color value.
  * @type {string}
  */
  this.colorCompressed = DisplaySpring.colorCompressed;
  /**  Color drawn when Spring is stretched to more than its rest length,
  * a CSS3 color value.
  * @type {string}
  */
  this.colorExpanded = DisplaySpring.colorExpanded;
  /** Thickness of lines when drawing the Spring, in screen coordinates, so a
  * value of 1 means a 1 pixel thick line.
  * @type {number}
  */
  this.thickness = DisplaySpring.thickness;
  /** Whether the Spring is drawn {@link #JAGGED} or {@link #STRAIGHT}.
  * @type {number}
  */
  this.drawMode = DisplaySpring.drawMode;
};
var DisplaySpring = myphysicslab.lab.view.DisplaySpring;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplaySpring.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
      +', width: '+NF(this.width)
      +', colorCompressed: "'+this.colorCompressed+'"'
      +', colorExpanded: "'+this.colorExpanded+'"'
      +', thickness: '+NF(this.thickness)
      +', drawMode: '+this.drawMode
      +'}';
  };

  /** @inheritDoc */
  DisplaySpring.prototype.toStringShort = function() {
    return 'DisplaySpring{spring_: '+this.spring_.toStringShort()+'}';
  };
};

/** Drawing mode constant indicating jagged line.
* @type {number}
* @const
*/
DisplaySpring.JAGGED = 1;

/** Drawing mode constant indicating straight line.
* @type {number}
* @const
*/
DisplaySpring.STRAIGHT = 2;

/** Default value for {@link #colorCompressed}, used when creating a DisplaySpring.
* @type {string}
*/
DisplaySpring.colorCompressed = 'red';

/** Default value for {@link #colorExpanded}, used when creating a DisplaySpring.
* @type {string} a CSS3 color value
*/
DisplaySpring.colorExpanded = 'green';

/** Default value for {@link #drawMode}, used when creating a DisplaySpring.
* @type {number}
*/
DisplaySpring.drawMode = DisplaySpring.JAGGED;

/** The fixed length of the un-transformed path
* @type {number}
* @private
* @const
*/
DisplaySpring.pathLength = 6.0;

/** The fixed width of the un-transformed path
* @type {number}
* @private
* @const
*/
DisplaySpring.pathWidth = 0.5;

/** Default value for {@link #thickness}, used when creating a DisplaySpring.
* @type {number}
*/
DisplaySpring.thickness = 4;

/** Default value for {@link #width}, used when creating a DisplaySpring.
* @type {number}
*/
DisplaySpring.width = 0.5;

/**  Sets the default style used when creating a new DisplaySpring to match
* the given DisplaySpring.
* @param {!myphysicslab.lab.view.DisplaySpring} dispObj the DisplaySpring to get
*    style from
*/
DisplaySpring.setStyle = function(dispObj) {
  DisplaySpring.colorCompressed = dispObj.colorCompressed;
  DisplaySpring.colorExpanded = dispObj.colorExpanded;
  DisplaySpring.width = dispObj.width;
  DisplaySpring.thickness = dispObj.thickness;
  DisplaySpring.drawMode = dispObj.drawMode;
};

/** @inheritDoc */
DisplaySpring.prototype.contains = function(p_world) {
  return false;
};

/** @inheritDoc */
DisplaySpring.prototype.draw = function(context, map) {
  var len = this.spring_.getLength();
  if (len < 1e-6 || this.spring_.getStiffness()==0)
    return;
  context.save()
  context.lineWidth = this.thickness;
  // the 0.00001 factor prevents flickering between red/green when springs are at rest.
  if (len < this.spring_.getRestLength() - 0.00001) {
    context.strokeStyle = this.colorCompressed;
  } else {
    context.strokeStyle = this.colorExpanded;
  }
  if (this.drawMode === DisplaySpring.JAGGED) {
    // draw as a jagged line
    // note that the transforms are applied in reverse order  (because of
    // how matrix multiplication works).
    var at = map.getAffineTransform(); // sim to screen transform
    var p1 = this.spring_.getStartPoint();
    var p2 = this.spring_.getEndPoint();
    at = at.translate(p1.getX(), p1.getY());
    var theta = Math.atan2(p2.getY()-p1.getY(), p2.getX()-p1.getX());
    at = at.rotate(theta);
    // stretch out the spring to the desired length & width
    at = at.scale(len/DisplaySpring.pathLength, this.width/0.5);
    DisplaySpring.drawSpring(context, at);
  } else {
    // draw as a straight line
    var p1 = map.simToScreen(this.spring_.getStartPoint());
    var p2 = map.simToScreen(this.spring_.getEndPoint());
    context.beginPath();
    context.moveTo(p1.getX(), p1.getY());
    context.lineTo(p2.getX(), p2.getY());
    context.stroke();
  }
  context.restore();
};

/** Draws the spring using the given AffineTransform, which specifies the
combination of translating, stretching, rotating the spring to its
current position, and also the sim-to-screen transform.
The path is drawn into a size of 6.0 long by 0.5 wide, so that when it is
scaled up or down, it doesn't get too distorted.
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
* @param {!myphysicslab.lab.util.AffineTransform} at transform to apply to each point
* @private
*/
DisplaySpring.drawSpring = function(context, at) {
  var size = DisplaySpring.pathLength;
  var t = DisplaySpring.pathWidth/2; // half thickness of spring
  var w = size / 16;
  context.beginPath();
  at.moveTo(0, 0, context);
  at.lineTo(w, 0, context);   // from start point
  at.lineTo(2*w, t, context);  // ramp up
  for (var i=1; i<=3; i++) {  // 3 cycles down and up
    at.lineTo(4*i*w, -t, context);
    at.lineTo((4*i + 2)*w, t, context);
  }
  at.lineTo(15*w, 0, context);  // last ramp down
  at.lineTo(size, 0, context);  // to end-point
  context.stroke();
};

/** @inheritDoc */
DisplaySpring.prototype.getMassObjects = function() {
  return [ ];
};

/** @inheritDoc */
DisplaySpring.prototype.getPosition = function() {
  // return midpoint of the line
  return this.spring_.getStartPoint().add(this.spring_.getEndPoint()).multiply(0.5);
};

/** @inheritDoc */
DisplaySpring.prototype.getSimObjects = function() {
  return [ this.spring_ ];
};

/** @inheritDoc */
DisplaySpring.prototype.isDragable = function() {
  return false;
};

/** @inheritDoc */
DisplaySpring.prototype.setDragable = function(dragable) {
  // does nothing
};

/** @inheritDoc */
DisplaySpring.prototype.setPosition = function(position) {
  //throw new Error('unsupported operation');
};

});  // goog.scope
