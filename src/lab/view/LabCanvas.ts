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

import { AbstractSubject } from "../util/AbstractSubject.js"
import { ConcreteMemoList } from "../util/ConcreteMemoList.js"
import { CoordMap } from "./CoordMap.js"
import { DisplayObject } from "./DisplayObject.js"
import { GenericEvent, ParameterNumber, ParameterString, Subject } from "../util/Observe.js"
import { SimView } from "./SimView.js"
import { MemoList, Memorizable } from "../util/Memo.js"
import { ScreenRect } from "./ScreenRect.js"
import { Util } from "../util/Util.js"

/** Manages an HTML canvas and contains a list of {@link SimView}'s which are drawn
into the canvas. The SimViews are drawn overlapping so that the last SimView appears on
top of the others.

### Canvas Size

The HTML canvas has a specified width and height, which determines
the *screen rectangle* of the canvas. The canvas screen rectangle has `(0, 0)` for
the top-left corner and `(width, height)` for the bottom-right corner. The vertical
coordinates increase downwards.

The size can be changed via {@link LabCanvas.setWidth}, {@link LabCanvas.setHeight},
{@link LabCanvas.setSize} or {@link LabCanvas.setScreenRect}. When the size of the HTML canvas changes,
the SimViews are set to have the same screen rectangle as the canvas.

Each SimView has a simulation rectangle and a screen rectangle, and these are aligned
by a {@link CoordMap}. The simulation rectangle specifies the simulation coordinates,
and the CoordMap translates simulation coordinates to screen coordinates. Pan and zoom
can be accomplished by changing the simulation rectangle of a SimView (which changes
its CoordMap accordingly).

<a id="focusview"></a>
### Focus View

The {@link LabCanvas#getFocusView focus view} is the SimView that the user expects to modify by
his/her actions. For example, {@link lab/app/SimController.SimController} will pan the
focus SimView when a particular set of modifier keys are pressed during a mouse drag.

The first SimView that is added becomes the initial focus view, but the focus view can
be changed via {@link LabCanvas.setFocusView}.

### Background Color

Whenever {@link LabCanvas.paint} is called to draw a new frame, the first step is to clear the
old frame from the HTML canvas. What happens depends on the
{@link LabCanvas#getBackground background color}.

+ If no background color is specified then we use JavaScript `canvas.clearRect()`
    which clears to transparent black pixels.

+ If a background color is specified, then we use JavaScript `canvas.fillRect()`
    which fills the HTML canvas with that color.

The background color can be set with {@link LabCanvas.setBackground}.

### Trails Effect

A visual effect where moving objects leave behind a smeared out trail can be done by
setting the background color and the *alpha transparency*, see {@link LabCanvas.setAlpha}.
Here are example settings, which can be done in a
{@link lab/util/Terminal.Terminal} session:
```
simCanvas.setBackground('black');
simCanvas.setAlpha(0.05);
```

When `alpha` is 1.0 then there is no trails effect because the old frame is entirely
painted over with an opaque color.

The trails effect happens when `alpha` is less than 1 because we paint a translucent
rectangle over the old frame, which gradually makes the old image disappear after
several iterations of painting.

### Draw Only When There Are Changes

LabCanvas avoids unnecessary drawing (for example when the simulation is paused).
It does this by asking each of its SimViews whether they have changed, via
{@link SimView.getChanged}. The SimView similarly asks each of its DisplayObjects
via {@link DisplayObject.getChanged}. If there are no changes, then LabCanvas
avoids drawing.

Note that the `getChanged` methods on the various display objects have a side-effect:
they reset their state to "unchanged". Be sure that all the `getChanged` methods are
called on all objects in the display hierarchy, otherwise there may be a leftover
"changed" flag that was not cleared.



Parameters Created
------------------

+ ParameterNumber named `WIDTH`, see {@link LabCanvas.setWidth}

+ ParameterNumber named `HEIGHT`, see {@link LabCanvas.setHeight}

+ ParameterNumber named `ALPHA`, see {@link LabCanvas.setAlpha}

+ ParameterString named `BACKGROUND`, see {@link LabCanvas.setBackground}

Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `VIEW_ADDED`; the value is the SimView being added

+ GenericEvent named `VIEW_REMOVED`; the value is the SimView being removed

+ GenericEvent named `FOCUS_VIEW_CHANGED`; the value is the SimView which is
    the focus, or `null` if there is no focus view

+ GenericEvent named `VIEW_LIST_MODIFIED`

+ GenericEvent named `SIZE_CHANGED`

*/
export class LabCanvas extends AbstractSubject implements Subject, Memorizable, MemoList {
  private htmlCanvas_: HTMLCanvasElement;
  private simViews_: SimView[] = [];
  private memoList_: MemoList;
  /** The view which is the main focus and is drawn normally. */
  private focusView_: null|SimView = null;
  /** The transparency used when painting the background color; a number between
  * 0.0 (fully transparent) and 1.0 (fully opaque).  When alpha_ < 1 then a "trails"
  * effect happens.
  */
  private alpha_: number = 1.0;
  /** The background color; either a CSS3 color value or the empty string. Transparent
  * black is used if it is the empty string.
  */
  private background_: string = '';
  private changed_: boolean = true;
  /** Counter for how many frames need to be drawn to erase trails. */
  private counter_: number = 0;
  private readonly debug_: boolean = false;

/**
* @param canvas the HTML canvas to manage
* @param name name of this LabCanvas
*/
constructor(canvas: HTMLCanvasElement, name: string) {
  super(name);
  this.htmlCanvas_ = canvas;
  this.memoList_ = new ConcreteMemoList();

  // contentEditable makes the canvas be focusable (can get keyboard focus)
  // and can get control of the cursor.
  // Result is: if you were editing a NumericControl, for example, then
  // clicking on canvas will cause that control to lose focus, which is what we want.
  // Also, this seems to enable setting the cursor according to the CSS values
  // for canvas.cursor and canvas:active.cursor.
  // Oct 2014: set canvas.contentEditable to false. This fixes problems where clicking
  // on canvas would bring up keyboard on iPhone and cause a huge blinking text cursor
  // on side of canvas. However, canvas will no longer get text events.
  // Dec 2014: see places where we set the tabIndex to allow the canvas to get focus.
  canvas.contentEditable = 'false';

  // Prevent scrolling when touching the canvas
  // https://stackoverflow.com/questions/49854201/
  //       html5-issue-canvas-scrolling-when-interacting-dragging-on-ios-11-3
  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
  // passive: A Boolean which, if true, indicates that the function specified by
  // listener will never call preventDefault(). If a passive listener does call
  // preventDefault(), the user agent will do nothing other than generate a console
  // warning. See Improving scrolling performance with passive listeners to learn more.
  document.body.addEventListener("touchstart", function (e: Event) {
      if (e.target == canvas) {
          e.preventDefault();
      }
  }, { passive: false });
  document.body.addEventListener("touchend", function (e: Event) {
      if (e.target == canvas) {
          e.preventDefault();
      }
  }, { passive: false });
  document.body.addEventListener("touchmove", function (e: Event) {
      if (e.target == canvas) {
          e.preventDefault();
      }
  }, { passive: false });

  this.addParameter(new ParameterNumber(this, LabCanvas.en.WIDTH,
      LabCanvas.i18n.WIDTH, () => this.getWidth(),
      a => this.setWidth(a)));
  this.addParameter(new ParameterNumber(this, LabCanvas.en.HEIGHT,
      LabCanvas.i18n.HEIGHT, () => this.getHeight(),
      a => this.setHeight(a)));
  this.addParameter(new ParameterNumber(this, LabCanvas.en.ALPHA,
      LabCanvas.i18n.ALPHA, () => this.getAlpha(),
      a => this.setAlpha(a)));
  this.addParameter(new ParameterString(this, LabCanvas.en.BACKGROUND,
      LabCanvas.i18n.BACKGROUND, () => this.getBackground(),
      a => this.setBackground(a)));
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', width: '+this.htmlCanvas_.width
      +', height: '+this.htmlCanvas_.height
      +', background_: "'+this.background_+'"'
      +', alpha_: '+Util.NF5(this.alpha_)
      +', focusView_: '
      + (this.focusView_ == null ? 'null' : this.focusView_.toStringShort())
      +', simViews_: ['
      + this.simViews_.map(v => v.toStringShort())
      +'], memoList_: '+this.memoList_
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'LabCanvas';
};

/** @inheritDoc */
addMemo(memorizable: Memorizable): void {
  this.memoList_.addMemo(memorizable);
};

/** Adds the SimView to the end of the list of SimViews displayed and memorized by this
LabCanvas. Makes the SimView the focus view if there isn't currently a focus view.
Notifies any Observers by broadcasting GenericEvents named
{@link LabCanvas.VIEW_ADDED} and
{@link LabCanvas.VIEW_LIST_MODIFIED} and possibly also
{@link LabCanvas.FOCUS_VIEW_CHANGED}.
@param view the SimView to add
*/
addView(view: SimView): void {
  Util.assert(Util.isObject(view));
  if (this.getWidth() > 0 && this.getHeight() > 0) {
    const sr = new ScreenRect(0, 0, this.getWidth(), this.getHeight());
    view.setScreenRect(sr);
  }
  this.simViews_.push(view);
  this.addMemo(view);
  this.changed_ = true;
  this.broadcast(new GenericEvent(this, LabCanvas.VIEW_ADDED, view));
  this.broadcast(new GenericEvent(this, LabCanvas.VIEW_LIST_MODIFIED));
  // set the first view added to be the focus.
  if (this.focusView_==null) {
    this.setFocusView(view);
  }
};

/** Moves the keyboard focus to the HTML canvas. */
focus(): void {
  // Move the keyboard focus to the canvas.  This is desirable so that if
  // the user was editing a text field, it ends that editing operation.
  // see http://stackoverflow.com/questions/1829586/
  //     how-do-i-give-an-html-canvas-the-keyboard-focus-using-jquery
  this.htmlCanvas_.focus();
};

/** Returns the transparency used when painting the background color;
a number between 0.0 (fully transparent) and 1.0 (fully opaque).
Only has an effect if the background color is non-empty string.
@return transparency used when painting, between 0 and 1.
*/
getAlpha(): number {
  return this.alpha_;
};

/** Returns the background color; either a CSS3 color value or the empty string. Empty
* string means that background is cleared to transparent black (which actually appears
* as a white background unless there is something already drawn underneath).
* @return the background color; either a CSS3 color value or the empty string
*/
getBackground(): string {
  return this.background_;
};

/** Returns the HTML canvas being managed by this LabCanvas.
* @return the HTML canvas being managed by this LabCanvas
*/
getCanvas(): HTMLCanvasElement {
  return this.htmlCanvas_;
};

/** Returns whether this LabCanvas has changed, and sets the state to "unchanged".
@return whether this LabCanvas has changed
*/
getChanged(): boolean {
  let chg = false;
  for (let i=0, n=this.simViews_.length; i<n; i++) {
    const c = this.simViews_[i].getChanged();
    chg = chg || c;
  }
  if (chg || this.changed_) {
    this.changed_ = false;
    return true;
  }
  return false;
};

/** Returns the CanvasRenderingContext2D used for drawing into the HTML canvas being
* managed by this LabCanvas.
* @return the CanvasRenderingContext2D used for drawing
*   into the HTML canvas
*/
getContext(): CanvasRenderingContext2D {
  const c = this.htmlCanvas_.getContext('2d');
  if (c === null) {
    throw 'unable to get CanvasRenderingContext2D';
  };
  return c;
};

/** Returns the focus SimView which the user expects to modify by his/her actions.
* @return the focus SimView, or `null` when there is no focus SimView
*/
getFocusView(): null|SimView {
  return this.focusView_;
};

/** Returns the height of the HTML canvas, in screen coords (pixels).
* @return the height of the HTML canvas, in screen coords (pixels)
*/
getHeight(): number {
  return this.htmlCanvas_.height;
};

/** @inheritDoc */
getMemos(): Memorizable[] {
  return this.memoList_.getMemos();
};

/** Returns the ScreenRect corresponding to the area of the HTML canvas.
The top-left coordinate is always (0,0).  This does not represent the location
of the canvas within the document or window.
@return the ScreenRect corresponding to the area of the HTML canvas.
*/
getScreenRect(): ScreenRect {
  return new ScreenRect(0, 0, this.htmlCanvas_.width, this.htmlCanvas_.height);
};

/**  Returns list of the SimViews in this LabCanvas.
@return list of SimViews in this LabCanvas
*/
getViews(): SimView[] {
  return Array.from(this.simViews_);
};

/** Returns the width of the HTML canvas, in screen coords (pixels).
* @return the width of the HTML canvas, in screen coords (pixels)
*/
getWidth(): number {
  return this.htmlCanvas_.width;
};

/** @inheritDoc */
memorize(): void {
  this.memoList_.memorize();
};

private notifySizeChanged(): void {
  const r = this.getScreenRect();
  this.simViews_.forEach(view => view.setScreenRect(r));
  this.changed_ = true;
  this.broadcast(new GenericEvent(this, LabCanvas.SIZE_CHANGED));
};

/** Clears the canvas to the background color; then paints each SimView.
* See {@link LabCanvas.setBackground} and {@link LabCanvas.setAlpha}.
*/
paint(): void {
  // Avoid painting when the canvas is hidden.
  // http://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
  // According to MDN documentation, an element's offsetParent property will return
  // `null` whenever it, or any of its parents, is hidden via the display style
  // property. Just make sure that the element doesnt have 'position:fixed;'.
  if (this.htmlCanvas_.offsetParent != null) {
    if (this.counter_ > 0) {
      this.counter_--;
    }
    // Draw only when there are changes. The getChanged method interrogates the entire
    // hierarchy of display objects for changes.
    // Note that the `changed` flags on display objects are reset as a side-effect.
    const chg = this.getChanged();
    // Draw if there are changes, or to wipe out lingering "trails".
    if (chg || this.counter_ > 0) {
      const context = this.htmlCanvas_.getContext('2d');
      if (context === null) {
        throw 'unable to get html context';
      }
      context.save();
      try {
        if (this.background_ != '') {
          // Notes Nov 22, 2016:
          // Setting a fillStyle color with transparency doesn't work here.
          // For example rgb(0,0,0,0.05). Only setting globalAlpha works.
          // Does fillRect() always ignore the alpha value of the color?
          // That does not seem to be according to spec.
          // Note also that globalAlpha has no effect on fill() because in that
          // case the fillStyle's alpha is always used, and if not specified then
          // it seems to assume alpha = 1.
          context.globalAlpha = this.alpha_;
          context.fillStyle = this.background_;
          context.fillRect(0, 0, this.htmlCanvas_.width, this.htmlCanvas_.height);
          context.globalAlpha = 1;
          // Set a counter for how many frames need to be drawn to erase trails.
          if (this.alpha_ == 1) {
            this.counter_ = 0;
          } else if (chg) {
            // Reset the trails counter whenever there is a change.
            this.counter_ = Math.floor(10 / this.alpha_);
          }
        } else {
          // clearRect sets all pixels in the rectangle to transparent black,
          // erasing any previously drawn content.
          // clearRect is supposed to be faster than fillRect.
          context.clearRect(0, 0, this.htmlCanvas_.width, this.htmlCanvas_.height);
        }
        this.simViews_.forEach(view => view.paint(context));
      } finally {
        context.restore();
      }
    }
  }
};

/** @inheritDoc */
removeMemo(memorizable: Memorizable): void {
  this.memoList_.removeMemo(memorizable);
};

/** Removes the SimView from the list of SimViews displayed and memorized by this
LabCanvas. Sets the focus view to be the first view in remaining list of SimViews.
Notifies any Observers by broadcasting GenericEvents named
{@link LabCanvas.VIEW_LIST_MODIFIED}
and {@link LabCanvas.VIEW_REMOVED} and possibly also
{@link LabCanvas.FOCUS_VIEW_CHANGED}.
@param view the SimView to remove
*/
removeView(view: SimView): void {
  // give nice error message during interactive Terminal scripting
  if (!(view instanceof SimView))
    throw 'not a SimView '+view;
  Util.remove(this.simViews_, view);
  this.removeMemo(view);
  if (this.focusView_==view) {
    // pick first view to focus on, if possible
    this.setFocusView((this.simViews_.length === 0) ? null : this.simViews_[0]);
  }
  this.changed_ = true;
  this.broadcast(new GenericEvent(this, LabCanvas.VIEW_REMOVED, view));
  this.broadcast(new GenericEvent(this, LabCanvas.VIEW_LIST_MODIFIED));
};

/** Sets the transparency used when painting the background color;
a number between 0.0 (fully transparent) and 1.0 (fully opaque).
Only has an effect if the background color is non-empty string.

A value less than 1 gives a "trails" effect where the older positions of objects
gradually fade out over a second or two. The trails are longer for smaller alpha.
@param value transparency used when painting, between 0 and 1
*/
setAlpha(value: number): void {
  if (Util.veryDifferent(this.alpha_, value)) {
    if (value <= 0 || value > 1) {
      throw 'alpha must be between 0 and 1';
    }
    this.alpha_ = value;
    // Alpha has no effect when background is empty string which means
    // "clear to transparent black". Set background to white in that case.
    if (Util.veryDifferent(value, 1) && this.background_ == '') {
      this.setBackground('white');
    }
    this.changed_ = true;
    this.broadcastParameter(LabCanvas.en.ALPHA);
  }
};

/** Sets the background color; either a CSS3 color value or the empty string. Empty
string means that background is cleared to transparent black (which actually appears
as a white background unless there is something already drawn underneath).
@param value the background color; either a CSS3 color value or the empty string
*/
setBackground(value: string): void {
  if (this.background_ != value) {
    this.background_ = value;
    this.changed_ = true;
    this.broadcastParameter(LabCanvas.en.BACKGROUND);
  }
};

/** Sets the focus SimView which is the main focus of the LabCanvas. Notifies any
observers that the focus has changed by broadcasting the GenericEvent named
{@link LabCanvas.FOCUS_VIEW_CHANGED}.
@param view the view that should be the focus; can be
    `null` when no SimView has the focus.
@throws if `view` is not contained by this LabCanvas
*/
setFocusView(view: null|SimView): void {
  if (view != null && !this.simViews_.includes(view))
    throw 'cannot set focus to unknown view '+view;
  if (this.focusView_ != view) {
    if (this.focusView_ != null) {
      this.focusView_.loseFocus();
    }
    this.focusView_ = view;
    if (view != null) {
      view.gainFocus();
    }
    this.changed_ = true;
    this.broadcast(new GenericEvent(this, LabCanvas.FOCUS_VIEW_CHANGED, view));
  }
};

/** Sets the height of the HTML canvas, and sets the screen rectangle of all the
SimViews. Notifies any Observers by broadcasting a GenericEvent named
{@link LabCanvas.SIZE_CHANGED}.
@param value  the height of the canvas, in screen coords (pixels),
*/
setHeight(value: number): void {
  if (Util.veryDifferent(value, this.htmlCanvas_.height)) {
    this.htmlCanvas_.height = value;
  }
  this.notifySizeChanged();
  this.broadcastParameter(LabCanvas.en.HEIGHT);
};

/** Sets the size of this LabCanvas to the given ScreenRect by calling {@link LabCanvas.setSize}.
@param sr  specifies the width and height; the top-left must be (0,0).
@throws if the top-left of the given ScreenRect is not (0,0).
*/
setScreenRect(sr: ScreenRect): void {
  // give nice error message during interactive Terminal scripting
  if (!(sr instanceof ScreenRect))
    throw 'not a ScreenRect: '+sr;
  if (sr.getTop() != 0 || sr.getLeft() != 0) {
    throw 'top left must be (0,0), was: '+sr;
  }
  this.changed_ = true;
  this.setSize(sr.getWidth(), sr.getHeight());
};

/** Sets the size of the HTML canvas. All SimViews are set to have the
same screen rectangle as this LabCanvas by calling
{@link SimView.setScreenRect}.
Notifies any Observers by broadcasting a GenericEvent named
{@link LabCanvas.SIZE_CHANGED}.
@param width  the width of the canvas, in screen coords (pixels)
@param height  the height of the canvas, in screen coords (pixels)
*/
setSize(width: number, height: number): void {
  if (typeof width !== 'number' || width <= 0 || typeof height !== 'number' || height <= 0) {
    throw 'bad size '+width+', '+height;
  }
  this.htmlCanvas_.width = width;
  this.htmlCanvas_.height = height;
  this.notifySizeChanged();
  this.broadcastParameter(LabCanvas.en.WIDTH);
  this.broadcastParameter(LabCanvas.en.HEIGHT);
};

/** Sets the width of the HTML canvas, and sets the screen rectangle of all the
SimViews. Notifies any Observers by broadcasting a GenericEvent named
{@link LabCanvas.SIZE_CHANGED}.
@param value  the width of the canvas, in screen coords (pixels),
*/
setWidth(value: number): void {
  if (Util.veryDifferent(value, this.htmlCanvas_.width)) {
    this.htmlCanvas_.width = value;
  }
  this.notifySizeChanged();
  this.broadcastParameter(LabCanvas.en.WIDTH);
};

/** Name of GenericEvent that is broadcast when the focus view changes.*/
static readonly FOCUS_VIEW_CHANGED = 'FOCUS_VIEW_CHANGED';

/** Name of GenericEvent that is broadcast when the size of the HTML canvas changes.*/
static readonly SIZE_CHANGED = 'SIZE_CHANGED';

/** Name of GenericEvent that is broadcast when the list of SimViews is modified.*/
static readonly VIEW_LIST_MODIFIED = 'VIEW_LIST_MODIFIED';

/** Name of GenericEvent that is broadcast when a SimView is added.*/
static readonly VIEW_ADDED = 'VIEW_ADDED';

/** Name of GenericEvent that is broadcast when a SimView is removed.*/
static readonly VIEW_REMOVED = 'VIEW_REMOVED';

static en: i18n_strings = {
  WIDTH: 'width',
  HEIGHT: 'height',
  ALPHA: 'alpha',
  BACKGROUND: 'background',
};

static de_strings: i18n_strings = {
  WIDTH: 'Breite',
  HEIGHT: 'Höhe',
  ALPHA: 'alpha',
  BACKGROUND: 'Hintergrund',
};

static readonly i18n = Util.LOCALE === 'de' ? LabCanvas.de_strings : LabCanvas.en;
}; // end LabCanvas class

type i18n_strings = {
  WIDTH: string,
  HEIGHT: string,
  ALPHA: string,
  BACKGROUND: string,
}

Util.defineGlobal('lab$view$LabCanvas', LabCanvas);
