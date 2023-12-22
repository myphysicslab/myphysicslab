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

import { ConcreteVariable } from './VarsList.js';
import { Parameter, SubjectEvent } from '../util/Observe.js';
import { Variable } from './Variable.js';
import { Util, Printable } from '../util/Util.js';
import { VarsList } from './VarsList.js';

/** A {@link Variable} whose value is defined by a JavaScript function.

For example, suppose the variable 'position' is at index 0 in the {@link VarsList}.
This script will create a new variable that gives the position offset by a fixed
amount.
```js
var fn = () => varsList.getValue(0) - 5.5
var fnv = new FunctionVariable(varsList, 'position offset', 'position offset', fn);
varsList.addVariable(fnv)
```
You can then choose that variable to show in a graph or time graph.
*/
export class FunctionVariable extends ConcreteVariable implements Variable, Parameter, SubjectEvent, Printable {
  private getter_: ()=>number;
  private setter_: undefined|((v: number)=>void);

/**
@param varsList the VarsList which contains this Variable
@param name the name of this Variable; this will be underscorized so the
    English name can be passed in here. See {@link Util.toName}.
@param localName the localized name of this Variable
@param getter A function with no arguments that returns the value of this Variable
@param setter An optional function with one argument that sets the value of this
     Variable
*/
constructor(varsList: VarsList, name: string, localName: string, getter: ()=>number, setter?: (v: number)=>void) {
  super(varsList, name, localName);
  this.getter_ = getter;
  this.setter_ = setter;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      + ', getter_: '+this.getter_
      + ', setter_: '+this.setter_ + '}';
};

/** @inheritDoc */
override getBroadcast(): boolean {
  return false;
};

/** @inheritDoc */
override getClassName(): string {
  return 'FunctionVariable';
};

/** @inheritDoc */
override getValue(): number {
  return this.getter_();
};

/** @inheritDoc */
override setValue(value: number): void {
  if (this.setter_ !== undefined && this.getValue() != value) {
    //if (isNaN(value)) { throw 'NaN (FunctionVariable.setValue)'; }
    this.setter_(value);
    this.seq_++;
    if (this.doesBroadcast_) {
      this.varsList_.broadcast(this);
    }
  }
};

/** @inheritDoc */
override setValueSmooth(value: number): void {
  if (this.setter_ !== undefined) {
    //if (isNaN(value)) { throw 'NaN (FunctionVariable.setValue)'; }
    this.setter_(value);
  }
};

} // end class
Util.defineGlobal('lab$model$FunctionVariable', FunctionVariable);
