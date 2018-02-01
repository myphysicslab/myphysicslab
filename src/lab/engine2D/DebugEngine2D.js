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

goog.module('myphysicslab.lab.engine2D.DebugEngine2D');

const GenericVector = goog.require('myphysicslab.lab.util.GenericVector');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** An interface that allows us to add a circle or line to the display from anywhere in
the engine2D code. This interface solves some problems with circular dependencies. The
calling code can access the functions via
{@link myphysicslab.lab.engine2D.UtilEngine#debugEngine2D}, without
referring to RigidBodySim (which is what actually implements the functions).

To control the color of the objects that are created:  Find the place where the
DisplayObjects are created (e.g. DisplayLine, DisplayShape) such as RigidBodyObserver;
add code there that looks for objects with particular names, and apply desired color.

* @interface
*/
class DebugEngine2D {

/** Creates a PointMass which is displayed as a circle, and adds it to the
SimList, for debugging only.
The expiration time on temporary SimObjects is set to 'now', so that they are
removed right away during the next call to advance().
* @param {string} name name of the SimObject that is created
* @param {!GenericVector} center center of the circle
* @param {number} radius radius of the circle
* @param {number=} expireTime the time when the DisplayObject will be removed;
*    the default expireTime is 'now'.
*/
debugCircle(name, center, radius, expireTime) {}

/** Creates a ConcreteLine and adds it to the SimList, for debugging only.
The expiration time on temporary SimObjects is set to 'now', so that they are
removed right away during the next call to advance().
* @param {string} name name of the SimObject that is created
* @param {!Vector} pa starting point of the line
* @param {!Vector} pb ending point of the line
* @param {number=} expireTime the time when the DisplayObject will be removed;
*    the default expireTime is 'now'.
*/
debugLine(name, pa, pb, expireTime) {}

/** Returns the current simulation time.
* @return {number} the current simulation time
*/
getTime() {}

/** Prints the message to console, preceded by the current simulation time. Draws the
time in green, the message in black; you can change colors in the message by adding more
'%c' symbols in the message string and pass additional colors.
* @param {string} message message to print, optionally with '%c' where color changes are
*     desired
* @param {...string} colors CSS color or background strings, to change the color in the
*     message at points in the message marked by the string '%c'
*/
myPrint(message, colors) {}

} // end class

/** Proximity testing means we avoid expensive collision testing when bodies are so far
apart there is no way they can collide. For debugging, you can turn off the proximity
testing and then collision testing always happens even when objects are far apart.
* @type {boolean}
* @const
*/
DebugEngine2D.PROXIMITY_TEST = true;

exports = DebugEngine2D;
