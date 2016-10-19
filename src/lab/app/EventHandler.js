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

goog.provide('myphysicslab.lab.app.EventHandler');

goog.require('goog.events.BrowserEvent');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.util.Printable');

goog.scope(function() {

/** Handles mouse dragging and keyboard events. Turns key events or mouse actions on a
{@link myphysicslab.lab.model.SimObject SimObject} into changes in state variables of a
{@link myphysicslab.lab.model.Simulation Simulation}.

{@link myphysicslab.lab.app.SimController SimController} is the intermediary that gets
the initial raw mouse or keyboard events, translates them into simulation coordinates,
finds the nearest dragable SimObject, and calls the appropriate EventHandler method.


@todo  should this be somewhere else?  Like with SimController in builder package?
Or a separate Controller package?  Or in the model package?  It currently uses SimObject
from model, so maybe it belongs there.

@todo  add state of control, shift, and alt modifier keys to key event, and also
mouse down events

* @interface
* @extends {myphysicslab.lab.util.Printable}
*/
myphysicslab.lab.app.EventHandler = function() {};

var EventHandler = myphysicslab.lab.app.EventHandler;

/** Called at the start of a mouse drag. The nearest dragable SimObject is passed in,
along with mouse position in simulation coordinates. If no dragable SimObject was
found, `null` is passed for the first argument. If the EventHandler does not recognize
the SimObject then it should return `false`.

@param {?myphysicslab.lab.model.SimObject} simObject the SimObject that is nearest to
    the mouse drag coordinates, or `null` if no SimObject was found
@param {!myphysicslab.lab.util.Vector} location the location of the mouse in
    simulation coordinates of the LabView where `simObject` was found, or the focus
    LabView if `simObject` is `null`
@param {!myphysicslab.lab.util.Vector} offset distance from the initial object position
    to the mouse location at start of drag
@param {?myphysicslab.lab.util.Vector} dragBody location of 'drag point' on the
    SimObject in body coordinates of the SimObject; this is where for example a spring
    will be attached on the SimObject when dragging; or `null` when no SimObject
    was found
@param {!goog.events.BrowserEvent} mouseEvent the original BrowserEvent
@return {boolean} `true` if the EventHandler will handle dragging the SimObject
*/
EventHandler.prototype.startDrag;

/** Called at each movement during a mouse drag, performs whatever action is
appropriate. Only called if {@link #startDrag} returned `true`. The
SimObject being moved is passed in, along with the current mouse position, in
simulation coordinates, and an offset calculated at the start of the drag.

The offset is the distance from the SimObject's initial position,
from {@link myphysicslab.lab.view.DisplayObject#getPosition},
to the mouse position at the start of the drag.
Therefore, setting the SimObject position to `(x - offsetX, y - offsetY)`
will move the SimObject smoothly along with the mouse movement.

@param {?myphysicslab.lab.model.SimObject} simObject the SimObject being dragged, or
    `null` if no SimObject was found
@param {!myphysicslab.lab.util.Vector} location the location of the mouse in
    simulation coordinates of the LabView where `simObject` was found, or the focus
    LabView if `simObject` is `null`
@param {!myphysicslab.lab.util.Vector} offset distance from the initial object position
    to the mouse location at start of drag.
@param {!goog.events.BrowserEvent} mouseEvent the original BrowserEvent
*/
EventHandler.prototype.mouseDrag;

/** Called at the end of a mouse drag operation, performs whatever action is
appropriate.  Only called if {@link #startDrag} returned `true`.

@param {?myphysicslab.lab.model.SimObject} simObject the SimObject being dragged, or
    `null` if no SimObject was found
@param {!myphysicslab.lab.util.Vector} location the location of the mouse in
    simulation coordinates of the LabView where `simObject` was found, or the focus
    LabView if `simObject` is `null`
@param {!myphysicslab.lab.util.Vector} offset distance from the initial object position
    to the mouse location at start of drag.
*/
EventHandler.prototype.finishDrag;

/** Called when a key is pressed or released, performs whatever action is appropriate
for that event.

@param {number} keyCode the key code of the key that was pressed
@param {boolean} pressed true` means this is a key-down event; `false` means a key-up
    event
@param {!goog.events.BrowserEvent} keyEvent the original BrowserEvent
*/
EventHandler.prototype.handleKeyEvent;

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

}); // goog.scope
