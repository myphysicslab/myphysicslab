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

import { CoordMap } from "./CoordMap.js"
import { DoubleRect } from "../util/DoubleRect.js"
import { MassObject } from "../model/MassObject.js"
import { Printable } from "../util/Util.js"
import { SimObject } from "../model/SimObject.js"
import { Vector, GenericVector } from "../util/Vector.js"

/** An object that can be displayed in a {@link lab/view/SimView.SimView}, often it
is the visible representation of a {@link SimObject}.
The SimView determines the simulation coordinates and
{@link CoordMap} which are used to place the object on the screen.

Each DisplayObject has a default policy about when the SimObject it represents is
dragable; this can be overridden via the {@link DisplayObject.setDragable} method.

Many DisplayObjects allow specifying a **prototype** DisplayObject. When a display
property is `undefined`, then the property is fetched from the prototype. If it is also
`undefined` on the prototype then a default value is used.

See the View section of [myPhysicsLab Architecture](../Architecture.html#view) for more
about how DisplayObjects are used within an application.
*/
export interface DisplayObject extends Printable {

/** Whether the DisplayObject contains the given world coordinates point.
@param p_world  the point in world coordinates
@return `true` if this DisplayObject contains the given point
*/
contains(p_world: Vector): boolean;

/** Draws this DisplayObject using the given CoordMap.
@param context the canvas's context to draw this object into
@param map the mapping to use for translating between simulation and screen coordinates
*/
draw(context: CanvasRenderingContext2D, map: CoordMap): void;

/** Whether this DisplayObject is currently dragable.
@return `true` if this DisplayObject is dragable.
*/
isDragable(): boolean;

/** Returns true if this DisplayObject has changed, and sets the state to "unchanged".
@return whether this DisplayObject has changed
*/
getChanged(): boolean;

/** Returns the set of MassObjects that this DisplayObject represents.
Returns an empty list if this DisplayObject doesn't represent a MassObject.
@return the set of MassObjects that this DisplayObject represents
*/
getMassObjects(): MassObject[];

/** Returns this DisplayObject's position in space, in simulation coordinates of the
* containing SimView.
@return this DisplayObject's position, in simulation coordinates.
*/
getPosition(): Vector;

/** Returns the set of SimObjects that this DisplayObject represents.
Returns an empty list if this DisplayObject doesn't represent a SimObject.
@return the set of SimObjects that this DisplayObject represents
*/
getSimObjects(): SimObject[];

/** Sets the z-index which specifies front-to-back ordering of objects;
objects with a higher zIndex are drawn over (in front of) objects with a lower zIndex.
@return the zIndex of this DisplayObject
*/
getZIndex(): number;

/** Sets whether this DisplayObject is currently dragable; has no effect on objects
that are not dragable.
@param dragable whether this DisplayObject should be dragable
*/
setDragable(dragable: boolean): void;

/** Sets this DisplayObject's position in simulation coordinates of the containing
SimView. Each type of DisplayObject has a different policy regarding whether this
will have an effect. Generally the policies are:

+ If the DisplayObject does not represent a SimObject, then the position can be set.
  Examples are DisplayClock, EnergyBarGraph.

+ If the SimObject's position is dependent on other objects, then the position cannot
  be set.  Examples are DisplayConnector, DisplayRope, DisplaySpring.

+ If the SimObject can be moved independently and {@link DisplayObject.isDragable}
  is `true`, then the position of the SimObject is modified. Example: DisplayShape.

@param position this DisplayObject's position, in simulation coordinates.
*/
setPosition(position: GenericVector): void;

/** Sets the z-index which specifies front-to-back ordering of objects;
objects with a higher zIndex are drawn over objects with a lower zIndex.
Default is zero.
@param zIndex the zIndex of this DisplayObject
*/
setZIndex(zIndex?: number): void;

} // end DisplayObject interface
