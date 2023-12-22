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

import { Printable } from '../util/Util.js'
import { SimObject } from '../model/SimObject.js'
import { Vector } from '../util/Vector.js'

/**  Specifies a set of modifier keys that can occur during browser events.

The table below shows how modifier keys are named on different operating systems.
```text
|          | Mac OS    |  Windows    |
| :----    | :-------- | :---------- |
| alt      | option    | alt         |
| meta     | command   | windows     |
```
*/
export type ModifierKeys = {
  control?: boolean,
  meta?: boolean,
  shift?: boolean,
  alt?: boolean
}

/** Handles mouse and keyboard events for a
{@link lab/model/Simulation.Simulation | Simulation}. Converts mouse or key events on a
{@link SimObject} to changes in the Simulation state.

See {@link lab/app/SimController.SimController | SimController} which is usually the
entity that supplies events to the EventHandler.
*/
export interface EventHandler extends Printable {

/** Called at the start of a mouse drag. The nearest dragable SimObject is passed in,
along with mouse position in simulation coordinates. If no dragable SimObject was
found, `null` is passed for the first argument. If the EventHandler does not recognize
the SimObject then it should return `false`.

@param simObject the SimObject that is nearest to the mouse drag coordinates,
    or `null` if no SimObject was found
@param location the location of the mouse in
    simulation coordinates of the SimView where `simObject` was found, or in the
    [focus view](../classes/lab_view_LabCanvas.LabCanvas.html#md:focus-view)
    if `simObject` is `null`.
@param offset distance from the initial object position (from
    {@link lab/view/DisplayObject.DisplayObject.getPosition | DisplayObject.getPosition})
    to the mouse location at start of drag
@param dragBody location of 'drag point' on the
    SimObject in body coordinates of the SimObject; this is where for example a spring
    will be attached on the SimObject when dragging; or `null` when no SimObject
    was found
@param modifiers the modifier keys down during event
@return `true` if the EventHandler will handle dragging the SimObject
*/
startDrag(simObject: null|SimObject, location: Vector, offset: Vector,
    dragBody: null|Vector, modifiers: ModifierKeys): boolean;

/** Called at each movement during a mouse drag, performs whatever action is
appropriate. Only called if {@link startDrag} returned `true`.
The SimObject being moved is passed in, along with the current mouse position, in
simulation coordinates, and an offset calculated at the start of the drag.

Setting the SimObject position to `(x - offsetX, y - offsetY)` will move the SimObject
smoothly along with the mouse movement.

@param simObject the SimObject being dragged, or `null` if no SimObject was found
@param location the location of the mouse in
    simulation coordinates of the SimView where `simObject` was found, or in the
    [focus view](../classes/lab_view_LabCanvas.LabCanvas.html#md:focus-view)
    if `simObject` is `null`.
@param offset distance from the initial object position (from
    {@link lab/view/DisplayObject.DisplayObject.getPosition | DisplayObject.getPosition})
    to the mouse location at start of drag.
*/
mouseDrag(simObject: null|SimObject, location: Vector, offset: Vector): void;

/** Called at the end of a mouse drag operation, performs whatever action is
appropriate.  Only called if {@link startDrag} returned `true`.

@param simObject the SimObject being dragged, or `null` if no SimObject was found
@param location the location of the mouse in
    simulation coordinates of the SimView where `simObject` was found, or in the
    [focus view](../classes/lab_view_LabCanvas.LabCanvas.html#md:focus-view)
    if `simObject` is `null`.
@param offset distance from the initial object position
    to the mouse location at start of drag.
*/
finishDrag(simObject: null|SimObject, location: Vector, offset: Vector): void;

/** Called when a key is pressed or released, performs whatever action is appropriate
for that event.

@param evt the
  [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
  that happened
@param pressed `true` means this is a key-down event; `false` means a key-up event
@param modifiers the modifier keys down during event
*/
handleKeyEvent(evt: KeyboardEvent, pressed: boolean, modifiers: ModifierKeys): void;
}
