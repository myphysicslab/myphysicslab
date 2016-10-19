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

goog.provide('myphysicslab.lab.view.DisplayClock');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

var CoordMap = myphysicslab.lab.view.CoordMap;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Draws a clock with two 'second hands': one tracks the simulation time, the other
tracks real time. This makes it easy to see whether the simulation time is keeping up
with real time.

* @param {function():number} simTimeFn  function that returns current simulation time
* @param {function():number} realTimeFn  function that returns current real time
* @param {number=} period  Period of clock in seconds, the time it takes for the
*     seconds hand to wrap around; default is 2 seconds.
* @param {number=} radius  Radius of clock in simulation coords, default is 1.0.
* @param {!Vector=} location  Location of center of clock, in simulation coords.
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
*/
myphysicslab.lab.view.DisplayClock = function(simTimeFn, realTimeFn, period, radius,
      location) {
  /**
  * @type {function():number}
  * @private
  */
  this.simTimeFn_ = simTimeFn;
  /**
  * @type {function():number}
  * @private
  */
  this.realTimeFn_ = realTimeFn;
  /** Period of clock in seconds, the time it takes for the seconds hand to wrap around
  * @type {number}
  */
  this.period = goog.isNumber(period) ? period : 2.0;
  /** Radius of clock in simulation coords
  * @type {number}
  */
  this.radius = goog.isNumber(radius) ? radius : 1.0;
  /**
  * @type {!myphysicslab.lab.util.Vector}
  * @private
  */
  this.location_ = goog.isObject(location) ? location : Vector.ORIGIN;
  /**
  * @type {boolean}
  * @private
  */
  this.dragable_ = true;
  /** Font to use for drawing the time, for example '10pt sans-serif'.
  * @type {string}
  */
  this.font = '14pt sans-serif';
  /** Color to use for drawing the time, a CSS3 color value.
  * @type {string}
  */
  this.textColor = 'blue';
  /**  Color to draw the second-hand showing simulation time.
  * @type {string}
  */
  this.handColor = 'blue';
  /**  Color to draw the second-hand showing real time.
  * @type {string}
  */
  this.realColor = 'red';
  /** Thickness of clock hands, in screen coords (1 means one pixel).
  * @type {number}
  */
  this.handWidth = 1;
  /** Thickness of outline, in screen coords (1 means one pixel).
  * @type {number}
  */
  this.outlineWidth = 1;
  /** Color to use for drawing the outline of the clock, a CSS3 color value.
  * @type {string}
  */
  this.outlineColor = 'black';
  /** Color to fill circle with; default is transparent white so that it is visible
  * over a black background.
  * @type {string}
  */
  this.fillStyle = 'rgba(255, 255, 255, 0.75)';
};
var DisplayClock = myphysicslab.lab.view.DisplayClock;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayClock.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', radius: '+NF(this.radius)
        +', period: '+NF(this.period)
        +', location_: '+this.location_
        +'}';
  };

  /** @inheritDoc */
  DisplayClock.prototype.toStringShort = function() {
    return 'DisplayClock{'+'time: '+NF(this.simTimeFn_())+'}';
  };
};

/** @inheritDoc */
DisplayClock.prototype.contains = function(point) {
  return point.distanceTo(this.location_) <= this.radius;
};

/** @inheritDoc */
DisplayClock.prototype.draw = function(context, map) {
  var center = map.simToScreen(this.location_);
  var r = map.simToScreenScaleX(this.radius);
  // fill circle with transparent white, so that it is visible with black background
  context.save();
  context.beginPath();
  context.arc(center.getX(), center.getY(), r, 0, 2*Math.PI, false);
  context.closePath();
  context.lineWidth = this.outlineWidth;
  context.strokeStyle = this.outlineColor;
  context.stroke();
  context.fillStyle = this.fillStyle;
  context.fill();
  var time = this.simTimeFn_();
  var realTime = this.realTimeFn_();
  this.drawHand(context, map, this.handColor, time, center);
  // show the real-time hand
  this.drawHand(context, map, this.realColor, realTime, center);
  var tx = time.toFixed(3);
  context.fillStyle = this.textColor;
  context.font = this.font;
  context.textAlign = 'center';
  context.fillText(tx, center.getX(), center.getY());
  context.restore();
};

/**
* @param {!CanvasRenderingContext2D} context
* @param {!myphysicslab.lab.view.CoordMap} map
* @param {string} color
* @param {number} time
* @param {!myphysicslab.lab.util.Vector} center
* @private
*/
DisplayClock.prototype.drawHand = function(context, map, color, time, center) {
  time = time - this.period * Math.floor(time/this.period);
  var fraction = time / this.period;
  var endx = map.simToScreenScaleX(this.radius * Math.sin(2*Math.PI * fraction));
  var endy = map.simToScreenScaleY(this.radius * Math.cos(2*Math.PI * fraction));
  context.lineWidth = this.handWidth;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(center.getX(), center.getY());
  context.lineTo(center.getX() + endx, center.getY() - endy);
  context.stroke();
};

/** @inheritDoc */
DisplayClock.prototype.isDragable = function() {
  return this.dragable_;
};

/** @inheritDoc */
DisplayClock.prototype.getMassObjects = function() {
  return [];
};

/** @inheritDoc */
DisplayClock.prototype.getPosition = function() {
  return this.location_;
};

/** @inheritDoc */
DisplayClock.prototype.getSimObjects = function() {
  return [];
};

/** @inheritDoc */
DisplayClock.prototype.setDragable = function(dragable) {
  this.dragable_ = dragable;
};

/** @inheritDoc */
DisplayClock.prototype.setPosition = function(position) {
  this.location_ = position;
};

/** Set of internationalized strings.
@typedef {{
  SHOW_CLOCK: string
  }}
*/
DisplayClock.i18n_strings;

/**
@type {DisplayClock.i18n_strings}
*/
DisplayClock.en = {
  SHOW_CLOCK: 'show clock'
};

/**
@private
@type {DisplayClock.i18n_strings}
*/
DisplayClock.de_strings = {
  SHOW_CLOCK: 'Zeit anzeigen'
};

/** Set of internationalized strings.
@type {DisplayClock.i18n_strings}
*/
DisplayClock.i18n = goog.LOCALE === 'de' ? DisplayClock.de_strings :
    DisplayClock.en;

});  // goog.scope
