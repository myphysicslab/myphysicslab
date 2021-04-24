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
goog.module('myphysicslab.lab.app.SimController');

const asserts = goog.require('goog.asserts');
const events = goog.require('goog.events');
const BrowserEvent = goog.require('goog.events.BrowserEvent');
const EventType = goog.require('goog.events.EventType');
const Key = goog.require('goog.events.Key');
const KeyEvent = goog.require('goog.events.KeyEvent');

const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const ErrorObserver = goog.require('myphysicslab.lab.util.ErrorObserver');
const EventHandler = goog.require('myphysicslab.lab.app.EventHandler');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const LabView = goog.require('myphysicslab.lab.view.LabView');
const MouseTracker = goog.require('myphysicslab.lab.app.MouseTracker');
const Printable = goog.require('myphysicslab.lab.util.Printable');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const ViewPanner = goog.require('myphysicslab.lab.app.ViewPanner');

/** Handles mouse and keyboard events occurring in a LabCanvas; either forwards events
to an {@link EventHandler}, or does LabView panning
(moving the content of the LabView with the mouse).

Key Events
----------
Key events are forwarded to the EventHandler, but only when the event target is the
LabCanvas, or when there is no specific target (`document.body` is the event target in
that case). This avoids forwarding key events intended for some other target, for
example a text edit area.

Mouse Events
------------
If LabView panning is in effect, then mouse events are sent to the ViewPanner that was
created. Otherwise, SimController calls {@link MouseTracker#findNearestDragable} which
returns a {@link MouseTracker} instance that processes the mouse events before
(possibly) sending them to the EventHandler.

The MouseTracker forwards the mouse events to the EventHandler along with information
such as: the mouse position in simulation coordinates of the LabView; the nearest
dragable DisplayObject; the initial offset between the mouse and the DisplayObject.

Even if no dragable DisplayObject is found (and LabView panning is not occurring)
the MouseTracker still forwards the event to the EventHandler. The mouse position is
given in simulation coordinates of the focus LabView of the LabCanvas.

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

    canvas {
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
    }

There are other such CSS options for other browsers.

<a id="labviewpanning"></a>
LabView Panning
------------
When specified modifier keys are pressed (such as option key) then mouse drag events
will directly pan the focus LabView instead of sending events to the EventHandler. An
instance of {@link ViewPanner} is created to handle the LabView panning. Panning is
accomplished by modifying the simulation rectangle of the LabView with
{@link LabView#setSimRect}.

If LabView panning is enabled, it only occurs when the specified combination of
modifier keys are down during the mouse event, given in the `panModifier` parameter.
Here is an example where LabView panning happens when no modifier keys are pressed:

    new SimController(graphCanvas, null, {alt:false, control:false, meta:false, shift:false})

Here is an example where LabView panning happens when both the meta and alt keys are down:

    new SimController(labCanvas, eventHandler, {alt:true, control:false, meta:true, shift:false})

Note that the exact combination of modifier keys must be pressed to enable LabView
panning. For example, if only the alt key is specified, then LabView panning will not
occur if any other modifier is also pressed.

The table below shows how modifier keys are named on different operating systems.

|          | Mac OS    |  Windows    |
| :----    | :-------- | :---------- |
| alt      | option    | alt         |
| meta     | command   | windows     |

@todo Should this class be designed for inheritance?
    Seems like there could be a need for a class that doesn't look for dragable objects
    at all, but wants to get mouse drag info anyway.

@todo  See DoublePendulumCompareBuilder:  It might be better if the simcontroller
    would ignore objects it finds that don't belong to the sim it is controlling?
    Instead, we have to set those objects to be non-dragable or wind up getting an
    exception in startDrag.  Or if we don't throw an exception in startDrag, there
    is no way for the EventHandler to say "I didn't like that object,
    find me the next nearest one".

@todo Write a EventHandler that overrides what a sim is doing,
    to ensure that it is possible.

@todo Provide a way to specify what JComponent should have focus on startup.
    Currently we are giving the SimCanvas the focus.

@todo  provide a way to say 'pan all views' instead of just the focus view?

@todo  add to LabView interface a way for the LabView to say whether or not it
    is dragable/pannable.  Then you could interrogate all the Views of
    the LabCanvas from front to back, and drag the first one that is
    dragable, instead of only dragging the focus view.

@todo  Make a unit test; especially for findNearestDragable.  Note that it is
    possible to make synthetic events for testing in Javascript.

* @implements {Printable}
* @implements {ErrorObserver}
*/
class SimController {
/**
* @param {!LabCanvas} labCanvas the LabCanvas to process events
    for.
* @param {?EventHandler=} eventHandler  the EventHandler
    to forward events to; or `null` or `undefined` to just do LabView panning.
* @param {?SimController.modifierKey=} panModifier  which modifier
    keys are needed for LabView panning; if `null`, then LabView panning will not be
    done; if `undefined` then default is to do LabView panning when alt key is pressed.
    See {@link SimController#modifierKey}.
*/
constructor(labCanvas, eventHandler, panModifier) {
  /** the LabCanvas to gather events from
  * @type {!LabCanvas}
  * @private
  */
  this.labCanvas_ = labCanvas;
  /**
  * @type {?EventHandler}
  * @private
  */
  this.eventHandler_ = eventHandler || null;
  /** Whether to pan the view by mouse dragging. LabView panning is enabled by default
  * (when panModifer is undefined).
  * @type {boolean}
  * @private
  */
  this.enablePanning_ = panModifier != null;
  /** True means the control key must be down to start LabView panning.
  * @type {boolean}
  * @private
  */
  this.panControl_ = panModifier != null ?
      panModifier.control==true : false;
  /** True means the meta key must be down to start LabView panning.  On Mac OS X,
  * this is the 'command' key.
  * @type {boolean}
  * @private
  */
  this.panMeta_ = panModifier != null ? panModifier.meta==true : false;
  /** True means the shift key must be down to start LabView panning.
  * @type {boolean}
  * @private
  */
  this.panShift_ = panModifier != null ? panModifier.shift==true : false;
  /** True means the alt key must be down to start LabView panning.  On Mac OS X,
  * this is called the 'option' key.
  * @type {boolean}
  * @private
  */
  this.panAlt_ = panModifier != null ? panModifier.alt==true : true;
  /** true when a mouse drag operation is in progress
  * @type {boolean}
  * @private
  */
  this.mouseDrag_ = false;
  /** the object that handles dragging a DisplayObject.
  * @type {?MouseTracker}
  * @private
  */
  this.mouseTracker_ = null;
  /** the object that handles panning a LabView
  * @type {?ViewPanner}
  * @private
  */
  this.myViewPanner_ = null;
  /**
  * @type {boolean}
  * @private
  * @const
  */
  this.debug_ = false;
  /**  key used for removing the listener.  Only process mousedown events that occur on
  * LabCanvas, to prevent eating events needed by other elements.
  * @type {Key}
  * @private
  */
  this.mouseDownKey_ = events.listen(labCanvas.getCanvas(),
      EventType.MOUSEDOWN, /*callback=*/this.mouseDown,
      /*capture=*/false, this);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.mouseMoveKey_ = events.listen(document, EventType.MOUSEMOVE,
      /*callback=*/this.mouseMove,  /*capture=*/false, this);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.mouseUpKey_ = events.listen(document, EventType.MOUSEUP,
      /*callback=*/this.mouseUp,  /*capture=*/false, this);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.keyDownKey_ = events.listen(document, EventType.KEYDOWN,
      /*callback=*/this.keyPressed,  /*capture=*/false, this);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.keyUpKey_ = events.listen(document, EventType.KEYUP,
      /*callback=*/this.keyReleased,  /*capture=*/false, this);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.touchStartKey_ = events.listen(document, EventType.TOUCHSTART,
      /*callback=*/this.touchStart,  /*capture=*/false, this);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.touchMoveKey_ = events.listen(document, EventType.TOUCHMOVE,
      /*callback=*/this.touchMove,  /*capture=*/false, this);
  /**  key used for removing the listener
  * @type {Key}
  * @private
  */
  this.touchEndKey_ = events.listen(document, EventType.TOUCHEND,
      /*callback=*/this.touchEnd,  /*capture=*/false, this);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', labCanvas_: '+this.labCanvas_.toStringShort()
      +', enablePanning_: '+this.enablePanning_
      +', panControl_: '+this.panControl_
      +', panMeta_: '+this.panMeta_
      +', panShift_: '+this.panShift_
      +', panAlt_: '+this.panAlt_
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'SimController{eventHandler_: '
      +(this.eventHandler_ != null ? this.eventHandler_.toStringShort() : 'null')
      +'}';
};

/** @override */
notifyError(error) {
  // This turns off mouse dragging when an error occurs. For example, with ImpulseApp,
  // set elasticity to 0.8, drag a block into the wall, get the 'sim stuck' alert,
  // click OK, then we turn off drag mode here.
  if (this.mouseDrag_) {
    this.finishDrag();
  }
};

/** Remove connections to other objects to facilitate garbage collection.
* @return {undefined}
*/
destroy() {
  events.unlistenByKey(this.mouseDownKey_);
  events.unlistenByKey(this.mouseMoveKey_);
  events.unlistenByKey(this.mouseUpKey_);
  events.unlistenByKey(this.keyDownKey_);
  events.unlistenByKey(this.keyUpKey_);
  events.unlistenByKey(this.touchStartKey_);
  events.unlistenByKey(this.touchMoveKey_);
  events.unlistenByKey(this.touchEndKey_);
};

/**  Callback for mouseDown event.
@param {!BrowserEvent} evt the mouse down event that occurred
@private
*/
mouseDown(evt) {
  this.doMouseDown(evt, evt.clientX, evt.clientY);
};

/** Process a mouseDown in the LabCanvas; decides whether to start panning the LabView,
start dragging a DisplayObject, or simply send events to the EventHandler.

The input coordinates are from `MouseEvent.clientX` and `clientY` which gives a value
of (0,0) for the top left corner of the client area (the canvas). See
<https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX>

@param {!BrowserEvent} evt the mouse down event that occurred
@param {number} mouseX X-coordinate relative to the client area (canvas)
@param {number} mouseY Y-coordinate relative to the client area (canvas)
@private
*/
doMouseDown(evt, mouseX, mouseY) {
  //console.log('ctrl='+evt.ctrlKey+' meta='+evt.metaKey
  //  +' shift='+evt.shiftKey+' alt='+evt.altKey);
  if (evt.target != this.labCanvas_.getCanvas()) {
    // this should never happen.
    asserts.assert(false);
    return;
  }
  this.labCanvas_.focus();
  this.mouseDrag_ = true;
  // The event target is the canvas (unlike with mouseMove events where the event
  // target can be other HTML elements) so could use evt.offsetX, evt.offsetY.
  // But instead we use the same eventToScreen function for all events.
  const start_screen = this.eventToScreen(mouseX, mouseY);
  const pv = this.enablePanning_
      && (this.panControl_ == evt.ctrlKey)
      && (this.panMeta_ == evt.metaKey)
      && (this.panShift_ == evt.shiftKey)
      && (this.panAlt_ == evt.altKey);
  if (pv) {
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
      this.mouseTracker_.startDrag(evt);
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

@param {number} mouseX X-coordinate relative to the client area (canvas)
@param {number} mouseY Y-coordinate relative to the client area (canvas)
@return {!Vector} the event location in the LabCanvas's screen coordinates
@private
*/
eventToScreen(mouseX, mouseY) {
  const cvs = this.labCanvas_.getCanvas();
  const r = cvs.getBoundingClientRect();
  const p = new Vector(mouseX - r.left, mouseY - r.top);
  // how much the canvas is stretched by CSS styling
  const stretch = cvs.offsetWidth / this.labCanvas_.getWidth();
  return p.divide(stretch);
};

/** Callback for mouseMove event.
@param {!BrowserEvent} evt the mouse move event that occurred
@private
*/
mouseMove(evt) {
  this.doMouseMove(evt, evt.clientX, evt.clientY);
};

/** Process mouseMove event, this translates to simulation coordinates and calls
EventHandler.mouseDrag(). Also does panning of the view, and will move the drag object
when the EventHandler doesn't want to.

The input coordinates are from `MouseEvent.clientX` and `clientY` which gives a value of
(0,0) for the top left corner of the client area (the canvas). See
<https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX>

@param {!BrowserEvent} evt the mouse move event that occurred
@param {number} mouseX X-coordinate relative to the client area (canvas)
@param {number} mouseY Y-coordinate relative to the client area (canvas)
@private
*/
doMouseMove(evt, mouseX, mouseY) {
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
  if (evt.target == cvs || evt.target == document.body) {
    if (this.mouseDrag_) {
      //console.log('SimController.mouseMove preventDefault');
      evt.preventDefault();
    }
  }
  if (this.myViewPanner_ != null) {
    this.myViewPanner_.mouseDrag(loc_screen);
  } else if (this.mouseTracker_ != null) {
    this.mouseTracker_.mouseDrag(loc_screen, evt);
  }
};

/** Callback for mouseUp event.
@param {!BrowserEvent} evt the mouse up event that occurred
@private
*/
mouseUp(evt) {
  const cvs = this.labCanvas_.getCanvas();
  // offsetParent returns null when the element has style.display set to 'none'.
  // see https://developer.mozilla.org/en/DOM/element.offsetParent
  if (cvs.offsetParent == null) {
    // the canvas is not visible, so don't send mouseUp events
    return;
  }
  // cancel browser's default action, which would be to select the canvas
  if (evt.target == cvs || evt.target == document.body) {
    if (this.mouseDrag_) {
      //console.log('SimController.mouseUp preventDefault');
      evt.preventDefault();
    }
  }
  this.finishDrag();
};

/** Finish mouse drag operation, if any, and reset state to 'not dragging'.
* @return {undefined}
* @private
*/
finishDrag() {
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
* @return {?EventHandler} the EventHandler to forward events to; or `null` when
*    just doing LabView panning.
*/
getEventHandler() {
  return this.eventHandler_;
};

/** Called when a key has been pressed, forwards the event by calling {@link
EventHandler#handleKeyEvent}. Only forwards when the event target is the LabCanvas, or
when there is no specific target (`document.body` is the event target in that case).
* @param {!KeyEvent} evt the key down event that occurred
* @private
*/
keyPressed(evt) {
  if (evt.target == this.labCanvas_.getCanvas() || evt.target == document.body) {
    if (this.eventHandler_!=null) {
      if (Util.DEBUG && this.debug_) {
        console.log('keyPressed '+Util.propertiesOf(evt, true));
      }
      this.eventHandler_.handleKeyEvent(evt.keyCode, true, evt);
    }
  }
};

/** Called when a key has been released, forwards the event by calling {@link
EventHandler#handleKeyEvent}. Only forwards when the event target is the LabCanvas, or
when there is no specific target (`document.body` is the event target in that case).
* @param {!KeyEvent} evt the key up event that occurred
* @private
*/
keyReleased(evt) {
  if (evt.target == this.labCanvas_.getCanvas() || evt.target == document.body) {
    if (this.eventHandler_!=null) {
      if (Util.DEBUG && this.debug_) {
        console.log('keyReleased '+Util.propertiesOf(evt, true));
      }
      this.eventHandler_.handleKeyEvent(evt.keyCode, false, evt);
    }
  };
};

/**
* @param {?EventHandler} eventHandler  the EventHandler
*    to forward events to; or `null` to just do LabView panning.
*/
setEventHandler(eventHandler) {
  this.eventHandler_ = eventHandler;
};

/** Callback for touchStart event. If single touch in canvas, then process as a
mouse-down event. Multiple touch cancels an ongoing mouse drag by calling
{@link #finishDrag}.
@param {!BrowserEvent} evt the touch start event that occurred
@private
*/
touchStart(evt) {
  if (evt.target == this.labCanvas_.getCanvas()) {
    const bevt = /** @type {!TouchEvent} */(evt.getBrowserEvent());
    if (bevt != null) {
      const touches = bevt.touches;
      if (touches && touches.length == 1) {
        // single touch in our canvas is treated as mouseDown.
        this.doMouseDown(evt, touches[0].clientX, touches[0].clientY);
      } else {
        // Multiple touch cancels an ongoing mouse drag.
        this.finishDrag();
      }
    }
  }
};

/** Callback for touchMove event. If single touch in canvas, then process as a
mouse-move event.  Multiple touch cancels an ongoing mouse drag by calling
{@link #finishDrag}.
@param {!BrowserEvent} evt the touch move event that occurred
@private
*/
touchMove(evt) {
  const e = /** @type {!TouchEvent} */(evt.getBrowserEvent());
  const touches = e != null ? e.touches : [];
  if (this.mouseDrag_ && touches && touches.length == 1) {
    // single touch in our canvas is treated as mouseMove.
    this.doMouseMove(evt, touches[0].clientX, touches[0].clientY);
  } else {
    // Multiple touch cancels an ongoing mouse drag.
    this.finishDrag();
  }
};

/** Callback for touchEnd event. If a mouseDrag is happening, then process as a
mouse-up event.
@param {!BrowserEvent} evt the touch end event that occurred
@private
*/
touchEnd(evt) {
  if (this.mouseDrag_) {
    this.mouseUp(evt);
  }
};

/** Returns string representation of the set of modifier keys, for debugging.
@param {!SimController.modifierKey} modifier the set of modifier keys of interest
@return {string} string representation of the modifierKey
@private
*/
static modifierToString(modifier) {
  let s = '';
  if (modifier.control == true)
    s += 'control';
  if (modifier.alt == true)
    s += (s.length > 0 ? '+' : '') + 'alt';
  if (modifier.meta == true)
    s += (s.length > 0 ? '+' : '') + 'meta';
  if (modifier.shift == true)
    s += (s.length > 0 ? '+' : '') + 'shift';
  return s;
};

/** Returns true if the set of modifier keys matches the event's modifiers
@param {!SimController.modifierKey} modifier set of modifier keys to match
@param {!BrowserEvent} evt the browser event
@return {boolean} true if the set of modifier keys matches the event's modifiers
@private
*/
static modifierMatchesEvent(modifier, evt) {
  if ((modifier.control == true) != evt.ctrlKey)
    return false;
  if ((modifier.alt == true) != evt.altKey)
    return false;
  if ((modifier.meta == true) != evt.metaKey)
    return false;
  if ((modifier.shift == true) != evt.shiftKey)
    return false;
  return true;
};

} // end class

/**  Specifies a set of modifier keys that can occur during browser events.

The table below shows how modifier keys are named on different operating systems.

|          | Mac OS    |  Windows    |
| :----    | :-------- | :---------- |
| alt      | option    | alt         |
| meta     | command   | windows     |

* @typedef {{control: boolean, meta: boolean, shift: boolean, alt: boolean}}
*/
SimController.modifierKey;

exports = SimController;
