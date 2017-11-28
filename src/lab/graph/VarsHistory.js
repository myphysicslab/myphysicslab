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

goog.provide('myphysicslab.lab.graph.VarsHistory');

goog.require('goog.array');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.CircularList');
goog.require('myphysicslab.lab.util.HistoryList');
goog.require('myphysicslab.lab.util.Memorizable');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var CircularList = myphysicslab.lab.util.CircularList;
var HistoryList = myphysicslab.lab.util.HistoryList;
var NF = myphysicslab.lab.util.Util.NF;
var NF5 = myphysicslab.lab.util.Util.NF5;
var Util = myphysicslab.lab.util.Util;
var VarsList = myphysicslab.lab.model.VarsList;

/** Collects data from a {@link VarsList},
storing it in a {@link HistoryList}. Each entry in
the HistoryList is an array of numbers (a 'data sample') which represents the value of
the variables at a point in time.

To gather data a VarsHistory must be connected to a
{@link myphysicslab.lab.util.MemoList} such as {@link myphysicslab.lab.app.SimRunner}.
In most myPhysicsLab apps the following commands in
{@link myphysicslab.lab.util.Terminal} will do this:

    var hist = new VarsHistory(sim.getVarsList())
    simRun.addMemo(hist)

After the simulation run is completed, print the data with this command in Terminal

    hist.output()

See {@link #output}. The resulting text can then be copied from the Terminal text box,
saved as a text document with suffix '.csv' (for 'comma separated values') and imported
into a spreadsheet program for analysis.

The VarsHistory will gather data on all the variables by default. To change which
variables are sampled or the order of the variables within each sample see
{@link #setVariables}. For example:

    hist.setVariables([3,0,1])


* @param {!VarsList} variablesList the VarsList to gather data from
* @param {number=} opt_capacity number of data samples to store
* @implements {myphysicslab.lab.util.Memorizable}
* @constructor
* @final
* @struct
*/
myphysicslab.lab.graph.VarsHistory = function(variablesList, opt_capacity) {
  /** @type {!VarsList}
  * @private
  */
  this.variablesList_ = variablesList;
  /**
  * @type {!CircularList<!Array<number>>}
  * @private
  */
  this.dataPoints_  = new CircularList(opt_capacity || 100000);
  /** Set of index numbers into VarsList, specifies which variables to memorize.
  * @type {!Array<number>}
  * @private
  */
  this.varIndex_ = goog.array.range(this.variablesList_.numVariables());
  /** number formatting function
  * @type {function(number): string}
  */
  this.numberFormat = Util.NF5E;
  /** separator between numbers
  * @type {string}
  */
  this.separator = ', ';
};
var VarsHistory = myphysicslab.lab.graph.VarsHistory;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  VarsHistory.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', samples: '+this.dataPoints_.getSize()
        +', varIndex_: ['+Util.array2string(this.varIndex_, Util.NF0)
        +']}';
  };

  /** @inheritDoc */
  VarsHistory.prototype.toStringShort = function() {
    return 'VarsHistory{variablesList: '+this.variablesList_.toStringShort()+'}';
  };
};

/** Returns the HistoryList of data points.
* @return {!HistoryList<!Array<number>>}
*/
VarsHistory.prototype.getDataPoints = function() {
  return this.dataPoints_;
};

/** Returns the array of variable index numbers specifying which variables to remember.
* @return {!Array<number>} array of variable index numbers specifying which
    variables to remember
*/
VarsHistory.prototype.getVariables = function() {
  return goog.array.clone(this.varIndex_);
};

/** @inheritDoc */
VarsHistory.prototype.memorize = function() {
  var vars = this.variablesList_.getValues(/*computed=*/true);
  var data = goog.array.map(this.varIndex_, function(idx) { return vars[idx]; });
  // only store if the new point is different from the last point
  var last = this.dataPoints_.getEndValue();
  if (last == null || !goog.array.equals(data, last)) {
    this.dataPoints_.store(data);
  }
};

/** Returns string form of the data points. One line for each sample, using the
number formatting function and text separator specified by the properties
{@link #numberFormat} and {@link #separator}.
* @return {string}
*/
VarsHistory.prototype.output = function() {
  var iter = this.dataPoints_.getIterator();
  var s = '';
  while (iter.hasNext()) {
    var data = iter.nextValue();
    s += Util.array2string(data, this.numberFormat, this.separator) + '\n';
  }
  return s;
};

/** Clears the HistoryList of data points.
* @return {undefined}
*/
VarsHistory.prototype.reset = function() {
  this.dataPoints_.reset();
};

/** Sets the array of variable index numbers specifying which variables to remember.
@param {!Array<number>} varIndex array of variable index numbers specifying which
    variables to remember
*/
VarsHistory.prototype.setVariables = function(varIndex) {
  var numVars = this.variablesList_.numVariables();
  goog.array.forEach(varIndex, function(idx) {
    if (idx < 0 || idx > numVars) {
      throw new Error('variable index '+idx+' not between 0 and '+numVars);
    }
  });
  this.varIndex_ = varIndex;
  this.dataPoints_.reset();
};

/** Returns arrays of the data points, one array for each sample.
* @return {!Array<!Array<number>>}
*/
VarsHistory.prototype.toArray = function() {
  var iter = this.dataPoints_.getIterator();
  var r = [];
  while (iter.hasNext()) {
    r.push(iter.nextValue());
  }
  return r;
};

}); // goog.scope
