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

goog.module('myphysicslab.lab.engine2D.ImpulseSim');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Float64Array');

const Util = goog.require('myphysicslab.lab.util.Util');
const CollisionHandling = goog.require('myphysicslab.lab.engine2D.CollisionHandling');
const CollisionSim = goog.require('myphysicslab.lab.model.CollisionSim');
const CollisionTotals = goog.require('myphysicslab.lab.model.CollisionTotals');
const ComputeForces = goog.require('myphysicslab.lab.engine2D.ComputeForces');
const DebugEngine2D = goog.require('myphysicslab.lab.engine2D.DebugEngine2D');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const Impulse = goog.require('myphysicslab.lab.model.Impulse');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const Random = goog.require('myphysicslab.lab.util.Random');
const RandomLCG = goog.require('myphysicslab.lab.util.RandomLCG');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const UtilEngine = goog.require('myphysicslab.lab.engine2D.UtilEngine');
const UtilityCollision = goog.require('myphysicslab.lab.engine2D.UtilityCollision');

/** Simulation of RigidBody movement with collisions. ImpulseSim adds methods for
collision detection and collision handling to the super-class RigidBodySim.

The overall collision handling algorithm is implemented in
{@link myphysicslab.lab.model.CollisionAdvance}. The two main methods that CollisionAdvance
asks ImpulseSim to perform are:

+ {@link #findCollisions} Returns the current set of collisions and also contacts.
Checks each corner and edge of each body to see if it is penetrating into another body
(or nearby for a contact). Creates a
{@link RigidBodyCollision} corresponding to each collision (or
contact) found and returns them in an array.

+ {@link #handleCollisions} For each collision, calculates and applies the appropriate
impulse to handle the collision.

More information:

+ [2D Physics Engine Overview](Engine2D.html)

+ The math and physics underlying
    [RigidBodySim](http://www.myphysicslab.com/engine2D/rigid-body-en.html),
    [ImpulseSim](http://www.myphysicslab.com/engine2D/collision-en.html) and
    [ContactSim](http://www.myphysicslab.com/engine2D/contact-en.html) are
    described on the myPhysicsLab website.

+ {@link myphysicslab.lab.engine2D.ContactSim} has more about how resting contacts are
found.

+ {@link ComputeForces} is the algorithm used when finding
multiple simultaneous impulses during collision handling.

### Parameters Created

+ ParameterString named `COLLISION_HANDLING`, see {@link #setCollisionHandling}

+ ParameterNumber named `COLLISION_ACCURACY`, see {@link #setCollisionAccuracy}

+ ParameterNumber named `DISTANCE_TOL`, see {@link #setDistanceTol}

+ ParameterNumber named `VELOCITY_TOL`, see {@link #setVelocityTol}

+ ParameterNumber named `RANDOM_SEED`, see {@link #setRandomSeed}

See also the super class for additional Parameters.

### Collision Handling Options

There are several different collision handling options available. See the section on
[Multiple Simultaneous Collisions](Engine2D.html#multiplesimultaneouscollisions) and
{@link CollisionHandling}.

### Contacts During Collision Handling

Resting contacts, joints, and imminent collisions are involved in the collision handling
mechanism, as part of a multiple simultaneous collision.
The {@link #handleCollisions} method
can calculate the impulse needed at each point, which can be a big performance win.

Consider for example a situation where there are 2 or more bodies in resting contact,
and a third body collides into one of the resting bodies. The result will be a complex
series of ricochet collisions back and forth until finally all the bodies are either
separating or in resting contact.

If you calculate such a scenario by considering only one collision at a time, then after
each collision we would step forward in time, find collisions, back up to where we were,
handle the collision, and do that over and over for each ricochet. This would take far
more compute time than doing the equivalent inside of `handleCollisions`.

### Finding the Collision Impulse

This reviews some of the math involved in {@link #handleCollisions}.

Define these symbols

    v_i = initial velocity (vector, length n)
    v_f = final velocity (vector, length n)
    A = n x n matrix giving change in velocity for impulse at each contact
    j = impulses at each contact (vector, length n)
    n = number of contacts
    e = elasticity

Then we have

    v_f = A j + v_i

We also have

    v_f = -e v_i

therefore

    0 = A j + (1+e) v_i

this corresponds to the equation in {@link ComputeForces}

    0 = A f + b

so we put the `(1+e) v_i` factor into the `b` vector when passing to ComputeForces.

If you look at the web page <http://www.myphysicslab.com/collision.html> you will see a
derivation of the following equation giving the value of `j` for a single collision.

    ma = mass of body A
    n = normal vector pointing out from body A (length 1 here)
    j = impulse scalar
    jn = impulse vector
    va = old linear velocity of cm for body A
    va2 = new linear velocity of cm
    wa = old angular velocity for body A
    wa2 = new angular velocity
    ra = vector from body A cm to point of impact = (rax, ray)
    Ia = moment of inertia of body A about center of mass
    vab = relative velocity of contact points (vpa, vpb) on bodies
    vab = (vpa - vpb)
    vpa = va + wa x ra = velocity of contact point
    vab = va + wa x ra - vb - wb x rb
    cross product: w x r = (0,0,w) x (rx, ry, 0) = (-w*ry, w*rx, 0)

                  -(1 + elasticity) vab.n
    j = -------------------------------------
          1     1     (ra x n)^2    (rb x n)^2
        (--- + ---) + ---------  + ---------
          Ma   Mb        Ia           Ib

In an earlier version of `handleCollisions`, the above equation was used directly. Now
we use ComputeForces because there might be multiple simultaneous collisions, but it
amounts to the same equation. If there is only a single collision, then the above
equation still exists in the following pieces:

+ the `(1+e) v_i` factor is in the `b` vector (`v_i` is the same as `vab` above).

+ the denominator is the `A` matrix

This corresponds to solving for `j` as

    0 = A j + (1+e) v_i
    j = -(1 + e) v_i / A

This only works when A is a scalar value not a matrix. Otherwise you would
left-multiply by the inverse of the A matrix.

@todo use {@link UtilityCollision#subsetCollisions1}
to arrange collisions into
separate groups, so that contacts are handled with zero elasticity more often.
Currently, when contacts are handled simultaneously with a high-velocity collision, we
use the non-zero elasticity on the contacts also, even if they are not connected to
the collision.

@todo the momentum stuff was pretty klugey and ugly; I'm commenting it out Dec 2009;
the text info might be useful, but it needs to be made prettier. The 'momentum arrows'
didn't seem to add much insight.

@todo the distance and velocity tolerance is stored on the RigidBody and also
here; this is confusing and error prone; and if they are different then you might
see the wrong value in the user control; could it be useful to have different
distance/velocity tolerance on different bodies? If not, perhaps we can find a better
way to communicate the distance/velocity tolerance to the RigidBody.

@todo collision impact:  make these into a SimObject, similar to Force,
          and add to SimList;  then user can decide how to represent them

@todo The method {@link #findCollisions} is doing twice as much work as
it needs to:  once you check if body A collides with body B, you don't have
to check if body B collides with body A.

* @implements {CollisionSim}
*/
class ImpulseSim extends RigidBodySim {
/**
* @param {string=} opt_name name of this Subject
*/
constructor(opt_name) {
  super(opt_name);
  /**
  * @type {boolean}
  * @private
  */
  this.showCollisions_ = true;
  /**
  * @type {!CollisionHandling}
  * @private
  */
  this.collisionHandling_ = CollisionHandling.SERIAL_GROUPED_LASTPASS;
  /**  The pseudo random number generator, used in collision handling and
  * computing forces.
  * @type {!Random}
  * @protected
  */
  this.simRNG_ = new RandomLCG(0);
  /** 'I' for ImpulseSim
  * @type {!ComputeForces}
  * @private
  */
  this.computeImpacts_ = new ComputeForces('I', this.simRNG_);
  /** Distance tolerance, for determining if RigidBody is in contact with another
  * RigidBody.  Contact point must have relative normal distance less than this.
  * @type {number}
  * @private
  */
  this.distanceTol_ = 0.01;
  /** Velocity tolerance, for determining if RigidBody is in contact with another
  * RigidBody. Contact point must have relative normal velocity smaller than this.
  * @type {number}
  * @private
  */
  this.velocityTol_ = 0.5;
  /** How close in space we need to be to a collision, to decide to handle it,
  * as a percentage of the targetGap = distanceTol/2.
  * @type {number}
  * @protected
  */
  this.collisionAccuracy_ = 0.6;
  /** for warning that proximity test is off
  * @type {number}
  * @private
  */
  this.warningTime_ = 0;
  // Need a special 'setter' because `setCollisionHandling` takes an argument of
  // the enum type `CollisionHandling`, not of type `string`.
  this.addParameter(new ParameterString(this, RigidBodySim.en.COLLISION_HANDLING,
      RigidBodySim.i18n.COLLISION_HANDLING,
      () => this.getCollisionHandling(),
      a => this.setCollisionHandling(CollisionHandling.stringToEnum(a)),
      CollisionHandling.getChoices(), CollisionHandling.getValues()));
  this.addParameter(new ParameterNumber(this, RigidBodySim.en.DISTANCE_TOL,
      RigidBodySim.i18n.DISTANCE_TOL,
      () => this.getDistanceTol(), a => this.setDistanceTol(a))
      .setSignifDigits(5));
  this.addParameter(new ParameterNumber(this, RigidBodySim.en.VELOCITY_TOL,
      RigidBodySim.i18n.VELOCITY_TOL,
      () => this.getVelocityTol(), a => this.setVelocityTol(a))
      .setSignifDigits(3));
  this.addParameter(new ParameterNumber(this, RigidBodySim.en.COLLISION_ACCURACY,
      RigidBodySim.i18n.COLLISION_ACCURACY,
      () => this.getCollisionAccuracy(),
      a => this.setCollisionAccuracy(a))
      .setSignifDigits(3)
      .setUpperLimit(1));
  this.addParameter(new ParameterNumber(this, RigidBodySim.en.RANDOM_SEED,
      RigidBodySim.i18n.RANDOM_SEED,
      () => this.getRandomSeed(), a => this.setRandomSeed(a))
      .setDecimalPlaces(0)
      .setLowerLimit(Util.NEGATIVE_INFINITY));
};

/** @override  */
toString_() {
  return Util.ADVANCED ? '' : ', collisionHandling_: '+this.collisionHandling_
      + ', distanceTol_: '+Util.NF(this.distanceTol_)
      + ', velocityTol_: '+Util.NF(this.velocityTol_)
      + ', collisionAccuracy_: '+Util.NF(this.collisionAccuracy_)
      + ', showCollisions_: '+this.showCollisions_
      + ', simRNG_: '+this.simRNG_
      + super.toString_();
};

/** @override */
getClassName() {
  return 'ImpulseSim';
};

/** @override */
setDebugPaint(fn) {
  this.debugPaint_ = fn;
};

/** Returns the seed of the pseudo random number generator (RNG) used in this
simulation. The RNG is used during collision handling and contact force calculation. To
get reproducible results, set this seed at the start of a simulation, and the RNG will
then always give the same sequence of random numbers.
See {@link Random}.
* @return {number} the seed of the pseudo random number generator
*/
getRandomSeed() {
  return this.simRNG_.getSeed();
};

/** Sets the seed of the pseudo random number generator (RNG) used in this
simulation. The RNG is used during collision handling and contact force calculation. To
get reproducible results, set this seed at the start of a simulation, and the RNG will
then always give the same sequence of random numbers.
See {@link Random}.
* @param {number} value the seed of the pseudo random number generator
*/
setRandomSeed(value) {
  this.simRNG_.setSeed(value);
  this.broadcastParameter(RigidBodySim.en.RANDOM_SEED);
};

/** Returns the collision handling method being used.
* @return {!CollisionHandling} the collision handling method
*     being used, from {@link CollisionHandling}.
*/
getCollisionHandling() {
  return this.collisionHandling_;
};

/** Sets the collision handling method to use,
* @param {!CollisionHandling} value the collision handling
*    method to use, from {@link CollisionHandling}.
*/
setCollisionHandling(value) {
  var a = CollisionHandling.stringToEnum(value);
  goog.asserts.assert(a == value);
  if (this.collisionHandling_ != a) {
    this.collisionHandling_ = a;
    this.broadcastParameter(RigidBodySim.en.COLLISION_HANDLING);
  }
};

/** Returns the collision distance accuracy, a fraction between zero and one; when the
collision distance is within `accuracy * targetGap` of the target gap distance, then
the collision is considered close enough to handle (apply an impulse).
@return {number} the collision accuracy, a fraction between 0 (exclusive) and 1
(inclusive)
*/
getCollisionAccuracy() {
  return this.collisionAccuracy_;
};

/** Sets the collision distance accuracy, a fraction between zero and one; when the
collision distance is within `accuracy * targetGap` of the target gap distance, then
the collision is considered close enough to handle (apply an impulse).
* @param {number} value how close in distance to be in order to handle a collision
* @throws {!Error} if value is out of the range 0 to 1, or is exactly zero
*/
setCollisionAccuracy(value) {
  if (value <= 0 || value > 1) {
    throw 'accuracy must be between 0 and 1, is '+value;
  }
  this.collisionAccuracy_ = value;
  this.bods_.forEach(b => b.setAccuracy(value));
  this.broadcastParameter(RigidBodySim.en.COLLISION_ACCURACY);
};

/** Returns distance tolerance used to determine if an object is in contact with another
object
* @return {number} distance tolerance used to determine if an object is in contact with
  another object
*/
getDistanceTol() {
  return this.distanceTol_;
};

/** Sets distance tolerance to use to determine if an object is in contact with another
object
* @param {number} value distance tolerance to use to determine if an object is in
  contact with another object
*/
setDistanceTol(value) {
  this.distanceTol_ = value;
  this.bods_.forEach(b => b.setDistanceTol(value));
  this.broadcastParameter(RigidBodySim.en.DISTANCE_TOL);
};

/** Returns velocity tolerance used to determine if an object is in contact with another
object
* @return {number} velocity tolerance used to determine if an object is in contact with
  another object
*/
getVelocityTol() {
  return this.velocityTol_;
};

/** Sets velocity tolerance to use to determine if an object is in contact with another
object
* @param {number} value velocity tolerance to use to determine if an object is in
  contact with another object
*/
setVelocityTol(value) {
  this.velocityTol_ = value;
  this.bods_.forEach(b => b.setVelocityTol(value));
  this.broadcastParameter(RigidBodySim.en.VELOCITY_TOL);
};

/** @override */
setShowForces(value) {
  super.setShowForces(value);
  // this is a hack: The goal is to be able to show collisions but not show forces.
  // But because historically these (show collisions and show forces) were set together
  // we need to have setShowForces cause collisions to also be shown.
  this.showCollisions_ = value;
};

/** Whether to to show collisions visually.
* @return {boolean} whether to show collisions visually.
*/
getShowCollisions() {
  return this.showCollisions_;
};

/** Sets whether to show collisions visually. Note that {@link #setShowForces}
* will also change whether to show collisions.
* @param {boolean} value whether to show collisions visually.
*/
setShowCollisions(value) {
  this.showCollisions_ = value;
};

/** @override */
addBody(body) {
  super.addBody(body);
  body.setDistanceTol(this.distanceTol_);
  body.setVelocityTol(this.velocityTol_);
  body.setAccuracy(this.collisionAccuracy_);
};

/** @override */
cleanSlate() {
  super.cleanSlate();
  this.computeImpacts_ = new ComputeForces('I', this.simRNG_);
};

/** Check that infinite mass object remain at rest.
* @param {!Array<number>} vars
* @throws {!Error} if an infinite mass object has non-zero velocity
* @private
*/
checkInfiniteMassVelocity(vars) {
  this.bods_.forEach(b => {
    var idx = b.getVarsIndex();
    goog.asserts.assert(idx >= 0);
    if (b.getMass() == Util.POSITIVE_INFINITY) {
      var vx = vars[idx + RigidBodySim.VX_];
      var vy = vars[idx + RigidBodySim.VY_];
      var vw = vars[idx + RigidBodySim.VW_];
      if (vx != 0 || vy != 0 || vw != 0) {
        console.log(this.formatVars());
        throw Util.DEBUG ? ('infinite mass object must remain at rest '
            +vx+' '+vy+' '+vw+' '+b): '';
      }
    }
  });
};

/** @override */
findCollisions(collisions, vars, stepSize) {
  if (Util.DEBUG)
    this.checkInfiniteMassVelocity(vars);
  if (ImpulseSim.COLLISIONS_DISABLED) {
    return;
  }
  var time = vars[this.varsList_.timeIndex()];
  // NOTE: assumes that bodies have been moved to current positions
  var i, j, k, len, len2;
  for (i=0, len=this.bods_.length; i<len; i++) {
    var bod1 = this.bods_[i];
    // check bod1 against all bodies after it in the list
    loop2:
    for (j = i+1; j < len; j++) {
      var bod2 = this.bods_[j];
      if (bod1.doesNotCollide(bod2) || bod2.doesNotCollide(bod1)) {
        continue loop2;
      }
      // infinite mass objects cannot move, so no contact or collisions between them
      if (bod1.getMass() == Util.POSITIVE_INFINITY
          && bod2.getMass() == Util.POSITIVE_INFINITY)
        continue loop2;
      // if both bodies are moving slowly, do an intersection test
      // Ensure that the bodies cannot move through each other during the time step.
      // minimum width = smallest distance a body could move to entirely cross a line
      // = smallest dimension across the body
      // Let h = time step; m1, m2 = minimum width of body 1, 2
      // v = combined velocity of 1 & 2
      // must have:  h*v < m1+m2, so v < (m1+m2)/h
      var speeding; // bodies are exceeding speed limit for proximity test
      var speed_limit;
      if (DebugEngine2D.PROXIMITY_TEST) {
        // assumes the minimum width is twice the minHeight.
        speed_limit = 2*(bod1.getMinHeight() + bod2.getMinHeight())/stepSize;
        // use lengthCheap because this is a rough test that happens a lot.
        speeding = bod1.getVelocity().lengthCheap()
                  + bod2.getVelocity().lengthCheap() > speed_limit;
      } else {
        // this section turns off the proximity check, and issues a periodic warning
        if (this.getTime() - this.warningTime_ > 5) {
          this.warningTime_ = this.getTime();
          if (Util.DEBUG)
            this.myPrint('%cWARNING:  proximity test is off%c', 'background:#fc6',
                'color:black');
        }
        speeding = true;
        speed_limit = 0;
      }
      if (!speeding) {
        if (!UtilityCollision.intersectionPossible(bod1, bod2, this.distanceTol_))
          continue loop2;
      } else {
        if (1 == 0 && Util.DEBUG) {
          this.myPrint('velocity ' +Util.NF5(bod1.getVelocity().lengthCheap()
              + bod2.getVelocity().lengthCheap())+ ' >  speed limit = '+Util.NF5(speed_limit)
              +' step='+Util.NF5(stepSize));
        }
      }
      var rbcs = /** @type {!Array<!RigidBodyCollision>} */(collisions);
      bod1.checkCollision(rbcs, bod2, time);
    }
  }
  /*  for catching situation where an object escapes past the walls
  Polygon oval = this.bods_[4];
  var outside = oval.getPosition().getX() < -6 || oval.getPosition().getX() > 6
             || oval.getPosition().getY() < -6 || oval.getPosition().getY() > 6;
  if (outside && collisions.length==0) {
    for (i=4; i<this.bods_.length; i++) {
      if (1 == 0 && Util.DEBUG) this.myPrint('bods['+i+'] '+bod1);
      if (1 == 0 && Util.DEBUG) this.myPrint('bods['+i+'].body_old '+bod1.body_old);
    }
    throw Util.DEBUG ? 'point is outside but no collision detected' : '';
  }
  */
  //var time = this.getTime() + stepSize;  // alternative way to get time
  if (1 == 0 && Util.DEBUG && collisions.length > 0) {
    console.log(Util.NF7(time)+' findCollisions stepSize='
            +Util.NF7(stepSize)+' collisions '+collisions.length);
  }
};

/** Returns the change in relative normal velocity at collision ci resulting
from a unit impulse on the given body at collision cj.

We have two collision points, ci and cj. How much does a unit impulse at cj on
the given body affect the relative normal velocity at ci?

To have a direct effect, the body must be directly involved in both collisions.
Let the notation c(a,b) mean that collision c is between bodies a and b. Then for
the pair of collisions

    ci(0,1), cj(1, 2)

we know that the impulse at cj directly affects the velocity of body 1, which in
turn affects the velocity at ci.

On the other hand, if there is no common body in the two collisions, then there
is no direct effect. For example:

    ci(0, 1), cj(2, 3)

Suppose there is an additional contact/collision c(1,2). Still, the impulse at
cj(2,3) only affects bodies 2 and 3, which has no direct effect at the contact
ci(0,1) between bodies 1 and 2. Indirectly, you can get an effect. While the matrix
entry (see {@link #makeCollisionMatrix} for the above combo would be zero, you would
have non-zero entries for:

  ci(0,1), cj(1, 2)
  ci(1,2), cj(2, 3)

Therefore, you would get an indirect effect between ci(0,1) and cj(2,3) thru the
various matrix entries. In solving for the correct amount of impulse at each
collision, the matrix solver will adjust for indirect connections like this. Because
pushing at c(2,3) affects c(1,2), so you may need to adjust the impulse at c(1,2),
which in turn will affect what’s happening at c(0,1).

So, again, the question here is to find the direct effect of a unit impulse at cj
on the given body for the relative normal velocity at ci.

A unit impulse at cj(1,2) has a certain effect on body 1; the effect is a change
in the velocity (all 3 velocities: horizontal, vertical, rotational) which is
calculated by the size of the impulse (assumed to be 1 here), the direction of the
impulse (either the normal of cj or opposite of the normal), and the vector from the
cm (center of mass) of body 1 to cj; this vector is either R or R2 of cj depending
on whether body 1 is the normal body or primary body in collision cj.

The change in normal velocity at ci(0,1) depends on: the change in velocity of
body 1, and the vector from cm of body 1 to ci; this vector is either R or R2 of ci
depending on whether body 1 is the normal body or primary body in collision ci.

The relative normal velocity, vi, at ci(a,b) is given by:

    vi = ni . (va + wa x rai - (vb + wb x rbi))
    ni is the normal at collision ci
    va, vb is the translational velocity of body a or b respectively
    wa, wb is the rotational velocity of body a or b respectively
    rai, rbi is the vector from body a or b's cm to collision ci.

The change in velocity of body a from impulse fj at collision cj is:

    change in translational velocity =  ∆va = fj nj / ma
    change in rotational velocity = ∆wa = (raj x fj nj) / Ia
    ma is the mass of body a
    Ia is the rotational inertia of body a
    nj is the normal at collision cj
    raj is the vector from body a's cm to collision cj.

Therefore, the change in vi from impulse fj at cj on body a is:

    ∆vi = ni . (∆va + ∆wa x rai)
        = ni . ( fj nj/ ma + (raj x fj nj) x rai / Ia)

Note that the change in vi from the impulse fj at cj on body b is not considered
here. Here is how the vector cross product is calculated:

    (rj x n) x ri = [0, 0, rjx ny - rjy nx] x ri
              = [-riy(rjx ny - rjy nx), rix(rjx ny - rjy nx), 0]

* @param {!RigidBodyCollision} ci
* @param {!RigidBodyCollision} cj
* @param {!RigidBody} body
* @return {number} the change in relative normal velocity at collision ci resulting
*      from a unit impulse on the given body at collision cj.
* @private
*/
influence(ci, cj, body) {
  // how much does the impulse fj at cj on given body affect the
  // relative normal velocity at ci?
  if (!isFinite(body.getMass()))
    return 0;
  // The body must be involved in collision ci to have any effect.
  // Find the R vector, from cm of body to impact point ci.
  var r1, r2;
  var rix, riy;
  if (ci.primaryBody==body) {
    r1 = ci.getR1();
    rix = r1.getX();
    riy = r1.getY();
  } else if (ci.normalBody==body) {
    r2 = ci.getR2();
    rix = r2.getX();
    riy = r2.getY();
  } else {
    return 0;
  }
  var rjx, rjy, factor;
  if (cj.primaryBody==body) {
    r1 = cj.getR1();
    rjx = r1.getX();
    rjy = r1.getY();
    factor = 1;
  } else if (cj.normalBody==body) {
    r2 = cj.getR2();
    rjx = r2.getX();
    rjy = r2.getY();
    factor = -1;
  } else {
    return 0;
  }
  return factor * (
    ci.normal.getX() * (cj.normal.getX()/body.getMass()
       - riy * (rjx*cj.normal.getY() - rjy*cj.normal.getX())/body.momentAboutCM())
    + ci.normal.getY() * (cj.normal.getY()/body.getMass()
       + rix * (rjx*cj.normal.getY() - rjy*cj.normal.getX())/body.momentAboutCM())
  );
};

/** Returns a matrix where the `(i, j)`th entry is how much the relative normal
velocity at collision `i` will change from a unit impulse being applied at
collision `j`.

@todo it is a symmetric matrix, so we could save time by only calculating upper
triangle and then copying to lower triangle.

@todo  this is the same as ContactSim.calculate_a_matrix, so we need to
use just one of these (duplicate code currently).  March 2012.

* @param {!Array<!RigidBodyCollision>} collisions list of
*    RigidBodyCollisions
* @return {!Array<!Float64Array>} matrix that tells how much impulse
*    at collision point `i` affects relative normal velocity at collision point `j`
* @protected
*/
makeCollisionMatrix(collisions) {
  var n = collisions.length;
  var A = new Array(n);
  for (var k = 0; k<n; k++) {
    A[k] = new Float64Array(n); //Util.newNumberArray(n);
  }
  for (var i=0; i<n; i++) {
    var ci = collisions[i];
    for (k=0; k<n; k++) {
      var cj = collisions[k];
      A[i][k] += this.influence(ci, cj, ci.primaryBody);
      A[i][k] -= this.influence(ci, cj, ci.normalBody);
    }
  }
  return A;
};

/** @override */
handleCollisions(collisions, opt_totals) {
  var rbcs = /** @type !Array<!RigidBodyCollision>*/(collisions);
  var energy = 0;  // for debugging
  if (collisions.length==0) {
    throw 'empty array passed to handleCollisions';
  }
  if (Util.DEBUG) {
    rbcs.forEach(c => c.checkConsistent());
  }
  if (1 == 0 && Util.DEBUG)
    energy = this.getEnergyInfo().getTotalEnergy();
  var impulse = true;
  switch (this.collisionHandling_) {
    case CollisionHandling.SIMULTANEOUS:
      impulse = this.handleCollisionsSimultaneous(rbcs, opt_totals);
      break;
    case CollisionHandling.HYBRID:
      impulse = this.handleCollisionsSerial(rbcs, /*hybrid=*/true, opt_totals);
      break;
    case CollisionHandling.SERIAL_SEPARATE:
      impulse = this.handleCollisionsSerial(rbcs, /*hybrid=*/false, opt_totals,
          /*grouped=*/false, /*lastPass=*/false);
      break;
    case CollisionHandling.SERIAL_GROUPED:
      impulse = this.handleCollisionsSerial(rbcs, /*hybrid=*/false, opt_totals,
          /*grouped=*/true, /*lastPass=*/false);
      break;
    case CollisionHandling.SERIAL_SEPARATE_LASTPASS:
      impulse = this.handleCollisionsSerial(rbcs, /*hybrid=*/false, opt_totals,
          /*grouped=*/false, /*lastPass=*/true);
      break;
    case CollisionHandling.SERIAL_GROUPED_LASTPASS:
      impulse = this.handleCollisionsSerial(rbcs, /*hybrid=*/false, opt_totals,
          /*grouped=*/true, /*lastPass=*/true);
      break;
    default:
      throw Util.DEBUG ? ('unknown collision handler '+this.collisionHandling_) : '';
  }
  if (0 == 1 && Util.DEBUG) {
    var energy2 = this.getEnergyInfo().getTotalEnergy();
    this.myPrint('handleCollisions energy change '+ Util.NFE(energy2 - energy)
          +' total energy '+Util.NF9(energy2));
  }
  return impulse;
};

/** Handles a set of collisions using the 'simultaneous' collision handling method.
* Finds impulses so that every collision has a change in velocity given by the
* initial velocity and the elasticity.
* @param {!Array<!RigidBodyCollision>} collisions list of
*        RigidBodyCollisions
* @param {!CollisionTotals=} opt_totals CollisionTotals object
*    to update with number of collisions handled (optional)
* @return {boolean} whether any change was made to the collisions
* @private
*/
handleCollisionsSimultaneous(collisions, opt_totals) {
  var n = collisions.length;
  var b = Util.newNumberArray(n);
  var j = Util.newNumberArray(n);
  var e = Util.newNumberArray(n);  // keep track of elasticity for debugging
  var joint = Util.newBooleanArray(n);  // joint is array of boolean
  var nonJoint = false; // whether there is a non-joint
  for (var k=0; k<n; k++) {
    var ck = collisions[k];
    b[k] = ck.getNormalVelocity();
    if (0 == 1 && Util.DEBUG)
      this.myPrint('handle collision['+k+']='+Util.NF5(b[k])+' '+ck);
    // Normal collisions have elasticity;
    // joints and contacts have zero elasticity.
    e[k] = ck.contact() ? 1 : 1 + ck.getElasticity();
    b[k] *= ck.contact() ? 1 : 1 + ck.getElasticity();
    joint[k] = ck.joint;
    nonJoint = nonJoint || !ck.joint;
  }

  // Find the A matrix of how much impact at each collision point
  // affects other collision point gaps.
  var A = this.makeCollisionMatrix(collisions);

  var error = this.computeImpacts_.compute_forces(A, j, b, joint, false,
      this.getTime());
  if (Util.DEBUG && error != -1) {
    // check on how bad the solution is.
    var accel = UtilEngine.matrixMultiply(A, j);
    accel = UtilEngine.vectorAdd(accel, b);
    var tol = 1E-4;
    if (!ComputeForces.checkForceAccel(tol, j, accel, joint)) {
      throw Util.DEBUG ? (Util.NF7(this.getTime())
          +' compute_impulses failed error='+error
          +' with tol='+Util.NFE(tol)) : '';
    } else {
      this.myPrint('warning: compute_impulses failed error='+error
          +' but is within tol='+Util.NFE(tol));
    }
  }

  var impulse = false; // true when a large impulse applied
  var i;
  for (i=0; i<n; i++) {
    var c = collisions[i];
    if (j[i] > ImpulseSim.TINY_IMPULSE) {
      impulse = true;
    }
    this.applyCollisionImpulse(c, j[i]);
  }
  if (nonJoint && impulse) {
    // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
    this.getVarsList().incrSequence(1, 3);
  }
  this.modifyObjects();
  if (opt_totals) {
    opt_totals.addImpulses(1);
  }
  return impulse;
};

/** Handles a set of collisions using the *serial* collision handling method. We keep
handling collisions at random until we reach a state where there is no collision. Note
that this can take many times thru the loop, up to thousands of times.

The idea is that multiple collisions can be simulated as a rapid series of
instantaneous collisions as objects collide and ricochet against each other many times
until they finally separate or the energy of the collisions is absorbed by the
sequence of inelastic collisions. It is as though the objects are all separated by a
tiny gap, so that when object A is struck, it then collides with object B, and then
object B collides with object C and so forth. But this gap is so tiny that no time
passes, and we can calculate the results of all these collisions here very quickly.

Each time thru the loop, we pick a single *focus* collision to resolve. If there
are no joints, then we simply resolve that single collision. If there are joints on
either body involved in the chosen focus collision, we find all the joints that are
connected via other joints (for example, a chain would include all the joints in the
chain). We then do a simultaneous type calculation for that set of original focus
collision plus connected joints. Because we must maintain the velocity of the joint
contact at zero (which means elasticity is zero), we can include the joints in the
calculation and maintain the integrity of the joints.

The order of processing contacts is determined by the randomInts function.
It is important to use randomInts here to ensure that we get an even distribution of
integers each time thru the loop. For example if the same sequence were used every
time thru the loop, then the contacts at the start of the sequence would be processed
much more frequently, and the algorithm would be much less efficient.

To provide a non-random option you can use the {@link #setRandomSeed} method to set
the seed used by the random number generator. This will provide a reproducible series
of random numbers. This is done when running tests.

Turn on the `showVelo` flag to show visually the velocity at each contact point and
get a sense of how this algorithm works. See {@link #setDebugPaint} for additional
steps needed to have the contact forces drawn while stepping thru this method.

The `hybrid` option uses the following policy: Each time thru the loop, we
focus on the collision with the largest velocity, and we include the set of 'active'
collisions (non-joint and non-contact) that are happening on either body involved in
the initial focus collision; we then do simultaneous type collision handling on this
set of collisions.

An example where hybrid option makes a difference: a block falling onto the ground
so that both its corners hit simultaneously -- with hybrid option the block bounces
straight up without spinning, because both collisions are treated simultaneously.
Hybrid works more correctly than simultaneous in cases like the 'one hits two'
scenario, or in Newton's Cradle.
See {@link myphysicslab.test.MultipleCollisionTest} for other
examples.

Contacts are treated with elasticity zero when there are *only contacts* in the set of
collisions. This is to reduce the 'jitter' at contacts, stopping residual velocity at
contact points. But when there is a large velocity collision in the set, then contacts
are treated with the same elasticity as other collisions, as given by `getElasticity()`.

We continue handling collisions until all collision velocities are smaller than
`small_velocity`.

1. For joints: Math.abs(velocity) < small_velocity

2. For non-joints: velocity > -small_velocity  (i.e. positive or small negative)

About doPanic:  It seems to save only about 10 percent on the number of times
thru the loop, but more important is that it might occasionally allow finding
a solution versus being in an infinite loop here.

### Algorithm

The concept here is to consider one 'focus' collision at a time.

Find the set of contacts/joints that are directly involved in that focus collision

1. For the pure serial method, only look at the focus collision
and attached joints

2. For the hybrid method, look at focus and joints, plus other collisions
involving either body of the focus collision

Find the impulse that reverses the velocity at each collision involved
This step uses the simultaneous type of calculation for the set of
collisions under consideration during each step.

Find the new collision velocities, given all the impulses found so far;
continue the above until there are no collisions remaining.

This is like dealing with collisions serially, except we do it all here,
and so avoid going back to the (slow) collision detection loop until
we see that all collision points are separating or in contact.

@todo when only a single collision is being processed, we could avoid a lot of
code here and perhaps save time.  Ie. don't need to set up a sub-matrix, or even
call compute_forces.

@todo make the exception thrown more informational:  is it because accuracy
in the solution is poor, or some other reason.

* @param {!Array<!RigidBodyCollision>} collisions  the set of
*    collisions to handle
* @param {boolean} hybrid  true means use a hybrid collision handling method that uses
*    the 'simultaneous' method in some cases
* @param {!CollisionTotals=} opt_totals CollisionTotals object
*    to update with number of collisions handled (optional)
* @param {boolean=} grouped treat joints connected to focus collision
*    simultaneously with the focus collision and with zero elasticity at the joint.
* @param {boolean=} lastPass do a final 'pass' on all collisions with zero elasticity
*    to ensure that each collision has non-negative velocity.  This pass only happens
*    at end once all collisions are smaller than the small_velocity.
* @param {number=} small_velocity handle collisions until they are this small
* @param {boolean=} doPanic  true means that the velocity tolerance is loosened
*    when there are many successive collisions
* @return {boolean} whether any change was made to the collisions
* @private
*/
handleCollisionsSerial(collisions, hybrid, opt_totals,
      grouped, lastPass, small_velocity, doPanic) {
  grouped = grouped !== undefined ? grouped : true;
  lastPass = lastPass !== undefined ? lastPass : true;
  small_velocity = small_velocity || 0.00001;
  doPanic = doPanic !== undefined ? doPanic : true;
  var n = collisions.length;
  var i;
  var loopCtr = 0; // number of times doing the handle collisions loop below
  /**
  * @type {number}
  * @const
  */
  var LOOP_LIMIT = 100000;
  /**
  * @type {number}
  * @const
  */
  var PANIC_LIMIT = 20*n;
  var loopPanic = PANIC_LIMIT;
  var focus = -1; // index of the collision to handle, or -1 when done
  // debugHCS = print debug messages for handleCollisionsSerial
  var debugHCS = false; //this.getTime() > 1.175;
  var e = Util.newNumberArray(n);  // elasticity at each collision
  var b = Util.newNumberArray(n);  // normal velocity at each collision
  var j2 = Util.newNumberArray(n);  // cumulative impulse (calculated)
  var nv = Util.newNumberArray(n);  // initial normal velocities (debug only)
  var joint = Util.newBooleanArray(n); // which collisions are joints
  var nonJoint = false; // whether there is a non-joint
  if (Util.DEBUG && debugHCS) {
    console.log('handleCollisionSerial start n = '+n);
  }
  for (i=0; i<n; i++) {
    var ck = collisions[i];
    if (Util.DEBUG && debugHCS)
      console.log('collision['+i+']='+ck);
    joint[i] = ck.joint;
    if (grouped) {
      // inelastic joints
      e[i] = joint[i] ? 0 : ck.getElasticity();
    } else {
      // elastic joints
      e[i] = ck.getElasticity();
    }
    b[i] = ck.getNormalVelocity();
    nv[i] = b[i];
    nonJoint = nonJoint || !ck.joint;
  }
  // A = the matrix that says how collisions affect each other
  var A = this.makeCollisionMatrix(collisions);
  // Repeat until there all collisions are 'small'.
  // Here 'small' means: b[i] > -small_velocity for non-joints
  //                  or Math.abs(b[i]) < small_velocity for joints
  do {
    loopCtr++;
    if (doPanic && loopCtr > loopPanic) {
      // we were unable to handle all collisions; try again accepting larger velocity
      small_velocity = small_velocity * 2;
      loopPanic = loopPanic + PANIC_LIMIT;
      if (Util.DEBUG) {
        console.log('loopPanic! loopCtr='+loopCtr
            +' small_velocity='+Util.NF5(small_velocity));
      }
    }
    if (Util.DEBUG && loopCtr > LOOP_LIMIT) {
      // turn on debugging in extreme failure case
      // TO DO: this is not useful anymore.  An exception might be better?
      debugHCS = true;
      console.log('handleCollisionsSerial loopCtr='+loopCtr);
      if (loopCtr <= LOOP_LIMIT+2) {
        collisions.forEach((c, i) => console.log('c['+(i)+'] '+c));
        UtilEngine.printArray('nv ',nv, Util.NFE);
      }
    }
    // Randomly pick a collision (larger than small_velocity) to handle.
    // If all collisions are small, then focus == -1.
    focus = this.hcs_focus(debugHCS, small_velocity, loopCtr, joint, b);
    if (debugHCS && Util.DEBUG && focus > -1) {
      // THIS IS AN EXCELLENT PLACE TO SEE WHAT IS GOING ON
      console.log('focus='+focus+' loopCtr='+loopCtr+' b['+focus+']='+Util.NF7E(b[focus]));
    }
    if (focus == -1 && !lastPass) {
      // no 'final pass'
      break;
    }
    // Handle the focus collision by adding impulse to j2 vector and updating
    // the b vector of normal velocities accordingly.
    this.hcs_handle(hybrid, grouped, debugHCS, small_velocity, loopCtr, focus,
        joint, e, b, j2, collisions, A);
    if (opt_totals) {
      opt_totals.addImpulses(1);
    }
  } while (focus > -1);

  if (Util.DEBUG && debugHCS) {
    // THIS SHOWS THE LARGEST VELOCITY AT END OF THE PROCESS
    console.log('focus= -1 loopCtr='+loopCtr
      +' max b='+Util.NF7E(ImpulseSim.largestVelocity(joint, b)));
  }
  if (Util.DEBUG && debugHCS) {
    for (i=0; i<n; i++) {
      var ck = collisions[i];
      console.log('collision['+i+'] '+ck);
    }
    UtilEngine.printMatrix2('A ',A);
  }

  if (Util.DEBUG && debugHCS) {
    for (i=0; i<n; i++) {
      var c = collisions[i];
      // print velocity before the impulses are applied
      if (j2[i] > ImpulseSim.TINY_IMPULSE || c.joint) {
        console.log('before impulse '
          +' j['+i+']='+Util.NF9(j2[i])
          +' v='+Util.NF9(c.getNormalVelocity())
          +' n='+n);
      }
    }
  }

  // impulse == true when a large impulse has been applied
  var impulse = false;
  for (i=0; i<n; i++) {
    var c = collisions[i];
    if (j2[i] > ImpulseSim.TINY_IMPULSE) {
      impulse = true;
    }
    // apply calculated impulse, changing simulation state
    this.applyCollisionImpulse(c, j2[i]);
    if (Util.DEBUG && debugHCS) {
      console.log('impulse j2['+i+'] = '+Util.NFE(j2[i]));
    }
  }
  if (nonJoint && impulse) {
    // discontinuous change to energy; 1 = KE, 2 = PE, 3 = TE
    this.getVarsList().incrSequence(1, 3);
  }
  this.modifyObjects();

  if (Util.DEBUG && debugHCS) {
    // print the impulses that were calculated and new normal velocity
    for (i=0; i<n; i++) {
      var c = collisions[i];
      if (j2[i]  > ImpulseSim.TINY_IMPULSE || c.joint) {
        console.log('after impulse '
            +' j['+i+']='+Util.NF9(j2[i])
            +' v='+Util.NF9(c.getNormalVelocity())
            +' n='+n
            +' '+c);
      }
    }
  }
  if (Util.DEBUG && loopCtr > 100 + 2*n*Math.log(n+1)) {
    // PRINT WARNING WHEN TOO MANY LOOPS HAVE HAPPENED
    console.log('%c %s %c %s', 'color:red', Util.NF7(this.getTime()),
      'color:black', 'handleCollisions many loops: n='+n
      +' loopCtr='+loopCtr+' small_velocity='+Util.NF5(small_velocity));
  }
  if (Util.DEBUG && debugHCS) {
    console.log('handleCollisions end  impulse='+impulse+' loopCtr='+loopCtr
      +' small_velocity='+Util.NF5(small_velocity));
  }
  return impulse;
};

/** Returns size of 'largest' velocity among the set of velocities.  Here 'largest'
means either:

1. most negative, for regular collisions; or
2. largest in absolute value, for joints

@param {!Array<boolean>} joint which contacts are joints
@param {!Array<number>} b normal velocity at each contact
@return {number} size of largest velocity
@private
*/
static largestVelocity(joint, b) {
  var max = 0;
  if (Util.DEBUG) {
    var i;
    var n = b.length;
    for (i=0; i<n; i++) {
      if (joint[i]) {
        if (Math.abs(b[i]) > max) {
          max = Math.abs(b[i]);
        }
      } else {
        if (b[i] < -max) {
          max = -b[i];
        }
      }
    }
  }
  return max;
};

/** Pick a collision to focus on, either randomly or the 'biggest'.
When we reach a point where there are no more collisions, then `focus = -1`.
Part of the `handleCollisionsSerial` process.

@param {boolean} debugHCS turns on debug messages
@param {number} small_velocity only handle collisions bigger than this
@param {number} loopCtr loop counter, number of times this method has been called
@param {!Array<boolean>} joint which contacts are joints
@param {!Array<number>} b normal velocity at each contact
@return {number} index of focus collision, or -1 when all collisions are small
@private
*/
hcs_focus(debugHCS, small_velocity, loopCtr,
    joint, b) {
  var i, j, k;
  var n = b.length;
  var focus = -1;
  // pick first collision with significant collision velocity from random list
  var indices = this.simRNG_.randomInts(n);
  for (k=0; k<n; k++) {
    j = indices[k];
    if (!joint[j] && b[j] < -small_velocity
        || joint[j] && Math.abs(b[j]) > small_velocity) {
      focus = j;
      break;
    }
  }
  return focus;
};

/** Handles one focus collision within the handleCollisionsSerial process. Modifies the
velocity and impulse for that focus collision, and also adjusts connected collisions
(if any).

@param {boolean} hybrid use hybrid 'simultaneous and serial' collision handling
@param {boolean} grouped treat joints connected to focus collision
@param {boolean} debugHCS turns on debug messages
@param {number} small_velocity only handle collisions bigger than this
@param {number} loopCtr loop counter, number of times this method has been called
@param {number} focus  index of the collision to handle
@param {!Array<boolean>} joint which contacts are joints
@param {!Array<number>} e elasticity at each contact
@param {!Array<number>} b normal velocity at each contact (updated by this method)
@param {!Array<number>} j2 cumulative impulse (updated by this method)
@param {!Array<!RigidBodyCollision>} collisions the set of collisions being treated
@param {!Array<!Float64Array>} A the matrix that says how collisions affect each other
@private
*/
hcs_handle(hybrid, grouped, debugHCS,
    small_velocity, loopCtr, focus, joint, e, b, j2, collisions, A) {
  var i, j, k;
  var n = b.length;
  if (Util.DEBUG && debugHCS) {
    console.log('focus='+focus+' loopCtr='+loopCtr);
    UtilEngine.printArray('b ',b, Util.nf7);
    UtilEngine.printArray('e ',e, Util.nf7);
  }

  var set = Util.newBooleanArray(n);
  if (focus == -1) {
    // during 'final pass' handle all collisions with elasticity = 0
    for (k=0; k<n; k++) {
      set[k] = true;
    }
  } else if (hybrid || grouped) {
    // Find all collisions interconnected by joints to the focus collision.
    // Also for hybrid method, add collisions on either body of focus collision.
    var subset = UtilityCollision.subsetCollisions2(collisions, collisions[focus],
        hybrid, b, -small_velocity);
    var len = subset.length;
    for (i=0; i<len; i++) {
      var c = subset[i];
      // find loc such that collisions[loc] == c
      var loc = goog.array.findIndex(collisions,
        function(element, index, array) {
          return element == c;
        });
      set[loc] = true;
    }
  } else {
    // only one thing in set: the single focus collison
    for (k=0; k<n; k++)
      set[k] = k == focus;
  }
  // make a subset of A matrix and b vector for those in the chosen set
  // example:   set = (F, T, F, F, T, T, F, T)
  //            idx = (-1, 0, -1, -1, 1, 2, -1, 3)
  //            idx2 = (1, 4, 5, 7)
  var n1 = 0;  // n1 = number in subset
  var idx = Util.newNumberArray(n);  // idx = index from big set to subset
  for (k=0; k<n; k++) {
    idx[k] = set[k] ? n1 : -1;
    n1 += set[k] ? 1 : 0;
  }
  var idx2 = Util.newNumberArray(n1);  // idx2 = index from subset to big set
  for (k=0; k<n; k++) {
    if (set[k])
      idx2[idx[k]] = k;
  }
  if (Util.DEBUG && debugHCS) {
    UtilEngine.printArray('idx ', idx);
    UtilEngine.printArray('idx2', idx2);
  }
  var A1;  // A matrix for the subset
  var b1 = null;  // b vector for subset
  var joint1;  // joint flags for subset
  var j1 = Util.newNumberArray(n1);  // impulses for subset
  if (1 == 0 && n1 == n) {
    // DON'T DO THIS  (at least always copy b)
    // this could lead to amplification bugs when we do b *= 1+elasticity
    A1 = A;
    b1 = b;
    joint1 = joint;
  } else {
    // A1 is n1 x n1 matrix of numbers
    A1 = new Array(n1);
    for (k = 0; k<n1; k++) {
      A1[k] = new Float64Array(n1); //Util.newNumberArray(n1);
    }
    b1 = Util.newNumberArray(n1);
    joint1 = Util.newBooleanArray(n1);  // joint1 is array of booleans
    for (i=0; i<n; i++) {
      if (set[i]) {
        b1[idx[i]] = b[i];
        joint1[idx[i]] = joint[i];
        for (j=0; j<n; j++) {
          if (set[j])
            A1[idx[i]][idx[j]] = A[i][j];
        }
      }
    }
  }
  // Solve for impulses j1 using v_f = -e v_i at each colliding contact
  // (and v_f = 0 at joints where elasticity = 0)
  for (k=0; k<n1; k++) {
    // When focus == -1 we want elasticity=0, which means leave b1 as is
    // (equivalent to: multiply b1 by 1+elasticity = 1+0 = 1)
    if (focus != -1) {
      b1[k] *= 1+e[idx2[k]];
    }
    j1[k] = 0;
  }
  var pileDebug = false; //Math.abs(this.getTime() - 16.00) < 1E-4;
  var error = this.computeImpacts_.compute_forces(A1, j1, b1, joint1, pileDebug,
      this.getTime());
  if (1 == 0 && Util.DEBUG) {
    // Print the A matrix and b vector for further analysis.
    // This prints the data needed as input to compute_forces, so that
    // you can try it again as a standalone test, see UtilityTest.
    UtilEngine.printArray2('b', b, Util.NFSCI);
    UtilEngine.printList('joint', joint);
    UtilEngine.printMatrix2('A '+A.length+'x'+A[0].length, A, Util.NFSCI);
  }
  if (error != -1) {
    // check on how bad the solution is.
    var accel = UtilEngine.matrixMultiply(A1, j1);
    accel = UtilEngine.vectorAdd(accel, b1);
    var tol = 1E-4;
    if (!ComputeForces.checkForceAccel(tol, j1, accel, joint1)) {
      throw Util.DEBUG ? (Util.NF7(this.getTime())
          +' compute_impulses failed error='+error
          +' with tolerance='+Util.NFE(tol)) : '';
    } else if (Util.DEBUG) {
      console.log('warning: compute_impulses failed error='+error
              +' but is within tolerance='+Util.NFE(tol));
    }
  }
  if (1 == 0 && Util.DEBUG) {
    console.log(' max impulse '+Util.NFE(UtilEngine.maxSize(j1))  );
  }
  // update the cumulative impulse j2
  for (i=0; i<n1; i++) {
    j2[idx2[i]] += j1[i];
  }
  // update the contact velocities, b
  for (i=0; i<n; i++) {
    for (j=0; j<n; j++) {
      if (set[j])
        b[i] += A[i][j]*j1[idx[j]];
    }
  }
  if (Util.DEBUG && debugHCS) {
    UtilEngine.printArray('idx2', idx2, Util.NF0);
    UtilEngine.printArray('j1', j1, Util.nf7);
    UtilEngine.printArray('j2', j2, Util.nf7);
    UtilEngine.printArray('b ',b, Util.nf7);
  }
  // showVelo = show collision velocities visually (not currently working)
  var showVelo = false;
  if (Util.DEBUG && showVelo && loopCtr > 5) {
    for (k=0; k<n;k++) {
      // Show visually the velocity at contact points
      // with logarithmic scaling.  red = colliding, green = separating.
      var c = collisions[k];
      var mag = 0;
      if (Math.abs(b[k]) < 1E-6) {
        mag = 0.05;
      } else {
        mag = 6.05 + Math.log(Math.abs(b[k]))/ImpulseSim.LOG10;
      }
      mag = (b[k] < 0 ? -1 : 1) * 0.3 * Math.abs(mag);
      //console.log('b='+b[k]+' mag='+mag);
      //color:  b[k] < 0 ? 'red' : 'green'
      this.debugLine('VELOCITY', c.impact1, c.impact1.add(c.normal.multiply(mag)));
      if (this.debugPaint_ != null) {
        this.debugPaint_();
      }
    }
    // MAY 2013:  @todo  invent this myWait function
    //Util.myWait(30);
  }
};

/** Applies the given impulse to the objects involved in the given collision, at
* the impact point of the collision.
* @param {!RigidBodyCollision} cd collision where the impulse
*     should be applied
* @param {number} j magnitude of impulse to apply
* @private
*/
applyCollisionImpulse(cd, j) {
  if (!cd.joint && j < 0) {
    if (j < -ImpulseSim.TINY_IMPULSE) {
      throw Util.DEBUG ? ('negative impulse is impossible '+j+' '+cd) : '';
    } else {
      // change tiny negative impulse to zero impulse; due to tiny numerical error
      j = 0;
    }
  }
  cd.impulse = j;
  if (j == 0) {
    return;
  }
  // Avoid showing second impulse in a pair of opposing impulses;
  // the name indicates if first or second force of pair.
  this.applyImpulse(new Impulse('IMPULSE1', cd.primaryBody, j, cd.impact1, cd.normal, cd.getR1()));
  var i2 = cd.impact2 != null ? cd.impact2 : cd.impact1;
  this.applyImpulse(new Impulse('IMPULSE2', cd.normalBody, -j, i2, cd.normal, cd.getR2()));
  if (0 == 1 && Util.DEBUG) {
    // this is for looking at small impulses
    this.myPrint('impulse='+Util.NFE(j)+' dist='+Util.NFE(cd.distance)
        +' velocity='+Util.NFE(cd.getNormalVelocity()));
  }
  if (ImpulseSim.DEBUG_IMPULSE && Util.DEBUG) {
    if (j > 1e-16)
      this.myPrint('impulse='+Util.NF9(j)+' '+cd);
  }
};

/** Applies the impulse by modifying the simulation variables.
* @param {!Impulse} impulse
* @private
*/
applyImpulse(impulse) {
  var b = impulse.getBody();
  var body = /** @type {!RigidBody} */(b);
  var m = body.getMass();
  if (isFinite(m)) {
    var j = impulse.getMagnitude();
    // Regard small impulse as still being a continuous change to the variable.
    // This is a kludge, needed because of the do_small_impacts step in
    // CollisionAdvance (it does collision handling on joints at every time step).
    var continuous = Math.abs(j) < ImpulseSim.SMALL_IMPULSE;
    var va = this.getVarsList();
    var I = body.momentAboutCM();
    var offset = body.getVarsIndex();
    var normal = impulse.getVector();
    var r1 = impulse.getOffset();
    if (offset > -1) {
      var idx = RigidBodySim.VX_+offset;
      va.setValue(idx, va.getValue(idx) + normal.getX()*j/m, continuous);
      idx = RigidBodySim.VY_+offset;
      va.setValue(idx, va.getValue(idx) + normal.getY()*j/m, continuous);
      idx = RigidBodySim.VW_+offset;
      // w2 = w1 + j(r x n)/I = new angular velocity
      va.setValue(idx, va.getValue(idx) +
          j*(r1.getX() * normal.getY() - r1.getY() * normal.getX())/I, continuous);
    }
  }
  if (this.showCollisions_) {
    impulse.setExpireTime(this.getTime()+0.1);
    this.getSimList().add(impulse);
  }
};

} // end class

/** For debugging, this allows code to look for collisions, but does not actually
* return them. This allows to debug code for finding nearest point between objects.
* @type {boolean}
* @const
* @protected
*/
ImpulseSim.COLLISIONS_DISABLED = false;

/** Show the impulse applied at each collision.
* @type {boolean}
* @const
* @private
*/
ImpulseSim.DEBUG_IMPULSE = false;

/** Impulse smaller than this is regarded as insignificant at various points
* in the collision handling algorithm.
* @type {number}
* @const
* @private
*/
ImpulseSim.TINY_IMPULSE = 1E-12;

/** Impulse smaller than this is not marked as a discontinuous change in the
* velocity variables of the objects colliding.
* @type {number}
* @const
* @private
*/
ImpulseSim.SMALL_IMPULSE = 1E-4;

/**
* @type {number}
* @const
* @private
*/
ImpulseSim.LOG10 = Math.log(10);

exports = ImpulseSim;
