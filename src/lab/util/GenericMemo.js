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

goog.provide('myphysicslab.lab.util.GenericMemo');

goog.require('myphysicslab.lab.util.Memorizable');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var Memorizable = myphysicslab.lab.util.Memorizable;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** A generic {@link myphysicslab.lab.util.Memorizable Memorizable} object that
calls a JavaScript function.

Example 1
---------
Make a GenericMemo that prints the angle variable of a simulation
into the {@link myphysicslab.lab.util.Terminal} output area.
Here `simRun` is an instance of {@link myphysicslab.lab.app.SimRunner}.

    var angle = sim.getVarsList().getVariable('ANGLE');
    var memo = new GenericMemo(function(){println('angle: '+angle.getValue())});
    simRun.addMemo(memo);

This code can be entered as Terminal commands in
{@link myphysicslab.sims.pendulum.PendulumApp} if using simple-compiled version.

Example 2
---------
This sets the color of a spring depending on how much it is stretched.

    var spring = simList.get('spring1');
    var dispSpring = displayList.find(spring);
    var memo = new GenericMemo(function() {
      var stretch = Math.max(Math.min(spring.getStretch(), 1), -1);
      if (stretch < 0) {
        dispSpring.setColorCompressed(UtilityCore.colorString3(-stretch, 0, 0));
      } else {
        dispSpring.setColorExpanded(UtilityCore.colorString3(0, stretch, 0));
      }
    });
    simRun.addMemo(memo);

This script can be entered as Terminal commands in
{@link myphysicslab.sims.engine2D.CartPendulum2App} if using simple-compiled version.


@param {function()} func  function to execute
@param {string=} opt_purpose Describes what this GenericMemo does, for debugging
@constructor
@final
@struct
@implements {Memorizable}
*/
myphysicslab.lab.util.GenericMemo = function(func, opt_purpose) {
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
  this.purpose_ = UtilityCore.ADVANCED ? '' : (opt_purpose || '');
};
var GenericMemo = myphysicslab.lab.util.GenericMemo;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  GenericMemo.prototype.toString = function() {
    return this.toStringShort();
  };

  /** @inheritDoc */
  GenericMemo.prototype.toStringShort = function() {
    return 'GenericMemo{'
        +(this.purpose_.length > 0 ? 'purpose_:"'+this.purpose_+'"' : '')
        +'}';
  };
};

/** @inheritDoc */
GenericMemo.prototype.memorize = function() {
  this.function_();
};

});  // goog.scope
