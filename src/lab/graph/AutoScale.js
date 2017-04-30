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

goog.provide('myphysicslab.lab.graph.AutoScale');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.graph.GraphLine');
goog.require('myphysicslab.lab.graph.GraphPoint');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Memorizable');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.view.LabView');
goog.require('myphysicslab.lab.view.SimView');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var GenericEvent = myphysicslab.lab.util.GenericEvent;
var GraphLine = myphysicslab.lab.graph.GraphLine;
var LabView = myphysicslab.lab.view.LabView;
var NF = myphysicslab.lab.util.Util.NF;
var NF5 = myphysicslab.lab.util.Util.NF5;
var ParameterBoolean = myphysicslab.lab.util.ParameterBoolean;
var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var ParameterString = myphysicslab.lab.util.ParameterString;
var SimView = myphysicslab.lab.view.SimView;
var Util = myphysicslab.lab.util.Util;
var VarsList = myphysicslab.lab.model.VarsList;

/** Watches the {@link VarsList} of one or more {@link GraphLine} to calculate the
range rectangle that encloses the points on the graphs, and sets accordingly the
`simRect` of a {@link SimView}. The range rectangle is the smallest rectangle that
contains all the points, but possibly expanded by the {@link #extraMargin} factor.


Temporarily Deactivate
----------------------
When the user pans or zooms the graph, we need to **temporarily turn off the auto-scale
behavior**. When the user clicks the "reset" button in the middle of the pan-zoom
control, this means "turn auto-scale back on".

To accomodate these behaviors, AutoScale observes the SimView and GraphLines and will
react to their events as follows (assuming the AutoScale is enabled):

+ AutoScale becomes **inactive** when the SimView's `simRect` is changed by an entity
other than this AutoScale. This happens when AutoScale observes a SimView event called
`SIM_RECT_CHANGED`.

+ AutoScale becomes **active** when one of its GraphLines broadcasts a `RESET` event.
This happens when a graph is cleared, or when the X or Y variable is changed.

You can also directly call {@link #setActive} to make the AutoScale active or inactive
(but it must also be enabled to actually do anything).

To entirely disable an AutoScale, use {@link #setEnabled}.


Time Graph
----------
For a *time graph* where one variable is time, the range rectangle in the time dimension
has a fixed size specified by {@link #setTimeWindow}. The default time window is 10
seconds.


Parameters Created
------------------
+ ParameterBoolean named `ACTIVE`, see {@link #setActive}

+ ParameterString named `AXIS`, see {@link #setAxis}.

+ ParameterBoolean named `ENABLED`, see {@link #setEnabled}

+ ParameterNumber named `TIME_WINDOW`, see {@link #setTimeWindow}.


Events Broadcast
----------------
+ GenericEvent named `AUTO_SCALE` is broadcast when the range rectangle changes. The new
range rectangle is the value of the event.


* @param {string} name name of this AutoScale.
* @param {!GraphLine} graphLine the GraphLine to observe
*     in order to calculate the range rectangle of its points
* @param {!SimView} simView the SimView whose simRect will be
*     modified to the range rectangle
* @constructor
* @final
* @struct
* @extends {AbstractSubject}
* @implements {myphysicslab.lab.util.Memorizable}
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.graph.AutoScale = function(name, graphLine, simView) {
  AbstractSubject.call(this, name);
  if (goog.isDef(graphLine) && !GraphLine.isDuckType(graphLine)) {
    throw new Error('not a GraphLine '+graphLine);
  }
  /** The GraphLines to auto-scale.
  * @type {!Array<!GraphLine>}
  * @private
  */
  this.graphLines_ = [];
  if (GraphLine.isDuckType(graphLine)) {
    this.graphLines_.push(graphLine);
    graphLine.addObserver(this);
  }
  /**
  * @type {!SimView}
  * @private
  */
  this.simView_ = simView;
  simView.addMemo(this);
  simView.addObserver(this);
  /**
  * @type {boolean}
  * @private
  */
  this.enabled_ = true;
  /**
  * @type {boolean}
  * @private
  */
  this.isActive_ = true;
  /** Indicates that the SIM_RECT_CHANGED event was generated by this AutoScale.
  * @type {boolean}
  * @private
  */
  this.ownEvent_ = false;
  /**
  * @type {string}
  * @private
  */
  this.axis_ = AutoScale.BOTH_AXES;
  /** Index of last point seen within GraphPoints list of each GraphLine
  * @type {!Array<number>}
  * @private
  */
  this.lastIndex_ = goog.array.repeat(-1, this.graphLines_.length);
  /** `false` indicates that the range has never been set based on graph data
  * @type {boolean}
  * @private
  */
  this.rangeSetX_ = false;
  /** `false` indicates that the range has never been set based on graph data
  * @type {boolean}
  * @private
  */
  this.rangeSetY_ = false;
  /** the maximum horizontal value of the range, used for calculating the scale
  * @type {number}
  * @private
  */
  this.rangeXHi_ = 0;
  /** the minimum horizontal value of the range, used for calculating the scale
  * @type {number}
  * @private
  */
  this.rangeXLo_ = 0;
  /** the maximum vertical value of the range, used for calculating the scale
  * @type {number}
  * @private
  */
  this.rangeYHi_ = 0;
  /** the minimum vertical value of the range, used for calculating the scale
  * @type {number}
  * @private
  */
  this.rangeYLo_ = 0;
  /** Length of time to include in the range rectangle for a 'time graph'.
  * @type {number}
  * @private
  */
  this.timeWindow_ = 10;
  /** How much extra margin to allocate when expanding the graph range: a fraction
  typically between 0.0 and 1.0, adds this fraction times the current horizontal or
  vertical range.
  This does not guarantee a margin of this amount, it merely reduces the
  frequency of range expansion.  You could for example expand the range, and then
  have succeeding points come very close to the new range so that the graph goes
  very close to the edge but stays within the range.
  * @type {number}
  */
  this.extraMargin = 0.01;
  /** Minimum size that range rectangle can be, for width and height.
  * @type {number}
  */
  this.minSize = 1E-14;
  this.addParameter(new ParameterNumber(this, AutoScale.en.TIME_WINDOW,
      AutoScale.i18n.TIME_WINDOW,
      goog.bind(this.getTimeWindow, this), goog.bind(this.setTimeWindow, this))
      .setSignifDigits(3));
  var choices = [AutoScale.VERTICAL, AutoScale.HORIZONTAL, AutoScale.BOTH_AXES];
  this.addParameter(new ParameterString(this, AutoScale.en.AXIS,
      AutoScale.i18n.AXIS,
      goog.bind(this.getAxis, this), goog.bind(this.setAxis, this), choices, choices));
  this.addParameter(new ParameterBoolean(this, AutoScale.en.ACTIVE,
      AutoScale.i18n.ACTIVE,
      goog.bind(this.getActive, this), goog.bind(this.setActive, this)));
  this.addParameter(new ParameterBoolean(this, AutoScale.en.ENABLED,
      AutoScale.i18n.ENABLED,
      goog.bind(this.getEnabled, this), goog.bind(this.setEnabled, this)));
  this.setComputed(this.isActive_);
};
var AutoScale = myphysicslab.lab.graph.AutoScale;
goog.inherits(AutoScale, AbstractSubject);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  AutoScale.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', enabled_: '+this.enabled_
        +', isActive_: '+this.isActive_
        +', axis_: '+this.axis_
        +', extraMargin: '+NF(this.extraMargin)
        +', minSize: '+NF(this.minSize)
        +', timeWindow_: '+NF(this.timeWindow_)
        +', simView_: '+this.simView_.toStringShort()
        +', graphLines_: ['
        + goog.array.map(this.graphLines_, function(g) { return g.toStringShort(); })
        + ']' + AutoScale.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
AutoScale.prototype.getClassName = function() {
  return 'AutoScale';
};

/** Name of event broadcast when a new enclosing simulation rectangle has been
* calculated.
* @type {string}
* @const
*/
AutoScale.AUTO_SCALE = 'AUTO_SCALE';

/** Specifies both axes option for {@link #setAxis}.
* @type {string}
* @const
*/
AutoScale.BOTH_AXES = 'BOTH_AXES';

/** Specifies horizontal axis option for {@link #setAxis}.
* @type {string}
* @const
*/
AutoScale.HORIZONTAL = 'HORIZONTAL';

/** Specifies vertical axis option for {@link #setAxis}.
* @type {string}
* @const
*/
AutoScale.VERTICAL = 'VERTICAL';

/** Add a GraphLine which will be observed to calculate the range rectangle of points
on the line.
@param {!GraphLine} graphLine the GraphLine to add
*/
AutoScale.prototype.addGraphLine = function(graphLine) {
  if (GraphLine.isDuckType(graphLine)) {
    if (!goog.array.contains(this.graphLines_, graphLine)) {
      this.graphLines_.push(graphLine);
      this.lastIndex_.push(-1);
    }
  } else {
    throw new Error('not a GraphLine '+graphLine);
  }
};

/** Clears the range rectangle, continues calculating from latest entry in HistoryList.
* @return {undefined}
*/
AutoScale.prototype.clearRange = function() {
  this.rangeXLo_ = 0;
  this.rangeXHi_ = 0;
  this.rangeSetX_ = false;
  this.rangeYLo_ = 0;
  this.rangeYHi_ = 0;
  this.rangeSetY_ = false;
};

/** Returns whether is AutoScale is active.  See {@link #setActive}.
* @return {boolean} whether is AutoScale is active
*/
AutoScale.prototype.getActive = function() {
  return this.isActive_;
};

/** Returns which axis should be auto scaled: one of `VERTICAL`, `HORIZONTAL`, or
`BOTH_AXES`.
@return {string} which axis should be auto scaled
*/
AutoScale.prototype.getAxis = function() {
  return this.axis_;
};

/** Returns whether is AutoScale is enabled.  See {@link #setEnabled}.
* @return {boolean} whether is AutoScale is enabled
*/
AutoScale.prototype.getEnabled = function() {
  return this.enabled_;
};

/** Returns the range rectangle that encloses points on the GraphLines, including any
extra margin. Note that this rectangle might not correspond to the SimView's simulation
rectangle, see {@link #setAxis}.
* @return {!DoubleRect} the range rectangle that encloses points
*    on the GraphLines
*/
AutoScale.prototype.getRangeRect = function() {
  return new DoubleRect(this.rangeXLo_, this.rangeYLo_, this.rangeXHi_, this.rangeYHi_);
};

/** Returns length of time to include in the range rectangle for a *time graph*.
* @return {number} length of time to include in the range rectangle
*/
AutoScale.prototype.getTimeWindow = function() {
  return this.timeWindow_;
};

/** @inheritDoc */
AutoScale.prototype.memorize = function() {
  for (var i=0, n=this.graphLines_.length; i<n; i++) {
    var graphPts = this.graphLines_[i].getGraphPoints();
    // Detect when graphLine has been reset.
    if (this.lastIndex_[i] > graphPts.getEndIndex()) {
      this.reset();
    }
  }
  for (i=0, n=this.graphLines_.length; i<n; i++) {
    graphPts = this.graphLines_[i].getGraphPoints();
    var iter = graphPts.getIterator(this.lastIndex_[i]);
    while (iter.hasNext()) {
      /** @type {!myphysicslab.lab.graph.GraphPoint} */
      var gp = iter.nextValue();
      this.updateRange_(this.graphLines_[i], gp.x, gp.y);
      this.lastIndex_[i] = iter.getIndex();
    }
  }
  this.rangeCheck_();
};

/** @inheritDoc */
AutoScale.prototype.observe =  function(event) {
  if (event.getSubject() == this.simView_) {
    if (event.nameEquals(LabView.SIM_RECT_CHANGED)) {
      if (!this.ownEvent_) {
        // Become inactive when the SimView's simRect is changed by an entity other
        // than this AutoScale.
        this.setActive(false);
      }
    }
  } else if (goog.array.contains(this.graphLines_, event.getSubject())) {
    if (event.nameEquals(GraphLine.en.X_VARIABLE) ||
        event.nameEquals(GraphLine.en.Y_VARIABLE)) {
      // the GraphLine's X or Y variable has changed
      this.reset();
    } else if (event.nameEquals(GraphLine.RESET)) {
      // This has the effect of turning AutoScale back on
      // after clicking the 'clear graph' button.
      this.setActive(true);
    }
  }
};

/** When the range rectangle changes, this will broadcast a GenericEvent named
`AUTO_SCALE`.
@private
*/
AutoScale.prototype.rangeCheck_ = function() {
  var avg, incr;
  var e = this.minSize;
  // set range rectangle to minimum size, when range is very tiny
  // (but choose an increment that is big enough to make hi & lo different numbers)
  if (this.rangeXHi_ - this.rangeXLo_ < e) {
    avg = (this.rangeXHi_ + this.rangeXLo_)/2;
    incr = Math.max(avg*e, e);
    this.rangeXHi_ = avg + incr;
    this.rangeXLo_ = avg - incr;
  }
  if (this.rangeYHi_ - this.rangeYLo_ < e) {
    avg = (this.rangeYHi_ + this.rangeYLo_)/2;
    incr = Math.max(avg*e, e);
    this.rangeYHi_ = avg + incr;
    this.rangeYLo_ = avg - incr;
  }
  var nr = this.getRangeRect();
  var sr = this.simView_.getSimRect();
  if (this.axis_ == AutoScale.VERTICAL) {
    // set vertical range, but retain existing horiz range
    nr = new DoubleRect(sr.getLeft(), nr.getBottom(),
        sr.getRight(), nr.getTop());
  } else if (this.axis_ == AutoScale.HORIZONTAL) {
    // set horizontal range, but retain existing vertical range
    nr = new DoubleRect(nr.getLeft(), sr.getBottom(),
        nr.getRight(), sr.getTop());
  }
  if (this.isActive_ && !nr.nearEqual(sr)) {
    this.ownEvent_ = true;
    this.simView_.setSimRect(nr);
    this.ownEvent_ = false;
    this.broadcast(new GenericEvent(this, AutoScale.AUTO_SCALE, nr));
  }
};

/** Remove a GraphLine, it will no longer be observed for calculating the range
rectangle of points on the line.
@param {!GraphLine} graphLine the GraphLine to remove
*/
AutoScale.prototype.removeGraphLine = function(graphLine) {
  if (GraphLine.isDuckType(graphLine)) {
    var idx = goog.array.indexOf(this.graphLines_, graphLine);
    goog.array.removeAt(this.graphLines_, idx);
    goog.array.removeAt(this.lastIndex_, idx);
    goog.asserts.assert(!goog.array.contains(this.graphLines_, graphLine));
    this.reset();
  } else {
    throw new Error('not a GraphLine '+graphLine);
  }
};

/** Clears the range rectangle, and starts calculating from first entry in HistoryList.
* Note that you will need to call {@link #memorize} to have the range recalculated.
* @return {undefined}
*/
AutoScale.prototype.reset = function() {
  this.clearRange();
  for (var i=0, n=this.lastIndex_.length; i<n; i++) {
    this.lastIndex_[i] = -1;
  }
};

/** Sets whether this AutoScale is active.  When not active, the range rectangle
is not updated and the SimView's simulation rectangle is not modified. When changed
to be active, this will also call {@link #reset}.

The AutoScale must be enabled in order to become active, see {@link #setEnabled}.
If not enabled, then this method can only make the AutoScale inactive.

* @param {boolean} value whether this AutoScale should be active
*/
AutoScale.prototype.setActive = function(value) {
  if (this.isActive_ != value) {
    if (value) {
      if (this.enabled_) {
        this.reset();
        this.simView_.addMemo(this);
        this.setComputed(true);
        this.isActive_ = true;
        this.broadcastParameter(AutoScale.en.ACTIVE);
      }
    } else {
      this.simView_.removeMemo(this);
      this.setComputed(false);
      this.isActive_ = false;
      this.broadcastParameter(AutoScale.en.ACTIVE);
    }
  }
  goog.asserts.assert(this.enabled_ || !this.isActive_);
};

/** Set which axis to auto scale: one of `VERTICAL`, `HORIZONTAL`, or `BOTH_AXES`.
@param {string} value which axis should be auto scaled
*/
AutoScale.prototype.setAxis = function(value) {
  if (value == AutoScale.VERTICAL || value == AutoScale.HORIZONTAL
      || value == AutoScale.BOTH_AXES) {
    this.axis_ = value;
    this.broadcastParameter(AutoScale.en.AXIS);
  } else {
    throw new Error('unknown '+value);
  }
};

/** Marks the SimView's Parameters as to whether they are automatically computed
depending on whether this AutoScale is active.
* @param {boolean} value whether this AutoScale is computing the Parameter values
* @private
*/
AutoScale.prototype.setComputed = function(value) {
  var names = [SimView.en.WIDTH, SimView.en.HEIGHT, SimView.en.CENTER_X,
      SimView.en.CENTER_Y];
  goog.array.forEach(names, goog.bind(function(name) {
      var p = this.simView_.getParameter(name);
      p.setComputed(value);
    }, this));
};

/** Sets whether this AutoScale is enabled. The AutoScale must be enabled in order
to be active.  See {@link #setActive}.
* @param {boolean} value whether this AutoScale should be enabled
*/
AutoScale.prototype.setEnabled = function(value) {
  if (this.enabled_ != value) {
    this.enabled_ = value;
    this.setActive(value);
    this.broadcastParameter(AutoScale.en.ENABLED);
  }
  goog.asserts.assert(this.enabled_ || !this.isActive_);
};

/** Sets length of time to include in the range rectangle for a *time graph*,
* and sets the AutoScale to be active. See {@link #setActive}.
* @param {number} value length of time to include in the range rectangle
*/
AutoScale.prototype.setTimeWindow = function(value) {
  if (Util.veryDifferent(value, this.timeWindow_)) {
    this.timeWindow_ = value;
    this.reset();
    // this fixes following bug: click pan-zoom control which makes AutoScale inactive;
    // then change the time window, but nothing happens.
    this.setActive(true);
    this.broadcastParameter(AutoScale.en.TIME_WINDOW);
  }
};

/** Updates the graph range to include the given point. For time variable, limit the
range to the timeWindow. For non-time variable, expand the range an extra amount when
the range is exceeded; this helps avoid too many visually distracting updates.
* @param {!GraphLine} line
* @param {number} nowX
* @param {number} nowY
* @private
*/
AutoScale.prototype.updateRange_ = function(line, nowX, nowY) {
  // To avoid infinity in the range, store a very large number instead.
  // Largest double precision floating point number is approx 1.8 * 10^308
  if (!isFinite(nowX)) {
    if (nowX == Number.POSITIVE_INFINITY) {
      nowX = 1e308;
    } else if (nowX == Number.NEGATIVE_INFINITY) {
      nowX = -1e308;
    }
  }
  if (!isFinite(nowY)) {
    if (nowY == Number.POSITIVE_INFINITY) {
      nowY = 1e308;
    } else if (nowY == Number.NEGATIVE_INFINITY) {
      nowY = -1e308;
    }
  }
  var timeIdx = line.getVarsList().timeIndex();
  var xIsTimeVar = line.getXVariable() == timeIdx;
  var yIsTimeVar = line.getYVariable() == timeIdx;
  if (!this.rangeSetX_) {
    this.rangeXLo_ = nowX;
    this.rangeXHi_ = nowX + (xIsTimeVar ? this.timeWindow_ : 0);
    this.rangeSetX_ = true;
  } else {
    if (nowX < this.rangeXLo_) {
      if (xIsTimeVar) {
        this.rangeXLo_ = nowX;
        this.rangeXHi_ = nowX + this.timeWindow_;
      } else {
        this.rangeXLo_ = nowX - this.extraMargin*(this.rangeXHi_ - this.rangeXLo_);
      }
    }
    if (xIsTimeVar) {
      // In 'time graph', have extra space on right side so we can see
      // the leading edge hotspots.
      if (nowX > this.rangeXHi_ - this.extraMargin * this.timeWindow_) {
          this.rangeXHi_ = nowX + this.extraMargin * this.timeWindow_;
          this.rangeXLo_ = this.rangeXHi_ - this.timeWindow_;
      }
    } else {
      if (nowX > this.rangeXHi_) {
        this.rangeXHi_ = nowX + this.extraMargin*(this.rangeXHi_ - this.rangeXLo_);
      }
    }
  }
  if (!this.rangeSetY_) {
    this.rangeYLo_ = nowY;
    this.rangeYHi_ = nowY + (yIsTimeVar ? this.timeWindow_ : 0);
    this.rangeSetY_ = true;
  } else {
    if (nowY < this.rangeYLo_) {
      if (yIsTimeVar) {
        this.rangeYLo_ = nowY;
        this.rangeYHi_ = nowY + this.timeWindow_;
      } else {
        this.rangeYLo_ = nowY - this.extraMargin*(this.rangeYHi_ - this.rangeYLo_);
      }
    }
    if (yIsTimeVar) {
      // In 'time graph', have extra space on top so we can see
      // the leading edge hotspots.
      if (nowY > this.rangeYHi_ - this.extraMargin * this.timeWindow_) {
        this.rangeYHi_ = nowY + this.extraMargin * this.timeWindow_;
        this.rangeYLo_ = this.rangeYHi_ - this.timeWindow_;
      }
    } else {
      if (nowY > this.rangeYHi_) {
        this.rangeYHi_ = nowY + this.extraMargin*(this.rangeYHi_ - this.rangeYLo_);
      }
    }
  }
};

/** Set of internationalized strings.
@typedef {{
  AXIS: string,
  TIME_WINDOW: string,
  ACTIVE: string,
  ENABLED: string
  }}
*/
AutoScale.i18n_strings;

/**
@type {AutoScale.i18n_strings}
*/
AutoScale.en = {
  AXIS: 'axis',
  TIME_WINDOW: 'time window',
  ACTIVE: 'active',
  ENABLED: 'enabled'
};

/**
@private
@type {AutoScale.i18n_strings}
*/
AutoScale.de_strings = {
  AXIS: 'Achse',
  TIME_WINDOW: 'Zeitfenster',
  ACTIVE: 'aktiviert',
  ENABLED: 'ermöglichte'
};

/** Set of internationalized strings.
@type {AutoScale.i18n_strings}
*/
AutoScale.i18n = goog.LOCALE === 'de' ? AutoScale.de_strings :
    AutoScale.en;

});  // goog.scope
