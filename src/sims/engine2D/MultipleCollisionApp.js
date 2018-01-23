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

goog.provide('myphysicslab.sims.engine2D.MultipleCollisionApp');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.CollisionHandling');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBodySim');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const CheckBoxControl = goog.module.get('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.module.get('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
const CollisionHandling = goog.module.get('myphysicslab.lab.engine2D.CollisionHandling');
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DApp = sims.engine2D.Engine2DApp;
var JointUtil = lab.engine2D.JointUtil;
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const ParameterString = goog.module.get('myphysicslab.lab.util.ParameterString');
const Polygon = goog.module.get('myphysicslab.lab.engine2D.Polygon');
const RigidBodySim = goog.module.get('myphysicslab.lab.engine2D.RigidBodySim');
const Shapes = goog.module.get('myphysicslab.lab.engine2D.Shapes');
var TabLayout = sims.common.TabLayout;
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
const Walls = goog.module.get('myphysicslab.lab.engine2D.Walls');

/** Demonstrates that collision handling policies produce different results.

+ One Hits Two:  two stationary blocks in resting contact;  one block hits them

+ Two Hit One:  central block is stationary;  2 blocks come in from left and right
    to hit it.  See Physics-Based Animation chapter 6.2 'Multiple Points of Collision'
    by Erleben, et. al, which describes this scenario. This should result in an
    infinite loop for the serial collision handler, and it would except for some
    'panic mode' error handling that occurs.

+ One Hits Two On Wall:  two stationary blocks in resting contact against wall;
    one block hits them.

+ Two On Wall: row of two balls in contact with each other and a wall; only the ball
     touching the wall is moving (colliding into the wall).

to do:  another to add:  1x3 block on ground, lying horizontally, pick up one corner
      (so the other corner still in contact) and let go.  With simultaneous solver,
      the corner in contact stays in contact (unrealistic).  With hybrid or serial
      it alternates which corner is bouncing.

This app has a {@link #config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {string=} opt_name name of this as a Subject
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
myphysicslab.sims.engine2D.MultipleCollisionApp = function(elem_ids, opt_name) {
  /** @type {number} */
  this.space_half_width = 6;
  /** @type {number} */
  this.space_half_height = 2;
  var w = this.space_half_width;
  var h = this.space_half_height;
  var simRect = new DoubleRect(-w, -h, w, h);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance, opt_name);
  this.layout.simCanvas.setBackground('black');
  this.mySim.setCollisionHandling(CollisionHandling.SERIAL_GROUPED_LASTPASS);
  this.elasticity.setElasticity(1.0);
  this.mySim.setShowForces(true);
  //this.advance.setDebugLevel(CollisionAdvance.DebugLevel.OPTIMAL);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(/*damping=*/0, /*rotateRatio=*/0.15,
      this.simList);
  /** @type {string} */
  this.shape = MultipleCollisionApp.Shape.SQUARE;
  /** @type {number} */
  this.offset = 0;
  /** @type {number} */
  this.angle = 0;
  /** @type {number} */
  this.speed = 3;
  var choices = [ MultipleCollisionApp.i18n.ONE_HITS_TWO,
      MultipleCollisionApp.i18n.ONE_HITS_THREE,
      MultipleCollisionApp.i18n.ONE_HITS_TWO_SEPARATE,
      MultipleCollisionApp.i18n.ONE_HITS_ONE_ON_WALL,
      MultipleCollisionApp.i18n.ONE_HITS_TWO_ON_WALL,
      MultipleCollisionApp.i18n.TWO_HIT_ONE,
      MultipleCollisionApp.i18n.TWO_HIT_ONE_ASYMMETRIC,
      MultipleCollisionApp.i18n.ONE_HITS_ONE,
      MultipleCollisionApp.i18n.ONE_HITS_ONE_ASYMMETRIC,
      MultipleCollisionApp.i18n.ONE_HITS_WALL,
      MultipleCollisionApp.i18n.ONE_HITS_CHAIN,
      MultipleCollisionApp.i18n.ONE_HITS_CHAIN_PLUS_ONE,
      MultipleCollisionApp.i18n.TWO_IN_BOX,
      MultipleCollisionApp.i18n.ONE_HITS_TWO_IN_BOX,
      MultipleCollisionApp.i18n.TWO_ON_WALL
    ];
  /** @type {!Array<string>} */
  this.formations = [ MultipleCollisionApp.en.ONE_HITS_TWO,
      MultipleCollisionApp.en.ONE_HITS_THREE,
      MultipleCollisionApp.en.ONE_HITS_TWO_SEPARATE,
      MultipleCollisionApp.en.ONE_HITS_ONE_ON_WALL,
      MultipleCollisionApp.en.ONE_HITS_TWO_ON_WALL,
      MultipleCollisionApp.en.TWO_HIT_ONE,
      MultipleCollisionApp.en.TWO_HIT_ONE_ASYMMETRIC,
      MultipleCollisionApp.en.ONE_HITS_ONE,
      MultipleCollisionApp.en.ONE_HITS_ONE_ASYMMETRIC,
      MultipleCollisionApp.en.ONE_HITS_WALL,
      MultipleCollisionApp.en.ONE_HITS_CHAIN,
      MultipleCollisionApp.en.ONE_HITS_CHAIN_PLUS_ONE,
      MultipleCollisionApp.en.TWO_IN_BOX,
      MultipleCollisionApp.en.ONE_HITS_TWO_IN_BOX,
      MultipleCollisionApp.en.TWO_ON_WALL
    ];
  this.formations = goog.array.map(this.formations, function(v) {
        return Util.toName(v);
      });
  /** @type {string} */
  this.formation = this.formations[0];

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  /** @type {!ParameterString} */
  var ps;
  this.addParameter(ps = new ParameterString(this, MultipleCollisionApp.en.FORMATION,
      MultipleCollisionApp.i18n.FORMATION,
      goog.bind(this.getFormation, this),
      goog.bind(this.setFormation, this), choices, this.formations));
  this.addControl(new ChoiceControl(ps));

  this.addParameter(ps = new ParameterString(this, MultipleCollisionApp.en.SHAPE,
      MultipleCollisionApp.i18n.SHAPE,
      goog.bind(this.getShape, this), goog.bind(this.setShape, this),
      [ MultipleCollisionApp.i18n.SQUARE, MultipleCollisionApp.i18n.CIRCLE ],
      [ MultipleCollisionApp.Shape.SQUARE, MultipleCollisionApp.Shape.CIRCLE ]));
  this.addControl(new ChoiceControl(ps));

  this.addParameter(pn = new ParameterNumber(this, MultipleCollisionApp.en.OFFSET,
      MultipleCollisionApp.i18n.OFFSET,
      goog.bind(this.getOffset, this), goog.bind(this.setOffset, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MultipleCollisionApp.en.ANGLE,
      MultipleCollisionApp.i18n.ANGLE,
      goog.bind(this.getAngle, this), goog.bind(this.setAngle, this)));
  pn.setLowerLimit(Util.NEGATIVE_INFINITY);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MultipleCollisionApp.en.SPEED,
      MultipleCollisionApp.i18n.SPEED,
      goog.bind(this.getSpeed, this), goog.bind(this.setSpeed, this)));
  this.addControl(new NumericControl(pn));

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  ps = this.mySim.getParameterString(RigidBodySim.en.COLLISION_HANDLING);
  this.addControl(new ChoiceControl(ps));

  //ps = this.mySim.getParameterString(RigidBodySim.en.EXTRA_ACCEL);
  //this.addControl(new ChoiceControl(ps));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var MultipleCollisionApp = myphysicslab.sims.engine2D.MultipleCollisionApp;
goog.inherits(MultipleCollisionApp, Engine2DApp);

/** @override */
MultipleCollisionApp.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', formation: '+this.formation
      +', shape: '+this.shape
      +', angle: '+Util.NF(this.angle)
      +', offset: '+Util.NF(this.offset)
      +', speed: '+Util.NF(this.speed)
      + MultipleCollisionApp.superClass_.toString.call(this);
};

/** @override */
MultipleCollisionApp.prototype.getClassName = function() {
  return 'MultipleCollisionApp';
};


/**
* @enum {string}
*/
MultipleCollisionApp.Shape = {
  SQUARE: 'SQUARE',
  CIRCLE: 'CIRCLE'
};

/** @override */
MultipleCollisionApp.prototype.defineNames = function(myName) {
  MultipleCollisionApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('dampingLaw',
       myName+'.');
  this.terminal.addRegex('MultipleCollisionApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
MultipleCollisionApp.prototype.getSubjects = function() {
  var subjects = MultipleCollisionApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, subjects);
};

/**
* @return {!Polygon}
* @private
*/
MultipleCollisionApp.prototype.makePuck = function() {
  if (this.shape == MultipleCollisionApp.Shape.SQUARE) {
    return Shapes.makeBlock(1, 1);
  } else if (this.shape == MultipleCollisionApp.Shape.CIRCLE) {
    return Shapes.makeBall(0.5);
  } else {
    throw new Error('unknown shape');
  }
};

/** Add body to simulation, setting color based on mass.  Heavier body will
* have darker color.
* @param {!Polygon} body
* @private
*/
MultipleCollisionApp.prototype.addBody = function(body) {
  var c = MultipleCollisionApp.massToColor(body.getMass());
  this.mySim.addBody(body);
  this.displayList.findShape(body).setFillStyle(c).setDrawCenterOfMass(true);
};

/** Returns dark color for heavier mass, light color for light mass.

    mass log10(mass)  rgb
    0.1    -1         229
    1.0     0         186
    10      1         143
    100     2         100

This translates to equation:

    rgb = 100 + 43 (-log10(mass) + 2)

* @param {number} mass
* @return {string} color corresponding to mass
*/
MultipleCollisionApp.massToColor = function(mass) {
  var logm = Math.LOG10E * Math.log((mass));
  if (logm < -1) {
    logm = -1;
  } else if (logm > 2) {
    logm = 2;
  }
  var rgb = Math.floor(0.5 + 100 + 43 * (-logm + 2));
  var s = rgb.toString();
  return 'rgb('+s+','+s+','+s+')';
};

/**
* @return {undefined}
* @private
*/
MultipleCollisionApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  var distTol = this.mySim.getDistanceTol();
  var body, body1, body2, body3, body4;
  var idx = goog.array.indexOf(this.formations, this.formation);
  switch (idx) {

    case 0: //ONE_HITS_TWO:
      body = this.makePuck();
      body.setPosition(new Vector(-5,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(0,  0));
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(1 + distTol/2 + this.offset,  0));
      this.addBody(body);
      break;

    case 1: //ONE_HITS_THREE:
      body = this.makePuck();
      body.setPosition(new Vector(-5,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(-1 - distTol/2 + this.offset,  0));
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(0,  0));
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(1 + distTol/2 + this.offset,  0));
      this.addBody(body);
      break;

    case 2: //ONE_HITS_TWO_SEPARATE:
      body = Shapes.makeBlock(1, 3);
      body.setMass(2);
      body.setPosition(new Vector(-5,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(0,  1),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(0,  -1),  0);
      this.addBody(body);
      break;

    case 3: //ONE_HITS_ONE_ON_WALL:
      body = this.makePuck();
      body.setMass(1000);
      body.setPosition(new Vector(0,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(this.space_half_width - 0.5 - distTol/2,  0),  0);
      this.addBody(body);
      break;

    case 4: //ONE_HITS_TWO_ON_WALL:
      body = this.makePuck();
      body.setPosition(new Vector(0,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(this.space_half_width - 1.5 - distTol,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(this.space_half_width - 0.5 - distTol/2,  0),  0);
      this.addBody(body);
      break;

    case 5: //TWO_HIT_ONE:
      body = this.makePuck();
      body.setPosition(new Vector(-5,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(0,  0));
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(5,  0),  this.angle);
      body.setVelocity(new Vector(-this.speed,  0),  0);
      this.addBody(body);
      break;

    case 6: //TWO_HIT_ONE_ASYMMETRIC:
      /* Here is why we need to add distTol/2 to starting position of body1:
       * The collision happens when the blocks are distTol/2 apart, so the distance
       * travelled is slightly less than you would expect.
       * Suppose distTol = 0.01; and distTol/2 = 0.005.
       * body2.left = 0.5;  body3.right = 2.5; body3 travels 2.5 - 0.5 - 0.005 = 1.995
       * If body1 starts at -5, it travels a distance of 3.995 which is more than
       * twice the distance that body3 travels, so it arrives after body3 collision.
       * To have them collide at the same moment:
       * Since body1 travels at twice the speed, it should travel 1.995 * 2 = 3.99
       * Therefore body1.right = body2.left - 0.005 - 3.99 = -4.495
       * Therefore body1.center = -4.995 = -5 + distTol/2
       */
      body = this.makePuck();
      body.setPosition(new Vector(-5 + distTol/2,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(0,  0));
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(3,  0));
      body.setVelocity(new Vector(-this.speed/2,  0),  0);
      this.addBody(body);
      break;

    case 7: //ONE_HITS_ONE:
      body = this.makePuck();
      body.setPosition(new Vector(-5,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(0,  0));
      this.addBody(body);
      break;

    case 8: //ONE_HITS_ONE_ASYMMETRIC:
      body = this.makePuck();
      body.setPosition(new Vector(-5,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(2.75,  0));
      body.setVelocity(new Vector(-this.speed/2,  0),  0);
      this.addBody(body);
      break;

    case 9: //ONE_HITS_WALL:
      body = this.makePuck();
      body.setPosition(new Vector(0,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);
      break;

    case 11: //ONE_HITS_CHAIN_PLUS_ONE:
      body = this.makePuck();
      body.setMass(2);
      body.setPosition(new Vector(1 + distTol/2,  0));
      this.addBody(body);
      // ***** INTENTIONAL FALL-THRU ******

    case 10: //ONE_HITS_CHAIN:
      body = this.makePuck();
      body.setMass(2);
      body.setPosition(new Vector(-5,  0),  this.angle);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);

      body3 = Shapes.makeBlock(2, 1);
      body3.setPosition(new Vector(-0.5,  0));
      body3.setMass(1.5);
      this.addBody(body3);

      body2 = Shapes.makeBlock(2, 1);
      body2.setPosition(new Vector(-2,  0));
      body2.setMass(0.5);
      this.mySim.addBody(body2);
      this.displayList.findShape(body2).setFillStyle('rgb(240,240,240)')

      JointUtil.attachRigidBody(this.mySim,
        body2, /*attach_body1=*/new Vector(0.75, 0),
        body3, /*attach_body2=*/new Vector(-0.75, 0),
        /*normalType=*/CoordType.BODY
        );
      this.mySim.alignConnectors();
      break;

    case 12: //TWO_IN_BOX:
      body = Shapes.makeFrame(/*width=*/2 + 3*distTol/2 + 0.2,
          /*height=*/1 + 2*distTol/2 + 0.2, /*thickness=*/0.2);
      body.setPosition(new Vector(0,  0));
      this.addBody(body);

      body = Shapes.makeBall(0.5 - this.offset/2);
      body.setPosition(new Vector(-0.5-distTol/4,  0));
      this.addBody(body);

      body = Shapes.makeBall(0.5 - this.offset/2);
      body.setPosition(new Vector(0.5+distTol/4,  0));
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);
      break;

    case 13: //ONE_HITS_TWO_IN_BOX:
      body1 = Shapes.makeFrame(/*width=*/2 + 3*distTol/2 + 0.2,
          /*height=*/1 + 2*distTol/2 + 0.2, /*thickness=*/0.2);
      body1.setPosition(new Vector(0,  0));
      this.addBody(body1);

      body2 = Shapes.makeBall(0.5 - this.offset/2);
      body2.setPosition(new Vector(-0.5-distTol/4,  0));
      this.addBody(body2);

      body3 = Shapes.makeBall(0.5 - this.offset/2);
      body3.setPosition(new Vector(0.5+distTol/4,  0));
      this.addBody(body3);

      body4 = Shapes.makeBall(0.5);
      body4.setPosition(new Vector(-5,  0));
      body4.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body4);
      break;

    case 14: //TWO_ON_WALL:
      body = this.makePuck();
      body.setMass(1);
      body.setPosition(new Vector(this.space_half_width - 1.5 - distTol,  0),  0);
      this.addBody(body);

      body = this.makePuck();
      body.setPosition(new Vector(this.space_half_width - 0.5 - distTol/2,  0),  0);
      body.setVelocity(new Vector(this.speed,  0),  0);
      this.addBody(body);
      break;

    default:
      throw new Error();
  }

  Walls.make(this.mySim, 2*this.space_half_width, 2*this.space_half_height,
      /*thickness=*/1.0);

  this.mySim.setElasticity(elasticity);
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(this.mySim.getTime());
  this.clock.setRealTime(this.mySim.getTime());
  this.easyScript.update();
};

/**
* @return {string}
*/
MultipleCollisionApp.prototype.getFormation = function() {
  return this.formation;
};

/**
* @param {string} value
*/
MultipleCollisionApp.prototype.setFormation = function(value) {
  value = Util.toName(value);
  if (this.formation != value) {
    if (!goog.array.contains(this.formations, value)) {
      throw new Error('unknown formation: '+value);
    }
    this.formation = value;
    this.config();
    this.broadcastParameter(MultipleCollisionApp.en.FORMATION);
  }
};

/**
* @return {number}
*/
MultipleCollisionApp.prototype.getOffset = function() {
  return this.offset;
};

/**
* @param {number} value
*/
MultipleCollisionApp.prototype.setOffset = function(value) {
  this.offset = value;
  this.config();
  this.broadcastParameter(MultipleCollisionApp.en.OFFSET);
};

/**
* @return {number}
*/
MultipleCollisionApp.prototype.getSpeed = function() {
  return this.speed;
};

/**
* @param {number} value
*/
MultipleCollisionApp.prototype.setSpeed = function(value) {
  this.speed = value;
  this.config();
  this.broadcastParameter(MultipleCollisionApp.en.SPEED);
};

/**
* @return {number}
*/
MultipleCollisionApp.prototype.getAngle = function() {
  return this.angle;
};

/**
* @param {number} value
*/
MultipleCollisionApp.prototype.setAngle = function(value) {
  this.angle = value;
  this.config();
  this.broadcastParameter(MultipleCollisionApp.en.ANGLE);
};

/**
* @return {string}
*/
MultipleCollisionApp.prototype.getShape = function() {
  return this.shape;
};

/**
* @param {string} value
*/
MultipleCollisionApp.prototype.setShape = function(value) {
  value = Util.toName(value);
  if (this.shape != value) {
    this.shape = value;
    this.config();
    this.broadcastParameter(MultipleCollisionApp.en.SHAPE);
  }
};

/** Set of internationalized strings.
@typedef {{
  FORMATION: string,
  ONE_HITS_THREE: string,
  ONE_HITS_TWO: string,
  TWO_HIT_ONE: string,
  ONE_HITS_ONE_ON_WALL: string,
  ONE_HITS_TWO_ON_WALL: string,
  ONE_HITS_TWO_SEPARATE: string,
  TWO_HIT_ONE_ASYMMETRIC: string,
  ONE_HITS_ONE: string,
  ONE_HITS_ONE_ASYMMETRIC: string,
  ONE_HITS_WALL: string,
  ONE_HITS_CHAIN: string,
  ONE_HITS_CHAIN_PLUS_ONE: string,
  TWO_IN_BOX: string,
  ONE_HITS_TWO_IN_BOX: string,
  TWO_ON_WALL: string,
  ANGLE: string,
  SHAPE: string,
  CIRCLE: string,
  SQUARE: string,
  OFFSET: string,
  PUCK_TYPE: string,
  SPEED: string,
  MASS: string
  }}
*/
MultipleCollisionApp.i18n_strings;

/**
@type {MultipleCollisionApp.i18n_strings}
*/
MultipleCollisionApp.en = {
  FORMATION: 'formation',
  ONE_HITS_THREE: 'one hits three',
  ONE_HITS_TWO: 'one hits two',
  TWO_HIT_ONE: 'two hit one',
  ONE_HITS_ONE_ON_WALL: 'one hits one on wall',
  ONE_HITS_TWO_ON_WALL: 'one hits two on wall',
  ONE_HITS_TWO_SEPARATE: 'one hits two separate',
  TWO_HIT_ONE_ASYMMETRIC: 'two hit one asymmetric',
  ONE_HITS_ONE: 'one hits one',
  ONE_HITS_ONE_ASYMMETRIC: 'one hits one asymmetric',
  ONE_HITS_WALL: 'one hits wall',
  ONE_HITS_CHAIN: 'one hits chain',
  ONE_HITS_CHAIN_PLUS_ONE: 'one hits chain plus one',
  TWO_IN_BOX: 'two in box',
  ONE_HITS_TWO_IN_BOX: 'one hits two in box',
  TWO_ON_WALL: 'two on wall',
  ANGLE: 'angle',
  SHAPE: 'shape',
  CIRCLE: 'circle',
  SQUARE: 'square',
  OFFSET: 'offset',
  PUCK_TYPE: 'puck type',
  SPEED: 'speed',
  MASS: 'mass'
};

/**
@private
@type {MultipleCollisionApp.i18n_strings}
*/
MultipleCollisionApp.de_strings = {
  FORMATION: 'Formation',
  ONE_HITS_THREE: 'eins schl\u00e4gt drei',
  ONE_HITS_TWO: 'eins schl\u00e4gt zwei',
  TWO_HIT_ONE: 'zwei schlagen eins',
  ONE_HITS_ONE_ON_WALL: 'eins schl\u00e4gt eins an einer Mauer',
  ONE_HITS_TWO_ON_WALL: 'eins schl\u00e4gt zwei an einer Mauer',
  ONE_HITS_TWO_SEPARATE: 'eins schl\u00e4gt zwei getrennt',
  TWO_HIT_ONE_ASYMMETRIC: 'zwei schlagen eins asymmetrisch',
  ONE_HITS_ONE: 'eins schl\u00e4gt eins',
  ONE_HITS_ONE_ASYMMETRIC: 'eins schl\u00e4gt eins asymmetrisch',
  ONE_HITS_WALL: 'eins schl\u00e4gt eine Mauer',
  ONE_HITS_CHAIN: 'eins schl\u00e4gt eine Kette',
  ONE_HITS_CHAIN_PLUS_ONE: 'eins schl\u00e4gt eine Kette+1',
  TWO_IN_BOX: 'zwei in einer Schachtel',
  ONE_HITS_TWO_IN_BOX: 'eins schl\u00e4gt zwei in einer Schachtel',
  TWO_ON_WALL: 'zwei an der Mauer',
  ANGLE: 'Winkel',
  SHAPE: 'Form',
  CIRCLE: 'Kreis',
  SQUARE: 'Quadrat',
  OFFSET: 'Abstand',
  PUCK_TYPE: 'Scheiben Typ',
  SPEED: 'Geschwindigkeit',
  MASS: 'Masse'
};


/** Set of internationalized strings.
@type {MultipleCollisionApp.i18n_strings}
*/
MultipleCollisionApp.i18n = goog.LOCALE === 'de' ? MultipleCollisionApp.de_strings :
    MultipleCollisionApp.en;

}); // goog.scope
