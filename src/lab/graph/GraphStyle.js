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

goog.provide('myphysicslab.lab.graph.GraphStyle');

goog.require('myphysicslab.lab.view.DrawingMode');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var DrawingMode = myphysicslab.lab.view.DrawingMode;
var Util = goog.module.get('myphysicslab.lab.util.Util');

/** Specifies graph style such as color, line thickness, line pattern.

The index number specifies when to use this GraphStyle as follows: Each point stored in
a {@link myphysicslab.lab.util.HistoryList HistoryList} has an index number given by
{@link myphysicslab.lab.util.HistoryIterator#getIndex}. The GraphStyle is used for
points whose index number is equal or greater than the GraphStyle's index.

Note: line dash is not a supported feature because the graph is drawn incrementally
as thousands of short line segments and the line dash starts over for each segment. It
might be possible to use the HTML `CanvasRenderingContext2D.lineDashOffset` property to
deal with this.

* @param {number} index specifies where in the HistoryList this style should be applied
* @param {!DrawingMode} drawMode whether to draw dots or lines,
*     a value from {@link DrawingMode}
* @param {string} color a CSS color specification
* @param {number} lineWidth  thickness to use when drawing the graph line, in screen
*     coordinates, so a unit is a screen pixel.
* @constructor
* @final
* @struct
*/
myphysicslab.lab.graph.GraphStyle = function(index, drawMode, color, lineWidth) {
  /** Specifies where in the HistoryList this style should be applied.
  * @type {number}
  */
  this.index_ = index;
  /** Whether to draw dots or lines, a value from
  * {@link DrawingMode}
  * @type {!DrawingMode}
  */
  this.drawMode = drawMode;
  /** a CSS color specification
  * @type {string}
  */
  this.color_ = color;
  /** thickness to use when drawing the graph line, in screen coordinates,
  * so a unit is a screen pixel.
  * @type {number}
  */
  this.lineWidth = lineWidth;
};
var GraphStyle = myphysicslab.lab.graph.GraphStyle;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  GraphStyle.prototype.toString = function() {
    return 'GraphStyle{index_: '+this.index_
        +', drawMode: '+this.drawMode
        +', color_:"'+this.color_+'"'
        +', lineWidth: '+this.lineWidth
        +'}';
  };
};

});  // goog.scope
