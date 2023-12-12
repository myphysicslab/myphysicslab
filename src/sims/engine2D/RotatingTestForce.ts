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

import { CoordType } from '../../lab/model/CoordType.js';
import { Force } from '../../lab/model/Force.js';
import { ForceLaw } from '../../lab/model/ForceLaw.js';
import { MassObject } from "../../lab/model/MassObject.js"
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { RigidBodySim } from '../../lab/engine2D/RigidBodySim.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** A ForceLaw that creates a Force whose direction rotates continuously.
*/
export class RotatingTestForce implements ForceLaw {
  private sim_: RigidBodySim;
  private body_: RigidBody;
  private location_body_: Vector;
  private magnitude_: number;
  private rotation_rate_: number;

/**
* @param sim
* @param body
* @param location_body
* @param magnitude
* @param rotation_rate
*/
constructor(sim: RigidBodySim, body: RigidBody, location_body: Vector, magnitude: number, rotation_rate: number) {
  this.sim_ = sim;
  this.body_ = body;
  this.location_body_ = location_body;
  this.magnitude_ = magnitude;
  this.rotation_rate_ = rotation_rate;
};

/** @inheritDoc */
toString() {
  return 'RotatingTestForce{body: "'+this.body_.getName()+'"}';
};

/** @inheritDoc */
toStringShort() {
  return 'RotatingTestForce{body: "'+this.body_.getName()+'"}';
};

/** @inheritDoc */
disconnect(): void {
};

/** @inheritDoc */
getBodies(): MassObject[] {
  return [this.body_];
};

/** @inheritDoc */
calculateForces(): Force[] {
  const t = this.rotation_rate_ * this.sim_.getTime();
  const direction_body = new Vector(this.magnitude_*Math.cos(t),
    this.magnitude_*Math.sin(t));
  const f = new Force('rotating', this.body_,
      /*location=*/this.location_body_, CoordType.BODY,
      /*direction=*/direction_body, CoordType.BODY);
  return [f];
};

/** @inheritDoc */
getPotentialEnergy(): number {
  return 0;
};

} // end class

Util.defineGlobal('sims$engine2D$RotatingTestForce', RotatingTestForce);
