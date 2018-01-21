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

goog.module('myphysicslab.lab.model.FunctionVariable');

const ConcreteVariable = goog.require('myphysicslab.lab.model.ConcreteVariable');
const Util = goog.require('myphysicslab.lab.util.Util');
const VarsList = goog.require('myphysicslab.lab.model.VarsList');

/** A {@link myphysicslab.lab.model.Variable} whose value is defined by a JavaScript
function. Works only in
[simple-compiled](Building.html#advancedvs.simplecompile) apps.
*/
class FunctionVariable extends ConcreteVariable {
/**
* @param {!VarsList} varsList the VarsList which contains this Variable
* @param {string} name the name of this Variable; this will be underscorized so the
*     English name can be passed in here. See {@link Util#toName}.
* @param {string} localName the localized name of this Variable
* @param {function():number} fnc function that returns a value
*/
constructor(varsList, name, localName, fnc) {
  super(varsList, name, localName);
  /**
  * @type {function():number}
  * @private
  */
  this.function_ = fnc;
  this.setComputed(true);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : super.toString().slice(0, -1)
      + ', function_: '+this.function_+ '}';
};

/** @override */
getBroadcast() {
  return false;
};

/** @override */
getClassName() {
  return 'FunctionVariable';
};

/** @override */
getValue() {
  return this.function_();
};

/** @override */
setBroadcast(value) {
};

/** @override */
setValue(value) {
};

/** @override */
setValueSmooth(value) {
};

} // end class

exports = FunctionVariable;
