// Copyright 2020 Erik Neumann.  All Rights Reserved.
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

import { AffineTransform } from '../../lab/util/AffineTransform.js';
import { CoordMap } from "../../lab/view/CoordMap.js"
import { DisplayObject } from '../../lab/view/DisplayObject.js';
import { MagnetWheel } from './MagnetWheel.js';
import { MassObject } from "../../lab/model/MassObject.js"
import { SimObject } from '../../lab/model/SimObject.js';
import { Util } from '../../lab/util/Util.js';
import { Vector, GenericVector } from '../../lab/util/Vector.js';

/** DisplayObject that represents a {@link MagnetWheel}.
*/
export class DisplayMagnetWheel implements DisplayObject {
  private wheel_: MagnetWheel;
  private zIndex_: number|undefined;
  private changed_: boolean = true;

/**
* @param wheel the MagnetWheel to display
*/
constructor(wheel: MagnetWheel) {
  this.wheel_ = wheel;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', zIndex: '+this.getZIndex()
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplayMagnetWheel{wheel_: '+
      this.wheel_.toStringShort()+'}';
};

/** @inheritDoc */
contains(p_world: Vector): boolean {
  const p_body = this.wheel_.worldToBody(p_world);
  return this.wheel_.getBoundsBody().contains(p_body);
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  const r = this.wheel_.getRadius();
  context.save();
  const sim_to_screen = map.getAffineTransform(); // sim to screen transform
  // sim_to_screen_units = scaling factor to go from sim units to screen units (pixels)
  const sim_to_screen_units = 1/map.getScaleX();

  // draw in body coords (rotated by angle of wheel).
  const body_to_screen =
      sim_to_screen.concatenate(this.wheel_.bodyToWorldTransform());
  body_to_screen.setTransform(context);

  // draw the circle representing the wheel
  context.beginPath();
  if (typeof context.ellipse === 'function') {
    context.moveTo(r, 0);
    // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
    context.ellipse(0, 0, r, r, 0, 0, 2*Math.PI, false);
  } else {
    // NOTE: until context.ellipse() is supported by browsers, we only
    // draw a circle here, the smallest that will fit.
    context.arc(0, 0, r, 0, 2*Math.PI, false);
    context.closePath();
  }
  context.fillStyle = 'lightGray';
  context.fill();
  context.lineWidth = map.screenToSimScaleX(1);
  context.strokeStyle = 'red';
  context.stroke();

  // draw each magnet
  const mr = 0.1*r;  // radius of the little magnet circle
  const magnets = this.wheel_.getMagnets();
  for (let i=0, n=magnets.length; i<n; i++) {
    const c = magnets[i]; // center of the magnet
    const x = c.getX();
    const y = c.getY();
    //console.log('magnet '+i+' '+c.toString());
    context.beginPath();
    if (typeof context.ellipse === 'function') {
      //context.moveTo(w, 0);
      // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
      context.ellipse(x, y, mr, mr, 0, 0, 2*Math.PI, false);
    } else {
      // NOTE: until context.ellipse() is supported by browsers, we only
      // draw a circle here, the smallest that will fit.
      context.arc(x, y, mr, 0, 2*Math.PI, false);
      context.closePath();
    }
    context.fillStyle = 'darkGray';
    context.fill();
  }

  // draw the fixed magnet
  sim_to_screen.setTransform(context);  // draw in world coords
  const fm = this.wheel_.getFixedMagnet();
  const fmr = 0.1*r;  // radius of the fixed magnet circle
  context.beginPath();
  if (typeof context.ellipse === 'function') {
    context.moveTo(fmr + fm.getX(), fm.getY());
    // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
    context.ellipse(fm.getX(), fm.getY(), fmr, fmr, 0, 0, 2*Math.PI, false);
  } else {
    // NOTE: until context.ellipse() is supported by browsers, we only
    // draw a circle here, the smallest that will fit.
    context.arc(fm.getX(), fm.getY(), fmr, 0, 2*Math.PI, false);
    context.closePath();
  }
  context.lineWidth = map.screenToSimScaleX(1);
  context.strokeStyle = 'black';
  context.stroke();
  context.restore();
};

/** @inheritDoc */
getChanged(): boolean {
  if (this.wheel_.getChanged() || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [ this.wheel_ ];
};

/** @inheritDoc */
getPosition(): Vector {
  // return midpoint of the line
  return this.wheel_.getPosition();
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return [ this.wheel_ ];
};

/** @inheritDoc */
getZIndex(): number {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else {
    return 0;
  }
};

/** @inheritDoc */
isDragable(): boolean {
  return false;
};

/** @inheritDoc */
setDragable(_dragable: boolean): void {
  // does nothing
};

/** @inheritDoc */
setPosition(_position: GenericVector): void {
  //throw 'unsupported operation';
};

/** @inheritDoc */
setZIndex(zIndex: number): void {
  this.zIndex_ = zIndex;
  this.changed_ = true;
};

} // end class

Util.defineGlobal('sims$misc$DisplayMagnetWheel', DisplayMagnetWheel);
