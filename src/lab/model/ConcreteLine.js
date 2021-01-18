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

goog.module('myphysicslab.lab.model.ConcreteLine');

const AbstractSimObject = goog.require('myphysicslab.lab.model.AbstractSimObject');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Line = goog.require('myphysicslab.lab.model.Line');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Util = goog.require('myphysicslab.lab.util.Util');

/** A {@link myphysicslab.lab.model.Line} whose endpoints can be modified.

* @implements {Line}
*/
class ConcreteLine extends AbstractSimObject {
/**
* @param {string} name the name of this ConcreteLine, for scripting
* @param {!Vector=} startPt  starting point, default is the origin
* @param {!Vector=} endPt  ending point, default is the origin
*/
constructor(name, startPt, endPt) {
  super(name);
  /**
  * @type {!Vector}
  * @private
  */
  this.startPt_ = goog.isObject(startPt) ? startPt : Vector.ORIGIN;
  /**
  * @type {!Vector}
  * @private
  */
  this.endPt_ = goog.isObject(endPt) ? endPt : Vector.ORIGIN;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' :
      super.toString().slice(0, -1)
      +', startPoint: '+this.getStartPoint()
      +', endPoint: '+this.getEndPoint()
      +'}';
};

/** @override */
getClassName() {
  return 'ConcreteLine';
};

/** @override */
getBoundsWorld() {
  return DoubleRect.make(this.getStartPoint(), this.getEndPoint());
};

/** @override */
getEndPoint() {
  return this.endPt_;
};

/** @override */
getStartPoint() {
  return this.startPt_;
};

/** @override */
getVector() {
  return this.getEndPoint().subtract(this.getStartPoint());
};

/** Sets ending point of the line.
@param {!Vector} loc the ending point in world coords.
*/
setEndPoint(loc) {
  this.endPt_ = loc;
};

/** Sets starting point of the line.
@param {!Vector} loc the starting point in world coords.
*/
setStartPoint(loc) {
  this.startPt_ = loc;
};

/** @override */
similar(obj, opt_tolerance) {
  if (!(obj instanceof ConcreteLine)) {
    return false;
  }
  const ml = /** @type {!ConcreteLine}*/(obj);
  if (!ml.getStartPoint().nearEqual(this.getStartPoint(), opt_tolerance)) {
    return false;
  }
  return ml.getEndPoint().nearEqual(this.getEndPoint(), opt_tolerance);
};

} // end class
exports = ConcreteLine;
