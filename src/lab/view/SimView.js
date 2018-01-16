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

goog.provide('myphysicslab.lab.view.SimView');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.ConcreteMemoList');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.MemoList');
goog.require('myphysicslab.lab.util.Memorizable');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.LabView');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.VerticalAlign');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var ConcreteMemoList = myphysicslab.lab.util.ConcreteMemoList;
var CoordMap = myphysicslab.lab.view.CoordMap;
var DisplayList = myphysicslab.lab.view.DisplayList;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
const GenericEvent = goog.module.get('myphysicslab.lab.util.GenericEvent');
var HorizAlign = myphysicslab.lab.view.HorizAlign;
var LabView = myphysicslab.lab.view.LabView;
var MemoList = myphysicslab.lab.util.MemoList;
var Memorizable = myphysicslab.lab.util.Memorizable;
const ParameterBoolean = goog.module.get('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
var ScreenRect = myphysicslab.lab.view.ScreenRect;
var SimObject = myphysicslab.lab.model.SimObject;
const Util = goog.module.get('myphysicslab.lab.util.Util');
var VerticalAlign = myphysicslab.lab.view.VerticalAlign;


/** Defines a rectangular region where a {@link DisplayList}
draws a set of {@link DisplayObject}s. A DisplayObject typically
represents a {@link SimObject}, but not always.

A SimView is shown inside a {@link myphysicslab.lab.view.LabCanvas}, possibly overlaid
with other SimViews.


Boundary Rectangles
-------------------
A SimView keeps track of two boundary rectangles: the simulation and screen rectangles.

+ The **screen rectangle** gives the size and location of this SimView within the
containing LabCanvas. See {@link #getScreenRect}. The screen rectangle is initially
set to a default size of 800 by 600.

+ The **simulation rectangle** specifies what area of the simulation to display in this
SimView. See {@link #getSimRect}.

A {@link CoordMap} maps the simulation rectangle onto the screen
rectangle, in accordance with various alignment options; see {@link #setHorizAlign},
{@link #setVerticalAlign}, {@link #setAspectRatio}. The CoordMap is available via
{@link #getCoordMap}. The CoordMap is passed to each DisplayObject during the
{@link #paint} method.


Pan-Zoom Controls
-----------------
The methods such as {@link #panUp}, {@link #panLeft}, {@link #zoomIn}, {@link #zoomOut}
are used to make a 'pan-zoom control' in
{@link myphysicslab.sims.common.CommonControls#makePanZoomControls}. The amount of
pan-zoom that is done by each invocation of those methods can be changed via the
properties {@link #panX}, {@link #panY}, {@link #zoom}.


Parameters Created
------------------

+ ParameterBoolean named `SCALE_TOGETHER`, see {@link #setScaleTogether}.

+ ParameterNumber named `WIDTH`, see {@link #setWidth}

+ ParameterNumber named `HEIGHT`, see {@link #setHeight}

+ ParameterNumber named `CENTER_X`, see {@link #setCenterX}

+ ParameterNumber named `CENTER_Y`, see {@link #setCenterY}

+ ParameterString named `VERTICAL_ALIGN`, see {@link #setVerticalAlign}

+ ParameterString named `HORIZONTAL_ALIGN`, see {@link #setHorizAlign}

+ ParameterNumber named `ASPECT_RATIO`, see {@link #setAspectRatio}


Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `SIM_RECT_CHANGED` when the simulation rectangle changes.

+ GenericEvent named `COORD_MAP_CHANGED` when the CoordMap changes.



* @param {string} name name of this SimView.
* @param {!DoubleRect} simRect specifies what area of the simulation to display, in
*    simulation coordinates
* @constructor
* @final
* @struct
* @implements {LabView}
* @implements {Memorizable}
* @implements {MemoList}
* @extends {AbstractSubject}
*/
myphysicslab.lab.view.SimView = function(name, simRect) {
  AbstractSubject.call(this, name);
  if (!(simRect instanceof DoubleRect) || simRect.isEmpty()) {
    throw new Error('bad simRect: '+simRect);
  }
  /** when panning vertically, this is percentage of height to move.
  * @type {number}
  */
  this.panY = 0.05;
  /** when panning horizontally, this is percentage of width to move.
  * @type {number}
  */
  this.panX = 0.05;
  /** when zooming, this is percentage of size to zoom
  * @type {number}
  */
  this.zoom = 1.1;
  /** The boundary rectangle in simulation coordinates.
  * @type {!DoubleRect}
  * @private
  */
  this.simRect_ = simRect;
  /** The rectangle in screen coordinates where this SimView exists inside the
  * LabCanvas.
  * @type {!ScreenRect}
  * @private
  */
  this.screenRect_ = new ScreenRect(0, 0, 800, 600);
  /**
  * @type {!HorizAlign}
  * @private
  */
  this.horizAlign_ = HorizAlign.MIDDLE;
  /**
  * @type {!VerticalAlign}
  * @private
  */
  this.verticalAlign_ = VerticalAlign.MIDDLE;
  /**
  * @type {number}
  * @private
  */
  this.aspectRatio_ = 1.0;
  /** This list of DisplayObjects that this SimView displays
  * @type {!DisplayList}
  * @private
  */
  this.displayList_ = new DisplayList();
  /**
  * @type {boolean}
  * @private
  */
  this.scaleTogether_ = true;
  /** The transparency used when painting the drawables; a number between
  * 0.0 (fully transparent) and 1.0 (fully opaque).
  * @type {number}
  */
  this.opaqueness = 1.0;
  /** The CoordMap that defines the simulation coordinates for this SimView.
  * @type {!CoordMap}
  * @private
  */
  this.coordMap_= CoordMap.make(this.screenRect_, this.simRect_, this.horizAlign_,
        this.verticalAlign_, this.aspectRatio_);
  /**
  * @type {number}
  * @private
  */
  this.width_ = simRect.getWidth();
  /**
  * @type {number}
  * @private
  */
  this.height_ = simRect.getHeight();
  /**
  * @type {number}
  * @private
  */
  this.centerX_ = simRect.getCenterX();
  /**
  * @type {number}
  * @private
  */
  this.centerY_ = simRect.getCenterY();
  /** ratio of height/width, used when scaleTogether_ is true.
  * @type {number}
  * @private
  */
  this.ratio_ = this.height_/this.width_;
  /**
  * @type {!MemoList}
  * @private
  */
  this.memoList_ = new ConcreteMemoList();
  this.addParameter(new ParameterNumber(this, SimView.en.WIDTH, SimView.i18n.WIDTH,
      goog.bind(this.getWidth, this), goog.bind(this.setWidth, this)));
  this.addParameter(new ParameterNumber(this, SimView.en.HEIGHT, SimView.i18n.HEIGHT,
      goog.bind(this.getHeight, this), goog.bind(this.setHeight, this)));
  this.addParameter(new ParameterNumber(this, SimView.en.CENTER_X,
      SimView.i18n.CENTER_X,
      goog.bind(this.getCenterX, this), goog.bind(this.setCenterX, this))
      .setLowerLimit(Number.NEGATIVE_INFINITY));
  this.addParameter(new ParameterNumber(this, SimView.en.CENTER_Y,
      SimView.i18n.CENTER_Y,
      goog.bind(this.getCenterY, this), goog.bind(this.setCenterY, this))
      .setLowerLimit(Number.NEGATIVE_INFINITY));
  this.addParameter(new ParameterBoolean(this, SimView.en.SCALE_TOGETHER,
      SimView.i18n.SCALE_TOGETHER,
      goog.bind(this.getScaleTogether, this), goog.bind(this.setScaleTogether, this)));
  // Need a special 'setter' because `setVerticalAlign` takes an argument of
  // the enum type `VerticalAlign`, not of type `string`.
  this.addParameter(new ParameterString(this, SimView.en.VERTICAL_ALIGN,
      SimView.i18n.VERTICAL_ALIGN,
      goog.bind(this.getVerticalAlign, this),
      goog.bind(function(s) { this.setVerticalAlign(VerticalAlign.stringToEnum(s)); },
      this),
      VerticalAlign.getChoices(), VerticalAlign.getValues()));
  // Need a special 'setter' because `setHorizAlign` takes an argument of
  // the enum type `HorizAlign`, not of type `string`.
  this.addParameter(new ParameterString(this, SimView.en.HORIZONTAL_ALIGN,
      SimView.i18n.HORIZONTAL_ALIGN,
      goog.bind(this.getHorizAlign, this),
      goog.bind(function(s) { this.setHorizAlign(HorizAlign.stringToEnum(s)); }, this),
      HorizAlign.getChoices(), HorizAlign.getValues()));
  this.addParameter(new ParameterNumber(this, SimView.en.ASPECT_RATIO,
      SimView.i18n.ASPECT_RATIO,
      goog.bind(this.getAspectRatio, this), goog.bind(this.setAspectRatio, this)));
};
var SimView = myphysicslab.lab.view.SimView;
goog.inherits(SimView, AbstractSubject);

if (!Util.ADVANCED) {
  /** @override */
  SimView.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', simRect_: '+this.simRect_
        +', screenRect_: '+this.screenRect_
        +', horizAlign_: '+this.horizAlign_
        +', verticalAlign_: '+this.verticalAlign_
        +', aspectRatio_: '+Util.NF5(this.aspectRatio_)
        +', opaqueness: '+Util.NF5(this.opaqueness)
        +', coordMap_: '+this.coordMap_
        +', memoList_: '+this.memoList_
        + SimView.superClass_.toString.call(this);
  };

  /** @override */
  SimView.prototype.toStringShort = function() {
    return SimView.superClass_.toStringShort.call(this).slice(0, -1)
        +', displayList_: '+this.displayList_.toStringShort() +'}';
  };
};

/** @override */
SimView.prototype.getClassName = function() {
  return 'SimView';
};

/** @override */
SimView.prototype.addMemo = function(memorizable) {
  this.memoList_.addMemo(memorizable);
};

/** @override */
SimView.prototype.gainFocus = function() {
};

/** Returns the ratio of 'pixels per simulation unit along y axis' divided
by 'pixels per simulation unit along x axis' used when displaying this SimView.
See {@link CoordMap}.
@return {number} the aspect ratio used when displaying this SimView
*/
SimView.prototype.getAspectRatio = function() {
  return this.aspectRatio_;
};

/** Returns the horizontal coordinate of simulation rectangle's center.
* @return {number} horizontal coordinate of simulation rectangle's center.
*/
SimView.prototype.getCenterX = function() {
  return this.centerX_;
};

/** Returns the vertical coordinate of simulation rectangle's center.
* @return {number} the vertical coordinate of simulation rectangle's center.
*/
SimView.prototype.getCenterY = function() {
  return this.centerY_;
};

/** @override */
SimView.prototype.getCoordMap = function() {
  return this.coordMap_; // it is immutable, so OK to return it
};

/** @override */
SimView.prototype.getDisplayList = function() {
  return this.displayList_;
};

/** Returns height of the simulation rectangle.
* @return {number} height of the simulation rectangle
*/
SimView.prototype.getHeight = function() {
  return this.height_;
};

/** Returns the horizontal alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle.
See {@link CoordMap}.
@return {!HorizAlign} the horizontal alignment to use for aligning the simulation
    rectangle within the screen rectangle
*/
SimView.prototype.getHorizAlign = function() {
  return this.horizAlign_;
};

/** @override */
SimView.prototype.getMemos = function() {
  return this.memoList_.getMemos();
};

/** Whether the width and height of the simulation rectangle scale together; if
true then changing one causes the other to change proportionally.
* @return {boolean} whether width and height scale together
*/
SimView.prototype.getScaleTogether = function() {
  return this.scaleTogether_;
};

/** @override */
SimView.prototype.getScreenRect = function() {
  return this.screenRect_; // it is immutable, so OK to return it
};

/** @override */
SimView.prototype.getSimRect = function() {
  return this.simRect_;
};

/** Returns the vertical alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle. See {@link CoordMap}.
@return {!VerticalAlign} the vertical alignment to use for aligning the simulation
    rectangle within the screen rectangle
*/
SimView.prototype.getVerticalAlign = function() {
  return this.verticalAlign_;
};

/** Returns the width of the simulation rectangle.
* @return {number} width of the simulation rectangle
*/
SimView.prototype.getWidth = function() {
  return this.width_;
};

/** @override */
SimView.prototype.loseFocus = function() {
};

/** @override */
SimView.prototype.memorize = function() {
  this.memoList_.memorize();
};

/** Modifies the simulation rectangle of the target SimView according to our
current settings for width, height, centerX, centerY.
* @return {undefined}
* @private
*/
SimView.prototype.modifySimRect = function() {
  var left = this.centerX_ - this.width_/2.0;
  var bottom = this.centerY_ - this.height_/2.0;
  var r = new DoubleRect(left, bottom, left+this.width_,
      bottom+this.height_);
  this.setSimRect(r);
};

/** @override */
SimView.prototype.paint = function(context) {
  context.save();
  context.globalAlpha = this.opaqueness;
  this.displayList_.draw(context, this.coordMap_);
  context.restore();
};

/** Moves the center of the simulation rectangle (the 'camera') down by fraction
{@link #panY}, which causes the image to move up.
Also broadcasts a {@link #SIM_RECT_CHANGED} event.
* @return {undefined}
*/
SimView.prototype.panDown = function() {
  this.setCenterY(this.centerY_ - this.panY * this.height_);
};

/** Moves the center of the simulation rectangle (the 'camera') left by fraction
{@link #panX}, which causes the image to move right.
Also broadcasts a {@link #SIM_RECT_CHANGED} event.
* @return {undefined}
*/
SimView.prototype.panLeft = function() {
  this.setCenterX(this.centerX_ - this.panX * this.width_);
};

/** Moves the center of the simulation rectangle (the 'camera') right by fraction
{@link #panX}, which causes the image to move left.
Also broadcasts a {@link #SIM_RECT_CHANGED} event.
* @return {undefined}
*/
SimView.prototype.panRight = function() {
  this.setCenterX(this.centerX_ + this.panX * this.width_);
};

/** Moves the center of the simulation rectangle (the 'camera') up by fraction
{@link #panY}, which causes the image to move down.
Also broadcasts a {@link #SIM_RECT_CHANGED} event.
* @return {undefined}
*/
SimView.prototype.panUp = function() {
  this.setCenterY(this.centerY_ + this.panY * this.height_);
};

/**
* @return {undefined}
* @private
*/
SimView.prototype.realign = function() {
  this.setCoordMap(CoordMap.make(this.screenRect_, this.simRect_, this.horizAlign_,
        this.verticalAlign_, this.aspectRatio_));
  this.width_ = this.simRect_.getWidth();
  this.height_ = this.simRect_.getHeight();
  this.centerX_ = this.simRect_.getCenterX();
  this.centerY_ = this.simRect_.getCenterY();
  this.ratio_ = this.height_/this.width_;
};

/** @override */
SimView.prototype.removeMemo = function(memorizable) {
  this.memoList_.removeMemo(memorizable);
};

/** Sets the ratio of 'pixels per simulation unit along y axis' divided
by 'pixels per simulation unit along x axis' used when displaying this SimView.
See {@link CoordMap}.
@param {number} aspectRatio the aspect ratio used when displaying this SimView
*/
SimView.prototype.setAspectRatio = function(aspectRatio) {
  if (Util.veryDifferent(this.aspectRatio_, aspectRatio)) {
    this.aspectRatio_ = aspectRatio;
    this.realign();
    this.broadcastParameter(SimView.en.ASPECT_RATIO);
  }
};

/** Sets the horizontal coordinate of simulation rectangle's center,
and broadcasts a {@link #SIM_RECT_CHANGED} event.
* @param {number} value the horizontal coordinate of simulation rectangle's center.
*/
SimView.prototype.setCenterX = function(value) {
  if (Util.veryDifferent(this.centerX_, value)) {
    this.centerX_ = value;
    this.modifySimRect();
  }
};

/** Sets the vertical coordinate of simulation rectangle's center,
and broadcasts a {@link #SIM_RECT_CHANGED} event.
* @param {number} value the vertical coordinate of simulation rectangle's center.
*/
SimView.prototype.setCenterY = function(value) {
  if (Util.veryDifferent(this.centerY_, value)) {
    this.centerY_ = value;
    this.modifySimRect();
  }
};

/** @override */
SimView.prototype.setCoordMap = function(map) {
  if (!CoordMap.isDuckType(map))
    throw new Error('not a CoordMap: '+map);
  this.coordMap_ = map;
  this.broadcast(new GenericEvent(this, LabView.COORD_MAP_CHANGED));
};

/** Sets height of the simulation rectangle, and broadcasts a {@link #SIM_RECT_CHANGED}
* event.
* @param {number} value height of the simulation rectangle
*/
SimView.prototype.setHeight = function(value) {
  if (Util.veryDifferent(this.height_, value)) {
    this.height_ = value;
    if (this.scaleTogether_) {
      this.width_ = this.height_ / this.ratio_;
    }
    this.modifySimRect();
  }
};

/** Sets the horizontal alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle. See {@link CoordMap}.
@param {!HorizAlign} alignHoriz the horizontal alignment to use
    for aligning the simulation rectangle within the screen rectangle
*/
SimView.prototype.setHorizAlign = function(alignHoriz) {
  this.horizAlign_ = HorizAlign.stringToEnum(alignHoriz);
  this.realign();
  this.broadcastParameter(SimView.en.HORIZONTAL_ALIGN);
};

/** Sets whether the width and height of the simulation rectangle scale together; if
true then changing one causes the other to change proportionally.
* @param {boolean} value whether width and height scale together
*/
SimView.prototype.setScaleTogether = function(value) {
  if (this.scaleTogether_ != value) {
    this.scaleTogether_ = value;
    if (this.scaleTogether_) {
      this.ratio_ = this.height_/this.width_;
    }
    this.broadcastParameter(SimView.en.SCALE_TOGETHER);
  }
};

/** @override */
SimView.prototype.setScreenRect = function(screenRect) {
  if (!ScreenRect.isDuckType(screenRect))
    throw new Error('not a ScreenRect: '+screenRect);
  if (screenRect.isEmpty()) {
    throw new Error('empty screenrect');
  }
  if (!this.screenRect_.equals(screenRect)) {
    this.screenRect_ = screenRect;
    this.realign();
    this.broadcast(new GenericEvent(this, LabView.SCREEN_RECT_CHANGED));
  }
};

/** @override */
SimView.prototype.setSimRect = function(simRect) {
  if (!DoubleRect.isDuckType(simRect))
    throw new Error('not a DoubleRect: '+simRect);
  if (!simRect.equals(this.simRect_)) {
    this.simRect_ = simRect;
    this.realign();
    this.broadcastParameter(SimView.en.WIDTH);
    this.broadcastParameter(SimView.en.HEIGHT);
    this.broadcastParameter(SimView.en.CENTER_X);
    this.broadcastParameter(SimView.en.CENTER_Y);
    this.broadcast(new GenericEvent(this, LabView.SIM_RECT_CHANGED));
  }
};

/** Sets the vertical alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle. See {@link CoordMap}.
@param {!VerticalAlign} alignVert the vertical alignment to use
    for aligning the simulation rectangle within the screen rectangle
*/
SimView.prototype.setVerticalAlign = function(alignVert) {
  this.verticalAlign_ = VerticalAlign.stringToEnum(alignVert);
  this.realign();
  this.broadcastParameter(SimView.en.VERTICAL_ALIGN);
};

/** Sets width of the simulation rectangle, and broadcasts a {@link #SIM_RECT_CHANGED}
* event.
* @param {number} value width of the simulation rectangle
*/
SimView.prototype.setWidth = function(value) {
  if (Util.veryDifferent(this.width_, value)) {
    this.width_ = value;
    if (this.scaleTogether_) {
      this.height_ = this.width_ * this.ratio_;
    }
    this.modifySimRect();
  }
};

/** Makes the height of the simulation rectangle smaller by fraction 1/{@link #zoom},
and also the width if {@link #getScaleTogether} is true.
Also broadcasts a {@link #SIM_RECT_CHANGED} event.
* @return {undefined}
*/
SimView.prototype.zoomIn = function() {
  this.setHeight(this.height_ / this.zoom);
};

/** Makes the height of the simulation rectangle bigger by fraction {@link #zoom},
and also the width if {@link #getScaleTogether} is true.
Also broadcasts a {@link #SIM_RECT_CHANGED} event.
* @return {undefined}
*/
SimView.prototype.zoomOut = function() {
  this.setHeight(this.height_ * this.zoom);
};

/** Set of internationalized strings.
@typedef {{
  SCALE_TOGETHER: string,
  WIDTH: string,
  HEIGHT: string,
  CENTER_X: string,
  CENTER_Y: string,
  VERTICAL_ALIGN: string,
  HORIZONTAL_ALIGN: string,
  ASPECT_RATIO: string
  }}
*/
SimView.i18n_strings;

/**
@type {SimView.i18n_strings}
*/
SimView.en = {
  SCALE_TOGETHER: 'scale X-Y together',
  WIDTH: 'width',
  HEIGHT: 'height',
  CENTER_X: 'center-x',
  CENTER_Y: 'center-y',
  VERTICAL_ALIGN: 'vertical-align',
  HORIZONTAL_ALIGN: 'horizontal-align',
  ASPECT_RATIO: 'aspect-ratio'
};

/**
@private
@type {SimView.i18n_strings}
*/
SimView.de_strings = {
  SCALE_TOGETHER: 'X-Y zusammen skalieren',
  WIDTH: 'Breite',
  HEIGHT: 'H\u00f6he',
  CENTER_X: 'Mitte X',
  CENTER_Y: 'Mitte Y',
  VERTICAL_ALIGN: 'Vertikalejustierung',
  HORIZONTAL_ALIGN: 'Horizontalejustierung',
  ASPECT_RATIO: 'Querschnittsverh\u00e4ltnis'
};

/** Set of internationalized strings.
@type {SimView.i18n_strings}
*/
SimView.i18n = goog.LOCALE === 'de' ? SimView.de_strings :
    SimView.en;

}); // goog.scope
