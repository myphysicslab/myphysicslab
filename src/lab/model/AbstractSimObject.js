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

goog.module('myphysicslab.lab.model.AbstractSimObject');

goog.require('goog.array');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Base class that provides common methods for SimObjects.

* @abstract
* @implements {SimObject}
*/
class AbstractSimObject {
/**
* @param {string=} opt_name language-independent name of this SimObject (optional)
* @param {string=} opt_localName localized name of this SimObject (optional)
*/
constructor(opt_name, opt_localName) {
  var name = opt_name || 'SIM_OBJ'+AbstractSimObject.ID++;
  /**
  * @type {string}
  * @private
  */
  this.name_ = Util.validName(Util.toName(name));
  /**
  * @type {string}
  * @private
  */
  this.localName_ = opt_localName || name;
  /**
  * @type {number}
  * @private
  */
  this.expireTime_ = Util.POSITIVE_INFINITY;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' :
      this.getClassName()+ '{name_: "' + this.getName() + '"'
      +', expireTime_: '+Util.NF(this.expireTime_)+'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' :
      this.getClassName() + '{name_: "' + this.getName() + '"}';
};

/** @abstract */
getBoundsWorld() {};

/** Returns name of class of this object.
* @return {string} name of class of this object.
* @abstract
*/
getClassName() {};

/** @override */
getExpireTime() {
  return this.expireTime_;
};

/** @override */
getName(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @override */
isMassObject() {
  return false;
};

/** @override */
nameEquals(name) {
  return this.name_ == Util.toName(name);
};

/** @override */
setExpireTime(time) {
  this.expireTime_ = time;
  return this;
};

/** @override */
similar(obj, opt_tolerance) {
  return obj == this;
};

} // end class

/** Counter used for naming SimObjects.
* @type {number}
*/
AbstractSimObject.ID = 1;

exports = AbstractSimObject;
