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

goog.provide('myphysicslab.lab.view.LabCanvas');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.ConcreteMemoList');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.MemoList');
goog.require('myphysicslab.lab.util.Memorizable');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.CoordMap');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.LabView');
goog.require('myphysicslab.lab.view.ScreenRect');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var ConcreteMemoList = myphysicslab.lab.util.ConcreteMemoList;
var CoordMap = myphysicslab.lab.view.CoordMap;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var GenericEvent = myphysicslab.lab.util.GenericEvent;
var LabView = myphysicslab.lab.view.LabView;
var MemoList = myphysicslab.lab.util.MemoList;
var Memorizable = myphysicslab.lab.util.Memorizable;
var NF5 = myphysicslab.lab.util.Util.NF5;
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var ParameterString = myphysicslab.lab.util.ParameterString;
var ScreenRect = myphysicslab.lab.view.ScreenRect;
var Util = myphysicslab.lab.util.Util;

/** Manages an HTML canvas and contains a list of {@link LabView}s which are drawn into
the canvas. The LabViews are drawn overlapping so that the last LabView appears on
top of the others.

### Canvas Size

The HTML canvas has a specified width and height, which determines
the *screen rectangle* of the canvas. The canvas screen rectangle has `(0, 0)` for
the top-left corner and `(width, height)` for the bottom-right corner. The vertical
coordinates increase downwards.

The size can be changed via {@link #setWidth}, {@link #setHeight},
{@link #setSize} or {@link #setScreenRect}. When the size of the HTML canvas changes,
the LabViews are set to have the same screen rectangle as the canvas.

Each LabView has a simulation rectangle and a screen rectangle, and these are aligned
by a {@link CoordMap}. The simulation rectangle specifies the simulation coordinates,
and the CoordMap translates simulation coordinates to screen coordinates. Pan and zoom
can be accomplished by changing the simulation rectangle of a LabView (which changes
its CoordMap accordingly).


<a name="focusview"></a>
### Focus View

The {@link #getFocusView focus view} is the LabView that the user expects to modify by
his/her actions. For example, {@link myphysicslab.lab.app.SimController} will pan the
focus LabView when a particular set of modifier keys are pressed during a mouse drag.

The first LabView that is added becomes the initial focus view, but the focus view can
be changed via {@link #setFocusView}.


### Background Color

Whenever {@link #paint} is called to draw a new frame, the first step is to clear the
old frame from the HTML canvas. What happens depends on the
{@link #getBackground background color}.

+ If no background color is specified then we use JavaScript `canvas.clearRect()`
    which clears to transparent black pixels.

+ If a background color is specified, then we use JavaScript `canvas.fillRect()`
    which fills the HTML canvas with that color.

The background color can be set with {@link #setBackground}.


### Trails Effect

A visual effect where moving objects leave behind a smeared out trail can be done by
setting the background color and the *alpha transparency*, see {@link #setAlpha}.
Here are example settings, which can be done in a
{@link myphysicslab.lab.util.Terminal} session:

    simCanvas.setBackground('black');
    simCanvas.setAlpha(0.05);

When `alpha` is 1.0 then there is no trails effect because the old frame is entirely
painted over with an opaque color.

The trails effect happens when `alpha` is less than 1 because we paint a translucent
rectangle over the old frame, which gradually makes the old image disappear after
several iterations of painting.


Parameters Created
------------------

+ ParameterNumber named `WIDTH`, see {@link #setWidth}

+ ParameterNumber named `HEIGHT`, see {@link #setHeight}

+ ParameterNumber named `ALPHA`, see {@link #setAlpha}

+ ParameterString named `BACKGROUND`, see {@link #setBackground}


Events Broadcast
----------------
All the Parameters are broadcast when their values change.  In addition:

+ GenericEvent named `VIEW_ADDED`; the value is the LabView being added

+ GenericEvent named `VIEW_REMOVED`; the value is the LabView being removed

+ GenericEvent named `FOCUS_VIEW_CHANGED`; the value is the LabView which is
    the focus, or `null` if there is no focus view

+ GenericEvent named `VIEW_LIST_MODIFIED`

+ GenericEvent named `SIZE_CHANGED`


* @param {!HTMLCanvasElement} canvas the HTML canvas to manage
* @param {string} name name of this LabCanvas
* @constructor
* @final
* @struct
* @extends {AbstractSubject}
* @implements {MemoList}
*/
myphysicslab.lab.view.LabCanvas = function(canvas, name) {
  AbstractSubject.call(this, name);
  /**
  * @type {!HTMLCanvasElement}
  * @private
  */
  this.canvas_ = canvas;
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
  canvas.contentEditable = false;
  /**
  /**
  * @type {!Array<!LabView>}
  * @private
  */
  this.labViews_ = [];
  /**
  * @type {!MemoList}
  * @private
  */
  this.memoList_ = new ConcreteMemoList();
  /** The view which is the main focus and is drawn normally.
  * @type {?LabView}
  * @private
  */
  this.focusView_ = null;
  /** The transparency used when painting the background color; a number between
  * 0.0 (fully transparent) and 1.0 (fully opaque).
  * @type {number}
  * @private
  */
  this.alpha_ = 1.0;
  /** The background color; either a CSS3 color value or the empty string. Transparent
  * black is used if it is the empty string.
  * @type {string}
  * @private
  */
  this.background_ = '';
  /**
  * @type {boolean}
  * @private
  * @const
  */
  this.debug_ = false;
  this.addParameter(new ParameterNumber(this, LabCanvas.en.WIDTH,
      LabCanvas.i18n.WIDTH, goog.bind(this.getWidth, this),
      goog.bind(this.setWidth, this)));
  this.addParameter(new ParameterNumber(this, LabCanvas.en.HEIGHT,
      LabCanvas.i18n.HEIGHT, goog.bind(this.getHeight, this),
      goog.bind(this.setHeight, this)));
  this.addParameter(new ParameterNumber(this, LabCanvas.en.ALPHA,
      LabCanvas.i18n.ALPHA, goog.bind(this.getAlpha, this),
      goog.bind(this.setAlpha, this)));
  this.addParameter(new ParameterString(this, LabCanvas.en.BACKGROUND,
      LabCanvas.i18n.BACKGROUND, goog.bind(this.getBackground, this),
      goog.bind(this.setBackground, this)));
};
var LabCanvas = myphysicslab.lab.view.LabCanvas;
goog.inherits(LabCanvas, AbstractSubject);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  LabCanvas.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', width: '+this.canvas_.width
        +', height: '+this.canvas_.height
        +', background_: "'+this.background_+'"'
        +', alpha_: '+NF5(this.alpha_)
        +', focusView_: '
        + (this.focusView_ == null ? 'null' : this.focusView_.toStringShort())
        +', labViews_: ['
        + goog.array.map(this.labViews_, function(v) { return v.toStringShort(); })
        +'], memoList_: '+this.memoList_
        + LabCanvas.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
LabCanvas.prototype.getClassName = function() {
  return 'LabCanvas';
};

/** Name of GenericEvent that is broadcast when the focus view changes.
* @type {string}
* @const
*/
LabCanvas.FOCUS_VIEW_CHANGED = 'FOCUS_VIEW_CHANGED';

/** Name of GenericEvent that is broadcast when the size of the HTML canvas changes.
* @type {string}
* @const
*/
LabCanvas.SIZE_CHANGED = 'SIZE_CHANGED';

/** Name of GenericEvent that is broadcast when the list of LabViews is modified.
* @type {string}
* @const
*/
LabCanvas.VIEW_LIST_MODIFIED = 'VIEW_LIST_MODIFIED';

/** Name of GenericEvent that is broadcast when a LabView is added.
* @type {string}
* @const
*/
LabCanvas.VIEW_ADDED = 'VIEW_ADDED';

/** Name of GenericEvent that is broadcast when a LabView is removed.
* @type {string}
* @const
*/
LabCanvas.VIEW_REMOVED = 'VIEW_REMOVED';

/** @inheritDoc */
LabCanvas.prototype.addMemo = function(memorizable) {
  this.memoList_.addMemo(memorizable);
};

/** Adds the LabView to the end of the list of LabViews displayed and memorized by this
LabCanvas. Makes the LabView the focus view if there isn't currently a focus view.
Notifies any Observers by broadcasting GenericEvents named {@link #VIEW_ADDED} and
{@link #VIEW_LIST_MODIFIED} and possibly also {@link #FOCUS_VIEW_CHANGED}.
@param {!LabView} view the LabView to add
*/
LabCanvas.prototype.addView = function(view) {
  goog.asserts.assertObject(view);
  if (this.getWidth() > 0 && this.getHeight() > 0) {
    var sr = new ScreenRect(0, 0, this.getWidth(), this.getHeight());
    //console.log('LabCanvas.addView of '+view+' sr='+sr);
    view.setScreenRect(sr);
  }
  this.labViews_.push(view);
  this.addMemo(view);
  this.broadcast(new GenericEvent(this, LabCanvas.VIEW_ADDED, view));
  this.broadcast(new GenericEvent(this, LabCanvas.VIEW_LIST_MODIFIED));
  // set the first view added to be the focus.
  if (this.focusView_==null) {
    this.setFocusView(view);
  }
};

/** Moves the keyboard focus to the HTML canvas.
* @return {undefined}
*/
LabCanvas.prototype.focus = function() {
  // Move the keyboard focus to the canvas.  This is desirable so that if
  // the user was editing a text field, it ends that editing operation.
  // see http://stackoverflow.com/questions/1829586/
  //     how-do-i-give-an-html-canvas-the-keyboard-focus-using-jquery
  this.canvas_.focus();
};

/** Returns the transparency used when painting the background color;
a number between 0.0 (fully transparent) and 1.0 (fully opaque).
Only has an effect if the background color is non-empty string.
* @return {number} transparency used when painting, between 0 and 1.
*/
LabCanvas.prototype.getAlpha = function() {
  return this.alpha_;
};

/** Returns the background color; either a CSS3 color value or the empty string. Empty
string means that background is cleared to transparent black.
* @return {string} the background color; either a CSS3 color value or the empty string
*/
LabCanvas.prototype.getBackground = function() {
  return this.background_;
};

/** Returns the HTML canvas being managed by this LabCanvas.
* @return {!HTMLCanvasElement} the HTML canvas being managed by this LabCanvas
*/
LabCanvas.prototype.getCanvas = function() {
  return this.canvas_;
};

/** Returns the CanvasRenderingContext2D used for drawing into the HTML canvas being
* managed by this LabCanvas.
* @return {!CanvasRenderingContext2D} the CanvasRenderingContext2D used for drawing
*   into the HTML canvas
*/
LabCanvas.prototype.getContext = function() {
  return /** @type {!CanvasRenderingContext2D} */(this.canvas_.getContext('2d'));
};

/** Returns the focus LabView which the user expects to modify by his/her actions.
* @return {?LabView} the focus LabView, or `null` when there is no focus LabView
*/
LabCanvas.prototype.getFocusView = function() {
  return this.focusView_;
};

/** Returns the height of the HTML canvas, in screen coords (pixels).
* @return {number} the height of the HTML canvas, in screen coords (pixels)
*/
LabCanvas.prototype.getHeight = function() {
  return this.canvas_.height;
};

/** @inheritDoc */
LabCanvas.prototype.getMemos = function() {
  return this.memoList_.getMemos();
};

/** Returns the ScreenRect corresponding to the area of the HTML canvas.
The top-left coordinate is always (0,0).  This does not represent the location
of the canvas within the document or window.
@return {!ScreenRect} the ScreenRect corresponding to the area of the HTML canvas.
*/
LabCanvas.prototype.getScreenRect = function() {
  return new ScreenRect(0, 0, this.canvas_.width, this.canvas_.height);
};

/**  Returns list of the LabViews in this LabCanvas.
@return {!Array<!LabView>} list of LabViews in this LabCanvas
*/
LabCanvas.prototype.getViews = function() {
  return goog.array.clone(this.labViews_);
};

/** Returns the width of the HTML canvas, in screen coords (pixels).
* @return {number} the width of the HTML canvas, in screen coords (pixels)
*/
LabCanvas.prototype.getWidth = function() {
  return this.canvas_.width;
};

/** @inheritDoc */
LabCanvas.prototype.memorize = function() {
  this.memoList_.memorize();
};

/**
@return {undefined}
@private
*/
LabCanvas.prototype.notifySizeChanged = function() {
  var r = this.getScreenRect();
  goog.array.forEach(this.labViews_, function(view) {
    view.setScreenRect(r);
  });
  this.broadcast(new GenericEvent(this, LabCanvas.SIZE_CHANGED));
};

/** Clears the canvas to the background color; then paints each LabView.
See {@link #setBackground} and {@link #setAlpha}.
@return {undefined}
*/
LabCanvas.prototype.paint = function() {
  // Avoid painting when the canvas is hidden.
  // http://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
  // According to MDN documentation, an element's offsetParent property will return
  // `null` whenever it, or any of its parents, is hidden via the display style
  // property. Just make sure that the element doesnt have 'position:fixed;'.
  if (this.canvas_.offsetParent != null) {
    var context = /** @type {!CanvasRenderingContext2D} */
        (this.canvas_.getContext('2d'));
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
        context.fillRect(0, 0, this.canvas_.width, this.canvas_.height);
        context.globalAlpha = 1;
      } else {
        // clearRect sets all pixels in the rectangle to transparent black,
        // erasing any previously drawn content.
        // clearRect is supposed to be faster than fillRect.
        context.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
      }
      goog.array.forEach(this.labViews_, function(view) {
          view.paint(context);
        });
    } finally {
      context.restore();
    }
  }
};

/** @inheritDoc */
LabCanvas.prototype.removeMemo = function(memorizable) {
  this.memoList_.removeMemo(memorizable);
};

/** Removes the LabView from the list of LabViews displayed and memorized by this
LabCanvas. Sets the focus view to be the first view in remaining list of LabViews.
Notifies any Observers by broadcasting GenericEvents named {@link #VIEW_LIST_MODIFIED}
and {@link #VIEW_REMOVED} and possibly also {@link #FOCUS_VIEW_CHANGED}.
* @param {!LabView} view the LabView to remove
*/
LabCanvas.prototype.removeView = function(view) {
  goog.asserts.assertObject(view);
  goog.array.remove(this.labViews_, view);
  this.removeMemo(view);
  if (this.focusView_==view) {
    // pick first view to focus on, if possible
    this.setFocusView(goog.array.isEmpty(this.labViews_) ? null : this.labViews_[0]);
  }
  this.broadcast(new GenericEvent(this, LabCanvas.VIEW_REMOVED, view));
  this.broadcast(new GenericEvent(this, LabCanvas.VIEW_LIST_MODIFIED));
};

/** Sets the transparency used when painting the background color;
a number between 0.0 (fully transparent) and 1.0 (fully opaque).
Only has an effect if the background color is non-empty string.
* @param {number} value transparency used when painting, between 0 and 1
*/
LabCanvas.prototype.setAlpha = function(value) {
  if (Util.veryDifferent(this.alpha_, value)) {
    this.alpha_ = value;
    // Alpha has no effect when background is empty string which means
    // "clear to transparent black". Set background to white in that case.
    if (Util.veryDifferent(value, 1) && this.background_ == '') {
      this.setBackground('white');
    }
    this.broadcastParameter(LabCanvas.en.ALPHA);
  }
};

/** Sets the background color; either a CSS3 color value or the empty string. Empty
string means that background is cleared to transparent black.
* @param {string} value the background color; either a CSS3 color value or the empty
*    string
*/
LabCanvas.prototype.setBackground = function(value) {
  if (this.background_ != value) {
    this.background_ = value;
    this.broadcastParameter(LabCanvas.en.BACKGROUND);
  }
};

/** Sets the focus LabView which is the main focus of the LabCanvas. Notifies any
observers that the focus has changed by broadcasting the GenericEvent named
{@link #FOCUS_VIEW_CHANGED}.
@param {?LabView} view the view that should be the focus; can be
    `null` when no LabView has the focus.
@throws {Error} if `view` is not contained by this LabCanvas
*/
LabCanvas.prototype.setFocusView = function(view) {
  if (view != null && !goog.array.contains(this.labViews_, view))
    throw new Error('cannot set focus to unknown view '+view);
  if (this.focusView_ != view) {
    if (this.focusView_ != null) {
      this.focusView_.loseFocus();
    }
    this.focusView_ = view;
    if (view != null) {
      view.gainFocus();
    }
    this.broadcast(new GenericEvent(this, LabCanvas.FOCUS_VIEW_CHANGED, view));
  }
};

/** Sets the height of the HTML canvas, and sets the screen rectangle of all the
LabViews. Notifies any Observers by broadcasting a GenericEvent named
{@link #SIZE_CHANGED}.
@param {number} value  the height of the canvas, in screen coords (pixels),
*/
LabCanvas.prototype.setHeight = function(value) {
  if (Util.veryDifferent(value, this.canvas_.height)) {
    this.canvas_.height = value;
  }
  this.notifySizeChanged();
  this.broadcastParameter(LabCanvas.en.HEIGHT);
};

/** Sets the size of this LabCanvas to the given ScreenRect by calling {@link #setSize}.
@param {!ScreenRect} sr  specifies the width and height; the top-left must be (0,0).
@throws {Error} if the top-left of the given ScreenRect is not (0,0).
*/
LabCanvas.prototype.setScreenRect = function(sr) {
  if (!ScreenRect.isDuckType(sr)) {
    throw new Error('not a ScreenRect '+sr);
  }
  if (sr.getTop() != 0 || sr.getLeft() != 0) {
    throw new Error('top left must be 0,0, was: '+sr);
  }
  this.setSize(sr.getWidth(), sr.getHeight());
};

/** Sets the size of the HTML canvas. All LabViews are set to have the
same screen rectangle as this LabCanvas by calling {@link LabView#setScreenRect}.
Notifies any Observers by broadcasting a GenericEvent named {@link #SIZE_CHANGED}.
@param {number} width  the width of the canvas, in screen coords (pixels)
@param {number} height  the height of the canvas, in screen coords (pixels)
*/
LabCanvas.prototype.setSize = function(width, height) {
  if (!goog.isNumber(width) || width <= 0 || !goog.isNumber(height) || height <= 0) {
    throw new Error('bad size '+width+', '+height);
  }
  this.canvas_.width = width;
  this.canvas_.height = height;
  this.notifySizeChanged();
  this.broadcastParameter(LabCanvas.en.WIDTH);
  this.broadcastParameter(LabCanvas.en.HEIGHT);
};

/** Sets the width of the HTML canvas, and sets the screen rectangle of all the
LabViews. Notifies any Observers by broadcasting a GenericEvent named
{@link #SIZE_CHANGED}.
@param {number} value  the width of the canvas, in screen coords (pixels),
*/
LabCanvas.prototype.setWidth = function(value) {
  if (Util.veryDifferent(value, this.canvas_.width)) {
    this.canvas_.width = value;
  }
  this.notifySizeChanged();
  this.broadcastParameter(LabCanvas.en.WIDTH);
};

/** Set of internationalized strings.
@typedef {{
  WIDTH: string,
  HEIGHT: string,
  ALPHA: string,
  BACKGROUND: string
  }}
*/
LabCanvas.i18n_strings;

/**
@type {LabCanvas.i18n_strings}
*/
LabCanvas.en = {
  WIDTH: 'width',
  HEIGHT: 'height',
  ALPHA: 'alpha',
  BACKGROUND: 'background'
};

/**
@private
@type {LabCanvas.i18n_strings}
*/
LabCanvas.de_strings = {
  WIDTH: 'Breite',
  HEIGHT: 'H\u00f6he',
  ALPHA: 'alpha',
  BACKGROUND: 'Hintergrund'
};

/** Set of internationalized strings.
@type {LabCanvas.i18n_strings}
*/
LabCanvas.i18n = goog.LOCALE === 'de' ? LabCanvas.de_strings :
    LabCanvas.en;

}); // goog.scope
