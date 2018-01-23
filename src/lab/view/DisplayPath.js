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

goog.module('myphysicslab.lab.view.DisplayPath');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.color');

const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const DrawingMode = goog.require('myphysicslab.lab.view.DrawingMode');
const DrawingStyle = goog.require('myphysicslab.lab.view.DrawingStyle');
const MutableVector = goog.require('myphysicslab.lab.util.MutableVector');
const Path = goog.require('myphysicslab.lab.model.Path');
const PathPoint = goog.require('myphysicslab.lab.model.PathPoint');
const ScreenRect = goog.require('myphysicslab.lab.view.ScreenRect');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Displays one or more {@link Path}s within a specified screen rectangle in the
canvas. The screen rectangle is initially empty, so it must be set with {@link
#setScreenRect}. Paths can be added or removed with methods {@link #addPath},
{@link #removePath}.

@todo make DRAW_POINTS settable.
@todo Could allow setting background color.
@todo getPosition() and contains() should return something related to position of
    screenRect.
* @implements {DisplayObject}
*/
class DisplayPath {
/**
* @param {?DisplayPath=} proto the prototype DisplayPath to inherit properties from
*/
constructor(proto) {
  /**
  * @type {?HTMLCanvasElement}
  * @private
  */
  this.offScreen_ = null;
  /** Whether to draw into the offscreen buffer.
  * @type {boolean|undefined}
  * @private
  */
  this.useBuffer_;
  /**
  * @type {!Array<!Path>}
  * @private
  */
  this.paths_ = [];
  /**
  * @type {!Array<!DrawingStyle>}
  * @private
  */
  this.styles_ = [];
  /** sequence numbers indicate when a path has changed.
  * @type {!Array<number>}
  * @private
  */
  this.sequence_ = [];
  /**
  * @type {!ScreenRect}
  * @private
  */
  this.screenRect_ = ScreenRect.EMPTY_RECT;
  /**  tells when need to redraw the bitmap from the paths
  * @type {boolean}
  * @private
  */
  this.redraw_ = true;
  /** to detect when redraw needed;  when the coordmap changes, we need to redraw.
  * @type {?CoordMap}
  * @private
  */
  this.lastMap_ = null;
  /**
  * @type {number|undefined}
  * @private
  */
  this.zIndex_;
  /** Default style for drawing a path, used as default in {@link #addPath}.
  * @type {!DrawingStyle|undefined}
  * @private
  */
  this.defaultStyle_;
  /**
  * @type {?DisplayPath}
  * @private
  */
  this.proto_ = goog.isDefAndNotNull(proto) ? proto : null;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', screenRect_: '+this.screenRect_
      +', zIndex: '+this.zIndex_
      +', useBuffer_: '+this.useBuffer_
      +', defaultStyle: '+this.defaultStyle_
      +', paths_: ['
      + goog.array.map(this.paths_, function(p, idx) {
          return idx+': '+p.toString();
        })
      +']}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'DisplayPath{paths_.length: '+this.paths_.length+'}';
};

/** Adds a Path to the set of paths to display.
* @param {!Path} path the Path to display
* @param {!DrawingStyle=} opt_style the DrawingStyle to use for drawing this Path;
*     uses the default style if not specified, see {@link #setStyle}.
*/
addPath(path, opt_style) {
  if (!this.containsPath(path)) {
    this.paths_.push(path);
    if (goog.isDefAndNotNull(opt_style)) {
      this.styles_.push(opt_style);
    } else {
      this.styles_.push(this.getDefaultStyle());
    }
    this.sequence_.push(path.getSequence());
    this.redraw_ = true;
    this.flush();
  }
};

/** @override */
contains(p_world) {
  // ? this seems wrong, but need the CoordMap to convert screenRect to sim coords
  return false;
};

/** Whether the Path is in the set of paths to display.
* @param {!Path} path the Path of interest
* @return {boolean} `true` if `path` is in the set of paths to display
*/
containsPath(path) {
  return goog.array.contains(this.paths_, path);
};

/** @override */
draw(context, map) {
  var r = this.screenRect_;
  if (r.isEmpty()) {
    // don't bother if the screen isn't visible
    return;
  }
  goog.asserts.assert( r.getLeft() == 0);
  goog.asserts.assert( r.getTop() == 0);
  var w = r.getWidth();
  var h = r.getHeight();
  context.save();
  goog.array.forEach(this.paths_, function(path, idx) {
      var seq = path.getSequence();
      // Change in sequence number indicates path has changed.
      // If any of the paths have changed, then need to redraw.
      if (seq != this.sequence_[idx]) {
        this.sequence_[idx] = seq;
        this.redraw_ = true;
      }
    }, this);
  if (this.lastMap_ == null || this.lastMap_ != map) {
    this.lastMap_ = map;
    // redraw because coordmap changed
    this.redraw_ = true;
  }
  // compare size of image to that of the screen rect; reallocate if different
  var useBuffer = this.getUseBuffer();
  if (useBuffer && this.offScreen_ != null)  {
    if (this.offScreen_.width != w || this.offScreen_.height != h) {
      this.flush();
    }
  }
  if (useBuffer && this.offScreen_ == null)  {
    this.offScreen_=/** @type {!HTMLCanvasElement}*/(document.createElement('canvas'));
    this.offScreen_.width = w;
    this.offScreen_.height = h;
    // redraw because image reallocated
    this.redraw_ = true;
  }
  /** @type {!CanvasRenderingContext2D}*/
  var ctx = context;
  if (useBuffer && this.offScreen_) {
    var offCtx =
        /** @type {!CanvasRenderingContext2D}*/(this.offScreen_.getContext('2d'));
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
    goog.array.forEach(this.paths_, function(path, idx) {
        this.drawPath(path, ctx, map, this.styles_[idx]);
      }, this);
    this.redraw_ = false;
  }
  if (useBuffer && this.offScreen_) {
    context.drawImage(this.offScreen_, 0, 0, w, h);
  }
  context.restore();
};

/**
* @param {!Path} path
* @param {!CanvasRenderingContext2D} context
* @param {!CoordMap} map
* @param {!DrawingStyle} style the DrawingStyle to use for drawing the Path
* @private
*/
drawPath(path, context, map, style) {
  var point = new MutableVector(0, 0);
  var firstTime = true;
  var w = style.lineWidth;
  var pointsIterator = path.getIterator(DisplayPath.DRAW_POINTS);
  while (pointsIterator.nextPoint(point)) {
    var scrX = map.simToScreenX(point.getX());
    var scrY = map.simToScreenY(point.getY());
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
        throw new Error();
    }
  }
  switch (style.drawMode) {
    case DrawingMode.LINES:
      context.strokeStyle = style.color;
      context.lineWidth = style.lineWidth;
      if (style.lineDash.length > 0 && goog.isFunction(context.setLineDash)) {
        context.setLineDash(style.lineDash);
      }
      context.stroke();
      break;
    case DrawingMode.DOTS:
      context.fillStyle = style.color;
      context.fill();
      break;
    default:
      throw new Error();
  }
};

/**
* @return {undefined}
* @private
*/
flush() {
  // in Javascript it is enough to just drop references and GC will collect it.
  this.offScreen_ = null;
}

/** Sets default DrawingStyle used in {@link #addPath}.
* @return {!DrawingStyle} the default DrawingStyle to use when adding a Path
*/
getDefaultStyle() {
  if (this.defaultStyle_ !== undefined) {
    return this.defaultStyle_;
  } else if (this.proto_ != null) {
    return this.proto_.getDefaultStyle();
  } else {
    return DrawingStyle.lineStyle('gray', /*lineWidth=*/4);
  }
};

/** @override */
getMassObjects() {
  return [ ];
};

/** Returns the specified Path.
* @param {number|string} arg  index number or name of Path. Name should be English
    or language-independent version of name.
* @return {!Path} path the Path of interest
*/
getPath(arg) {
  if (goog.isNumber(arg)) {
    if (arg >= 0 && arg < this.paths_.length) {
      return this.paths_[arg];
    }
  } else if (goog.isString(arg)) {
    arg = Util.toName(arg);
    var e = goog.array.find(this.paths_,
      function (/** !Path */obj) {
        return obj.getName() == arg;
      });
    if (e != null) {
      return e;
    }
  }
  throw new Error('DisplayPath did not find '+arg);
};

/** @override */
getPosition() {
  //? what to return here ??? center of screenRect in sim coords?
  return Vector.ORIGIN;
};

/** Returns the screen rectangle that this DisplayPath is occupying within the
* LabCanvas, in screen coordinates.
* @return {!ScreenRect} the screen rectangle of this DisplayPath in screen coordinates
*/
getScreenRect() {
  return this.screenRect_;
};

/** @override */
getSimObjects() {
  return goog.array.clone(this.paths_);
};

/** Returns DrawingStyle used for drawing a Path.
* @param {number} idx index of Path
* @return {!DrawingStyle} the DrawingStyle being used for drawing the Path
*/
getStyle(idx) {
  if (idx < 0 || idx >= this.styles_.length) {
    throw new Error();
  }
  return this.styles_[idx];
}

/** Returns true when drawing the Paths into an offscreen buffer.
* @return {boolean} true when drawing the Paths into an offscreen buffer
*/
getUseBuffer() {
  if (this.useBuffer_ !== undefined) {
    return this.useBuffer_;
  } else if (this.proto_ != null) {
    return this.proto_.getUseBuffer();
  } else {
    return true;
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

/** Removes a Path from the set of paths to display.
* @param {!Path} path the Path to remove
*/
removePath(path) {
  if (this.containsPath(path)) {
    var idx = goog.array.indexOf(this.paths_, path);
    if (idx > -1) {
      goog.array.removeAt(this.paths_, idx);
      goog.array.removeAt(this.styles_, idx);
      goog.array.removeAt(this.sequence_, idx);
      this.redraw_ = true;
      this.flush();
    }
  }
};

/** Sets default DrawingStyle used in {@link #addPath}.
* @param {!DrawingStyle|undefined} value the default DrawingStyle to use when adding
*      a Path
* @return {!DisplayPath} this object for chaining setters
*/
setDefaultStyle(value) {
  this.defaultStyle_ = value;
  return this;
};

/** @override */
setDragable(dragable) {
};

/** @override */
setPosition(position) {
};

/** Sets the screen rectangle that this DisplayPath should occupy within the
* LabCanvas, in screen coordinates.
* @param {!ScreenRect} screenRect the screen coordinates of the area this DisplayPath
*    should occupy.
*/
setScreenRect(screenRect) {
  this.screenRect_ = screenRect;
  this.flush();
};

/** Sets DrawingStyle used for drawing a Path.
* @param {number} idx index of Path
* @param {!DrawingStyle} value the DrawingStyle to use for drawing the Path
*/
setStyle(idx, value) {
  if (idx < 0 || idx >= this.styles_.length) {
    throw new Error();
  }
  this.styles_[idx] = value;
  this.redraw_ = true;
};

/** Whether to draw the Paths into an offscreen buffer. For a Path that changes every
frame, it saves time to *not* use an offscreen buffer.
* @param {boolean|undefined} value Whether to draw the Paths into an offscreen buffer
* @return {!DisplayPath} this object for chaining setters
*/
setUseBuffer(value) {
  this.useBuffer_ = value;
  if (!this.getUseBuffer()) {
    this.flush();
  }
  return this;
};

/** @override */
setZIndex(zIndex) {
  this.zIndex_ = zIndex;
};

} //end class

/**
* @type {number}
* @const
* @private
*/
DisplayPath.DRAW_POINTS = 3000;

exports = DisplayPath;
