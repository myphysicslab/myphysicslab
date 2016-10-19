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

goog.provide('myphysicslab.lab.view.DisplayShape');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.color');
goog.require('myphysicslab.lab.model.MassObject');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

var AffineTransform = myphysicslab.lab.util.AffineTransform;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var MassObject = myphysicslab.lab.model.MassObject;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Displays a {@link myphysicslab.lab.model.MassObject MassObject} with specified style such as color, border, etc.

Displays the MassObject by filling the shape, drawing the border, and optionally drawing
an image. Lastly ornaments are drawn such as a center of gravity marker, drag handles,
and name of the MassObject.


### Setting Display Attributes

DisplayShape has attributes to determine fill color, border color, border thickness,
whether to draw a center of mass symbol, etc. There are several ways to specify these
attributes:

+ Set default values of DisplayShape class properties such as
  {@link myphysicslab.lab.view.DisplayShape.fillStyle
  DisplayShape.fillStyle} *before creating* the DisplayShape.

+ Set multiple default values at once with {@link #setStyle} *before creating*
the DisplayShape.

+ Set public properties such as {@link #fillStyle}, {@link #strokeStyle},
{@link #thickness}, *after creating* the DisplayShape.


### Drawing Name of MassObject

The name of the MassObject is drawn when the {@link #nameFont} property is set. There
are also {@link #nameColor} and {@link #nameRotate} properties that affect how the name
is drawn. Example code:

    myPolygon.nameFont = '12pt sans-serif';

Here is a one-liner that can be executed in Terminal to show names on all objects:

    goog.array.forEach(simView.getDisplayList().toArray(), function(d) { d.nameFont='12pt sans-serif'; })


### Drawing an Image

You can draw an image in the DisplayShape by getting an HTMLImageElement that is on
the HTML page and assigning it to the {@link #image} property. For example in the HTML
page you would have

    <img id="myImage" src="../../images/myImage.png" width="32" height="32">

Then in the JavaScript application after making the DisplayShape, you can assign
the image to the DisplayShape:

    myPolygon.image = document.getElementById('myImage');

You can further translate, scale, and rotate the image within in DisplayShape by
making an AffineTransform and assigning it to {@link #imageAT}.  You can clip the
image to the boundary of the MassObject by setting {@link #imageClip} to `true`.

You can assign a function to {@link #imageDraw} and do the drawing within
that function. The same coordinate system modifications are done in that case. The
current path is the shape of the MassObject, so you can for example fill with a pattern.

Both `image` and `imageDraw` can be specified.  The `image` is drawn first, then
`imageDraw` function is called.

The application {@link myphysicslab.sims.engine2D.RigidBody1App} has examples of

+ drawing a scaled and rotated image inside a DisplayShape
+ filling with a color gradient
+ filling with a repeating tiled pattern



### Coordinate System When Drawing An Image

When drawing an image it is important to understand the several coordinate systems
involved:

+ ***simulation coordinates*** use the *Y increases up* convention. The origin can be
anywhere, and the units can be any size.

+ JavaScript canvas ***screen coordinates*** use the *Y increases down* convention,
usually with the origin at the top-left corner of the canvas, and with each unit
corresponding to a pixel. The transformation between simulation and screen coordinates
is handled by a {@link myphysicslab.lab.view.CoordMap}.

+ ***body coordinates*** rotates and translates along with a
{@link myphysicslab.lab.model.MassObject}.  Like simulation coordinates it uses the
* *Y increases up* convention, and has the same unit size.
See [Body Coordinates](Engine2D.html#bodycoordinates),
and {@link myphysicslab.lab.model.MassObject}.

For drawing the MassObject, we set the canvas to be in body coordinates. But when drawing
an image or text, the difference of whether the Y coordinate increases up or down can
cause the image or text to be drawn ***mirrored upside down***.

Therefore, before the image is drawn, we make additional transformations  to return to
something like screen coordinates with

+ Y increases down
+ each unit corresponds to a pixel
+ the origin is at top-left corner of the DisplayShape bounding box
+ but the coordinates are still oriented (rotated and translated) to align with the
DisplayShape, similar to body coordinates.

The {@link #imageAT} AffineTransform can then be specified to cause the image to be
appear with any combination of rotation, scaling, and positioning.  See the diagram
below.

There are also differences in how angles are specified in the different coordinate
systems; see 'About Coordinates and Angles' in
{@link myphysicslab.lab.engine2D.CircularEdge} for more information.

<img src="DisplayShape_Image.pdf">

The above examples of using AffineTransform on an image were generated by altering the
application {@link myphysicslab.sims.engine2D.RigidBody1App}.


@todo provide an AffineTransform for drawing the name, instead of nameRotate.

* @param {!myphysicslab.lab.model.MassObject} massObject the MassObject to display
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
*/
myphysicslab.lab.view.DisplayShape = function(massObject) {
  /** The MassObject to display.
  * @type {!myphysicslab.lab.model.MassObject}
  * @private
  */
  this.massObject_ = massObject;
  /** Whether the MassObject is dragable.
  * @type {boolean}
  * @private
  */
  this.dragable_ = isFinite(massObject.getMass())
      && massObject.getDragPoints().length > 0;
  /** The color or gradient used when drawing (filling) the massObject.
  * It can be a CSS3 color value (possibly including transparency) or a ColorGradient.
  * Set this to the empty string to not fill the massObject.
  * @type {string|!CanvasGradient}
  */
  this.fillStyle = DisplayShape.fillStyle;
  /** The color to use for drawing the border, or the empty string to not draw the
  * border. It should be a CSS3 color value (possibly including transparency).
  * The thickness of the border is set by {@link #thickness}.
  * @type {string}
  */
  this.strokeStyle = DisplayShape.strokeStyle;
  /** Thickness of border drawn, see {@link #strokeStyle}, in screen coordinates.
  * A value of 1 corresponds to a single pixel thickness.
  * @type {number}
  */
  this.thickness = DisplayShape.thickness;
  /** Line dash array used when drawing the border. Corresponds to lengths of dashes
  * and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
  * length 3 with spaces of length 5. Empty array indicates solid line.
  * @type {!Array<number>}
  */
  this.borderDash = DisplayShape.borderDash;
  /** Whether to draw the 'drag points' on the object; these are the places that
  * a spring can be attached to for dragging the object.
  * @type {boolean}
  */
  this.drawDragPoints = DisplayShape.drawDragPoints;
  /** Whether to draw the location of the center of mass; it is drawn as two small
  * crossed lines.
  * @type {boolean}
  */
  this.drawCenterOfMass = DisplayShape.drawCenterOfMass;
  /** Font for drawing name of the object, or the empty string to not draw the name.
  * It should be a CSS3 font value such as '16pt sans-serif'.
  * @type {string}
  */
  this.nameFont = DisplayShape.nameFont;
  /** Color for drawing name of the object; a CSS3 color value.
  * @type {string}
  */
  this.nameColor = DisplayShape.nameColor;
  /** Angle of rotation for drawing name, in radians.  Rotation is relative to the
  * position in body coordinates.
  * @type {number}
  */
  this.nameRotate = DisplayShape.nameRotate;
  /** Image to draw, after the massObject is filled and border is drawn. The
  * AffineTransform {@link #imageAT} is applied first, and the image is clipped if
  * {@link #imageClip} is set. This disables the name being drawn.
  * @type {?HTMLImageElement}
  */
  this.image = null;
  /** AffineTransform to use when drawing image.  The image is drawn in coordinates
  * that are oriented like body coordinates, but are like screen coordinates in that
  * the origin is at top left of the DisplayShape bounding box, Y increases downwards,
  * and units are equal to a screen pixel.
  * The `imageAT` AffineTransform is applied to further modify the coordinate system
  * before the image is drawn using the command `context.drawImage(this.image, 0, 0)`.
  * @type {!myphysicslab.lab.util.AffineTransform}
  */
  this.imageAT = AffineTransform.IDENTITY;
  /** Whether to clip the image with the shape of the MassObject.
  * @type {boolean}
  */
  this.imageClip = false;
  /** Function to draw an image, it is called after the massObject is filled, the border
  * is drawn and the {@link #image} is drawn.
  * The AffineTransform {@link #imageAT} is applied first,
  * and the image is clipped if {@link #imageClip} is set.
  * The current path is the outline of the massObject.
  * @type {?function(!CanvasRenderingContext2D):undefined}
  */
  this.imageDraw = null;
  /**
  * @type {boolean}
  * @private
  */
  this.isDarkColor_ = DisplayShape.darkColor(this.fillStyle);
  /** Remember the last color drawn, to keep isDarkColor_ in sync with fillStyle.
  * @type {*}
  * @private
  */
  this.lastColor_ = this.fillStyle;
};
var DisplayShape = myphysicslab.lab.view.DisplayShape;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayShape.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dragable_: '+this.dragable_
        +', fillStyle: "'+this.fillStyle+'"'
        +', strokeStyle: "'+this.strokeStyle+'"'
        +', thickness: '+NF(this.thickness)
        +', drawDragPoints: '+this.drawDragPoints
        +', drawCenterOfMass: '+this.drawCenterOfMass
        +', nameFont: '+this.nameFont
        +', nameColor: '+this.nameColor
        +', nameRotate: '+NF(this.nameRotate)
        +'}';
  };

  /** @inheritDoc */
  DisplayShape.prototype.toStringShort = function() {
    return 'DisplayShape{massObject_: '+this.massObject_.toStringShort()+'}';
  };
};

/** Default value for {@link #borderDash}, used when creating a DisplayShape.
* @type {!Array<number>}
*/
DisplayShape.borderDash = [ ];

/** Default value for {@link #drawCenterOfMass}, used when creating a DisplayShape.
* @type {boolean}
*/
DisplayShape.drawCenterOfMass = false;

/** Default value for {@link #drawDragPoints}, used when creating a DisplayShape.
* @type {boolean}
*/
DisplayShape.drawDragPoints = false;

/** Default value for {@link #fillStyle}, used when creating a DisplayShape.
* @type {string|!CanvasGradient}
*/
DisplayShape.fillStyle = 'lightGray';

/** Default value for {@link #nameColor}, used when creating a DisplayShape.
* @type {string}
*/
DisplayShape.nameColor = 'black';

/** Default value for {@link #nameFont}, used when creating a DisplayShape.
* @type {string}
*/
DisplayShape.nameFont = '';

/** Default value for {@link #nameRotate}, used when creating a DisplayShape.
* @type {number}
*/
DisplayShape.nameRotate = 0;

/** Default value for {@link #strokeStyle}, used when creating a DisplayShape.
* @type {string}
*/
DisplayShape.strokeStyle = '';

/** Default value for {@link #thickness}, used when creating a DisplayShape.
* @type {number}
*/
DisplayShape.thickness = 1.0;

/** Sets the default style used when creating a new DisplayShape to initial values.
* @return {undefined}
*/
DisplayShape.resetStyle = function() {
  DisplayShape.fillStyle = 'lightGray';
  DisplayShape.strokeStyle = '';
  DisplayShape.thickness = 1;
  DisplayShape.drawDragPoints = true;
  DisplayShape.drawCenterOfMass = true;
  DisplayShape.nameFont = '';
  DisplayShape.nameColor = 'black';
  DisplayShape.nameRotate = 0;
  DisplayShape.borderDash = [ ];
};

/** Sets the default style used when creating a new DisplayShape to match
* the given DisplayShape.
* @param {!myphysicslab.lab.view.DisplayShape} dispObj the DisplayShape to get
*    style from
*/
DisplayShape.setStyle = function(dispObj) {
  DisplayShape.fillStyle = dispObj.fillStyle;
  DisplayShape.strokeStyle = dispObj.strokeStyle;
  DisplayShape.thickness = dispObj.thickness;
  DisplayShape.drawDragPoints = dispObj.drawDragPoints;
  DisplayShape.drawCenterOfMass = dispObj.drawCenterOfMass;
  DisplayShape.nameFont = dispObj.nameFont;
  DisplayShape.nameColor = dispObj.nameColor;
  DisplayShape.nameRotate = dispObj.nameRotate;
  DisplayShape.borderDash = dispObj.borderDash;
};

/** @inheritDoc */
DisplayShape.prototype.contains = function(p_world) {
  var p_body = this.massObject_.worldToBody(p_world);
  return this.massObject_.getBoundsBody().contains(p_body);
};

/** Whether the given color is a dark color. Used to decide what color to
* draw over this color.  Returns `false` for empty string.
* @param {*} color a CSS color specification, or empty string, or gradient or pattern
* @return {boolean} whether the color is dark
* @private
*/
DisplayShape.darkColor = function(color) {
  if (!goog.isString(color))
    return false;
  if (color == '')
    return false;
  // goog.color.parse() does not accept 'rgba' type of colors.  Therefore
  // transform rgba to rgb.
  // Matches things like: rgba(192, 255, 192, 0.5) or rgba(192, 255, 192, 1)
  var m = color.match(/^rgba\((.*),\s*\d*\.?\d+\)/);
  if (m != null) {
    color = 'rgb('+m[1]+')';
  }
  var c = goog.color.parse(color);
  var hsb = goog.color.hexToHsv(c.hex);
  // decide if its a dark color by looking at the saturation and brightness
  // low brightness  OR  (high saturation AND close to blue)
  return hsb[2] < 0.65 || hsb[1] > 0.57 && Math.abs(hsb[0] - 0.677) < 0.11;
};

/** @inheritDoc */
DisplayShape.prototype.draw = function(context, map) {
  context.save();
  /** @type {!myphysicslab.lab.util.AffineTransform} */
  var sim_to_screen = map.getAffineTransform(); // sim to screen transform
  // sim_to_screen_units = scaling factor to go from sim units to screen units (pixels)
  var sim_to_screen_units = 1/map.getScaleX();
  var body_to_screen =
      sim_to_screen.concatenate(this.massObject_.bodyToWorldTransform());
  body_to_screen.setTransform(context);
  this.massObject_.createCanvasPath(context);
  if (this.imageClip) {
    context.clip();
  }
  if (this.fillStyle !== '') {
    context.fillStyle = this.fillStyle;
    context.fill();
  }
  if (this.strokeStyle !== '') {
    context.lineWidth = map.screenToSimScaleX(this.thickness);
    if (this.borderDash.length > 0 && goog.isFunction(context.setLineDash)) {
      // convert the borderDash to be in sim coords
      var ld = goog.array.map(this.borderDash, function(n) {
          return map.screenToSimScaleX(n);
        });
      context.setLineDash(ld);
    }
    context.strokeStyle = this.strokeStyle;
    context.stroke();
    context.setLineDash([]);
  }
  if (this.image != null || this.imageDraw != null) {
    // Set origin to be top left corner of massObject bounding box.
    context.translate(this.massObject_.getLeftBody(), this.massObject_.getTopBody());
    // undo the 'y increases up' convention of sim coordinates
    context.scale(sim_to_screen_units, -sim_to_screen_units);
    this.imageAT.applyTransform(context);
    if (this.image != null) {
      context.drawImage(this.image, 0, 0);
    }
    if (this.imageDraw != null) {
      this.imageDraw(context);
    }
  }
  // Draw adornments for moveable objects (mass less than infinity).
  if (this.massObject_.getMass() != UtilityCore.POSITIVE_INFINITY) {
    body_to_screen.setTransform(context);
    // detect when fillStyle changes, to update isDarkColor_
    if (this.lastColor_ !== this.fillStyle) {
      this.lastColor_ = this.fillStyle;
      this.isDarkColor_ = DisplayShape.darkColor(this.fillStyle);
    }
    var pixel = map.screenToSimScaleX(1);
    context.lineWidth = pixel; // one pixel wide stroke.
    if (this.drawCenterOfMass) {
      var cm_body = this.massObject_.getCenterOfMassBody();
      // draw a cross at the center of mass
      if (this.isDarkColor_) {
        context.strokeStyle = '#ccc'; //lightGray;
      } else {
        context.strokeStyle = 'black';
      }
      var len = 0.2 * Math.min(this.massObject_.getWidth(),
          this.massObject_.getHeight());
      var max_len = 8*pixel;
      if (len > max_len) {
        len = max_len;
      }
      context.beginPath();
      context.moveTo(cm_body.getX() - len, cm_body.getY());
      context.lineTo(cm_body.getX() + len, cm_body.getY());
      context.stroke();

      context.beginPath();
      context.moveTo(cm_body.getX(), cm_body.getY() - len);
      context.lineTo(cm_body.getX(), cm_body.getY() + len);
      context.stroke();
    }
    // draw a dot at the drag points
    if (this.drawDragPoints) {
      var d = 4*pixel;
      var sz = 0.15 * Math.min(this.massObject_.getWidth(),
          this.massObject_.getHeight());
      if (sz < d) {
        d = sz;
      }
      goog.array.forEach(this.massObject_.getDragPoints(), function(dpt) {
        if (this.isDarkColor_) {
          context.fillStyle = '#ccc'; //lightGray;
        } else {
          context.fillStyle = 'gray';
        }
        context.beginPath();
        context.arc(dpt.getX(), dpt.getY(), d, 0, 2*Math.PI, /*clockwise=*/false);
        context.closePath();
        context.fill();
      }, this);
    }
  }
  if (this.nameFont) {
    // draw name of massObject
    var cen = this.massObject_.getCentroidBody();
    var at = body_to_screen.translate(cen);
    if (this.nameRotate) {
      at = at.rotate(this.nameRotate);
    }
    at = at.scale(sim_to_screen_units, -sim_to_screen_units);
    at.setTransform(context);
    context.fillStyle = this.nameColor;
    context.font = this.nameFont;
    context.textAlign = 'center';
    var tx = this.massObject_.getName(/*localized=*/true);
    // find height of text from width of 'M', because is a roughly square letter.
    var ht = context.measureText('M').width;
    context.fillText(tx, 0, ht/2);
  }
  context.restore();
};

/** @inheritDoc */
DisplayShape.prototype.getMassObjects = function() {
  return [ this.massObject_ ];
};

/** @inheritDoc */
DisplayShape.prototype.getPosition = function() {
  return this.massObject_.getPosition();
};

/** @inheritDoc */
DisplayShape.prototype.getSimObjects = function() {
  return [ this.massObject_ ];
};

/** @inheritDoc */
DisplayShape.prototype.isDragable = function() {
  return this.dragable_;
};

/** @inheritDoc */
DisplayShape.prototype.setDragable = function(dragable) {
  this.dragable_ = dragable;
};

/** @inheritDoc */
DisplayShape.prototype.setPosition = function(position) {
  this.massObject_.setPosition(position);
};

});  // goog.scope
