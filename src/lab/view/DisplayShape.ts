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

import { AffineTransform } from "../util/AffineTransform.js"
import { CoordMap } from "./CoordMap.js"
import { DisplayObject } from "./DisplayObject.js"
import { DoubleRect } from "../util/DoubleRect.js"
import { MassObject } from "../model/MassObject.js"
import { PointMass } from "../model/PointMass.js"
import { SimObject } from "../model/SimObject.js"
import { Util } from "../util/Util.js"
import { Vector, GenericVector } from "../util/Vector.js"

/** Displays a {@link MassObject}
with specified style such as color, border, etc.

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
{@link sims/engine2D/RigidBodyObserver.RigidBodyObserver}.
```js
simList.add(polygon1); // RigidBodyObserver creates a DisplayShape here
var dispPoly1 = displayList.findShape(polygon1);
dispPoly1.setFillStyle('red');
```

#### 2. Modify the prototype

DisplayShape allows specifying a **prototype** DisplayShape. When a display
property is `undefined`, then the property is fetched from the prototype. If it is also
`undefined` on the prototype then a default value is used.

Keep in mind that **all** objects with a given prototype will be affected by any
changes made to the prototype.

Here is an example where we make a prototype that causes the names to be drawn.
```js
var protoShape = new DisplayShape().setNameFont('10pt sans-serif');
var shape1 = new DisplayShape(mass1, protoShape);
```

See {@link sims/engine2D/RigidBodyObserver.RigidBodyObserver} which sets up several
prototype objects.

### Drawing Name of MassObject

The name of the MassObject is drawn when the {@link DisplayShape.setNameFont} property
has a valid font specifier string. There are also {@link DisplayShape.setNameColor} and
{@link DisplayShape.setNameRotate} properties that affect how the name is drawn.
Example code:
```js
myPolygon.setNameFont('12pt sans-serif').setNameColor('gray');
```

Here is a script that can be executed in Terminal to show names on all DisplayShapes:
```js
displayList.toArray().forEach(d => {
  if (d instanceof DisplayShape) {
    d.setNameFont('12pt sans-serif');
  }
})
```

Or, if the objects of interest have the same prototype, then you can just change
the prototype object.

### Drawing an Image

You can draw an image in the DisplayShape by getting an HTMLImageElement that is on
the HTML page and using {@link DisplayShape.setImage}. For example in the HTML
page you would have
```html
<img id="myImage" src="../../images/myImage.png" width="32" height="32">
```

Then in the JavaScript application after making the DisplayShape, you can assign
the image to the DisplayShape:
```js
myPolygon.setImage(document.getElementById('myImage'));
```

You can further translate, scale, and rotate the image within in DisplayShape by
making an AffineTransform and using {@link DisplayShape.setImageAT}.  You can clip the
image to the boundary of the MassObject by using {@link DisplayShape.setImageClip}.

You can assign a function to {@link DisplayShape.setImageDraw} and do the drawing within
that function. The same coordinate system modifications are done in that case. The
current path is the shape of the MassObject, so you can for example fill with a pattern.

Both `setImage` and `setImageDraw` can be used together. The `image` is drawn first,
then the `imageDraw` function is called.

The application {@link sims/engine2D/DoublePendulum2App.DoublePendulum2App} has
examples of

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
is handled by a {@link CoordMap} which can be set for the
{@link lab/view/SimView.SimView}.

+ ***body coordinates*** rotates and translates along with a MassObject. Like
simulation coordinates it uses the *Y increases up* convention, and has the same unit
size as simulation coordinates.
See [Body Coordinates](../Engine2D.html#bodycoordinates),
and {@link MassObject}.

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

The {@link DisplayShape.setImageAT} AffineTransform can then be specified to cause the
image to be appear with any combination of rotation, scaling, and positioning. See the
diagram below.

There are also differences in how angles are specified in the different coordinate
systems; see 'About Coordinates and Angles' in
{@link lab/engine2D/CircularEdge.CircularEdge} for more information.

<img src="../DisplayPolygon_Image.png">

The above examples of using an {@link AffineTransform}
on an image were generated by altering the application
{@link sims/engine2D/DoublePendulum2App.DoublePendulum2App}.

**TO DO** provide an AffineTransform for drawing the name, instead of nameRotate.

*/
export class DisplayShape implements DisplayObject {
  /** The MassObject to display. */
  private massObject_: MassObject;
  private proto_: null|DisplayShape;
  /** Whether the MassObject is dragable. */
  private dragable_: boolean;
  /** The color or gradient used when drawing (filling) the massObject.
  * It can be a CSS3 color value (possibly including transparency) or a ColorGradient.
  * Set this to the empty string to not fill the massObject.
  */
  private fillStyle_: string|CanvasGradient|undefined;
  /** The color to use for drawing the border, or the empty string to not draw the
  * border. It should be a CSS3 color value (possibly including transparency).
  * The thickness of the border is set by {@link DisplayShape.thickness_}.
  */
  private strokeStyle_: string|undefined;
  /** Thickness of border drawn, see {@link DisplayShape.strokeStyle_}, in screen
  * coordinates. A value of 1 corresponds to a single pixel thickness.
  */
  private thickness_: number|undefined;
  /** Line dash array used when drawing the border. Corresponds to lengths of dashes
  * and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
  * length 3 with spaces of length 5. Empty array indicates solid line.
  */
  private borderDash_: number[];
  /** Whether to draw the 'drag points' on the object; these are the places that
  * a spring can be attached to for dragging the object.
  */
  private drawDragPoints_: boolean|undefined;
  /** Whether to draw the location of the center of mass; it is drawn as two small
  * crossed lines.
  */
  private drawCenterOfMass_: boolean|undefined;
  /** Font for drawing name of the object, or the empty string to not draw the name.
  * It should be a CSS3 font value such as '16pt sans-serif'.
  */
  private nameFont_: string|undefined;
  /** Color for drawing name of the object; a CSS3 color value.
  */
  private nameColor_: string|undefined;
  /** Angle of rotation for drawing name, in radians.  Rotation is relative to the
  * position in body coordinates.
  */
  private nameRotate_: number|undefined;
  /** Image to draw, after the massObject is filled and border is drawn. The
  * AffineTransform {@link DisplayShape.imageAT_} is applied first, and the image is
  * clipped if {@link DisplayShape.imageClip_} is set. This disables the name being
  * drawn.
  */
  private image_: null|HTMLImageElement|undefined;
  /** AffineTransform to use when drawing image.  The image is drawn in coordinates
  * that are oriented like body coordinates, but are like screen coordinates in that
  * the origin is at top left of the DisplayShape bounding box, Y increases downwards,
  * and units are equal to a screen pixel.
  * The `imageAT` AffineTransform is applied to further modify the coordinate system
  * before the image is drawn using the command `context.drawImage(this.image_, 0, 0)`.
  */
  private imageAT_: AffineTransform|undefined;
  /** Whether to clip the image with the shape of the MassObject.
  */
  private imageClip_: boolean|undefined;
  /** Function to draw an image, it is called after the massObject is filled, the border
  * is drawn and the {@link DisplayShape.image_} is drawn.
  * The AffineTransform {@link DisplayShape.imageAT_} is applied first,
  * and the image is clipped if {@link DisplayShape.imageClip_} is set.
  * The current path is the outline of the massObject.
  */
  private imageDraw_?: ((crc: CanvasRenderingContext2D)=>void)|null;
  private zIndex_?: number;
  /** Remember the last color drawn, to keep isDarkColor_ in sync with fillStyle.
  */
  private lastColor_: string|CanvasGradient;
  private isDarkColor_: boolean = false;
  private changed_: boolean = true;

/**
* @param massObject the MassObject to display
* @param proto the prototype DisplayShape to inherit properties from
*/
constructor(massObject?: null|MassObject, proto?: null|DisplayShape) {
  this.massObject_ = massObject ?? new PointMass('proto');
  this.proto_ = proto ?? null;
  this.dragable_ = isFinite(this.massObject_.getMass())
      && this.massObject_.getDragPoints().length > 0;
  this.lastColor_ = this.getFillStyle();
  //this.isDarkColor_ = DisplayShape.darkColor(this.lastColor_);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', dragable_: '+this.dragable_
      +', fillStyle: "'+this.getFillStyle()+'"'
      +', strokeStyle: "'+this.getStrokeStyle()+'"'
      +', thickness: '+Util.NF(this.getThickness())
      +', drawDragPoints: '+this.getDrawDragPoints()
      +', drawCenterOfMass: '+this.getDrawCenterOfMass()
      +', nameFont: "'+this.getNameFont()+'"'
      +', nameColor: "'+this.getNameColor()+'"'
      +', nameRotate: '+Util.NF(this.getNameRotate())
      +', zIndex: '+this.getZIndex()
      +', proto: '+(this.proto_ != null ? this.proto_.toStringShort() : 'null')
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplayShape{massObject_: '+this.massObject_.toStringShort()+'}';
};

/** @inheritDoc */
contains(p_world: Vector): boolean {
  const p_body = this.massObject_.worldToBody(p_world);
  return this.massObject_.getBoundsBody().contains(p_body);
};

/** Whether the given color is a dark color. Used to decide whether to draw over this
* color with black or white.  Returns `false` for empty string.
* @param color a CSS color specification, or empty string, or gradient or pattern
* @return whether the color is dark
const gcolor = goog.require('goog.color');
static darkColor(color: any): boolean {
  if (typeof color !== 'string')
    return false;
  if (color == '')
    return false;
  // gcolor.parse() does not accept 'rgba' type of colors.  Therefore
  // transform rgba to rgb.
  // Matches things like: rgba(192, 255, 192, 0.5) or rgba(192, 255, 192, 1)
  const m = color.match(/^rgba\((.*),\s*\d*\.?\d+\)/);
  if (m != null) {
    color = 'rgb('+m[1]+')';
  } else {
    // Match a 4 digit hexadecimal color with alpha like #0ff8
    const m = color.match(/^(#[0-9a-hA-H]{3})[0-9a-hA-H]$/);
    if (m != null) {
      color = m[1];
    } else {
      // Match an 8 digit hexadecimal color with alpha like #00ffff88
      const m = color.match(/^(#[0-9a-hA-H]{6})[0-9a-hA-H]{2}$/);
      if (m != null) {
        color = m[1];
      }
    }
  }
  const c = gcolor.parse(color);
  // HSV color representation. An array containing three elements [h, s, v]:
  // h (hue) must be an integer in [0, 360], cyclic.
  // s (saturation) must be a number in [0, 1].
  // v (value/brightness) must be an integer in [0, 255].
  const hsv = gcolor.hexToHsv(c.hex);
  // decide if its a dark color by looking at the saturation and value (brightness)
  // low value  OR  (high saturation AND close to blue)
  return hsv[2] < 167 || hsv[1] > 0.57 && Math.abs(hsv[0] - 240) < 40;
};
*/

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  context.save();
  const sim_to_screen = map.getAffineTransform(); // sim to screen transform
  // sim_to_screen_units = scaling factor to go from sim units to screen units (pixels)
  const sim_to_screen_units = 1/map.getScaleX();
  const body_to_screen =
      sim_to_screen.concatenate(this.massObject_.bodyToWorldTransform());
  body_to_screen.setTransform(context);
  this.massObject_.createCanvasPath(context);
  if (this.getImageClip()) {
    context.clip();
  }
  const fillStyle = this.getFillStyle();
  if (fillStyle) {
    context.fillStyle = fillStyle;
    context.fill();
  }
  const strokeStyle = this.getStrokeStyle();
  if (strokeStyle) {
    context.lineWidth = map.screenToSimScaleX(this.getThickness());
    const borderDash = this.getBorderDash();
    if (borderDash.length > 0 && typeof context.setLineDash === 'function') {
      // convert the borderDash to be in sim coords
      const ld = borderDash.map(n => map.screenToSimScaleX(n));
      context.setLineDash(ld);
    }
    context.strokeStyle = strokeStyle;
    context.stroke();
    context.setLineDash([]);
  }
  const image = this.getImage();
  const imageDraw = this.getImageDraw();
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
  if (this.massObject_.getMass() != Infinity) {
    body_to_screen.setTransform(context);
    // detect when fillStyle changes, to update isDarkColor_
    if (this.lastColor_ !== fillStyle) {
      this.lastColor_ = fillStyle;
      //this.isDarkColor_ = DisplayShape.darkColor(fillStyle);
    }
    const pixel = map.screenToSimScaleX(1);
    context.lineWidth = pixel; // one pixel wide stroke.
    if (this.getDrawCenterOfMass()) {
      const cm_body = this.massObject_.getCenterOfMass();
      // draw a cross at the center of mass
      if (this.isDarkColor_) {
        context.strokeStyle = '#ccc'; //lightGray;
      } else {
        context.strokeStyle = 'black';
      }
      let len = 0.2 * Math.min(this.massObject_.getWidth(),
          this.massObject_.getHeight());
      const max_len = 8*pixel;
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
      let d = 4*pixel;
      const sz = 0.15 * Math.min(this.massObject_.getWidth(),
          this.massObject_.getHeight());
      if (sz < d) {
        d = sz;
      }
      this.massObject_.getDragPoints().forEach(dpt => {
        if (this.isDarkColor_) {
          context.fillStyle = '#ccc'; //lightGray;
        } else {
          context.fillStyle = 'gray';
        }
        context.beginPath();
        context.arc(dpt.getX(), dpt.getY(), d, 0, 2*Math.PI, /*clockwise=*/false);
        context.closePath();
        context.fill();
      });
    }
  }
  if (this.getNameFont()) {
    // draw name of massObject
    const cen = this.massObject_.getCentroidBody();
    let at = body_to_screen.translate(cen);
    const nameRotate = this.getNameRotate();
    if (nameRotate) {
      at = at.rotate(nameRotate);
    }
    at = at.scale(sim_to_screen_units, -sim_to_screen_units);
    at.setTransform(context);
    context.fillStyle = this.getNameColor();
    context.font = this.getNameFont();
    context.textAlign = 'center';
    const tx = this.massObject_.getName(/*localized=*/true);
    // find height of text from width of 'M', because is a roughly square letter.
    const ht = context.measureText('M').width;
    context.fillText(tx, 0, ht/2);
  }
  context.restore();
};

/** Line dash array used when drawing the border. Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
*/
getBorderDash(): number[] {
  if (this.borderDash_ !== undefined) {
    return this.borderDash_;
  } else if (this.proto_ != null) {
    return this.proto_.getBorderDash();
  } else {
    return [ ];
  }
};

/** @inheritDoc */
getChanged(): boolean {
  if (this.massObject_.getChanged() || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Whether to draw the location of the center of mass; it is drawn as two small
* crossed lines.
*/
getDrawCenterOfMass(): boolean {
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
*/
getDrawDragPoints(): boolean {
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
*/
getFillStyle(): string|CanvasGradient {
  if (this.fillStyle_ !== undefined) {
    return this.fillStyle_;
  } else if (this.proto_ != null) {
    return this.proto_.getFillStyle();
  } else {
    return 'lightGray';
  }
};

/** Image to draw, after the massObject is filled and border is drawn. The
* AffineTransform {@link DisplayShape.imageAT_} is applied first, and the image is
* clipped if {@link DisplayShape.imageClip_} is set. This disables the name being drawn.
*/
getImage(): null|HTMLImageElement {
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
*/
getImageAT(): AffineTransform {
  if (this.imageAT_ !== undefined) {
    return this.imageAT_;
  } else if (this.proto_ != null) {
    return this.proto_.getImageAT();
  } else {
    return AffineTransform.IDENTITY;
  }
};

/** Whether to clip the image with the shape of the MassObject.
*/
getImageClip(): boolean {
  if (this.imageClip_ !== undefined) {
    return this.imageClip_;
  } else if (this.proto_ != null) {
    return this.proto_.getImageClip();
  } else {
    return false;
  }
};

/** Function to draw an image, it is called after the massObject is filled, the border
* is drawn and the {@link DisplayShape.image_} is drawn.
* The AffineTransform {@link DisplayShape.imageAT_} is applied first,
* and the image is clipped if {@link DisplayShape.imageClip_} is set.
* The current path is the outline of the massObject.
*/
getImageDraw(): null|((crc: CanvasRenderingContext2D)=>void) {
  if (this.imageDraw_ !== undefined) {
    return this.imageDraw_;
  } else if (this.proto_ != null) {
    return this.proto_.getImageDraw();
  } else {
    return null;
  }
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [ this.massObject_ ];
};

/** Color for drawing name of the object; a CSS3 color value.
*/
getNameColor(): string {
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
*/
getNameFont(): string {
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
*/
getNameRotate(): number {
  if (this.nameRotate_ !== undefined) {
    return this.nameRotate_;
  } else if (this.proto_ != null) {
    return this.proto_.getNameRotate();
  } else {
    return 0;
  }
};

/** @inheritDoc */
getPosition(): Vector {
  return this.massObject_.getPosition();
};

/** Set the prototype DisplayShape for this object. Display parameters are inherited
* from the prototype unless the parameter is explicitly set for this object.
*/
getPrototype(): null|DisplayShape {
  return this.proto_;
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return [ this.massObject_ ];
};

/** The color to use for drawing the border, or the empty string to not draw the
* border. It should be a CSS3 color value (possibly including transparency).
* The thickness of the border is set by {@link DisplayShape.getThickness}.
*/
getStrokeStyle(): string {
  if (this.strokeStyle_ !== undefined) {
    return this.strokeStyle_;
  } else if (this.proto_ != null) {
    return this.proto_.getStrokeStyle();
  } else {
    return '';
  }
};

/** Thickness of border drawn, see {@link DisplayShape.getStrokeStyle},
* in screen coordinates.
* A value of 1 corresponds to a single pixel thickness.
*/
getThickness(): number {
  if (this.thickness_ !== undefined) {
    return this.thickness_;
  } else if (this.proto_ != null) {
    return this.proto_.getThickness();
  } else {
    return 1;
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
  return this.dragable_;
};

/** Line dash array used when drawing the border. Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
* @param value
*/
setBorderDash(value: number[]): void {
  this.borderDash_ = value;
  this.changed_ = true;
};

/** @inheritDoc */
setDragable(dragable: boolean): void {
  this.dragable_ = dragable;
};

/** Whether to draw the location of the center of mass; it is drawn as two small
* crossed lines.
* @param value
*/
setDrawCenterOfMass(value: boolean): void {
  this.drawCenterOfMass_ = value;
  this.changed_ = true;
};

/** Whether to draw the 'drag points' on the object; these are the places that
* a spring can be attached to for dragging the object.
* @param value
*/
setDrawDragPoints(value: boolean): void {
  this.drawDragPoints_ = value;
  this.changed_ = true;
};

/** The color or gradient used when drawing (filling) the massObject.
* It can be a CSS3 color value (possibly including transparency) or a ColorGradient.
* Set this to the empty string to not fill the massObject.
* @param value
*/
setFillStyle(value: string|CanvasGradient): void {
  this.fillStyle_ = value;
  this.changed_ = true;
};

/** Image to draw, after the massObject is filled and border is drawn. The
* AffineTransform {@link DisplayShape.imageAT_} is applied first, and the image is
* clipped if
* {@link DisplayShape.imageClip_} is set. This disables the name being drawn.
*/
setImage(value: null|HTMLImageElement): void {
  this.image_ = value;
  this.changed_ = true;
};

/** AffineTransform to use when drawing image.  The image is drawn in coordinates
* that are oriented like body coordinates, but are like screen coordinates in that
* the origin is at top left of the DisplayShape bounding box, Y increases downwards,
* and units are equal to a screen pixel.
* The `imageAT` AffineTransform is applied to further modify the coordinate system
* before the image is drawn using the command `context.drawImage(this.image_, 0, 0)`.
* @param value
*/
setImageAT(value: AffineTransform): void {
  this.imageAT_ = value;
  this.changed_ = true;
};

/** Whether to clip the image with the shape of the MassObject.
* @param value
*/
setImageClip(value: boolean): void {
  this.imageClip_ = value;
  this.changed_ = true;
};

/** Function to draw an image, it is called after the massObject is filled, the border
* is drawn and the {@link DisplayShape.image_} is drawn.
* The AffineTransform {@link DisplayShape.imageAT_} is applied first,
* and the image is clipped if {@link DisplayShape.imageClip_} is set.
* The current path is the outline of the massObject.
* @param value
*/
setImageDraw(value: ((crc: CanvasRenderingContext2D)=>void)|null): void {
  this.imageDraw_ = value;
  this.changed_ = true;
};

/** Color for drawing name of the object; a CSS3 color value.
* @param value
*/
setNameColor(value: string): void {
  this.nameColor_ = value;
  this.changed_ = true;
};

/** Font for drawing name of the object, or the empty string to not draw the name.
* It should be a CSS3 font value such as '16pt sans-serif'.
* @param value
*/
setNameFont(value: string): void {
  this.nameFont_ = value;
  this.changed_ = true;
};

/** Angle of rotation for drawing name, in radians.  Rotation is relative to the
* position in body coordinates.
* @param value
*/
setNameRotate(value: number): void {
  this.nameRotate_ = value;
  this.changed_ = true;
};

/** @inheritDoc */
setPosition(position: GenericVector): void {
  this.massObject_.setPosition(position);
  this.changed_ = true;
};

/** Set the prototype DisplayShape for this object. Display parameters are inherited
* from the prototype unless the parameter is explicitly set for this object.
* @param value
*/
setPrototype(value: null|DisplayShape): void {
  this.proto_ = value;
};

/** The color to use for drawing the border, or the empty string to not draw the
* border. It should be a CSS3 color value (possibly including transparency).
* The thickness of the border is set by {@link DisplayShape.getThickness}.
* @param value
*/
setStrokeStyle(value: string): void {
  this.strokeStyle_ = value;
  this.changed_ = true;
};

/** Thickness of border drawn, see {@link DisplayShape.getStrokeStyle},
* in screen coordinates.
* A value of 1 corresponds to a single pixel thickness.
* @param value
*/
setThickness(value: number): void {
  this.thickness_ = value;
  this.changed_ = true;
};

/** @inheritDoc */
setZIndex(zIndex?: number): void {
  this.zIndex_ = zIndex;
  this.changed_ = true;
};

}; // end DisplayShape class

Util.defineGlobal('lab$view$DisplayShape', DisplayShape);
