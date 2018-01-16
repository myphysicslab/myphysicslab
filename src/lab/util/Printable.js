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

goog.module('myphysicslab.lab.util.Printable');

/** An object that has a minimal string representation via its {@link #toStringShort}
method.

When writing a `toString` method, use `toStringShort` on objects that are Printable.
This is mainly needed to avoid infinite loops, such as when an object prints a
{@link myphysicslab.lab.util.Subject} or {@link myphysicslab.lab.util.Observer}.

This can also make printing an *array of Printable objects* more practical because we
only print minimal identity information, rather than the full `toString` representation
which would have too much information and be unreadable.
* @interface
*/
class Printable {
/** Returns a minimal string representation of this object, usually giving just identity
information like the class name and name of the object.

For an object whose main purpose is to represent another Printable object, it is
recommended to include the result of calling `toStringShort` on that other object. For
example, calling `toStringShort()` on a DisplayShape might return something like
this:

    DisplayShape{polygon:Polygon{'chain3'}}

@return {string} a minimal string representation of this object.
*/
toStringShort() {}
}
exports = Printable;
