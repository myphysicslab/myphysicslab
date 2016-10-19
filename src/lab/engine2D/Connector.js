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

goog.provide('myphysicslab.lab.engine2D.Connector');

goog.require('myphysicslab.lab.model.SimObject');

goog.scope(function() {

/** Connects RigidBody objects together or to some other object like a NumericalPath
or Scrim; creates collisions and contacts to maintain the connection.

* @interface
* @extends {myphysicslab.lab.model.SimObject}
*/
myphysicslab.lab.engine2D.Connector = function() {};

var Connector = myphysicslab.lab.engine2D.Connector;

/** Add RigidBodyCollisions for this Connector to the list of collisions as necessary.
@param {!Array<!myphysicslab.lab.engine2D.RigidBodyCollision>} collisions  the list to
    which to add the RigidBodyCollision for this Connector.
@param {number} time  simulation time when this collision is detected
@param {number} accuracy distance accuracy: how close we must be to the point of
    collision in order to be able to handle it.
*/
Connector.prototype.addCollision;

/** Aligns the RigidBodys connected by this Connector. See the documentation for the
particular Connector for how the alignment is done.

NOTE: this method only changes the position of a RigidBody, you may need to call
{@link myphysicslab.lab.engine2D.RigidBodySim#initializeFromBody} after this to update
the simulation variables.
The method {@link myphysicslab.lab.engine2D.ContactSim#alignConnectors} does the
`initializeFromBody` step automatically.

@return {undefined}
*/
Connector.prototype.align;

/** Returns the first RigidBody of the Connector.
* @return {!myphysicslab.lab.engine2D.RigidBody} the first RigidBody of the Connector
*/
Connector.prototype.getBody1;

/** Returns the second RigidBody of the Connector.
@return {!myphysicslab.lab.engine2D.RigidBody} the second RigidBody of the Connector
*/
Connector.prototype.getBody2;

/** Returns the distance between attachment points of the bodies in the direction of the
normal vector. This is equal to the dot product of the normal vector and the vector
between the two attachment points.
@return {number} normal distance between attachment points of the bodies
*/
Connector.prototype.getNormalDistance;

/** Returns the position in world coordinates of the attachment point on body1.
@return {!myphysicslab.lab.util.Vector} the position in world coordinates of the
    attachment point on body1
*/
Connector.prototype.getPosition1;

/** Returns the position in world coordinates of the attachment point on body2.
@return {!myphysicslab.lab.util.Vector} the position in world coordinates of the
    attachment point on body2
*/
Connector.prototype.getPosition2;

/** Updates the collision to reflect current state (position, velocity, etc.)
of bodies involved.
@param {!myphysicslab.lab.engine2D.RigidBodyCollision} c  the RigidBodyCollision
    to update
*/
Connector.prototype.updateCollision;

}); // goog.scope
