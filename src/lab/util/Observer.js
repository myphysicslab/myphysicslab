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

goog.provide('myphysicslab.lab.util.Observer');

goog.require('myphysicslab.lab.util.Printable');

/** Observes a {@link myphysicslab.lab.util.Subject Subject}; is notified when something
changes in the Subject. The change can be in the value of a
{@link myphysicslab.lab.util.Parameter Parameter}, or the occurrence of some event such
as a {@link myphysicslab.lab.util.GenericEvent GenericEvent}. The Observer is connected
to the Subject via the
{@link myphysicslab.lab.util.Subject#addObserver Subject.addObserver} method, which is
typically called by the Observer's constructor or the entity that creates the
Observer. When a change occurs, the
{@link myphysicslab.lab.util.Subject#broadcast Subject.broadcast} method is called which
results in the Observer's `observe` method being called.

Implements the [Observer design pattern](http://en.wikipedia.org/wiki/Observer_pattern).
See {@link myphysicslab.lab.util.Subject} for more extensive documentation.

@interface
@extends {myphysicslab.lab.util.Printable}
*/
myphysicslab.lab.util.Observer = function() {};

/** Tells this Observer that a change has occurred in the Subject.
@param {!myphysicslab.lab.util.SubjectEvent} event  contains information about
      what has changed in the Subject, either a one-time GenericEvent, or a change
      to the value of a Parameter
*/
myphysicslab.lab.util.Observer.prototype.observe;
