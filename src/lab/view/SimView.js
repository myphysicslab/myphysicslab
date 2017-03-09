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
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.MemoList');
goog.require('myphysicslab.lab.util.Memorizable');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.LabView');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.VerticalAlign');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var CoordMap = myphysicslab.lab.view.CoordMap;
var DisplayList = myphysicslab.lab.view.DisplayList;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var GenericEvent = myphysicslab.lab.util.GenericEvent;
var HorizAlign = myphysicslab.lab.view.HorizAlign;
var LabView = myphysicslab.lab.view.LabView;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var ParameterBoolean = myphysicslab.lab.util.ParameterBoolean;
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var ParameterString = myphysicslab.lab.util.ParameterString;
var ScreenRect = myphysicslab.lab.view.ScreenRect;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var VerticalAlign = myphysicslab.lab.view.VerticalAlign;


/** Defines a rectangular region where a {@link myphysicslab.lab.view.DisplayList}
draws a set of {@link myphysicslab.lab.view.DisplayObject}s. A DisplayObject typically
represents a {@link myphysicslab.lab.model.SimObject}, but not always.

A SimView is shown inside a {@link myphysicslab.lab.view.LabCanvas}, possibly overlaid
with other SimViews.


Boundary Rectangles
-------------------
A SimView keeps track of two boundary rectangles: the simulation and screen rectangles.

+ The **screen rectangle** gives the size and location of this LabView within the
containing LabCanvas. See {@link #getScreenRect}. The screen rectangle is initially
set to a default size of 800 by 600.

+ The **simulation rectangle** specifies what area of the simulation to display in this
LabView. See {@link #getSimRect}.

A {@link myphysicslab.lab.view.CoordMap} maps the simulation rectangle onto the screen
rectangle, in accordance with various alignment options; see {@link #setHorizAlign},
{@link #setVerticalAlign}, {@link #setAspectRatio}. The CoordMap is available via
{@link #getCoordMap}. The CoordMap is passed to each DisplayObject during the
{@link #paint} method.


Pan-Zoom Controls
-----------------
The methods such as {@link #panUp}, {@link #panLeft}, {@link #zoomIn}, {@link #zoomOut}
are used to make a 'pan-zoom control' in
{@link myphysicslab.sims.layout.CommonControls#makePanZoomControls}. The amount of
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
SimView broadcasts these {@link myphysicslab.lab.util.GenericEvent}s to its Observers:

+ GenericEvent named `SIM_RECT_CHANGED` when the simulation rectangle changes.

+ GenericEvent named `COORD_MAP_CHANGED` when the CoordMap changes.



* @param {string} name name of this SimView.
* @param {!myphysicslab.lab.util.DoubleRect} simRect specifies what area of the
  simulation to display
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.LabView}
* @implements {myphysicslab.lab.util.Memorizable}
* @implements {myphysicslab.lab.util.MemoList}
* @extends {myphysicslab.lab.util.AbstractSubject}
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
  * @type {!myphysicslab.lab.util.DoubleRect}
  * @private
  */
  this.simRect_ = simRect;
  /** The rectangle in screen coordinates where this SimView exists inside the
  * LabCanvas.
  * @type {!myphysicslab.lab.view.ScreenRect}
  * @private
  */
  this.screenRect_ = new ScreenRect(0, 0, 800, 600);
  /**
  * @type {!myphysicslab.lab.view.HorizAlign}
  * @private
  */
  this.horizAlign_ = HorizAlign.MIDDLE;
  /**
  * @type {!myphysicslab.lab.view.VerticalAlign}
  * @private
  */
  this.verticalAlign_ = VerticalAlign.MIDDLE;
  /**
  * @type {number}
  * @private
  */
  this.aspectRatio_ = 1.0;
  /** This list of DisplayObjects that this SimView displays
  * @type {!myphysicslab.lab.view.DisplayList}
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
  /** The CoordMap that defines the simulation coordinates for this LabView.
  * @type {!myphysicslab.lab.view.CoordMap}
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
  * @type {Array<!myphysicslab.lab.util.Memorizable>}
  * @private
  */
  this.memorizables_ = [];
  this.addParameter(new ParameterNumber(this, SimView.en.WIDTH, SimView.i18n.WIDTH,
      this.getWidth, this.setWidth));
  this.addParameter(new ParameterNumber(this, SimView.en.HEIGHT, SimView.i18n.HEIGHT,
      this.getHeight, this.setHeight));
  this.addParameter(new ParameterNumber(this, SimView.en.CENTER_X,
      SimView.i18n.CENTER_X,
      this.getCenterX, this.setCenterX).setLowerLimit(Number.NEGATIVE_INFINITY));
  this.addParameter(new ParameterNumber(this, SimView.en.CENTER_Y,
      SimView.i18n.CENTER_Y,
      this.getCenterY, this.setCenterY).setLowerLimit(Number.NEGATIVE_INFINITY));
  this.addParameter(new ParameterBoolean(this, SimView.en.SCALE_TOGETHER,
      SimView.i18n.SCALE_TOGETHER,
      this.getScaleTogether, this.setScaleTogether));
  // Need a special 'setter' because `setVerticalAlign` takes an argument of
  // the enum type `VerticalAlign`, not of type `string`.
  this.addParameter(new ParameterString(this, SimView.en.VERTICAL_ALIGN,
      SimView.i18n.VERTICAL_ALIGN,
      this.getVerticalAlign,
      (/** function(this:myphysicslab.lab.view.SimView, string) */
      (function(s) { this.setVerticalAlign(VerticalAlign.stringToEnum(s)); })),
      VerticalAlign.getChoices(), VerticalAlign.getValues()));
  // Need a special 'setter' because `setHorizAlign` takes an argument of
  // the enum type `HorizAlign`, not of type `string`.
  this.addParameter(new ParameterString(this, SimView.en.HORIZONTAL_ALIGN,
      SimView.i18n.HORIZONTAL_ALIGN,
      this.getHorizAlign,
      (/** function(this:myphysicslab.lab.view.SimView, string) */
      (function(s) { this.setHorizAlign(HorizAlign.stringToEnum(s)); })),
      HorizAlign.getChoices(), HorizAlign.getValues()));
  this.addParameter(new ParameterNumber(this, SimView.en.ASPECT_RATIO,
      SimView.i18n.ASPECT_RATIO,
      this.getAspectRatio, this.setAspectRatio));
};
var SimView = myphysicslab.lab.view.SimView;
goog.inherits(SimView, AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  SimView.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', simRect_: '+this.simRect_
        +', screenRect_: '+this.screenRect_
        +', horizAlign_: '+this.horizAlign_
        +', verticalAlign_: '+this.verticalAlign_
        +', aspectRatio_: '+NF5(this.aspectRatio_)
        +', opaqueness: '+NF5(this.opaqueness)
        +', coordMap_: '+this.coordMap_
        +', memorizables_: ['
        + goog.array.map(this.memorizables_, function(a) { return a.toStringShort(); })
        + ']'
        + SimView.superClass_.toString.call(this);
  };

  /** @inheritDoc */
  SimView.prototype.toStringShort = function() {
    return SimView.superClass_.toStringShort.call(this).slice(0, -1)
        +', displayList_: '+this.displayList_.toStringShort() +'}';
  };
};

/** @inheritDoc */
SimView.prototype.getClassName = function() {
  return 'SimView';
};

/** @inheritDoc */
SimView.prototype.addMemo = function(memorizable) {
  if (!goog.array.contains(this.memorizables_, memorizable)) {
    this.memorizables_.push(memorizable);
  }
};

/** @inheritDoc */
SimView.prototype.gainFocus = function() {
};

/** Returns the ratio of 'pixels per simulation unit along y axis' divided
by 'pixels per simulation unit along x axis' used when displaying this LabView.
See {@link myphysicslab.lab.view.CoordMap}.
@return {number} the aspect ratio used when displaying this LabView
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

/** @inheritDoc */
SimView.prototype.getCoordMap = function() {
  return this.coordMap_; // it is immutable, so OK to return it
};

/** @inheritDoc */
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
See {@link myphysicslab.lab.view.CoordMap}.
@return {!myphysicslab.lab.view.HorizAlign} the horizontal alignment to use for aligning
    the simulation rectangle within the screen rectangle,
    from {@link myphysicslab.lab.view.HorizAlign}
*/
SimView.prototype.getHorizAlign = function() {
  return this.horizAlign_;
};

/** @inheritDoc */
SimView.prototype.getMemos = function() {
  return goog.array.clone(this.memorizables_);
};

/** Whether the width and height of the simulation rectangle scale together; if
true then changing one causes the other to change proportionally.
* @return {boolean} whether width and height scale together
*/
SimView.prototype.getScaleTogether = function() {
  return this.scaleTogether_;
};

/** @inheritDoc */
SimView.prototype.getScreenRect = function() {
  return this.screenRect_; // it is immutable, so OK to return it
};

/** @inheritDoc */
SimView.prototype.getSimRect = function() {
  return this.simRect_;
};

/** Returns the vertical alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle.
See {@link myphysicslab.lab.view.CoordMap}.
@return {!myphysicslab.lab.view.VerticalAlign} the vertical alignment to use for
    aligning the simulation rectangle within the screen rectangle,
    from {@link myphysicslab.lab.view.VerticalAlign}
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

/** @inheritDoc */
SimView.prototype.loseFocus = function() {
};

/** @inheritDoc */
SimView.prototype.memorize = function() {
  for (var i=0, n=this.memorizables_.length; i<n; i++) {
    this.memorizables_[i].memorize();
  }
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

/** @inheritDoc */
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
{@link #panY}, which causes the image to move right.
Also broadcasts a {@link #SIM_RECT_CHANGED} event.
* @return {undefined}
*/
SimView.prototype.panLeft = function() {
  this.setCenterX(this.centerX_ - this.panX * this.width_);
};

/** Moves the center of the simulation rectangle (the 'camera') right by fraction
{@link #panY}, which causes the image to move left.
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

/** @inheritDoc */
SimView.prototype.removeMemo = function(memorizable) {
  goog.array.remove(this.memorizables_, memorizable);
};

/** Sets the ratio of 'pixels per simulation unit along y axis' divided
by 'pixels per simulation unit along x axis' used when displaying this LabView.
See {@link myphysicslab.lab.view.CoordMap}.
@param {number} aspectRatio the aspect ratio used when displaying this LabView
*/
SimView.prototype.setAspectRatio = function(aspectRatio) {
  if (UtilityCore.veryDifferent(this.aspectRatio_, aspectRatio)) {
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
  if (UtilityCore.veryDifferent(this.centerX_, value)) {
    this.centerX_ = value;
    this.modifySimRect();
  }
};

/** Sets the vertical coordinate of simulation rectangle's center,
and broadcasts a {@link #SIM_RECT_CHANGED} event.
* @param {number} value the vertical coordinate of simulation rectangle's center.
*/
SimView.prototype.setCenterY = function(value) {
  if (UtilityCore.veryDifferent(this.centerY_, value)) {
    this.centerY_ = value;
    this.modifySimRect();
  }
};

/** @inheritDoc */
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
  if (UtilityCore.veryDifferent(this.height_, value)) {
    this.height_ = value;
    if (this.scaleTogether_) {
      this.width_ = this.height_ / this.ratio_;
    }
    this.modifySimRect();
  }
};

/** Sets the horizontal alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle.
See {@link myphysicslab.lab.view.CoordMap}.
@param {!myphysicslab.lab.view.HorizAlign} alignHoriz the horizontal alignment to use
    for aligning the simulation rectangle within the screen rectangle,
    from {@link myphysicslab.lab.view.HorizAlign}
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

/** @inheritDoc */
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

/** @inheritDoc */
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
simulation rectangle within its screen rectangle.
See {@link myphysicslab.lab.view.CoordMap}.
@param {!myphysicslab.lab.view.VerticalAlign} alignVert the vertical alignment to use
    for aligning the simulation rectangle within the screen rectangle,
    from {@link myphysicslab.lab.view.VerticalAlign}
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
  if (UtilityCore.veryDifferent(this.width_, value)) {
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
