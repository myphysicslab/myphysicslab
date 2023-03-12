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

goog.module('myphysicslab.lab.graph.VarsHistory');

const array = goog.require('goog.array');

const CircularList = goog.require('myphysicslab.lab.util.CircularList');
const HistoryList = goog.require('myphysicslab.lab.util.HistoryList');
const Memorizable = goog.require('myphysicslab.lab.util.Memorizable');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');

/** Collects data from a {@link VarsList} and provides ways to print or access that data.
The data is stored in a {@link HistoryList} with each entry being an array of numbers (a
'data sample') representing the value of the variables at a point in time.

The data is stored whenever {@link #memorize} is called. As a {@link Memorizable} the
VarsHistory can be connected to a {@link myphysicslab.lab.util.MemoList} such as
{@link myphysicslab.lab.app.SimRunner}. In most myPhysicsLab apps the following commands
entered in {@link myphysicslab.lab.util.Terminal} will set this up:

    var hist = new VarsHistory(sim.getVarsList());
    simRun.addMemo(hist);

To memorize the starting initial conditions, call the memorize function once before starting the simulation.

    hist.memorize()

Run the simulation as long as desired. After the simulation run is completed, print the data:

    hist.output()

The resulting text can then be copied from the Terminal text box, saved as a text
document and imported into a spreadsheet program or graphed with a Python script.

The default separator between numbers is the tab character. To instead use comma
separated values:

    hist.setSeparator(', ');

To change which variables are sampled or the order of the variables within each sample
use {@link #setVariables}. For example:

    hist.setVariables([9,0,1,2,3])

The default format for printing numbers gives 5 decimal places, but if the number is
too small then switches to exponential format. Use {@link #setNumberFormat} to change
the formatting function. For example:

    hist.setNumberFormat((n) => n.toFixed(2));

That example uses an [arrow function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
but you can provide any function that takes one numeric argument and returns a string.

* @implements {Memorizable}
*/
class VarsHistory {
/**
* @param {!VarsList} variablesList the VarsList to gather data from
* @param {number=} opt_capacity number of data samples to store, default is 100000
*/
constructor(variablesList, opt_capacity) {
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
  this.varIndex_ = array.range(this.variablesList_.numVariables());
  /** number formatting function
  * @type {function(number): string}
  */
  this.numberFormat = Util.NF5E;
  /** separator between numbers
  * @type {!string}
  */
  this.separator = '\t';
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', samples: '+this.dataPoints_.getSize()
      +', separator: '+this.separator
      +', varIndex_: ['+Util.array2string(this.varIndex_, Util.NF0)
      +']}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' :
       'VarsHistory{variablesList: '+this.variablesList_.toStringShort()+'}';
};

/** Returns the HistoryList of data points.
* @return {!HistoryList<!Array<number>>}
*/
getDataPoints() {
  return this.dataPoints_;
};

/** Returns the array of variable index numbers specifying which variables to remember.
* @return {!Array<number>} array of variable index numbers specifying which
    variables to remember
*/
getVariables() {
  return Array.from(this.varIndex_);
};

/** @override */
memorize() {
  const vars = this.variablesList_.getValues(/*computed=*/true);
  const data = this.varIndex_.map(idx => vars[idx]);
  // only store if the new point is different from the last point
  const last = this.dataPoints_.getEndValue();
  if (last == null || !array.equals(data, last)) {
    this.dataPoints_.store(data);
  }
};

/** Returns string form of the data points. One line for each sample, using the
number formatting function and text separator specified by the properties
{@link #numberFormat} and {@link #separator}.
* @param {boolean=} opt_localized `true` means print the localized versions of the
*    variable names; `false` means print the language independent variable names;
*    default is `true`
* @return {string}
*/
output(opt_localized) {
  if (opt_localized===undefined) {
    opt_localized = true;
  }
  let s = '';
  // output the variable names
  this.varIndex_.forEach((idx, i) => {
    s += (i > 0 ? this.separator : '');
    s += this.variablesList_.getVariable(idx).getName(opt_localized);
  });
  s += '\n';
  // output the variable numeric data
  const iter = this.dataPoints_.getIterator();
  while (iter.hasNext()) {
    const data = iter.nextValue();
    s += Util.array2string(data, this.numberFormat, this.separator) + '\n';
  }
  return s;
};

/** Clears the HistoryList of data points.
* @return {undefined}
*/
reset() {
  this.dataPoints_.reset();
};

/** Sets the array of variable index numbers specifying which variables to memorize.
@param {!Array<number>} varIndex array of variable index numbers specifying which
    variables to memorize
*/
setVariables(varIndex) {
  const numVars = this.variablesList_.numVariables();
  varIndex.forEach(idx => {
    if (idx < 0 || idx > numVars - 1) {
      throw 'variable index '+idx+' not between 0 and '+(numVars-1);
    }
  });
  this.varIndex_ = varIndex;
  this.dataPoints_.reset();
};

/**
* @param {function(number): string} numberFormatFn
*      the number formatting function; takes one numeric argument, returns a string.
*/
setNumberFormat(numberFormatFn) {
  this.numberFormat = numberFormatFn;
};

/** Set the separator string to print between numbers
* @param {!string} separator the separator string to print between numbers.
*      Default is a comma and space.
*/
setSeparator(separator) {
  this.separator = separator;
};

/** Returns arrays of the data points, one array for each sample.
* @return {!Array<!Array<number>>}
*/
toArray() {
  const iter = this.dataPoints_.getIterator();
  const r = [];
  while (iter.hasNext()) {
    r.push(iter.nextValue());
  }
  return r;
};

} // end class
exports = VarsHistory;
