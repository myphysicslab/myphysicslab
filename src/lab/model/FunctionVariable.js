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

goog.provide('myphysicslab.lab.model.FunctionVariable');

goog.require('myphysicslab.lab.model.ConcreteVariable');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var ConcreteVariable = myphysicslab.lab.model.ConcreteVariable;
const Util = goog.module.get('myphysicslab.lab.util.Util');
var VarsList = myphysicslab.lab.model.VarsList;

/** A {@link myphysicslab.lab.model.Variable} whose value is defined by a JavaScript
function.

@param {!VarsList} varsList the VarsList which contains this Variable
@param {string} name the name of this Variable; this will be underscorized so the
    English name can be passed in here. See {@link Util#toName}.
@param {string} localName the localized name of this Variable
* @param {function():number} fnc function that returns a value
* @constructor
* @final
* @struct
* @extends {ConcreteVariable}
*/
myphysicslab.lab.model.FunctionVariable = function(varsList, name, localName, fnc) {
  ConcreteVariable.call(this, varsList, name, localName);
  /**
  * @type {function():number}
  * @private
  */
  this.function_ = fnc;
  this.setComputed(true);
};
var FunctionVariable = myphysicslab.lab.model.FunctionVariable;
goog.inherits(FunctionVariable, ConcreteVariable);

if (!Util.ADVANCED) {
  /** @override */
  FunctionVariable.prototype.toString = function() {
    return FunctionVariable.superClass_.toString.call(this).slice(0, -1)
        + ', function_: '+this.function_+ '}';
  };
};

/** @override */
FunctionVariable.prototype.getBroadcast = function() {
  return false;
};

/** @override */
FunctionVariable.prototype.getClassName = function() {
  return 'FunctionVariable';
};

/** @override */
FunctionVariable.prototype.getValue = function() {
  return this.function_();
};

/** @override */
FunctionVariable.prototype.setBroadcast = function(value) {
};

/** @override */
FunctionVariable.prototype.setValue = function(value) {
};

/** @override */
FunctionVariable.prototype.setValueSmooth = function(value) {
};

}); // goog.scope
