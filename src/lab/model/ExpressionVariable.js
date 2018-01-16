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

goog.provide('myphysicslab.lab.model.ExpressionVariable');

goog.require('myphysicslab.lab.model.ConcreteVariable');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var ConcreteVariable = myphysicslab.lab.model.ConcreteVariable;
var Terminal = myphysicslab.lab.util.Terminal;
var Util = goog.module.get('myphysicslab.lab.util.Util');
var VarsList = myphysicslab.lab.model.VarsList;

/** A {@link myphysicslab.lab.model.Variable} whose value is defined by a JavaScript
expression which is evaluated at runtime.

An example of using ExpressionVariable is in
{@link myphysicslab.sims.springs.SingleSpringApp}. This adds a variable whose value is
`sin(time)`:

    var va = sim.getVarsList();
    va.addVariable(new ExpressionVariable(va, 'sin_time', 'sin(time)',
        this.terminal, 'Math.sin(sim.getTime());'));

The variable can then be displayed in a graph.


* @param {!VarsList} varsList the VarsList which contains this Variable
* @param {string} name the name of this Variable; this will be underscorized so the
*     English name can be passed in here. See {@link Util#toName}.
* @param {string} localName the localized name of this Variable
* @param {!Terminal} terminal the Terminal object used for evaluating the script
* @param {string} script the JavaScript expression to evaluate that will provide the
*     variable's value
* @constructor
* @final
* @struct
* @extends {ConcreteVariable}
*/
myphysicslab.lab.model.ExpressionVariable = function(varsList, name, localName,
    terminal, script) {
  ConcreteVariable.call(this, varsList, name, localName);
  /**
  * @type {!Terminal}
  * @private
  */
  this.terminal_ = terminal;
  /**
  * @type {string}
  * @private
  */
  this.expression_ = script;
  this.setComputed(true);
};
var ExpressionVariable = myphysicslab.lab.model.ExpressionVariable;
goog.inherits(ExpressionVariable, ConcreteVariable);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  ExpressionVariable.prototype.toString = function() {
    return ExpressionVariable.superClass_.toString.call(this).slice(0, -1)
        + ', expression_: "'+this.expression_+'"'+ '}';
  };
};

/** @inheritDoc */
ExpressionVariable.prototype.getBroadcast = function() {
  return false;
};

/** @inheritDoc */
ExpressionVariable.prototype.getClassName = function() {
  return 'ExpressionVariable';
};

/** @inheritDoc */
ExpressionVariable.prototype.getValue = function() {
  var r = this.terminal_.eval(this.expression_, /*output=*/false);
  return goog.isNumber(r) ? r : Number.NaN;
};

/** @inheritDoc */
ExpressionVariable.prototype.setBroadcast = function(value) {
};

/** @inheritDoc */
ExpressionVariable.prototype.setValue = function(value) {
};

/** @inheritDoc */
ExpressionVariable.prototype.setValueSmooth = function(value) {
};

}); // goog.scope
