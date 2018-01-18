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

goog.module('myphysicslab.lab.util.MemoList');

const Memorizable = goog.require('myphysicslab.lab.util.Memorizable');

/** A {@link Memorizable} object that keeps a list of other Memorizable objects and
frequently tells them to `memorize` simulation data. The `memorize` method is meant to
be called after each simulation time step, as is done in
{@link myphysicslab.lab.model.AdvanceStrategy#advance}.

This is an example of
[Composite design pattern](https://en.wikipedia.org/wiki/Composite_pattern): it is a
tree structure where every node on the tree defines the `memorize` method and calls that
method on its sub-nodes.

The base of the tree structure is usually {@link myphysicslab.lab.app.SimRunner}. You
can add a Memorizable directly to SimRunner using {@link #addMemo}. Or you can add a
Memorizable to one of the branches of the tree, such as a
{@link myphysicslab.lab.view.LabCanvas} contained in the SimRunner, or a
{@link myphysicslab.lab.view.LabView} contained in the LabCanvas.

In a typical simulation, a graph is **periodically updated** because
{@link myphysicslab.lab.app.SimRunner#callback} causes the
{@link myphysicslab.lab.model.AdvanceStrategy AdvanceStrategy} to both
advance the simulation and also call `memorize` on each LabCanvas. The `memorize` of
the LabCanvas calls `memorize` on each LabView, which in turn calls `memorize` on any
Memorizable objects contained in the LabView, such as a
{@link myphysicslab.lab.graph.GraphLine}.

* @interface
*/
class MemoList extends Memorizable {

/** Adds an object to the list of Memorizable objects. These object's `memorize`
methods will be called from this object's `memorize` method.
@param {!Memorizable} memorizable object to add to the list of Memorizable objects
@throws {!Error} if called during the `memorize` method.
*/
addMemo(memorizable) {}

/** Returns the list of Memorizable objects stored in this MemoList.
@return {!Array<!Memorizable>} the list of Memorizable objects
*/
getMemos() {}

/** Removes an object from the list of Memorizable objects.
@param {!Memorizable} memorizable object to remove from the list of Memorizable objects
@throws {!Error} if called during the `memorize` method.
*/
removeMemo(memorizable) {}

}
exports = MemoList;
