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

import { CoordMap } from '../view/CoordMap.js'
import { DisplayObject } from '../view/DisplayObject.js'
import { EventHandler, ModifierKeys } from './EventHandler.js'
import { LabCanvas } from '../view/LabCanvas.js'
import { SimView } from '../view/SimView.js'
import { SimObject } from '../model/SimObject.js'
import { Util } from '../util/Util.js'
import { Vector } from '../util/Vector.js'

/** Processes mouse events to either (1) directly move a {@link DisplayObject} or (2)
forward events to an {@link EventHandler}.

(1) MouseTracker moves the DisplayObject directly when:

+ No EventHandler is specified.

+ `dragDispObj` does not have a {@link SimObject}. Examples include
{@link lab/view/DisplayClock.DisplayClock | DisplayClock} and
{@link lab/graph/EnergyBarGraph.EnergyBarGraph | EnergyBarGraph}.

+ `dragDispObj` has a SimObject but it is not recognized by the EventHandler.
An EventHandler indicates that it doesn't recognize a SimObject by returning `false`
from {@link EventHandler.startDrag}. An example scenario is a
dragable marker object which the user can position as desired.

(2) Events are sent to the EventHandler when:

+ `dragDispObj` has a SimObject which is recognized by the EventHandler. An
EventHandler indicates that it recognizes a SimObject by returning `true` from
{@link EventHandler.startDrag}. In this case, events are translated
to simulation coordinates for the SimView that the DisplayObject is in.

+ `dragDispObj` is `null`. In this case, events are translated to simulation
coordinates of the specified SimView.

See [Mouse Events](./lab_app_SimController.SimController.html#md:mouse-events)
in {@link lab/app/SimController.SimController | SimController}.

**TO DO**  what to do when there are multiple SimObjects, as with DisplayPath?

**TO DO**  Make a unit test; especially for findNearestDragable.  Note that it is
    possible to make synthetic events for testing in Javascript.

*/
export class MouseTracker {

  /** the DisplayObject currently being dragged. */
  private dragDispObj_: null|DisplayObject;
  /** the SimView to search for dragable objects */
  private view_: SimView;
  private eventHandler_: null|EventHandler;
  /** true when EventHandler is dragging a SimObject */
  private ehDrag_: boolean = false;
  /** The SimObject being dragged (the SimObject being displayed by dragDispObj_)
  * if no SimObject found, send the x, y coords of the click anyway, with simObj=null
  */
  private dragSimObj_: null|SimObject = null;
  /** location of mouse event in SimView's simulation coords */
  private loc_sim_: Vector;
  /** location of drag point in body coordinates of the SimObject; ignored when there
  * is no SimObject
  */
  private drag_body_: null|Vector;
  /** the offset between the dragable DisplayObject's initial position and
  * the initial mouse click, in simulation coordinates.
  */
  private dragOffset_: Vector = Vector.ORIGIN;

/**
@param dragDispObj the dragable DisplayObject to move according to mouse movements;
    `null` indicates that events will just be translated to simulation coordinates
@param view the SimView that the DisplayObject is in; or the SimView to use for
    translating to simulation coordinates when there is no DisplayObject
@param loc_sim location of initial mouse event in simulation coordinates of `view`
@param drag_body location of 'drag point' on the
    SimObject in body coordinates of the SimObject; this is where for example a spring
    will be attached on the SimObject when dragging; will be `null` when no SimObject
    was found
@param eventHandler the EventHandler to send events to; will be `null` when a
    DisplayObject should be dragged directly
*/
constructor(dragDispObj: null|DisplayObject, view: SimView, loc_sim: Vector, drag_body: null|Vector, eventHandler: null|EventHandler) {
  if (dragDispObj == null && eventHandler == null) {
    throw '';
  }
  this.dragDispObj_ = dragDispObj;
  this.view_ = view;
  this.eventHandler_ = eventHandler;
  if (dragDispObj != null) {
    const simObjs = dragDispObj.getSimObjects();
    if (simObjs.length > 0) {
      this.dragSimObj_ = simObjs[0];
    }
  }
  this.loc_sim_ = loc_sim;
  this.drag_body_ = drag_body;
  if (dragDispObj !== null) {
    this.dragOffset_ = loc_sim.subtract(dragDispObj.getPosition());
    if (this.dragSimObj_ === null) {
      // dragDispObj does not have a SimObject, so MouseTracker will move the object.
      // Examples include DisplayClock and EnergyBarGraph.
      this.eventHandler_ = null;
    }
  }
};

/*  Design Notes

It is possible to have a DisplayObject that has a SimObject, but which is used
for display only. This is similar to the 'DisplayObject without SimObject' case like
EnergyBarGraph or DisplayClock, except that someone (the app, or the user via Terminal)
has made a SimObject that the Simulation is unaware of.

The use case is for teaching or experimenting: you might add some static but moveable
DisplayObjects to a SimView for marking the starting or ending position of an object
(for example to show the effect of different parameter values or initial conditions).

Imagine adding text, lines, shapes, etc., by writing short scripts in Terminal. One
could make a fancier user interface like a tool bar for adding and deleting shapes. You
might indicate selection by showing with handles for resizing. This is all beyond the
scope of the MouseTracker class, but is a possible future direction. The current
MouseTracker should however be able to move such DisplayObjects if they exist.
*/

/** Called when a mouse down event occurs.
@param modifiers the modifier keys down during event
*/
startDrag(modifiers: ModifierKeys): void {
  if (this.eventHandler_ != null) {
    this.ehDrag_ = this.eventHandler_.startDrag(this.dragSimObj_, this.loc_sim_,
        this.dragOffset_, this.drag_body_, modifiers);
  } else {
    this.ehDrag_ = false;
  }
};

/** Called when a mouse move event occurs.
@param loc_screen location of the event in screen coordinates
*/
mouseDrag(loc_screen: Vector): void {
  const map = this.view_.getCoordMap();
  this.loc_sim_ = map.screenToSim(loc_screen);
  if (this.dragDispObj_ != null && (this.dragSimObj_ == null || !this.ehDrag_)) {
    // we move the dragObj directly
    this.dragDispObj_.setPosition(this.loc_sim_.subtract(this.dragOffset_));
  } else {
    if (this.eventHandler_!=null && this.ehDrag_) {
      this.eventHandler_.mouseDrag(this.dragSimObj_, this.loc_sim_, this.dragOffset_);
    }
  }
};

/** Called when the mouse is released after a drag in the LabCanvas.*/
finishDrag(): void {
  //Use last loc_sim_ from last mouseDown or mouseMove event
  //because for touchEnd events there is no location.
  if (this.eventHandler_ != null) {
    this.eventHandler_.finishDrag(this.dragSimObj_, this.loc_sim_, this.dragOffset_);
  }
};

/** Finds the nearest dragable DisplayObject to the starting location (using distance
in screen coordinates), and creates a MouseTracker for dragging it. If no dragable
DisplayObject is found, creates a MouseTracker which translates mouse events to
simulation coordinates of the LabCanvas's
[focus view](../classes/lab_view_LabCanvas.LabCanvas.html#md:focus-view).

Searches all the SimView's of the LabCanvas, in front to back order. When a
DisplayObject has no SimObject, then regard it as an 'opaque' object and immediately
accept it as the target if mouse is inside; or ignore it entirely if mouse is outside.
We search from front to back in visual order, so that objects that are visually 'on top'
are checked first.

@param labCanvas the LabCanvas to process events for
@param start_screen mouse down location in LabCanvas screen coords
@param eventHandler the EventHandler to send mouse events to, or `null`
@return the MouseTracker to use for processing mouse events,
    or `null` if MouseTracking is not possible
*/
static findNearestDragable(labCanvas: LabCanvas, start_screen: Vector,
    eventHandler: null|EventHandler): null|MouseTracker {
  /** the DisplayObject currently being dragged.
  */
  let dragDispObj = null;
  /** the SimView to search for dragable objects
  */
  let view;
  /** location of mouse event in SimView's simulation coords
  */
  let start_sim;
  /** drag point on SimObject in body coords of the SimObject;  this is where
  * we will attach (for example) a spring to the SimObject to drag it.
  * Note that some SimObject's have multiple drag points.
  */
  let dragPt = null;
  let distance = Infinity;
  // iterate in reverse order, which is visually front to back.
  const views = labCanvas.getViews();
  searchViews:
  for (let j=views.length-1; j >= 0; j--) {
    const v = views[j];
    const map = v.getCoordMap();
    const loc_sim = map.screenToSim(start_screen);
    // iterate in reverse order, which is visually front to back.
    const objs = v.getDisplayList().toArray();
    searchObjs:
    for (let i=objs.length-1; i>= 0; i--) {
      const dispObj = objs[i];
      if (!dispObj.isDragable()) {
        continue searchObjs;
      }
      const massObjs = dispObj.getMassObjects();
      if (massObjs.length > 1) {
        // DisplayObject with multiple MassObjects is never dragable
        continue searchObjs;
      } else if (massObjs.length == 0) {
        // When a dragable DisplayObject has no MassObject, we regard it
        // as an 'opaque' object and immediately accept this as the target
        // if mouse is inside;  or ignore if mouse is outside.
        if (dispObj.contains(loc_sim)) {
          dragDispObj = dispObj;
          view = v;
          start_sim = loc_sim;
          dragPt = Vector.ORIGIN;
          break searchViews;
        } else {
          // ignore when mouse is outside
          continue searchObjs;
        }
      } else {
        // DisplayObject has a single MassObject
        const massObj = massObjs[0];
        const dpts = massObj.getDragPoints();
        for (let k=dpts.length-1; k>=0; k--) {
          // Find drag point closest to the mouse, across all LabViews & SimObjects
          const dpt = massObj.bodyToWorld(dpts[k]);
          const dist = start_screen.distanceTo(map.simToScreen(dpt));
          if (dist <= distance) {
            distance = dist;
            dragDispObj = dispObj;
            view = v;
            dragPt = dpts[k];
            start_sim = loc_sim;
          }
        }
      } // single SimObject
    } // searchObjs
  } // searchViews
  if (dragDispObj == null) {
    // did not find a dragable object;
    // get the location in sim coords of focus view anyway.
    const nv = labCanvas.getFocusView();
    if (nv != null) {
      view = nv;
      start_sim = view.getCoordMap().screenToSim(start_screen);
    } else {
      // without a view, can't translate to sim coords.
      return null;
    }
    if (eventHandler == null) {
      // without dragDispObj and eventHandler, there is nothing to be done
      return null;
    }
  }
  if (view !== undefined && start_sim !== undefined) {
    return new MouseTracker(dragDispObj, view, start_sim, dragPt, eventHandler);
  }
  return null;
};

} // end MouseTracker class

Util.defineGlobal('lab$app$MouseTracker', MouseTracker);
