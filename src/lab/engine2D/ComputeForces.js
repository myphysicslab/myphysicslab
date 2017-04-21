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

goog.provide('myphysicslab.lab.engine2D.ComputeForces');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Float64Array');
goog.require('myphysicslab.lab.engine2D.UtilEngine');
goog.require('myphysicslab.lab.util.Random');
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var NF18 = myphysicslab.lab.util.UtilityCore.NF18;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var NF7 = myphysicslab.lab.util.UtilityCore.NF7;
var NF9 = myphysicslab.lab.util.UtilityCore.NF9;
var NFE = myphysicslab.lab.util.UtilityCore.NFE;
var NF0 = myphysicslab.lab.util.UtilityCore.NF0;
var NFSCI = myphysicslab.lab.util.UtilityCore.NFSCI;
var Random = myphysicslab.lab.util.Random;
var UtilEngine = myphysicslab.lab.engine2D.UtilEngine;
var UtilityCore = myphysicslab.lab.util.UtilityCore;


/** Computes forces at contact points between RigidBodys, or impulses at collision
points between RigidBodys. The {@link #compute_forces} method is an implementation of
the algorithm given in the paper

+ *Fast contact force computation for nonpenetrating rigid bodies* by David Baraff,
Computer Graphics Proceedings, Annual Conference Series: 23-34, 1994. 12 pages.

More info at:

+ [2D Physics Engine Overview](Engine2D.html)

+ [The Math and Physics Underlying ContactSim](http://www.myphysicslab.com/contact.html)

+ {@link myphysicslab.lab.engine2D.ContactSim}

+ {@link myphysicslab.lab.engine2D.ImpulseSim}

This documentation is written assuming that *contact forces* and resulting accelerations
are being calculated, but everything applies equally when calculating multiple
simultaneous *collision impulses* and resulting velocities.


### Terminology

This documentation uses several terms from the Baraff paper, such as C, NC, Acc.
See that paper for precise definitions. Roughly these are:

+ C is the set of contacts that have some force applied and zero acceleration

+ NC is the set of contacts that have no force applied because they are separating (they
have negative acceleration)

+ Acc is the subset of the A matrix corresponding to just the the set of contacts C

The algorithm starts with both C and NC being empty. We then examine one contact at a
time, moving it into C or NC, and possibly moving existing contacts between C and NC as
necessary.


### Constraints

The acceleration of the gap distance at each contact point is given by

    a = A f + b
    a = acceleration of the gap (positive means gap is tending to widen)
    A = n x n matrix where A[i,j] = change in acceleration at contact i resulting from
      force of 1 being applied at contact j
    f = force applied at each contact (vector, length n)
    b = external and inertial forces in the system (vector, length n)
    n = number of contacts

We find forces such that

    0 <= A f + b
    f . a = 0

The first condition ensures that acceleration is non-negative, so that bodies are not
accelerating into each other: contact forces can only push, never pull. The second
condition means that either

+ the force at a contact is zero and acceleration is positive (contacts are separating),
  or
+ the force at a contact is positive and acceleration is zero


### Joints

Joints are contact points that can both push and pull, and which never break their
contact. Regular contact points can only push, and the contact is broken if the
objects move apart. Joints are called 'bilateral constraints' in the Baraff paper.

Joints have different constraints: the force can be be positive or negative, but the
acceleration is always exactly zero.


### Return Value

The return value from {@link #compute_forces} is -1 if successful, meaning that a set of
forces were found so that the acceleration satisfies the above constraints. If not
successful, the caller can check the set of forces that were calculated to see if the
resulting acceleration at each contact point is still acceptable.

See the method {@link #checkForceAccel} for how to check the accelerations. For example,
the following code calculates and checks the acceleration from the calculated forces.

    var error = computeForces.compute_forces(A, f, b, joint, false, time);
    if (error != -1) {
      var accel = UtilEngine.matrixMultiply(A, f);
      accel = UtilEngine.vectorAdd(accel, b);
      if (!computeForces.checkForceAccel(1E-8, f, accel, joint)) {
        throw new Error();
      }
    }


### Redundant Contacts

It can often happen that the set of contacts is **redundant** in that pushing on one
contact leads the algorithm to increase forces at other contacts in such a way that
the push at that contact is negated, leading to no change in acceleration at that
contact. This means that we cannot independently set the acceleration at that contact.

This shows up mathematically as the Acc matrix being 'poorly conditioned' or singular
if we were to add that contact to C, with some row being a linear combination of other
rows. (Condition number is a measure of how close a matrix is to being singular). Each
row of the matrix corresponds to a contact point. Another way to say the same thing is
that there is a linear combination of rows that equals the zero vector. Then any one
of those rows is 'redundant' (because it can be expressed as a linear combination of
other rows).

Simulations where redundant contacts show up include: the Pile simulation where a
pile of rectangular blocks is resting on each other in a corner on the ground; and the
DoNothingGrinder where the shuttle blocks are wedged between immoveable blocks.


### Deferred (Rejected) Contacts

We avoid adding redundant contacts to C, to keep the Acc matrix non-singular as long as
possible. When starting to drive a contact to zero acceleration, we first check to see
if adding this contact to C will make Acc singular. If so, we **defer** (also called
* **reject**) the contact, so the contact goes on a **list of rejects** (the `R` array)
which are handled only after all other non-deferred contacts have been treated, and then
only if the acceleration at the deferred contact is large enough to worry about.

For the normal non-deferred contacts we have a limit on the acceptable acceleration of
{@link #SMALL_POSITIVE}; but for deferred contacts, we have a different larger limit on
the acceptable acceleration of 100 times that amount. Here 'acceptable' means whether
the overall solution is acceptable, so that the `compute_forces` method can indicate
success in its return value.

There are some other ways for a contact to be 'deferred' (or 'rejected'). One is
when moving a contact from NC to C. When that happens, we do the same kind of check of
whether the contact will make Acc singular, and if so we defer the contact.

Another way that a contact can be deferred is if we notice that a 'zero step' was
made repeatedly at the same contact. Often when a contact moves from NC to C, the step
size is close to zero because the contact had zero acceleration. This is OK, but if we
then notice that the contact moves back from C to NC with another zero size step, we
defer that contact because this can lead to an infinite loop. Note that there can be
intervening zero steps of other contacts; for example, contact A, then B, and then C
all move from NC to C with zero size steps, then A moves back from C to NC with a zero
step -- we would defer contact A. But if any other the intervening steps (for B and C)
were non-zero size then we would not defer contact A.

Note that we can only defer a contact when it has zero force on it in the solution
as calculated to date. This is because all contacts in C usually have some non-zero
force, and if you removed a contact from C without first reducing its force to zero
then the solution would no longer be balanced and the acceleration at other contacts
in C would no longer be zero and contacts in NC might have negative acceleration.
Therefore we can defer a contact `d` before starting to drive it to zero acceleration,
because it is not yet in C and has no force. But as soon as you start driving to zero,
you have committed to putting the contact `d` into C because each step increases the
force at `d`. We can defer any contact that is currently in NC because it has no force.
In the 'zero step' case, we can defer the contact that is in C only if it has zero
force on it.


### Order of Treating Contacts

The order in which we handle (or 'treat') contacts is important and can affect what
solution is found. The policy is set via the {@link #setNextContactPolicy}
method. The default policy is {@link #NEXT_CONTACT_HYBRID} which first
treats Joints in random order, and then non-Joints in the order defined by which has the
most negative acceleration.

There are three other contact order policies: {@link #NEXT_CONTACT_MIN_ACCEL},
{@link #NEXT_CONTACT_RANDOM}, {@link #NEXT_CONTACT_PRE_ORDERED}. Some of these are used
for testing.


### Infinite Loop Detection

There is a mechanism to detect infinite loops where a series of contacts keeps being
rejected over and over. Part of the mechanism looks at whether any progress was made in
the latest step by seeing if the acceleration at the contacts has changed.

The details of the infinite loop detection are as follows: There is a second 'reRejects'
list which contains twice-rejected contacts. If we try to treat a reject, but then
reject it again, it goes into the reRejects list and is removed from the rejects list.
When any progress is made, the reRejects go back to the rejects list to be treated
again. If the rejects list is exhausted without making any progress, then an infinite
loop is detected, then we abandon the entire process, returning an error code. It is
then up to the caller to decide if the resulting solution is adequate or not.


### Sometimes Acc Becomes Singular

Despite the effort to keep Acc non-singular, we sometimes need to treat a contact that
will make Acc singular because the contact has acceleration that is unacceptably large.
In most cases this 'unacceptably large' acceleration is actually very small, like 1E-8
where the limit is 1E-10.

This algorithm is able to still find a solution when Acc is
singular, but then the forces can **become unreasonably large** in order to drive the
acceleration to a small value. What seems to often happen is the following: we are
driving contact `d` to zero even though it makes Acc singular (if `d` were added to C) –
this happens when we are treating a previously deferred contact, and is towards the end
of the process when all non-deferred contacts are in the solution. What usually happens
is that some other contact immediately moves from C to NC and then the `Acc+d` matrix
becomes non-singular, which is a good result.

This algorithm is able to find a solution as long as the `b` vector is in the column
space of the A matrix. This shows up in two places: first, we use a method of solving
the matrix problem `A x = b` that can deal with a singular matrix like this. Second, we
will see that when trying to drive a 'redundant' contact to zero acceleration that the
`delta_a` (the change in acceleration from applying force at the contact) is zero;
normally this means that we cannot drive that contact to zero acceleration and would
fail; but instead it typically is the case that the total acceleration at that contact
is already zero (or close to zero) because we have driven the other contacts to zero,
and the redundant contact is dependent on those.


### Will Not Find Minimal Forces

This algorithm is not guaranteed to find the minimum set of forces that will satisfy the
constraints. Rather, the solution found (the set of forces) is sensitive to the order in
which contacts are treated.

See `myphysicslab.lab.engine2D.test.UtilEngine_test` for unit tests that use random
contact orderings; those tests show that the maximum force and the length of the force
vector depends on the ordering, and also on the criteria for when a matrix is poorly
conditioned (which affects when we defer treating a contact that would make the Acc
matrix poorly conditioned).


### Performance Tweaks

ComputeForces keeps a matrix allocated that is reused, to avoid re-allocating a large
matrix which seems to be a performance bottleneck. Some of the matrix algorithms were
modified so that the matrix can be over-sized. Also we reuse several vectors between
calls to `compute_forces`, to avoid reallocation.

This resulted in an 11% reduction in running time for the `pile_20_random_blocks`
performance test.


### Future Improvements

See [Future Improvements](Engine2D.html#futureimprovements) in 2D Physics Engine
Overview.


### Remaining Mysteries

There are two remaining 'math mysteries' in `compute_forces`:

1. When we go to drive a redundant contact `d` to zero, it pushes a contact from C to
NC, so that `d` can be added and Acc stays non-singular. Is that guaranteed somehow?

2. When unreasonably large forces are calculated, it looks like it’s usually because
there is a pair of opposed contacts and somehow choosing the order so that these are
treated close together (in the sequence of which contact to treat when) is what causes a
large force to occur. Is there a way to recognize this and avoid it? Perhaps the two
contacts are close to linearly dependent? Or maybe adding the second makes the condition
of Acc bad?

@todo  make an enum for Next Contact Policy

* @param {string} name for debugging, this distinguishes whether this is used for
*     contact forces or collision impulses
* @param {!myphysicslab.lab.util.Random} pRNG  pseudo random number generator, used to
*    randomly decide order in which to calculate forces
* @param {number=} tolerance used to decide when numbers are equal or zero;
*    default is 1E-10
* @constructor
* @final
* @struct
*/
myphysicslab.lab.engine2D.ComputeForces = function(name, pRNG, tolerance) {
  /** debug compute forces
  * @type {boolean}
  * @private
  */
  this.debugCF = false;
  /**
  * @type {number}
  * @private
  * @const
  */
  this.SMALL_POSITIVE = (tolerance === undefined) ? 1E-10 : tolerance;
  /** name of this ComputeForces instance, for debugging only
  * @type {string}
  * @private
  * @const
  */
  this.name_ = name;
  /**  simulation time, for debugging only
  * @type {number}
  * @private
  */
  this.time = 0;
  /** twice-rejected rejects.
  * reRejects allows us to select which reject to handle from rejects list,
  * without looking at any twice-rejected rejects.
  * @type {!Array<number>}
  * @private
  */
  this.reRejects = [];
  /** Order in which contacts were treated; each entry is index of contact in A matrix
  * @type {!Array<number>}
  */
  this.order = [];
  /** Order in which treat contacts; each entry is index of contact in A matrix.
  * See {@link #NEXT_CONTACT_PRE_ORDERED}.
  * @type {!Array<number>}
  */
  this.preOrder = [];
  /** Avoid making Acc matrix singular
  * @type {boolean}
  * @private
  */
  this.DEFER_SINGULAR = true;
  /** Print warnings about unusual conditions
  * @type {boolean}
  */
  this.WARNINGS = true;
  /** The Next Contact Policy to use for deciding order in which to treat contacts.
  * @type {number}
  * @private
  */
  this.nextContactPolicy = ComputeForces.NEXT_CONTACT_HYBRID;
  if (goog.DEBUG && this.debugCF)
    this.print('nextContactPolicy=' + this.nextContactPolicy);
  /** SINGULAR_MATRIX_LIMIT specifies min size of diagonal elements in Acc
  * for Acc to be singular
  * @type {number}
  * @private
  * @const
  */
  this.SINGULAR_MATRIX_LIMIT = 2E-3;
  /** avoid re-allocating large matrix by re-using this.
  * @type {!Array<!Float64Array>}
  * @private
  */
  this.aMatrix = [];
  /** copy of aMatrix used to improve tolerance of solution.
  * @type {!Array<!Float64Array>}
  * @private
  */
  this.bMatrix = [];
  /** force at each contact
  * @type {!Array<number>}
  * @private
  */
  this.f = [];
  /** acceleration at each point.  a > 0 means separation.
  * @type {!Array<number>}
  * @private
  */
  this.a = [];
  /** change in force from increase of 1 at contact [d]
  * @type {!Array<number>}
  * @private
  */
  this.delta_f = [];
  /** change in acceleration from increase of 1 at contact [d]
  * @type {!Array<number>}
  * @private
  */
  this.delta_a = [];
  /** contacts which recently took a zero sized step
  * @type {!Array<boolean>}
  * @private
  */
  this.zeroSteps = [];
  /** the A matrix passed in
  * @type {!Array<!Float64Array>}
  * @private
  */
  this.A = [];
  /** the b vector passed in -- external acceleration
  * @type {!Array<number>}
  * @private
  */
  this.b = [];
  /** Contact points with non-zero contact force and zero acceleration
  * @type {!Array<boolean>}
  * @private
  */
  this.C = [];
  /** Non-Contact points that are separating, so contact force is zero.
  * @type {!Array<boolean>}
  * @private
  */
  this.NC = [];
  /** contacts that have been rejected by drive-to-zero
  * @type {!Array<boolean>}
  * @private
  */
  this.R = [];
  /** whether the contact is a Joint (bilateral constraint)
  * @type {!Array<boolean>}
  * @private
  */
  this.joint = [];
  /** number of contacts
  * @type {number}
  * @private
  */
  this.n = 0;
  /** copy of b-vector for checking matrix solve accuracy
  * @type {!Array<number>}
  * @private
  */
  this.v1 = [];
  /** size of step to take, from maxStep
  * @type {number}
  * @private
  */
  this.stepSize = 0;
  /** list of states for detecting loops
  * @type {!Array<!Array<number>>}
  * @private
  */
  this.states = [];
  /** for each state, the max square accel
  * @type {!Array<number>}
  * @private
  */
  this.accels = [];
  /** to debug when special case detected
  * @type {boolean}
  */
  this.specialCase = false;
  /**
  * @type {!myphysicslab.lab.util.Random}
  * @private
  */
  this.pRNG = pRNG;
}

var ComputeForces = myphysicslab.lab.engine2D.ComputeForces;

/** Constant indicates the **Next Contact Policy** which chooses the contact with the
most negative acceleration, treating Joints first.
* @type {number}
* @const
*/
ComputeForces.NEXT_CONTACT_MIN_ACCEL = 1;
/** Constant indicates the **Next Contact Policy** which chooses contacts in random
order, but treats Joints first.
* @type {number}
* @const
*/
ComputeForces.NEXT_CONTACT_RANDOM = 2;
/** Constant indicates the **Next Contact Policy** which chooses contacts according to a
pre-arranged ordering given by the 'preOrder' list of contact numbers, but treats Joints
first.
* @type {number}
* @const
*/
ComputeForces.NEXT_CONTACT_PRE_ORDERED = 3;
/** Constant indicates the **Next Contact Policy** which chooses the contact with the
most negative acceleration, except Joints are treated first in random order.
* @type {number}
* @const
*/
ComputeForces.NEXT_CONTACT_HYBRID = 4;

/** Sets the policy for choosing which contact to treat next.
See {@link #getNextContactPolicy}.
@param {number} nextContactPolicy One of {@link #NEXT_CONTACT_MIN_ACCEL},
    {@link #NEXT_CONTACT_RANDOM}, {@link #NEXT_CONTACT_PRE_ORDERED},
    {@link #NEXT_CONTACT_HYBRID}
*/
ComputeForces.prototype.setNextContactPolicy = function(nextContactPolicy) {
  if (goog.DEBUG && this.debugCF)
    this.print('nextContactPolicy='+ nextContactPolicy);
  this.nextContactPolicy = nextContactPolicy;
}

/** Returns the policy for choosing which contact to treat next.
See {@link #setNextContactPolicy}.
@return {number} One of {@link #NEXT_CONTACT_MIN_ACCEL},
    {@link #NEXT_CONTACT_RANDOM}, {@link #NEXT_CONTACT_PRE_ORDERED},
    {@link #NEXT_CONTACT_HYBRID}
*/
ComputeForces.prototype.getNextContactPolicy = function() {
  return this.nextContactPolicy;
}

/**  Calculates the forces at each contact point of a multi-body contact situation.

@param {!Array<!Float64Array>} A an n x n matrix giving change in acceleration
    for force at each contact
@param {!Array<number>} f force at each contact (vector, length n),
    this is what is solved for
       and is returned via this vector (this vector is zeroed out at start).
@param {!Array<number>} b external and inertial forces in the system (vector, length n)
@param {!Array<boolean>} joint indicates which contacts are Joints (vector, length n)
@param {boolean} debug true shows debugging messages
@param {number} time  the current time, used only for debugging
@return {number} error code, -1 if successful otherwise an error occurred
*/
ComputeForces.prototype.compute_forces = function(A, f, b, joint, debug, time) {
  if (goog.DEBUG && 1==0 && this.name_ == 'C' && this.pRNG.nextFloat() < 0.001) {
    // test of the ContactSim.reportError mechanism: randomly generate an error
    return -999;
  }
  this.debugCF = debug;
  this.time = time;
  this.n = b.length;
  goog.asserts.assert(A.length == this.n);
  goog.asserts.assert(A[0].length == this.n);
  goog.asserts.assert(f.length == this.n);
  goog.asserts.assert(b.length == this.n);
  goog.asserts.assert(joint.length == this.n);
  // short cut when n==1, (comes up a lot with serial collision handling)
  if (this.n==1) {
    f[0] = (joint[0] || b[0] < 0) ? -b[0]/A[0][0] : 0;
    return -1;
  }
  this.A = A;
  this.b = b;
  this.f = f;
  this.joint = joint;
  // resize vectors to be at least length n.
  if (this.a.length < this.n) {
    var size = this.n+10;  // allocate extra space to avoid frequent resizing
    this.a = UtilityCore.newNumberArray(size);
    this.C = UtilityCore.newBooleanArray(size);
    this.NC = UtilityCore.newBooleanArray(size);
    this.R = UtilityCore.newBooleanArray(size);
    this.delta_a = UtilityCore.newNumberArray(size);
    this.delta_f = UtilityCore.newNumberArray(size);
    this.zeroSteps = UtilityCore.newBooleanArray(size);
  }
  // When a contact is deferred by drive_to_zero, put it on list of rejects,
  // and then process other contacts, returning to the rejects at the end
  // to give them a second chance.
  goog.array.clear(this.reRejects);
  var solved = 0;
  this.specialCase = false;
  this.states = [];
  this.accels = [];
  for (var i=0; i<this.n; i++) {
    this.f[i] = 0;
    this.a[i] = this.b[i];
    this.NC[i] = false;
    this.C[i] = false;
    this.R[i] = false;
  }
  var loopCtr = 0;
  if (goog.DEBUG) {
    this.order = [];
  }
  if (goog.DEBUG && this.debugCF) {
    if (this.preOrder.length > 0) {
      UtilEngine.printList('preOrder ', this.preOrder);
    }
    this.printEverything('compute_forces start', true);
  }
  // while there exists d such that a[d] < 0
  while (true) {
    loopCtr++;
    var d = -1;
    switch (this.nextContactPolicy) {
      case ComputeForces.NEXT_CONTACT_HYBRID:
        d = this.nextContactHybrid();
        break;
      case ComputeForces.NEXT_CONTACT_MIN_ACCEL:
        d = this.nextContactMinAccel();
        break;
      case ComputeForces.NEXT_CONTACT_RANDOM:
        d = this.nextContactRandom();
        break;
      case ComputeForces.NEXT_CONTACT_PRE_ORDERED:
        d = this.nextContactOrdered();
        break;
      default: throw new Error();
    }
    if (goog.DEBUG && this.debugCF) {
      this.print('\n--------- in compute_forces, d='+d
        +' loopCtr='+loopCtr+' --------------');
    }
    if (d < 0) {
      break;
    }
    if (this.R[d]) {
      this.reRejects.push(d);
    }
    if (this.checkLoop(d)) {
      //this.specialCase = true;
      if (goog.DEBUG && this.WARNINGS)
        this.print('checkLoop STOP');
      break;
    }
    // keep track of the order of treating contacts, for debugging.
    if (goog.DEBUG) {
      this.order.push(d);
    }
    if (goog.DEBUG && loopCtr > 2*this.n) {
      this.debugCF = true;
      this.printEverything('compute_forces loopCtr= '+loopCtr+' d='+d, false);
    }
    var error = this.drive_to_zero(d);
    if (goog.DEBUG && this.debugCF) {
      this.print('drive_to_zero returned '+
          (error == -1 ? 'OK' : error) +' d='+d+' N='+this.n);
      //this.printEverything('after drive_to_zero('+d+')', false);
    }
    if (error > -1) {
      // Positive integer gives index of contact to defer till later.
      goog.asserts.assert(error < this.n);
      this.C[error] = false;
      this.NC[error] = false;
      this.R[error] = true;
      // indicate a deferral/reject with negative index.  (For zero, use -9999).
      if (goog.DEBUG) {
        this.order.push(error == 0 ? -9999 : -error);
      }
    } else if (error < -1) {
      // negative error code (other than -1) means general failure
      if (goog.DEBUG && (this.WARNINGS || this.debugCF)) {
        //var e = new Error();
        //console.log(e.stack);
        this.print('compute_forces general error '+error);
      }
      return error;
    } else {
      goog.asserts.assert(error == -1);
      // -1 means success, so remove d from rejects list (if it was on the list)
      // and reset the reRejects list.
      goog.array.clear(this.reRejects);
      if (this.R[d]) {
        if (goog.DEBUG && this.debugCF)
          this.printContact(' deferral solved ', true, d, -1, -1);
        solved++;
        this.R[d] = false;
      }
    }
  }
  if (goog.DEBUG && 0 == 1) {
    UtilEngine.printArray2(NF7(time)+' ComputeForces order ', this.order, NF0);
  }
  if (goog.DEBUG && this.debugCF && solved > 0) {
    if (solved > 0) {
      this.print('compute_forces rejects solved '+solved);
    }
    this.printEverything('end of compute_forces');
  }
  return -1;
}


/** Detects infinite loop while solving reject contacts by checking if the current
'state' is a duplicate of an earlier state. State is specified by the pattern of which
contacts are in C, NC, or R, plus which contact is currently being driven-to-zero. We
only track state once every contact has been treated, so that each contact is in one
of C, NC, or R. We keep a list of every state seen previously.
* @param {number} d  which contact we are going to drive-to-zero next
* @return {boolean} true if the current state matches any previous state
* @private
*/
ComputeForces.prototype.checkLoop = function(d) {
  var debug = this.debugCF; //time >= 46.4499;
  var i, len;
  if (goog.DEBUG) {
    // check that only one of C, NC, or R are true
    for (i=0; i<this.n; i++) {
      if (this.C[i])
        goog.asserts.assert(!this.NC[i] && !this.R[i]);
      if (this.NC[i])
        goog.asserts.assert(!this.C[i] && !this.R[i]);
      if (this.R[i])
        goog.asserts.assert(!this.C[i] && !this.NC[i]);
    }
  }
  // if any contact has not yet been treated, then no loop yet
  for (i=0; i<this.n; i++) {
    if (!this.C[i] && !this.NC[i] && !this.R[i]) {
      if (debug)
        this.print('contact not yet treated i='+i);
      return false;
    }
  }
  if (debug)
    this.print('checkLoop states.length='+this.states.length);
  // make a new state vector
  /** @type {!Array<number>} */
  var state = [];
  for (i=0; i<this.n; i++) {
    state.push(this.C[i] ? 1 : (this.NC[i] ? 2 : 3));
  }
  // also add the current contact being driven to zero to the state
  state.push(d);
  if (debug)
    UtilEngine.printList('checkLoop state', state);
  // check whether this state vector already exists
  var duplicateState = false;
  for (i=0, len=this.states.length; i<len; i++) {
    /** @type {!Array<number>} */
    var s = this.states[i];
    if (debug)
      UtilEngine.printList('state', state);
    if (goog.array.equals(state, s)) {
      if (goog.DEBUG && this.WARNINGS) {
        var accelOld = this.accels[i];
        var accelMin = UtilEngine.minValue(this.accels);
        this.print('num states='+this.states.length
          +' now accel='+NFE(ComputeForces.sumAccelSquare(this.a, this.joint, this.n))
          +' prev accel='+NFE(accelOld)
          +' min accel='+NFE(accelMin)
          );
        UtilEngine.printList('state', state);
        console.log('checkLoop detected same state');
      }
      duplicateState = true;
    }
  }
  if (!duplicateState) {
    // add this new state to list of states
    this.states.push(state);
    this.accels.push(ComputeForces.sumAccelSquare(this.a, this.joint, this.n));
  }
  if (duplicateState && goog.DEBUG && this.WARNINGS) {
    UtilEngine.printList('now state', state);
    for (i=0, len=this.states.length; i<len; i++) {
      /** @type {!Array<number>} */
      var st = this.states[i];
      UtilEngine.printList('old state', st);
    }
    UtilEngine.printList('accels', this.accels);
  }
  return duplicateState;
}

/** Returns the sum of squares of unwanted accelerations.  This should ideally
be zero for a solution.
@param {!Array<number>} accel  acceleration at each contact
@param {!Array<boolean>} joint  true when contact is a Joint
@param {number} n number of contacts
@return {number} the sum of squares of unwanted accelerations
@private
*/
ComputeForces.sumAccelSquare = function(accel, joint, n) {
  var r = 0;
  for (var i=0; i<n; i++) {
    if (joint[i] || accel[i] < 0) {
      r += accel[i]*accel[i];
    }
  }
  return r;
}

/** Returns the maximum unwanted acceleration at all contacts.
@param {!Array<number>} accel  acceleration at each contact
@param {!Array<boolean>} joint  true when contact is a Joint
@param {number} n number of contacts
@return {number} the maximum unwanted acceleration at all contacts
*/
ComputeForces.maxAccel = function(accel, joint, n) {
  var r = 0;
  for (var i=0; i<n; i++) {
    if (joint[i] || !joint[i] && accel[i] < 0) {
      if (Math.abs(accel[i]) > r)
        r = Math.abs(accel[i]);
    }
  }
  return r;
}

/** Returns the contact with the most negative acceleration, except Joints are treated
first in random order.

We treat Joints first because they always need to be treated and will strongly
affect the outcome of forces.

It is important to treat Joints in random order to even out the 'neglect' of a
Joint when it is consistently picked last and is deferred and so has more acceleration
than the other Joints and winds up accumulating acceleration over time and moving
significantly away resulting in a 'loose Joint'. This was seen when quickly spinning
the two-connected-blocks (two blocks connected rigidly by two double Joints).

When only 'rejects' (deferred contacts) are left, we pick the reject with most
negative acceleration, but stop treating rejects when they have small negative
acceleration.
* @return {number} the next contact to be treated
* @private
*/
ComputeForces.prototype.nextContactHybrid = function() {
  //UtilEngine.printList('nextContact ', this.order);
  // for Joints, find the Joint with the maximum absolute value acceleration
  var j = -1;
  var i, k;
  var rand = this.pRNG.randomInts(this.n);
  // Joints first, in random order
  for (k=0; k<this.n; k++) {
    i = rand[k];
    if (this.joint[i] && !this.C[i] && !this.NC[i] && !this.R[i]) {
      return i;
    }
  }
  // find the non-Joint with most negative accel
  var minAccel = UtilityCore.POSITIVE_INFINITY;
  j = -1;
  for (i=0; i<this.n; i++) {
    if (!this.joint[i] && !this.C[i] && !this.NC[i] && !this.R[i]) {
      if (this.a[i] < minAccel) {
        minAccel = this.a[i];
        j = i;
      }
    }
  }
  if (j > -1) {
    return j;
  }
  return this.nextReject();
}


/** Returns the contact with the most negative acceleration, treating Joints first.
When only 'rejects' (deferred contacts) are left, we pick the reject with most
negative acceleration, but stop treating rejects when they have small negative
acceleration.

We treat Joints first because they always need to be treated and will strongly
affect the outcome of forces.
* @return {number} the next contact to be treated
* @private
*/
ComputeForces.prototype.nextContactMinAccel = function() {
  //UtilEngine.printList('nextContact ', this.order);
  // for Joints, find the Joint with the maximum absolute value acceleration
  var maxAccel = -1;
  var j = -1;
  var i;
  for (i=0; i<this.n; i++) {
    if (this.joint[i] && !this.C[i] && !this.NC[i] && !this.R[i]) {
      if (Math.abs(this.a[i]) > maxAccel) {
        maxAccel = Math.abs(this.a[i]);
        j = i;
      }
    }
  }
  if (j > -1) {
    return j;
  }
  // for non-Joints find the non-Joint with most negative accel
  var minAccel = UtilityCore.POSITIVE_INFINITY;
  j = -1;
  for (i=0; i<this.n; i++) {
    if (!this.joint[i] && !this.C[i] && !this.NC[i] && !this.R[i]) {
      if (this.a[i] < minAccel) {
        minAccel = this.a[i];
        j = i;
      }
    }
  }
  if (j > -1) {
    return j;
  }
  return this.nextReject();
}


/** Returns contacts in random order, but treats Joints first.  This is used
for testing.

From several tests in UtilityTest, it seems that the random contact policy is still
finding big forces, even with the “don’t make Acc be singular” policy. This means that
treating contacts in order of their acceleration (most negative accel first), instead
of randomly, is important.
* @return {number} the next contact to be treated
* @private
*/
ComputeForces.prototype.nextContactRandom = function() {
  //UtilEngine.printList('nextContactRandom ', this.order);
  var j = -1;
  var i, k;
  var rand = this.pRNG.randomInts(this.n);
  // Joints first
  for (k=0; k<this.n; k++) {
    i = rand[k];
    if (this.joint[i] && !this.C[i] && !this.NC[i] && !this.R[i]) {
      return i;
    }
  }
  // non-Joints
  for (k=0; k<this.n; k++) {
    i = rand[k];
    if (!this.joint[i] && !this.C[i] && !this.NC[i] && !this.R[i]) {
      return i;
    }
  }
  return this.nextReject();
}

/** Returns contacts according to a pre-arranged ordering given by the 'preOrder' list
of contact numbers, but treats Joints first.  Used for testing.
* @return {number} the next contact to be treated
* @private
*/
ComputeForces.prototype.nextContactOrdered = function() {
  //UtilEngine.printList('nextContactOrdered ', this.order);
  var np = this.preOrder.length;
  var i, k;
  for (k=0; k<np; k++) {
    i = this.preOrder[k];
    if (this.joint[i] && !this.C[i] && !this.NC[i] && !this.R[i]) {
      return i;
    }
  }
  for (k=0; k<np; k++) {
    i = this.preOrder[k];
    if (!this.joint[i] && !this.C[i] && !this.NC[i] && !this.R[i] ) {
      return i;
    }
  }
  return this.nextReject();
}

/** Return the next deferred contact to be processed: the one with most negative
acceleration, or for Joints the one with the largest absolute value acceleration.
Will not return a contact on the 'reRejects' list, to allow cycling thru all of the
rejects.
* @return {number} the next reject to be treated
* @private
*/
ComputeForces.prototype.nextReject = function() {
  var maxAccel = 0.0;
  var j = -1;
  var i;
  for (i=0; i<this.n; i++) {
    if (this.R[i] && !goog.array.contains(this.reRejects, i)) {
      if (!this.joint[i] && this.a[i] < -maxAccel || this.joint[i]
            && Math.abs(this.a[i]) > maxAccel) {
        maxAccel = Math.abs(this.a[i]);
        j = i;
      }
    }
  }
  // treat rejects only if they have significant acceleration
  if (j > -1 && maxAccel > 100*this.SMALL_POSITIVE) {
    return j;
  }
  return -1;
}

/** Check that acceleration at each contact is non-negative, for debug only.  Prints
debug information to console when errors are detected.
@param {number} tolerance tolerance used for testing whether acceleration is
    non-negative
@return {boolean} true if acceleration is OK
*/
ComputeForces.prototype.checkAccel = function(tolerance) {
  var i;
  if ((this.WARNINGS || this.debugCF) && goog.DEBUG) {
    for (i=0; i<this.n; i++) {
      if ((this.C[i] || this.joint[i]) && Math.abs(this.a[i]) > this.SMALL_POSITIVE) {
        //this.specialCase = true;
        this.print('=======  accel s/b zero a['+i+']='
              +NFE(this.a[i])+' tol='+NFE(this.SMALL_POSITIVE));
      }
      if ((this.NC[i] && !this.joint[i]) && this.a[i] < -this.SMALL_POSITIVE) {
        //this.specialCase = true;
        this.print('========  accel s/b non-negative a['+i+']='
              +NFE(this.a[i])+' tol='+NFE(-this.SMALL_POSITIVE));
      }
      if (this.NC[i] && Math.abs(this.f[i]) > this.SMALL_POSITIVE) {
        //this.specialCase = true;
        this.print('========  force s/b zero at NC f['+i+']='
              +NFE(this.f[i])+' tol='+NFE(this.SMALL_POSITIVE));
      }
    }
    if (0 == 1 && goog.DEBUG) {
      var accel = UtilEngine.matrixMultiply(this.A, this.f);
      accel = UtilEngine.vectorAdd(accel, this.b);
      var minAccel2 = UtilEngine.minValue(accel);
      //goog.asserts.assert(Math.abs(minAccel) < 2E-8);
      var minAccel = UtilEngine.minValue(this.a, this.n);
      this.print('min accel = '+NFE(minAccel)
          +' min accel2 = '+NFE(minAccel2)
      );
      this.printEverything('checkAccel', true);
    }
    if (0 == 1 && goog.DEBUG) {
      UtilEngine.printArrayIndices('C', this.C, this.n);
      UtilEngine.printArrayIndices('NC', this.NC, this.n);
      UtilEngine.printArrayIndices('R', this.R, this.n);
      //UtilEngine.printList('rejects', rejects);
      var p = new Array(this.n);
      for (i=0; i<this.n; i++) {
        p[i] = !this.C[i] && !this.NC[i];
      }
      UtilEngine.printArrayIndices('not C or NC', p, this.n);
    }
  }
  if (!ComputeForces.checkForceAccel(tolerance, this.f, this.a, this.joint)) {
    if ((this.WARNINGS || this.debugCF) && goog.DEBUG) {
      this.print('checkForceAccel FAILED with tolerance='+NFE(tolerance));
      UtilEngine.printArray('force', this.f, NFE, this.n);
      UtilEngine.printArray('accel', this.a, NFE, this.n);
    }
    return false;
  }
  return true;
}

/** Returns true if the given force and accel vectors satisfy the constraints that if
`f != 0` then `a = 0`, or if `f = 0` then `a >= 0`.
* @param {number} tolerance ignore deviations from constraints smaller than this
* @param {!Array<number>} force array of forces applied to a set of contacts
* @param {!Array<number>} accel array of accelerations at a set of contacts
* @param {!Array<boolean>} joint whether each contact is a joint
* @return {boolean} true if the force and accel vectors satisfy the constraints
*/
ComputeForces.checkForceAccel = function(tolerance, force, accel, joint) {
  if (goog.DEBUG) {
    UtilEngine.checkArrayNaN(accel);
    UtilEngine.checkArrayNaN(force);
  }
  var n = force.length;
  var i;
  if (accel.length < n)
    throw new Error();
  var r = true;
  for (i=0; i<n; i++) {
    if (joint[i] || Math.abs(force[i]) > 1E-10) {
      if (Math.abs(accel[i]) > tolerance) {
        r = false;
        if (goog.DEBUG) {
          console.log('checkForceAccel i='+i
              +' accel[i]='+NFE(accel[i])
              +' force[i]='+NFE(force[i]));
        }
      }
    } else {
      if (accel[i] < - tolerance) {
        r = false;
        if (goog.DEBUG) {
          console.log('checkForceAccel i='+i
              +' accel[i]='+NFE(accel[i])
              +' force[i]='+NFE(force[i]));
        }
      }
    }
  }
  return r;
}

/**  drive_to_zero modifies forces until a[d] = 0.
Drive_to_zero only modifies forces among C, NC or d; and d is then added to C or NC.

<pre>
If d is a non-Joint and a[d] &gt; 0;  then we put d into NC and we are done.
If d is a non-Joint and a[d] &lt; 0;  then we increase f[d] until a[d] = 0.
If d is a Joint and a[d] &gt; 0;  then we decrease f[d] until a[d] = 0.
If d is a Joint and a[d] &lt; 0;  then we increase f[d] until a[d] = 0.

But every change in f[d] causes changes in accelerations and forces at other contact points.
Luckily it is a linear relationship, so we can find out that if we change f[d] by +1,
how much do the forces at clamped contacts need to change to stay clamped (see fdirection).

We increase f[d] in discrete steps.  Without other constraints, we could
choose f[d] to just exactly set a[d] = 0.  However, applying that much
force might cause one of the other contacts to clamp (move from NC to C) or
un-clamp (move from C to NC).
Therefore, we choose the largest step size (see maxStep) that takes us to either a[d] = 0
or to some contact other than d changing between C and NC.
Then we repeat until we get a[d] = 0.

Modifications of the algorithm for Joints:
At a Joint, we want to keep acceleration at zero, but the force can be positive or negative.
If we are driving the acceleration at a Joint to zero, then we may find that
the step is negative (for example, we may start with a[d] &gt; 0, and need to decrease f[d]
into the negative range to compensate).  The maxStep function was modified to allow
for finding negative step sizes.  Also, Joints always stay in C, they never switch from
C to NC, so they never limit a step size in maxStep (unless it is the Joint itself you
are driving to zero, then the limit is because you want to get to a[d] = 0).
Joints are called 'bilateral constraints' in the Baraff '94 paper, and this modification
is described in section '4.5 Implementation Details'.

Flip-flop contacts:
It can happen that a contact causes multiple zero sized
steps, where the state of the contact flip flops between C and NC
without making any progress.  This can lead to an infinite loop.
We take that contact out of both C and NC and defer treating it
till after all other contacts have been driven to zero acceleration.

Some key insights about the process:
1)  Once we start driving d to zero, we are committed to having d in C (because every
    step applies more force at d).
2)  The places to prevent making Acc singular are:
2a) Before committing to driving d to zero. Check if matrix Acc+d is singular.
2b) When moving a contact from NC to C.  In this case, check if the matrix Acc+d+j
    is singular.  Or if there is no force yet at d you could just check if Acc+j
    is singular.
3)  We can only defer (reject) contacts that have zero force, otherwise the forces
    in C will no longer be balanced.  They become unbalanced in later steps when
    we are calculating delta_f based on Acc and there is a contact with force
    that is not in C.
4)  Sometimes a step will both move a contact between C/NC and simultaneously
    drive a[d] to zero;  in that case we can end the process and move d to C.

Some key understandings.  (These things are probably stated above already, but
this is kind of my current mental model of the whole process.)
1) f and a are always correct for ALL contacts, regardless of if in C or NC or
   neither. The acceleration can be independently calculated at every contact as:
      a = A f - b.
   However, what the algorithm does is:
      a = -b
      repeat until (constraints are met) {
        a = a + A . delta_f
        f = f + delta_f
      }
2) We do matrix calculations with Acc instead of the full A matrix because f[i] = 0
   for i ∈ NC. We more-or-less ignore contacts in NC because they have no force.
3) Any increase in force at d must be balanced by adjusting forces at other contacts
   in C.  This is the calculation of delta_f from
      Acc delta_f = -A[d]
   Because A[d] gives the amount that each contact's acceleration will change from an
   increase in force of 1.0 in f[d].
4) In a drive_to_zero step, the focus is on driving the acceleration at d to zero;
   note that the acceleration at contacts in C do NOT change, they should all remain
   at zero acceleration. Contacts in NC can change acceleration as long as
   acceleration stays zero or positive (for non-Joints, or zero for Joints). These
   statements are captured by 'the constraints'.
5) Transitions between C and NC happen because pushing at d either reduces the force
   at at contact in C or reduces the acceleration at a contact in NC.
6) When the set C changes you have to recalculate delta_f before continuing to push
   more at d.
7) You can only push at d (unless d is a Joint, then you can both pull and push).
   You are only driving d to zero if it has negative acceleration (or any accel
   for a Joint).  To counter negative acceleration at a contact, you naturally
   increase the contact force there which increases the accel.
</pre>

@todo  fix documentation and remove code to reflect this no longer returns
    'index of contact we failed to drive to zero'.

* @param {number} d  index of the contact to drive to zero acceleration
* @return {number} -1 if success, otherwise positive integer gives index of
    contact to defer till later, or negative integer means general failure.
* @private
*/
ComputeForces.prototype.drive_to_zero = function(d) {
  var i;
  goog.asserts.assert(this.n <= this.f.length);
  goog.asserts.assert(!this.C[d]);
  goog.asserts.assert(!this.NC[d]);
  if (this.debugCF && goog.DEBUG)
    this.print('drive_to_zero d='+d+' a['+d+']='+NFE(this.a[d])
      +' joint='+this.joint[d]+' N='+this.n);
  // First deal with cases where we don't have to do anything at all
  // (no changes to forces needed) because a[d] is already at zero.
  // For non-Joints, when contact is separating, put contact into NC and done.
  // For Joints, if accel is zero, put into NC and done.
  if (!this.joint[d] && this.a[d] >= -this.SMALL_POSITIVE
    || this.joint[d] && Math.abs(this.a[d]) <= this.SMALL_POSITIVE) {
    this.NC[d] = true;
    return -1;
  }
  // We are now committing to moving d into C, because every non-zero step will
  // increase f[d].
  if (this.DEFER_SINGULAR) {
    // check whether adding d to C will make Acc+d matrix singular.
    var singular = this.wouldBeSingular1(d);
    var defer = singular && !this.R[d];
    if (defer) {
      // defer d because adding d to C would make Acc+d matrix singular.
      if (goog.DEBUG && (this.debugCF)) {
        this.print('SINGULAR MATRIX(1) DEFER d='+d
              +' f[d]='+NFE(this.f[d])
              +' a[d]='+NFE(this.a[d])
              );
      }
      return d;
    } else if (goog.DEBUG && (this.debugCF) && singular && this.R[d]) {
      // we won't defer d because we previously rejected it.
      this.print('SINGULAR MATRIX(1) IN REJECTS d='+d
            +' a[d]='+NFE(this.a[d])
            );
    }
  }
  // We now know that contact d has acceleration which must be reduced to zero.
  for (i=0; i<this.n; i++) {
    this.delta_a[i] = 0;
    this.delta_f[i] = 0;
    this.zeroSteps[i] = false;
  }
  var accelTol = this.SMALL_POSITIVE;
  var loopCtr = 0; // to detect infinite loops
  // for non-Joint:  ensure not accelerating into the contact
  // for Joint: ensure that acceleration is zero
  while (!this.joint[d] && this.a[d] < -accelTol ||
          this.joint[d] && Math.abs(this.a[d]) > accelTol) {
    if (this.debugCF && goog.DEBUG) {
      var accDsingular = this.wouldBeSingular1(d);
      this.print('Acc+d would be '+(accDsingular? '' : 'non-')+'singular, d='+d);
    }
    // fdirection computes the rest of delta_f resulting from delta_f[d] = 1
    var error = this.fdirection(d);
    if (error != -1)
      return error;
    if (this.debugCF && goog.DEBUG)
      this.printEverything('drive_to_zero after fdirection, d='+d);
    if ((this.WARNINGS || this.debugCF) && goog.DEBUG) {
      for (i=0; i<this.n; i++) {
        // check that delta_a[i] = 0 for all members of C
        if (this.C[i] && Math.abs(this.delta_a[i])> this.SMALL_POSITIVE) {
          this.print('should be zero '+' delta_a['+i+']='+NFE(this.delta_a[i]));
        }
        // check that delta_f[i] is reasonable size;  defer if not??
        if (this.C[i] && Math.abs(this.delta_f[i]) > 1E6) {
          this.print('very large force '+' delta_f['+i+']='+NFE(this.delta_f[i]));
        }
      }
    }
    // What is the maximum step we can take towards moving a[d] to zero,
    // before some contact other than d is clamped or unclamped?
    // maxStep returns the stepSize and the index j of the force that
    // limited the step.
    var j = this.maxStep(d);
    if (j<0 || Math.abs(this.stepSize) > 1E5) {
      // maxStep found a huge step, or cannot figure what to do.
      if ((this.WARNINGS || this.debugCF) && goog.DEBUG) {
        if (j > -1)
          this.print('HUGE STEP j='+j+' d='+d+' stepSize='+NFE(this.stepSize));
        else
          this.print('maxStep:  no step possible d='+d);
      }
      // Defer [d] if f[d] = 0;  else if a[d] ≈ 0 then move d to C;
      // otherwise it is a general error, which should not happen.
      if (Math.abs(this.f[d]) < this.SMALL_POSITIVE) {
        return d;
      } else {
        // If a[d] is near zero then we increase the tolerance for
        // acceleration.  This should cause d to move into C.
        if (Math.abs(this.a[d]) < 1E-5) {
          accelTol = 1.1 * Math.abs(this.a[d]);
          continue;
        }
        // f[d] has significant force, so we cannot defer it, because
        // d is not yet in C so we can no longer balance the forces.
        if (goog.DEBUG) {
          this.printEverything('maxStep failed but f[d]>0, d='+d+' j='+j, false);
        }
        // If this assert ever happens, we need to debug it.
        //goog.asserts.fail();
        return -2;  // general error, unable to drive d to zero accel
      }
    }
    goog.asserts.assert(j > -1);
    if (this.debugCF && goog.DEBUG) {
      this.printContact(' maxStep', false, j, d, loopCtr);
    }
    if (Math.abs(this.stepSize) < 1E-12) {
      // We are taking a zero size step;  ensure not happening repeatedly.
      if (this.debugCF && goog.DEBUG)
        this.printContact(' ZERO STEP', false, j, d, loopCtr);
      if (this.zeroSteps[j]) {
        // This contact has previously caused a zero-size step during this
        // drive-to-zero loop, so it is flip-flopping between C and NC,
        // potentially as an infinite loop.
        if ((this.WARNINGS || this.debugCF) && goog.DEBUG) {
          this.print('FLIP-FLOP DEFER j='+j
            +' f[j]='+NFE(this.f[j])
            +' a[j]='+NFE(this.a[j])
            +' while driving d='+d+' N='+this.n);
        }
        // defer solving this contact by adding to rejects, then continue on
        goog.asserts.assert(Math.abs(this.f[j]) < 10*this.SMALL_POSITIVE);
        this.C[j] = false;
        this.NC[j] = false;
        this.R[j] = true;
      }
      // Remember that this contact caused a zero-size step.
      // This is OK to happen once in this drive-to-zero loop,
      // but multiple times can be a problem.
      this.zeroSteps[j] = true;
    }
    // apply the step in forces to modify the forces f and accelerations a.
    for (i=0; i<this.n; i++) {
      this.f[i] += this.stepSize*this.delta_f[i];
      this.a[i] += this.stepSize*this.delta_a[i];
    }
    if (loopCtr++ > 10*this.n) {
      if (goog.DEBUG) {
        this.debugCF = true;
        this.print('drive_to_zero() loopCtr='+loopCtr+' d='+d+' a[d]='+this.a[d]);
      } else if (loopCtr > 1000*this.n) {
        throw new Error('drive_to_zero() loopCtr='+loopCtr
          +' d='+d+' a[d]='+this.a[d]);
      }
    }
    if (this.DEFER_SINGULAR && this.NC[j]) {
      // maxStep is asking to move j from NC to C,
      // check whether this will make Acc+d+j matrix singular.
      // (alternative:  if f[d] = 0, could instead check if Acc+j is singular)
      var singular = this.wouldBeSingular2(d, j);
      // because j is in NC, it must have zero force.
      goog.asserts.assert(Math.abs(this.f[j]) < this.SMALL_POSITIVE);
      var defer = singular && !this.R[j];
      if (defer) {
        // we will defer j because it would make Acc+d+j singular
        if ((this.debugCF) && goog.DEBUG) {
          this.print('SINGULAR MATRIX(2) DEFER NC j='+j
            +' f[j]='+NFE(this.f[j])+' a[j]='+NFE(this.a[j])
            );
        }
        this.C[j] = false;
        this.NC[j] = false;
        this.R[j] = true;
        continue;
      } else if (singular && this.R[j]) {
        // we won't defer j because we previously rejected it.
        // (This case doesn't seem to happen, and it is unclear what to do here.)
        if ((this.WARNINGS || this.debugCF) && goog.DEBUG) {
          this.print('SINGULAR MATRIX(2) IN REJECTS NC j='+j
                +' a[j]='+NFE(this.a[j])
                );
        }
      }
    }
    // If j is in C or NC, j is moved from one to the other.
    // otherwise, j = d, meaning a[d] has been driven to zero,
    // and drive-to-zero returns.
    // We allow small negative numbers to be in the solution:
    // a small negative acceleration for contacts in C or
    // a small negative force for contacts in NC.
    // When the small negative accel or force exceeds a certain small limit,
    // then we move the contact into the 'not yet driven to zero' category
    // (out of C or NC and possibly into rejects) so that it can be again
    // driven-to-zero later on.
    if (this.C[j]) {
      // This is moving from C to NC, we've just reduced the force to near zero.
      goog.asserts.assert(Math.abs(this.f[j]) <= this.SMALL_POSITIVE);
      if (Math.abs(this.a[j]) > this.SMALL_POSITIVE) {
        // A contact in C, should have zero accel, but errors have
        // accumulated to give this a non-zero accel.
        // Instead of moving to NC, move this to the set of untreated contacts
        // so that we can drive it to zero again.
        if (Math.abs(this.f[j])> 10*this.SMALL_POSITIVE) {
          var s = 'moving C to NC but f[j]='+ NFE(this.f[j]);
          if (goog.DEBUG)
            this.printEverything(s);
          else
            throw new Error(s);
        }
        if ((this.WARNINGS || this.debugCF) && goog.DEBUG) {
          this.printContact(' redo C', false, j, d, loopCtr);
        }
        this.C[j] = false;
        this.NC[j] = false;
        this.R[j] = true;
      } else {
        this.C[j] = false;
        this.NC[j] = true;
        goog.asserts.assert(!this.R[j]);  // it was in C, so not in R
      }
    } else if (this.NC[j]) {
      goog.asserts.assert(Math.abs(this.a[j]) <= this.SMALL_POSITIVE);
      if (Math.abs(this.f[j]) > this.SMALL_POSITIVE) {
        // A contact in NC, should have zero force, but errors have
        // accumulated to give this a non-zero force.
        // Instead of moving to C, move this to the set of untreated contacts
        // so that we can drive it to zero again.
        // ??? SHOULD WE ADD THIS TO REJECTS???
        if (Math.abs(this.a[j])> 10*this.SMALL_POSITIVE)
          this.print('WARNING moving NC to C but a[j]='+NFE(this.a[j]));
        if ((this.WARNINGS || this.debugCF) && goog.DEBUG) {
          this.printContact(' redo NC', false, j, d, loopCtr);
        }
        this.C[j] = false;
        this.NC[j] = false;
        this.R[j] = true;
      } else {
        this.C[j] = true;
        this.NC[j] = false;
        goog.asserts.assert(!this.R[j]);  // it was in NC, so not in R
      }
    } else if (j == d) {
      // If j is not in C or NC, then j is the one we are driving to zero, ie. j = d
      // and maxStep would have chosen a large enough step to arrive at a[d] = 0.
      // which means we are done driving d to zero.
      // We continue the loop, which will end when a[d] = 0.
    } else {
      // when j is in neither C nor NC, then we just deferred it.
      goog.asserts.assert(this.R[j]);
      if (0 == 1 && (this.WARNINGS || this.debugCF) && goog.DEBUG) {
        this.print('we probably just deferred something.  j='+j+' d='+d);
        this.printContact('we probably deferred', false, j, d, loopCtr);
      }
    }
  }
  // Decide whether to put d in C or NC based on force f[d]
  this.C[d] = Math.abs(this.f[d]) > this.SMALL_POSITIVE;
  this.NC[d] = !this.C[d];
  //this.R[d] = false;  don't do this here; done in loop outside
  // If we applied some force at f[d], it must be in C, otherwise in NC.
  goog.asserts.assert( (Math.abs(this.f[d]) > this.SMALL_POSITIVE && this.C[d])
        || (Math.abs(this.f[d]) <= this.SMALL_POSITIVE && this.NC[d]) );
  if (this.debugCF && goog.DEBUG) {
    this.print('drive_to_zero finish d='+d
      +' a['+d+']='+NFE(this.a[d]));
    this.printEverything('drive_to_zero finish');
  }
  return -1;
}


/** fdirection computes vector delta_f resulting from a change of 1 in delta_f[d].
We have a unit increase in the d-th force, so delta_f[d] = 1.
The forces in NC remain zero, so delta_f[i] = 0, for i an element of NC.
For i an element of C, we adjust those forces to maintain a[i] = 0.
Essentially, we balance out the increase of the d-th force by adjusting
all the C forces (this involves a matrix equation solve).
<pre>
  Solves Acc delta_f = A[d]  to find the delta_f[i]
  which keeps delta_a[i] = 0 for all i in C, when applying delta_f[d] = 1.0.

  Let Acc = the sub-matrix of A consisting of only those rows/columns
  corresponding to contacts that are in C.
  Let A_d be the d-th column of A, but only for the rows that are in C.
  Note that d is not in C.
  Let x be delta_f, the vector of changes in force at contacts in C.
  If the force at the d-th contact is 1, then the change in acceleration
  at each element of C from that force is given by A_d.
  The total change in acceleration at each element of C is given by:
  Acc x + A_d
  Because we want this to be zero at each element of C:
  Acc x + A_d = 0
  Acc x = -A_d
  This the is matrix equation that we solve here.
</pre>
* @param {number} d  index of the contact to drive to zero acceleration
* @return {number} -1 if successful, or an error code
* @private
*/
ComputeForces.prototype.fdirection = function(d) {
  var i, j;
  goog.asserts.assert(this.n <= this.C.length);
  for (i=0; i<this.n; i++)
    this.delta_f[i] = 0;
  this.delta_f[d] = 1;
  goog.asserts.assert(!this.C[d]);
  var c = UtilEngine.countBoolean(this.C, this.n);  // number of elements in set C
  if (c>0) {
    // Acc is an augmented matrix: the last column is for vector v1
    var Acc = this.resizeMatrix(c);
    if (this.v1 == null || this.v1.length < c)
      this.v1 = UtilityCore.newNumberArray(c+10);
    var p = 0;
    for (i=0; i<this.n; i++) {
      if (this.C[i]) {
        var q = 0;
        for (j=0; j<this.n; j++)
          if (this.C[j]) {
            // Acc is the submatrix of A obtained by deleting the j-th row and
            // column of A for all j not in C
            Acc[p][q] = this.A[i][j];
            q++;
          }
        // The last column of Acc is where we put the vector v1 of the algorithm.
        // This is where the matrixSolve algorithm expects to find it.
        // v1 is the d-th column of A, but has only elements in C.
        Acc[p][c] = -this.A[i][d];
        this.v1[p] = -this.A[i][d];
        p++;
      }
    }
    var x = UtilityCore.newNumberArray(c);
    ComputeForces.copyMatrix(c, c+1, Acc, this.bMatrix);
    // this loop reduces the matrix solve tolerance until a good
    // solution is found, or the tolerance gets too small
    // ?? IS THIS TOLERANCE MODIFICATION STILL USEFUL ??  SEE ASSERT BELOW.
    var tolerance = 1E-9;
    while (true) {
      //UtilEngine.MATRIX_SOLVE_DEBUG = false;
      // note that we put v1 into the last column of Acc earlier
      var nrow = UtilityCore.newNumberArray(c);
      var error = UtilEngine.matrixSolve3(Acc, x, tolerance, nrow); // solves Acc x = v1
      if ((this.WARNINGS || this.debugCF) && goog.DEBUG) {
        var singular = UtilEngine.matrixIsSingular(Acc, c, nrow,
            this.SINGULAR_MATRIX_LIMIT);
        if (singular) {
          // This can happen because we sometimes ignore the wouldBeSingular test
          // in drive_to_zero().
          this.print('Acc is singular in fdirection d='+d);
        }
      }
      if (error != -1) {
        goog.asserts.fail();
        return -999999;
      } else {
        // check that resulting accelerations are small at each point in C
        var accelTolerance = 1E-7;
        var r = UtilEngine.matrixMultiply(this.bMatrix, x, this.v1);
        var maxError = UtilEngine.maxSize(r);
        if (maxError < accelTolerance) {
          break;
        } else {
          if ((true || this.WARNINGS || this.debugCF) && goog.DEBUG) {
            this.print(' %%% maxtrix solve error = '+NFE(maxError)
              +' not within accel tol='+NFE(accelTolerance)
              +' using solve tol='+NFE(tolerance)
              +' d='+d);
            if (0 == 1) {
              // Because we have the 'assert false' below, print everything
              // for debugging.
              UtilEngine.printMatrix2('bMatrix '+c+'x'+c, this.bMatrix, NF18, c);
              UtilEngine.printMatrix2('Acc '+c+'x'+c, Acc, NF18, c);
              UtilEngine.printArray2('v1 ', this.v1, NF18, c);
              UtilEngine.printArray2('x ', x, NF18, c);
              this.printEverything('matrix solve error', true);
            }
          }
          // This code was added because I was solving singular Acc matrices,
          // but now we avoid Acc becoming singular.
          // If this assert never happens, then I can remove this code.
          var msg = 'should not need to loosen tolerance on matrix solve';
          if (goog.DEBUG)
            this.print(msg);
          // try reducing the tolerance and solve again
          tolerance /= 10;
          ComputeForces.copyMatrix(c, c+1, this.bMatrix, Acc);
          if ((this.WARNINGS || this.debugCF) && goog.DEBUG)
            this.print('fdirection retry with tolerance '
                    +NFE(tolerance)+' d='+d);
          if (tolerance < 1E-17) {
            if ((this.WARNINGS || this.debugCF) && goog.DEBUG)
              this.print('fdirection fail:  tolerance reduced to '
                +NFE(tolerance)+' d='+d);
            break;
          }
        }
      }
    }
    // transfer x into delta_f
    p = 0;
    for (i=0; i<this.n; i++) {
      if (this.C[i])
        this.delta_f[i] = x[p++];
    }
  }
  // matrix multiply to get the resulting delta_a from a change of 1 in delta_f[d]
  // this is:  delta_a = A delta_f
  for (i=0; i<this.n; i++) {
    this.delta_a[i] = 0;
    for (j=0; j<this.n; j++)
      this.delta_a[i] += this.A[i][j]*this.delta_f[j];
  }
  return -1;
}


/** Finds the largest step of force change we can take while driving contact d to have
zero acceleration before causing a contact (other than d) to change between clamped
contacts in C and unclamped contacts in NC. If we haven't yet treated a contact, then
it is neither C nor NC.

A Joint will not limit a step because it can have positive or negative force. Step
size can be negative when d is a Joint with positive acceleration.

* @param {number} d  index of the contact we are driving to zero acceleration
* @return {number} the index of the contact that limited the step size;
      and also sets this.stepSize as a side-effect
* @private
*/
ComputeForces.prototype.maxStep = function(d) {
  var s = UtilityCore.POSITIVE_INFINITY;
  // for a Joint d with positive acceleration, need to decrease the force f[d],
  // so we will have negative step size in this case.
  if (this.joint[d] && this.a[d] > 0)
    s = UtilityCore.NEGATIVE_INFINITY;
  var j = -1;
  var i, sPrime;
  //  d is the contact whose acceleration we are trying to drive to zero.
  //  d is neither in C nor NC.
  goog.asserts.assert(!this.C[d] && !this.NC[d]);
  //  Figure the stepsize that would drive the acceleration to zero at contact d.
  if (this.joint[d]) {
    j = d;
    s = -this.a[d]/this.delta_a[d];
  } else if (this.delta_a[d] > 0) { // was 1E-14
    // The acceleration must be negative, otherwise we would not still be driving
    // it to zero.
    // It is OK if delta_a[d] is tiny, that will result in a huge step,
    // which will likely be limited by other contacts.
    goog.asserts.assert(this.a[d] < -this.SMALL_POSITIVE);
    j = d;
    s = -this.a[d]/this.delta_a[d];
  } else {
    // We want to increase the force at [d], even though it doesn’t fix
    // the negative acceleration at [d] (in fact it makes it worse because
    // delta_a[d] < 0), and so we will push at [d] enough to get some other
    // contact to flip between C/NC, and then try again.
    // Typically what happens is we take a nearly zero size step so that some
    // other contact flips between C/NC, and then after that delta_a[d] > 0.
    if (0 == 1 && Math.abs(this.delta_a[d]) > this.SMALL_POSITIVE*1000) {
      this.printContact(' large delta_a[d]', true, d, d, -1);
      this.debugCF = true;
    }
  }
  if (this.debugCF && goog.DEBUG) {
    this.print('maxStep start with d='+d+' j='+j
        +' s='+NFE(s));
    //this.printEverything('maxStep start');
  }
  // When sign = 1, we are increasing the negative a[d] to zero.
  // When sign = -1, we are decreasing the positive a[d] to zero.
  // sign is usually 1, except at Joints when it can be -1.
  var sign = s > 0 ? 1 : -1;
  // If i element of C, we can reduce the force there, but only to zero.
  // Then i will move over to NC.
  // Except a Joint has no limit on the force, positive or negative,
  // so Joints always stay in C, and never limit a step size.
  for (i=0; i<this.n; i++) {
    if (!this.joint[i] && this.C[i] && this.delta_f[i]*sign < -1E-14) {
      sPrime = -this.f[i]/this.delta_f[i];  // how much we can decrease f[i] by
      if (sPrime*sign < 0) {
        // Due to numerical inaccuracy, the force is slightly negative
        // so we take a zero size step to switch the contact from C to NC.
        if (Math.abs(this.f[i]) > 2*this.SMALL_POSITIVE) {
          this.debugCF = true;
        }
        if (this.debugCF && goog.DEBUG) {
          this.print('opposite step(1) i='+i
            +' '+NFE(sPrime)
            +' delta_f[i]='+NFE(this.delta_f[i])
            +' f[i]='+NFE(this.f[i]));
        }
        sPrime = 0;
      }
      if (this.debugCF && goog.DEBUG) {
        this.print('C['+i+'] sPrime='+NFE(sPrime));
      }
      if (sPrime*sign < s*sign) {
        // if smaller step, then adopt it as our current winner
        s = sPrime;
        j = i;
      }
    }
  }
  // If i element of NC, we can decrease the acceleration there, but only to zero.
  // Then i will move over to C.
  // For a Joint in NC, any change in acceleration pushes it into C.
  for (i=0; i<this.n; i++) {
    if (this.NC[i] && (!this.joint[i] && this.delta_a[i]*sign < -1E-14
                || this.joint[i] && Math.abs(this.delta_a[i]*sign) > 1E-14)) {
      sPrime = -this.a[i]/this.delta_a[i];  // how much we can decrease f[i] by
      if (sPrime*sign < 0) {
        // Due to numerical inaccuracy, the accel is slightly negative
        // so we take a zero size step to switch the contact from NC to C.
        // (I got -1.000075E-10 here once).
        if (Math.abs(this.a[i]) > 2*this.SMALL_POSITIVE) {
          this.debugCF = true;
          this.printContact('opposite step(2)', true, i, d, -1);
        }
        if (this.debugCF && goog.DEBUG) {
          this.print('opposite step(2) i='+i
            +' sPrime='+NFE(sPrime)
            +' delta_a[i]='+NFE(this.delta_a[i])
            +' a[i]='+NFE(this.a[i]));
        }
        sPrime = 0;
      }
      if (this.debugCF && goog.DEBUG) {
        this.print('NC['+i+'] sPrime='+NFE(sPrime));
      }
      if (sPrime*sign < s*sign) {
        s = sPrime;
        j = i;
      }
    }
  }
  if (this.debugCF && goog.DEBUG) {
    this.print('maxStep end with j='+j+' d='+d+' s='+NFE(s));
  }
  this.stepSize = s;
  return j;
}

/** For the Acc matrix formed by adding contact d into set C, returns true if that
matrix is singular. Does Gaussian Elimination on the extended Acc matrix, and if the
last row is zero at the end, then we know the matrix is singular.
* @param {number} d  index of the contact to be added to set C
* @return {boolean} true if matrix is singular after adding contact d
* @private
*/
ComputeForces.prototype.wouldBeSingular1 = function(d) {
  var i, j;
  // Set up the matrix Acc as though d is in C, and solve a sample problem but
  // only to get the matrix in upper triangular form, so that we can
  // calculate the condition number of the matrix Acc.
  goog.asserts.assert(!this.C[d]);
  var c = UtilEngine.countBoolean(this.C, this.n);  // number of elements in set C
  c = c+1;
  var Acc = this.resizeMatrix(c);
  var p = 0;
  for (i=0; i<this.n; i++) {
    if (this.C[i] || i==d) {
      var q = 0;
      for (j=0; j<this.n; j++)
        if (this.C[j] || j==d) {
          // Acc is the submatrix of A obtained by deleting the j-th row and
          // column of A for all j not in C
          Acc[p][q] = this.A[i][j];
          q++;
        }
      // The last column of Acc is where we put the vector v1 of the algorithm.
      // This is where the matrixSolve algorithm expects to find it.
      // We just put all 1's here, to avoid the algorithm complaining,
      // we don't care about this at all here.
      Acc[p][c] = 1;
      p++;
    }
  }
  var nrow = UtilityCore.newNumberArray(c);
  var x = UtilityCore.newNumberArray(c);
  var tolerance = 1E-9;
  var error = UtilEngine.matrixSolve3(Acc, x, tolerance, nrow); // solves Acc x = v1
  var isSingular = UtilEngine.matrixIsSingular(Acc, c, nrow,
      this.SINGULAR_MATRIX_LIMIT);
  if (this.debugCF && goog.DEBUG && (1 == 1 || isSingular)) {
    // print the matrix in triangular form after Gaussian Elimination
    var ncol = new Array(c+1);
    for (i=0; i<c+1; i++)
      ncol[i] = i;
    UtilEngine.printMatrixPermutation('Acc '+c+'x'+(c+1), Acc, nrow, ncol, NF7, c);
  }
  return isSingular;
}


/** For the Acc matrix formed by adding contacts d and e into set C, returns true if
that matrix is singular. Does Gaussian Elimination on the extended Acc matrix, and
if the last row is zero at the end, then we know the matrix is singular.
* @param {number} d  index of first contact to be added to set C
* @param {number} e  index of second contact to be added to set C
* @return {boolean} true if matrix is singular after adding contacts d, e
* @private
*/
ComputeForces.prototype.wouldBeSingular2 = function(d, e) {
  var i, j;
  // Set up the matrix Acc as though d and k are in C, and solve a sample problem but
  // only to get the matrix in upper triangular form, so that we can
  // calculate the condition number of the matrix Acc.
  goog.asserts.assert(!this.C[d] && !this.C[e]);
  var c = UtilEngine.countBoolean(this.C, this.n);  // number of elements in set C
  c = c+2;
  var Acc = this.resizeMatrix(c);
  var p = 0;
  for (i=0; i<this.n; i++) {
    if (this.C[i] || i==d || i==e) {
      var q = 0;
      for (j=0; j<this.n; j++)
        if (this.C[j] || j==d || j==e) {
          // Acc is the submatrix of A obtained by deleting the j-th row and
          // column of A for all j not in C
          Acc[p][q] = this.A[i][j];
          q++;
        }
      // The last column of Acc is where we put the vector v1 of the algorithm.
      // This is where the matrixSolve algorithm expects to find it.
      // We just put all 1's here, to avoid the algorithm complaining,
      // we don't care about this at all here.
      Acc[p][c] = 1;
      p++;
    }
  }
  var nrow = UtilityCore.newNumberArray(c);
  var x = UtilityCore.newNumberArray(c);
  var tolerance = 1E-9;
  var error = UtilEngine.matrixSolve3(Acc, x, tolerance, nrow); // solves Acc x = v1
  var isSingular = UtilEngine.matrixIsSingular(Acc, c, nrow,
      this.SINGULAR_MATRIX_LIMIT);
  if (this.debugCF && goog.DEBUG && (true || isSingular)) {
    // print the matrix in triangular form after Gaussian Elimination
    var ncol = new Array(c+1);
    for (i=0; i<c+1; i++)
      ncol[i] = i;
    UtilEngine.printMatrixPermutation('Acc '+c+'x'+(c+1), Acc, nrow, ncol, NF7, c);
  }
  return isSingular;
}

/**
* @param {string} s  preamble
* @param {boolean=} printMatrix
* @private
*/
ComputeForces.prototype.printEverything = function(s, printMatrix) {
  if (goog.DEBUG) {
    printMatrix = printMatrix || false;
    this.print('printEverything '+s);
    console.log('seed='+this.pRNG.getSeed());
    UtilEngine.printArray('f', this.f, NFE, this.n);
    UtilEngine.printArray('a', this.a, NFSCI, this.n);
    UtilEngine.printArray('delta_f', this.delta_f, NFE, this.n);
    //UtilEngine.printArray('delta_f[C]', this.delta_f, this.n, this.C, NFE);
    UtilEngine.printArray('delta_a', this.delta_a, NFE, this.n);
    UtilEngine.printArrayIndices('joint', this.joint, this.n);
    UtilEngine.printArrayIndices('C', this.C, this.n);
    UtilEngine.printArrayIndices('NC', this.NC, this.n);
    UtilEngine.printArrayIndices('R', this.R, this.n);
    UtilEngine.printList('reRejects', this.reRejects);
    {
      var p = new Array(this.n);
      for (var i=0; i<this.n; i++) {
        p[i] = !this.C[i] && !this.NC[i] && !this.R[i];
      }
      UtilEngine.printArrayIndices('not treated', p, this.n);
    }
    if (printMatrix) {
      UtilEngine.printMatrix2('A '+this.A.length+'x'+this.A[0].length, this.A, NFSCI);
      UtilEngine.printArray('b', this.b, NFSCI, this.n);
    }
  }
}

/**
* @param {string} s  preamble
* @param {boolean} allInfo
* @param {number} j
* @param {number} d
* @param {number} loopCtr
* @private
*/
ComputeForces.prototype.printContact = function(s, allInfo, j, d, loopCtr) {
  if (goog.DEBUG) {
    s = s+' j='+j+' N='+this.n+' step='+NFE(this.stepSize);
    if (allInfo || this.C[j])
        s += ' C['+j+']='+this.C[j]
          +' f['+j+']='+NFE(this.f[j])
          +' delta_f['+j+']='+NFE(this.delta_f[j]);
    if (allInfo || this.NC[j])
        s += ' NC['+j+']='+this.NC[j]
          +' a['+j+']='+NFE(this.a[j])
          +' delta_a['+j+']='+NFE(this.delta_a[j]);
    if (d >=0)
      s += ' d='+d+' a[d]='+NFE(this.a[d]);
    if (loopCtr >= 0)
      s += ' loopCtr='+loopCtr;
    this.print(s);
  }
}


/** Resize the aMatrix and bMatrix to be at least N x N+1.
* @param {number} N  the size to make the matrix
* @return {!Array<!Float64Array>}
* @private
*/
ComputeForces.prototype.resizeMatrix = function(N) {
  if (this.aMatrix == null || this.aMatrix.length < N) {
    // to avoid many re-allocates, bump up the size by larger increments
    N = 10 * (2 + N/10);
    this.aMatrix = new Array(N);
    this.bMatrix = new Array(N);
    for (var i=0; i<N; i++) {
      this.aMatrix[i] = new Float64Array(N+1);
      this.bMatrix[i] = new Float64Array(N+1);
    }
  }
  return this.aMatrix;
}

/** Copy matrix to pre-existing correctly sized destination matrix
* @param {number} rows  number of rows
* @param {number} cols  number of columns
* @param {!Array<!Float64Array>} m  matrix to copy
* @param {!Array<!Float64Array>} dest  destination matrix
* @private
*/
ComputeForces.copyMatrix = function(rows, cols, m, dest) {
  goog.asserts.assert(m.length >= rows);
  goog.asserts.assert(dest.length >= rows);
  for (var i=0; i<rows; i++) {
    ComputeForces.copyArray(cols, m[i], dest[i]);
  }
}

/** Copy array to pre-existing correctly sized destination array.
* @param {number} n  length of array
* @param {!Float64Array} r  array to copy, must have length >= n
* @param {!Float64Array} dest  destination array, must have length >= n
* @private
*/
ComputeForces.copyArray = function(n, r, dest) {
  goog.asserts.assert(r.length >= n);
  goog.asserts.assert(dest.length >= n);
  for (var i=0; i<n; i++) {
    dest[i] = r[i];
  }
}

/**
* @param {string} s
* @private
*/
ComputeForces.prototype.print = function(s) {
  if (goog.DEBUG) {
    console.log(this.name_+' '+NF7(this.time)+' '+s);
  }
}

}); // goog.scope
