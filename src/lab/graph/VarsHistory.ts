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

import { HistoryList, CircularList } from '../util/HistoryList.js';
import { Memorizable } from '../util/Memo.js';
import { Util } from '../util/Util.js';
import { VarsList } from '../model/VarsList.js';

/** Collects data from a {@link VarsList} and provides ways to print
or access that data. The data is stored in a {@link HistoryList}
with each entry being an array of numbers (a 'data sample') representing the value of
the variables at a point in time.

The data is stored whenever {@link VarsHistory.memorize} is called. As a
{@link Memorizable} the VarsHistory can be connected to a
{@link lab/util/Memo.MemoList} such as {@link lab/app/SimRunner.SimRunner}. In most
myPhysicsLab apps the following commands entered in {@link lab/util/Terminal.Terminal}
will set this up:
```js
var hist = new VarsHistory(sim.getVarsList());
simRun.addMemo(hist);
```

To memorize the starting initial conditions, call the memorize function once before
starting the simulation.
```js
hist.memorize()
```

Run the simulation as long as desired. After the simulation run is completed, print the
data:
```js
hist.output()
```

The resulting text can then be copied from the Terminal text box, saved as a text
document and imported into a spreadsheet program or graphed with a Python script.

The default separator between numbers is the tab character. To instead use comma
separated values:
```js
hist.setSeparator(', ')
```

To change which variables are sampled or the order of the variables within each sample
use {@link VarsHistory.setVariables}. For example:
```js
hist.setVariables([9,0,1,2,3])
```
Note that `setVariables` erases all stored data, so you would need to call `memorize`
afterwards to store initial conditions.

The default format for printing numbers gives 5 decimal places, but if the number is
too small then switches to exponential format. Use {@link VarsHistory.setNumberFormat}
to change the formatting function. For example:
```js
hist.setNumberFormat((n) => n.toFixed(2));
```

That example uses an [arrow function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
but you can provide any function that takes one numeric argument and returns a string.

To process the data using Javascript use the `toArray` method
```js
var a = hist.toArray()
```
*/
export class VarsHistory implements Memorizable {
  private variablesList_: VarsList;
  private dataPoints_: CircularList<number[]>;
  /** Set of index numbers into VarsList, specifies which variables to memorize. */
  private varIndex_: number[];
  /** number formatting function */
  numberFormat: (n: number)=> string  = Util.NF5E;
  /** separator between numbers */
  separator: string = '\t';

/**
* @param variablesList the VarsList to gather data from
* @param opt_capacity number of data samples to store, default is 100000
*/
constructor(variablesList: VarsList, opt_capacity?: number) {
  this.variablesList_ = variablesList;
  this.dataPoints_  = new CircularList<number[]>(opt_capacity || 100000);
  this.varIndex_ = Util.range(this.variablesList_.numVariables());
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
      +', samples: '+this.dataPoints_.getSize()
      +', separator: '+this.separator
      +', varIndex_: ['+Util.array2string(this.varIndex_, Util.NF0)
      +']}';
};

/** @inheritDoc */
toStringShort() {
  return 'VarsHistory{variablesList: '+this.variablesList_.toStringShort()+'}';
};

/** Returns the HistoryList of data points.
*/
getDataPoints(): HistoryList<number[]> {
  return this.dataPoints_;
};

/** Returns the array of variable index numbers specifying which variables to remember.
* @return array of variable index numbers specifying which variables to remember
*/
getVariables(): number[] {
  return Array.from(this.varIndex_);
};

/** @inheritDoc */
memorize(): void {
  const vars = this.variablesList_.getValues(/*computed=*/true);
  const data = this.varIndex_.map(idx => vars[idx]);
  // only store if the new point is different from the last point
  const last = this.dataPoints_.getEndValue();
  if (last == null || !Util.equals(data, last)) {
    this.dataPoints_.store(data);
  }
};

/** Returns string form of the data points. One line for each sample, using the
* number formatting function and text separator specified by the properties
* {@link VarsHistory.numberFormat} and {@link VarsHistory.separator}.
* @param opt_localized `true` means print the localized versions of the
*    variable names; `false` means print the language independent variable names;
*    default is `true`
*/
output(opt_localized?: boolean): string {
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

/** Erases all data from this VarsHistory.
*/
reset(): void {
  this.dataPoints_.reset();
};

/** Sets the array of variable index numbers specifying which variables to memorize.
This calls {@link VarsHistory.reset} which erases all stored data.
@param varIndex array of variable index numbers specifying which
    variables to memorize
*/
setVariables(varIndex: number[]): void {
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
* @param numberFormatFn the number formatting function; takes one numeric argument,
*    returns a string.
*/
setNumberFormat(numberFormatFn: (n: number)=> string): void {
  this.numberFormat = numberFormatFn;
};

/** Set the separator string to print between numbers
* @param separator the separator string to print between numbers.
*      Default is a comma and space.
*/
setSeparator(separator: string): void {
  this.separator = separator;
};

/** Returns arrays of the data points, one array for each sample.
*/
toArray(): number[][] {
  const iter = this.dataPoints_.getIterator();
  const r = [];
  while (iter.hasNext()) {
    r.push(iter.nextValue());
  }
  return r;
};

} // end class
Util.defineGlobal('lab$graph$VarsHistory', VarsHistory);
