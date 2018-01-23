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

goog.module('myphysicslab.lab.app.EventHandler');

goog.require('goog.events.BrowserEvent');

const Printable = goog.require('myphysicslab.lab.util.Printable');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Handles mouse and keyboard events for a
{@link myphysicslab.lab.model.Simulation Simulation}. Converts mouse or key events on a
{@link SimObject} to changes in the Simulation state.

See {@link myphysicslab.lab.app.SimController SimController} which is usually the
entity that supplies events to the EventHandler.

* @interface
*/
class EventHandler extends Printable {

/** Called at the start of a mouse drag. The nearest dragable SimObject is passed in,
along with mouse position in simulation coordinates. If no dragable SimObject was
found, `null` is passed for the first argument. If the EventHandler does not recognize
the SimObject then it should return `false`.

@param {?SimObject} simObject the SimObject that is nearest to
    the mouse drag coordinates, or `null` if no SimObject was found
@param {!Vector} location the location of the mouse in
    simulation coordinates of the LabView where `simObject` was found, or in the
    [focus view](myphysicslab.lab.view.LabCanvas.html#focusview) if `simObject` is
    `null`.
@param {!Vector} offset distance from the initial object position (from
    [DisplayObject#getPosition](myphysicslab.lab.view.DisplayObject.html#getPosition))
    to the mouse location at start of drag
@param {?Vector} dragBody location of 'drag point' on the
    SimObject in body coordinates of the SimObject; this is where for example a spring
    will be attached on the SimObject when dragging; or `null` when no SimObject
    was found
@param {!goog.events.BrowserEvent} mouseEvent the original BrowserEvent
@return {boolean} `true` if the EventHandler will handle dragging the SimObject
*/
startDrag(simObject, location, offset, dragBody, mouseEvent) {}

/** Called at each movement during a mouse drag, performs whatever action is
appropriate. Only called if {@link #startDrag} returned `true`. The
SimObject being moved is passed in, along with the current mouse position, in
simulation coordinates, and an offset calculated at the start of the drag.

Setting the SimObject position to `(x - offsetX, y - offsetY)` will move the SimObject
smoothly along with the mouse movement.

@param {?SimObject} simObject the SimObject being dragged, or
    `null` if no SimObject was found
@param {!Vector} location the location of the mouse in
    simulation coordinates of the LabView where `simObject` was found, or in the
    [focus view](myphysicslab.lab.view.LabCanvas.html#focusview) if `simObject` is
    `null`.
@param {!Vector} offset distance from the initial object position (from
    [DisplayObject#getPosition](myphysicslab.lab.view.DisplayObject.html#getPosition))
    to the mouse location at start of drag.
@param {!goog.events.BrowserEvent} mouseEvent the original BrowserEvent
*/
mouseDrag(simObject, location, offset, mouseEvent) {}

/** Called at the end of a mouse drag operation, performs whatever action is
appropriate.  Only called if {@link #startDrag} returned `true`.

@param {?SimObject} simObject the SimObject being dragged, or
    `null` if no SimObject was found
@param {!Vector} location the location of the mouse in
    simulation coordinates of the LabView where `simObject` was found, or in the
    [focus view](myphysicslab.lab.view.LabCanvas.html#focusview) if `simObject` is
    `null`.
@param {!Vector} offset distance from the initial object position
    to the mouse location at start of drag.
*/
finishDrag(simObject, location, offset) {}

/** Called when a key is pressed or released, performs whatever action is appropriate
for that event.

@param {number} keyCode the key code of the key that was pressed
@param {boolean} pressed `true` means this is a key-down event; `false` means a key-up
    event
@param {!goog.events.BrowserEvent} keyEvent the original BrowserEvent
*/
handleKeyEvent(keyCode, pressed, keyEvent) {}

} //end class

/**  Name of event broadcast when mouse drag occurs. The value of the event is the
* object being dragged.
* @type {string}
* @const
*/
EventHandler.MOUSE_DRAG = 'MOUSE_DRAG';

/**  Name of event broadcast when mouse drag starts. The value of the event is the
* object being dragged.
* @type {string}
* @const
*/
EventHandler.START_DRAG = 'START_DRAG';

/**  Name of event broadcast when mouse drag finishes. The value of the event is the
* object being dragged.
* @type {string}
* @const
*/
EventHandler.FINISH_DRAG = 'FINISH_DRAG';

exports = EventHandler;
