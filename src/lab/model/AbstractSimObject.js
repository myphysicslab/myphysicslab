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

goog.provide('myphysicslab.lab.model.AbstractSimObject');

goog.require('goog.array');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var SimObject = myphysicslab.lab.model.SimObject;
const Util = goog.module.get('myphysicslab.lab.util.Util');

/** Base class that provides common methods for SimObjects.

* @param {string=} opt_name language-independent name of this SimObject (optional)
* @param {string=} opt_localName localized name of this SimObject (optional)
* @constructor
* @struct
* @abstract
* @implements {SimObject}
*/
myphysicslab.lab.model.AbstractSimObject = function(opt_name, opt_localName) {
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
var AbstractSimObject = myphysicslab.lab.model.AbstractSimObject;

/** @override */
AbstractSimObject.prototype.toString = function() {
  return Util.ADVANCED ? '' :
      this.getClassName()+ '{name_: "' + this.getName() + '"'
      +', expireTime_: '+Util.NF(this.expireTime_)+'}';
};

/** @override */
AbstractSimObject.prototype.toStringShort = function() {
  return Util.ADVANCED ? '' :
      this.getClassName() + '{name_: "' + this.getName() + '"}';
};

/** Counter used for naming SimObjects.
* @type {number}
*/
AbstractSimObject.ID = 1;

/** @abstract */
AbstractSimObject.prototype.getBoundsWorld = function() {};

/** Returns name of class of this object.
* @return {string} name of class of this object.
* @abstract
*/
AbstractSimObject.prototype.getClassName = function() {};

/** @override */
AbstractSimObject.prototype.getExpireTime = function() {
  return this.expireTime_;
};

/** @override */
AbstractSimObject.prototype.getName = function(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @override */
AbstractSimObject.prototype.isMassObject = function() {
  return false;
};

/** @override */
AbstractSimObject.prototype.nameEquals = function(name) {
  return this.name_ == Util.toName(name);
};

/** @override */
AbstractSimObject.prototype.setExpireTime = function(time) {
  this.expireTime_ = time;
  return this;
};

/** @override */
AbstractSimObject.prototype.similar = function(obj, opt_tolerance) {
  return obj == this;
};

}); // goog.scope
