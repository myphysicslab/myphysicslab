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
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

const CoordMap = goog.module.get('myphysicslab.lab.view.CoordMap');
var DisplayObject = myphysicslab.lab.view.DisplayObject;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const SimObject = goog.module.get('myphysicslab.lab.model.SimObject');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

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
* @implements {DisplayObject}
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
  * @private
  */
  this.period_ = goog.isNumber(period) ? period : 2.0;
  /** Radius of clock in simulation coords
  * @type {number}
  * @private
  */
  this.radius_ = goog.isNumber(radius) ? radius : 1.0;
  /**
  * @type {!Vector}
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
  * @private
  */
  this.font_ = '14pt sans-serif';
  /** Color to use for drawing the time, a CSS3 color value.
  * @type {string}
  * @private
  */
  this.textColor_ = 'blue';
  /**  Color to draw the second-hand showing simulation time.
  * @type {string}
  * @private
  */
  this.handColor_ = 'blue';
  /**  Color to draw the second-hand showing real time.
  * @type {string}
  * @private
  */
  this.realColor_ = 'red';
  /** Thickness of clock hands, in screen coords (1 means one pixel).
  * @type {number}
  * @private
  */
  this.handWidth_ = 1;
  /** Thickness of outline, in screen coords (1 means one pixel).
  * @type {number}
  * @private
  */
  this.outlineWidth_ = 1;
  /** Color to use for drawing the outline of the clock, a CSS3 color value.
  * @type {string}
  * @private
  */
  this.outlineColor_ = 'black';
  /** Color to fill circle with; default is transparent white so that it is visible
  * over a black background.
  * @type {string}
  * @private
  */
  this.fillStyle_ = 'rgba(255, 255, 255, 0.75)';
  /**
  * @type {number}
  * @private
  */
  this.zIndex_ = 0;
};
var DisplayClock = myphysicslab.lab.view.DisplayClock;

/** @override */
DisplayClock.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', radius: '+Util.NF(this.radius_)
      +', period: '+Util.NF(this.period_)
      +', location_: '+this.location_
      +', zIndex: '+this.zIndex_
      +'}';
};

/** @override */
DisplayClock.prototype.toStringShort = function() {
  return Util.ADVANCED ? '' :
      'DisplayClock{'+'time: '+Util.NF(this.simTimeFn_())+'}';
};

/** @override */
DisplayClock.prototype.contains = function(point) {
  return point.distanceTo(this.location_) <= this.radius_;
};

/** @override */
DisplayClock.prototype.draw = function(context, map) {
  var center = map.simToScreen(this.location_);
  var r = map.simToScreenScaleX(this.radius_);
  // fill circle with transparent white, so that it is visible with black background
  context.save();
  context.beginPath();
  context.arc(center.getX(), center.getY(), r, 0, 2*Math.PI, false);
  context.closePath();
  context.lineWidth = this.outlineWidth_;
  context.strokeStyle = this.outlineColor_;
  context.stroke();
  context.fillStyle = this.fillStyle_;
  context.fill();
  var time = this.simTimeFn_();
  var realTime = this.realTimeFn_();
  this.drawHand(context, map, this.handColor_, time, center);
  // show the real-time hand
  this.drawHand(context, map, this.realColor_, realTime, center);
  var tx = time.toFixed(3);
  context.fillStyle = this.textColor_;
  context.font = this.font_;
  context.textAlign = 'center';
  context.fillText(tx, center.getX(), center.getY());
  context.restore();
};

/**
* @param {!CanvasRenderingContext2D} context
* @param {!CoordMap} map
* @param {string} color
* @param {number} time
* @param {!Vector} center
* @private
*/
DisplayClock.prototype.drawHand = function(context, map, color, time, center) {
  time = time - this.period_ * Math.floor(time/this.period_);
  var fraction = time / this.period_;
  var endx = map.simToScreenScaleX(this.radius_ * Math.sin(2*Math.PI * fraction));
  var endy = map.simToScreenScaleY(this.radius_ * Math.cos(2*Math.PI * fraction));
  context.lineWidth = this.handWidth_;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(center.getX(), center.getY());
  context.lineTo(center.getX() + endx, center.getY() - endy);
  context.stroke();
};

/** @override */
DisplayClock.prototype.isDragable = function() {
  return this.dragable_;
};

/** Returns color to fill circle with; default is transparent white so that it is
* visible over a black background.
* @return {string} a CSS3 color value
*/
DisplayClock.prototype.getFillStyle = function() {
  return this.fillStyle_;
};

/** Font used when drawing the text, a CSS font specification.
* @return {string} a CSS font specification
*/
DisplayClock.prototype.getFont = function() {
  return this.font_;
};

/** Returns color to draw the second-hand showing simulation time.
* @return {string} a CSS3 color value
*/
DisplayClock.prototype.getHandColor = function() {
  return this.handColor_;
};

/** Returns thickness of clock hands, in screen coords (1 means one pixel).
* @return {number}
*/
DisplayClock.prototype.getHandWidth = function() {
  return this.handWidth_;
};

/** @override */
DisplayClock.prototype.getMassObjects = function() {
  return [];
};

/** Returns color to draw the second-hand showing real time.
* @return {string} a CSS3 color value
*/
DisplayClock.prototype.getOutlineColor = function() {
  return this.outlineColor_;
};

/** Returns thickness of outline, in screen coords (1 means one pixel).
* @return {number}
*/
DisplayClock.prototype.getOutlineWidth = function() {
  return this.outlineWidth_;
};

/** @override */
DisplayClock.prototype.getPosition = function() {
  return this.location_;
};

/** Returns color to draw the second-hand showing real time.
* @return {string} a CSS3 color value
*/
DisplayClock.prototype.getRealColor = function() {
  return this.realColor_;
};

/** @override */
DisplayClock.prototype.getSimObjects = function() {
  return [];
};

/** Returns color for drawing the time.
* @return {string} a CSS3 color value
*/
DisplayClock.prototype.getTextColor = function() {
  return this.textColor_;
};

/** @override */
DisplayClock.prototype.getZIndex = function() {
  return this.zIndex_;
};

/** @override */
DisplayClock.prototype.setDragable = function(dragable) {
  this.dragable_ = dragable;
};

/** Sets color to fill circle with; default is transparent white so that it is
* visible over a black background.
* @param {string} value a CSS3 color value
* @return {!DisplayClock} this object for chaining setters
*/
DisplayClock.prototype.setFillStyle = function(value) {
  this.fillStyle_ = value;
  return this;
};

/** Font used when drawing the text, a CSS font specification.
* @param {string} value a CSS font specification
* @return {!DisplayClock} this object for chaining setters
*/
DisplayClock.prototype.setFont = function(value) {
  this.font_ = value;
  return this;
};

/** Sets color to draw the second-hand showing simulation time.
* @param {string} value a CSS3 color value
* @return {!DisplayClock} this object for chaining setters
*/
DisplayClock.prototype.setHandColor = function(value) {
  this.handColor_ = value;
  return this;
};

/** Sets thickness of clock hands, in screen coords (1 means one pixel).
* @param {number} value
* @return {!DisplayClock} this object for chaining setters
*/
DisplayClock.prototype.setHandWidth = function(value) {
  this.handWidth_ = value;
  return this;
};

/** Sets color to use for drawing the outline of the clock.
* @param {string} value a CSS3 color value
* @return {!DisplayClock} this object for chaining setters
*/
DisplayClock.prototype.setOutlineColor = function(value) {
  this.outlineColor_ = value;
  return this;
};

/** Sets thickness of outline, in screen coords (1 means one pixel).
* @param {number} value
* @return {!DisplayClock} this object for chaining setters
*/
DisplayClock.prototype.setOutlineWidth = function(value) {
  this.outlineWidth_ = value;
  return this;
};

/** @override */
DisplayClock.prototype.setPosition = function(position) {
  this.location_ = position;
};

/** Sets color to draw the second-hand showing real time.
* @param {string} value a CSS3 color value
* @return {!DisplayClock} this object for chaining setters
*/
DisplayClock.prototype.setRealColor = function(value) {
  this.realColor_ = value;
  return this;
};

/** Returns color for drawing the time.
* @param {string} value a CSS3 color value
* @return {!DisplayClock} this object for chaining setters
*/
DisplayClock.prototype.setTextColor = function(value) {
  this.textColor_ = value;
  return this;
};

/** @override */
DisplayClock.prototype.setZIndex = function(zIndex) {
  this.zIndex_ = goog.isDef(zIndex) ? zIndex : 0;
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
