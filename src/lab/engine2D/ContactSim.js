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

goog.module('myphysicslab.lab.engine2D.ContactSim');

goog.require('goog.array');
goog.require('goog.asserts');

const ComputeForces = goog.require('myphysicslab.lab.engine2D.ComputeForces');
const Connector = goog.require('myphysicslab.lab.engine2D.Connector');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const Force = goog.require('myphysicslab.lab.model.Force');
const GenericEvent = goog.require('myphysicslab.lab.util.GenericEvent');
const ImpulseSim = goog.require('myphysicslab.lab.engine2D.ImpulseSim');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBodyCollision = goog.require('myphysicslab.lab.engine2D.RigidBodyCollision');
const RigidBodySim = goog.require('myphysicslab.lab.engine2D.RigidBodySim');
const Scrim = goog.require('myphysicslab.lab.engine2D.Scrim');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const Simulation = goog.require('myphysicslab.lab.model.Simulation');
const UtilEngine = goog.require('myphysicslab.lab.engine2D.UtilEngine');
const UtilityCollision = goog.require('myphysicslab.lab.engine2D.UtilityCollision');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Physics engine for rigid bodies with contact forces to allow resting contact. The
contact forces prevent the bodies from interpenetrating when they are in resting
contact. Resting contact means the bodies are not colliding, but have edges and corners
that are in continuous contact and exerting force on each other.

The overall idea is to calculate the exact amount of force needed to *just barely*
prevent the objects from penetrating. These contact forces are calculated in the
{@link #evaluate} method, which is called by the
{@link myphysicslab.lab.model.DiffEqSolver} at
the request of the {@link myphysicslab.lab.model.AdvanceStrategy} to advance the state
of the simulation.

### Parameters Created

+ ParameterString named `EXTRA_ACCEL`, see {@link #setExtraAccel}

See also the super class for additional Parameters.

### Background and References

See explanations at:

+ [2D Physics Engine Overview](Engine2D.html)

+ The math and physics underlying
    [RigidBodySim](http://www.myphysicslab.com/engine2D/rigid-body-en.html),
    [ImpulseSim](http://www.myphysicslab.com/engine2D/collision-en.html) and
    [ContactSim](http://www.myphysicslab.com/engine2D/contact-en.html) are
    described on the myPhysicsLab website.

+ [ContactSim Math](ContactSim_Math.html)  has more details about the math.

The algorithm used here is based on these papers:

+ David Baraff, [Fast Contact Force Computation for Nonpenetrating Rigid Bodies.](Baraff_Fast_Contact_Force_94.pdf)
Computer Graphics Proceedings, Annual Conference Series, 1994; pages 23-34.

+ David Baraff, [An Introduction to Physically Based Modeling: Rigid Body Simulation II—Nonpenetration Constraints.](Baraff_Siggraph_97_Course_Notes.pdf)
Siggraph '97 Course Notes.

See also the [list of David Baraff's papers](http://www-2.cs.cmu.edu/~baraff/papers/index.html).

See the paper [Curved Edge Physics paper](CEP_Curved_Edge_Physics.pdf) by Erik Neumann
for modifications to contact forces when curved edges are involved.

### Find External Forces

Within `evaluate()` we first let the super-class apply the external forces to the
RigidBody objects. The external forces include things like gravity, thrust, springs,
damping. The external forces result in accelerations of the bodies, so at this point
many of the bodies would start to penetrate into each other if we did not find contact
forces to prevent that.

### Find Contacts

Next in `evaluate()` we call `findCollisions()` to find all the contact points, and
possibly collisions as well. If we find any actual (penetrating) collisions, then
`evaluate()` returns the set of collisions found, which should then be handled before
trying to step forward again, see {@link ImpulseSim}.

The criteria for finding a contact is:

+ the corner (or edge) of one body must be *very close* to the edge of the other body,
as specified by `getDistanceTol()`.

+ the bodies must be *moving very slowly* relative to each other (the normal velocity)
at the contact point, as specified by `getVelocityTol()`.

The `evaluate()` method optionally finds independent subsets of collisions, because that
can make the compute_forces algorithm, which is `O(n^4)`, run faster in some cases. See
the flag {@link #SUBSET_COLLISIONS}. Collisions are independent when there is no chain
of moveable (finite mass) bodies in common between the collisions.

### The Matrix Equation for Contact Forces

Now we have the set of contacts and we know the accelerations of the bodies due to
external forces. We set up a matrix equation

    a = A f + b

where

+ `a =` vector of accelerations
+ `A =` matrix describing how the `j`-th contact force affects the acceleration of
    the `i`-th *contact distance* (the separation between the bodies)
+ `f =` vector of contact forces (to be found)
+ `b =` external forces (gravity, thrust, rubber band, damping)

### Set Up the A Matrix

Here is how to set up the `A` matrix: For each contact distance `d_i`, find how the
acceleration of that contact distance `d_i''` is related to the force at the `j`-th
contact point. The force at the `j`-th contact point is `f_j N_j`, where `f_j` is a
scalar and `N_j` is the vector normal. The `a_ij` entry in the `A` matrix tells what
that relationship is between `f_j` and `d_i''`. This `a_ij` value is dependent only on
the current geometry of how the objects are oriented and touching each other.

<img src="Baraff_Figure26.png" alt="Baraff Figure 26" />

For example, consider Figure 26 of
[Baraffs Siggraph 97 Course Notes](Baraff_Siggraph_97_Course_Notes.pdf)
shown above. The figure shows two bodies
(B,C) resting on the ground, and a third body (A) resting on top of the other two. There
are 5 points of contact among the bodies and the ground. Here is how the matrix
equation would look for this situation:

    a1     a11  a12  a13   0    0     f1     b1
    a2     a21  a22  a23   0    0     f2     b2
    a3  =  a31  a32  a33  a34   0  *  f3  +  b3
    a4      0    0   a43  a44  a45    f4     b4
    a5      0    0    0   a54  a55    f5     b5

Consider the first contact at `p1` which is between the ground and body B. The
acceleration of the contact distance at `p1` is affected by the forces at `p1`, `p2`,
and `p3` because all of those forces affect the movement of body B. But the forces at
`p4` and `p5` have no effect, so their entries are zero in the first row of the `A`
matrix.

The first row of the matrix equation can be written out as

    a1 = a11*f1 + a12*f2 + a13*f3 + 0*f4 + 0*f5 + b1

That equation says the acceleration of contact distance at point `p1` is equal to a
certain linear combination of the contact forces `f1`, `f2`, `f3`, plus the acceleration
due to the external forces which is `b1`.

The particular values for `a11, a12, a13` are dependent on the geometry of the
situation: where the forces `f1`, `f2`, `f3` are applied on the body; in what direction
do the forces act; where is the center of mass of the body; how the force causes the
body to accelerate and spin; where is the point `p1` is in relation to the center of
mass; etc.

The third contact at `p3` is more complicated because it is affected by any forces
acting on body A or body B. These include all the forces except `f5`. Therefore the
third row of the `A` matrix has four non-zero entries corresponding to the four forces
that affect the acceleration at `p3`.

### Constraints On the Solution

Assume we now have the `b` vector of external forces and the `A` matrix of dependencies
between contact forces and resulting accelerations of different bodies. We solve for the
`f` vector of contact forces subject to the following constraints:

    a >= 0
    f >= 0
    a.f = 0

The constraints in words are:

+ `a >= 0`  we require all the relative normal accelerations (between bodies
at contact points) to be either zero (remain in contact) or positive (separating).

+ `f >= 0`  We require contact forces to be zero or positive because they can
only push, not pull.

+ `a.f = 0`  The third constraint is a math way of saying that
if there is a force, then acceleration is zero OR
if there is acceleration (separation), then there is no force.

Note that for Joints the constraints are different:

+ `a == 0`  a Joint always remains in resting contact, it never separates

+ No constraint on `f` because it can push or pull.

### Solving For the Contact Forces

The [Baraff 'Fast Contact Force' paper](Baraff_Fast_Contact_Force_94.pdf) goes into full
detail about the algorithm to solve this constraint problem.  Here is a quick summary:

+ Start by setting all the forces to zero

+ Add in one force at a time, just enough to maintain the constraints on the points that
have been considered so far (ignoring the others), and readjust the other forces as
necessary.

+ Continue adding one force at a time, ignoring points that haven't been considered yet.

Suppose that we are working on adding in the third force after already finding the
forces for points 1 and 2. The trick is that we only look at the constraints on the
first 3 contact points, we ignore the other contact points and other forces. Once we've
found the 3rd force (and rebalanced forces 1 and 2 as needed) we then move on to
consider the 4th force.

The last step is to **apply the contact forces** to the bodies, which gives the final
set of accelerations that the `evaluate()` method then returns to the differential
equation solver.

### Extra Acceleration

The contact forces are calculated so that there is zero acceleration at contact points; but this does not immediately affect the remaining small velocity at a contact point.  As a result, objects that are in resting contact will often have some undesirable jittery motion.

One way to deal with this is to request a small amount of additional acceleration which will eliminate that velocity over a few time steps.  If the objects are moving towards each other (a small negative velocity) we request a little more acceleration which leads to a little more force being applied there.  If the objects are moving apart (a small positive velocity) we request a little less acceleration.

The extra acceleration is added to the `b` vector in the private method
`calculate_b_vector`. See {@link ExtraAccel} enum for
explanations of the various options. See {@link #setExtraAccel} for how to specify the
desired ExtraAccel option.

### Intermediate Steps During `evaluate`

A DiffEqSolver works by 'averaging' several calculated states for each time step; for
example ModifiedEuler averages 2 states, and RungeKutta averages 4 states. The collision
detection done in `evaluate()` is based on those intermediate states within a step of
the DiffEqSolver, so it is arguable whether that state actually ever occurs.

This point of view argues for only using the collisions detected between full steps of
the DiffEqSolver. However, contacts can come and go during these sub-steps so it seems
in practice to be more accurate to find the set of contacts anew in each call to
`evaluate()`. Also if a penetrating collision is detected we need to stop the process
and handle that collision instead, so it is important to do collision detection for that
as well.

Prior to February 2012, there was an experimental option specified by the flag
`REUSE_COLLISIONS` for which we did *not* find the collisions anew in the `evaluate()`
method, instead we used the collisions found outside the `evaluate()` method during
`AdvanceStrategy.advance()` which are based on a complete ODE step. See the git archive.

*/
class ContactSim extends ImpulseSim {
/**
* @param {string=} opt_name name of this Subject
*/
constructor(opt_name) {
  super(opt_name);
  /**
  * @type {!Array<!Connector>}
  * @private
  */
  this.connectors_ = [];
  /** sum of depth of recent contacts, for debugging
  * @type {number}
  * @private
  */
  this.contactDepth_ = 0;
  /** number of recent contacts, for debugging
  * @type {number}
  * @private
  */
  this.contactCount_ = 0;
  /** gives current max size of contact subset, for debugging
  * @type {number}
  * @private
  */
  this.numContacts_ = 0;
  /** 'C' for ContactSim
  * @type {!ComputeForces}
  * @private
  */
  this.computeForces_ = new ComputeForces('C',  this.simRNG_);
  /** The approximate length of a time step, used to find extra acceleration needed
  * to keep contact points at the proper distance apart.
  * @type {number}
  * @private
  */
  this.extraAccelTimeStep_ = 0.025;
  /** for debugging
  * @type {!Array<number>}
  * @private
  */
  this.forceHistory_ = Util.newNumberArray(4);
  /** for debugging
  * @type {number}
  * @private
  */
  this.forceHistoryIndex_ = 0;
  /** the method to use for calculating extra acceleration added to
  * eliminate small amount of remaining velocity at a contact or joint. The option
  * ExtraAccel.VELOCITY_AND_DISTANCE reduces both the distance and velocity at a
  * contact to zero.
  * NOTE June 26 2014: previously the default was ExtraAccel.VELOCITY
  * Sept 5 2016: previous default was ExtraAccel.VELOCITY_AND_DISTANCE
  * @type {!ExtraAccel}
  * @private
  */
  this.extra_accel_ = ExtraAccel.VELOCITY_AND_DISTANCE_JOINTS;
  /** time when last printed number of contacts
  * @type {number}
  * @private
  */
  this.debugPrintTime_ = 0;
  // Need a special 'setter' because `setExtraAccel` takes an argument of
  // the enum type `ExtraAccel`, not of type `string`.
  this.addParameter(new ParameterString(this, RigidBodySim.en.EXTRA_ACCEL,
      RigidBodySim.i18n.EXTRA_ACCEL,
      () => this.getExtraAccel(),
      a => this.setExtraAccel(ExtraAccel.stringToEnum(a)),
      ExtraAccel.getChoices(), ExtraAccel.getValues()));
};

/** @override  */
toString_() {
  return Util.ADVANCED ? '' : ', extra_accel_: '+this.extra_accel_
      +', extraAccelTimeStep_: '+Util.NF(this.extraAccelTimeStep_)
      + super.toString_()
};

/** @override */
getClassName() {
  return 'ContactSim';
};

/** Returns the method to use for calculating extra acceleration added to
* eliminate small amount of remaining velocity at a contact.
* @return {!ExtraAccel} the method to use for calculating
*     extra acceleration, from {@link ExtraAccel}
*/
getExtraAccel() {
  return this.extra_accel_;
};

/** Sets the method to use for calculating extra acceleration added to
* eliminate small amount of remaining velocity at a contact.
* @param {!ExtraAccel} value the method to use for
*     calculating extra acceleration, from {@link ExtraAccel}
*/
setExtraAccel(value) {
  var a = ExtraAccel.stringToEnum(value);
  goog.asserts.assert(a == value);
  if (this.extra_accel_ != a) {
    this.extra_accel_ = a;
    this.broadcastParameter(RigidBodySim.en.EXTRA_ACCEL);
  }
};

/** Sets the approximate length of a time step, used to find extra acceleration needed
* to keep contact points at the proper distance apart.
* @param {number} value the approximate length of a time step
*/
setExtraAccelTimeStep(value) {
  this.extraAccelTimeStep_ = value;
};

/** Returns the approximate length of a time step, used to find extra acceleration
* needed to keep contact points at the proper distance apart.
* @return {number} the approximate length of a time step
*/
getExtraAccelTimeStep() {
  return this.extraAccelTimeStep_;
};

/** @override */
cleanSlate() {
  super.cleanSlate();
  this.connectors_ = [];
  this.computeForces_ = new ComputeForces('C',  this.simRNG_);
};

/** @override */
reset() {
  // prevent the Simulation.RESET message being broadcast by sub-class
  var saveBroadcast = this.setBroadcast(false);
  super.reset();
  this.setBroadcast(saveBroadcast);
  // ensure that joints are properly connected.
  this.alignConnectors();
  this.broadcast(new GenericEvent(this, Simulation.RESET));
};

/** Removes the Polygon from the simulation, and any Connectors that were attached
* to it.
* @param {!Polygon} body  Polygons to remove from the simulation
*/
removeBody(body) {
  super.removeBody(body);
  // remove any Connectors attached to the removed body
  goog.array.forEachRight(this.connectors_, connect => {
    if (connect.getBody1() == body || connect.getBody2() == body) {
      this.removeConnector(connect);
    }
  });
};

/** Adds a Connector to the list of active Connectors and to the
{@link com.SimList}.
The RigidBodys of the Connector must already have been added to this ContactSim,
unless it is a Scrim.  Note that the order of the list of Connectors is significant,
see {@link #alignConnectors}.
@param {!Connector} connector the Connector to add
@param {?Connector=} follow add new Connector into list after
    this Connector; if null then add at front of list; if undefined, add at end of list
@throws {!Error} if RigidBodys of the Connector have not been added to this
    ContactSim
*/
addConnector(connector, follow) {
  if (goog.array.contains(this.connectors_, connector)) {
    // avoid adding a Connector twice
    return;
  }
  var b = connector.getBody1();
  if (!(goog.array.contains(this.bods_, b) || b instanceof Scrim)) {
    throw 'body not found '+b;
  }
  b = connector.getBody2();
  if (!(goog.array.contains(this.bods_, b) || b instanceof Scrim)) {
    throw 'body not found '+b;
  }
  if (follow === null) {
    this.connectors_.unshift(connector);
  } else if (follow != null) {
    var idx = goog.array.indexOf(this.connectors_, follow);
    if (idx < 0) {
      throw 'connector not found '+follow;
    }
    goog.array.insertAt(this.connectors_, connector, idx+1);
  } else {
    this.connectors_.push(connector);
  }
  this.getSimList().add(connector);
};

/** Adds the set of Connectors.  Note that the ordering of the Connectors is
important because the Connectors are aligned in list order.
* @param {!Array<!Connector>} connectors set of Connectors
* to add
*/
addConnectors(connectors) {
  for (var i=0,len=connectors.length; i<len; i++) {
    this.addConnector(connectors[i]);
  }
};

/** Removes the Connector from the list of active Connectors. If the Connector is
also a SimObject, then removes it from the {@link com.SimList}.
@param {!Connector} connector the Connector to remove
*/
removeConnector(connector) {
  goog.array.remove(this.connectors_, connector);
  this.getSimList().remove(connector);
};

/**  Returns the list of active Connectors.
@return {!Array<!Connector>} the list of active Connectors
*/
getConnectors() {
  return goog.array.clone(this.connectors_);
};

/** Aligns all Connectors. This is generally done only during set up of initial
conditions of the simulation, or whenever a Connector is being created.

Note that the order of the bodies within a Joint is significant because `Joint.align()`
usually moves the second body to align with first body. Also, the ordering within the
list of Connectors is significant because the Connectors are aligned in list order.

* @return {undefined}
*/
alignConnectors() {
  for (var i=0, len=this.connectors_.length; i<len; i++) {
    var connector = this.connectors_[i];
    connector.align();
  }
  for (var j=0, blen=this.bods_.length; j<blen; j++) {
    // update the vars[] array using current body position & velocity
    this.initializeFromBody(this.bods_[j]);
  }
};

/** For debugging, returns the number of contacts in the biggest subset of contacts
that are all interrelated.
@return {number} number of contacts in the biggest subset of contacts that
    are all interrelated
*/
getNumContacts() {
  return this.numContacts_;
};

/** @override */
evaluate(vars, change, timeStep) {
  var maxContacts = 0;
  // ===================== get external forces =====================
  // Let superclass figure out the effects of forces like thruster,
  // rubber-band, damping, gravity.  Also, superclass will move objects
  // to the resulting current location & orientation,
  // so that we can figure out the points of resting contact.
  super.evaluate(vars, change, timeStep);
  // Note that findCollisions does not look at vars[], only at object positions.
  /** @type {!Array<!RigidBodyCollision>} */
  var contactsFound = [];
  this.findCollisions(contactsFound, vars, timeStep);
  // If there are penetrating collisions, these must be handled before
  // doing contact calculations.
  var ccount = goog.array.count(contactsFound, c => c.illegalState());
  if (ccount > 0) {
    return contactsFound;
  }
  this.removeNonContacts(contactsFound);
  var startN = contactsFound.length;  // starting number of contacts
  var loopCtr = 0;
  while (contactsFound.length > 0) {
    if (Util.DEBUG && loopCtr++ > 2*startN)
      this.myPrint('ContactSim.evaluate loopCtr='+loopCtr);
    // ===================== find collision subset =====================
    // Find subset of contacts which are all connected to each other
    // (because they have non-fixed bodies in common).
    // This makes the matrix in ComputeForces smaller, and
    // ensures that if there are redundant contacts, then you only
    // remove a contact that is connected.
    /** @type {!Array<!RigidBodyCollision>} */
    var subset = ContactSim.SUBSET_COLLISIONS ?
          UtilityCollision.subsetCollisions1(contactsFound) : contactsFound;
    if (subset.length > maxContacts)
      maxContacts = subset.length;
    this.calcContactForces(vars, change, subset);
    if (subset.length == contactsFound.length) {
      // all contacts have been treated.
      break;
    } else {
      // remove all of subset from contactsFound, continue with remaining that
      // are left in contactsFound.
      for (var i=0, len=subset.length; i<len; i++) {
        goog.array.remove(contactsFound, subset[i]);
      }
    }
  }
  this.numContacts_ = maxContacts;
  if (Util.DEBUG && 1 == 1) this.printNumContacts();
  if (Util.DEBUG && 0 == 1) this.myPrint('*** EXIT CONTACTSIM.EVALUATE');
  return null;
};

/**
* @param {!Array<number>} vars the current array of state variables (input)
* @param {!Array<number>} change  array of change rates for each variable (output)
* @param {!Array<!RigidBodyCollision>} subset
* @private
*/
calcContactForces(vars, change, subset) {
  if (0 == 1 && Util.DEBUG)
    UtilEngine.printList('subset size='+subset.length, subset);
  /** @type {boolean} */
  var pileDebug = false; //Math.abs(getTime() - 52.2250000) < 2e-7;
  // ===================== calculate A matrix & b vector =====================
  /** @type {!Array<!Float64Array>} */
  var A = ContactSim.calculate_a_matrix(subset);
  if (0 == 1 && Util.DEBUG) {
    // demonstrates that we have duplicate code for finding the A matrix
    /** @type {!Array<!Float64Array>} */
    var A2 = this.makeCollisionMatrix(subset);
    this.myPrint('diff='+Util.NFE(ContactSim.matrixDiff(A, A2)));
  }
  /** @type {!Array<number>} */
  var b = this.calculate_b_vector(subset, change, vars);
  /** @type {!Array<boolean>} */
  var joint = goog.array.map(subset, c => c.joint);
  /** @type {!Array<number>} */
  var f = Util.newNumberArray(b.length);
  if (Util.DEBUG && pileDebug) {
    this.printContactInfo(subset, b, vars);
  }
  // ===================== compute forces =====================
  var time = vars[this.varsList_.timeIndex()];
  var error = this.computeForces_.compute_forces(A, f, b, joint, pileDebug, time);
  if (Util.DEBUG && 0 == 1) {
    this.printForceInfo(subset, A, f, b, joint, vars);
  }
  var tol = 1e-4;
  if (error !== -1 || !this.computeForces_.checkAccel(tol)) {
    this.reportError(error, tol, A, f, b, joint);
  }
  // ===================== apply forces =====================
  if (Util.DEBUG && ContactSim.SHOW_CONTACTS && subset.length > 0) {
    this.myPrint('found '+subset.length+' contacts');
  }
  // apply the calculated contact forces
  for (var i=0, len=subset.length; i<len; i++) {
    /** @type {!RigidBodyCollision} */
    var c = subset[i];
    this.applyContactForce(c, f[i], change);
    if (Util.DEBUG && ContactSim.SHOW_CONTACTS) {
      this.myPrint('contact['+i+']= '+c);
    }
  }
  if (Util.DEBUG && 0 == 1) {
    this.printContactDistances(subset);
  }
};

/** Removes imminent collisions from the given set of contacts/collisions.
* @param {!Array<!RigidBodyCollision>} contactsFound  the set of contacts/collisions
    to modify
* @private
*/
removeNonContacts(contactsFound) {
  // iterate backwards because we may remove items from the list
  for (var i=contactsFound.length-1; i>=0; i--) {
    /** @type {!RigidBodyCollision} */
    var c = contactsFound[i];
    // There should be no collisions (interpenetrations) at this time,
    // because those should have been handled by the collision handling mechanism.
    // See handleCollisions and findCollisions.
    if (c.illegalState()) {
      throw 'unexpected collision at time='+this.getTime()+' '+c;
    }
    if (!c.contact()) {
      // remove non-contacts (imminent collisions) from the list
      goog.array.removeAt(contactsFound, i);
      continue;
    } else {
      // compile statistics about contacts
      this.contactCount_++;
      this.contactDepth_ += c.distance;
    }
  }
};

/** @override */
findCollisions(collisions, vars, stepSize) {
  // Adds collisions or contacts from Connectors like Joint.
  var i, j, len;
  super.findCollisions(collisions, vars, stepSize);
  if (ImpulseSim.COLLISIONS_DISABLED)
    return;
  var rbcs = /** @type {!Array<!RigidBodyCollision>} */(collisions);
  for (j=0, len=this.connectors_.length; j<len; j++) {
    var connector = this.connectors_[j];
    var time = vars[this.varsList_.timeIndex()];
    connector.addCollision(rbcs, time, this.collisionAccuracy_);
  }
  if (0 == 1 && Util.DEBUG) {
    var numFound = 0;
    for (i=0, len=rbcs.length; i<len; i++) {
      var c = rbcs[i];
      if (c.contact() && !c.joint) {
        numFound++;
        // show contact points with a temporary small circle
        this.debugCircle('contact', c.impact1, /*radius=*/0.2);
      }
    }
    this.myPrint('contacts found '+numFound);
  }
};

/** Calculates the `A` matrix which specifies how contact points react to contact
forces. Returns a matrix where the `(i, j)`th entry is how much the relative normal
acceleration at contact `i` will change from a unit force being applied at contact `j`.

See {@link ContactSim_Math.html#calculatetheamatrix Calculate the `A` Matrix} in the
document about ContactSim math.

@todo it is a symmetric matrix, so we could save time by only calculating upper
triangle and then copying to lower triangle.

@todo (March 2012) this is the same as ImpulseSim.makeCollisionMatrix, so we
need to use just one of these (duplicate code currently). The ImpulseSim version
is nicer in how it uses the 'influence' subroutine. However, that version doesn't
use the U vector, so need to figure out whether they should both use U vector or
not.

* @param {!Array<!RigidBodyCollision>} contacts
* @return {!Array<!Float64Array>}
* @private
*/
static calculate_a_matrix(contacts) {
  var nc = contacts.length;
  /** @type {!Array<!Float64Array>} */
  var a = UtilEngine.newEmptyMatrix(nc, nc);
  for (var i=0; i<nc; i++) {
    /** @type {!RigidBodyCollision} */
    var ci = contacts[i];
    var m1,I1,m2,I2;
    m1 = ci.primaryBody.getMass();
    I1 = ci.primaryBody.momentAboutCM();
    m2 = ci.normalBody.getMass();
    I2 = ci.normalBody.momentAboutCM();
    var r1 = ci.getU1();
    var r2 = ci.getU2();
    var Rx = r1.getX();
    var Ry = r1.getY();
    var R2x = r2.getX();
    var R2y = r2.getY();
    // (D-1) di'' = ai1 f1 + ai2 f2 + ... + ain fn + bi = sum(aij fj) + bi
    for (var j=0; j<nc; j++) {
      a[i][j] = 0;
      // Find contribution of j-th contact force to the accel of gap at i-th contact
      // See equation above for Aij.
      // Note that in RigidBodyCollision object, R is distance vector from CM to
      // point of impact
      // for the 'primary' object in collision, while R2 is for the normal object.
      /** @type {!RigidBodyCollision} */
      var cj = contacts[j];
      r1 = cj.getU1();
      r2 = cj.getU2();
      // NEW APRIL 23 2009:  use U vector here
      var Rxj = r1.getX();
      var Ryj = r1.getY();
      var R2xj = r2.getX();
      var R2yj = r2.getY();
      if (isFinite(m1) && ci.primaryBody == cj.primaryBody) {
        // body 1 is primary object in j-th contact
        // fj affects p1 in eqn (D-2), so use m1, I1
        a[i][j] += ci.normal.getX()*(cj.normal.getX()/m1
                    + (-Ry*Rxj*cj.normal.getY() + Ry*Ryj*cj.normal.getX())/I1);
        a[i][j] += ci.normal.getY()*(cj.normal.getY()/m1
                    + (-Rx*Ryj*cj.normal.getX() + Rx*Rxj*cj.normal.getY())/I1);
      }
      if (isFinite(m1) && ci.primaryBody == cj.normalBody) {
        // body 1 is normal object in j-th contact
        // -fj affects p1, and use cj.R2 for calculating torque
        a[i][j] -= ci.normal.getX()*(cj.normal.getX()/m1
                    + (-Ry*R2xj*cj.normal.getY() + Ry*R2yj*cj.normal.getX())/I1);
        a[i][j] -= ci.normal.getY()*(cj.normal.getY()/m1
                    + (-Rx*R2yj*cj.normal.getX() + Rx*R2xj*cj.normal.getY())/I1);
      }
      if (isFinite(m2) && ci.normalBody == cj.primaryBody) {
        // body 2 is primary object in j-th contact
        // fj affects p2; use m2, I2, ci.R2, and cj.R
        a[i][j] -= ci.normal.getX()*(cj.normal.getX()/m2
                    + (-R2y*Rxj*cj.normal.getY() + R2y*Ryj*cj.normal.getX())/I2);
        a[i][j] -= ci.normal.getY()*(cj.normal.getY()/m2
                    + (-R2x*Ryj*cj.normal.getX() + R2x*Rxj*cj.normal.getY())/I2);
      }
      if (isFinite(m2) && ci.normalBody == cj.normalBody) {
        // body 2 is normal object in j-th contact
        // -fj affects p2 (double negative);  use m2, I2, ci.R2 and cj.R2
        a[i][j] += ci.normal.getX()*(cj.normal.getX()/m2
                    + (-R2y*R2xj*cj.normal.getY() + R2y*R2yj*cj.normal.getX())/I2);
        a[i][j] += ci.normal.getY()*(cj.normal.getY()/m2
                    + (-R2x*R2yj*cj.normal.getX() + R2x*R2xj*cj.normal.getY())/I2);
      }
      if (Util.DEBUG && !isFinite(a[i][j])) {
        console.log('ci= '+ci);
        console.log('cj= '+cj);
        Util.printNums5('nums ', Rx, Ry, Rxj, Ryj, R2x, R2y, R2xj, R2yj, m1, I1, m2, I2);
        throw 'possible zero mass object';
      }
    }
  }
  return a;
};

/** Calculates the `b` vector which specifies how external forces (like gravity, thrust,
etc) affect acceleration of contact points.

See {@link ContactSim_Math.html#calculatethebvector Calculate the `b` Vector} in the
document about ContactSim math.

### Old Notes -- Do Not Trust

(Sept 2015: don't trust these old notes!)

New extra acceleration calculation (March 2, 2012). See note below from Nov 2014
about a modification of this calculation.

    let x be the joint gap.  x’ = v, x’’ = a.
    Integrating:  x’ = a t + v_0;   x = a t^2/2 + v_0 t + x_0
    ideally we find accel that both stops velocity and brings the gap to zero:
    0 = a h^2/2 + v_0 h + x_0
    0 = a h + v_0
    we can’t satisfy both those equations, but we can maybe find something
    in the middle?
    we know h, need to find a.
    a = -(v_0 h + x_0)2/h^2
    a = -v_0/h
    what is the average of these?
    -(2 v_0 h + x_0) /h^2
    (note that we put the opposite of this into b vector)

I tested the relationship between the time step `h` and the divisor `q` used in
finding the extra acceleration `a`, where `a = v / q`. (This was October 2011). I
found that instability occurs when `h > 2 q` for Runge Kutta solver, and when `h > q`
for modified Euler solver. This makes sense because RK averages 4 sub-steps and in a
sense the time step used is actually `h/2`. Whereas modified Euler averages 2
sub-steps that are `h` apart. It also makes sense because the integral above is over a
single time step `h`, so if you are integrating over significantly longer time then
you would overshoot and the velocity would be reduced too much.

Extra acceleration and reusing collisions: It would make more sense to take the
velocity at the start of the RK step and use that starting velocity value to
calculate an extra acceleration that is used for all the sub-steps of the RK step.
Then you would wind up reducing the velocity to zero over that time step. Instead,
what we do currently is recalculate the extra acceleration in each sub-step, based
on the current simulation state (velocity) in that sub-step. This seems to be less
effective in reducing the velocity -- it takes more steps to get to zero velocity.
However, I tried an experiment (October 2011) that didn't work out so well. I tried
to reuse the collisions, so that the same collision is used for all the RK sub-steps
and so have the same velocity used in each sub-step. The results were inconsistent,
and re-using the collisions has other effects.

Note about joints:  from doing a quick test with DoublePendulumCompareBuilder
it seems that you can get almost as good results for joints by turning off the
'generate tiny collisions at each step' code in CollisionSim and turning on the
'extra acceleration to eliminate velocity' code here for joints.  This might be
useful if you want to avoid the extra work in each step for handling those tiny
collisions.  As long as we do the 'tiny collisions for joints', we ensure that
velocity at joints is zero, and therefore don't need to do the "extra acceleration
to eliminate velocity" kluge for joints.

* @param {!Array<!RigidBodyCollision>} contacts
* @param {!Array<number>} change
* @param {!Array<number>} vars
* @return {!Array<number>}
* @private
*/
calculate_b_vector(contacts, change, vars) {
  var c_len=contacts.length;
  /** @type {!Array<number>} */
  var b = new Array(c_len);
  for (var i=0; i<c_len; i++) {
    /** @type {!RigidBodyCollision} */
    var c = contacts[i];
    b[i] = 0;
    var fixedObj = c.primaryBody.getMass() == Util.POSITIVE_INFINITY;
    var fixedNBody = c.normalBody.getMass() == Util.POSITIVE_INFINITY;
    var obj = fixedObj ? -1 : c.primaryBody.getVarsIndex();
    var nobj = fixedNBody ? -1 : c.normalBody.getVarsIndex();
    goog.asserts.assert( c.contact() );
    // Adjust acceleration to eliminate velocity at contact.
    // See notes above for how we derive a = v / h
    // totalTimeStep is overall length of time step, it is not affected by
    // small time steps during collision search.
    var extrab = 0;
    switch (this.extra_accel_) {
      case ExtraAccel.NONE:
        extrab = 0;
        break;
      case ExtraAccel.VELOCITY:
        if (c.joint) {
          break;
        }
        // intentional fall-thru
      case ExtraAccel.VELOCITY_JOINTS:
        // velocity only
        extrab = c.getNormalVelocity()/this.extraAccelTimeStep_;
        break;
      case ExtraAccel.VELOCITY_AND_DISTANCE:
        if (c.joint) {
          break;
        }
        // intentional fall-thru
      case ExtraAccel.VELOCITY_AND_DISTANCE_JOINTS:
        // average of distance and velocity
        var v0 = c.getNormalVelocity();
        var h = this.extraAccelTimeStep_;
        var x0 = c.distanceToHalfGap();
        extrab = (2*v0*h + x0)/(h*h);
        break;
      default:
        goog.asserts.fail();
    }
    b[i] += extrab;
    if (0 == 1 && Util.DEBUG && Math.abs(extrab) > 1E-10) {
      this.myPrint('EXTRAB '+ Util.NFE(extrab)
          +' normVel='+Util.NF7(c.getNormalVelocity())
          +' dist='+Util.NF5(c.distance)
          +' body='+c.primaryBody.getName()
          +' normalBody='+c.normalBody.getName()
          +' extraAccelTimeStep='+Util.NF5(this.extraAccelTimeStep_)
          );
    }
    var vx1 = fixedObj ? 0 : vars[RigidBodySim.VX_+obj];
    var vy1 = fixedObj ? 0 : vars[RigidBodySim.VY_+obj];
    var w1 = fixedObj ? 0 : vars[RigidBodySim.VW_+obj];
    var vx2 = fixedNBody ? 0 : vars[RigidBodySim.VX_+nobj];
    var vy2 = fixedNBody ? 0 : vars[RigidBodySim.VY_+nobj];
    var w2 = fixedNBody ? 0 : vars[RigidBodySim.VW_+nobj];
    /*  The velocity of a corner is given by
       p' = V + w x R = (Vx, Vy, 0) + w (-Ry, Rx, 0)
       = (Vx - w Ry, Vy + w Rx, 0)
      (16)  2 N'.(p1' - p2') = 2 w2(-Ny, Nx, 0).(p1' - p2')
    */
    var r1 = c.getU1();
    var r2 = c.getU2();
    var Rx = r1.getX();
    var Ry = r1.getY();
    var R2x = Util.NaN;
    var R2y = Util.NaN;
    if (!fixedNBody) {
      R2x = r2.getX();
      R2y = r2.getY();
    }
    if (!c.normalFixed) {
      // np = n' = the derivative of the normal n.
      var npx = 0;
      var npy = 0;
      if (c.ballNormal) {
        // Curved Edge defines the normal
        var normal_dt = c.normal_dt;
        if (normal_dt != null) {
          // deriv of normal is pre-computed; example: Joint on NumericalPath.
          npx = normal_dt.getX();
          npy = normal_dt.getY();
        } else {
          var radius;
          if (c.ballObject) {
            // Curved Edge/Curved Edge
            goog.asserts.assert( !isNaN(c.radius1) && !isNaN(c.radius2) );
            radius = c.radius1 + c.radius2;
          } else {
            // Curved Edge/Vertex or Rope
            goog.asserts.assert( !isNaN(c.radius2) );
            radius = c.radius2;
          }
          npx =  (vx1 - w1*Ry)/radius;
          npy =  (vy1 + w1*Rx)/radius;
          if (!fixedNBody) {
            npx -= (vx2 - w2*R2y)/radius;
            npy -= (vy2 + w2*R2x)/radius;
          }
        }
      } else {
        // Straight Edge defines the normal.
        // Derivative of normal should not exist, it is only for curved edges.
        goog.asserts.assert( c.normal_dt == null );
        npx = -w2*c.normal.getY();
        npy = w2*c.normal.getX();
        if (c.ballObject) {
          // Straight Edge/Curved Edge case
          // Add a factor based on speed of rotation of the straight edge,
          // and radius of curved edge.
          if (!fixedNBody)
            b[i] += -c.radius1*w2*w2;
        } else {
          // Straight Edge/Vertex case
          //goog.asserts.assert( c.vertex != null || c.theConnector != null );
        }
      }
      {
        var v1x = fixedObj ? 0 : vx1 - w1*Ry;
        var v1y = fixedObj ? 0 : vy1 + w1*Rx;
        var v2x = fixedNBody ? 0 : vx2 - w2*R2y;
        var v2y = fixedNBody ? 0 : vy2 + w2*R2x;
        // (16)  2 N'.(p1' - p2')
        if (!c.ballNormal) {
          b[i] += 2*(npx*(v1x - v2x) + npy*(v1y - v2y));
        } else {
          // For curved edge, use N' . (p1' - c2').
          // See the paper CEP_Curved_Edge_Physics.pdf
          b[i] += npx*(v1x - v2x) + npy*(v1y - v2y);
        }
      }
    }
    /*
      Next look for force independent parts of the first term in (D-2).
      They involve the external (what I call 'initial') linear acceleration
      and torque, Ai and ai.  Plus the w x (w x R) term.
         Ai + ai x R + w x (w x R)
      So take this for each point to get
      (17) N.( (Ai1 + ai1 x R1 + w1 x (w1 x R1)) - (Ai2 + ai2 x R2 + w2 x (w2 x R2)))
      And b is then the sum of (16) and (17)
      a x R = (-a Ry, a Rx, 0)
      w x (w x R) = (-w^2 Rx, -w^2 Ry, 0)
      A + w x (w x R) + a x R = (Ax - a Ry - w^2 Rx, Ay + a Rx - w^2 Ry, 0)
    */
    if (!fixedObj) {
      b[i] += c.normal.getX()*(change[obj+RigidBodySim.VX_]
            - change[obj+RigidBodySim.VW_]*Ry - w1*w1*Rx);
      b[i] += c.normal.getY()*(change[obj+RigidBodySim.VY_]
            + change[obj+RigidBodySim.VW_]*Rx - w1*w1*Ry);
    }
    if (!fixedNBody) {
      b[i] -= c.normal.getX()*(change[nobj+RigidBodySim.VX_]
            - change[nobj+RigidBodySim.VW_]*R2y - w2*w2*R2x);
      b[i] -= c.normal.getY()*(change[nobj+RigidBodySim.VY_]
            + change[nobj+RigidBodySim.VW_]*R2x - w2*w2*R2y);
    }
    if (!isFinite(b[i])) {
      console.log('c= '+c);
      Util.printNums5('nums ', Rx, Ry, R2x, R2y, w1, w2, vx1, vy1, vx2, vy2);
      throw '';
    }
  }
  return b;
};

/** Applies a normal force at the contact point. Result is modification of the rigid
body accelerations in the change vector. Also the Force objects are added to the SimList
for display purposes when the 'show forces' flag is on.

The impact point(s) given in the contact only affect the angular acceleration of
the objects, not the linear acceleration. Curiously, the impact point can be anywhere
along the line normal to the impact point with the same result. Because the angular
acceleration changes by the cross product of the force and the vector from center of
mass to impact point: `R x F`. If you change `R` by adding a multiple `n` of `F`
there is no change: `(R + n F) x F = R x F + n F x F = R x F + 0`. This is
why it doesn't matter which side of the gap that we assign the impact point for the
collision.

We use `R` vector here, not `U` vector. The force is applied at the point of contact,
not at the center of the circle for a circular edge. The `U` vector is used for
calculating the velocity of the gap distance -- which went into the `b`-vector, and
therefore determined the amount of force. The `U` vector is also used for calculating
the `A` matrix. We could use the `U` vector here, but it would give the same result
because `U = R + n F`, see the section
{@link RigidBodyCollision#equivalenceofusingroruvector
Equivalence of Using R or U Vector For Normal Velocity} in RigidBodyCollision.

We entirely skip making (and therefore displaying) the forces for a fixed (infinite
mass) body. The reason is that those forces won't affect the simulation because the
fixed body cannot move. We could let those forces thru if desired.

* @param {!RigidBodyCollision} c  the contact point where the
*    force is to be applied
* @param {number} f  the magnitude of the normal force
* @param {!Array<number>} change  vector of rigid body accelerations
* @private
*/
applyContactForce(c, f, change) {
  if (0 == 1 && Util.DEBUG) {
    this.myPrint('contact force '+Util.NF5(f)+' '+c);
  }
  c.force = f;
  if (f==0) {
    return;
  }
  // forceNum is used to avoid showing the second force of a pair.
  // The contact forces are given names to indicate which is the second force
  // in a pair of opposing forces.
  var forceNum = 1;
  if (isFinite(c.primaryBody.getMass())) {
    var f1 = new Force('contact_force'+forceNum+'_'+c.primaryBody.getName(),
        c.primaryBody,
        /*location=*/c.impact1, CoordType.WORLD,
        /*direction=*/c.normal.multiply(f), CoordType.WORLD);
    f1.contactDistance = c.distance;
    f1.contactTolerance = c.primaryBody.getDistanceTol();
    forceNum++;
    this.applyForce(change, f1);
  }
  if (isFinite(c.normalBody.getMass())) {
    // confusing:  is there always an impact2 ?  or only sometimes, like for Rope?
    var impact2 = (c.impact2 == null) ? c.impact1 : c.impact2;
    var f2 = new Force('contact_force'+forceNum+'_'+c.normalBody.getName(),
        c.normalBody,
        /*location=*/impact2,  CoordType.WORLD,
        /*direction=*/c.normal.multiply(-f), CoordType.WORLD);
    f2.contactDistance = c.distance;
    f2.contactTolerance = c.normalBody.getDistanceTol();
    this.applyForce(change, f2);
  }
};

/**
* @param {number} error
* @param {number} tol  tolerance used
* @param {!Array<!Float64Array>} A
* @param {!Array<number>} f
* @param {!Array<number>} b
* @param {!Array<boolean>} joint
* @private
*/
reportError(error, tol, A, f, b, joint) {
  // check on how bad the solution is.
  /** @type {!Array<number>} */
  var accel = UtilEngine.matrixMultiply(A, f);
  accel = UtilEngine.vectorAdd(accel, b);
  if (!ComputeForces.checkForceAccel(tol, f, accel, joint)) {
    if (Util.DEBUG) {
      console.log(this.varsList_.printHistory());
    }
    throw Util.NF7(this.getTime())+' compute_forces failed error='+error
        +' with tol='+Util.NFE(tol);
  } else if (error != -1 && Util.DEBUG) {
    this.myPrint('warning: compute_forces failed error='+error
        +' but is within tol='+Util.NFE(tol));
  }
};

/**
* @param {!Array<!Float64Array>} A1
* @param {!Array<!Float64Array>} A2
* @return {number}
* @private
*/
static matrixDiff(A1, A2) {
  /** @type {number} */
  var s = 0;
  if (Util.DEBUG) {
    for (var i=0, len=A1.length; i<len; i++) {
      for (var j=0, len2=A1[i].length; j<len2; j++) {
        var t = A1[i][j] - A2[i][j];
        if (0 == 1) {
          // sum of squares of differences
          s += t*t;
        } else {
          // largest difference
          if (Math.abs(t) > s) {
            s = Math.abs(t);
          }
        }
      }
    }
  }
  return s;
};

/**
* @param {!Array<!RigidBodyCollision>} subset
* @param {!Array<number>} b
* @param {!Array<number>} vars
* @private
*/
printContactInfo(subset, b, vars) {
  if (Util.DEBUG) {
    // print all the collisions currently being treated
    for (var i=0, len=subset.length; i<len; i++) {
      this.myPrint('b['+i+']='+Util.NF7(b[i])+' '+subset[i],'background:#ffc',
        'color:black');
    }
    // print all vars
    UtilEngine.printArray(Util.NF7(this.getTime())+' vars', vars);
    // print energy info
    this.myPrint(this.getEnergyInfo().toString());
  }
};

/**
* @param {!Array<!RigidBodyCollision>} subset
* @param {!Array<!Float64Array>} A
* @param {!Array<number>} f
* @param {!Array<number>} b
* @param {!Array<boolean>} joint
* @param {!Array<number>} vars
* @private
*/
printForceInfo(subset, A, f, b, joint, vars) {
  if (Util.DEBUG) {
    // if the largest force suddenly is much larger than previously,
    // then print out debug information.
    var maxForce = UtilEngine.maxSize(f);
    var lastMaxForce = UtilEngine.maxSize(this.forceHistory_);
    var limitForce = (lastMaxForce > 0.5) ? 2.5*lastMaxForce : 80;
    if (maxForce > 1 && maxForce > limitForce) {
      this.myPrint('==== maxForce increased from '+Util.NF5(lastMaxForce)
          +' to '+Util.NF5(maxForce));
      for (var i=0, len=subset.length; i<len; i++) {
        this.myPrint('c['+i+']='+subset[i]);
      }
      console.log(this.formatVars());
      UtilEngine.printArray(Util.NF7(this.getTime())+' f', f);
      // Print the A matrix and b vector for further analysis.
      // This prints the data needed as input to compute_forces, so that
      // you can try it again as a standalone test, see UtilityTest.
      UtilEngine.printArray2('b', b, Util.NFSCI);
      UtilEngine.printList('joint', joint);
      UtilEngine.printMatrix2('A '+A.length+'vars'+A[0].length, A, Util.NFSCI);
    }
    this.addForceHistory(maxForce);
  }
};

/**
* @param {number} f
* @private
*/
addForceHistory(f) {
  if (Util.DEBUG) {
    if (this.forceHistoryIndex_ >= this.forceHistory_.length)
      this.forceHistoryIndex_ = 0;
    this.forceHistory_[this.forceHistoryIndex_] = f;
    this.forceHistoryIndex_++;
  };
};

/**
* @param {!Array<!RigidBodyCollision>} contacts
* @private
*/
printContactDistances(contacts) {
  if (Util.DEBUG) {
    // print all contact distances
    var s = 'contact dist ';
    for (var i=0, len=contacts.length; i<len; i++) {
      s += ' '+Util.NF7(contacts[i].distance);
    }
    this.myPrint(s);
  }
};

/**
* @return {undefined}
* @private
*/
printNumContacts() {
  if (Util.DEBUG) {
    if (ContactSim.SHOW_NUM_CONTACTS) {
      var t = this.getTime();
      if (t - this.debugPrintTime_ > 2.0 || t < this.debugPrintTime_) {
        this.myPrint('num bodies='+this.bods_.length
            +', num contacts='+this.getNumContacts());
        this.debugPrintTime_ = t;
      }
    }
  };
};

} // end class

/** Find subsets of related contacts to solve each subset separately for contact forces.
This feature is useful for cases where there are a lot of contacts that are in separate
groups (two piles) because the matrices being solved are smaller. The ComputeForces
algorithm is `O(n^4)`. For example suppose there are 40 contact points. The cost of
`40^4 = 2,560,000` is far greater than `20^4 + 20^4 = 320,000`. There is some overhead
to finding the subsets, so this can lose time when there is just a big single pile.
* @type {boolean}
*/
ContactSim.SUBSET_COLLISIONS = true;

/** write to debug console detail on all contacts found
* @type {boolean}
* @const
*/
ContactSim.SHOW_CONTACTS = false;
/**
* @type {boolean}
* @const
*/
ContactSim.SHOW_NUM_CONTACTS = false;

exports = ContactSim;
