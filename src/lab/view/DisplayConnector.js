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
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

var DoubleRect = myphysicslab.lab.util.DoubleRect;
var Connector = myphysicslab.lab.engine2D.Connector;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Shows the location of a {@link myphysicslab.lab.engine2D.Connector} as a small
colored circle.  The {@link #radius} is specified in screen coordinates, so the
size of the circle stays the same regardless of the zoom level on the
{@link myphysicslab.lab.view.SimView}.

The position is determined by the position of the Connector, so {@link #setPosition}
has no effect, and the DisplayConnector is never dragable.

* @param {!myphysicslab.lab.engine2D.Connector} connector the Connector to display
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
*/
myphysicslab.lab.view.DisplayConnector = function(connector) {
  /**
  * @type {!myphysicslab.lab.engine2D.Connector}
  * @private
  */
  this.connector_ = connector;
  /** Color to draw the joint, a CSS3 color value.
  * @type {string}
  */
  this.color = DisplayConnector.color;
  /** Radius of circle to draw, in screen coordinates.
  * @type {number}
  */
  this.radius = DisplayConnector.radius;
};
var DisplayConnector = myphysicslab.lab.view.DisplayConnector;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayConnector.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', radius: '+NF5(this.radius)
        +', color: "'+this.color+'"'
        +'}';
  };

  /** @inheritDoc */
  DisplayConnector.prototype.toStringShort = function() {
    return 'DisplayConnector{connector_: '+this.connector_.toStringShort()+'}';
  };
}

/** Default value for {@link #color}, used when creating a DisplayConnector.
* @type {string}
*/
DisplayConnector.color = 'blue';

/** Default value for {@link #radius}, used when creating a DisplayConnector.
* @type {number}
*/
DisplayConnector.radius = 2;

/** @inheritDoc */
DisplayConnector.prototype.contains = function(p_world) {
  return false;
};

/** @inheritDoc */
DisplayConnector.prototype.draw = function(context, map) {
  // Use CoordMap.simToScreenRect to calc screen coords of the shape.
  context.save();
  context.fillStyle = this.color;
  var p = map.simToScreen(this.getPosition());
  context.translate(p.getX(), p.getY());
  context.beginPath();
  //var r = map.screenToSimScaleX(this.radius);
  context.arc(0, 0, this.radius, 0, 2*Math.PI, false);
  context.closePath();
  context.fill();
  context.restore();
};

/** @inheritDoc */
DisplayConnector.prototype.isDragable = function() {
  return false;
};

/** @inheritDoc */
DisplayConnector.prototype.getMassObjects = function() {
  return [];
};

/** @inheritDoc */
DisplayConnector.prototype.getPosition = function() {
  return this.connector_.getPosition1();
};

/** @inheritDoc */
DisplayConnector.prototype.getSimObjects = function() {
  return [ this.connector_ ];
};

/** @inheritDoc */
DisplayConnector.prototype.setDragable = function(dragable) {
  // do nothing, connectors cannot be moved
};

/** @inheritDoc */
DisplayConnector.prototype.setPosition = function(position) {
  // do nothing, connectors cannot be moved
};

});  // goog.scope
