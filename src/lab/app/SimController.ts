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
import { DoubleRect } from '../util/DoubleRect.js'
import { EventHandler, ModifierKeys } from './EventHandler.js'
import { LabCanvas } from '../view/LabCanvas.js'
import { SimView } from '../view/SimView.js'
import { MouseTracker } from './MouseTracker.js'
import { Util , Printable, ErrorObserver} from '../util/Util.js'
import { Vector } from '../util/Vector.js'

/** Handles mouse and keyboard events occurring in a LabCanvas; either forwards events
to an {@link EventHandler}, or does SimView panning (moving the content of the SimView
with the mouse).

Key Events
----------
Key events are forwarded to the EventHandler, but only when the event target is the
LabCanvas, or when there is no specific target (`document.body` is the event target in
that case). This avoids forwarding key events intended for some other target, for
example a text edit area.

Mouse Events
------------
If SimView panning is in effect, then mouse events are sent to the ViewPanner that was
created. Otherwise, SimController calls {@link MouseTracker.findNearestDragable} which
returns a {@link MouseTracker} instance that processes the mouse events before
(possibly) sending them to the EventHandler.

The MouseTracker forwards the mouse events to the EventHandler along with information
such as: the mouse position in simulation coordinates of the SimView; the nearest
dragable DisplayObject; the initial offset between the mouse and the DisplayObject.

Even if no dragable DisplayObject is found (and SimView panning is not occurring)
the MouseTracker still forwards the event to the EventHandler. The mouse position is
given in simulation coordinates of the focus SimView of the LabCanvas.

Touch Events
------------
Single touch events are handled like mouse events. Multiple touch events like *pinch to
zoom* or *two finger pan* are ignored and left for the operating system to respond to.

Because people are inexact about putting all their fingers on the screen at the same
exact moment, most multiple touch events start as a single touch, followed quickly by a
multiple touch event. The typical sequence is:

1. A single-touch `touchStart` comes thru, and we start dragging an object. We also
allow the event to also be processed by the operating system (otherwise many
multi-touch events are not processed by the system).

2. A single-touch `touchMove` event or two occurs, which causes some mouse dragging to
happen.

3. A multi-touch `touchStart` event occurs, we stop mouse dragging. The multi-touch
`touchStart` is then handled by the operating system.

Note that allowing the first `touchStart` to be processed by the system results in the
canvas being highlighted (on iOS, probably others). To prevent that highlighting you
can add this bit of CSS code:
```css
canvas {
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
}
```
There are other such CSS options for other browsers.

SimView Panning
------------
When specified modifier keys are pressed (such as option key) then mouse drag events
will directly pan the focus SimView instead of sending events to the EventHandler. An
instance of {@link ViewPanner} is created to handle the SimView panning. Panning is
accomplished by modifying the simulation rectangle of the SimView with
{@link SimView.setSimRect}.

If SimView panning is enabled, it only occurs when the specified combination of
modifier keys are down during the mouse event, given in the `panModifier` parameter.
Here is an example where SimView panning happens when no modifier keys are pressed:
```
new SimController(graphCanvas, null, {alt:false, control:false, meta:false, shift:false})
```

Here is an example where SimView panning happens when both the meta and alt keys are
down:

```
new SimController(labCanvas, eventHandler, {alt:true, control:false, meta:true, shift:false})
```

Note that the exact combination of modifier keys must be pressed to enable SimView
panning. For example, if only the alt key is specified, then SimView panning will not
occur if any other modifier is also pressed.

The table below shows how modifier keys are named on different operating systems.
```text
|          | Mac OS    |  Windows    |
| :----    | :-------- | :---------- |
| alt      | option    | alt         |
| meta     | command   | windows     |
```

**TO DO** Should this class be designed for inheritance?
    Seems like there could be a need for a class that doesn't look for dragable objects
    at all, but wants to get mouse drag info anyway.

**TO DO**  See DoublePendulumCompareBuilder:  It might be better if the simcontroller
    would ignore objects it finds that don't belong to the sim it is controlling?
    Instead, we have to set those objects to be non-dragable or wind up getting an
    exception in startDrag.  Or if we don't throw an exception in startDrag, there
    is no way for the EventHandler to say "I didn't like that object,
    find me the next nearest one".

**TO DO** Write a EventHandler that overrides what a sim is doing,
    to ensure that it is possible.

**TO DO** Provide a way to specify what JComponent should have focus on startup.
    Currently we are giving the SimCanvas the focus.

**TO DO**  provide a way to say 'pan all views' instead of just the focus view?

**TO DO**  add to SimView interface a way for the SimView to say whether or not it
    is dragable/pannable.  Then you could interrogate all the Views of
    the LabCanvas from front to back, and drag the first one that is
    dragable, instead of only dragging the focus view.

**TO DO**  Make a unit test; especially for findNearestDragable.  Note that it is
    possible to make synthetic events for testing in Javascript.

*/
export class SimController implements ErrorObserver, Printable {
  /** the LabCanvas to gather events from */
  private labCanvas_: LabCanvas;
  private eventHandler_: null|EventHandler;
  /** Whether to pan the view by mouse dragging. SimView panning is enabled by default
  * (when panModifer is undefined).
  */
  private enablePanning_: boolean = false;
  private panModifiers_: ModifierKeys = { };
  /** true when a mouse drag operation is in progress
  */
  private mouseDrag_: boolean = false;
  /** the object that handles dragging a DisplayObject. */
  private mouseTracker_: null|MouseTracker = null;
  /** the object that handles panning a SimView */
  private myViewPanner_: null|ViewPanner = null;
  // event handlers, saved for removing listener
  private mouseDownFn_: (this: HTMLCanvasElement, evt:MouseEvent)=>void;
  private mouseMoveFn_: (e:MouseEvent)=>void;
  private mouseUpFn_: (e:MouseEvent)=>void;
  private keyDownFn_: (e:KeyboardEvent)=>void;
  private keyUpFn_: (e:KeyboardEvent)=>void;
  private touchStartFn_?: (e:TouchEvent)=>void = undefined
  private touchMoveFn_?: (e:TouchEvent)=>void = undefined
  private touchEndFn_?: (e:TouchEvent)=>void = undefined

  private readonly debug_: boolean = false;

/**
* @param labCanvas the LabCanvas to process events for.
* @param eventHandler  the EventHandler to forward events to;
*     or `null` or `undefined` to just do SimView panning.
* @param panModifiers  which modifier keys are needed for SimView panning;
*     if `null`, then SimView panning will not be done;
*     if `undefined` then default is to do SimView panning when shift key is pressed.
*/
constructor(labCanvas: LabCanvas, eventHandler?: null|EventHandler, panModifiers?: null|ModifierKeys) {
  this.labCanvas_ = labCanvas;
  this.eventHandler_ = eventHandler || null;
  if (panModifiers === undefined) {
    panModifiers = { shift: true };
  }
  if (panModifiers) {
    this.enablePanning_ = true;
    this.panModifiers_ = panModifiers;
  }
  // Only process mousedown events that occur on LabCanvas,
  // to prevent eating events needed by other elements (UI controls, etc)
  this.mouseDownFn_ = this.mouseDown.bind(this);
  labCanvas.getCanvas().addEventListener('mousedown', this.mouseDownFn_);
  this.mouseMoveFn_ = this.mouseMove.bind(this);
  document.addEventListener('mousemove', this.mouseMoveFn_);
  this.mouseUpFn_ = this.mouseUp.bind(this);
  document.addEventListener('mouseup', this.mouseUpFn_);
  this.keyDownFn_ = this.keyPressed.bind(this);
  document.addEventListener('keydown', this.keyDownFn_);
  this.keyUpFn_ = this.keyReleased.bind(this);
  document.addEventListener('keyup', this.keyUpFn_);
  this.touchStartFn_ = this.touchStart.bind(this);
  document.addEventListener('touchstart', this.touchStartFn_);
  this.touchMoveFn_ = this.touchMove.bind(this);
  document.addEventListener('touchmove', this.touchMoveFn_);
  this.touchEndFn_ = this.touchEnd.bind(this);
  document.addEventListener('touchend', this.touchEndFn_);
};

/** Remove connections to other objects to facilitate garbage collection.*/
destroy(): void {
  if (this.mouseDownFn_)
    this.labCanvas_.getCanvas().removeEventListener('mousedown', this.mouseDownFn_);
  if (this.mouseMoveFn_)
    document.removeEventListener('mousemove', this.mouseMoveFn_);
  if (this.mouseUpFn_)
    document.removeEventListener('mouseup', this.mouseUpFn_);
  if (this.keyDownFn_)
    document.removeEventListener('keydown', this.keyDownFn_);
  if (this.keyUpFn_)
    document.removeEventListener('keyup', this.keyUpFn_);
  if (this.touchStartFn_)
    document.removeEventListener('touchstart', this.touchStartFn_);
  if (this.touchMoveFn_)
    document.removeEventListener('touchmove', this.touchMoveFn_);
  if (this.touchEndFn_)
    document.removeEventListener('touchend', this.touchEndFn_);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', labCanvas_: '+this.labCanvas_.toStringShort()
      +', enablePanning_: '+this.enablePanning_
      +', panModifiers_: '+ SimController.modifiersToString(this.panModifiers_)
      +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'SimController{eventHandler_: '
      +(this.eventHandler_ != null ? this.eventHandler_.toStringShort() : 'null')
      +'}';
};

/** @inheritDoc */
notifyError(_error: any): void {
  // This turns off mouse dragging when an error occurs. For example, with ImpulseApp,
  // set elasticity to 0.8, drag a block into the wall, get the 'sim stuck' alert,
  // click OK, then we turn off drag mode here.
  if (this.mouseDrag_) {
    this.finishDrag();
  }
};

/**  Callback for mouseDown event.
@param evt the mouse down event that occurred
*/
private mouseDown(evt: MouseEvent): void {
  const modifiers = {
    control: evt.ctrlKey,
    meta: evt.metaKey,
    shift: evt.shiftKey,
    alt: evt.altKey
  };
  this.doMouseDown(modifiers, evt.clientX, evt.clientY);
};

/** Process a mouseDown in the LabCanvas; decides whether to start panning the SimView,
start dragging a DisplayObject, or simply send events to the EventHandler.

The input coordinates are from `MouseEvent.clientX` and `clientY` which gives a value
of (0,0) for the top left corner of the client area (the canvas). See
<https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX>

@param modifiers the modifier keys down during event
@param mouseX X-coordinate relative to the client area (canvas)
@param mouseY Y-coordinate relative to the client area (canvas)
*/
private doMouseDown(modifiers: ModifierKeys, mouseX: number, mouseY: number): void {
  //console.log('ctrl='+evt.ctrlKey+' meta='+evt.metaKey
  //  +' shift='+evt.shiftKey+' alt='+evt.altKey);
  this.labCanvas_.focus();
  this.mouseDrag_ = true;
  // The event target is the canvas (unlike with mouseMove events where the event
  // target can be other HTML elements) so could use evt.offsetX, evt.offsetY.
  // But instead we use the same eventToScreen function for all events.
  const start_screen = this.eventToScreen(mouseX, mouseY);
  if (this.enablePanning_ &&
      SimController.modifiersEqual(this.panModifiers_, modifiers)) {
    // Only pan the simRect, don't send the event to the event handler.
    const view = this.labCanvas_.getFocusView();
    if (view != null) {
      this.myViewPanner_ = new ViewPanner(view, start_screen);
      this.myViewPanner_.mouseDrag(start_screen);
    }
  } else {
    this.mouseTracker_ = MouseTracker.findNearestDragable(this.labCanvas_,
        start_screen, this.eventHandler_);
    if (this.mouseTracker_ != null) {
      this.mouseTracker_.startDrag(modifiers);
    }
  }
};

/** Returns the event location in the LabCanvas's screen coordinates. This works even
when dragging outside of the LabCanvas, and when the canvas is stretched by CSS styling.

From <https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.offsetWidth>

>The `HTMLElement.offsetWidth` read-only property returns the layout width of an
>element. Typically, an element's `offsetWidth` is a measurement which includes the
>element borders, the element horizontal padding, the element vertical scrollbar
>(if present, if rendered) and the element CSS width.

The `event.offsetX` and `event.offsetY` properties only relate to the target of the
event, which is the element the mouse is over; when dragging outside of the canvas the
target is no longer the canvas so we cannot use `offsetX`, `offsetY`.

The input coordinates are from `MouseEvent.clientX` and `clientY` which gives a value of
(0,0) for the top left corner of the client area (the canvas). See
<https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX>

@param mouseX X-coordinate relative to the client area (canvas)
@param mouseY Y-coordinate relative to the client area (canvas)
@return the event location in the LabCanvas's screen coordinates
*/
private eventToScreen(mouseX: number, mouseY: number): Vector {
  const cvs = this.labCanvas_.getCanvas();
  const r = cvs.getBoundingClientRect();
  const p = new Vector(mouseX - r.left, mouseY - r.top);
  // how much the canvas is stretched by CSS styling
  const stretch = cvs.offsetWidth / this.labCanvas_.getWidth();
  return p.divide(stretch);
};

/** Callback for mouseMove event.
@param evt the mouse move event that occurred
*/
private mouseMove(evt: MouseEvent): void {
  this.doMouseMove(evt.clientX, evt.clientY);
};

/** Process mouseMove event, this translates to simulation coordinates and calls
{@link EventHandler.mouseDrag}. Also does panning of the view, and will move the drag
object when the EventHandler doesn't want to.

The input coordinates are from `MouseEvent.clientX` and `clientY` which gives a value
of (0,0) for the top left corner of the client area (the canvas). See
<https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX>

@param mouseX X-coordinate relative to the client area (canvas)
@param mouseY Y-coordinate relative to the client area (canvas)
*/
private doMouseMove(mouseX: number, mouseY: number): void {
  //console.log('SimController.mouseMove evt='+Util.propertiesOf(evt, true));
  const cvs = this.labCanvas_.getCanvas();
  // offsetParent returns null when the element has style.display set to 'none'.
  // see https://developer.mozilla.org/en/DOM/element.offsetParent
  if (cvs.offsetParent == null) {
    // the canvas is not visible, so don't send mouseMove events
    return;
  }
  const loc_screen = this.eventToScreen(mouseX, mouseY);
  // cancel browser's default action, which would be to select the canvas
  // 2023-03-16: remove preventDefault -- seems to no longer do anything.
  /*if (evt.target == cvs || evt.target == document.body) {
    if (this.mouseDrag_) {
      //console.log('SimController.mouseMove preventDefault');
      evt.preventDefault();
    }
  }*/
  if (this.myViewPanner_ != null) {
    this.myViewPanner_.mouseDrag(loc_screen);
  } else if (this.mouseTracker_ != null) {
    this.mouseTracker_.mouseDrag(loc_screen);
  }
};

/** Callback for mouseUp event.
@param evt the mouse up event that occurred
*/
private mouseUp(_evt: MouseEvent): void {
  const cvs = this.labCanvas_.getCanvas();
  // offsetParent returns null when the element has style.display set to 'none'.
  // see https://developer.mozilla.org/en/DOM/element.offsetParent
  if (cvs.offsetParent == null) {
    // the canvas is not visible, so don't send mouseUp events
    return;
  }
  // cancel browser's default action, which would be to select the canvas
  // 2023-03-16: remove preventDefault -- seems to no longer do anything.
  /*if (evt.target == cvs || evt.target == document.body) {
    if (this.mouseDrag_) {
      //console.log('SimController.mouseUp preventDefault');
      evt.preventDefault();
    }
  }*/
  this.finishDrag();
};

/** Finish mouse drag operation, if any, and reset state to 'not dragging'.
*/
private finishDrag(): void {
  if (this.myViewPanner_ != null) {
    this.myViewPanner_.finishDrag();
  } else if (this.mouseTracker_ != null) {
    this.mouseTracker_.finishDrag();
  }
  this.mouseTracker_ = null;
  this.myViewPanner_ = null;
  this.mouseDrag_ = false;
};

/**
* @return the EventHandler to forward events to;
* or `null` when just doing SimView panning.
*/
getEventHandler(): null|EventHandler {
  return this.eventHandler_;
};

/**
* @return the ModifierKeys that enable panning, or null if panning is disabled
*/
getPanModifiers(): ModifierKeys|null {
  return this.enablePanning_ ? this.panModifiers_ : null;
};

/** Called when a key has been pressed, forwards the event by calling 
{@link EventHandler.handleKeyEvent}. Only forwards when the event
target is the LabCanvas, or when there is no specific target (`document.body` is the
event target in that case).
@param evt the key down event that occurred
*/
private keyPressed(e: KeyboardEvent): void {
  const evt = e as KeyboardEvent;
  if (evt.target == this.labCanvas_.getCanvas() || evt.target == document.body) {
    if (this.eventHandler_!=null) {
      if (Util.DEBUG && this.debug_) {
        console.log('keyPressed '+Util.propertiesOf(evt, true));
      }
      const modifiers = {
        control: evt.ctrlKey,
        meta: evt.metaKey,
        shift: evt.shiftKey,
        alt: evt.altKey
      };
      this.eventHandler_.handleKeyEvent(evt, true, modifiers);
    }
  }
};

/** Called when a key has been released, forwards the event by calling
{@link EventHandler.handleKeyEvent}. Only forwards when the event
target is the LabCanvas, or when there is no specific target (`document.body` is the
event target in that case).
@param evt the key up event that occurred
*/
private keyReleased(evt: KeyboardEvent): void {
  if (evt.target == this.labCanvas_.getCanvas() || evt.target == document.body) {
    if (this.eventHandler_!=null) {
      if (Util.DEBUG && this.debug_) {
        console.log('keyReleased '+Util.propertiesOf(evt, true));
      }
      const modifiers = {
        control: evt.ctrlKey,
        meta: evt.metaKey,
        shift: evt.shiftKey,
        alt: evt.altKey
      };
      this.eventHandler_.handleKeyEvent(evt, false, modifiers);
    }
  };
};

/**
* @param eventHandler  the EventHandler
*    to forward events to; or `null` to just do SimView panning.
*/
setEventHandler(eventHandler: null|EventHandler): void {
  this.eventHandler_ = eventHandler;
};

/**
* @param panModifiers the ModifierKeys that enable panning, or null to disable panning
*/
setPanModifiers(panModifiers: null|ModifierKeys): void {
  if (panModifiers === null || panModifiers === undefined) {
    this.enablePanning_ = false;
    this.panModifiers_ =  { };
  } else {
    this.enablePanning_ = true;
    this.panModifiers_ = panModifiers;
  }
};

/** Callback for touchStart event. If single touch in canvas, then process as a
mouse-down event. Multiple touch cancels an ongoing mouse drag by calling
{@link finishDrag}.
@param evt the touch start event that occurred
*/
private touchStart(evt: TouchEvent): void {
  if (evt.target == this.labCanvas_.getCanvas()) {
    const touches = evt.touches;
    if (touches && touches.length == 1) {
      // single touch in our canvas is treated as mouseDown.
      const modifiers = {
        control: false,
        meta: false,
        shift: false,
        alt: false
      };
      this.doMouseDown(modifiers, touches[0].clientX, touches[0].clientY);
    } else {
      // Multiple touch cancels an ongoing mouse drag.
      this.finishDrag();
    }
  }
};

/** Callback for touchMove event. If single touch in canvas, then process as a
mouse-move event.  Multiple touch cancels an ongoing mouse drag by calling
{@link finishDrag}.
@param evt the touch move event that occurred
*/
private touchMove(evt: TouchEvent) {
  const touches = evt != null ? evt.touches : [];
  if (this.mouseDrag_ && touches && touches.length == 1) {
    // single touch in our canvas is treated as mouseMove.
    this.doMouseMove(touches[0].clientX, touches[0].clientY);
  } else {
    // Multiple touch cancels an ongoing mouse drag.
    this.finishDrag();
  }
};

/** Callback for touchEnd event. If a mouseDrag is happening, then process as a
mouse-up event.
@param evt the touch end event that occurred
*/
private touchEnd(_evt: TouchEvent): void {
  if (this.mouseDrag_) {
    this.finishDrag();
  }
};

/** Returns string representation of the set of modifier keys, for debugging.
@param modifiers the set of modifier keys of interest
@return string representation of the modifierKeys
*/
static modifiersToString(modifiers: ModifierKeys): string {
  let s = '';
  if (modifiers.control)
    s += 'control';
  if (modifiers.alt)
    s += (s.length > 0 ? '+' : '') + 'alt';
  if (modifiers.meta)
    s += (s.length > 0 ? '+' : '') + 'meta';
  if (modifiers.shift)
    s += (s.length > 0 ? '+' : '') + 'shift';
  return s;
};

/** Returns true if the two sets of modifier keys match.
@param m1 first set of modifier keys
@param m2 second set of modifier keys
@return true if the two sets of modifier keys match.
*/
static modifiersEqual(m1: ModifierKeys, m2: ModifierKeys) {
  // !!undefined is false.  This allows undefined and false to be equal:
  // !!undefined == !!false  is true
  // (in contrast to undefined == false which is false)
  return (!!m1.control == !!m2.control)
      && (!!m1.meta == !!m2.meta)
      && (!!m1.shift == !!m2.shift)
      && (!!m1.alt == !!m2.alt);
};

} // end class

Util.defineGlobal('lab$app$SimController', SimController);


// ***************************** View Panner ****************************

/** Pans (scrolls) a SimView to follow mouse movements. See
[SimView Panning](./lab_app_SimController.SimController.html#md:simview-panning)
in {@link SimController}.
*/
export class ViewPanner {
  /** the SimView being panned */
  private view_: SimView;
  /**  SimView's initial CoordMap at mouse down event, for SimView panning.
  * We keep the initial coordmap because later we will do SimView.setSimRect
  * which will change the SimView's coordmap.
  */
  private panMap_: CoordMap;
  /** center of simRect in panMap screen coords */
  private center_screen_: Vector;
  /** initial mouse down location in LabCanvas screen coords */
  private start_screen_: Vector;

/**
@param view the SimView to pan
@param start_screen initial mouse position in LabCanvas screen coordinates
*/
constructor(view: SimView, start_screen: Vector) {
  this.view_ = view;
  this.panMap_ = view.getCoordMap();
  const sr = view.getSimRect();
  this.center_screen_ = this.panMap_.simToScreen(sr.getCenter());
  this.start_screen_ = start_screen;
};

/** Modifies the SimView so it is translated by the distance and direction the mouse
has moved since the initial mouse down.
@param loc_screen current mouse position in screen coordinates
*/
mouseDrag(loc_screen: Vector): void {
  // Use panMap_ because it doesn't change as we move the SimView's simRect.
  // Move the center in opposite direction of the mouse, because
  // simRect is the 'window' we look thru to see the simulation.
  const offset = this.start_screen_.subtract(loc_screen);
  const center = this.panMap_.screenToSim(this.center_screen_.add(offset));
  const sr = this.view_.getSimRect();
  const dr = DoubleRect.makeCentered(center, sr.getWidth(), sr.getHeight());
  this.view_.setSimRect(dr);  // note: this changes the SimView's CoordMap.
};

/** Called when mouse drag operation is finished. */
finishDrag(): void {};

} // end ViewPanner class

Util.defineGlobal('lab$app$ViewPanner', ViewPanner);
