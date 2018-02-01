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

goog.module('myphysicslab.lab.view.DisplaySpring');

goog.require('goog.asserts');

const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays a {@link Spring}. Can show either a jagged or straight line,
see {@link #drawMode}. Can have a different color when compressed or expanded,
see {@link #colorCompressed} and {@link #colorExpanded}. The width determines
how wide back-and-forth the jagged lines go, see {@link #width}.

The position is reported as the midpoint of the Spring by {@link #getPosition}.
The position is determined by the position of the Spring, so {@link #setPosition}
has no effect, and the DisplaySpring is never dragable.

* @implements {DisplayObject}
*/
class DisplaySpring {
/**
* @param {?Spring=} spring the Spring to display
* @param {?DisplaySpring=} proto the prototype DisplaySpring to inherit properties from
*/
constructor(spring, proto) {
  /**
  * @type {?Spring}
  * @private
  */
  this.spring_ = goog.isDefAndNotNull(spring) ? spring : null;
  /** How wide back-and-forth the jagged lines go when drawing the Spring,
  * in simulation coordinates.
  * @type {number|undefined}
  * @private
  */
  this.width_;
  /** Color drawn when Spring is compressed to less than its rest length,
  * a CSS3 color value.
  * @type {string|undefined}
  * @private
  */
  this.colorCompressed_;
  /**  Color drawn when Spring is stretched to more than its rest length,
  * a CSS3 color value.
  * @type {string|undefined}
  * @private
  */
  this.colorExpanded_;
  /** Thickness of lines when drawing the Spring, in screen coordinates, so a
  * value of 1 means a 1 pixel thick line.
  * @type {number|undefined}
  * @private
  */
  this.thickness_;
  /** Whether the Spring is drawn {@link #JAGGED} or {@link #STRAIGHT}.
  * @type {number|undefined}
  * @private
  */
  this.drawMode_;
  /**
  * @type {number|undefined}
  * @private
  */
  this.zIndex_;
  /**
  * @type {?DisplaySpring}
  * @private
  */
  this.proto_ = goog.isDefAndNotNull(proto) ? proto : null;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', width: '+Util.NF(this.getWidth())
      +', colorCompressed: "'+this.getColorCompressed()+'"'
      +', colorExpanded: "'+this.getColorExpanded()+'"'
      +', thickness: '+Util.NF(this.getThickness())
      +', drawMode: '+this.getDrawMode()
      +', zIndex: '+this.getZIndex()
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'DisplaySpring{spring_: '+
      (this.spring_ != null ? this.spring_.toStringShort() : 'null')+'}';
};

/** @override */
contains(p_world) {
  return false;
};

/** @override */
draw(context, map) {
  if (this.spring_ == null) {
    return;
  }
  var len = this.spring_.getLength();
  if (len < 1e-6 || this.spring_.getStiffness()==0)
    return;
  context.save()
  context.lineWidth = this.getThickness();
  // the 0.00001 factor prevents flickering between red/green when springs are at rest.
  if (len < this.spring_.getRestLength() - 0.00001) {
    context.strokeStyle = this.getColorCompressed();
  } else {
    context.strokeStyle = this.getColorExpanded();
  }
  if (this.getDrawMode() === DisplaySpring.JAGGED) {
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
    at = at.scale(len/DisplaySpring.pathLength, this.getWidth()/0.5);
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
* @param {!AffineTransform} at transform to apply to each point
* @private
*/
static drawSpring(context, at) {
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

/** Color drawn when Spring is compressed to less than its rest length,
* a CSS3 color value.
* @return {string}
*/
getColorCompressed() {
  if (this.colorCompressed_ !== undefined) {
    return this.colorCompressed_;
  } else if (this.proto_ != null) {
    return this.proto_.getColorCompressed();
  } else {
    return 'red';
  }
};

/**  Color drawn when Spring is stretched to more than its rest length,
* a CSS3 color value.
* @return {string}
*/
getColorExpanded() {
  if (this.colorExpanded_ !== undefined) {
    return this.colorExpanded_;
  } else if (this.proto_ != null) {
    return this.proto_.getColorExpanded();
  } else {
    return 'green';
  }
};

/** Whether the Spring is drawn {@link #JAGGED} or {@link #STRAIGHT}.
* @return {number}
*/
getDrawMode() {
  if (this.drawMode_ !== undefined) {
    return this.drawMode_;
  } else if (this.proto_ != null) {
    return this.proto_.getDrawMode();
  } else {
    return DisplaySpring.JAGGED;
  }
};

/** @override */
getMassObjects() {
  return [ ];
};

/** @override */
getPosition() {
  // return midpoint of the line
  return this.spring_ == null ? Vector.ORIGIN :
      this.spring_.getStartPoint().add(this.spring_.getEndPoint()).multiply(0.5);
};

/** Set the prototype DisplaySpring for this object. Display parameters are inherited
* from the prototype unless the parameter is explicitly set for this object.
* @return {?DisplaySpring}
*/
getPrototype() {
  return this.proto_;
};

/** @override */
getSimObjects() {
  return this.spring_ == null ? [ ] : [ this.spring_ ];
};

/** Thickness of lines when drawing the Spring, in screen coordinates, so a
* value of 1 means a 1 pixel thick line.
* @return {number}
*/
getThickness() {
  if (this.thickness_ !== undefined) {
    return this.thickness_;
  } else if (this.proto_ != null) {
    return this.proto_.getThickness();
  } else {
    return 4.0;
  }
};

/** How wide back-and-forth the jagged lines go when drawing the Spring,
* in simulation coordinates.
* @return {number}
*/
getWidth() {
  if (this.width_ !== undefined) {
    return this.width_;
  } else if (this.proto_ != null) {
    return this.proto_.getWidth();
  } else {
    return 0.5;
  }
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
  return false;
};

/** Color drawn when Spring is compressed to less than its rest length,
* a CSS3 color value.
* @param {string|undefined} colorCompressed
* @return {!DisplaySpring} this object for chaining setters
*/
setColorCompressed(colorCompressed) {
  this.colorCompressed_ = colorCompressed;
  return this;
};

/**  Color drawn when Spring is stretched to more than its rest length,
* a CSS3 color value.
* @param {string|undefined} colorExpanded
* @return {!DisplaySpring} this object for chaining setters
*/
setColorExpanded(colorExpanded) {
  this.colorExpanded_ = colorExpanded;
  return this;
};

/** @override */
setDragable(dragable) {
  // does nothing
};

/** Whether the Spring is drawn {@link #JAGGED} or {@link #STRAIGHT}.
* @param {number|undefined} drawMode
* @return {!DisplaySpring} this object for chaining setters
*/
setDrawMode(drawMode) {
  this.drawMode_ = drawMode;
  return this;
};

/** @override */
setPosition(position) {
  //throw new Error('unsupported operation');
};

/** Set the prototype DisplaySpring for this object. Display parameters are inherited
* from the prototype unless the parameter is explicitly set for this object.
* @param {?DisplaySpring} value
* @return {!DisplaySpring} this object for chaining setters
*/
setPrototype(value) {
  this.proto_ = value;
  return this;
};

/** Thickness of lines when drawing the Spring, in screen coordinates, so a
* value of 1 means a 1 pixel thick line.
* @param {number|undefined} thickness
* @return {!DisplaySpring} this object for chaining setters
*/
setThickness(thickness) {
  this.thickness_ = thickness;
  return this;
};

/** How wide back-and-forth the jagged lines go when drawing the Spring,
* in simulation coordinates.
* @param {number|undefined} width
* @return {!DisplaySpring} this object for chaining setters
*/
setWidth(width) {
  this.width_ = width;
  return this;
};

/** @override */
setZIndex(zIndex) {
  this.zIndex_ = zIndex;
};

} // end class

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

exports = DisplaySpring;
