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

goog.module('myphysicslab.lab.util.GenericMemo');

const Memorizable = goog.require('myphysicslab.lab.util.Memorizable');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A generic {@link Memorizable} object that calls a JavaScript function.

Example 1
---------
Make a GenericMemo that prints the angle variable of a simulation
into the {@link myphysicslab.lab.util.Terminal} output area.
Here `simRun` is an instance of {@link myphysicslab.lab.app.SimRunner}.

    var angle = sim.getVarsList().getVariable('ANGLE');
    var memo = new GenericMemo(()=> println('angle: '+angle.getValue()));
    simRun.addMemo(memo);

This code can be entered as Terminal commands in
[simple-compiled PendulumApp](https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html).
Try this [query script](<https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html?var%20angle%20=%20sim.getVarsList().getVariable('ANGLE');var%20memo%20=%20new%20GenericMemo(()=> println('angle:%20'+angle.getValue()));simRun.addMemo(memo);layout.showTerminal(true);>)
which contains the above code.

Use the following to turn off the GenericMemo:

    simRun.removeMemo(memo);


Example 2
---------
This sets the color of a spring depending on how much it is stretched.

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

This script can be entered as Terminal commands in
[simple-compiled CartPendulum2App](https://www.myphysicslab.com/develop/build/sims/engine2D/CartPendulum2App-en.html).
Try this [query script](<https://www.myphysicslab.com/develop/build/sims/engine2D/CartPendulum2App-en.html?var%20spring=simList.get('spring1');var%20dispSpring=displayList.findSpring(spring);var%20memo=new%20GenericMemo(function(){var%20stretch=Math.max(Math.min(spring.getStretch(),1),-1);if(stretch%3C0){dispSpring.setColorCompressed(Util.colorString3(-stretch,0,0));}else{dispSpring.setColorExpanded(Util.colorString3(0,stretch,0));}});simRun.addMemo(memo);layout.showTerminal(true);>)
which contains the above code.

Example 3
---------
This stops a simulation after 2 seconds. Clicking the "play" button will then continue
the simulation, because `once` has been set false. To re-enable the behavior, set
`once` to true.

    var once = true;
    var memo = new GenericMemo(function(){
        if (once && sim.getTime()>2)
          {once=false;simRun.pause()}
    });
    simRun.addMemo(memo);

This script can be entered as Terminal commands in any simple-compiled simulation.

@implements {Memorizable}
*/
class GenericMemo {
/**
@param {function()} func  function to execute
@param {string=} opt_purpose Describes what this GenericMemo does, for debugging
*/
constructor(func, opt_purpose) {
  /**
  * @type {function()}
  * @private
  * @const
  */
  this.function_ = func;
  /** Describes what this GenericMemo does, for debugging
  * @type {string}
  * @private
  * @const
  */
  this.purpose_ = Util.ADVANCED ? '' : (opt_purpose || '');
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort();
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'GenericMemo{'
      +(this.purpose_.length > 0 ? 'purpose_:"'+this.purpose_+'"' : '')
      +'}';
};

/** @override */
memorize() {
  this.function_();
};

} // end class
exports = GenericMemo;
