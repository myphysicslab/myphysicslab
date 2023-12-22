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

import { CoordMap } from './CoordMap.js';
import { DisplayObject } from './DisplayObject.js';
import { DoubleRect } from '../util/DoubleRect.js';
import { DrawingMode } from './DrawingMode.js';
import { DrawingStyle } from './DrawingStyle.js';
import { MutableVector } from '../util/MutableVector.js';
import { Path } from '../model/Path.js';
import { PathPoint } from '../model/PathPoint.js';
import { ScreenRect } from './ScreenRect.js';
import { SimObject } from '../model/SimObject.js';
import { Util } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';
import { MassObject } from "../model/MassObject.js"

/** Displays one or more {@link Path}'s within a specified screen
rectangle in the canvas. The screen rectangle is initially empty, so it must be set
with {@link setScreenRect}. Paths can be added or removed with methods
{@link addPath}, {@link removePath}.

+ **TO DO** make DRAW_POINTS settable.

+ **TO DO** Could allow setting background color.

+ **TO DO** getPosition() and contains() should return something related to position of
    screenRect.
*/
export class DisplayPath implements DisplayObject {
  private offScreen_: null|HTMLCanvasElement = null;
  /** Whether to draw into the offscreen buffer. */
  private useBuffer_: boolean|undefined;
  private paths_: Path[] = [];
  private styles_: DrawingStyle[] = [];
  /** sequence numbers indicate when a path has changed. */
  private sequence_: number[] = [];
  private screenRect_: ScreenRect = ScreenRect.EMPTY_RECT;
  /**  tells when need to redraw the bitmap from the paths */
  private redraw_: boolean = true;
  /** to detect when redraw needed;  when the coordmap changes, we need to redraw. */
  private lastMap_: null|CoordMap = null;
  private zIndex_: number|undefined;
  /** Default style for drawing a path, used as default in {@link addPath}.
  */
  private defaultStyle_: DrawingStyle|undefined;
  private proto_: null|DisplayPath;

/**
* @param proto the prototype DisplayPath to inherit properties from
*/
constructor(proto?: null|DisplayPath) {
  this.proto_ = proto ?? null;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', screenRect_: '+this.screenRect_
      +', zIndex: '+this.zIndex_
      +', useBuffer_: '+this.useBuffer_
      +', defaultStyle: '+this.defaultStyle_
      +', paths_: ['
      + this.paths_.map((p, idx) => idx+': '+p.toString())
      +']}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplayPath{paths_.length: '+this.paths_.length+'}';
};

/** Adds a Path to the set of paths to display.
* @param path the Path to display
* @param opt_style the DrawingStyle to use for drawing this Path;
*     uses the default style if not specified, see {@link setStyle}.
*/
addPath(path: Path, opt_style?: DrawingStyle) {
  if (!this.containsPath(path)) {
    this.paths_.push(path);
    this.styles_.push(opt_style ?? this.getDefaultStyle());
    this.sequence_.push(path.getSequence());
    this.redraw_ = true;
    this.flush();
  }
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
  // ? this seems wrong, but need the CoordMap to convert screenRect to sim coords
  return false;
};

/** Whether the Path is in the set of paths to display.
* @param path the Path of interest
* @return `true` if `path` is in the set of paths to display
*/
containsPath(path: Path): boolean {
  return this.paths_.includes(path);
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  const r = this.screenRect_;
  if (r.isEmpty()) {
    // don't bother if the screen isn't visible
    return;
  }
  Util.assert( r.getLeft() == 0);
  Util.assert( r.getTop() == 0);
  const w = r.getWidth();
  const h = r.getHeight();
  context.save();
  this.paths_.forEach((path, idx) => {
      const seq = path.getSequence();
      // Change in sequence number indicates path has changed.
      // If any of the paths have changed, then need to redraw.
      if (seq != this.sequence_[idx]) {
        this.sequence_[idx] = seq;
        this.redraw_ = true;
      }
    });
  if (this.lastMap_ == null || this.lastMap_ != map) {
    this.lastMap_ = map;
    // redraw because coordmap changed
    this.redraw_ = true;
  }
  // compare size of image to that of the screen rect; reallocate if different
  const useBuffer = this.getUseBuffer();
  if (useBuffer && this.offScreen_ != null)  {
    if (this.offScreen_.width != w || this.offScreen_.height != h) {
      this.flush();
    }
  }
  if (useBuffer && this.offScreen_ == null)  {
    this.offScreen_=document.createElement('canvas');
    this.offScreen_.width = w;
    this.offScreen_.height = h;
    // redraw because image reallocated
    this.redraw_ = true;
  }
  let ctx = context;
  if (useBuffer && this.offScreen_) {
    const offCtx =
        this.offScreen_.getContext('2d') as CanvasRenderingContext2D;
    if (offCtx) {
      ctx = offCtx;
    }
  }
  if (this.redraw_ || !useBuffer) {
    if (useBuffer) {
      // Clear image with transparent alpha by drawing a rectangle
      // 'clearRect fills with transparent black'
      ctx.clearRect(0, 0, w, h);
    }
    this.paths_.forEach((path, idx) =>
      this.drawPath(path, ctx, map, this.styles_[idx]));
    this.redraw_ = false;
  }
  if (useBuffer && this.offScreen_) {
    context.drawImage(this.offScreen_, 0, 0, w, h);
  }
  context.restore();
};

/**
* @param path
* @param context
* @param map
* @param style the DrawingStyle to use for drawing the Path
*/
private drawPath(path: Path, context: CanvasRenderingContext2D, map: CoordMap, style: DrawingStyle): void {
  const point = new MutableVector(0, 0);
  let firstTime = true;
  const w = style.lineWidth;
  const pointsIterator = path.getIterator(DisplayPath.DRAW_POINTS);
  while (pointsIterator.nextPoint(point)) {
    const scrX = map.simToScreenX(point.getX());
    const scrY = map.simToScreenY(point.getY());
    if (firstTime) {
      context.beginPath();
      context.moveTo(scrX, scrY);
      firstTime = false;
    }
    switch (style.drawMode) {
      case DrawingMode.LINES:
        if (!firstTime) {
          context.lineTo(scrX, scrY);
        }
        break;
      case DrawingMode.DOTS:
        context.rect(scrX, scrY, w, w);
        break;
      default:
        throw '';
    }
  }
  switch (style.drawMode) {
    case DrawingMode.LINES:
      context.strokeStyle = style.color;
      context.lineWidth = style.lineWidth;
      if (style.lineDash.length > 0 && typeof context.setLineDash === 'function') {
        context.setLineDash(style.lineDash);
      }
      context.stroke();
      break;
    case DrawingMode.DOTS:
      context.fillStyle = style.color;
      context.fill();
      break;
    default:
      throw '';
  }
};

private flush(): void {
  // in Javascript it is enough to just drop references and GC will collect it.
  this.offScreen_ = null;
}

/** @inheritDoc */
getChanged(): boolean {
  return this.redraw_;
};

/** Sets default DrawingStyle used in {@link addPath}.
* @return the default DrawingStyle to use when adding a Path
*/
getDefaultStyle(): DrawingStyle {
  if (this.defaultStyle_ !== undefined) {
    return this.defaultStyle_;
  } else if (this.proto_ != null) {
    return this.proto_.getDefaultStyle();
  } else {
    return DrawingStyle.lineStyle('gray', /*lineWidth=*/4);
  }
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [ ];
};

/** Returns the specified Path.
* @param arg  index number or name of Path. Name should be English
*     or language-independent version of name.
* @return path the Path of interest
*/
getPath(arg: number|string): Path {
  if (typeof arg === 'number') {
    if (arg >= 0 && arg < this.paths_.length) {
      return this.paths_[arg];
    }
  } else if (typeof arg === 'string') {
    arg = Util.toName(arg);
    const e = this.paths_.find((p: Path)=> p.getName() == arg);
    if (e !== undefined) {
      return e;
    }
  }
  throw 'DisplayPath did not find '+arg;
};

/** @inheritDoc */
getPosition(): Vector {
  //? what to return here ??? center of screenRect in sim coords?
  return Vector.ORIGIN;
};

/** Returns the screen rectangle that this DisplayPath is occupying within the
* LabCanvas, in screen coordinates.
* @return the screen rectangle of this DisplayPath in screen coordinates
*/
getScreenRect(): ScreenRect {
  return this.screenRect_;
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return Array.from(this.paths_);
};

/** Returns DrawingStyle used for drawing a Path.
* @param idx index of Path
* @return the DrawingStyle being used for drawing the Path
*/
getStyle(idx: number): DrawingStyle {
  if (idx < 0 || idx >= this.styles_.length) {
    throw '';
  }
  return this.styles_[idx];
}

/** Returns true when drawing the Paths into an offscreen buffer.
* @return true when drawing the Paths into an offscreen buffer
*/
getUseBuffer(): boolean {
  if (this.useBuffer_ !== undefined) {
    return this.useBuffer_;
  } else if (this.proto_ != null) {
    return this.proto_.getUseBuffer();
  } else {
    return true;
  }
};

/** @inheritDoc */
getZIndex(): number {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 0;
  }
};

/** @inheritDoc */
isDragable(): boolean {
  return false;
};

/** Removes a Path from the set of paths to display.
* @param path the Path to remove
*/
removePath(path: Path): void {
  if (this.containsPath(path)) {
    const idx = this.paths_.indexOf(path);
    if (idx > -1) {
      this.paths_.splice(idx, 1);
      this.styles_.splice(idx, 1);
      this.sequence_.splice(idx, 1);
      this.redraw_ = true;
      this.flush();
    }
  }
};

/** Sets default DrawingStyle used in {@link addPath}.
* @param value the default DrawingStyle to use when adding
*      a Path
* @return this object for chaining setters
*/
setDefaultStyle(value: DrawingStyle|undefined): DisplayPath {
  this.defaultStyle_ = value;
  return this;
};

/** @inheritDoc */
setDragable(_dragable: boolean): void {
};

/** @inheritDoc */
setPosition(_position: GenericVector): void {
};

/** Sets the screen rectangle that this DisplayPath should occupy within the
* LabCanvas, in screen coordinates.
* @param screenRect the screen coordinates of the area this DisplayPath
*    should occupy.
*/
setScreenRect(screenRect: ScreenRect): void {
  this.screenRect_ = screenRect;
  this.flush();
  this.redraw_ = true;
};

/** Sets DrawingStyle used for drawing a Path.
* @param idx index of Path
* @param value the DrawingStyle to use for drawing the Path
*/
setStyle(idx: number, value: DrawingStyle): void {
  if (idx < 0 || idx >= this.styles_.length) {
    throw '';
  }
  this.styles_[idx] = value;
  this.redraw_ = true;
};

/** Whether to draw the Paths into an offscreen buffer. For a Path that changes every
* frame, it saves time to *not* use an offscreen buffer.
* @param value Whether to draw the Paths into an offscreen buffer
* @return this object for chaining setters
*/
setUseBuffer(value: boolean|undefined): DisplayPath {
  this.useBuffer_ = value;
  if (!this.getUseBuffer()) {
    this.flush();
  }
  return this;
};

/** @inheritDoc */
setZIndex(zIndex: number): void {
  this.zIndex_ = zIndex;
  this.redraw_ = true;
};

static readonly DRAW_POINTS = 3000;

} // end class


Util.defineGlobal('lab$view$DisplayPath', DisplayPath);
