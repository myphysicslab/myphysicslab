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

goog.provide('myphysicslab.sims.engine2D.PendulumClockConfig');

goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.Edge');
goog.require('myphysicslab.lab.engine2D.EdgeRange');
goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.engine2D.GearsConfig');

goog.scope(function() {

const ConcreteVertex = goog.module.get('myphysicslab.lab.engine2D.ConcreteVertex');
var ContactSim = myphysicslab.lab.engine2D.ContactSim;
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const Edge = goog.module.get('myphysicslab.lab.engine2D.Edge');
const EdgeRange = goog.module.get('myphysicslab.lab.engine2D.EdgeRange');
var GearsConfig = myphysicslab.sims.engine2D.GearsConfig;
var JointUtil = myphysicslab.lab.engine2D.JointUtil;
var Polygon = myphysicslab.lab.engine2D.Polygon;
const RigidBody = goog.module.get('myphysicslab.lab.engine2D.RigidBody');
var Shapes = myphysicslab.lab.engine2D.Shapes;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');

/** Utility methods to make parts of a Pendulum Clock.

* @constructor
* @final
* @struct
*/
myphysicslab.sims.engine2D.PendulumClockConfig = function(builder) {};
var PendulumClockConfig = myphysicslab.sims.engine2D.PendulumClockConfig;


/**  Creates the anchor with pendulum that engages the escape wheel in a
pendulum clock.
@param {number} scale  determines the size of the anchor
@param {!Vector} anchorJoint where the anchor joint is in body coords of anchor
@param {number} rodLength  length of the pendulum rod
@param {number} bobRadius  radius of the round pendulum bob at end of pendulum
@param {!Array<Edge>} startEdges adds to this array the starting edge of the anchor
    and the pendulum
@return {!Polygon} the anchor Polygon
*/
PendulumClockConfig.makeAnchor = function(scale, anchorJoint, rodLength, bobRadius,
      startEdges) {
  var p = new Polygon(PendulumClockConfig.en.ANCHOR, PendulumClockConfig.i18n.ANCHOR);
  // make the anchor, which is the part that engages the escape wheel
  p.startPath(new ConcreteVertex(new Vector(61*scale, 104*scale)));
  var e = p.addStraightEdge(new Vector(8*scale, 162*scale), /*outsideIsUp=*/false);
  startEdges.push(e);
  p.addStraightEdge(new Vector(109*scale, 197*scale), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(221*scale, 146*scale), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(155*scale, 103*scale), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(159*scale, 127*scale), /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(73*scale, 141*scale), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(61*scale, 104*scale), /*outsideIsUp=*/false);
  p.closePath();
  // make the pendulum
  var width = 0.05;
  var xo = anchorJoint.getX();  // x offset for pendulum position
  var yo = anchorJoint.getY() - rodLength - bobRadius; // y offset
  p.startPath(new ConcreteVertex(new Vector(width + xo, bobRadius + yo)));
  e = p.addStraightEdge(new Vector(width + xo, rodLength+width + yo),
      /*outsideIsUp=*/true);
  startEdges.push(e);
  p.addStraightEdge(new Vector(-width + xo, rodLength+width + yo),
      /*outsideIsUp=*/true);
  p.addStraightEdge(new Vector(-width + xo, bobRadius + yo),
      /*outsideIsUp=*/false);
  p.addCircularEdge(/*endPoint=*/new Vector(width + xo, bobRadius + yo),
      /*center=*/new Vector(xo, yo), /*clockwise=*/false,
      /*outsideIsOut=*/true);
  p.closePath();
  p.finish();
  p.setCenterOfMass(xo, yo);
  p.setDragPoints([new Vector(xo, yo)]);
  var r = Math.sqrt(width*width + bobRadius*bobRadius);
  p.setMomentAboutCM(r*r/2);
  return p;
};

/**
* @param {number} scale
* @param {boolean} withGear
* @param {!Array<Edge>} startEdges adds to this array the starting edge of the escape
*    wheel and gear
* @return {!Polygon}
*/
PendulumClockConfig.makeEscapeWheel = function(scale, withGear, startEdges) {
  var p = new Polygon(PendulumClockConfig.en.ESCAPE_WHEEL,
      PendulumClockConfig.i18n.ESCAPE_WHEEL);
  var radius = 90 * scale; // inner radius
  var depth = 14 * scale; // depth of tooth
  var numTeeth = 24;  // number of teeth
  // the original inside and outside points are in_0 and out_0
  var in_0 = new Vector(radius, 0);
  var out_0 = new Vector(radius + depth, 0);
  // The current inside & outside points are in_p and out_p.
  // We rotate in_0 and out_0 to produce in_p and out_p.
  var in_p = in_0;
  var out_p = out_0;
  p.startPath(new ConcreteVertex(new Vector(in_p.getX(), in_p.getY())));
  for (var i=1; i<=numTeeth; i++) {
    // line from inside to outside
    var outsideIsUp;
    if (Math.abs(in_p.getX() - out_p.getX()) < 1e-2)
      outsideIsUp = out_p.getY() > in_p.getY();
    else
      outsideIsUp = in_p.getX() > out_p.getX();
    var e = p.addStraightEdge(out_p, outsideIsUp);
    if (i==1) {
      startEdges.push(e);
    }
    // line from outside to next (rotated) inside point
    var angle = (Math.PI * 2 * i) / numTeeth;
    in_p = in_0.rotate(angle);
    if (Math.abs(in_p.getX() - out_p.getX()) < 1e-2)
      outsideIsUp = out_p.getY() < in_p.getY();
    else
      outsideIsUp = in_p.getX() < out_p.getX();
    p.addStraightEdge(in_p, outsideIsUp);
    // rotate the outside point.
    out_p = out_0.rotate(angle);
  }
  p.closePath();
  if (withGear) {
    GearsConfig.addGear(p, /*inside radius=*/radius * 0.8, /*depth of teeth=*/0.3,
        /*numTeeth=*/36, /*outPercent=*/30, /*inPercent=*/30, startEdges);
  }
  p.finish();
  p.setCenterOfMass(0, 0);
  p.setDragPoints([new Vector(0, 2)]);
  var r = radius + depth/2;
  p.setMomentAboutCM(r*r/2);
  return p;
};


/**
* @param {!ContactSim} sim
* @param {number} pendulumLength
* @param {!Vector} center location of escape wheel center, in world coords
*/
PendulumClockConfig.makeClock = function(sim, pendulumLength, center) {
  var escapeEdges = [];
  // escape wheel is the sharp toothed gear, which drives the clock.
  var escapeWheel = PendulumClockConfig.makeEscapeWheel(/*scale=*/0.03,
      /*withGear=*/false, escapeEdges);
  escapeWheel.setPosition(center,  0);
  escapeWheel.setMass(1);
  sim.addBody(escapeWheel);
  JointUtil.attachFixedPoint(sim, escapeWheel, Vector.ORIGIN, CoordType.WORLD);

  // anchor is the rocking pendulum which regulates movement of escape wheel
  var scale = 0.03;
  var anchorJoint = new Vector(109*scale, 166*scale);
  var anchorEdges = [];
  var anchor = PendulumClockConfig.makeAnchor(scale, anchorJoint,
      /*rodLength=*/pendulumLength, /*bobRadius=*/0.6, anchorEdges);
  // anchorEdges contains start edge for anchor and pendulum
  goog.asserts.assert(anchorEdges.length >= 2);
  anchor.setMass(10);
  sim.addBody(anchor);

  // move anchor to zero energy position, and record zero energy level
  var p = center.add(new Vector(0, 4.6));
  anchor.alignTo(anchorJoint, /*p_world=*/p, /*angle=*/0);
  JointUtil.attachFixedPoint(sim, anchor, anchorJoint, CoordType.BODY);
  anchor.setZeroEnergyLevel();

  // move anchor to starting position
  anchor.alignTo(anchorJoint, /*p_world=*/p, /*angle=*/0.13);
  sim.alignConnectors();

  escapeWheel.setZeroEnergyLevel();
  // escape wheel does not interact with the pendulum, only with the anchor
  escapeWheel.setNonCollideEdge(EdgeRange.fromEdge(anchorEdges[1]));
};

/**
* @param {!ContactSim} sim
* @param {number} pendulumLength
* @param {!Vector} center location of escape wheel center, in world coords
*/
PendulumClockConfig.makeClockWithGears = function(sim, pendulumLength, center) {
  // anchor is the rocking pendulum which regulates movement of escape wheel
  var scale = 0.03;
  var anchorJoint = new Vector(109*scale, 166*scale);
  var anchorEdges = [];
  var anchor = PendulumClockConfig.makeAnchor(scale, anchorJoint, pendulumLength,
      /*bobRadius=*/0.6, anchorEdges);
  // anchorEdges contains start edges for anchor and pendulum
  goog.asserts.assert(anchorEdges.length >= 2);
  anchor.setMass(10);
  sim.addBody(anchor);
  // move anchor to zero energy position, and record zero energy level
  var p = center.add(new Vector(0, 4.6));
  anchor.alignTo(anchorJoint, /*p_world=*/p, /*angle=*/0.0);
  JointUtil.attachFixedPoint(sim, anchor, anchorJoint, CoordType.BODY);
  anchor.setZeroEnergyLevel();
  // move anchor to starting position
  anchor.alignTo(anchorJoint, /*p_world=*/p, /*angle=*/0.13);
  sim.alignConnectors();

  // gear2 is the second gear which interacts with the gears on escape wheel.
  var r = scale * 90 * 0.8;
  var gear2Edges = [];
  var gear2 = GearsConfig.makeGear(r, gear2Edges, PendulumClockConfig.en.GEAR+2,
      PendulumClockConfig.i18n.GEAR+2);
  gear2.setMass(0.5);
  var tooth = 2*Math.PI/36;
  // May 27 2013:  reduce the angle by 0.002 to avoid a crash.
  // @todo  debug the crash that occurs without that 0.002 offset.
  p = center.add(new Vector((2 * r) +0.008+0.40, 0));
  gear2.setPosition(p,  -tooth/5 - 0.002);
  // gear2 does not interact with anchor
  gear2.addNonCollide([anchor]);
  anchor.addNonCollide([gear2]);
  sim.addBody(gear2);
  JointUtil.attachFixedPoint(sim, gear2, new Vector(0, 0), CoordType.WORLD);
  gear2.setZeroEnergyLevel();

  // (add the escape wheel here to have it be in slot 2 for test)
  // escape wheel is the sharp toothed gear, which drives the clock.
  // A set of rectangular gears is added to to the escape wheel to interact
  // with the second gear.
  var escapeEdges = [];
  var escapeWheel = PendulumClockConfig.makeEscapeWheel(/*scale=*/0.03,
      /*withGear=*/true, escapeEdges);
  // escapeEdges contains start edges for escape wheel and gear
  goog.asserts.assert(escapeEdges.length >= 2);
  escapeWheel.setPosition(center,  0);
  escapeWheel.setMass(1);
  sim.addBody(escapeWheel);
  JointUtil.attachFixedPoint(sim, escapeWheel, /*attach_body=*/Vector.ORIGIN,
      /*normalType=*/CoordType.WORLD);
  escapeWheel.setZeroEnergyLevel();
  // escape wheel does not interact with the pendulum, only with the anchor
  escapeWheel.setNonCollideEdge(EdgeRange.fromEdge(anchorEdges[1]));
  // gear2 does not interact escape wheel, only with its gear
  gear2.setNonCollideEdge(EdgeRange.fromEdge(escapeEdges[0]));
  // anchor does not interact with the gear on escape wheel
  anchor.setNonCollideEdge(EdgeRange.fromEdge(escapeEdges[1]));
};

/** Set of internationalized strings.
@typedef {{
  ANCHOR: string,
  ESCAPE_WHEEL: string,
  EXTRA_BODY: string,
  PENDULUM_LENGTH: string,
  TURNING_FORCE: string,
  WITH_GEARS: string,
  GEAR: string
  }}
*/
PendulumClockConfig.i18n_strings;

/**
@type {PendulumClockConfig.i18n_strings}
*/
PendulumClockConfig.en = {
  ANCHOR: 'anchor',
  ESCAPE_WHEEL: 'escape wheel',
  EXTRA_BODY: 'extra body',
  PENDULUM_LENGTH: 'pendulum length',
  TURNING_FORCE: 'turning force',
  WITH_GEARS: 'with gears',
  GEAR: 'gear'
};

/**
@private
@type {PendulumClockConfig.i18n_strings}
*/
PendulumClockConfig.de_strings = {
  ANCHOR: 'Anker',
  ESCAPE_WHEEL: 'escape Rad',
  EXTRA_BODY: 'extra K\u00f6rper',
  PENDULUM_LENGTH: 'Pendell\u00e4nge',
  TURNING_FORCE: 'drehende Kraft',
  WITH_GEARS: 'mit Zahnr\u00e4dern',
  GEAR: 'Zahnrad'
};

/** Set of internationalized strings.
@type {PendulumClockConfig.i18n_strings}
*/
PendulumClockConfig.i18n = goog.LOCALE === 'de' ? PendulumClockConfig.de_strings :
    PendulumClockConfig.en;

}); // goog.scope
