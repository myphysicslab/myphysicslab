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

goog.provide('myphysicslab.sims.engine2D.PolygonTestApp');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.ThrusterSet');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.SixThrusters');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
var CommonControls = sims.common.CommonControls;
var ConcreteVertex = lab.engine2D.ConcreteVertex;
var ContactSim = lab.engine2D.ContactSim;
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DApp = sims.engine2D.Engine2DApp;
var GravityLaw = lab.model.GravityLaw;
var NumericControl = lab.controls.NumericControl;
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
var Polygon = lab.engine2D.Polygon;
var RigidBody = lab.engine2D.RigidBody;
var Shapes = lab.engine2D.Shapes;
var SixThrusters = sims.engine2D.SixThrusters;
const Spring = goog.module.get('myphysicslab.lab.model.Spring');
var TabLayout = sims.common.TabLayout;
var ThrusterSet = lab.engine2D.ThrusterSet;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
var Walls = lab.engine2D.Walls;

/** PolygonTestApp shows some unusual shapes such as hexagon, L-shape, hollow box with
a ball inside, and blocks with both curved and straight edges.

This app has a {@link #config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.PolygonTestApp = function(elem_ids) {
  var simRect = new DoubleRect(-4, -4, 4, 4);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  this.elasticity.setElasticity(0.8);
  this.mySim.setShowForces(false);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(3.0, this.simList);
  /** @type {number} */
  this.numBods = 8;
  /** @type {number} */
  this.thrust = 1.5;
  /** @type {!ThrusterSet} */
  this.thrust1;
  /** @type {!ThrusterSet} */
  this.thrust2;

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, PolygonTestApp.en.NUM_BODIES,
      PolygonTestApp.i18n.NUM_BODIES,
      goog.bind(this.getNumBodies, this), goog.bind(this.setNumBodies, this))
      .setDecimalPlaces(0).setLowerLimit(1).setUpperLimit(8));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, PolygonTestApp.en.THRUST,
      PolygonTestApp.i18n.THRUST,
      goog.bind(this.getThrust, this), goog.bind(this.setThrust, this)));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var PolygonTestApp = sims.engine2D.PolygonTestApp;
goog.inherits(PolygonTestApp, Engine2DApp);

/** @override */
PolygonTestApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + PolygonTestApp.superClass_.toString.call(this);
};

/** @override */
PolygonTestApp.prototype.getClassName = function() {
  return 'PolygonTestApp';
};

/** @override */
PolygonTestApp.prototype.defineNames = function(myName) {
  PolygonTestApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('PolygonTestApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
PolygonTestApp.prototype.getSubjects = function() {
  var subjects = PolygonTestApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {undefined}
*/
PolygonTestApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  var zel = Walls.make2(this.mySim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);
  /** @type {!RigidBody} */
  var p;
  if (this.numBods >= 1) {
    // rectangle with one circular edge
    p = new Polygon(PolygonTestApp.en.ROUND_CORNER, PolygonTestApp.i18n.ROUND_CORNER);
    p.startPath(new ConcreteVertex(new Vector(0, 1)));
    p.addStraightEdge(new Vector(0, 0), /*outsideIsUp=*/false);
    p.addStraightEdge(new Vector(1, 0), /*outsideIsUp=*/false);
    p.addStraightEdge(new Vector(1, 2), /*outsideIsUp=*/true);
    p.addCircularEdge(/*endPoint=*/new Vector(0, 1),
        /*center=*/new Vector(1, 1), /*clockwise=*/false,
        /*outsideIsOut=*/true);
    p.finish();
    p.setPosition(new Vector(-3.3,  0),  0);
    p.setVelocity(new Vector(0.3858,  -0.3608),  -0.3956);
    this.mySim.addBody(p);
    this.thrust2 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust2, 'left');
    this.mySim.addForceLaw(this.thrust2);
    this.displayList.findShape(p).setFillStyle('cyan').setDrawCenterOfMass(true);
  }
  if (this.numBods >= 2) {
    // small triangular pie wedge with one circular edge
    var r = 1.5;
    p = new Polygon(PolygonTestApp.en.PIE_WEDGE, PolygonTestApp.i18n.PIE_WEDGE);
    p.startPath(new ConcreteVertex(new Vector(0, 0)));
    p.addStraightEdge(new Vector(r, 0), /*outsideIsUp=*/false);
    p.addStraightEdge(new Vector(r, r), /*outsideIsUp=*/true);
    p.addCircularEdge(/*endPoint=*/new Vector(0, 0),
        /*center=*/new Vector(r, 0), /*clockwise=*/false,
        /*outsideIsOut=*/true);
    p.finish();
    p.setDragPoints([new Vector(r*0.75, r*0.25)]);
    p.setPosition(new Vector(2,  -2),  Math.PI);
    p.setVelocity(new Vector(0.26993,  -0.01696),  -0.30647);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('orange').setDrawCenterOfMass(true);
  }
  if (this.numBods >= 3) {
    p = Shapes.makeHexagon(1.0, PolygonTestApp.en.HEXAGON, PolygonTestApp.i18n.HEXAGON);
    p.setPosition(new Vector(2.867,  -0.113),  0);
    p.setVelocity(new Vector(-0.29445,  -0.11189),  -0.23464);
    this.mySim.addBody(p);
    // light green
    this.displayList.findShape(p).setFillStyle('#9f3');
  }
  if (this.numBods >= 4) {
    p = new Polygon(PolygonTestApp.en.L_SHAPE, PolygonTestApp.i18n.L_SHAPE);
    p.startPath(new ConcreteVertex(new Vector(0, 0)));
    p.addStraightEdge(new Vector(2, 0), /*outsideIsUp=*/false);
    p.addStraightEdge(new Vector(2, 0.7), /*outsideIsUp=*/true);
    p.addStraightEdge(new Vector(0.7, 0.7), /*outsideIsUp=*/true);
    p.addStraightEdge(new Vector(0.7, 2), /*outsideIsUp=*/true);
    p.addStraightEdge(new Vector(0, 2), /*outsideIsUp=*/true);
    p.addStraightEdge(new Vector(0, 0), /*outsideIsUp=*/false);
    p.finish();
    p.setCenterOfMass(0.8, 0.8);
    p.setPosition(new Vector(1,  2.5),  Math.PI-0.1);
    p.setVelocity(new Vector(-0.45535,  -0.37665),  0.36526);
    this.mySim.addBody(p);
    // hot pink
    this.displayList.findShape(p).setFillStyle('#f6c').setDrawCenterOfMass(true);
  }
  if (this.numBods >= 5) {
    p = Shapes.makeBall(1.0, PolygonTestApp.en.BALL, PolygonTestApp.i18n.BALL);
    p.setPosition(new Vector(-1, -2.5));
    //p.setPosition(new Vector(-2,  2.5),  Math.PI/2+0.1);
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#39f');
  }
  if (this.numBods >= 6) {
    p = Shapes.makeBlock(1.2, 2.8, PolygonTestApp.en.BLOCK, PolygonTestApp.i18n.BLOCK);
    p.setPosition(new Vector(0.08,  0.127),  0.888);
    this.mySim.addBody(p);
    this.thrust1 = SixThrusters.make(this.thrust, p);
    this.rbeh.setThrusters(this.thrust1, 'right');
    this.mySim.addForceLaw(this.thrust1);
    this.displayList.findShape(p).setFillStyle('#c99');
  }
  if (this.numBods >= 7) {
    p = Shapes.makeFrame(1.8, 1.2, 0.25, PolygonTestApp.en.HOLLOW_BOX,
        PolygonTestApp.i18n.HOLLOW_BOX);
    //p.setPosition(new Vector(-1, -2.5));
    p.setPosition(new Vector(-2, 2.5));
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#990');
  }
  if (this.numBods >= 8) {
    p = Shapes.makeBall(0.15, PolygonTestApp.en.BALL_IN_BOX,
        PolygonTestApp.i18n.BALL_IN_BOX);
    p.setPosition(new Vector(-2, 2.5));
    this.mySim.addBody(p);
    this.displayList.findShape(p).setFillStyle('#9cc');
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @return {number}
*/
PolygonTestApp.prototype.getNumBodies = function() {
  return this.numBods;
};

/**
* @param {number} value
*/
PolygonTestApp.prototype.setNumBodies = function(value) {
  this.numBods = value;
  this.config();
  this.broadcastParameter(PolygonTestApp.en.NUM_BODIES);
};

/**
* @return {number}
*/
PolygonTestApp.prototype.getThrust = function() {
  return this.thrust;
};

/**
* @param {number} value
*/
PolygonTestApp.prototype.setThrust = function(value) {
  this.thrust = value;
  this.thrust1.setMagnitude(value);
  this.thrust2.setMagnitude(value);
  this.broadcastParameter(PolygonTestApp.en.THRUST);
};

/** Set of internationalized strings.
@typedef {{
  NUM_BODIES: string,
  THRUST: string,
  ROUND_CORNER: string,
  PIE_WEDGE: string,
  HEXAGON: string,
  L_SHAPE: string,
  BALL: string,
  BLOCK: string,
  HOLLOW_BOX: string,
  BALL_IN_BOX: string
  }}
*/
PolygonTestApp.i18n_strings;

/**
@type {PolygonTestApp.i18n_strings}
*/
PolygonTestApp.en = {
  NUM_BODIES: 'number of objects',
  THRUST: 'thrust',
  ROUND_CORNER: 'round corner',
  PIE_WEDGE: 'pie wedge',
  HEXAGON: 'hexagon',
  L_SHAPE: 'L-shape',
  BALL: 'ball',
  BLOCK: 'block',
  HOLLOW_BOX: 'hollow box',
  BALL_IN_BOX: 'ball in box'
};

/**
@private
@type {PolygonTestApp.i18n_strings}
*/
PolygonTestApp.de_strings = {
  NUM_BODIES: 'Anzahl von Objekten',
  THRUST: 'Schubkraft',
  ROUND_CORNER: 'runde Ecke',
  PIE_WEDGE: 'Kuchenst\u00fcck',
  HEXAGON: 'Hexagon',
  L_SHAPE: 'L-Form',
  BALL: 'Ball',
  BLOCK: 'Block',
  HOLLOW_BOX: 'Hohlblock',
  BALL_IN_BOX: 'Ball im Hohlblock'
};

/** Set of internationalized strings.
@type {PolygonTestApp.i18n_strings}
*/
PolygonTestApp.i18n = goog.LOCALE === 'de' ? PolygonTestApp.de_strings :
    PolygonTestApp.en;

}); // goog.scope
