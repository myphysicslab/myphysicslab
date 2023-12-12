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

import { MassObject } from '../../lab/model/MassObject.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { ThrusterSet } from '../../lab/engine2D/ThrusterSet.js';
import { Vector } from '../../lab/util/Vector.js';
import { Util } from '../../lab/util/Util.js';

/** Static class for making a ThrusterSet with six thrusters that apply force at two
points on a RigidBody. The first point is the body's drag point; the second point is at
the reflection of the drag point across the geometric center of the body. Each point
can fire thrust in 3 directions, so there is a total of 6 thrusters, which can direct
force in several directions to move or spin the body.

## Thrusters

The thrusters are numbered as follows:
```text
      ------2-------
      |            |
      0     t -----1------> thrust firing
      |            |
      |            |
      |  cm        |
      4     t2     5
      |            |
      ------3-------
```

This diagram is drawn in body coordinates. The diagram shows thruster #1 firing to
the right. All thrusters fire outwards from the body, from either of the two thruster
points, `t` or `t2`. The side thrusters have less thrust than the forward
and aft thrusters and they fire in pairs (0 and 5, or 1 and 4) to rotate the body; or in
pairs (0 and 4, 1 and 5) to move the body sideways.

In the diagram, `t` is the primary thrust point,
see {@link MassObject.setDragPoints}.
There is a second thrust point at `t2`, the mirror image of `t` through the geometric
center of the body.
*/
export class SixThrusters {

constructor() {
  throw '';
};

/** Creates a ThrusterSet with six thrusters that apply force at two points on a
RigidBody.
*/
static make(magnitude: number, body: RigidBody): ThrusterSet {
  const ts = new ThrusterSet(6, body, magnitude);
  for (let i=0; i<6; i++) {
    ts.setThruster(i, SixThrusters.getLocationBody(i, body),
        SixThrusters.getDirectionBody(i));
  }
  return ts;
};

private static getLocationBody(index: number, body: RigidBody): Vector {
  const t_body = body.getDragPoints()[0];
  if (index <= 2) {
    return t_body;
  }
  // reflect t thru centroid:
  //    t  <--- diff ----  centroid  --- (-diff) ----> t2
  const centroid_body = body.getCentroidBody();
  const diff = t_body.subtract(centroid_body);
  return centroid_body.subtract(diff);
};

private static getDirectionBody(index: number): Vector {
  if (index < 0 || index >= SixThrusters.thrustAngle.length) {
    return Vector.ORIGIN;
  }
  // side thrusters are weaker
  const tmag = (index==2 || index==3) ? 1.0 : 0.4;
  // start with thrust pointing at zero degrees, then rotate it
  return new Vector(tmag, 0).rotate(SixThrusters.thrustAngle[index]);
};

// thrust angles for upper left, upper right, up, down, lower left, lower right
static thrustAngle = [ Math.PI, 0, Math.PI/2, -Math.PI/2, Math.PI, 0 ];

} // end SixThrusters class

Util.defineGlobal('sims$engine2D$SixThrusters', SixThrusters);
