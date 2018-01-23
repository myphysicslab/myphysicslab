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

goog.provide('myphysicslab.sims.engine2D.SixThrusters');

goog.require('goog.array');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.ThrusterSet');
goog.require('myphysicslab.lab.model.MassObject');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

const MassObject = goog.module.get('myphysicslab.lab.model.MassObject');
const Polygon = goog.module.get('myphysicslab.lab.engine2D.Polygon');
const ThrusterSet = goog.module.get('myphysicslab.lab.engine2D.ThrusterSet');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Creates a ThrusterSet with six thrusters that apply force at two points on a
Polygon. The first point is the body's drag point; the second point is at the
reflection of the drag point across the geometric center of the body. Each point can
fire thrust in 3 directions, so there is a total of 6 thrusters, which can direct force
in several directions to move or spin the body.

Note: private constructor ensures no instances are made.

## Thrusters

The thrusters are numbered as follows:
<pre>
      ------2-------
      |            |
      0     t -----1------> thrust firing
      |            |
      |            |
      |  cm        |
      4     t2     5
      |            |
      ------3-------
</pre>

This diagram is drawn in body coordinates. The diagram shows thruster #1 firing to
the right. All thrusters fire outwards from the body, from either of the two thruster
points, `t` or `t2`. The side thrusters have less thrust than the forward
and aft thrusters and they fire in pairs (0 and 5, or 1 and 4) to rotate the body; or in
pairs (0 and 4, 1 and 5) to move the body sideways.

In the diagram, `t` is the primary thrust point, see {@link MassObject#setDragPoints}.
There is second thrust point at `t2`, the mirror image of `t` through the geometric
center of the body.

* @constructor
* @final
* @struct
* @private
*/
myphysicslab.sims.engine2D.SixThrusters = function() {
  throw new Error();
};
var SixThrusters = myphysicslab.sims.engine2D.SixThrusters;

/**
* @type {!Array<number>}
* @private
*/
SixThrusters.thrustAngle = new Array(6);
SixThrusters.thrustAngle[0] = Math.PI; // upper left
SixThrusters.thrustAngle[1] = 0; // upper right
SixThrusters.thrustAngle[2] = Math.PI/2; // up
SixThrusters.thrustAngle[3] = -Math.PI/2; // down
SixThrusters.thrustAngle[4] = Math.PI; // lower left
SixThrusters.thrustAngle[5] = 0; // lower right

/** Creates a ThrusterSet with six thrusters that apply force at two points on a
Polygon.
* @param {number} magnitude
* @param {!Polygon} body
* @return {!ThrusterSet}
*/
SixThrusters.make = function(magnitude, body) {
  var ts = new ThrusterSet(6, body, magnitude);
  for (var i=0; i<6; i++) {
    ts.setThruster(i, SixThrusters.getLocationBody(i, body),
        SixThrusters.getDirectionBody(i, body));
  }
  return ts;
};

/**
* @param {number} index
* @param {!Polygon} body
* @return {!Vector}
* @private
*/
SixThrusters.getLocationBody = function(index, body) {
  var t_body = body.getDragPoints()[0];
  if (index <= 2)
    return t_body;
  // reflect t thru centroid:
  //    t  <--- diff ----  centroid  --- (-diff) ----> t2
  var centroid_body = body.getCentroidBody();
  var diff = t_body.subtract(centroid_body);
  return centroid_body.subtract(diff);
};

/**
* @param {number} index
* @param {!Polygon} body
* @return {!Vector}
* @private
*/
SixThrusters.getDirectionBody = function(index, body) {
  if (index < 0 || index >= SixThrusters.thrustAngle.length)
    return Vector.ORIGIN;
  // side thrusters are weaker
  var tmag = (index==2 || index==3) ? 1.0 : 0.4;
  // start with thrust pointing at zero degrees, then rotate it
  return new Vector(tmag, 0).rotate(SixThrusters.thrustAngle[index]);
};

}); // goog.scope
