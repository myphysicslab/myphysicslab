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

goog.module('myphysicslab.sims.roller.AbstractPath');

const Util = goog.require('myphysicslab.lab.util.Util');
const ParametricPath = goog.require('myphysicslab.lab.model.ParametricPath');

/** An abstract base class for a ParametricPath.

This is package-private to ensure that any changes to it are coordinated
with all its subclasses.

* @package
* @abstract
* @implements {ParametricPath}
*/
class AbstractPath {
/**
* @param {string} name language independent name
* @param {string} localName localized (internationalized) name
* @param {number} startTValue starting `t` value for defining path
* @param {number} finishTValue  ending `t` value for defining path
* @param {boolean} closedLoop `true` means the path is a closed loop
*/
constructor(name, localName, startTValue, finishTValue, closedLoop) {
  /**
  * @type {string}
  * @private
  */
  this.name_ = Util.validName(Util.toName(name));
  /**
  * @type {string}
  * @private
  */
  this.localName_ = localName || name;
  /**
  * @type {number}
  * @protected
  */
  this.startTValue_ = startTValue;
  /**
  * @type {number}
  * @protected
  */
  this.finishTValue_ = finishTValue;
  /**
  * @type {boolean}
  * @protected
  */
  this.closedLoop_ = closedLoop;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.getClassName()+'{name_: "'+this.name_+'"'
    +', localName_: "'+this.localName_+'"'
    +', startTValue_: '+Util.NF(this.startTValue_)
    +', finishTValue_: '+Util.NF(this.finishTValue_)
    +', closedLoop_: '+this.closedLoop_
    +'}';
};

/** @abstract */
x_func(t) {};

/** @abstract */
y_func(t) {};

/** Returns name of class of this object.
* @return {string} name of class of this object.
* @abstract
*/
getClassName() {};

/** @override */
getName(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @override */
getFinishTValue() {
  return this.finishTValue_;
};

/** @override */
getStartTValue() {
  return this.startTValue_;
};

/** @override */
isClosedLoop() {
  return this.closedLoop_;
};

/** @override */
nameEquals(name) {
  return this.name_ == Util.toName(name);
};

/** Sets whether the path is a closed loop, ending at the same point it starts.
* @param {boolean} value whether the path is a closed loop
*/
setClosedLoop(value) {
  this.closedLoop_ = value;
};

/** Sets the ending value for `t` in the parameteric equation defining the path.
* @param {number} value ending value for `t`
*/
setFinishTValue(value) {
  this.finishTValue_ = value;
};

/** Sets the starting value for `t` in the parameteric equation defining the path.
* @param {number} value starting value for `t`
*/
setStartTValue(value) {
  this.startTValue_ = value;
};

} //end class

exports = AbstractPath;
