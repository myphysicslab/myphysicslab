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

import { ConnectorCollision } from './ConnectorCollision.js';
import { CoordType } from '../model/CoordType.js';
import { DoubleRect } from '../util/DoubleRect.js';
import { SimObject, AbstractSimObject } from '../model/SimObject.js';
import { RigidBody } from './RigidBody.js';
import { RigidBodyCollision, Connector } from './RigidBody.js';
import { Scrim } from './Scrim.js';
import { UtilEngine } from './UtilEngine.js';
import { Util } from '../util/Util.js';
import { Vector } from '../util/Vector.js';

/** A Joint connects two RigidBodys by generating RigidBodyCollisions which are
used to find contact forces or collision impulses so that the attachment points on the
two RigidBodys are kept aligned together.

The {@link Joint.addCollision} method is where the ***collisions are generated***; that
method is called from {@link lab/engine2D/ContactSim.ContactSim.findCollisions}.
The RigidBodyCollision generated for a Joint functions as both a collision and a
contact.

Joints are ***immutable***: they cannot be changed after they are constructed.

When two RigidBodys are connected by a Joint,
the two bodies are set to ***not collide*** with each other
via {@link RigidBody.addNonCollide}.

The ***order of the bodies*** in the Joint is important because {@link Joint.align}
moves the *second body* to align with first body (unless the second body is immoveable
because it has infinite mass).

The ***normal vector*** provided when making a Joint specifies the direction along which
the Joint operates. ContactSim calculates forces to keep the acceleration in the normal
direction at zero between the two attachment points of the Joint.

A ***single joint*** by itself will give a 'sliding track' type of connection. The
attachment points must have zero distance between them as measured in the direction of
the normal for the Joint, but in the direction perpendicular to the normal the
attachment points are free to move. See CartPendulum2 for an example.

A ***double joint*** consists of two Joints at the same location (same attachment
points) with perpendicular normal directions. A double joint is needed to keep the
attachment points aligned together.

Over time ***slippage*** of a Joint can occur, especially when there is fast rotation of
the bodies. The ***tightness*** of a Joint is measured by how close to zero is the
distance between the two attachment points. See {@link Joint.getNormalDistance}.

To attach to a ***fixed position in space*** use the {@link Scrim}
object. Or attach to an immoveable (infinite mass) Polygon.

The two attachment points can be widely separated in 'single joints',
see CartPendulum2 for an example.

Another name for a joint is a *bilateral contact point* meaning that it can both push
and pull. This is different from ordinary contact points between bodies which can only
push against each other.

### Specifying a Joint's Normal Vector

When specifying a normal, we also specify the {@link CoordType},
which is either world coordinates or body coordinates. There are two cases:

+ `CoordType.WORLD` the normal is in world coordinates and is fixed.

+ `CoordType.BODY` The normal is calculated in the body coordinates of the *second*
RigidBody of the Joint, and rotates along with that body.

(need to convert from Java) ***TO BE DONE*** To make a Joint with a NumericalPath use
  PathJoint. In that case it is the NumericalPath that determines the normal.

### Aligning Joints

The {@link Joint.align} method aligns the RigidBodys connected by this Joint. Moves the
second body to align with the first body (unless the second body has infinite mass, in
which case the first body is aligned to the second). The second body is moved so that
its attach point is at same position as the first body's attach point. The angle of the
second body is not changed.

### Implementation Note: Separate Impact Points

Each side of the Joint has its own impact point and `R` vector; these are `impact,
impact2, R` and `R2`. We figure the impact point on each body according to where the
attachment point is on that body, by doing a `bodyToWorld` translation to find the
current location.

Previously we calculated the impact point only for `body1` of the joint and
then used that world location to calculate the `R2` for the normal body. It seems
that gives worse results, as shown by the 'two-connected-blocks' test where two blocks
are connected rigidly by 2 double joints. When the two-connected-blocks is spun quickly,
the joints slip significantly if we use the impact point of `body1` to define
where the joint is on `body2`.

**TO DO** should there be an option to have the normal attached to body1 instead of
body2? It is confusing now because the 'body coords normal' is attached to body2 if it
exists, otherwise it is attached to body1. This probably is because of how
RigidBodyCollision follows this policy.

*/
export class Joint extends AbstractSimObject implements SimObject, Connector {
  /** first body of the joint */
  private body1_: RigidBody;
  /** second body of the joint */
  private body2_: RigidBody;
  /** attachment point in body coords for body1 */
  private attach1_body_: Vector;
  /** attachment point in body coords for body2 */
  private attach2_body_: Vector;
  /**  the normal direction. */
  private normal_: Vector;
  /** whether the normal is in body coords and moves with the body,
  * or is in fixed world coords
  */
  private normalType_: CoordType;

/**
@param rigidBody1 the first body of the Joint
@param attach1_body the attachment point on the first body in body coordinates
@param rigidBody2 the second body of the Joint
@param attach2_body the attachment point on the second body
@param normalType  whether the normal is in world coordinates or body coordinates
    of `rigidBody2`
@param normal this Joint's normal vector in world coordinates or body coordinates
    of `rigidBody2`
*/
constructor(rigidBody1: RigidBody, attach1_body: Vector, rigidBody2: RigidBody, attach2_body: Vector, normalType: CoordType, normal: Vector) {
  super('JOINT'+(Joint.nextJointNum++));
  this.body1_ = rigidBody1;
  this.body2_ = rigidBody2;
  this.attach1_body_ = attach1_body;
  this.attach2_body_ = attach2_body;
  rigidBody1.addNonCollide([rigidBody2]);
  rigidBody2.addNonCollide([rigidBody1]);
  this.normal_ = normal;
  this.normalType_ = normalType;
};

/** @inheritDoc */
override toString() {
  return super.toString().slice(0, -1)
      +', body1_: '+this.body1_.toStringShort()
      +', attach1_body_: '+this.attach1_body_
      +', body2_: '+this.body2_.toStringShort()
      +', attach2_body_: '+this.attach2_body_
      +', normalType_: '+this.normalType_
      +', normal_: '+this.normal_
      +', normalDistance: '+Util.NF7(this.getNormalDistance())
      +'}';
};

/** @inheritDoc */
getClassName() {
  return 'Joint';
};

/** @inheritDoc */
addCollision(collisions: RigidBodyCollision[], time: number, _accuracy: number): void {
  const c = new ConnectorCollision(this.body1_, this.body2_, this, /*joint=*/true);
  this.updateCollision(c);
  c.setDetectedTime(time);
  /*if (0 == 1 && Util.DEBUG && UtilEngine.debugEngine2D != null) {
    UtilEngine.debugEngine2D.myPrint('joint collision '+c);
    // show the normal vector at the joint
    UtilEngine.debugEngine2D.debugLine('normal', c.impact1, c.impact1.add(c.normal));
    UtilEngine.debugEngine2D.myPrint('joint dist='+Util.NFE(c.distance)
      +' normalVelocity='+Util.NFE(c.getNormalVelocity())+' '+c);
    if (Math.abs(c.distance) > 1E-12)
      UtilEngine.debugEngine2D.myPrint('joint '+this.getName()
        +' is loose dist='+Util.NFE(c.distance)+' '+c);
  }*/
  collisions.unshift(c);
};

/** @inheritDoc */
align(): void {
  if (isFinite(this.body2_.getMass())) {
    this.body2_.alignTo(/*p_body=*/this.attach2_body_,
        /*p_world=*/this.body1_.bodyToWorld(this.attach1_body_));
  } else if (isFinite(this.body1_.getMass())) {
    this.body1_.alignTo(/*p_body=*/this.attach1_body_,
        /*p_world=*/this.body2_.bodyToWorld(this.attach2_body_));
  }
};

/** Returns the attachment point on the first body in body coordinates.
@return the attachment point on the first body in body coordinates
*/
getAttach1(): Vector {
  return this.attach1_body_;
};

/** Returns the attachment point on the second body in body coordinates.
@return the attachment point on the second body in body coordinates
*/
getAttach2(): Vector {
  return this.attach2_body_;
};

/** @inheritDoc */
getBody1(): RigidBody {
  return this.body1_;
};

/** @inheritDoc */
getBody2(): RigidBody {
  return this.body2_;
};

/** @inheritDoc */
getBoundsWorld(): DoubleRect {
  return DoubleRect.make(this.getPosition1(), this.getPosition2());
};

/** Returns this Joint's unit normal vector, in body or world coordinates according
to `getNormalType`.  If in body coordinates it is relative to body2.
@return this Joint's normal vector, in body or world coordinates
*/
getNormal(): Vector {
  return this.normal_;
};

/** @inheritDoc */
getNormalDistance(): number {
  const collisions: RigidBodyCollision[] = [];
  this.addCollision(collisions, /*time=*/NaN, /*accuracy=*/NaN);
  return collisions[0].getDistance();
};

/** Whether the normal vector is in body or world coordinates.
* @return whether the normal returned by {@link Joint.getNormal} is
*    in body or world coordinates.
*/
getNormalType(): CoordType {
  return this.normalType_;
};

/** Returns this Joint's unit normal vector in world coordinates.
@return this Joint's normal vector, in world coordinates
*/
getNormalWorld(): Vector {
  if (this.normalType_==CoordType.WORLD) {
    return this.normal_;
  } else {
    return this.body2_.rotateBodyToWorld(this.normal_);
  }
};

/** @inheritDoc */
getPosition1(): Vector {
  return this.body1_.bodyToWorld(this.attach1_body_);
};

/** @inheritDoc */
getPosition2(): Vector {
  return this.body2_.bodyToWorld(this.attach2_body_);
};

/** @inheritDoc */
updateCollision(c: RigidBodyCollision): void{
  if (c.primaryBody != this.body1_ || c.normalBody != this.body2_)
    throw '';
  if (c.getConnector() != this)
    throw '';
  const impact_world = this.body1_.bodyToWorld(this.attach1_body_);
  c.impact1 = impact_world;
  c.normalFixed = this.normalType_ == CoordType.WORLD;
  const normal_world = this.getNormalWorld();
  Util.assert( Math.abs(normal_world.lengthSquared() - 1.0) < 1E-10 );
  c.impact2 = this.body2_.bodyToWorld(this.attach2_body_);
  c.normal = normal_world;
  // offset = how far apart the joint is, ideally zero
  Util.assert(c.impact2 != null );
  const offset = c.impact1.subtract(c.impact2);
  c.distance = normal_world.dotProduct(offset);
  c.creator = 'Joint';
};

static nextJointNum = 0;

} // end Joint class

Util.defineGlobal('lab$engine2D$Joint', Joint);
