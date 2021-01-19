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

goog.module('myphysicslab.lab.view.DisplayConnector');

const Connector = goog.require('myphysicslab.lab.engine2D.Connector');
const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Shows the location of a {@link Connector} as a small colored circle.
The {@link #radius} is specified in screen coordinates, so the size of the circle stays
the same regardless of the zoom level on the {@link myphysicslab.lab.view.SimView}.

The position is determined by the position of the Connector, so {@link #setPosition}
has no effect, and the DisplayConnector is never dragable.

* @implements {DisplayObject}
*/
class DisplayConnector {
/**
* @param {?Connector=} connector the Connector to display
* @param {?DisplayConnector=} proto the prototype DisplayConnector to inherit
*    properties from
*/
constructor(connector, proto) {
  /**
  * @type {?Connector}
  * @private
  */
  this.connector_ = connector != null ? connector : null;
  /** Color to draw the joint, a CSS3 color value.
  * @type {string|undefined}
  * @private
  */
  this.color_;
  /** Radius of circle to draw, in screen coordinates.
  * @type {number|undefined}
  * @private
  */
  this.radius_;
  /**
  * @type {number|undefined}
  * @private
  */
  this.zIndex_;
  /**
  * @type {?DisplayConnector}
  * @private
  */
  this.proto_ = proto != null ? proto : null;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', radius: '+Util.NF5(this.getRadius())
      +', color: "'+this.getColor()+'"'
      +', zIndex: '+this.getZIndex()
      +', proto: '+(this.proto_ != null ? this.proto_.toStringShort() : 'null')
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'DisplayConnector{connector_: '+
      (this.connector_ != null ? this.connector_.toStringShort() : 'null')+'}';
};

/** @override */
contains(p_world) {
  return false;
};

/** @override */
draw(context, map) {
  if (this.connector_ == null) {
    return;
  }
  // Use CoordMap.simToScreenRect to calc screen coords of the shape.
  context.save();
  context.fillStyle = this.getColor();
  const p = map.simToScreen(this.getPosition());
  context.translate(p.getX(), p.getY());
  context.beginPath();
  context.arc(0, 0, this.getRadius(), 0, 2*Math.PI, false);
  context.closePath();
  context.fill();
  context.restore();
};

/** @override */
isDragable() {
  return false;
};

/** Color to draw the joint, a CSS3 color value.
* @return {string}
*/
getColor() {
  if (this.color_ !== undefined) {
    return this.color_;
  } else if (this.proto_ != null) {
    return this.proto_.getColor();
  } else {
    return 'blue';
  }
};

/** @override */
getMassObjects() {
  return [];
};

/** @override */
getPosition() {
  return this.connector_ == null ? Vector.ORIGIN : this.connector_.getPosition1();
};

/** Radius of circle to draw, in screen coordinates.
* @return {number}
*/
getRadius() {
  if (this.radius_ !== undefined) {
    return this.radius_;
  } else if (this.proto_ != null) {
    return this.proto_.getRadius();
  } else {
    return 2;
  }
};

/** @override */
getSimObjects() {
  return this.connector_ == null ? [ ] : [ this.connector_ ];
};

/** @override */
getZIndex() {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 10;
  }
};

/** Color used when drawing this Connector, a CSS3 color value.
* @param {string|undefined} color
* @return {!DisplayConnector} this object for chaining setters
*/
setColor(color) {
  this.color_ = color;
  return this;
};

/** @override */
setDragable(dragable) {
  // do nothing, connectors cannot be moved
};

/** @override */
setPosition(position) {
  // do nothing, connectors cannot be moved
};

/** Radius of circle to draw, in screen coordinates.
* @param {number|undefined} value
* @return {!DisplayConnector} this object for chaining setters
*/
setRadius(value) {
  this.radius_ = value;
  return this;
};

/** @override */
setZIndex(zIndex) {
  this.zIndex_ = zIndex;
};

} // end class
exports = DisplayConnector;
