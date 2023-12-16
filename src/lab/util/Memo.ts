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

import { Printable, Util } from "./Util.js";

// ************************ Memorizable *******************************

/** An object that memorizes simulation data or performs some other function that needs
to happen regularly. The `memorize` method is meant to be called after each simulation
time step, as is done in {@link lab/model/AdvanceStrategy.AdvanceStrategy.advance}.
See {@link MemoList} for how to add a Memorizable
object so that it will be called frequently.
*/
export interface Memorizable extends Printable {

/** Memorize the current simulation data, or do some other function that should happen
regularly after each simulation time step.
*/
memorize(): void;
};

// ************************ MemoList *******************************

/** A {@link Memorizable} object that keeps a list of other Memorizable objects and
frequently tells them to `memorize` simulation data. The `memorize` method is meant to
be called after each simulation time step, as is done in
{@link lab/model/AdvanceStrategy.AdvanceStrategy.advance}.

This is an example of
[Composite design pattern](https://en.wikipedia.org/wiki/Composite_pattern): it is a
tree structure where every node on the tree defines the `memorize` method and calls that
method on its sub-nodes.

The base of the tree structure is usually {@link lab/app/SimRunner.SimRunner}. You
can add a Memorizable directly to SimRunner using {@link MemoList.addMemo}.
Or you can add a
Memorizable to one of the branches of the tree, such as a
{@link lab/view/LabCanvas.LabCanvas} contained in the SimRunner, or a
{@link lab/view/SimView.SimView} contained in the LabCanvas.

In a typical simulation, a graph is **periodically updated** because
{@link lab/app/SimRunner.SimRunner.callback} causes the
{@link lab/model/AdvanceStrategy.AdvanceStrategy} to both
advance the simulation and also call `memorize` on each LabCanvas. The `memorize` of
the LabCanvas calls `memorize` on each SimView, which in turn calls `memorize` on any
Memorizable objects contained in the SimView, such as a
{@link lab/graph/GraphLine.GraphLine}.
*/
export interface MemoList extends Memorizable {

/** Adds an object to the list of Memorizable objects. These object's `memorize`
methods will be called from this object's `memorize` method.
@param memorizable object to add to the list of Memorizable objects
@throws if called during the `memorize` method.
*/
addMemo(memorizable: Memorizable): void;

/** Returns the list of Memorizable objects stored in this MemoList.
@return the list of Memorizable objects
*/
getMemos(): Memorizable[];

/** Removes an object from the list of Memorizable objects.
@param memorizable object to remove from the list of Memorizable objects
@throws if called during the `memorize` method.
*/
removeMemo(memorizable: Memorizable): void;
};

// *********************** GenericMemo ********************************

/** A generic {@link Memorizable} object that calls a JavaScript function.

Example 1
---------
Make a GenericMemo that prints the angle variable of a simulation
into the {@link lab/util/Terminal.Terminal} output area.
Here `simRun` is an instance of {@link lab/app/SimRunner.SimRunner}.
```
var angle = sim.getVarsList().getVariable('ANGLE');
var memo = new GenericMemo(()=> println('angle: '+angle.getValue()));
simRun.addMemo(memo);
```
This code can be entered as Terminal commands in
[Pendulum](https://www.myphysicslab.com/pendulum/pendulum-en.html?show-terminal=true).

Use the following to turn off the GenericMemo:
```
simRun.removeMemo(memo);
```

Example 2
---------
This sets the color of a spring depending on how much it is stretched.
```
var spring = simList.get('spring1');
var dispSpring = displayList.findSpring(spring);
var memo = new GenericMemo(function() {
  var stretch = Math.max(Math.min(spring.getStretch(), 1), -1);
  if (stretch < 0) {
    dispSpring.setColorCompressed(Util.colorString3(-stretch, 0, 0));
  } else {
    dispSpring.setColorExpanded(Util.colorString3(0, stretch, 0));
  }
});
simRun.addMemo(memo);
```
This script can be entered as Terminal commands in
[Cart + Pendulum with Physics Engine](https://www.myphysicslab.com/engine2D/cart-pendulum-en.html?show-terminal=true).

Example 3
---------
This stops a simulation after 2 seconds. Clicking the "play" button will then continue
the simulation, because `once` has been set false. To re-enable the behavior, set
`once` to true.
```
var once = true;
var memo = new GenericMemo(function(){
    if (once && sim.getTime()>2)
      {once=false;simRun.pause()}
});
simRun.addMemo(memo);
```
This script can be entered as Terminal commands in any simulation.
*/
export class GenericMemo implements Memorizable {
  private function_: ()=>void;
  /** Describes what this GenericMemo does, for developers */
  private purpose_: string;
/**
@param func  function to execute
@param opt_purpose Describes what this GenericMemo does, for developers
*/
constructor(func: ()=>void, opt_purpose?: string) {
  this.function_ = func;
  this.purpose_ = (opt_purpose || '');
};

/** @inheritDoc */
toString() {
  return this.toStringShort();
};

/** @inheritDoc */
toStringShort() {
  return 'GenericMemo{'
      +(this.purpose_.length > 0 ? 'purpose_:"'+this.purpose_+'"' : '')
      +'}';
};

/** @inheritDoc */
memorize() {
  this.function_();
};

} // end GenericMemo class

Util.defineGlobal('lab$util$GenericMemo', GenericMemo);
