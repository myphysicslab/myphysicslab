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

goog.module('myphysicslab.lab.view.DisplayObject');

const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const MassObject = goog.require('myphysicslab.lab.model.MassObject');
const Printable = goog.require('myphysicslab.lab.util.Printable');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** An object that can be displayed in a {@link myphysicslab.lab.view.LabView}, often it
is the visible representation of a {@link SimObject}.

Each DisplayObject has a default policy about when the SimObject it represents is
dragable; this can be overridden via the {@link #setDragable} method.

Many DisplayObjects allow specifying a **prototype** DisplayObject. When a display
property is `undefined`, then the property is fetched from the prototype. If it is also
`undefined` on the prototype then a default value is used.

See the View section of [myPhysicsLab Architecture](Architecture.html#view) for more
about how DisplayObjects are used within an application.

* @interface
*/
class DisplayObject extends Printable {

/** Whether the DisplayObject contains the given world coordinates point.
@param {!Vector} p_world  the point in world coordinates
@return {boolean} `true` if this DisplayObject contains the given point
*/
contains(p_world) {}

/** Draws this DisplayObject using the given CoordMap.
@param {!CanvasRenderingContext2D} context the canvas's context to draw this object into
@param {!CoordMap} map the mapping to use for translating between simulation
    and screen coordinates
*/
draw(context, map) {}

/** Whether this DisplayObject is currently dragable.
@return {boolean} `true` if this DisplayObject is dragable.
*/
isDragable() {}

/** Returns the set of MassObjects that this DisplayObject represents.
Returns an empty list if this DisplayObject doesn't represent a MassObject.
@return {!Array<!MassObject>} the set of MassObjects that this DisplayObject represents
*/
getMassObjects() {}

/** Returns this DisplayObject's position in space. This is mainly used when dragging
the DisplayObject.
@return {!Vector} this DisplayObject's position, in simulation coordinates.
*/
getPosition() {}

/** Returns the set of SimObjects that this DisplayObject represents.
Returns an empty list if this DisplayObject doesn't represent a SimObject.
@return {!Array<!SimObject>} the set of SimObjects that this DisplayObject represents
*/
getSimObjects() {}

/** Sets the z-index which specifies front-to-back ordering of objects;
objects with a higher zIndex are drawn over (in front of) objects with a lower zIndex.
@return {number} the zIndex of this DisplayObject
*/
getZIndex() {}

/** Sets whether this DisplayObject is currently dragable; has no effect on objects
that are not dragable.
@param {boolean} dragable whether this DisplayObject should be dragable
*/
setDragable(dragable) {}

/** Sets this DisplayObject's position in space. This is mainly used for dragging the
DisplayObject. Each type of DisplayObject has a different policy regarding whether this
will have an effect. Generally the policies are:

+ If the DisplayObject does not represent a SimObject, then the position can be set.
  Examples are DisplayClock, EnergyBarGraph.

+ If the SimObject's position is dependent on other objects, then the position cannot
  be set.  Examples are DisplayConnector, DisplayRope, DisplaySpring.

+ If the SimObject can be moved independently and {@link #isDragable} is true, then the
  position of the SimObject is modified.  Example: DisplayShape.

@param {!Vector} position this DisplayObject's position, in simulation coordinates.
*/
setPosition(position) {}

/** Sets the z-index which specifies front-to-back ordering of objects;
objects with a higher zIndex are drawn over objects with a lower zIndex.
Default is zero.
@param {number|undefined} zIndex the zIndex of this DisplayObject
*/
setZIndex(zIndex) {}

} // end class
exports = DisplayObject;
