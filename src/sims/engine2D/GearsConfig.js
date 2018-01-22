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

goog.provide('myphysicslab.sims.engine2D.GearsConfig');

goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

const ConcreteVertex = goog.module.get('myphysicslab.lab.engine2D.ConcreteVertex');
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const Edge = goog.module.get('myphysicslab.lab.engine2D.Edge');
const Polygon = goog.module.get('myphysicslab.lab.engine2D.Polygon');
const RigidBody = goog.module.get('myphysicslab.lab.engine2D.RigidBody');
var Shapes = myphysicslab.lab.engine2D.Shapes;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Utility methods for making toothed gears, and setting forces on them.

@todo  add a DisplayObject for the turning force which is a big obvious arrow
* @constructor
* @final
* @struct
* @private
*/
myphysicslab.sims.engine2D.GearsConfig = function() {
  throw new Error();
};
var GearsConfig = myphysicslab.sims.engine2D.GearsConfig;

/**
* @param {number} radius
* @param {!Array<Edge>} startEdges adds to this array
*    the starting edge of the gear
* @param {string=} opt_name name of the Polygon
* @param {string=} opt_localName  localized name of the Polygon
* @return {!Polygon}
*/
GearsConfig.makeGear = function(radius, startEdges, opt_name, opt_localName) {
  var p = new Polygon(opt_name, opt_localName);
  GearsConfig.addGear(p, radius, 0.3, 36, 30, 30, startEdges);
  p.finish();
  p.setMomentAboutCM(radius*radius/2);
  return p;
};

/**  Adds a gear shape set of edges to the given Polygon.
The shape of a tooth is determined as follows. A tooth has 4 edges, which we call:
up-slope, out-edge, down-slope, and in-edge.
<pre>
    ___
   /   \
  /     \___
</pre>
Let the horizontal span be 100%, then each of the 4 tooth edges has a percentage. For
example in the above diagram, the percentages are roughly 25% each. The percentages
for the out-edge and in-edge are supplied as parameters. The remainder is split evenly
between the up-slope and down-slope.

@param {!Polygon} p the Polygon to add the gear to
@param {number} r1  the inside radius of the gear
@param {number} depth  the depth (or length) of the teeth
@param {number} numTeeth  number of teeth
@param {number} outPercent  the percentage of tooth that is extended (the out-edge)
@param {number} inPercent  the percentage of tooth that is not extended (the in-edge)
@param {!Array<Edge>} startEdges adds to this array the starting edge of the gear
*/
GearsConfig.addGear = function(p, r1, depth, numTeeth, outPercent, inPercent, startEdges) {
  // calculate the small angle fraction corresponding to each of the 4 tooth edges
  var wholeTooth = 2 * Math.PI / numTeeth;
  var upSlope = wholeTooth * (100.0 - outPercent - inPercent) / 200.0;
  var downSlope = upSlope;
  var outEdge = wholeTooth * outPercent/100.0;
  var inEdge = wholeTooth * inPercent/100.0;
  // the original inside and outside points are in_0 and out_0
  var in_0 = new Vector(r1, 0);
  var out_0 = new Vector(r1+depth, 0);
  // The current inside & outside points are in and out.
  // We rotate in_0 and out_0 to produce in and out.
  var in1 = in_0;
  p.startPath(new ConcreteVertex(new Vector(in1.getX(), in1.getY())));
  for (var i=0; i<numTeeth; i++) {
    var toothAngle = i * wholeTooth;
    // the up-slope edge, from in1 to out1
    var out1 = out_0.rotate(toothAngle + upSlope);
    var outsideIsUp;
    if (Math.abs(in1.getX() - out1.getX()) < 1e-3)
      outsideIsUp = out1.getY() > in1.getY();
    else
      outsideIsUp = in1.getX() > out1.getX();
    var e = p.addStraightEdge(out1, outsideIsUp);
    if (i==0) {
      startEdges.push(e);
    }
    // the out-edge, from out1 to out2
    var out2 = out_0.rotate(toothAngle + upSlope + outEdge);
    if (Math.abs(out2.getX() - out1.getX()) < 1e-3)
      outsideIsUp = out2.getY() > out1.getY();
    else
      outsideIsUp = out2.getX() < out1.getX();
    p.addStraightEdge(out2, outsideIsUp);
    // the down-slope edge, from out2 to in2
    var in2 = in_0.rotate(toothAngle + upSlope + outEdge + downSlope);
    if (Math.abs(out2.getX() - in2.getX()) < 1e-3)
      outsideIsUp = out2.getY() > in2.getY() ? false : true;
    else
      outsideIsUp = in2.getX() < out2.getX();
    p.addStraightEdge(in2, outsideIsUp);
    // the in-edge, from in2 to in1
    in1 = in_0.rotate(toothAngle + wholeTooth);
    if (Math.abs(in1.getX() - in2.getX()) < 1e-3)
      outsideIsUp = in1.getY() > in2.getY();
    else
      outsideIsUp = in1.getX() < in2.getX();
    p.addStraightEdge(in1, outsideIsUp);
  }
  p.closePath();
};

/** Set of internationalized strings.
@typedef {{
  LEFT_GEAR: string,
  RIGHT_GEAR: string,
  PINNED_GEARS: string,
  TURNING_FORCE: string,
  TWO_GEARS: string
  }}
*/
GearsConfig.i18n_strings;

/**
@type {GearsConfig.i18n_strings}
*/
GearsConfig.en = {
  LEFT_GEAR: 'left gear',
  RIGHT_GEAR: 'right gear',
  PINNED_GEARS: 'pinned gears',
  TURNING_FORCE: 'turning force',
  TWO_GEARS: 'two gears'
};

/**
@private
@type {GearsConfig.i18n_strings}
*/
GearsConfig.de_strings = {
  LEFT_GEAR: 'linkes Zahnrad',
  RIGHT_GEAR: 'rechtes Zahnrad',
  PINNED_GEARS: 'verstiftet Zahnr\u00e4der',
  TURNING_FORCE: 'drehende Kraft',
  TWO_GEARS: 'zwei Zahnr\u00e4der'
};

/** Set of internationalized strings.
@type {GearsConfig.i18n_strings}
*/
GearsConfig.i18n = goog.LOCALE === 'de' ? GearsConfig.de_strings :
    GearsConfig.en;

}); // goog.scope
