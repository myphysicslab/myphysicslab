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

goog.provide('myphysicslab.lab.view.DisplayObject');

goog.require('myphysicslab.lab.model.MassObject');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Printable');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');

goog.scope(function() {

var CoordMap = myphysicslab.lab.view.CoordMap;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var MassObject = myphysicslab.lab.model.MassObject;
var SimObject = myphysicslab.lab.model.SimObject;
var Vector = myphysicslab.lab.util.Vector;

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
* @extends myphysicslab.lab.util.Printable
*/
myphysicslab.lab.view.DisplayObject = function() {};
var DisplayObject = myphysicslab.lab.view.DisplayObject;

/** Whether the DisplayObject contains the given world coordinates point.
@param {!Vector} p_world  the point in world coordinates
@return {boolean} `true` if this DisplayObject contains the given point
*/
DisplayObject.prototype.contains;

/** Draws this DisplayObject using the given CoordMap.
@param {!CanvasRenderingContext2D} context the canvas's context to draw this object into
@param {!CoordMap} map the mapping to use for translating between simulation
    and screen coordinates
*/
DisplayObject.prototype.draw;

/** Whether this DisplayObject is currently dragable.
@return {boolean} `true` if this DisplayObject is dragable.
*/
DisplayObject.prototype.isDragable;

/** Returns the set of MassObjects that this DisplayObject represents.
Returns an empty list if this DisplayObject doesn't represent a MassObject.
@return {!Array<!MassObject>} the set of MassObjects that this DisplayObject represents
*/
DisplayObject.prototype.getMassObjects;

/** Returns this DisplayObject's position in space. This is mainly used when dragging
the DisplayObject.
@return {!Vector} this DisplayObject's position, in simulation coordinates.
*/
DisplayObject.prototype.getPosition;

/** Returns the set of SimObjects that this DisplayObject represents.
Returns an empty list if this DisplayObject doesn't represent a SimObject.
@return {!Array<!SimObject>} the set of SimObjects that this DisplayObject represents
*/
DisplayObject.prototype.getSimObjects;

/** Sets the z-index which specifies front-to-back ordering of objects;
objects with a higher zIndex are drawn over (in front of) objects with a lower zIndex.
@return {number} the zIndex of this DisplayObject
*/
DisplayObject.prototype.getZIndex;

/** Sets whether this DisplayObject is currently dragable; has no effect on objects
that are not dragable.
@param {boolean} dragable whether this DisplayObject should be dragable
*/
DisplayObject.prototype.setDragable;

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
DisplayObject.prototype.setPosition;

/** Sets the z-index which specifies front-to-back ordering of objects;
objects with a higher zIndex are drawn over objects with a lower zIndex.
Default is zero.
@param {number|undefined} zIndex the zIndex of this DisplayObject
*/
DisplayObject.prototype.setZIndex;

});  // goog.scope
