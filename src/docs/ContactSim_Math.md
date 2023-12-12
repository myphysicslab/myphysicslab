CSS: ./Overview_2.css
Title: ContactSim Math
HTML Header: <meta name="viewport" content="width=device-width, initial-scale=1">

[Baraff_94]: ./Baraff_Fast_Contact_Force_94.pdf

[myPhysicsLab Documentation](index.html)

# ContactSim Math

This describes details of the math involved in the class
[ContactSim](./classes/lab_engine2D_ContactSim.ContactSim.html) which is part of the
[2d Rigid Body Physics Engine](http://www.myphysicslab.com/explain/physics-engine-en.html)
of [myPhysicsLab](http://www.myphysicslab.com).

+ [Resources][]
+ [Calculate the 'A' Matrix][]
    + [Contact Force on Circular Edge][]
+ [Calculate the 'b' Vector][]
    + [Background][]
    + [Derivation][]
    + [Conclusion][]
    + [Extra Acceleration][]

# Resources

Please see [2D Physics Engine Overview](Engine2D.html) which has important
information and references.

The two main references are:

+ **Baraff '94** David Baraff,
    [Fast Contact Force Computation for Nonpenetrating Rigid Bodies.][Baraff_94]
    Computer Graphics Proceedings, Annual Conference Series, 1994; pages 23-34.

+ Erik Neumman, [Curved Edge Physics](CEP_Curved_Edge_Physics.pdf)
    about modifications to Baraff algorithm for curved edges.

Information about myPhysicsLab software in general:

+ See [myPhysicsLab Architecture](Architecture.html) for an introduction to classes
    and interfaces.
+ See [myPhysicsLab Documentation](index.html) for detailed documentation of classes and
    interfaces.
+ The [myPhysicsLab website](http://www.myphysicslab.com) shows the simulations
    running and contains explanations of the math behind them.
+ See [Building myPhysicsLab Software](Building.html) for information about building,
    testing, internationalization, and general programming issues.



# Calculate the 'A' Matrix

This section describes the math behind the private method
`ContactSim.calculate_a_matrix()`.

`ContactSim.calculate_a_matrix()` calculates the `A` matrix which
specifies how contact points react to contact forces. It returns a matrix where the
`(i, j)`th entry is how much the relative normal acceleration at contact `i` will
change from a unit force being applied at contact `j`.

For a particular contact point `i`, let the bodies be numbered 1 and 2, with body 2
specifying the normal vector pointing out from body 2 into body 1.

Let `p1` be the point on body 1 that is in contact with the point `p2` on body 2.

Let `di` be the distance between `p1` and `p2`.

Because the bodies are in resting contact, it should be the case that `di = 0` (within
numerical tolerance).

Resting contact also implies that the velocity of separation should be `di' = 0`
(otherwise, the bodies are moving apart).

However, the acceleration `di''` is likely to be non-zero.  If `di'' > 0`, then the
bodies are about to separate, and the reaction force should be zero.
If `di'' &lt; 0`, then the bodies are accelerating into each other, and a reaction force
is needed to prevent them from interpenetrating.

We need to find reaction forces that will just barely ensure that `di'' = 0`.

This method calculates the `A` matrix in the equation `a = A f + b`. The `i-j`-th entry
in the `A` matrix, `Aij`, specifies how the `j`-th contact force, `fj`, affects the
acceleration of the `i`-th contact distance, `ai = di''`. Our goal is to find this
expression for `di''` (Equation D-1 of the [Baraff '94 paper][Baraff_94])

    (D-1)  di'' = Ai1 f1 + Ai2 f2 + ... + Ain fn + bi

where `bi` is from the `b` vector which specifies external forces (gravity, thrust,
etc.).

A contact force `fj` only affects `di''` if that contact force operates on body 1 or
body 2. If that is not the case, we have the `Aij = 0`. Assume now that `fj` affects
body 1 or body 2. We can find `Aij` from the geometry of the situation as follows.

Let `Nj` be the vector normal at the `j`-th contact point. Then the contact force is `fj
Nj` (note that `fj` is a scalar). From the geometry we can calculate the effect of the
force on `p1''` and `p2''`. (Keep in mind that the reaction force is equal and opposite
for the two bodies.) The effect on `di''` is given by equation D-2 of the
[Baraff '94 paper][Baraff_94]:

    (D-2)   di'' = Ni.(p1'' - p2'') + 2 Ni'.(p1' - p2')

The term `2 Ni'.(p1' - p2')` "is a velocity dependent term (i.e. you can immediately
calculate it without knowing the forces involved), and is part of `bi`". See method
`calculate_b_vector`. So the `fj` dependent part of (D-2) is just

    Ni.(p1'' - p2'').

Here is a quick derivation of equation (D-3) based on section C.3 of
the [Baraff '94 paper][Baraff_94].

    Let p(t) be the world space coordinates of a point on a rigid body.
    Let R(t) be the vector from center of mass to p(t)
    Let X(t) be the center of mass
    Let V(t) be velocity of center of mass
    Let w(t) be the angular velocity (about the CM) of the rigid body
    Then p(t) = X(t) + R(t)

Taking derivatives:

    p'(t) = X'(t) + R'(t) = V(t) + w(t) x R(t)

Here we use the knowledge that `R(t)` is only changing by rotation at a rate of `w(t)`.
An elementary calculus result then gives the result that `R'(t) = w(t) x R(t)`.
(See derivation of `Ni'` in `calculate_b_vector` which shows the calculus steps).
Taking another derivative:

    p''(t) = V'(t) + w'(t) x R(t) + w(t) x R'(t)
        = V'(t) + w'(t) x R(t) + w(t) x (w(t) x R(t))

(Baraff's derivation in section C.3 is slightly more elaborate, and I don't
entirely understand why its necessary).

Two cases to consider here: whether the force is acting on body 1 or body 2.
Suppose `fj` is acting on body 1.  Then `fj` will contribute to `p1''`.
(Otherwise if `fj` is acting on body 2, then `fj` will contribute to `p2''`.)

NEED: Derivation of following equation D-3.

Equation D-3 of the [Baraff '94 paper][Baraff_94] gives an expression for `p1''`

    (D-3)  p1'' = v1' + w1' x R1 + w1 x (w1 x R1)

where

    v1 = linear velocity of center of mass of body 1,
    w1 = angular velocity of body 1
    R1 = vector from center of mass to point of contact p1

The term `w1 x (w1 x R1)` is velocity dependent, so it goes into the `b` vector.
The `fj` dependent part of (D-3) is therefore

    p1'' = v1' + w1' x R1

Because `v1'` is the linear acceleration of body 1, we have by Newton's First Law

    v1' = (total force on body 1)/ m1

where `m1` = mass of body 1.  Therefore the the force `fj Nj `contributes

    (D-4)  fj Nj / m1

to `v1'`.

Next we find the term `w1' x R1` in (D-3).  Equation C-10 of
the [Baraff '94 paper][Baraff_94] gives `w1'` as

    (C-10)  w1' = I1^-1 (t1 + L1 x w1)

where

    I1 = the rotational inertia (about what axis? CM?  is it a vector?)
    t1 = torque,
    L1 = angular momentum.

I think that `I1` is a scalar quantity, so I don't know why he uses `I1^-1` instead of
dividing by `I1`. Additionally, the `L1` vector is also perpendicular to the plane in
2D, as is `w1`, so `L1 x w1 = 0`. (In 3D, this could be non-zero, but it would go into
the `b` vector since it is velocity dependent). So we are left with simply:

    w1' = t1 / I1

To find `t1`, suppose that the `j`-th contact occurs at the point `pj`, and the vector
`Rj` goes from center of mass of object 1 to `pj`. Then the force `fj Nj` contributes a
torque of

    Rj x fj Nj

So (C-10) becomes

    w1' = (Rj x fj Nj) / I1

and we can write the `fj` dependent part of (D-3) as

    p1'' = fj Nj / m1 + (Rj x fj Nj) x R1 / I1
       = fj (Nj / m1 + (Rj x Nj) x R1 / I1

and the `fj` dependent part of (D-2) is

    di'' = fj Ni.(Nj / m1 + (Rj x Nj) x R1 / I1)

Therefore from (D-1) we can see that the `fj` dependent part, which is `Aij`, is:

    Aij = Ni.(Nj / m1 + (Rj x Nj) x R1 / I1)

Next, we expand express the vector cross product `(Rj x Nj) x R1`, to help with
writing the computer code. All these vectors lie in the plane initially.

    Rj x Nj = [0, 0, Rjx Njy - Rjy Njx]
    (Rj x Nj) x R1 = [0, 0, Rjx Njy - Rjy Njx] x [R1x, R1y, 0]
    = (Rjx Njy - Rjy Njx) [-R1y, R1x, 0]

Then we can expand the dot product:

    Aij = Nix (Njx / m1 + (Rjx Njy - Rjy Njx)(-R1y) / I1) +
        Niy (Njy / m1 + (Rjx Njy - Rjy Njx) R1x / I1)

Keep in mind that this is only the effect of `fj` on `p1''`. The complete picture is
given in equation (D-2) above, so there can be a contribution from `p2''` to `Aij` as
well.

The above assumed that `Nj` pointed out of body 2 into body 1, that body 2 is the
"normal object". Actually this can vary for each contact. In the `j`-th contact, it
could be that body 1 is the "normal object" and therefore `Nj` points out of body 1
into some other body. In that case we need to use `-fj Nj` as the force in the above
analysis.

The above assumed that `fj` was affecting body 1.  If `fj` is affecting body 2, then
the analysis is identical except the effect is on `p2''`.  Note that `p2` has a negative
sign in equation D-2, so we need to multiply the resulting `Aij` by -1.
And of course you use `m2` instead of `m1`, `I2` instead of `I1`, `R2` instead of `R1`.

So there are four cases, which we list with the overall factor needed for each case.
(The factor is determined by the sign on `fj` and the sign of `p1` or `p2` in equation
D-2).

    fj affects body 1
      body 1 is primary object in contact j -->  fj affects p1  --> +1
      body 1 is normal object in contact j -->  -fj affects p1 --> -1

    fj affects body 2
      body 2 is primary object in contact j -->  fj affects p2  --> -1
      body 2 is normal object in contact j -->  -fj affects p2 --> +1

Terminology: "primary" object just means it is the non-normal object in the contact, it
is the object whose corner is colliding. See the fields of
[RigidBodyCollision](./classes/lab_engine2D_RigidBody.RigidBodyCollision.html) object.

Note that in the case where `fj` affects both bodies 1 and 2 (which happens for
the contact force at the contact point) then `Aij` is the sum of these two.



## Contact Force on CircularEdge

For CircularEdge, there are some other differences when calculating the
`b`-vector, but here the only difference is we use the `U` vector instead of the
`R` vector.

The `U` vector is from center of mass to the center of the
circular edge.  See the [Curved Edge Physics paper](CEP_Curved_Edge_Physics.pdf),
where we define the gap in terms
of not the two points at the contact, but instead by the center of the circle
and one of the contact points.  The center of the circle on body 2 is at

    C2(t) = X2(t) + U2(t).

The point of contact on the other body 1 is at

    P1(t) = X1(t) + R1(t).

From the Curved Edge Physics paper, the gap is `N . (P1 - C2)`. We then take
derivatives, and the result involves `U2`.

Another fact about using `U` vector vs. `R` vector:  When calculating the effect
of a force `F` at the contact in producing torque `T`, we have a calculation that is
like

    T = F x R

It turns out that this is the same when substituting `U`:

    T = F x R = F x U

It has to do with both `R` and `U` being on the line of the normal thru the contact
point.  See docs for
[RigidBodyCollision](./classes/lab_engine2D_RigidBody.RigidBodyCollision.html)
for a diagram and explanation; the section
is called "Equivalence of Using R or U Vector For Normal Velocity".



# Calculate the 'b' Vector

This section describes the math behind the method `ContactSim.calculate_b_vector()`
which calculates the `b` vector which specifies how external forces (like gravity,
thrust, etc) affect acceleration of contact points.

## Background

In `calculate_a_matrix`, we found for `di''` the parts that were dependent on the
contact forces `fi`. Here we find the part of `di''` that is independent of the `fi`'s,
such as gravity, thrust, rubber band force, and damping. For the purposes of calculating
the contact forces we regard these forces as "constant" (at this moment in time) in the
matrix equation `a = A f + b`.

These "constant" or "external" forces are put into the `b` vector, so that we can then
solve the matrix equation `a = A f + b`, subject to the constraints that `f >= 0`,
`a >= 0`, and `f.a = 0`. Those constraints say that reaction forces can only push
things apart, that objects cannot interpenetrate, and that if objects are separating
then there is no reaction force.

## Derivation

We start with the expression for  `di''` = the acceleration of the distance between
the contact points `p1, p2`.  This was derived above as:

    (D-2)   di'' = Ni.(p1'' - p2'') + 2 Ni'.(p1' - p2')

The term `Ni.(p1'' - p2'')` involves accelerations and therefore forces, so we need
to include the effect of any forces other than the reaction forces on the accelerations
of the contact points `p1` and `p2`.  We will examine each of those forces (such as
gravity) and determine through the geometry of the situation how the force affects the
acceleration of each contact point.

The term `2 Ni'.(p1' - p2')` is dependent only on current velocity, not acceleration,
and therefore is independent of any forces being applied, and therefore belongs
in the `b` vector.

### Derivation of `Ni'`

    Ni = (Nix, Niy, 0)

The vector `Ni` is rotating at a rate `w`.  If we ignore any acceleration, we could
write the vector `Ni` as a function of time like this:

    Ni = |Ni| (cos wt, sin wt, 0)

Where

    |Ni| is the magnitude of the vector Ni
    w = angular velocity
    t = time

For some particular value of time `t`, this will be equal to `(Nix, Niy, 0)`.
Now elementary calculus gives us the derivative:

    Ni' = |Ni| (-w sin wt, w cos wt, 0)

And we can recognize that this is equivalent to:

    Ni' = w (-Niy, Nix, 0)

Because we picked the value of `t` such that `Nix = |Ni| cos wt`,
and `Niy = |Ni| sin wt`. Note that this can also be expressed as a cross product of two
vectors:

    Ni' = W x Ni

where we treat angular velocity as a vector `W` with components `(0, 0, w)`.

### Derivation of `p1'`

This is the velocity of a particular point, `p1`, on the object.  The object is
translating and rotating.  The translation is given by the velocity of the center of
mass, `V = (Vx, Vy, 0)`, and the rotation is given by the angular velocity `w`.

    Let R be the vector from the center of mass to the point.
    Let X be the vector from the origin to the center of mass of the object.
    Let V be the velocity of the center of mass, so that V = X'.
    Let W be the angular velocity of the object, in 2D we have W = (0, 0, w).

Then the point `p1` is given by

    p1 = X + R

Taking derivatives, we get

    p1' = X' + R' = V + W x R

where we used the vector cross product method of finding R' (see above derivation
of Ni').  This then expands to

    p1' = (Vx, Vy, 0) + w (-Ry, Rx, 0)
    p1' = (Vx - w Ry, Vy + w Rx, 0)

### Expansion of `2 Ni'.(p1' - p2')`

To bring together the entire expression `2 Ni'.(p1' - p2')` we need to recognize
that each body has its own angular velocity w.  The w used in calculating `Ni'`
is that of the "normal" object, which is always body 2 in our scheme, or `w2`.
Here is the complete expansion using subscripts 1 and 2 to refer to body 1 or 2
of the contact.

    2 Ni'.(p1' - p2')
    = 2 w2 (-Niy, Nix, 0) . ((V1x - w1 R1y, V1y + w1 R1x, 0)
      - (V2x - w2 R2y, V2y + w2 R2x, 0))
    = 2 w2 (-Niy (V1x - w1 R1y - V2x + w2 R2y) +  Nix (V1y + w1 R1x - V2y - w2 R2x)
      +  0)

### External forces in `Ni.(p1'' - p2'')`

Next we examine the "external" forces (all forces other than the contact forces
we are trying to solve for) and determine their contribution to the acceleration
of the separation of the contact points.  As explained above, these show up in
the term Ni.(p1'' - p2'').

Equation D-3 of the [Baraff '94 paper][Baraff_94] gives an expression for `p1''`

    (D-3)  p1'' = v1' + w1' x R1 + w1 x (w1 x R1)

(this magic needs to be elucidated)
where

    v1' = acceleration of center of mass
    w1 = angular velocity
    w1' = angular acceleration (= torque? I think not!)
    R1 = vector from CM to contact point p1

The corresponding expression for `p2''` is

    p2'' = v2' + w2' x R2 + w2 x (w2 x R2)

It turns out that the external forces have already been calculated for us by
the earlier processes (see `evaluate` method of RigidBodySim class).  In the change
variable we get passed in the current values for `x'', y'', th''`.
These accelerations are the result of all the external forces such as gravity,
thrust, rubber bands, damping.  They operate on each object regardless of the
contact forces that are applied.  So we only have to plug these in to
the above equations.

    Ni.(p1'' - p2'') =
    Ni.( (v1' + w1' x R1 + w1 x (w1 x R1)) - (v2' + w2' x R2 + w2 x (w2 x R2)))

We can expand the above as follows.  (Keep in mind that we regard `w'` and `w`
as vectors perpendicular to the plane for purposes of vector cross products.)

    w' x R = (-w' Ry, w' Rx, 0)
    w x (w x R) = (-w^2 Rx, -w^2 Ry, 0)
    V' + w' x R + w x (w x R) = (Vx -w^2 Rx - w' Ry, Vy - w^2 Ry + w' Rx, 0)

## Conclusion

We now have the expansions of the two terms in equation (D-2).
This gives for each contact i, the contribution to the acceleration
which we add to `b[i]`.  Keep in mind that for each contact, the RigidBodyCollision
object figures out for us:  which is body 1 (the "primary" object whose corner is
in contact), which is body 2 (the "normal" object whose edge determines the normal
vector), and the normal vector `Ni`.


## Extra Acceleration

Extra acceleration is added to eliminate velocity at contact. See ExtraAccel enum for
explanations of the various options.

See the paper [Curved Edge Physics ](CEP_Curved_Edge_Physics.pdf) which explains the
math involved in extra acceleration for curved edges.

This is a major new (as of Oct 2011) experimental change to contact handling
policy. Add extra acceleration at contacts to offset the residual velocity. Turn off
the “small zero elasticity impacts at every contact on every time step” policy (in
CollisionSim.advance). Why? Because in the “resting state”, we continue to get lots
of impacts happening resulting in a lot of undesirable wiggling jiggling of objects
that should be at rest.

The underlying scenario in many "resting contact" situations is this:

1. fire an impulse at contact A to eliminate negative velocity there; this
     results in some positive velocity at another contact B.

2. the small positive velocity at contact B leads eventually to a momentary loss of
    contact there

3. contact B then “falls” back into contact with negative velocity leading to the
    cycle starting over again.

In this way you get an oscillation of impulses at contact A, then at contact B, then at
contact A, etc.

The canonical example is a long block (size 1 x 3) resting on the ground in vertical
position. With no extra acceleration, you see the above scenario of a continuous cycle
of a collision happening every couple seconds, alternating between the two corners on
the ground. (When the block rests in horizontal position, then this doesn't happen.)

The new idea is to *not* use impact impulse to correct the negative velocity at
contacts. Instead we request some *additional acceleration* at contacts with negative
velocity, by adding to the `b`-vector. Also, we request a little less acceleration at
contacts with positive velocity so that they stay in contact.

How the amount of extra acceleration is calculated: We want an amount of
acceleration `a` which over a single time step `h` will reduce the normal velocity
`v` to zero. Assume constant acceleration. Change in velocity over timestep `h` is

    ∆v = (v - 0) = integral(a dt) = a h.

Therefore we get `a = -v / h`.

&nbsp;

&nbsp;
