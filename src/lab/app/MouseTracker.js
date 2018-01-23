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
goog.provide('myphysicslab.lab.app.MouseTracker');

goog.require('goog.events.BrowserEvent');
goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.LabCanvas');
goog.require('myphysicslab.lab.view.LabView');

goog.scope(function() {

var BrowserEvent = goog.events.BrowserEvent;
var Coordmap = myphysicslab.lab.view.CoordMap;
const DisplayObject = goog.module.get('myphysicslab.lab.view.DisplayObject');
var EventHandler = myphysicslab.lab.app.EventHandler;
var LabCanvas = myphysicslab.lab.view.LabCanvas;
var LabView = myphysicslab.lab.view.LabView;
const SimObject = goog.module.get('myphysicslab.lab.model.SimObject');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Processes mouse events to either (1) directly move a {@link DisplayObject} or (2)
forward events to an {@link EventHandler}.

(1) MouseTracker moves the DisplayObject directly when:

+ No EventHandler is specified.

+ `dragDispObj` does not have a SimObject. Examples include DisplayClock and
EnergyBarGraph.

+ `dragDispObj` has a SimObject but it is not recognized by the EventHandler.
An EventHandler indicates that it doesn't recognize a SimObject by returning `false`
from {@link EventHandler#startDrag}. An example scenario is a dragable marker
object which the user can position as desired.

(2) Events are sent to the EventHandler when:

+ `dragDispObj` has a SimObject which is recognized by the EventHandler. An
EventHandler indicates that it recognizes a SimObject by returning `true` from
{@link EventHandler#startDrag}. In this case, events are translated to simulation
coordinates for the LabView that the DisplayObject is in.

+ `dragDispObj` is `null`. In this case, events are translated to simulation
coordinates of the specified LabView.

See *Mouse Events* in {@link myphysicslab.lab.app.SimController}.


@todo  what to do when there are multiple SimObjects, as with DisplayPath?

@todo  Make a unit test; especially for findNearestDragable.  Note that it is
    possible to make synthetic events for testing in Javascript.

@param {?DisplayObject} dragDispObj the dragable DisplayObject
    to move according to mouse movements; `null` indicates that events will just be
    translated to simulation coordinates

@param {!LabView} view the LabView that the DisplayObject is in;
    or the LabView to use for translating to simulation coordinates when there is no
    DisplayObject

@param {!Vector} loc_sim location of initial mouse event in
    simulation coordinates of `view`

@param {?Vector} drag_body location of 'drag point' on the
    SimObject in body coordinates of the SimObject; this is where for example a spring
    will be attached on the SimObject when dragging; will be `null` when no SimObject
    was found

@param {?EventHandler} eventHandler the EventHandler to send
    events to; will be `null` when a DisplayObject should be dragged directly

@constructor
@final
@struct
*/
myphysicslab.lab.app.MouseTracker = function(dragDispObj, view, loc_sim, drag_body,
     eventHandler) {
  if (dragDispObj == null && eventHandler == null) {
    throw new Error();
  }
  /** the DisplayObject currently being dragged.
  * @type {?DisplayObject}
  * @private
  */
  this.dragDispObj_ = dragDispObj;
  /** the LabView to search for dragable objects
  * @type {!LabView}
  * @private
  */
  this.view_ = view;
  /**
  * @type {?EventHandler}
  * @private
  */
  this.eventHandler_ = eventHandler;
  /** true when EventHandler is dragging a SimObject
  * @type {boolean}
  * @private
  */
  this.ehDrag_ = false;
  /** The SimObject being dragged (the SimObject being displayed by dragDispObj_)
  * if no SimObject found, send the x, y coords of the click anyway, with simObj=null
  * @type {?SimObject}
  * @private
  */
  this.dragSimObj_ = null;
  if (dragDispObj != null) {
    var simObjs = dragDispObj.getSimObjects();
    if (simObjs.length > 0) {
      this.dragSimObj_ = simObjs[0];
    }
  }
  /** location of mouse event in LabView's simulation coords
  * @type {!Vector}
  * @private
  */
  this.loc_sim_ = loc_sim;
  /** location of drag point in body coordinates of the SimObject; ignored when there
  * is no SimObject
  * @type {?Vector}
  * @private
  */
  this.drag_body_ = drag_body;
  /** the offset between the dragable DisplayObject's initial position and
  * the initial mouse click, in simulation coordinates.
  * @type {!Vector}
  * @private
  */
  this.dragOffset_ = Vector.ORIGIN;
  if (dragDispObj != null) {
    this.dragOffset_ = loc_sim.subtract(dragDispObj.getPosition());
  }
};
var MouseTracker = myphysicslab.lab.app.MouseTracker;

/*  Design Notes

It is possible to have a DisplayObject that has a SimObject, but which is used
for display only. This is similar to the 'DisplayObject without SimObject' case like
EnergyBarGraph or DisplayClock, except that someone (the app, or the user via Terminal)
has made a SimObject that the Simulation is unaware of.

The use case is for teaching or experimenting: you might add some static but moveable
DisplayObjects to a LabView for marking the starting or ending position of an object
(for example to show the effect of different parameter values or initial conditions).

Imagine adding text, lines, shapes, etc., by writing short scripts in Terminal. One
could make a fancier user interface like a tool bar for adding and deleting shapes. You
might indicate selection by showing with handles for resizing. This is all beyond the
scope of the MouseTracker class, but is a possible future direction. The current
MouseTracker should however be able to move such DisplayObjects if they exist.
*/

/** Called when a mouse down event occurs.
@param {!BrowserEvent} evt the mouse down event that occurred
*/
MouseTracker.prototype.startDrag = function(evt) {
  if (this.eventHandler_ != null) {
    this.ehDrag_ = this.eventHandler_.startDrag(this.dragSimObj_, this.loc_sim_,
        this.dragOffset_, this.drag_body_, evt);
  } else {
    this.ehDrag_ = false;
  }
};

/** Called when a mouse move event occurs.
@param {!Vector} loc_screen location of the event in screen coordinates
@param {!BrowserEvent} evt the mouse move event that occurred
*/
MouseTracker.prototype.mouseDrag = function(loc_screen, evt) {
  var map = this.view_.getCoordMap();
  this.loc_sim_ = map.screenToSim(loc_screen);
  if (this.dragDispObj_ != null && (this.dragSimObj_ == null || !this.ehDrag_)) {
    // we move the dragObj directly
    this.dragDispObj_.setPosition(this.loc_sim_.subtract(this.dragOffset_));
  } else {
    if (this.eventHandler_!=null && this.ehDrag_) {
      this.eventHandler_.mouseDrag(this.dragSimObj_, this.loc_sim_, this.dragOffset_,
          evt);
    }
  }
};

/** Called when the mouse is released after a drag in the LabCanvas.
*/
MouseTracker.prototype.finishDrag = function() {
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
[focus view](myphysicslab.lab.view.LabCanvas.html#focusview).

Searches all the LabView's of the LabCanvas, in front to back order. When a
DisplayObject has no SimObject, then regard it as an 'opaque' object and immediately
accept it as the target if mouse is inside; or ignore it entirely if mouse is outside.
We search from front to back in visual order, so that objects that are visually 'on top'
are checked first.

@param {!LabCanvas} labCanvas the LabCanvas to process events for
@param {!Vector} start_screen mouse down location in LabCanvas screen coords
@param {?EventHandler} eventHandler the EventHandler to send mouse events to,
    or `null`
@return {?MouseTracker} the MouseTracker to use for processing mouse events,
    or `null` if MouseTracking is not possible
*/
MouseTracker.findNearestDragable = function(labCanvas, start_screen, eventHandler) {
  /** the DisplayObject currently being dragged.
  * @type {?DisplayObject}
  */
  var dragDispObj = null;
  /** the LabView to search for dragable objects
  * @type {!LabView}
  */
  var view;
  /** location of mouse event in LabView's simulation coords
  * @type {!Vector}
  */
  var start_sim;
  /** drag point on SimObject in body coords of the SimObject;  this is where
  * we will attach (for example) a spring to the SimObject to drag it.
  * Note that some SimObject's have multiple drag points.
  * @type {?Vector}
  */
  var dragPt = null;
  var distance = Util.POSITIVE_INFINITY;
  // iterate in reverse order, which is visually front to back.
  var views = labCanvas.getViews();
  searchViews:
  for (var j=views.length-1; j >= 0; j--) {
    var v = views[j];
    var map = v.getCoordMap();
    var loc_sim = map.screenToSim(start_screen);
    // iterate in reverse order, which is visually front to back.
    var objs = v.getDisplayList().toArray();
    searchObjs:
    for (var i=objs.length-1; i>= 0; i--) {
      var dispObj = objs[i];
      if (!dispObj.isDragable()) {
        continue searchObjs;
      }
      var massObjs = dispObj.getMassObjects();
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
        var massObj = massObjs[0];
        var dpts = massObj.getDragPoints();
        for (var k=dpts.length-1; k>=0; k--) {
          // Find drag point closest to the mouse, across all LabViews & SimObjects
          var dpt = massObj.bodyToWorld(dpts[k]);
          var dist = start_screen.distanceTo(map.simToScreen(dpt));
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
    var nv = labCanvas.getFocusView();
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
  if (goog.isDef(view) && goog.isDef(start_sim)) {
    return new MouseTracker(dragDispObj, view, start_sim, dragPt, eventHandler);
  }
  return null;
};

}); // goog.scope
