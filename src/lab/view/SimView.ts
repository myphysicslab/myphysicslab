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

import { AbstractSubject } from "../util/AbstractSubject.js"
import { ConcreteMemoList } from "../util/ConcreteMemoList.js"
import { CoordMap } from "./CoordMap.js"
import { HorizAlign, HorizAlignValues, HorizAlignChoices } from "./HorizAlign.js";
import { VerticalAlign, VerticalAlignValues, VerticalAlignChoices }
    from "./VerticalAlign.js";
import { DisplayList } from "./DisplayList.js"
import { DisplayObject } from "./DisplayObject.js"
import { DoubleRect } from "../util/DoubleRect.js"
import { GenericEvent, ParameterBoolean, ParameterNumber, ParameterString, Subject }
    from "../util/Observe.js"
import { MemoList, Memorizable } from "../util/Memo.js"
import { ScreenRect } from "./ScreenRect.js"
import { SimObject } from "../model/SimObject.js"
import { Util } from "../util/Util.js"

/** A visual representation of a Simulation which can be displayed in a
{@link lab/view/LabCanvas.LabCanvas | LabCanvas}; has a {@link DisplayList} which
represents the {@link SimObject}s of the Simulation;
defines how to translate simulation coordinates to LabCanvas screen coordinates.

A SimView is shown inside a {@link lab/view/LabCanvas.LabCanvas | LabCanvas},
possibly overlaid with other SimViews.

Boundary Rectangles
-------------------
A SimView keeps track of two boundary rectangles: the simulation and screen rectangles.

+ The **simulation rectangle** specifies what area of the simulation space to display
in this SimView. See {@link getSimRect}.

+ The **screen rectangle** specifies where to show this SimView within the containing
LabCanvas. See {@link getScreenRect}. The screen rectangle is initially set to
a default size of 800 by 600.

A {@link CoordMap} maps the simulation rectangle onto the screen
rectangle, in accordance with various alignment options;
see {@link setHorizAlign}, {@link setVerticalAlign},
{@link setAspectRatio}. The CoordMap is available via
{@link getCoordMap}. The CoordMap is passed to each DisplayObject during the
{@link paint} method.

Pan-Zoom Controls
-----------------
The methods such as {@link panUp}, {@link panLeft},
{@link zoomIn}, {@link zoomOut}
are used to make a 'pan-zoom control' in
{@link sims/common/CommonControls.CommonControls.makePanZoomControls | CommonControls.makePanZoomControls}.
The amount of pan-zoom that is done by each invocation of those methods can be changed
via the properties {@link panX}, {@link panY}, {@link zoom}.

Parameters Created
------------------

+ ParameterBoolean named `SCALE_TOGETHER`, see {@link setScaleTogether}.

+ ParameterNumber named `WIDTH`, see {@link setWidth}

+ ParameterNumber named `HEIGHT`, see {@link setHeight}

+ ParameterNumber named `CENTER_X`, see {@link setCenterX}

+ ParameterNumber named `CENTER_Y`, see {@link setCenterY}

+ ParameterString named `VERTICAL_ALIGN`, see {@link setVerticalAlign}

+ ParameterString named `HORIZONTAL_ALIGN`, see {@link setHorizAlign}

+ ParameterNumber named `ASPECT_RATIO`, see {@link setAspectRatio}

Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `SIM_RECT_CHANGED` when the simulation rectangle changes.

+ GenericEvent named `COORD_MAP_CHANGED` when the CoordMap changes.

*/
export class SimView extends AbstractSubject implements Subject, MemoList, Memorizable {
  /** when panning vertically, this is percentage of height to move. */
  panY: number = 0.05;
  /** when panning horizontally, this is percentage of width to move. */
  panX: number = 0.05;
  /** when zooming, this is percentage of size to zoom */
  zoom: number = 1.1;
  /** The boundary rectangle in simulation coordinates. */
  private simRect_: DoubleRect;
  /** The rectangle in screen coordinates where this SimView exists inside the
  * LabCanvas.
  */
  private screenRect_: ScreenRect = new ScreenRect(0, 0, 800, 600);
  private horizAlign_: HorizAlign = HorizAlign.MIDDLE;
  private verticalAlign_: VerticalAlign = VerticalAlign.MIDDLE;
  private aspectRatio_: number = 1.0;
  /** This list of DisplayObjects that this SimView displays */
  private displayList_: DisplayList = new DisplayList();
  private scaleTogether_: boolean = true;
  /** The transparency used when painting the drawables; a number between
  * 0.0 (fully transparent) and 1.0 (fully opaque).
  */
  opaqueness: number = 1.0;
  /** The CoordMap that defines the simulation coordinates for this SimView.*/
  private coordMap_: CoordMap;
  private width_: number;
  private height_: number;
  private centerX_: number;
  private centerY_: number;
  /** ratio of height/width, used when scaleTogether_ is true. */
  private ratio_: number;
  private changed_: boolean = true;
  private memoList_: MemoList = new ConcreteMemoList();

/**
* @param name name of this SimView.
* @param simRect specifies what area of the simulation to display, in
*    simulation coordinates
*/
constructor(name: string, simRect: DoubleRect) {
  super(name);
  // give nice error message during interactive Terminal scripting
  if (!(simRect instanceof DoubleRect))
    throw 'not a DoubleRect '+simRect;
  if (simRect.isEmpty())
    throw 'empty DoubleRect '+simRect;
  this.simRect_ = simRect;
  this.coordMap_= CoordMap.make(this.screenRect_, this.simRect_, this.horizAlign_,
        this.verticalAlign_, this.aspectRatio_);
  this.width_ = simRect.getWidth();
  this.height_ = simRect.getHeight();
  this.centerX_ = simRect.getCenterX();
  this.centerY_ = simRect.getCenterY();
  this.ratio_ = this.height_/this.width_;

  this.addParameter(new ParameterNumber(this, SimView.en.WIDTH, SimView.i18n.WIDTH,
      () => this.getWidth(), a => this.setWidth(a)));
  this.addParameter(new ParameterNumber(this, SimView.en.HEIGHT, SimView.i18n.HEIGHT,
      () => this.getHeight(), a => this.setHeight(a)));
  this.addParameter(new ParameterNumber(this, SimView.en.CENTER_X,
      SimView.i18n.CENTER_X,
      () => this.getCenterX(), a => this.setCenterX(a))
      .setLowerLimit(Number.NEGATIVE_INFINITY));
  this.addParameter(new ParameterNumber(this, SimView.en.CENTER_Y,
      SimView.i18n.CENTER_Y,
      () => this.getCenterY(), a => this.setCenterY(a))
      .setLowerLimit(Number.NEGATIVE_INFINITY));
  this.addParameter(new ParameterBoolean(this, SimView.en.SCALE_TOGETHER,
      SimView.i18n.SCALE_TOGETHER,
      () => this.getScaleTogether(), a => this.setScaleTogether(a)));
  this.addParameter(new ParameterString(this, SimView.en.VERTICAL_ALIGN,
      SimView.i18n.VERTICAL_ALIGN,
      () => this.getVerticalAlign(),
      s => this.setVerticalAlign(s as VerticalAlign),
      VerticalAlignChoices(), VerticalAlignValues()));
  this.addParameter(new ParameterString(this, SimView.en.HORIZONTAL_ALIGN,
      SimView.i18n.HORIZONTAL_ALIGN,
      () => this.getHorizAlign(),
      s => this.setHorizAlign(s as HorizAlign),
      HorizAlignChoices(), HorizAlignValues()));
  this.addParameter(new ParameterNumber(this, SimView.en.ASPECT_RATIO,
      SimView.i18n.ASPECT_RATIO,
      () => this.getAspectRatio(), a => this.setAspectRatio(a)));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', simRect_: '+this.simRect_
      +', screenRect_: '+this.screenRect_
      +', horizAlign_: '+this.horizAlign_
      +', verticalAlign_: '+this.verticalAlign_
      +', aspectRatio_: '+Util.NF5(this.aspectRatio_)
      +', opaqueness: '+Util.NF5(this.opaqueness)
      +', coordMap_: '+this.coordMap_
      +', memoList_: '+this.memoList_
      + super.toString();
};

/** @inheritDoc */
override toStringShort() {
  return super.toStringShort().slice(0, -1)
      +', displayList_: '+this.displayList_.toStringShort() +'}';
};

/** @inheritDoc */
getClassName() {
  return 'SimView';
};

/** @inheritDoc */
addMemo(memorizable: Memorizable): void {
  this.memoList_.addMemo(memorizable);
};

/** Called when this SimView becomes the focus view of the LabCanvas. */
gainFocus(): void {};

/** Returns the ratio of 'pixels per simulation unit along y axis' divided
by 'pixels per simulation unit along x axis' used when displaying this SimView.
See {@link CoordMap}.
@return the aspect ratio used when displaying this SimView
*/
getAspectRatio(): number {
  return this.aspectRatio_;
};

/** Returns the horizontal coordinate of simulation rectangle's center.
* @return horizontal coordinate of simulation rectangle's center.
*/
getCenterX(): number {
  return this.centerX_;
};

/** Returns the vertical coordinate of simulation rectangle's center.
* @return the vertical coordinate of simulation rectangle's center.
*/
getCenterY(): number {
  return this.centerY_;
};

/** Returns true if this SimView has changed, and sets the state to "unchanged".
@return whether this SimView has changed
*/
getChanged(): boolean {
  const c = this.displayList_.getChanged();
  if (c || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Returns the CoordMap that defines the mapping between screen coordinates and
simulation coordinates.
@return the CoordMap being used by this SimView
*/
getCoordMap(): CoordMap {
  return this.coordMap_; // it is immutable, so OK to return it
};

/** @inheritDoc */
getDisplayList(): DisplayList {
  return this.displayList_;
};

/** Returns height of the simulation rectangle.
* @return height of the simulation rectangle
*/
getHeight(): number {
  return this.height_;
};

/** Returns the horizontal alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle.
See {@link CoordMap}.
@return the horizontal alignment to use for aligning the simulation
    rectangle within the screen rectangle
*/
getHorizAlign(): HorizAlign {
  return this.horizAlign_;
};

/** @inheritDoc */
getMemos(): Memorizable[] {
  return this.memoList_.getMemos();
};

/** Whether the width and height of the simulation rectangle scale together; if
true then changing one causes the other to change proportionally.
@return whether width and height scale together
*/
getScaleTogether(): boolean {
  return this.scaleTogether_;
};

/** Returns the screen rectangle that this SimView is occupying within the
LabCanvas, in screen coordinates.
@return the screen rectangle of this SimView in screen coordinates
*/
getScreenRect(): ScreenRect {
  return this.screenRect_; // it is immutable, so OK to return it
};

/** Returns the bounding rectangle for this SimView in simulation coordinates.
@return the bounding rectangle for this SimView in simulation coordinates
*/
getSimRect(): DoubleRect {
  return this.simRect_;
};

/** Returns the vertical alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle.
See {@link CoordMap}.
@return the vertical alignment to use for aligning the simulation
    rectangle within the screen rectangle
*/
getVerticalAlign(): VerticalAlign {
  return this.verticalAlign_;
};

/** Returns the width of the simulation rectangle.
* @return width of the simulation rectangle
*/
getWidth(): number {
  return this.width_;
};

/** Called when this SimView is no longer the focus view of the LabCanvas. */
loseFocus(): void {};

/** @inheritDoc */
memorize(): void {
  this.memoList_.memorize();
};

/** Modifies the simulation rectangle of the target SimView according to our
current settings for width, height, centerX, centerY.
*/
modifySimRect(): void {
  const left = this.centerX_ - this.width_/2.0;
  const bottom = this.centerY_ - this.height_/2.0;
  const r = new DoubleRect(left, bottom, left+this.width_, bottom+this.height_);
  this.changed_ = true;
  this.setSimRect(r);
};

/** Paints this SimView into the given CanvasRenderingContext2D.
* @param context the canvas's context to draw into
*/
paint(context: CanvasRenderingContext2D) {
  context.save();
  context.globalAlpha = this.opaqueness;
  this.displayList_.draw(context, this.coordMap_);
  context.restore();
};

/** Moves the center of the simulation rectangle (the 'camera') down by fraction
{@link panY}, which causes the image to move up.
Also broadcasts a {@link SIM_RECT_CHANGED} event.
*/
panDown(): void {
  this.setCenterY(this.centerY_ - this.panY * this.height_);
};

/** Moves the center of the simulation rectangle (the 'camera') left by fraction
{@link panX}, which causes the image to move right.
Also broadcasts a {@link SIM_RECT_CHANGED} event.
*/
panLeft(): void {
  this.setCenterX(this.centerX_ - this.panX * this.width_);
};

/** Moves the center of the simulation rectangle (the 'camera') right by fraction
{@link panX}, which causes the image to move left.
Also broadcasts a {@link SIM_RECT_CHANGED} event.
*/
panRight(): void {
  this.setCenterX(this.centerX_ + this.panX * this.width_);
};

/** Moves the center of the simulation rectangle (the 'camera') up by fraction
{@link panY}, which causes the image to move down.
Also broadcasts a {@link SIM_RECT_CHANGED} event.
*/
panUp(): void {
  this.setCenterY(this.centerY_ + this.panY * this.height_);
};

private realign(): void {
  this.setCoordMap(CoordMap.make(this.screenRect_, this.simRect_, this.horizAlign_,
        this.verticalAlign_, this.aspectRatio_));
  this.width_ = this.simRect_.getWidth();
  this.height_ = this.simRect_.getHeight();
  this.centerX_ = this.simRect_.getCenterX();
  this.centerY_ = this.simRect_.getCenterY();
  this.ratio_ = this.height_/this.width_;
  this.changed_ = true;
};

/** @inheritDoc */
removeMemo(memorizable: Memorizable): void {
  this.memoList_.removeMemo(memorizable);
};

/** Sets the ratio of 'pixels per simulation unit along y axis' divided
by 'pixels per simulation unit along x axis' used when displaying this SimView.
See {@link CoordMap}.
@param aspectRatio the aspect ratio used when displaying this SimView
*/
setAspectRatio(aspectRatio: number): void {
  if (Util.veryDifferent(this.aspectRatio_, aspectRatio)) {
    this.aspectRatio_ = aspectRatio;
    this.realign();
    this.broadcastParameter(SimView.en.ASPECT_RATIO);
  }
};

/** Sets the horizontal coordinate of simulation rectangle's center,
* and broadcasts a {@link SIM_RECT_CHANGED} event.
* @param value the horizontal coordinate of simulation rectangle's center.
*/
setCenterX(value: number): void {
  if (Util.veryDifferent(this.centerX_, value)) {
    this.centerX_ = value;
    this.modifySimRect();
  }
};

/** Sets the vertical coordinate of simulation rectangle's center,
* and broadcasts a {@link SIM_RECT_CHANGED} event.
* @param value the vertical coordinate of simulation rectangle's center.
*/
setCenterY(value: number): void {
  if (Util.veryDifferent(this.centerY_, value)) {
    this.centerY_ = value;
    this.modifySimRect();
  }
};

/** Sets the CoordMap used by this SimView.
* @param map the CoordMap to use for this SimView
*/
setCoordMap(map: CoordMap): void {
  // give nice error message during interactive Terminal scripting
  if (!(map instanceof CoordMap))
    throw 'not a CoordMap: '+map;
  this.coordMap_ = map;
  this.changed_ = true;
  this.broadcast(new GenericEvent(this, SimView.COORD_MAP_CHANGED));
};

/** Sets height of the simulation rectangle, and broadcasts a
* {@link SIM_RECT_CHANGED} event
* @param value height of the simulation rectangle
*/
setHeight(value: number): void {
  if (Util.veryDifferent(this.height_, value)) {
    this.height_ = value;
    if (this.scaleTogether_) {
      this.width_ = this.height_ / this.ratio_;
    }
    this.modifySimRect();
  }
};

/** Sets the horizontal alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle.
See {@link CoordMap}.
@param alignHoriz the horizontal alignment to use
    for aligning the simulation rectangle within the screen rectangle
*/
setHorizAlign(alignHoriz: HorizAlign): void {
  if (!HorizAlignValues().includes(alignHoriz)) {
    throw "invalid HorizAlign "+alignHoriz;
  }
  this.horizAlign_ = alignHoriz;
  this.realign();
  this.broadcastParameter(SimView.en.HORIZONTAL_ALIGN);
};

/** Sets whether the width and height of the simulation rectangle scale together; if
true then changing one causes the other to change proportionally.
@param value whether width and height scale together
*/
setScaleTogether(value: boolean): void {
  if (this.scaleTogether_ != value) {
    this.scaleTogether_ = value;
    if (this.scaleTogether_) {
      this.ratio_ = this.height_/this.width_;
    }
    this.changed_ = true;
    this.broadcastParameter(SimView.en.SCALE_TOGETHER);
  }
};

/** Sets the area that this SimView will occupy within the LabCanvas,
in screen coordinates.
@param screenRect the screen coordinates of the area this SimView should occupy
*/
setScreenRect(screenRect: ScreenRect): void {
  // give nice error message during interactive Terminal scripting
  if (!(screenRect instanceof ScreenRect))
    throw 'not a ScreenRect: '+screenRect;
  if (screenRect.isEmpty()) {
    throw 'empty screenrect';
  }
  if (!this.screenRect_.equals(screenRect)) {
    this.screenRect_ = screenRect;
    this.realign();
    this.broadcast(new GenericEvent(this, SimView.SCREEN_RECT_CHANGED));
  }
};

/** Sets the bounding rectangle for this SimView, ensures this rectangle
is visible, and turns off auto-scaling. The result is to generate a new CoordMap for
this SimView so that the simulation rectangle maps to the current screen rectangle.
@param simRect the bounding rectangle for this SimView in simulation coordinates.
*/
setSimRect(simRect: DoubleRect): void {
  // give nice error message during interactive Terminal scripting
  if (!(simRect instanceof DoubleRect))
    throw 'not a DoubleRect: '+simRect;
  if (!this.simRect_.equals(simRect)) {
    this.simRect_ = simRect;
    this.realign();
    this.broadcastParameter(SimView.en.WIDTH);
    this.broadcastParameter(SimView.en.HEIGHT);
    this.broadcastParameter(SimView.en.CENTER_X);
    this.broadcastParameter(SimView.en.CENTER_Y);
    this.broadcast(new GenericEvent(this, SimView.SIM_RECT_CHANGED));
  }
};

/** Sets the vertical alignment to use when aligning the SimView's
simulation rectangle within its screen rectangle.
See {@link CoordMap}.
@param alignVert the vertical alignment to use
    for aligning the simulation rectangle within the screen rectangle
*/
setVerticalAlign(alignVert: VerticalAlign): void {
  if (!VerticalAlignValues().includes(alignVert)) {
    throw "invalid VerticalAlign "+alignVert;
  }
  this.verticalAlign_ = alignVert;
  this.realign();
  this.broadcastParameter(SimView.en.VERTICAL_ALIGN);
};

/** Sets width of the simulation rectangle, and broadcasts a
* {@link SIM_RECT_CHANGED} event.
* @param value width of the simulation rectangle
*/
setWidth(value: number): void {
  if (Util.veryDifferent(this.width_, value)) {
    this.width_ = value;
    if (this.scaleTogether_) {
      this.height_ = this.width_ * this.ratio_;
    }
    this.modifySimRect();
  }
};

/** Makes the height of the simulation rectangle smaller by fraction
1/{@link zoom},
and also the width if {@link getScaleTogether} is true.
Also broadcasts a {@link SIM_RECT_CHANGED} event.
*/
zoomIn(): void {
  this.setHeight(this.height_ / this.zoom);
};

/** Makes the height of the simulation rectangle bigger by factor {@link zoom},
and also the width if {@link getScaleTogether} is true.
Also broadcasts a {@link SIM_RECT_CHANGED} event.
*/
zoomOut(): void {
  this.setHeight(this.height_ * this.zoom);
};

/** Name of event broadcast when the CoordMap changes, see {@link setCoordMap}.
*/
static COORD_MAP_CHANGED = 'COORD_MAP_CHANGED';

/** Name of event broadcast when the screen rectangle size changes, see
* {@link setScreenRect}.
*/
static SCREEN_RECT_CHANGED = 'SCREEN_RECT_CHANGED';

/** Name of event broadcast when the simulation rectangle size changes, see
* {@link setSimRect}.
*/
static SIM_RECT_CHANGED = 'SIM_RECT_CHANGED';

static readonly en: i18n_strings = {
  SCALE_TOGETHER: 'scale X-Y together',
  WIDTH: 'width',
  HEIGHT: 'height',
  CENTER_X: 'center-x',
  CENTER_Y: 'center-y',
  VERTICAL_ALIGN: 'vertical-align',
  HORIZONTAL_ALIGN: 'horizontal-align',
  ASPECT_RATIO: 'aspect-ratio'
};
static readonly de_strings: i18n_strings = {
  SCALE_TOGETHER: 'X-Y zusammen skalieren',
  WIDTH: 'Breite',
  HEIGHT: 'Höhe',
  CENTER_X: 'Mitte X',
  CENTER_Y: 'Mitte Y',
  VERTICAL_ALIGN: 'Vertikalejustierung',
  HORIZONTAL_ALIGN: 'Horizontalejustierung',
  ASPECT_RATIO: 'Querschnittsverhältnis'
};

static readonly i18n = Util.LOCALE === 'de' ? SimView.de_strings : SimView.en;
}; // end SimView class

type i18n_strings = {
  SCALE_TOGETHER: string,
  WIDTH: string,
  HEIGHT: string,
  CENTER_X: string,
  CENTER_Y: string,
  VERTICAL_ALIGN: string,
  HORIZONTAL_ALIGN: string,
  ASPECT_RATIO: string
}

Util.defineGlobal('lab$view$SimView', SimView);
