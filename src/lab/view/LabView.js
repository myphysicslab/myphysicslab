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

goog.provide('myphysicslab.lab.view.LabView');

goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.MemoList');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.HorizAlign');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.view.VerticalAlign');

goog.scope(function() {

var CoordMap = myphysicslab.lab.view.CoordMap;
var DisplayList = myphysicslab.lab.view.DisplayList;
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var HorizAlign = myphysicslab.lab.view.HorizAlign;
var MemoList = myphysicslab.lab.util.MemoList;
var ScreenRect = myphysicslab.lab.view.ScreenRect;
const Util = goog.module.get('myphysicslab.lab.util.Util');
var VerticalAlign = myphysicslab.lab.view.VerticalAlign;

/** A visual representation of a Simulation which can be displayed in a
{@link myphysicslab.lab.view.LabCanvas LabCanvas}; has a {@link DisplayList} which
represents the {@link myphysicslab.lab.model.SimObject SimObjects} of the Simulation;
has a {@link CoordMap} to relate simulation coordinates to LabCanvas screen coordinates
and a boundary screen rectangle that specifies the location within the LabCanvas.

@todo make a policy for whether we need to save/restore color, stroke, font, etc.
when drawing into a LabView?

* @interface
* @extends {MemoList}
*/
myphysicslab.lab.view.LabView = function() {};
var LabView = myphysicslab.lab.view.LabView;

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

/** Called when this LabView becomes the focus view of the LabCanvas.
@return {undefined}
*/
LabView.prototype.gainFocus;

/** Returns the CoordMap used by this LabView.
@return {!CoordMap} the CoordMap being used by this LabView
*/
LabView.prototype.getCoordMap;

/**  Returns the DisplayList of this LabView.
@return {!DisplayList} the DisplayList of this LabView
*/
LabView.prototype.getDisplayList;

/** Returns the name of this LabView, for use in scripting or debugging.
@return {string} the name of this LabView
*/
LabView.prototype.getName;

/** Returns the screen rectangle that this LabView is occupying within the
LabCanvas, in screen coordinates.
@return {!ScreenRect} the screen rectangle of this LabView in screen coordinates
*/
LabView.prototype.getScreenRect;

/** Returns the bounding rectangle for this LabView in simulation coordinates.
@return {!DoubleRect} the bounding rectangle for this LabView in simulation coordinates
*/
LabView.prototype.getSimRect;

/** Called when this LabView is no longer the focus view of the LabCanvas.
@return {undefined}
*/
LabView.prototype.loseFocus;

/** Paints this LabView into the given CanvasRenderingContext2D.
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
*/
LabView.prototype.paint;

/** Sets the CoordMap used by this LabView.
@param {!CoordMap} map the CoordMap to use for this LabView
*/
LabView.prototype.setCoordMap;

/** Sets the area that this LabView will occupy within the LabCanvas,
in screen coordinates.
@param {!ScreenRect} screenRect the screen coordinates of the area this LabView should
    occupy
*/
LabView.prototype.setScreenRect;

/** Sets the bounding rectangle for this LabView, ensures this rectangle
is visible, and turns off auto-scaling. The result is to generate a new CoordMap for
this SimView so that the simulation rectangle maps to the current screen rectangle.
@param {!DoubleRect} simRect the bounding rectangle for this LabView in simulation
    coordinates.
*/
LabView.prototype.setSimRect;

}); // goog.scope
