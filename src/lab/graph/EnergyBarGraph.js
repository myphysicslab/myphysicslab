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

goog.provide('myphysicslab.lab.graph.EnergyBarGraph');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.model.EnergyInfo');
goog.require('myphysicslab.lab.model.EnergySystem');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayObject');
goog.require('myphysicslab.lab.view.ScreenRect');

goog.scope(function() {

var DisplayObject = myphysicslab.lab.view.DisplayObject;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var EnergyInfo = myphysicslab.lab.model.EnergyInfo;
var EnergySystem = myphysicslab.lab.model.EnergySystem;
var NF = myphysicslab.lab.util.Util.NF;
var NFE = myphysicslab.lab.util.Util.NFE;
var ScreenRect = myphysicslab.lab.view.ScreenRect;
var SimObject = myphysicslab.lab.model.SimObject;
var Util = myphysicslab.lab.util.Util;
var Vector = myphysicslab.lab.util.Vector;

/** Displays a bar graph of the various forms of energy (potential, kinetic, etc.) in an
{@link EnergySystem}. The visible area must be set via
{@link #setVisibleArea} in order for EnergyBarGraph to draw.


### Display Formats

If the {@link EnergyInfo} of the EnergySystem only has data for
the potential and translational energy, then the names shown are 'potential' and
'kinetic' (in English, the names are translated for the current locale). Here is the
display for a typical situation:

*```
* 0                2                4                 6                 8
* ---------- potential ----------  *********** kinetic ***********
*                                                         total  ^
*```

If the EnergyInfo returns a value other than `NaN` for the **rotational energy**, then
the the names shown are 'potential', 'translational', and 'rotational'. Here is the
display for a typical situation:

*```
* 0                2                4                 6                 8
* ----- potential -----  ***** rotational *****  ===== translational ======
*                                                                  total  ^
*```

When potential energy is positive, all the energy components are on the same line of
the graph, as shown above.

When **potential energy is negative**, the potential energy is shown on a
separate line of the bar graph, extending left from the zero position; the kinetic and
rotational energy is drawn underneath the potential energy bar starting from the left.
Here is a typical situation:

*```
*     -2               0               2                 4
* ----- potential -----
* ******* rotational *******  ===== translational ======
*                                                total ^
*```

EnergyBarGraph draws with a transparent white rectangle to ensure it is readable
against a black background.


### Color and Font

Public properties can be set for changing the color of the bars and the font used.
See {@link #graphFont}, {@link #potentialColor}, {@link #translationColor}, and
{@link #rotationColor}.

### Position and Size

The EnergyBarGraph will only draw after the visible area has been set via
{@link #setVisibleArea}. Usually this is set to be the entire visible area of the
{@link myphysicslab.lab.view.LabView} containing the EnergyBarGraph.

The width of the EnergyBarGraph is always the full width of the visible area.

The vertical position of the EnergyBarGraph is initially at the top of the visible area.
If the EnergyBarGraph is not moved, then whenever the visible area is changed we
continue to align the EnergyBarGraph at the top of the visible area.

Once the EnergyBarGraph is moved via {@link #setPosition}, we retain that vertical
position when the visible area changes, except that we ensure the EnergyBarGraph is
entirely within the visible area.


@todo Create some unit tests for this? It is complex enough that it could benefit.
For example, see the kludge about 'energy is zero at startup' which previously resulted
in an assertion failing.

@todo larger fonts (size 14) have formatting problems where the text is overlapping
the color key and other pieces of text. (Nov 2012)

* @param {!EnergySystem} system the EnergySystem to display
* @constructor
* @final
* @struct
* @implements {DisplayObject}
*/
myphysicslab.lab.graph.EnergyBarGraph = function(system) {
  /** The font to use for numbers on the bar chart energy graph, a CSS3 font
  * specification.
  * @type {string}
  */
  this.graphFont = '10pt sans-serif';
  /**
  * @type {!EnergySystem}
  * @private
  */
  this.system_ = system;
  /** the bounding rectangle, in simulation coords
  * @type {!DoubleRect}
  * @private
  */
  this.rect_ = DoubleRect.EMPTY_RECT;
  /**  Font ascent in pixels (guesstimate).
  * @todo find a way to get this for the current font, similar to the
  * TextMetrics object.
  * http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript
  * http://pomax.nihongoresources.com/pages/Font.js/
  * @type {number}
  * @private
  */
  this.fontDescent_ = 8;
  /**  Font ascent in pixels (guesstimate).
  * @type {number}
  * @private
  */
  this.fontAscent_ = 12;
  /** where zero energy is in pixels
  * @type {number}
  * @private
  */
  this.graphOrigin_ = 0;
  /** pixels
  * @type {number}
  * @private
  */
  this.leftEdge_ = 0;
  /** pixels
  * @type {number}
  * @private
  */
  this.rightEdge_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.graphFactor_ = 10;  // scale factor from energy to pixels
  /**
  * @type {number}
  * @private
  */
  this.graphDelta_ = 2;  // spacing of the numbers in the bar chart
  /**
  * @type {boolean}
  * @private
  */
  this.needRescale_ = true;
  /** Whether to draw a semi-transparent white rectangle, in case background is black.
  * @type {boolean}
  * @private
  */
  this.drawBackground_ = true;
  /** Color of the potential energy bar, a CSS3 color value
  * @type {string}
  */
  this.potentialColor = '#666';  // dark gray
  /** Color of the translation energy bar, a CSS3 color value
  * @type {string}
  */
  this.translationColor = '#999'; // gray
  /** Color of the rotational energy bar, a CSS3 color value
  * @type {string}
  */
  this.rotationColor = '#ccc'; //lightGray;
  /** when we last checked whether to rescale for small range.
  * we don't want to change the total energy display so fast you can't read it.
  * @type {number}
  * @private
  */
  this.lastTime_ = Util.systemTime();
  /**
  * @type {number}
  * @private
  */
  this.lastTime2_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.totalEnergyDisplay_ = 0;  // the total energy now being displayed
  /**
  * @type {number}
  * @private
  */
  this.lastEnergyDisplay_ = 0;  // the total energy that was last displayed
  /**
  * @type {number}
  * @private
  */
  this.totalDigits_ = 1; // number of digits to show for total energy
  /**
  * @type {number}
  * @private
  * @const
  */
  this.totalEnergyPeriod_ = 0.3; // how long to display the total energy
  /** when total energy was last calculated
  * @type {number}
  * @private
  */
  this.lastTotalEnergyTime_ = Util.NEGATIVE_INFINITY;
  /**
  * @type {number}
  * @private
  */
  this.megaMinEnergy_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.megaMaxEnergy_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.minEnergy_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.maxEnergy_ = 0;
  /**
  * @type {number}
  * @private
  */
  this.totalEnergy_ = 0;
  /**
  * @type {number}
  * @private
  * @const
  */
  this.BUFFER_ = 12;
  /** Each slot in history has the most negative minEnergy during each second for the
  * last BUFFER seconds.
  * @type {!Array<number>}
  * @private
  */
  this.history_ = new Array(this.BUFFER_);
  /**
  * @type {number}
  * @private
  */
  this.bufptr_ = 0; // pointer to next slot in history
  /**
  * @type {boolean}
  * @private
  */
  this.dragable_ = true;
  /**
  * @type {!DoubleRect}
  * @private
  */
  this.visibleRect_ = DoubleRect.EMPTY_RECT;
  /**
  * @type {boolean}
  * @private
  */
  this.needResize_ = true;
  /**
  * @type {number}
  */
  this.zIndex = 0;
  /**
  * @type {boolean}
  * @private
  * @const
  */
  this.debug_ = false;
};
var EnergyBarGraph = myphysicslab.lab.graph.EnergyBarGraph;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  EnergyBarGraph.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', visibleRect: '+this.visibleRect_
        +', rect: '+this.rect_
        +', needRescale: '+this.needRescale_
        +', leftEdge: '+NF(this.leftEdge_)
        +', rightEdge: '+NF(this.rightEdge_)
        +', graphOrigin: '+NF(this.graphOrigin_)
        +', graphFactor: '+NF(this.graphFactor_)
        +', minHistory: '+NF(this.minHistory())
        +', minEnergy: '+NF(this.minEnergy_)
        +', megaMinEnergy: '+NF(this.megaMinEnergy_)
        +', megaMinEnergyLoc: '+Math.floor(this.graphOrigin_ + 0.5 +
              this.graphFactor_*this.megaMinEnergy_)
        +', maxEnergy: '+NF(this.maxEnergy_)
        +', megaMaxEnergy: '+NF(this.megaMaxEnergy_)
        +', totalEnergy: '+NF(this.totalEnergy_)
        +', time: '+NF(Util.systemTime()-this.lastTime_)
        +', zIndex: '+this.zIndex
        +'}';
  };

  /** @inheritDoc */
  EnergyBarGraph.prototype.toStringShort = function() {
    return 'EnergyBarGraph{system: '+this.system_.toStringShort()+'}';
  };
};

/**
* @type {number}
* @const
* @private
*/
EnergyBarGraph.HEIGHT = 10;

/**
* @type {number}
* @const
* @private
*/
EnergyBarGraph.LEFT_MARGIN = 10;

/**
* @type {number}
* @const
* @private
*/
EnergyBarGraph.RIGHT_MARGIN = 0;

/**
* @type {number}
* @const
* @private
*/
EnergyBarGraph.TOP_MARGIN = 0;

/** @inheritDoc */
EnergyBarGraph.prototype.contains = function(point) {
  return this.rect_.contains(point);
};

/** @inheritDoc */
EnergyBarGraph.prototype.draw = function(context, map) {
  if (this.visibleRect_.isEmpty())
    return;
  context.save();
  context.font = this.graphFont;
  context.textAlign = 'start';
  context.textBaseline = 'alphabetic';
  var e = this.system_.getEnergyInfo();
  var te = e.getTranslational();
  var pe = e.getPotential();
  var re = e.getRotational();
  var tes2 = EnergyBarGraph.i18n.TRANSLATIONAL_ENERGY+',';
  if (isNaN(re)) {
    tes2 = EnergyBarGraph.i18n.KINETIC_ENERGY+',';
  }
  var height2 = EnergyBarGraph.TOP_MARGIN + 3 * EnergyBarGraph.HEIGHT + this.fontAscent_
      + 8 + this.fontDescent_;
  var h2 = map.screenToSimScaleY(height2);
  // NOTE WELL: this.rect_ is empty first time thru here!
  if (this.needResize_ || this.rect_.isEmpty()
      || Util.veryDifferent(h2, this.rect_.getHeight())) {
    if (this.debug_ && Util.DEBUG) {
      console.log('h2 = '+h2+' this.rect_.getHeight='+this.rect_.getHeight());
    }
    this.resizeRect(h2);
  }
  if (this.debug_ && Util.DEBUG) {
    var r = map.simToScreenRect(this.rect_);
    context.fillStyle = 'rgba(255,255,0,0.5)'; // transparent yellow
    context.fillRect(r.getLeft(), r.getTop(), r.getWidth(), r.getHeight());
  }
  this.leftEdge_ = map.simToScreenX(this.rect_.getLeft()) + EnergyBarGraph.LEFT_MARGIN;
  this.rightEdge_ = map.simToScreenX(this.rect_.getRight())
      - EnergyBarGraph.RIGHT_MARGIN;
  var maxWidth = this.rightEdge_ - this.leftEdge_;
  var top_ = map.simToScreenY(this.rect_.getTop());
  if (this.drawBackground_) {
    // draw a semi-transparent white rectangle, in case background is black
    context.fillStyle = 'rgba(255,255,255,0.75)'; // transparent white
    context.fillRect(this.leftEdge_- EnergyBarGraph.LEFT_MARGIN,
        top_ + EnergyBarGraph.TOP_MARGIN,
        maxWidth + EnergyBarGraph.LEFT_MARGIN + EnergyBarGraph.RIGHT_MARGIN,
        height2);
  }
  // for debugging:  draw outline
  if (this.debug_ && Util.DEBUG) {
    context.strokeStyle = '#90c'; // purple
    context.strokeRect(this.leftEdge_- EnergyBarGraph.LEFT_MARGIN,
        top_ + EnergyBarGraph.TOP_MARGIN,
        maxWidth+EnergyBarGraph.LEFT_MARGIN+EnergyBarGraph.RIGHT_MARGIN,
        height2);
  }
  //g.setColor(Color.red);  // for debugging, draw outline in red
  //g.drawRect(left, top_, width, height);
  this.totalEnergy_ = te + pe + (isNaN(re) ? 0 : re);
  goog.asserts.assert(Math.abs(this.totalEnergy_ - e.getTotalEnergy()) < 1e-12);
  // find the minimum and maximum energy being graphed
  this.minEnergy_ = pe < 0 ? pe : 0;
  this.maxEnergy_ = this.totalEnergy_ > 0 ? this.totalEnergy_ : 0;
  // update the total energy displayed, but not so often you can't read it
  if (Util.systemTime()-this.lastTotalEnergyTime_ > this.totalEnergyPeriod_){
    this.lastTotalEnergyTime_ = Util.systemTime();
    this.lastEnergyDisplay_ = this.totalEnergyDisplay_;
    this.totalEnergyDisplay_ = e.getTotalEnergy();
  }
  //console.log('pe='+pe+'  energy bar total='+total+' maxWidth='+maxWidth);
  this.rescale(maxWidth);
  var w = this.graphOrigin_;
  var w2 = 0;
  // draw a bar chart of the various energy types.
  context.fillStyle = this.potentialColor;
  if (pe < 0) {
    w2 = Math.floor(0.5 - pe*this.graphFactor_);
    context.fillRect(w-w2, top_ + EnergyBarGraph.TOP_MARGIN, w2,
        EnergyBarGraph.HEIGHT);
    w = w - w2;
  } else {
    w2 = Math.floor(0.5+pe*this.graphFactor_);
    context.fillRect(w, top_ + EnergyBarGraph.HEIGHT+EnergyBarGraph.TOP_MARGIN, w2,
        EnergyBarGraph.HEIGHT);
    w += w2;
  }
  if (!isNaN(re)) {
    w2 = Math.floor(0.5 + re*this.graphFactor_);
    context.fillStyle = this.rotationColor;
    context.fillRect(w, top_ + EnergyBarGraph.HEIGHT+EnergyBarGraph.TOP_MARGIN, w2,
        EnergyBarGraph.HEIGHT);
    w += w2;
  }
  w2 = Math.floor(0.5 + te*this.graphFactor_);
  // To stabilize the width of the bar and prevent flickering at the right edge
  // due to rounding in sims where energy is constant,
  // we find where the total should be.
  var totalLoc = this.graphOrigin_ +
    Math.floor(0.5 + this.totalEnergy_ * this.graphFactor_);
  // check this is no more than 2 pixels away from the 'flicker' way to calc.
  goog.asserts.assert(Math.abs(w + w2 - totalLoc) <= 2);
  w2 = totalLoc - w;
  context.fillStyle = this.translationColor;
  context.fillRect(w, top_ + EnergyBarGraph.HEIGHT+EnergyBarGraph.TOP_MARGIN, w2,
      EnergyBarGraph.HEIGHT);
  // rightEnergy = energy at right-hand edge of the display
  var rightEnergy = (this.rightEdge_ - this.graphOrigin_)/this.graphFactor_;
  var y = this.drawScale(context,
        /*left=*/this.leftEdge_,
        /*top_=*/top_ + EnergyBarGraph.HEIGHT + EnergyBarGraph.TOP_MARGIN,
        /*total=*/rightEnergy);
  // draw legend:  boxes and text
  var x = this.leftEdge_;
  x = this.drawLegend(context, EnergyBarGraph.i18n.POTENTIAL_ENERGY+',',
      this.potentialColor, /*filled=*/true, x, y);
  if (!isNaN(re)) {
    x = this.drawLegend(context, EnergyBarGraph.i18n.ROTATIONAL_ENERGY+',',
      this.rotationColor, /*filled=*/true, x, y);
  }
  x = this.drawLegend(context, tes2, this.translationColor, /*filled=*/true, x, y);
  x = this.drawTotalEnergy(context, x, y);
  context.restore();
};

/**
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
* @param {string} s
* @param {string} c  CSS3 color
* @param {boolean} filled
* @param {number} x
* @param {number} y
* @return {number}
* @private
*/
EnergyBarGraph.prototype.drawLegend = function(context, s, c, filled, x, y) {
  var BOX = 10;
  if (filled) {
    context.fillStyle = c;
    context.fillRect(x, y, BOX, BOX);
  } else {
    context.strokeStyle = c;
    context.strokeRect(x, y, BOX, BOX);
  }
  x += BOX + 3;
  var textWidth = context.measureText(s).width;
  context.fillStyle = '#000'; // black
  context.fillText(s, x, y+this.fontAscent_);
  x += textWidth+5;
  return x;
};

/** Draws the numeric scale for the bar chart.
@param {!CanvasRenderingContext2D} context the canvas's context to draw into
@param {number} left
@param {number} top_
@param {number} total
@return {number}
@private
*/
EnergyBarGraph.prototype.drawScale = function(context, left, top_, total) {
  var graphAscent = this.fontAscent_;
  // don't draw anything when total is zero.
  if (Math.abs(total) > 1E-18 && this.graphDelta_ > 1E-18) {
    context.fillStyle = '#000'; // black
    context.strokeStyle = '#000'; // black
    var scale = 0;
    // draw positive part of scale, from 0 to total
    var loopCtr = 0;
    do {
      var x = this.graphOrigin_ + Math.floor(scale*this.graphFactor_);
      context.beginPath();
      context.moveTo(x, top_+EnergyBarGraph.HEIGHT/2);
      context.lineTo(x, top_+EnergyBarGraph.HEIGHT+2);
      context.stroke();
      var s = EnergyBarGraph.numberFormat1(scale);
      var textWidth = context.measureText(s).width;
      context.fillText(s, x -textWidth/2, top_+EnergyBarGraph.HEIGHT+graphAscent+3);
      scale += this.graphDelta_;
      if (this.debug_ && Util.DEBUG && ++loopCtr > 100) {
        console.log('loop 1 x='+x+' s='+s+' scale='+NFE(scale)
          +' total='+NFE(total)+' graphDelta='+NFE(this.graphDelta_)  );
      }
    } while (scale < total + this.graphDelta_ + 1E-16);
    if (this.debug_ && Util.DEBUG) {
      console.log('megaMinEnergy='+NFE(this.megaMinEnergy_)
        +' graphDelta='+NFE(this.graphDelta_)
        +' graphFactor='+NFE(this.graphFactor_)
        +' scale='+NFE(scale));
    }
    // draw negative part of scale, from -graphDelta to megaMinEnergy
    if (this.megaMinEnergy_ < -1E-12) {
      scale = -this.graphDelta_;
      var x;
      do {
        x = this.graphOrigin_ + Math.floor(scale*this.graphFactor_);
        context.beginPath();
        context.moveTo(x, top_+EnergyBarGraph.HEIGHT/2);
        context.lineTo(x, top_+EnergyBarGraph.HEIGHT+2);
        context.stroke();
        var s = EnergyBarGraph.numberFormat1(scale);
        var textWidth = context.measureText(s).width;
        context.fillText(s, x -textWidth/2, top_+EnergyBarGraph.HEIGHT+graphAscent+3);
        scale -= this.graphDelta_;
        if (this.debug_ && Util.DEBUG) {
          console.log('loop 2 x='+x+' s='+s+' scale='+NFE(scale)
            +' megaMinEnergy='+NFE(this.megaMinEnergy_) );
        }
      } while (scale > this.megaMinEnergy_ && x >= left);
    }
  }
  return top_+EnergyBarGraph.HEIGHT+graphAscent+3+this.fontDescent_;
};

/**
* @param {!CanvasRenderingContext2D} context the canvas's context to draw into
* @param {number} x
* @param {number} y
* @return {number}
* @private
*/
EnergyBarGraph.prototype.drawTotalEnergy = function(context, x, y) {
  var s = EnergyBarGraph.i18n.TOTAL+' '+
    this.formatTotalEnergy(this.totalEnergyDisplay_, this.lastEnergyDisplay_);
  context.fillStyle = '#000'; // black
  context.fillText(s, x, y+this.fontAscent_);
  return x + context.measureText(s).width + 5;
};

/** Convert number to a string, using a format based on how large the value is,
and the difference from the previous version shown.
Designed to format total energy.
When the total energy does not change (for example when sim is paused)
then we retain the previous setting for number of digits to show.
@param {number} value  the value to be formatted
@param {number} previous  the previous value that was formatted
@return {string}
@private
*/
EnergyBarGraph.prototype.formatTotalEnergy = function(value, previous) {
  var diff = Math.abs(value - previous);
  if (diff > 1E-15) {
    // number of decimal places is based on difference to previous value
    var logDiff = -Math.floor(Math.log(diff)/Math.log(10));
    var digits = logDiff > 0 ? logDiff : 1;
    this.totalDigits_ = digits < 20 ? digits : 20;
  }
  var v = Math.abs(value);
  var sign = value < 0 ? '-' : '+';
  if (v < 1E-6) {
    return sign + v.toExponential(5);
  } else if (v < 1000) {
    return sign + v.toFixed(this.totalDigits_);
  } else {
    return sign + v.toFixed(this.totalDigits_);
  }
};

/** @inheritDoc */
EnergyBarGraph.prototype.getSimObjects = function() {
  return [];
};

/** @inheritDoc */
EnergyBarGraph.prototype.getMassObjects = function() {
  return [];
};

/** @inheritDoc */
EnergyBarGraph.prototype.getPosition = function() {
  return !this.rect_.isEmpty() ? this.rect_.getCenter() : new Vector(0, 0);
};

/** Returns the area within which this EnergyBarGraph is drawn, in simulation
coordinates.
@return {!DoubleRect} the area within which this
    EnergyBarGraph is drawn, in simulation coordinates.
*/
EnergyBarGraph.prototype.getVisibleArea = function() {
  return this.visibleRect_;
};

/** @inheritDoc */
EnergyBarGraph.prototype.getZIndex = function() {
  return this.zIndex;
};

/** @inheritDoc */
EnergyBarGraph.prototype.isDragable = function() {
  return this.dragable_;
};

/**
* @return {number}
* @private
*/
EnergyBarGraph.prototype.minHistory = function() {
  var min = 0;
  for (var i=0, len=this.history_.length; i<len; i++) {
    if (this.history_[i] < min)
      min = this.history_[i];
  }
  return min;
};

/** Convert number to a string, using a format based on how large the value is.
Designed to format scale tick marks.
@param {number} value  the value to be formatted
@return {string}
@private
*/
EnergyBarGraph.numberFormat1 = function(value) {
  var v = Math.abs(value);
  var s;
  // use regexp to remove trailing zeros, and maybe decimal point
  if (v < 1E-16) {
    s = '0';
  } else if (v < 1E-3) {
    s = v.toExponential(3);
    s = s.replace(/\.0+([eE])/, '$1');
    s = s.replace(/(\.\d*[1-9])0+([eE])/, '$1$2');
  } else if (v < 10) {
    s = v.toFixed(4);
    s = s.replace(/\.0+$/, '');
    s = s.replace(/(\.\d*[1-9])0+$/, '$1');
  } else if (v < 100) {
    s = v.toFixed(3);
    s = s.replace(/\.0+$/, '');
    s = s.replace(/(\.\d*[1-9])0+$/, '$1');
  } else if (v < 1000) {
    s = v.toFixed(2);
    s = s.replace(/\.0+$/, '');
    s = s.replace(/(\.[1-9])0$/, '$1');
  } else if (v < 10000) {
    s = v.toFixed(0);
  } else {
    s = v.toExponential(3);
    s = s.replace(/\.0+([eE])/, '$1');
    s = s.replace(/(\.\d*[1-9])0+([eE])/, '$1$2');
  }
  return value < 0 ? '-'+s : s;
};

/**
* @param {string} s
* @private
*/
EnergyBarGraph.prototype.printEverything = function(s) {
  if (Util.DEBUG && this.debug_) {
    console.log(s + this);
    if (0 == 1) {  // equiv to 'if (false)'
      Util.printArray(this.history_);
    }
  }
};

/**
* @param {number} maxWidth
* @private
*/
EnergyBarGraph.prototype.rescale = function(maxWidth) {
  var time_check = this.timeCheck(this.minEnergy_);
  if (Util.DEBUG) { this.printEverything('(status)'); }
  // keep track of most negative min energy value during this time check period
  this.megaMinEnergy_ = this.minHistory();
  goog.asserts.assert(isFinite(this.megaMinEnergy_));
  // Note: Don't rescale when megaMinEnergy is very near to zero.
  if (this.megaMinEnergy_ < -1E-6) {
    // rescale when minEnergy is negative and has gone past left edge
    if (this.graphOrigin_ + Math.floor(0.5 + this.megaMinEnergy_*this.graphFactor_) <
        this.leftEdge_ - EnergyBarGraph.LEFT_MARGIN) {
      if (Util.DEBUG) { this.printEverything('BIG MIN ENERGY'); }
      this.needRescale_ = true;
    }
    if (time_check) {
      // every few seconds, check if minEnergy is staying in smaller negative range
      if (-this.megaMinEnergy_*this.graphFactor_ <
            0.2*(this.graphOrigin_ - this.leftEdge_)) {
        if (Util.DEBUG) { this.printEverything('SMALL MIN ENERGY'); }
        this.needRescale_ = true;
      }
    }
  } else if (this.megaMinEnergy_ > 1E-6) {
    // minEnergy is not negative, ensure left edge is zero
    if (this.graphOrigin_ > this.leftEdge_) {
      if (Util.DEBUG) { this.printEverything('POSITIVE MIN ENERGY'); }
      this.needRescale_ = true;
    }
  } else {
    // megaMinEnergy is small, reset the origin to not show negative numbers
    if (time_check) {
      if (this.graphOrigin_ - this.leftEdge_ > EnergyBarGraph.LEFT_MARGIN) {
        this.needRescale_ = true;
      }
    }
  }
  if (this.totalEnergy_ > this.megaMaxEnergy_)
    this.megaMaxEnergy_ = this.totalEnergy_;
  // Note: Don't rescale when totalEnergy is very near to zero.
  if (this.totalEnergy_ > 1E-12) {
    // rescale when max energy is too big
    if (this.graphOrigin_ + this.totalEnergy_*this.graphFactor_ > this.rightEdge_) {
      this.needRescale_ = true;
      if (Util.DEBUG) { this.printEverything('BIG TOTAL ENERGY'); }
    }
    // rescale when max energy is small,
    // but only when positive part of graph is large compared to negative part.
    if (this.rightEdge_ - this.graphOrigin_ >
            0.2*(this.graphOrigin_ - this.leftEdge_)
        && this.totalEnergy_*this.graphFactor_ <
            0.2*(this.rightEdge_ - this.graphOrigin_)) {
      this.needRescale_ = true;
      this.megaMaxEnergy_ = this.totalEnergy_;
      if (Util.DEBUG) { this.printEverything('SMALL TOTAL ENERGY'); }
    }

  } else if (this.totalEnergy_ < -1E-12) {
    // every few seconds, if total is staying negative, then rescale
    if (time_check) {
      if (this.megaMaxEnergy_ < 0 && this.graphOrigin_ < this.rightEdge_) {
        this.needRescale_ = true;
        if (Util.DEBUG) { this.printEverything('NEGATIVE TOTAL ENERGY'); }
      }
      this.megaMaxEnergy_ = this.totalEnergy_;
    }
  }
  // if graph has gotten too big or too small, reset the scale.
  if (this.needRescale_) {
    this.lastTime_ = Util.systemTime(); // time reset
    this.needRescale_ = false;
    // scale goes from megaMinEnergy to totalEnergy or zero.
    var total = this.totalEnergy_ > 0 ? this.totalEnergy_ : 0;
    total -= this.megaMinEnergy_;
    if (total < 1E-16) {
      // kludge by ERN 11-14-2014; Problem is when energy is zero at startup
      // and EnergyBarGraph is displayed right away.
      // Found in GearsApp when 'show energy' is a remembered command.
      total = 1.0;
    }
    if (total*this.graphFactor_ > maxWidth) { // increasing
      this.graphFactor_ = 0.75*maxWidth/total;
    } else {  // decreasing
      this.graphFactor_ = 0.95*maxWidth/total;
    }
    goog.asserts.assert(isFinite(this.graphFactor_));
    if (this.megaMinEnergy_ < -1E-12) {
      this.graphOrigin_ = this.leftEdge_ +
          Math.floor(0.5 + this.graphFactor_ * (-this.megaMinEnergy_));
    } else {
      this.graphOrigin_ = this.leftEdge_;
    }
    var power = Math.pow(10, Math.floor(Math.log(total)/Math.log(10)));
    var logTot = total/power;
    // logTot should be in the range from 1.0 to 9.999
    // choose a nice delta for the numbers on the chart
    if (logTot >= 8)
      this.graphDelta_ = 2;
    else if (logTot >= 5)
      this.graphDelta_ = 1;
    else if (logTot >= 3)
      this.graphDelta_ = 0.5;
    else if (logTot >= 2)
      this.graphDelta_ = 0.4;
    else
      this.graphDelta_ = 0.2;
    this.graphDelta_ *= power;
    //console.log('rescale '+total+' '+logTot+' '+power+' '+this.graphDelta_);
  }
};

/**
* @param {number} height
* @private
*/
EnergyBarGraph.prototype.resizeRect = function(height) {
  goog.asserts.assertObject(this.visibleRect_);
  var top_ = this.rect_.isEmpty() ?
      this.visibleRect_.getTop() : this.rect_.getTop();
  var bottom = top_ - height;
  if (top_ > this.visibleRect_.getTop() || height > this.visibleRect_.getHeight()) {
    top_ = this.visibleRect_.getTop();
    bottom = top_ - height;
  } else if (bottom < this.visibleRect_.getBottom()) {
    bottom = this.visibleRect_.getBottom();
    top_ = bottom + height;
  }
  if (this.debug_ && Util.DEBUG) {
    console.log('resizeRect visibleRect='+this.visibleRect_
      +' rect='+this.rect_+ ' top_='+top_+' bottom='+bottom);
  }
  this.rect_ = new DoubleRect(this.visibleRect_.getLeft(), bottom,
      this.visibleRect_.getRight(), top_);
  if (this.debug_ && Util.DEBUG) {
    console.log('resizeRect new rect='+this.rect_);
  }
  this.needRescale_ = true;
  this.needResize_ = false;
};

/** @inheritDoc */
EnergyBarGraph.prototype.setDragable = function(dragable) {
  this.dragable_ = dragable;
};

/** @inheritDoc */
EnergyBarGraph.prototype.setPosition = function(position) {
  if (!this.rect_.isEmpty()) {
    var h = this.rect_.getHeight()/2;
    this.rect_ = new DoubleRect(this.rect_.getLeft(), position.getY() - h,
        this.rect_.getRight(), position.getY() + h);
    if (this.debug_ && Util.DEBUG) {
      console.log('setPosition '+this.rect_);
    }
  } else {
    // Make a non-empty rectangle to save the desired vertical position.
    this.rect_ = new DoubleRect(-5, position.getY()-0.5,
        5, position.getY()+0.5);
  }
};

/** Sets the area within which this EnergyBarGraph is drawn, in simulation coordinates.
@param {!DoubleRect} visibleArea the area within which this
    EnergyBarGraph is drawn, in simulation coordinates.
*/
EnergyBarGraph.prototype.setVisibleArea = function(visibleArea) {
  this.visibleRect_ = visibleArea;
  this.needResize_ = true;
};

/** @inheritDoc */
EnergyBarGraph.prototype.setZIndex = function(zIndex) {
  this.zIndex = goog.isDef(zIndex) ? zIndex : 0;
};

/**
* @param {number} minEnergy
* @return {boolean}
* @private
*/
EnergyBarGraph.prototype.timeCheck = function(minEnergy) {
  var nowTime = Util.systemTime();
  if (nowTime - this.lastTime2_ > 1.0) {
    this.lastTime2_ = nowTime;
    if (++this.bufptr_ >= this.history_.length)
      this.bufptr_ = 0;
    this.history_[this.bufptr_] = minEnergy;
  } else {
    if (this.minEnergy_ < this.history_[this.bufptr_])
      this.history_[this.bufptr_] = minEnergy;
  }
  if (nowTime - this.lastTime_ > this.BUFFER_) {
    this.lastTime_ = nowTime;
    return true;
  } else {
    return false;
  }
};

/** Set of internationalized strings.
@typedef {{
  SHOW_ENERGY: string,
  POTENTIAL_ENERGY: string,
  TRANSLATIONAL_ENERGY: string,
  KINETIC_ENERGY: string,
  ROTATIONAL_ENERGY: string,
  TOTAL: string
  }}
*/
EnergyBarGraph.i18n_strings;

/**
@type {EnergyBarGraph.i18n_strings}
*/
EnergyBarGraph.en = {
  SHOW_ENERGY: 'show energy',
  POTENTIAL_ENERGY: 'potential',
  TRANSLATIONAL_ENERGY: 'translational',
  KINETIC_ENERGY: 'kinetic',
  ROTATIONAL_ENERGY: 'rotational',
  TOTAL: 'total'
};

/**
@private
@type {EnergyBarGraph.i18n_strings}
*/
EnergyBarGraph.de_strings = {
  SHOW_ENERGY: 'Energie anzeigen',
  POTENTIAL_ENERGY: 'potenzielle',
  TRANSLATIONAL_ENERGY: 'translation',
  KINETIC_ENERGY: 'kinetische',
  ROTATIONAL_ENERGY: 'rotation',
  TOTAL: 'gesamt'
};

/** Set of internationalized strings.
@type {EnergyBarGraph.i18n_strings}
*/
EnergyBarGraph.i18n = goog.LOCALE === 'de' ? EnergyBarGraph.de_strings :
    EnergyBarGraph.en;

});  // goog.scope
