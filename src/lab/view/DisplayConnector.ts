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

import { Connector } from '../engine2D/RigidBody.js';
import { CoordMap } from "./CoordMap.js"
import { DisplayObject } from './DisplayObject.js';
import { SimObject } from '../model/SimObject.js';
import { Util } from '../util/Util.js';
import { Vector, GenericVector } from '../util/Vector.js';
import { MassObject } from "../model/MassObject.js"

/** Shows the location of a {@link Connector}
as a small colored circle. The {@link DisplayConnector.setRadius | radius} is specified
in screen coordinates, so the size of the circle stays the same regardless of the zoom
level on the {@link lab/view/SimView.SimView | SimView}.

The position is determined by the position of the Connector, so
{@link setPosition} has no effect, and the DisplayConnector is never
dragable.
*/
export class DisplayConnector implements DisplayObject {
  /* Connector is an interface, so we can't make a dummy placeholder object here,
  * as we do for other DisplayObjects.
  */
  private connector_: null|Connector;
  /** Color to draw the joint, a CSS3 color value. */
  private color_: string|undefined;
  /** Radius of circle to draw, in screen coordinates. */
  private radius_: number|undefined;
  private zIndex_: number|undefined;
  private proto_: null|DisplayConnector;
  private changed_: boolean = true;

/**
* @param connector the Connector to display
* @param proto the prototype DisplayConnector to inherit properties from
*/
constructor(connector?: null|Connector, proto?: null|DisplayConnector) {
  this.connector_ = connector ?? null;
  this.proto_ = proto ?? null;
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', radius: '+Util.NF5(this.getRadius())
      +', color: "'+this.getColor()+'"'
      +', zIndex: '+this.getZIndex()
      +', proto: '+(this.proto_ != null ? this.proto_.toStringShort() : 'null')
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'DisplayConnector{connector_: '+
      (this.connector_ != null ? this.connector_.toStringShort() : 'null')+'}';
};

/** @inheritDoc */
contains(_p_world: Vector): boolean {
  return false;
};

/** @inheritDoc */
draw(context: CanvasRenderingContext2D, map: CoordMap): void {
  if (this.connector_ == null) {
    return;
  }
  // Use CoordMap.simToScreenRect to calc screen coords of the shape.
  context.save();
  context.fillStyle = this.getColor();
  const p = map.simToScreen(this.getPosition());
  context.translate(p.getX(), p.getY());
  context.beginPath();
  context.arc(0, 0, this.getRadius(), 0, 2*Math.PI, false);
  context.closePath();
  context.fill();
  context.restore();
};

/** Color to draw the joint, a CSS3 color value.
*/
getColor(): string {
  if (this.color_ !== undefined) {
    return this.color_;
  } else if (this.proto_ != null) {
    return this.proto_.getColor();
  } else {
    return 'blue';
  }
};

/** @inheritDoc */
getChanged(): boolean {
  const chg = this.connector_ === null ? false : this.connector_.getChanged();
  if (chg || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** @inheritDoc */
getMassObjects(): MassObject[] {
  return [];
};

/** @inheritDoc */
getPosition(): Vector {
  return this.connector_ === null ? Vector.ORIGIN : this.connector_.getPosition1();
};

/** Radius of circle to draw, in screen coordinates.
*/
getRadius(): number {
  if (this.radius_ !== undefined) {
    return this.radius_;
  } else if (this.proto_ != null) {
    return this.proto_.getRadius();
  } else {
    return 2;
  }
};

/** @inheritDoc */
getSimObjects(): SimObject[] {
  return this.connector_ === null ? [] : [ this.connector_ ];
};

/** @inheritDoc */
getZIndex(): number {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 10;
  }
};

/** @inheritDoc */
isDragable(): boolean {
  return false;
};

/** Color used when drawing this Connector, a CSS3 color value.
* @param color
* @return this object for chaining setters
*/
setColor(color: string|undefined): DisplayConnector {
  this.color_ = color;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setDragable(_dragable: boolean): void {
  // do nothing, connectors cannot be moved
};

/** @inheritDoc */
setPosition(_position: GenericVector): void {
  // do nothing, connectors cannot be moved
};

/** Radius of circle to draw, in screen coordinates.
* @param value
* @return this object for chaining setters
*/
setRadius(value: number|undefined): DisplayConnector {
  this.radius_ = value;
  this.changed_ = true;
  return this;
};

/** @inheritDoc */
setZIndex(zIndex: number): void {
  this.zIndex_ = zIndex;
  this.changed_ = true;
};

} // end class
Util.defineGlobal('lab$view$DisplayConnector', DisplayConnector);
