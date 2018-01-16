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

goog.provide('myphysicslab.lab.view.CoordMap');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericVector');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.VerticalAlign');

goog.scope(function() {

var AffineTransform = myphysicslab.lab.util.AffineTransform;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
const GenericVector = goog.module.get('myphysicslab.lab.util.GenericVector');
var HorizAlign = myphysicslab.lab.view.HorizAlign;
var ScreenRect = myphysicslab.lab.view.ScreenRect;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var VerticalAlign = myphysicslab.lab.view.VerticalAlign;

/** Provides the mapping between screen (canvas) coordinates and simulation coordinates;
this is an immutable object.

+ **Screen coordinates** corresponds to pixels on an HTML canvas; the vertical
coordinate increases going down, with zero usually being the top of the canvas.

+ **Simulation coordinates** the vertical coordinate increases going up; units
can be any size.

To create a CoordMap you specify translation and scaling factors for going between
screen and simulation coordinates. The CoordMap constructor maps the bottom-left point
on the canvas to the given bottom-left point in simulation space and then uses the given
scaling factors.

The static method {@link #make} calculates the translation and scaling factors in order
to fit a certain rectangle in simulation coords into another rectangle in screen coords.

From David Flanagan, *JavaScript: The Definitive Guide, 6th Edition* page 869:

> By default, the coordinate space for a canvas has its origin at `(0,0)` in the upper
left corner of the canvas, with `x` values increasing to the right and `y` values
increasing down. The `width` and `height` attributes of the `<canvas>` tag specify the
maximum X and Y coordinates, and a single unit in this coordinate space normally
translates to a single on-screen pixel.

Note however that a canvas actually has
[two coordinate systems](http://www.ckollars.org/canvas-two-coordinate-scales.html):

> The `<canvas...>` element is unlike almost all other HTML/HTML5 elements in using two
different coordinate system scales simultaneously. The *model* coordinate system scale
is used whenever you want to draw anything on the canvas. The *display* coordinate
system scale is used to control how much physical screen space is dedicated to the
canvas. You should explicitly specify both, the *model* coordinate size as attributes in
your HTML, and the *display* coordinate size in your CSS.

Essentially the *display* coordinates can be used to stretch a canvas to fit the screen
as desired. Here we ignore *display* coordinates and regard *screen coordinates* to be
what is called *model coordinates* in the above quote.

See also 'Coordinate System When Drawing An Image' in
{@link myphysicslab.lab.view.DisplayShape}.

@param {number} screen_left  the left edge of the canvas in screen coordinates
@param {number} screen_bottom the bottom edge of the canvas in screen coordinates
@param {number} sim_left  the simulation coordinate corresponding to screen_left
@param {number} sim_bottom  the simulation coordinate corresponding to screen_bottom
@param {number} pixel_per_unit_x  canvas pixels per simulation space unit along x axis
@param {number} pixel_per_unit_y  canvas pixels per simulation space unit along y axis
@constructor
@final
@struct
@private
*/
myphysicslab.lab.view.CoordMap = function(screen_left, screen_bottom, sim_left,
    sim_bottom, pixel_per_unit_x, pixel_per_unit_y) {
  /**
  * @type {number}
  * @private
  */
  this.screen_left_ = Util.testFinite(screen_left);
  /**
  * @type {number}
  * @private
  */
  this.screen_bottom_ = Util.testFinite(screen_bottom);
  /**
  * @type {number}
  * @private
  */
  this.sim_left_ = Util.testFinite(sim_left);
  /**
  * @type {number}
  * @private
  */
  this.sim_bottom_ = Util.testFinite(sim_bottom);
  /**
  * @type {number}
  * @private
  */
  this.pixel_per_unit_x_ = Util.testFinite(pixel_per_unit_x);
  /**
  * @type {number}
  * @private
  */
  this.pixel_per_unit_y_ = Util.testFinite(pixel_per_unit_y);
  var at = AffineTransform.IDENTITY;
  // do operations in reverse order, because of how matrix multiplication works
  at = at.translate(this.screen_left_, this.screen_bottom_);
  at = at.scale(this.pixel_per_unit_x_, -this.pixel_per_unit_y_);
  at = at.translate(-this.sim_left_, -this.sim_bottom_);
  /**
  * @type {!AffineTransform }
  * @private
  */
  this.transform_ = at;
};
var CoordMap = myphysicslab.lab.view.CoordMap;

if (!Util.ADVANCED) {
  /** @override */
  CoordMap.prototype.toString = function() {
    return 'CoordMap{screen_left_: '+Util.NF(this.screen_left_)
        +', screen_bottom_: '+Util.NF(this.screen_bottom_)
        +', sim_left_: '+Util.NF(this.sim_left_)
        +', sim_bottom_: '+Util.NF(this.sim_bottom_)
        +', pixels_per_unit_x_: '+Util.NF(this.pixel_per_unit_x_)
        +', pixels_per_unit_y_: '+Util.NF(this.pixel_per_unit_y_)
        + (this.transform_ != null) ? ', transform: '+this.transform_ : ''
        +'}';
  };
};

/**
* @type {number}
* @const
* @private
*/
CoordMap.MIN_SIZE = 1E-15;

/** Creates a CoordMap that fits a simulation coordinates rectangle inside a
screen coordinates rectangle in accordance with alignment options and aspect ratio.
Calculates the origin and scale, which define the coordinate mapping.

The mapping is calculated so that the given simulation rectangle transforms to be
the largest possible rectangle that fits inside the given screen rectangle, subject to
various alignment options. The alignment options are similar to typical word processor
alignment options such as left, center, right, or full justification. In the following
diagrams the simulation rectangle is the smaller bold bordered rectangle, inside the
larger screen rectangle.

    ┌──────────────────────────────────────────────────┐
    │┏━━━━━━━━━━━━━━━━┓                                │
    │┃                ┃                                │
    │┃                ┃                                │
    │┃    x: left     ┃                                │
    │┃                ┃                                │
    │┃                ┃                                │
    │┗━━━━━━━━━━━━━━━━┛                                │
    └──────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────┐
    │               ┏━━━━━━━━━━━━━━━━┓                 │
    │               ┃                ┃                 │
    │               ┃                ┃                 │
    │               ┃   x: middle    ┃                 │
    │               ┃                ┃                 │
    │               ┃                ┃                 │
    │               ┗━━━━━━━━━━━━━━━━┛                 │
    └──────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────┐
    │                                ┏━━━━━━━━━━━━━━━━┓│
    │                                ┃                ┃│
    │                                ┃                ┃│
    │                                ┃    x: right    ┃│
    │                                ┃                ┃│
    │                                ┃                ┃│
    │                                ┗━━━━━━━━━━━━━━━━┛│
    └──────────────────────────────────────────────────┘

Both horizontal and vertical dimensions (x and y) have alignments. One of x or y
will determine the scale and will fully span the screen rectangle; the alignment
option only affects the other axis. In the diagrams above, the alignment of the y axis
is ignored; the alignment only matters for the x placement.

Suppose the first diagram above had `LEFT` horizontal alignment and
`TOP` vertical alignment, but then the screen rectangle changed to be tall
and narrow; then we would see the first picture below. Other vertical alignment
options are shown as well.

    ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
    │┏━━━━━━━━━━━━━━━━┓│     │                  │     │                  │
    │┃                ┃│     │                  │     │                  │
    │┃    x: left     ┃│     │                  │     │                  │
    │┃    y: top      ┃│     │                  │     │                  │
    │┃                ┃│     │┏━━━━━━━━━━━━━━━━┓│     │                  │
    │┃                ┃│     │┃                ┃│     │                  │
    │┗━━━━━━━━━━━━━━━━┛│     │┃    x: left     ┃│     │                  │
    │                  │     │┃    y: middle   ┃│     │                  │
    │                  │     │┃                ┃│     │                  │
    │                  │     │┃                ┃│     │┏━━━━━━━━━━━━━━━━┓│
    │                  │     │┗━━━━━━━━━━━━━━━━┛│     │┃                ┃│
    │                  │     │                  │     │┃    x: left     ┃│
    │                  │     │                  │     │┃    y: bottom   ┃│
    │                  │     │                  │     │┃                ┃│
    │                  │     │                  │     │┃                ┃│
    │                  │     │                  │     │┗━━━━━━━━━━━━━━━━┛│
    └──────────────────┘     └──────────────────┘     └──────────────────┘

`FULL` ensures that for the chosen axis the simulation and screen rectangles
coincide. When both x and y have `FULL`, then the simulation and screen rectangles
will coincide but the aspect ratio is altered, so an image from the simulation may
appear squashed or stretched (see definition of aspect ratio below). For example, the
square simulation rectangle from our earlier examples is stretched out here:

    ┌──────────────────────────────────────────────────┐
    │┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓│
    │┃                                                ┃│
    │┃                                                ┃│
    │┃             x:full, y:full                     ┃│
    │┃                                                ┃│
    │┃                                                ┃│
    │┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛│
    └──────────────────────────────────────────────────┘

When only one of the axes has `FULL`, the simulation rectangle
might not entirely fit into the screen rectangle as the following example shows, but
the aspect ratio is preserved.

     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
     ┃                                                ┃
     ┃                                                ┃
     ┃                                                ┃
     ┃                                                ┃
     ┃                                                ┃
    ┌┃────────────────────────────────────────────────┃┐
    │┃                                                ┃│
    │┃                                                ┃│
    │┃            x:full, y:middle                    ┃│
    │┃                                                ┃│
    │┃                                                ┃│
    └┃────────────────────────────────────────────────┃┘
     ┃                                                ┃
     ┃                                                ┃
     ┃                                                ┃
     ┃                                                ┃
     ┃                                                ┃
     ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

The aspect ratio is the ratio of 'pixels per simulation unit along y axis' divided
by 'pixels per simulation unit along x axis'. The default aspect ratio is 1.0, so x
and y are treated identically with distance being measured the same in each direction.
An aspect ratio other than 1.0 will squash or stretch the image.  Note that aspect
ratio is ignored when both x and y axes have `FULL` specified.

The simulation rectangle, screen rectangle, alignment options, and aspect ratio are
only used to initially determine the coordinate transformation; they are not stored by
the CoordMap.

@param {!ScreenRect} screenRect  the screen space rectangle to fit the sim rect into
@param {!DoubleRect} simRect  the simulation space rectangle to be fit into the
    screenRect
@param {!HorizAlign=} horizAlign  horizontal alignment option from {@link HorizAlign};
    default is `HorizAlign.MIDDLE`
@param {!VerticalAlign=} verticalAlign  vertical alignment option from
    {@link VerticalAlign}; default is`VerticalAlign.MIDDLE`
@param {number=} aspectRatio  the ratio of 'pixels per simulation unit along y axis'
    divided by 'pixels per simulation unit along x axis';  default is 1.0
@return {!CoordMap} the CoordMap corresponding to the given options
@throws {!Error} if simRect is empty (has zero area), or invalid alignment options
    are given.
*/
CoordMap.make = function(screenRect, simRect, horizAlign, verticalAlign, aspectRatio) {
  horizAlign = HorizAlign.stringToEnum(horizAlign || HorizAlign.MIDDLE);
  verticalAlign = VerticalAlign.stringToEnum(verticalAlign || VerticalAlign.MIDDLE);
  aspectRatio = aspectRatio || 1.0;
  if (aspectRatio < CoordMap.MIN_SIZE || !isFinite(aspectRatio)) {
    throw new Error('bad aspectRatio '+aspectRatio);
  }
  var simLeft = simRect.getLeft();
  var simBottom = simRect.getBottom();
  var sim_width = simRect.getRight() - simLeft;
  var sim_height = simRect.getTop() - simBottom;
  if (sim_width < CoordMap.MIN_SIZE || sim_height < CoordMap.MIN_SIZE) {
    throw new Error('simRect cannot be empty '+simRect);
  }
  var screen_top = screenRect.getTop();
  var screen_left = screenRect.getLeft();
  var screen_width = screenRect.getWidth();
  var screen_height = screenRect.getHeight();
  var offset_x = 0;
  var offset_y = 0;
  var pixel_per_unit_x = 0;
  var pixel_per_unit_y = 0;
  // FULL = simRect matches the screenRect
  if (horizAlign == HorizAlign.FULL) {
    pixel_per_unit_x = screen_width/sim_width;
    offset_x = 0;
  }
  if (verticalAlign == VerticalAlign.FULL) {
    pixel_per_unit_y = screen_height/sim_height;
    offset_y = 0;
  }
  if (horizAlign != HorizAlign.FULL || verticalAlign != VerticalAlign.FULL) {
    // find scale (pixel_per_unit) for both x and y
    // aspectRatio = pixel_per_unit_y/pixel_per_unit_x
    // horizFull = true means: x axis has full-justification
    var horizFull;
    if (horizAlign == HorizAlign.FULL) {
      pixel_per_unit_y = pixel_per_unit_x * aspectRatio;
      horizFull = true;
    } else if (verticalAlign == VerticalAlign.FULL) {
      pixel_per_unit_x = pixel_per_unit_y / aspectRatio;
      horizFull = false;
    } else {
      // figure out which of x or y limits the size
      // first assume x determines the size.
      // definition: pixel_per_unit = screen_distance / sim_distance
      pixel_per_unit_x = screen_width/sim_width;
      pixel_per_unit_y = pixel_per_unit_x * aspectRatio;
      horizFull = true;
      var ideal_height = Math.floor(0.5 + pixel_per_unit_y*sim_height);
      if (screen_height < ideal_height) { // height is limiting factor
        pixel_per_unit_y = screen_height/sim_height;
        pixel_per_unit_x = pixel_per_unit_y / aspectRatio;
        horizFull = false;
      }
    }
    // use alignment to figure out offset (and therefore origin location)
    if (!horizFull) {
      // y is 'full justified':  simRect matches the screenRect on y axis
      goog.asserts.assert(horizAlign != HorizAlign.FULL);
      offset_y = 0;
      var ideal_width = Math.floor(0.5 + sim_width*pixel_per_unit_x);
      switch (horizAlign) {
        case HorizAlign.LEFT:
          offset_x = 0; break;
        case HorizAlign.MIDDLE:
          offset_x = (screen_width - ideal_width)/2; break;
        case HorizAlign.RIGHT:
          offset_x = screen_width - ideal_width; break;
        default: throw new Error('unsupported alignment '+horizAlign);
      }
    } else {
      // x is 'full justified':  simRect matches the screenRect on x axis
      goog.asserts.assert(verticalAlign != VerticalAlign.FULL);
      offset_x = 0;
      var ideal_height = Math.floor(0.5 + sim_height*pixel_per_unit_y);
      switch (verticalAlign) {
        case VerticalAlign.BOTTOM:
          offset_y = 0; break;
        case VerticalAlign.MIDDLE:
          offset_y = (screen_height - ideal_height)/2; break;
        case VerticalAlign.TOP:
          offset_y = screen_height - ideal_height; break;
        default: throw new Error('unsupported alignment '+verticalAlign);
      }
    }
  }
  var coordMap = new CoordMap(screen_left,
    screen_top + screen_height,
    simLeft - offset_x/pixel_per_unit_x,
    simBottom - offset_y/pixel_per_unit_y,
    pixel_per_unit_x,
    pixel_per_unit_y);
  return coordMap;
};

/** Returns true if the object is likely a CoordMap. Only works under simple
* compilation, intended for interactive non-compiled code.
* @param {*} obj the object of interest
* @return {boolean} true if the object is likely a CoordMap
*/
CoordMap.isDuckType = function(obj) {
  if (obj instanceof CoordMap) {
    return true;
  }
  if (Util.ADVANCED) {
    return false;
  }
  return obj.getAffineTransform !== undefined
    && obj.simToScreenX !== undefined
    && obj.simToScreenY !== undefined
    && obj.screenToSimX !== undefined
    && obj.screenToSimY !== undefined
    && obj.getScaleX !== undefined
    && obj.getScaleY !== undefined
};

/** Returns an AffineTransform that maps simulation coordinates to screen coordinates
using the mapping defined by this CoordMap.
@return {!AffineTransform} the AffineTransform equivalent of this CoordMap
*/
CoordMap.prototype.getAffineTransform = function() {
  return this.transform_;
};

/** Returns the horizontal scaling factor: the screen pixels per simulation space
unit along x axis.
@return {number} the horizontal scaling factor: screen pixels per unit of simulation
space in x direction
*/
CoordMap.prototype.getScaleX = function() {
  return this.pixel_per_unit_x_;
};

/** Returns the vertical scaling factor: the screen pixels per simulation space
unit along y axis.
@return {number} the vertical scaling factor: screen pixels per unit of simulation
space in y direction
*/
CoordMap.prototype.getScaleY = function() {
  return this.pixel_per_unit_y_;
};

/** Translates a point in screen coordinates to simulation coordinates.
@param {!GenericVector|number} scr_x horizontal position in screen coordinates,
    or GenericVector in screen coordinates
@param {number=} scr_y vertical position in screen coordinates
@return {!Vector} the equivalent position in simulation coordinates
*/
CoordMap.prototype.screenToSim = function(scr_x, scr_y) {
  var sx, sy;
  if (goog.isNumber(scr_x)) {
    sx = scr_x;
    sy = scr_y;
  } else {
    var v = /** @type {!GenericVector} */(scr_x);
    sy = v.getY();
    sx = v.getX();
  }
  if (!goog.isNumber(sx) || !goog.isNumber(sy)) {
    throw new Error();
  }
  return new Vector(this.screenToSimX(sx), this.screenToSimY(sy));
};

/** Translates the given screen coordinates rectangle into simulation coordinates.
@param {!ScreenRect} rect the rectangle in screen coordinates
@return {!DoubleRect} the equivalent rectangle in simulation coordinates
*/
CoordMap.prototype.screenToSimRect = function(rect) {
  return new DoubleRect(
    this.screenToSimX(rect.getLeft()),
    this.screenToSimY(rect.getTop() + rect.getHeight()),
    this.screenToSimX(rect.getLeft() + rect.getWidth()),
    this.screenToSimY(rect.getTop())
    );
};

/** Returns the equivalent length in simulation coordinates of the given horizontal
length in screen coordinates.
@param {number} scr_x a horizontal length in screen coordinates
@return {number} the equivalent length in simulation coordinates
*/
CoordMap.prototype.screenToSimScaleX = function(scr_x) {
  return scr_x/this.pixel_per_unit_x_;
};

/** Returns the equivalent length in simulation coordinates of the given vertical
length in screen coordinates.
@param {number} scr_y a vertical length in screen coordinates
@return {number} the equivalent length in simulation coordinates
*/
CoordMap.prototype.screenToSimScaleY = function(scr_y) {
  return scr_y/this.pixel_per_unit_y_;
};

/** Translates a horizontal screen coordinate to simulation coordinates.
@param {number} scr_x horizontal position in screen coordinates
@return {number} the equivalent position in simulation coordinates
*/
CoordMap.prototype.screenToSimX = function(scr_x)  {
  return this.sim_left_ + (scr_x - this.screen_left_)/this.pixel_per_unit_x_;
};

/** Translates a vertical screen coordinate to simulation coordinates.
@param {number} scr_y vertical position in screen coordinates
@return {number} the equivalent position in simulation coordinates
*/
CoordMap.prototype.screenToSimY = function(scr_y) {
  return this.sim_bottom_ + (this.screen_bottom_ - scr_y)/this.pixel_per_unit_y_;
};

/** Translates a point from simulation coordinates to screen coordinates.
@param {!GenericVector} p_sim the point in simulation coordinates to translate
@return {!Vector} the point translated to screen coordinates
*/
CoordMap.prototype.simToScreen = function(p_sim) {
  return new Vector(this.simToScreenX(p_sim.getX()), this.simToScreenY(p_sim.getY()));
};

/** Translates the given simulation coordinates rectangle into screen coordinates.
@param {!DoubleRect} r the rectangle in simulation coordinates
@return {!ScreenRect} the equivalent rectangle in screen coordinates
*/
CoordMap.prototype.simToScreenRect = function(r) {
  return new ScreenRect(
    this.simToScreenX(r.getLeft()),
    this.simToScreenY(r.getTop()),
    this.simToScreenScaleX(r.getWidth()),
    this.simToScreenScaleY(r.getHeight())
    );
};

/** Returns the equivalent length in screen coordinates of the given horizontal length
in simulation coordinates.
@param {number} length_x a horizontal length in simulation coordinates
@return {number} the equivalent length in screen coordinates
*/
CoordMap.prototype.simToScreenScaleX = function(length_x)  {
  return length_x*this.pixel_per_unit_x_;
};

/** Returns the equivalent length in screen coordinates of the given vertical length
in simulation coordinates.
@param {number} length_y a vertical length in simulation coordinates
@return {number} the equivalent length in screen coordinates
*/
CoordMap.prototype.simToScreenScaleY = function(length_y)  {
  return length_y*this.pixel_per_unit_y_;
};

/** Translates a horizontal simulation coordinate to screen coordinates.
@param {number} sim_x horizontal position in simulation coordinates
@return {number} the equivalent position in screen coordinates
*/
CoordMap.prototype.simToScreenX = function(sim_x)  {
  return this.screen_left_ + (sim_x - this.sim_left_)*this.pixel_per_unit_x_;
};

/** Translates a vertical simulation coordinate to screen coordinates.
@param {number} sim_y vertical position in simulation coordinates
@return {number} the equivalent position in screen coordinates
*/
CoordMap.prototype.simToScreenY = function(sim_y)  {
  return this.screen_bottom_ - (sim_y - this.sim_bottom_)*this.pixel_per_unit_y_;
};

});  // goog.scope
