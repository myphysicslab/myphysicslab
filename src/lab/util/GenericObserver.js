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

goog.provide('myphysicslab.lab.util.GenericObserver');

goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.SubjectEvent');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var Observer = myphysicslab.lab.util.Observer;
var SubjectEvent = myphysicslab.lab.util.SubjectEvent;
var Subject = myphysicslab.lab.util.Subject;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Observes a Subject; when the Subject broadcasts a SubjectEvent then this executes a
specified function.

Example 1
---------
Here is an example of a GenericObserver that prints any event broadcast by a
{@link myphysicslab.lab.util.Clock}:

    var obs = new GenericObserver(clock, function(evt) {
      println('event='+evt);
    });

Example 2
---------
This prints only when a particular Clock event occurs:

    var obs = new GenericObserver(clock, function(evt) {
        if (evt.nameEquals(Clock.CLOCK_PAUSE)) {
          println('event='+evt);
        }
    });

Example 3
---------
This sets color of a contact force line by gap distance: red = zero distance,
green = max distance.

    var obs = new GenericObserver(displayList, function(evt) {
      if (evt.nameEquals(DisplayList.OBJECT_ADDED)) {
        var obj = evt.getValue();
        if (obj instanceof DisplayLine) {
          var f = obj.getSimObjects()[0];
          if (f.getName().match(/^CONTACT_FORCE1/)) {
            var pct = Math.max(0, Math.min(1, f.contactDistance/f.contactTolerance));
            obj.color = UtilityCore.colorString3(1-pct, pct, 0);
          }
        }
      }
    });

The above script can be entered into Terminal for simple-compiled applications using
{@link myphysicslab.lab.engine2D.ContactSim}. It is useful to study the effects of
using different settings for {@link myphysicslab.lab.engine2D.ExtraAccel}.


@param {!Subject} subject  the Subject to observe
@param {function(!SubjectEvent)} observeFn  function to execute when a SubjectEvent is
    broadcast by Subject
@param {string=} opt_purpose Describes what this Observer does, for debugging
@implements {myphysicslab.lab.util.Observer}
@constructor
@final
@struct
*/
myphysicslab.lab.util.GenericObserver = function(subject, observeFn, opt_purpose) {
  /** Describes what this Observer does, for debugging
  * @type {string}
  * @private
  * @const
  */
  this.purpose_ = UtilityCore.ADVANCED ? '' : (opt_purpose || '');
  /**
  * @type {!myphysicslab.lab.util.Subject}
  * @private
  * @const
  */
  this.subject_ = subject;
  subject.addObserver(this);
  /**
  * @type {function(!SubjectEvent)}
  * @private
  * @const
  */
  this.observeFn_ = observeFn;
};
var GenericObserver = myphysicslab.lab.util.GenericObserver;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  GenericObserver.prototype.toString = function() {
    return this.toStringShort();
  };

  /** @inheritDoc */
  GenericObserver.prototype.toStringShort = function() {
    return 'GenericObserver{subject_: '+this.subject_.toStringShort()
        +(this.purpose_.length > 0 ? ', purpose_:"'+this.purpose_+'"' : '')
        +'}';
  };
};

/** Disconnects this GenericObserver from the Subject. */
GenericObserver.prototype.disconnect = function() {
  this.subject_.removeObserver(this);
};

/** @inheritDoc */
GenericObserver.prototype.observe =  function(event) {
  this.observeFn_(event);
};

});  // goog.scope
