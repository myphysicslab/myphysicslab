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

goog.module('myphysicslab.lab.util.GenericObserver');

const Observer = goog.require('myphysicslab.lab.util.Observer');
const SubjectEvent = goog.require('myphysicslab.lab.util.SubjectEvent');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Observes a Subject; when the Subject broadcasts a SubjectEvent then this executes a
specified function.

Example 1
---------
Here is an example of a GenericObserver that prints any event broadcast by a
{@link myphysicslab.lab.util.Clock}:

    var obs = new GenericObserver(clock, evt => println('event='+evt));

Paste that code into the Terminal command line of any [simple-compiled application](https://www.myphysicslab.com/develop/build/index-en.html), or
[try this link](<https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html?var%20obs%3Dnew%20GenericObserver%28clock%2Cevt%20%3D%3E%20println%28%27event%3D%27%2Bevt%29%29%3Blayout.showTerminal%28true%29%3B>)
which contains the above code running in the simple-compiled pendulum simulation. Click
the rewind, play, and step buttons to see events in the Terminal output area.

Use the following Terminal command to turn off the GenericObserver:

    clock.removeObserver(obs);

Example 2
---------
This prints only when a particular Clock event occurs:

    var obs = new GenericObserver(clock, evt => {
        if (evt.nameEquals(Clock.CLOCK_PAUSE)) {
          println('event='+evt);
        }
    });

Paste that code into the Terminal command line of any [simple-compiled application](https://www.myphysicslab.com/develop/build/index-en.html), or
[try this link](<https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html?var%20obs%3Dnew%20GenericObserver%28clock%2Cfunction%28evt%29%7Bif%28evt.nameEquals%28Clock.CLOCK_PAUSE%29%29%7Bprintln%28%27event%3D%27%2Bevt%29%3B%7D%7D%29%3Blayout.showTerminal%28true%29%3B>)
which contains the above code running in the simple-compiled pendulum simulation. Click
the pause button to see events in the Terminal output area.

Example 3
---------
This sets color of a contact force line according to gap distance: red = zero distance,
green = max distance. This is useful to study the effects of using different settings
for {@link myphysicslab.lab.engine2D.ExtraAccel}.

    new GenericObserver(displayList, evt => {
      if (evt.nameEquals(DisplayList.OBJECT_ADDED)) {
        var obj = evt.getValue();
        if (obj instanceof DisplayLine) {
          var f = obj.getSimObjects()[0];
          if (f.getName().match(/^CONTACT_FORCE1/)) {
            var pct = Math.max(0, Math.min(1, f.contactDistance/f.contactTolerance));
            obj.setColor(Util.colorString3(1-pct, pct, 0));
          }
        }
      }
    });

The above script can be entered into the Terminal command line of most
[simple-compiled applications](https://www.myphysicslab.com/develop/build/index-en.html)
which use  {@link myphysicslab.lab.engine2D.ContactSim}, or
[try this link](<https://www.myphysicslab.com/develop/build/sims/engine2D/ContactApp-en.html?NUMBER_OF_OBJECTS%3D1%3BEXTRA_ACCEL%3Dnone%3BELASTICITY%3D0.6%3BSIM_CANVAS.ALPHA%3D1%3BSIM_CANVAS.BACKGROUND%3D%22%22%3Bnew%20GenericObserver%28displayList%2Cfunction%28evt%29%7Bif%28evt.nameEquals%28DisplayList.OBJECT_ADDED%29%29%7Bvar%20obj%3Devt.getValue%28%29%3Bif%28obj%20instanceof%20DisplayLine%29%7Bvar%20f%3Dobj.getSimObjects%28%29%5B0%5D%3Bif%28f.getName%28%29.match%28%2F%5ECONTACT_FORCE1%2F%29%29%7Bvar%20pct%3DMath.max%280%2CMath.min%281%2Cf.contactDistance%2Ff.contactTolerance%29%29%3Bobj.setColor%28Util.colorString3%281-pct%2Cpct%2C0%29%29%3B%7D%7D%7D%7D%29%3B>)
which contains the above code running in simple-compiled ContactApp. That link also
sets `EXTRA_ACCEL=none` so you will see the gap distance color vary periodically.

@implements {Observer}
*/
class GenericObserver {
/**
@param {!Subject} subject  the Subject to observe
@param {function(!SubjectEvent)} observeFn  function to execute when a SubjectEvent is
    broadcast by Subject, takes a single argument of type SubjectEvent
@param {string=} opt_purpose Describes what this Observer does, for debugging
*/
constructor(subject, observeFn, opt_purpose) {
  /** Describes what this Observer does, for debugging
  * @type {string}
  * @private
  * @const
  */
  this.purpose_ = Util.ADVANCED ? '' : (opt_purpose || '');
  /**
  * @type {!Subject}
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
}

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort();
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' :
      'GenericObserver{subject_: '+this.subject_.toStringShort()
      +(this.purpose_.length > 0 ? ', purpose_:"'+this.purpose_+'"' : '')
      +'}';
};

/** Disconnects this GenericObserver from the Subject.
@return {undefined}
*/
disconnect() {
  this.subject_.removeObserver(this);
};

/** @override */
observe(event) {
  this.observeFn_(event);
};

} // end class
exports = GenericObserver;
