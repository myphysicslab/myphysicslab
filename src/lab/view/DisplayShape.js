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
goog.require('myphysicslab.lab.model.PointMass');
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
var PointMass = myphysicslab.lab.model.PointMass;
var SimObject = myphysicslab.lab.model.SimObject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/** Displays a {@link myphysicslab.lab.model.MassObject MassObject} with specified style such as color, border, etc.

Displays the MassObject by filling the shape, drawing the border, and optionally drawing
an image. Lastly ornaments are drawn such as a center of gravity marker, drag handles,
and name of the MassObject.


### Setting Display Attributes

DisplayShape has attributes to determine fill color, border color, border thickness,
whether to draw a center of mass symbol, etc. There are two ways to specify these
attributes:

#### 1. Modify the style directly

Modify the DisplayShape's style directly after it has been created. Here is a typical
example where the DisplayShape is created by
{@link myphysicslab.sims.engine2D.RigidBodyObserver}.

    simList.add(polygon1); // RigidBodyObserver creates a DisplayShape here
    var dispPoly1 = displayList.findShape(polygon1);
    dispPoly1.setFillStyle('red');


#### 2. Modify the prototype

DisplayShape allows specifying a **prototype** DisplayShape. When a display
property is `undefined`, then the property is fetched from the prototype. If it is also
`undefined` on the prototype then a default value is used.

Keep in mind that **all** objects with a given prototype will be affected by any
changes made to the prototype.

Here is an example where we make a prototype that causes the names to be drawn.

    var protoShape = new DisplayShape().setNameFont('10pt sans-serif');
    var shape1 = new DisplayShape(mass1, protoShape);

See {@link myphysicslab.sims.engine2D.RigidBodyObserver} which sets up several
prototype objects.


### Drawing Name of MassObject

The name of the MassObject is drawn when the {@link #setNameFont} property has a valid
font specifier string. There are also {@link #setNameColor} and {@link #setNameRotate}
properties that affect how the name is drawn. Example code:

    myPolygon.setNameFont('12pt sans-serif').setNameColor('gray');

Here is a script that can be executed in Terminal to show names on all DisplayShapes:

    goog.array.forEach(displayList.toArray(), function(d) {
        if (d instanceof DisplayShape) {
          d.setNameFont('12pt sans-serif');
        }
    })

Or, if the objects of interest have the same prototype, then you can just change
the prototype object.


### Drawing an Image

You can draw an image in the DisplayShape by getting an HTMLImageElement that is on
the HTML page and using {@link #setImage}. For example in the HTML
page you would have

    <img id="myImage" src="../../images/myImage.png" width="32" height="32">

Then in the JavaScript application after making the DisplayShape, you can assign
the image to the DisplayShape:

    myPolygon.setImage(document.getElementById('myImage'));

You can further translate, scale, and rotate the image within in DisplayShape by
making an AffineTransform and using {@link #setImageAT}.  You can clip the
image to the boundary of the MassObject by using {@link #setImageClip}.

You can assign a function to {@link #setImageDraw} and do the drawing within
that function. The same coordinate system modifications are done in that case. The
current path is the shape of the MassObject, so you can for example fill with a pattern.

Both `setImage` and `setImageDraw` can be used together. The `image` is drawn first,
then the `imageDraw` function is called.

The application {@link myphysicslab.sims.engine2D.DoublePendulum2App} has examples of

+ drawing a scaled and rotated image inside a DisplayShape
+ filling with a color gradient
+ filling with a repeating tiled pattern



### Coordinate System When Drawing An Image

When drawing an image it is important to understand the several coordinate systems
involved:

+ ***simulation coordinates*** uses the *Y increases up* convention. The origin can be
anywhere, and the units can be any size.

+ JavaScript canvas ***screen coordinates*** uses the *Y increases down* convention,
with the origin at the top-left corner of the canvas, and with each unit
corresponding to a pixel. The transformation between simulation and screen coordinates
is handled by a {@link myphysicslab.lab.view.CoordMap} which can be set for the
{@link myphysicslab.lab.view.LabView}.

+ ***body coordinates*** rotates and translates along with a
{@link myphysicslab.lab.model.MassObject}.  Like simulation coordinates it uses the
* *Y increases up* convention, and has the same unit size as simulation coordinates.
See [Body Coordinates](Engine2D.html#bodycoordinates),
and {@link myphysicslab.lab.model.MassObject}.

For drawing the MassObject, we set the canvas to be in body coordinates. But when
drawing an image or text, the difference of whether the Y coordinate increases up or
down can cause the image or text to be drawn ***mirrored upside down***.

Therefore, before the image is drawn, we make additional transformations  to return to
something like screen coordinates with

+ Y increases down
+ each unit corresponds to a pixel
+ the origin is at top-left corner of the DisplayShape bounding box
+ but the coordinates are still oriented (rotated and translated) to align with the
    DisplayShape, similar to body coordinates.

The {@link #setImageAT} AffineTransform can then be specified to cause the image to be
appear with any combination of rotation, scaling, and positioning.  See the diagram
below.

There are also differences in how angles are specified in the different coordinate
systems; see 'About Coordinates and Angles' in
{@link myphysicslab.lab.engine2D.CircularEdge} for more information.

<img src="DisplayPolygon_Image.pdf">

The above examples of using an {@link myphysicslab.lab.util.AffineTransform} on an
image were generated by altering the application
{@link myphysicslab.sims.engine2D.DoublePendulum2App}.


@todo provide an AffineTransform for drawing the name, instead of nameRotate.

* @param {?myphysicslab.lab.model.MassObject=} massObject the MassObject to display
* @param {?DisplayShape=} proto the prototype DisplayShape to inherit properties
*     from
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.view.DisplayObject}
*/
myphysicslab.lab.view.DisplayShape = function(massObject, proto) {
  /** The MassObject to display.
  * @type {!myphysicslab.lab.model.MassObject}
  * @private
  */
  this.massObject_ = goog.isDefAndNotNull(massObject) ?
      massObject : new PointMass('proto');
  /**
  * @type {?DisplayShape}
  * @private
  */
  this.proto_ = goog.isDefAndNotNull(proto) ? proto : null;
  /** Whether the MassObject is dragable.
  * @type {boolean}
  * @private
  */
  this.dragable_ = isFinite(this.massObject_.getMass())
      && this.massObject_.getDragPoints().length > 0;
  /** The color or gradient used when drawing (filling) the massObject.
  * It can be a CSS3 color value (possibly including transparency) or a ColorGradient.
  * Set this to the empty string to not fill the massObject.
  * @type {string|!CanvasGradient|undefined}
  * @private
  */
  this.fillStyle_;
  /** The color to use for drawing the border, or the empty string to not draw the
  * border. It should be a CSS3 color value (possibly including transparency).
  * The thickness of the border is set by {@link #thickness}.
  * @type {string|undefined}
  * @private
  */
  this.strokeStyle_;
  /** Thickness of border drawn, see {@link #strokeStyle}, in screen coordinates.
  * A value of 1 corresponds to a single pixel thickness.
  * @type {number|undefined}
  * @private
  */
  this.thickness_;
  /** Line dash array used when drawing the border. Corresponds to lengths of dashes
  * and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
  * length 3 with spaces of length 5. Empty array indicates solid line.
  * @type {!Array<number>|undefined}
  * @private
  */
  this.borderDash_;
  /** Whether to draw the 'drag points' on the object; these are the places that
  * a spring can be attached to for dragging the object.
  * @type {boolean|undefined}
  * @private
  */
  this.drawDragPoints_;
  /** Whether to draw the location of the center of mass; it is drawn as two small
  * crossed lines.
  * @type {boolean|undefined}
  * @private
  */
  this.drawCenterOfMass_;
  /** Font for drawing name of the object, or the empty string to not draw the name.
  * It should be a CSS3 font value such as '16pt sans-serif'.
  * @type {string|undefined}
  * @private
  */
  this.nameFont_;
  /** Color for drawing name of the object; a CSS3 color value.
  * @type {string|undefined}
  * @private
  */
  this.nameColor_;
  /** Angle of rotation for drawing name, in radians.  Rotation is relative to the
  * position in body coordinates.
  * @type {number|undefined}
  * @private
  */
  this.nameRotate_;
  /** Image to draw, after the massObject is filled and border is drawn. The
  * AffineTransform {@link #imageAT} is applied first, and the image is clipped if
  * {@link #imageClip} is set. This disables the name being drawn.
  * @type {?HTMLImageElement|undefined}
  * @private
  */
  this.image_;
  /** AffineTransform to use when drawing image.  The image is drawn in coordinates
  * that are oriented like body coordinates, but are like screen coordinates in that
  * the origin is at top left of the DisplayShape bounding box, Y increases downwards,
  * and units are equal to a screen pixel.
  * The `imageAT` AffineTransform is applied to further modify the coordinate system
  * before the image is drawn using the command `context.drawImage(this.image_, 0, 0)`.
  * @type {!AffineTransform|undefined}
  * @private
  */
  this.imageAT_;
  /** Whether to clip the image with the shape of the MassObject.
  * @type {boolean|undefined}
  * @private
  */
  this.imageClip_;
  /** Function to draw an image, it is called after the massObject is filled, the border
  * is drawn and the {@link #image} is drawn.
  * The AffineTransform {@link #imageAT} is applied first,
  * and the image is clipped if {@link #imageClip} is set.
  * The current path is the outline of the massObject.
  * @type {?function(!CanvasRenderingContext2D):undefined|undefined}
  * @private
  */
  this.imageDraw_;
  /**
  * @type {number|undefined}
  * @private
  */
  this.zIndex_;
  /** Remember the last color drawn, to keep isDarkColor_ in sync with fillStyle.
  * @type {*}
  * @private
  */
  this.lastColor_ = this.getFillStyle();
  /**
  * @type {boolean}
  * @private
  */
  this.isDarkColor_ = DisplayShape.darkColor(this.lastColor_);
};
var DisplayShape = myphysicslab.lab.view.DisplayShape;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DisplayShape.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dragable_: '+this.dragable_
        +', fillStyle: "'+this.getFillStyle()+'"'
        +', strokeStyle: "'+this.getStrokeStyle()+'"'
        +', thickness: '+NF(this.getThickness())
        +', drawDragPoints: '+this.getDrawDragPoints()
        +', drawCenterOfMass: '+this.getDrawCenterOfMass()
        +', nameFont: "'+this.getNameFont()+'"'
        +', nameColor: "'+this.getNameColor()+'"'
        +', nameRotate: '+NF(this.getNameRotate())
        +', zIndex: '+this.getZIndex()
        +', proto: '+(this.proto_ != null ? this.proto_.toStringShort() : 'null')
        +'}';
  };

  /** @inheritDoc */
  DisplayShape.prototype.toStringShort = function() {
    return 'DisplayShape{massObject_: '+this.massObject_.toStringShort()+'}';
  };
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
  if (this.getImageClip()) {
    context.clip();
  }
  var fillStyle = this.getFillStyle();
  if (fillStyle) {
    context.fillStyle = fillStyle;
    context.fill();
  }
  var strokeStyle = this.getStrokeStyle();
  if (strokeStyle) {
    context.lineWidth = map.screenToSimScaleX(this.getThickness());
    var borderDash = this.getBorderDash();
    if (borderDash.length > 0 && goog.isFunction(context.setLineDash)) {
      // convert the borderDash to be in sim coords
      var ld = goog.array.map(borderDash, function(n) {
          return map.screenToSimScaleX(n);
          });
      context.setLineDash(ld);
    }
    context.strokeStyle = strokeStyle;
    context.stroke();
    context.setLineDash([]);
  }
  var image = this.getImage();
  var imageDraw = this.getImageDraw();
  if (image != null || imageDraw != null) {
    // Set origin to be top left corner of massObject bounding box.
    context.translate(this.massObject_.getLeftBody(), this.massObject_.getTopBody());
    // undo the 'y increases up' convention of sim coordinates
    context.scale(sim_to_screen_units, -sim_to_screen_units);
    this.getImageAT().applyTransform(context);
    if (image != null) {
      context.drawImage(image, 0, 0);
    }
    if (imageDraw != null) {
      imageDraw(context);
    }
  }
  // Draw adornments for moveable objects (mass less than infinity).
  if (this.massObject_.getMass() != UtilityCore.POSITIVE_INFINITY) {
    body_to_screen.setTransform(context);
    // detect when fillStyle changes, to update isDarkColor_
    if (this.lastColor_ !== fillStyle) {
      this.lastColor_ = fillStyle;
      this.isDarkColor_ = DisplayShape.darkColor(fillStyle);
    }
    var pixel = map.screenToSimScaleX(1);
    context.lineWidth = pixel; // one pixel wide stroke.
    if (this.getDrawCenterOfMass()) {
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
    if (this.getDrawDragPoints()) {
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
  if (this.getNameFont()) {
    // draw name of massObject
    var cen = this.massObject_.getCentroidBody();
    var at = body_to_screen.translate(cen);
    var nameRotate = this.getNameRotate();
    if (nameRotate) {
      at = at.rotate(nameRotate);
    }
    at = at.scale(sim_to_screen_units, -sim_to_screen_units);
    at.setTransform(context);
    context.fillStyle = this.getNameColor();
    context.font = this.getNameFont();
    context.textAlign = 'center';
    var tx = this.massObject_.getName(/*localized=*/true);
    // find height of text from width of 'M', because is a roughly square letter.
    var ht = context.measureText('M').width;
    context.fillText(tx, 0, ht/2);
  }
  context.restore();
};


/** Line dash array used when drawing the border. Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
* @return {!Array<number>}
*/
DisplayShape.prototype.getBorderDash = function() {
  if (this.borderDash_ !== undefined) {
    return this.borderDash_;
  } else if (this.proto_ != null) {
    return this.proto_.getBorderDash();
  } else {
    return [ ];
  }
};

/** Whether to draw the location of the center of mass; it is drawn as two small
* crossed lines.
* @return {boolean}
*/
DisplayShape.prototype.getDrawCenterOfMass = function() {
  if (this.drawCenterOfMass_ !== undefined) {
    return this.drawCenterOfMass_;
  } else if (this.proto_ != null) {
    return this.proto_.getDrawCenterOfMass();
  } else {
    return false;
  }
};

/** Whether to draw the 'drag points' on the object; these are the places that
* a spring can be attached to for dragging the object.
* @return {boolean}
*/
DisplayShape.prototype.getDrawDragPoints = function() {
  if (this.drawDragPoints_ !== undefined) {
    return this.drawDragPoints_;
  } else if (this.proto_ != null) {
    return this.proto_.getDrawDragPoints();
  } else {
    return false;
  }
};

/** The color or gradient used when drawing (filling) the massObject.
* It can be a CSS3 color value (possibly including transparency) or a ColorGradient.
* Set this to the empty string to not fill the massObject.
* @return {string|!CanvasGradient}
*/
DisplayShape.prototype.getFillStyle = function() {
  if (this.fillStyle_ !== undefined) {
    return this.fillStyle_;
  } else if (this.proto_ != null) {
    return this.proto_.getFillStyle();
  } else {
    return 'lightGray';
  }
};

/** Image to draw, after the massObject is filled and border is drawn. The
* AffineTransform {@link #imageAT} is applied first, and the image is clipped if
* {@link #imageClip} is set. This disables the name being drawn.
* @return {?HTMLImageElement}
*/
DisplayShape.prototype.getImage = function() {
  if (this.image_ !== undefined) {
    return this.image_;
  } else if (this.proto_ != null) {
    return this.proto_.getImage();
  } else {
    return null;
  }
};

/** AffineTransform to use when drawing image.  The image is drawn in coordinates
* that are oriented like body coordinates, but are like screen coordinates in that
* the origin is at top left of the DisplayShape bounding box, Y increases downwards,
* and units are equal to a screen pixel.
* The `imageAT` AffineTransform is applied to further modify the coordinate system
* before the image is drawn using the command `context.drawImage(this.image_, 0, 0)`.
* @return {!myphysicslab.lab.util.AffineTransform}
*/
DisplayShape.prototype.getImageAT = function() {
  if (this.imageAT_ !== undefined) {
    return this.imageAT_;
  } else if (this.proto_ != null) {
    return this.proto_.getImageAT();
  } else {
    return AffineTransform.IDENTITY;
  }
};

/** Whether to clip the image with the shape of the MassObject.
* @return {boolean}
*/
DisplayShape.prototype.getImageClip = function() {
  if (this.imageClip_ !== undefined) {
    return this.imageClip_;
  } else if (this.proto_ != null) {
    return this.proto_.getImageClip();
  } else {
    return false;
  }
};

/** Function to draw an image, it is called after the massObject is filled, the border
* is drawn and the {@link #image} is drawn.
* The AffineTransform {@link #imageAT} is applied first,
* and the image is clipped if {@link #imageClip} is set.
* The current path is the outline of the massObject.
* @return {?function(!CanvasRenderingContext2D):undefined}
*/
DisplayShape.prototype.getImageDraw = function() {
  if (this.imageDraw_ !== undefined) {
    return this.imageDraw_;
  } else if (this.proto_ != null) {
    return this.proto_.getImageDraw();
  } else {
    return null;
  }
};

/** @inheritDoc */
DisplayShape.prototype.getMassObjects = function() {
  return [ this.massObject_ ];
};

/** Color for drawing name of the object; a CSS3 color value.
* @return {string}
*/
DisplayShape.prototype.getNameColor = function() {
  if (this.nameColor_ !== undefined) {
    return this.nameColor_;
  } else if (this.proto_ != null) {
    return this.proto_.getNameColor();
  } else {
    return 'black';
  }
};

/** Font for drawing name of the object, or the empty string to not draw the name.
* It should be a CSS3 font value such as '16pt sans-serif'.
* @return {string}
*/
DisplayShape.prototype.getNameFont = function() {
  if (this.nameFont_ !== undefined) {
    return this.nameFont_;
  } else if (this.proto_ != null) {
    return this.proto_.getNameFont();
  } else {
    return '';
  }
};

/** Angle of rotation for drawing name, in radians.  Rotation is relative to the
* position in body coordinates.
* @return {number}
*/
DisplayShape.prototype.getNameRotate = function() {
  if (this.nameRotate_ !== undefined) {
    return this.nameRotate_;
  } else if (this.proto_ != null) {
    return this.proto_.getNameRotate();
  } else {
    return 0;
  }
};

/** @inheritDoc */
DisplayShape.prototype.getPosition = function() {
  return this.massObject_.getPosition();
};

/** @inheritDoc */
DisplayShape.prototype.getSimObjects = function() {
  return [ this.massObject_ ];
};

/** The color to use for drawing the border, or the empty string to not draw the
* border. It should be a CSS3 color value (possibly including transparency).
* The thickness of the border is set by {@link #getThickness}.
* @return {string}
*/
DisplayShape.prototype.getStrokeStyle = function() {
  if (this.strokeStyle_ !== undefined) {
    return this.strokeStyle_;
  } else if (this.proto_ != null) {
    return this.proto_.getStrokeStyle();
  } else {
    return '';
  }
};

/** Thickness of border drawn, see {@link #getStrokeStyle}, in screen coordinates.
* A value of 1 corresponds to a single pixel thickness.
* @return {number}
*/
DisplayShape.prototype.getThickness = function() {
  if (this.thickness_ !== undefined) {
    return this.thickness_;
  } else if (this.proto_ != null) {
    return this.proto_.getThickness();
  } else {
    return 1;
  }
};

/** @inheritDoc */
DisplayShape.prototype.getZIndex = function() {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 0;
  }
};

/** @inheritDoc */
DisplayShape.prototype.isDragable = function() {
  return this.dragable_;
};

/** Line dash array used when drawing the border. Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
* @param {!Array<number>} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setBorderDash = function(value) {
  this.borderDash_ = value;
  return this;
};

/** @inheritDoc */
DisplayShape.prototype.setDragable = function(dragable) {
  this.dragable_ = dragable;
};

/** Whether to draw the location of the center of mass; it is drawn as two small
* crossed lines.
* @param {boolean} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setDrawCenterOfMass = function(value) {
  this.drawCenterOfMass_ = value;
  return this;
};

/** Whether to draw the 'drag points' on the object; these are the places that
* a spring can be attached to for dragging the object.
* @param {boolean} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setDrawDragPoints = function(value) {
  this.drawDragPoints_ = value;
  return this;
};

/** The color or gradient used when drawing (filling) the massObject.
* It can be a CSS3 color value (possibly including transparency) or a ColorGradient.
* Set this to the empty string to not fill the massObject.
* @param {string|!CanvasGradient} value
* @return {!DisplayShape}
*/
DisplayShape.prototype.setFillStyle = function(value) {
  this.fillStyle_ = value;
  return this;
};

/** Image to draw, after the massObject is filled and border is drawn. The
* AffineTransform {@link #imageAT} is applied first, and the image is clipped if
* {@link #imageClip} is set. This disables the name being drawn.
* @param {?HTMLImageElement} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setImage = function(value) {
  this.image_ = value;
  return this;
};

/** AffineTransform to use when drawing image.  The image is drawn in coordinates
* that are oriented like body coordinates, but are like screen coordinates in that
* the origin is at top left of the DisplayShape bounding box, Y increases downwards,
* and units are equal to a screen pixel.
* The `imageAT` AffineTransform is applied to further modify the coordinate system
* before the image is drawn using the command `context.drawImage(this.image_, 0, 0)`.
* @param {!myphysicslab.lab.util.AffineTransform} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setImageAT = function(value) {
  this.imageAT_ = value;
  return this;
};

/** Whether to clip the image with the shape of the MassObject.
* @param {boolean} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setImageClip = function(value) {
  this.imageClip_ = value;
  return this;
};

/** Function to draw an image, it is called after the massObject is filled, the border
* is drawn and the {@link #image} is drawn.
* The AffineTransform {@link #imageAT} is applied first,
* and the image is clipped if {@link #imageClip} is set.
* The current path is the outline of the massObject.
* @param {?function(!CanvasRenderingContext2D):undefined} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setImageDraw = function(value) {
  this.imageDraw_ = value;
  return this;
};

/** Color for drawing name of the object; a CSS3 color value.
* @param {string} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setNameColor = function(value) {
  this.nameColor_ = value;
  return this;
};

/** Font for drawing name of the object, or the empty string to not draw the name.
* It should be a CSS3 font value such as '16pt sans-serif'.
* @param {string} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setNameFont = function(value) {
  this.nameFont_ = value;
  return this;
};

/** Angle of rotation for drawing name, in radians.  Rotation is relative to the
* position in body coordinates.
* @param {number} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setNameRotate = function(value) {
  this.nameRotate_ = value;
  return this;
};

/** @inheritDoc */
DisplayShape.prototype.setPosition = function(position) {
  this.massObject_.setPosition(position);
};

/** The color to use for drawing the border, or the empty string to not draw the
* border. It should be a CSS3 color value (possibly including transparency).
* The thickness of the border is set by {@link #getThickness}.
* @param {string} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setStrokeStyle = function(value) {
  this.strokeStyle_ = value;
  return this;
};

/** Thickness of border drawn, see {@link #getStrokeStyle}, in screen coordinates.
* A value of 1 corresponds to a single pixel thickness.
* @param {number} value
* @return {!DisplayShape} this object for chaining setters
*/
DisplayShape.prototype.setThickness = function(value) {
  this.thickness_ = value;
  return this;
};

/** @inheritDoc */
DisplayShape.prototype.setZIndex = function(zIndex) {
  this.zIndex_ = zIndex;
};

});  // goog.scope
