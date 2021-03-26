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

goog.module('myphysicslab.lab.view.LabView');

const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DisplayList = goog.require('myphysicslab.lab.view.DisplayList');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const MemoList = goog.require('myphysicslab.lab.util.MemoList');
const ScreenRect = goog.require('myphysicslab.lab.view.ScreenRect');
const Util = goog.require('myphysicslab.lab.util.Util');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

/** A visual representation of a Simulation which can be displayed in a
{@link myphysicslab.lab.view.LabCanvas LabCanvas}; has a {@link DisplayList} which
represents the {@link myphysicslab.lab.model.SimObject SimObjects} of the Simulation;
has a {@link CoordMap} to relate simulation coordinates to LabCanvas screen coordinates
and a boundary screen rectangle that specifies the location within the LabCanvas.

@todo make a policy for whether we need to save/restore color, stroke, font, etc.
when drawing into a LabView?

* @interface
*/
class LabView extends MemoList {

/** Called when this LabView becomes the focus view of the LabCanvas.
@return {undefined}
*/
gainFocus() {}

/** Returns true if this LabView has changed, and sets the state to "unchanged".
@return {boolean} whether this LabView has changed
*/
getChanged() {}

/** Returns the CoordMap used by this LabView.
@return {!CoordMap} the CoordMap being used by this LabView
*/
getCoordMap() {}

/**  Returns the DisplayList of this LabView.
@return {!DisplayList} the DisplayList of this LabView
*/
getDisplayList() {}

/** Returns the name of this LabView, for use in scripting or debugging.
@return {string} the name of this LabView
*/
getName() {}

/** Returns the screen rectangle that this LabView is occupying within the
LabCanvas, in screen coordinates.
@return {!ScreenRect} the screen rectangle of this LabView in screen coordinates
*/
getScreenRect() {}

/** Returns the bounding rectangle for this LabView in simulation coordinates.
@return {!DoubleRect} the bounding rectangle for this LabView in simulation coordinates
*/
getSimRect() {}

/** Called when this LabView is no longer the focus view of the LabCanvas.
@return {undefined}
*/
loseFocus() {}

/** Paints this LabView into the given CanvasRenderingContext2D.
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
*/
paint(context) {}

/** Sets the CoordMap used by this LabView.
@param {!CoordMap} map the CoordMap to use for this LabView
*/
setCoordMap(map) {}

/** Sets the area that this LabView will occupy within the LabCanvas,
in screen coordinates.
@param {!ScreenRect} screenRect the screen coordinates of the area this LabView should
    occupy
*/
setScreenRect(screenRect) {}

/** Sets the bounding rectangle for this LabView, ensures this rectangle
is visible, and turns off auto-scaling. The result is to generate a new CoordMap for
this SimView so that the simulation rectangle maps to the current screen rectangle.
@param {!DoubleRect} simRect the bounding rectangle for this LabView in simulation
    coordinates.
*/
setSimRect(simRect) {}

} // end class

/** Name of event broadcast when the CoordMap changes, see {@link #setCoordMap}.
* @type {string}
* @const
*/
LabView.COORD_MAP_CHANGED = 'COORD_MAP_CHANGED';

/** Name of event broadcast when the screen rectangle size changes, see
* {@link #setScreenRect}.
* @type {string}
* @const
*/
LabView.SCREEN_RECT_CHANGED = 'SCREEN_RECT_CHANGED';

/** Name of event broadcast when the simulation rectangle size changes, see
* {@link #setSimRect}.
* @type {string}
* @const
*/
LabView.SIM_RECT_CHANGED = 'SIM_RECT_CHANGED';

exports = LabView;
