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

    var obs = new GenericObserver(clock, function(evt) {
      println('event='+evt);
    });

Paste that code into the Terminal command line of any [simple-compiled application](https://www.myphysicslab.com/develop/build/index-en.html), or
[try this link](<https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html?var%20obs=new%20GenericObserver(clock,function(evt){println('event='+evt);});layout.showTerminal(true);>)
which contains the above code running in the simple-compiled pendulum simulation. Click
the rewind, play, and step buttons to see events in the Terminal output area.

Use the following to turn off the GenericObserver:

    clock.removeObserver(obs);

Example 2
---------
This prints only when a particular Clock event occurs:

    var obs = new GenericObserver(clock, function(evt) {
        if (evt.nameEquals(Clock.CLOCK_PAUSE)) {
          println('event='+evt);
        }
    });

Paste that code into the Terminal command line of any [simple-compiled application](https://www.myphysicslab.com/develop/build/index-en.html), or
[try this link](<https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html?var%20obs=new%20GenericObserver(clock,function(evt){if(evt.nameEquals(Clock.CLOCK_PAUSE)){println('event='+evt);}});layout.showTerminal(true);>)
which contains the above code running in the simple-compiled pendulum simulation. Click
the pause button to see events in the Terminal output area.

Example 3
---------
This sets color of a contact force line according to gap distance: red = zero distance,
green = max distance. This is useful to study the effects of using different settings
for {@link myphysicslab.lab.engine2D.ExtraAccel}.

    new GenericObserver(displayList, function(evt) {
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
[try this link](<https://www.myphysicslab.com/develop/build/sims/engine2D/ContactApp-en.html?NUMBER_OF_OBJECTS=1;EXTRA_ACCEL=none;ELASTICITY=0.6;SIM_CANVAS.ALPHA=1;SIM_CANVAS.BACKGROUND="";new%20GenericObserver(displayList,function(evt){if(evt.nameEquals(DisplayList.OBJECT_ADDED)){var%20obj=evt.getValue();if(obj%20instanceof%20DisplayLine){var%20f=obj.getSimObjects()[0];if(f.getName().match(/^CONTACT_FORCE1/)){var%20pct=Math.max(0,Math.min(1,f.contactDistance/f.contactTolerance));obj.setColor(Util.colorString3(1-pct,pct,0));}}}});>)
which contains the above code running in simple-compiled ContactApp. That link also
sets `EXTRA_ACCEL=none` so you will see the gap distance color vary periodically.

@implements {Observer}
*/
class GenericObserver {
/**
@param {!Subject} subject  the Subject to observe
@param {function(!SubjectEvent)} observeFn  function to execute when a SubjectEvent is
    broadcast by Subject
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
