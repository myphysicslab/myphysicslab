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

goog.provide('myphysicslab.lab.view.DisplayConnector');

goog.require('myphysicslab.lab.engine2D.Connector');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

const Connector = goog.module.get('myphysicslab.lab.engine2D.Connector');
var DisplayObject = myphysicslab.lab.view.DisplayObject;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Shows the location of a {@link Connector} as a small colored circle.
The {@link #radius} is specified in screen coordinates, so the size of the circle stays
the same regardless of the zoom level on the {@link myphysicslab.lab.view.SimView}.

The position is determined by the position of the Connector, so {@link #setPosition}
has no effect, and the DisplayConnector is never dragable.

* @param {?Connector=} connector the Connector to display
* @param {?DisplayConnector=} proto the prototype DisplayConnector to inherit
*    properties from
* @constructor
* @final
* @struct
* @implements {DisplayObject}
*/
myphysicslab.lab.view.DisplayConnector = function(connector, proto) {
  /**
  * @type {?Connector}
  * @private
  */
  this.connector_ = goog.isDefAndNotNull(connector) ? connector : null;
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
  this.proto_ = goog.isDefAndNotNull(proto) ? proto : null;
};
var DisplayConnector = myphysicslab.lab.view.DisplayConnector;

/** @override */
DisplayConnector.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', radius: '+Util.NF5(this.getRadius())
      +', color: "'+this.getColor()+'"'
      +', zIndex: '+this.getZIndex()
      +', proto: '+(this.proto_ != null ? this.proto_.toStringShort() : 'null')
      +'}';
};

/** @override */
DisplayConnector.prototype.toStringShort = function() {
  return Util.ADVANCED ? '' : 'DisplayConnector{connector_: '+
      (this.connector_ != null ? this.connector_.toStringShort() : 'null')+'}';
};

/** @override */
DisplayConnector.prototype.contains = function(p_world) {
  return false;
};

/** @override */
DisplayConnector.prototype.draw = function(context, map) {
  if (this.connector_ == null) {
    return;
  }
  // Use CoordMap.simToScreenRect to calc screen coords of the shape.
  context.save();
  context.fillStyle = this.getColor();
  var p = map.simToScreen(this.getPosition());
  context.translate(p.getX(), p.getY());
  context.beginPath();
  //var r = map.screenToSimScaleX(this.radius_);
  context.arc(0, 0, this.getRadius(), 0, 2*Math.PI, false);
  context.closePath();
  context.fill();
  context.restore();
};

/** @override */
DisplayConnector.prototype.isDragable = function() {
  return false;
};

/** Color to draw the joint, a CSS3 color value.
* @return {string}
*/
DisplayConnector.prototype.getColor = function() {
  if (this.color_ !== undefined) {
    return this.color_;
  } else if (this.proto_ != null) {
    return this.proto_.getColor();
  } else {
    return 'blue';
  }
};

/** @override */
DisplayConnector.prototype.getMassObjects = function() {
  return [];
};

/** @override */
DisplayConnector.prototype.getPosition = function() {
  return this.connector_ == null ? Vector.ORIGIN : this.connector_.getPosition1();
};

/** Radius of circle to draw, in screen coordinates.
* @return {number}
*/
DisplayConnector.prototype.getRadius = function() {
  if (this.radius_ !== undefined) {
    return this.radius_;
  } else if (this.proto_ != null) {
    return this.proto_.getRadius();
  } else {
    return 2;
  }
};

/** @override */
DisplayConnector.prototype.getSimObjects = function() {
  return this.connector_ == null ? [ ] : [ this.connector_ ];
};

/** @override */
DisplayConnector.prototype.getZIndex = function() {
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
DisplayConnector.prototype.setColor = function(color) {
  this.color_ = color;
  return this;
};

/** @override */
DisplayConnector.prototype.setDragable = function(dragable) {
  // do nothing, connectors cannot be moved
};

/** @override */
DisplayConnector.prototype.setPosition = function(position) {
  // do nothing, connectors cannot be moved
};

/** Radius of circle to draw, in screen coordinates.
* @param {number|undefined} value
* @return {!DisplayConnector} this object for chaining setters
*/
DisplayConnector.prototype.setRadius = function(value) {
  this.radius_ = value;
  return this;
};

/** @override */
DisplayConnector.prototype.setZIndex = function(zIndex) {
  this.zIndex_ = zIndex;
};

});  // goog.scope
