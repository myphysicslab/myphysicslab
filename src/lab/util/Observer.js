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

goog.module('myphysicslab.lab.util.Observer');

const Printable = goog.require('myphysicslab.lab.util.Printable');
const Subject = goog.require('myphysicslab.lab.util.Subject');

/** An Observer is notified whenever something changes in a {@link Subject} it is
observing. The change can be in the value of a Subject's
{@link myphysicslab.lab.util.Parameter Parameter}, or the occurrence of an event such
as a {@link myphysicslab.lab.util.GenericEvent GenericEvent}. When a change occurs in
the Subject, the {@link Subject#broadcast} method calls the Observer's
{@link #observe} method.

The Observer is connected to the Subject via the {@link Subject#addObserver} method.
This is typically done in the Observer's constructor or by the entity that creates the
Observer.

Implements the [Observer design pattern](http://en.wikipedia.org/wiki/Observer_pattern).
See {@link Subject} for more extensive documentation.

@interface
*/
class Observer extends Printable {

/** Notifies this Observer that a change has occurred in the Subject.
@param {!myphysicslab.lab.util.SubjectEvent} event  contains information about
      what has changed in the Subject: typically either a one-time GenericEvent,
      or a change to the value of a Parameter
*/
observe(event) {}

}
exports = Observer;
