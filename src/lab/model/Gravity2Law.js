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

goog.module('myphysicslab.lab.model.Gravity2Law');

const array = goog.require('goog.array');
const asserts = goog.require('goog.asserts');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const Force = goog.require('myphysicslab.lab.model.Force');
const ForceLaw = goog.require('myphysicslab.lab.model.ForceLaw');
const MassObject = goog.require('myphysicslab.lab.model.MassObject');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Applies gravitational force between each pair of objects proportional to the
inverse square of distance between them. The equation for the force is

    F = G m1 m2 / r^2

for two objects with masses `m1, m2` separated by distance `r`,
with strength of gravity `G`.

The set of objects can be specified with the {@link #addBody} method, or the
Gravity2Law can observe a SimList and automatically add all bodies that have
mass to the set of objects.

Parameters Created
------------------

+ ParameterNumber named `GRAVITY`, see {@link #setGravity}

* @implements {ForceLaw}
* @implements {Observer}
*/
class Gravity2Law extends AbstractSubject {
/**
* @param {number} gravity strength of gravity force
* @param {!SimList=} opt_simList optional SimList to observe
    for when objects are added; also adds all existing bodies on that SimList.
*/
constructor(gravity, opt_simList) {
  var id = Gravity2Law.NAME_ID++;
  var nm = 'GRAVITY_INVERSE_SQUARE_LAW' + (id > 0 ? '_'+id : '');
  super(nm);
  /**
  * @type {number}
  * @private
  */
  this.gravity_ = gravity;
  /**
  * @type {!Array<!MassObject>}
  * @private
  */
  this.bods_ = [];
  /**
  * @type {?SimList}
  * @private
  */
  this.simList_ = null;
  if (opt_simList != null) {
    this.connect(opt_simList);
  };
  this.addParameter(new ParameterNumber(this, Gravity2Law.en.GRAVITY,
      Gravity2Law.i18n.GRAVITY,
      () => this.getGravity(), a => this.setGravity(a))
      .setSignifDigits(4));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', bodies: '+this.bods_.length
      + super.toString();
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' :
      super.toStringShort().slice(0, -1)
      +', gravity: '+Util.NF5(this.gravity_)+'}';
};

/** @override */
getClassName() {
  return 'Gravity2Law';
};

/** Adds any MassObjects with finite mass among the given list of SimObjects.
@param {!Array<!SimObject>} bodies set of SimObjects to
  possibly add
*/
addBodies(bodies) {
  bodies.forEach(body => this.addBody(body));
};

/** Adds the SimObject to list of objects that Gravity2Law applies
forces to, but only if it has positive finite mass.
* @param {!SimObject} obj the SimObject to possibly add
*/
addBody(obj) {
  if (!obj.isMassObject() || array.contains(this.bods_, obj)) {
    return;
  }
  var mobj = /** @type {!MassObject}*/(obj);
  var m = mobj.getMass();
  if (m > 0 && isFinite(m)) {
    this.bods_.push(mobj);
  }
};

/** @override */
calculateForces() {
  // Calculate the force between each pair of bodies.
  // Avoid duplicate calculations by only looking at the 'upper triangle' of the matrix:
  // in a matrix of bodies x bodies, only look at the entries above the diagonal.
  var bodies2 = array.toArray(this.bods_);
  var forces = [];
  var j = 0;
  var n = bodies2.length;
  this.bods_.forEach(body1 => {
    j++;
    var m1 = body1.getMass();
    if (m1 <= 0 || !isFinite(m1)) // skip infinite mass and zero mass objects
      return;  // go to next body1
    var body1cm = body1.getPosition();
    for (var k=j; k<n; k++) {
      var body2 = bodies2[k];
      var m2 = body2.getMass();
      if (m2 <= 0 || !isFinite(m2)) // skip infinite mass and zero mass objects
        continue;  // go to next body2
      var vector = body1cm.subtract(body2.getPosition());
      var r = vector.length();
      var direction = vector.normalize();
      if (direction != null) {
        direction = direction.multiply(this.gravity_ * m1 * m2 / (r * r));
        forces.push(new Force('gravity', body1,
            /*location=*/body1.getPosition(), CoordType.WORLD,
            /*direction=*/direction.multiply(-1), CoordType.WORLD));
        forces.push(new Force('gravity', body2,
            /*location=*/body2.getPosition(), CoordType.WORLD,
            /*direction=*/direction, CoordType.WORLD));
      }
    }
  });
  return forces;
};

/** Connect to the given SimList, so that the force applies to all objects in the
SimList. Also adds all existing bodies on that SimList.
* @param {!SimList} simList  the SimList to connect with
*/
connect(simList) {
  this.addBodies(simList.toArray());
  simList.addObserver(this);
  this.simList_ = simList;
};

/** @override */
disconnect() {
  if (this.simList_ != null) {
    this.simList_.removeObserver(this);
  }
};

/** @override */
getBodies() {
  return Array.from(this.bods_);
};

/** Returns the strength of gravity, the `G` factor in `F = G m1 m2 / r^2`.
* @return {number} the strength of gravity
*/
getGravity() {
  return this.gravity_;
};

/** Returns potential energy from gravity of the collection of MassObjects. Finds
potential energy for each pair of objects and adds all these. Zero potential energy for
each pair of objects is when they are at the minimum possible distance, as given by
their {@link MassObject#getMinHeight} methods. If both objects
have zero minimum radius, then this method will throw an exception.

### Background on the calculations:

    what is the potential energy of gravity?
    suppose 2 point mass objects m1, m2 are separated by r. Then they move so that they
    are separated by 0.
    Assume that m2 is fixed in space, so only m1 moves.  The force on m1 is
    G m1 m2 / r^2
    So the work done is the integral of force times distance:
    integral (G m1 m2 / x^2 ) dx  from r to 0

    - G m1 m2 / x  from r to 0  = G m1 m2 / r

    Check that this corresponds to potential energy of gravity near earths surface:

    Suppose m1 moves from r2, slightly closer to r1.
    Then the change in potential energy is (sign is probably off:)
    G m1 m2 (1/r2 - 1/r1) = G m1 m2 (r1 - r2 / r1 r2)

    At earths surface r1 and r2 are practically the same number:
    Let r2 = R + e2 and r1 = R + e1,   where e2 << R and e1 << R.
    Then change in PE = G m1 m2 (e2 - e1 / R^2)
    This matches the rule: PE = m g y, so that change in PE is m g (y2 - y1)
    where g = G m2 / R^2 and m2 = mass of the earth, R = radius of the earth.

    Actually it looks like this is correct:
    PE = - G m1 m2 / r

At infinite separation, the PE is zero, and the PE becomes a bigger negative number
as the objects approach.

For each pair, the zero energy is reached when they are at their closest possible
separation. Take whatever that number for PE is (a negative number) and subtract this
from the PE to get a positive PE that goes to zero as the objects approach each other.
As long as one of the objects has a non-zero minimum radius, then we can get a
non-infinite number for the minimum PE.

* @return {number} the potential energy due to this ForceLaw
*/
getPotentialEnergy() {
  var pe = 0;
  var bodies2 = array.toArray(this.bods_);
  var j = 0;
  var n = bodies2.length;
  this.bods_.forEach(body1 => {
    j++;
    var m1 = body1.getMass();
    if (m1 <= 0 || !isFinite(m1)) // skip infinite mass and zero mass objects
      return;  // go to next body1
    var h1 = body1.getMinHeight();
    var body1cm = body1.getPosition();
    for (var k=j; k<n; k++) {
      var body2 = bodies2[k];
      var m2 = body2.getMass();
      if (m2 <= 0 || !isFinite(m2)) // skip infinite mass and zero mass objects
        continue;  // go to next body2
      var h2 = body2.getMinHeight();
      var vector = body1cm.subtract(body2.getPosition());
      var r = vector.length();
      pe += this.gravity_ * m1 * m2 * ((1 / (h1 + h2)) - (1 / r)) ;
      //console.log('pe='+pe+' r='+r+' h1+h2='+(h1+h2));
    }
  });
  return pe;
};

/** @override */
observe(event) {
  var obj;
  if (event.nameEquals(SimList.OBJECT_ADDED)) {
    obj = /** @type {!SimObject} */ (event.getValue());
    this.addBody(obj);
  } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
    obj = /** @type {!SimObject} */ (event.getValue());
    array.remove(this.bods_, obj);
    asserts.assert(!array.contains(this.bods_, obj));
  }
};

/** Specifies the set of MassObjects to apply forces on.
* @param {!Array<!MassObject>} bodies the set of
    MassObjects to apply forces on.
*/
setBodies(bodies) {
  this.bods_ = Array.from(bodies);
};

/** Sets the strength of gravity, the `G` factor in `F = G m1 m2 / r^2`.
* @param {number} gravity the strength of gravity
*/
setGravity(gravity) {
  this.gravity_ = gravity;
  this.broadcastParameter(Gravity2Law.en.GRAVITY);
};

} // end class

/**
* @type {number}
*/
Gravity2Law.NAME_ID = 0;

/** Set of internationalized strings.
@typedef {{
  GRAVITY: string
  }}
*/
Gravity2Law.i18n_strings;

/**
@type {Gravity2Law.i18n_strings}
*/
Gravity2Law.en = {
  GRAVITY: 'gravity'
};

/**
@private
@type {Gravity2Law.i18n_strings}
*/
Gravity2Law.de_strings = {
  GRAVITY: 'Gravitation'
};

/** Set of internationalized strings.
@type {Gravity2Law.i18n_strings}
*/
Gravity2Law.i18n = goog.LOCALE === 'de' ?
    Gravity2Law.de_strings :
    Gravity2Law.en;

exports = Gravity2Law;
