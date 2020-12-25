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

goog.module('myphysicslab.sims.engine2D.CartPendulum2App');

const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.require('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const Joint = goog.require('myphysicslab.lab.engine2D.Joint');
const JointUtil = goog.require('myphysicslab.lab.engine2D.JointUtil');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Scrim = goog.require('myphysicslab.lab.engine2D.Scrim');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/** Simulation of a cart moving on a horizontal track with a pendulum suspended from the
cart.  Intended to be similar to {@link myphysicslab.sims.pendulum.CartPendulumSim}.

This app has a {@link #configure} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------

+ ParameterNumber named `SPRING_DAMPING`, see {@link #setSpringDamping}

+ ParameterNumber named `STIFFNESS`, see {@link #setStiffness}

*/
class CartPendulum2App extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-3, -2, 3, 2);
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  this.mySim.setShowForces(false);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(/*damping=*/0, /*rotateRatio=*/0.15, this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(9.8, this.simList);
  this.elasticity.setElasticity(0.8);
  /** @type {number} */
  this.stiffness = 6;
  /** @type {number} */
  this.springDamping = 0;
  /** @type {?Spring} */
  this.spring = null;

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CartPendulum2App.en.SPRING_DAMPING,
      CartPendulum2App.i18n.SPRING_DAMPING,
     () => this.getSpringDamping(), a => this.setSpringDamping(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CartPendulum2App.en.STIFFNESS,
      CartPendulum2App.i18n.STIFFNESS,
     () => this.getStiffness(), a => this.setStiffness(a)));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.configure();
  this.graphSetup();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'CartPendulum2App';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('CartPendulum2App|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {undefined}
* @private
*/
configure() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  // wall pivot point is where in world space the pivot is
  var wallPivotX = -0.85;
  var wallPivotY = 0;
  var displacement = 0.13; //=(6.0/5.83)*0.13; initial displacement; to match other sim.

  // the cart (on track)
  var cart = Shapes.makeBlock2(0.3, 1.0, CartPendulum2App.en.CART,
      CartPendulum2App.i18n.CART);
  var pivotX = 0.5*cart.getWidth();
  var pivot1Y = 0.85*cart.getHeight();
  var pivot2Y = 0.15*cart.getHeight();
  var bodyX = 0.3*cart.getWidth(); // was 0.5
  var bodyY = 0.5*cart.getHeight();
  //cart.setDragPoints([Vector.ORIGIN]);
  this.mySim.addBody(cart);
  this.displayList.findShape(cart).setFillStyle('rgb(200,200,200)');

  // the pendulum
  var pendulum = Shapes.makePendulum(/*stickwidth=*/0.03,
      /*sticklength=*/1.0, /*radius=*/0.15, CartPendulum2App.en.PENDULUM,
      CartPendulum2App.i18n.PENDULUM);
  //pendulum.setDragPoints(
  //    [new Vector(0.5*pendulum.getWidth(), 0.15*pendulum.getHeight())]);
  //var otherBodyX = .5* pendulum.getWidth();
  //var otherBodyY = .85* pendulum.getHeight();
  this.mySim.addBody(pendulum);
  this.displayList.findShape(pendulum).setFillStyle('#B0C4DE').setDrawCenterOfMass(true);
  //this.mySim.addBody(this.mySim.getScrim());

  this.spring = new Spring('spring1',
      cart, new Vector(0.5*cart.getWidth(), 0.5*cart.getHeight()),
      Scrim.getScrim(), new Vector(3, 0),
      /*restLength=*/3.0, /*stiffness=*/this.stiffness);
  this.spring.setDamping(this.springDamping);
  this.mySim.addForceLaw(this.spring);
  this.mySim.getSimList().add(this.spring);
  this.displayList.findSpring(this.spring).setWidth(0.3);

  cart.setPosition(new Vector(1,  0),  Math.PI/2);

  // Make joints to keep the cart on the track.
  // These joints are only pushing vertically, one joint is forward,
  // the other aft on the body.
  var pivot1_body = new Vector(pivotX, pivot1Y);
  var fixed1_world = cart.bodyToWorld(pivot1_body);
  var j1 = new Joint(
    cart, pivot1_body,
    Scrim.getScrim(), fixed1_world,
    CoordType.WORLD, Vector.SOUTH
    );
  this.mySim.addConnector(j1);
  var pivot2_body = new Vector(pivotX, pivot2Y);
  var fixed2_world = cart.bodyToWorld(pivot2_body);
  var j2 = new Joint(
    cart, pivot2_body,
    Scrim.getScrim(), fixed2_world,
    CoordType.WORLD, Vector.SOUTH
    );
  this.mySim.addConnector(j2);

  // make a double joint to attach the pendulum to the cart
  JointUtil.attachRigidBody(this.mySim,
    cart,  /*attach1_body=*/new Vector(cart.getWidth()/2, cart.getHeight()/2),
    pendulum, /*attach2_body=*/new Vector(0, 1),
    /*normalType=*/CoordType.BODY
    );
  this.mySim.alignConnectors();
  // set zero energy level for cart & pendulum
  cart.setZeroEnergyLevel(cart.getPosition().getY());
  pendulum.setZeroEnergyLevel(pendulum.getPosition().getY());

  var Icm = pendulum.momentAboutCM();
  // distance from pivot to CM on the pendulum
  //var R = otherBodyY-bods[1].cmy;
  var R = 0.5;
  var r = (Icm/(pendulum.getMass() * R)) + R;
  //console.log('Icm='+Icm+' R='+R+'  r='+r);
  // parallel axis theorem: I = Icm + m R^2
  // equation of motion:  th'' = torque / rotational inertia
  // rigid body pendulum with R = length from pivot to cm has I = Icm + m R^2
  // th'' = -R m g sin th / (Icm + m R^2)
  // ideal pendulum with length r and point mass m has I = m r^2
  // th'' = -r m g sin th / (m r^2)
  // to equate these two:
  // r / (m r^2) = R / (Icm + m R^2)
  // invert and simplify:
  // m r = (Icm + m R^2) / R
  // r = (Icm / m R) + R
  R = 0.35;
  r = (Icm/(pendulum.getMass() * R)) + R;
  //console.log('or Icm='+Icm+' R='+R+'  r='+r);
  Walls.make(this.mySim, /*width=*/6, /*height=*/4, /*thickness=*/1.0);
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  this.mySim.setElasticity(elasticity);
  this.mySim.saveInitialState();
  this.clock.setTime(this.mySim.getTime());
  this.clock.setRealTime(this.mySim.getTime());
  this.easyScript.update();
};

/**
* @return {number}
*/
getSpringDamping() {
  return this.springDamping;
};

/**
* @param {number} value
*/
setSpringDamping(value) {
  if (this.springDamping != value) {
    this.springDamping = value;
    if (this.spring != null) {
      this.spring.setDamping(value);
    }
    this.broadcastParameter(CartPendulum2App.en.SPRING_DAMPING);
  }
};

/**
* @return {number}
*/
getStiffness() {
  return this.stiffness;
};

/**
* @param {number} value
*/
setStiffness(value) {
  if (this.stiffness != value) {
    this.stiffness = value;
    if (this.spring != null) {
      this.spring.setStiffness(value);
    }
    this.broadcastParameter(CartPendulum2App.en.STIFFNESS);
  }
};

/** @override */
graphSetup(body) {
  var cart = this.mySim.getBody('cart');
  var pendulum = this.mySim.getBody('pendulum');
  this.graph.line.setXVariable(cart.getVarsIndex()+0); // x position
  this.graph.line.setYVariable(pendulum.getVarsIndex()+4); // angle
  this.timeGraph.line1.setYVariable(cart.getVarsIndex()+0); // x position
  this.timeGraph.line2.setYVariable(pendulum.getVarsIndex()+4); // angle
};

} // end class

/** Set of internationalized strings.
@typedef {{
  LENGTH: string,
  SPRING_DAMPING: string,
  STIFFNESS: string,
  CART: string,
  PENDULUM: string
  }}
*/
CartPendulum2App.i18n_strings;

/**
@type {CartPendulum2App.i18n_strings}
*/
CartPendulum2App.en = {
  LENGTH: 'spring length',
  SPRING_DAMPING: 'spring damping',
  STIFFNESS: 'spring stiffness',
  CART: 'cart',
  PENDULUM: 'pendulum'
};

/**
@private
@type {CartPendulum2App.i18n_strings}
*/
CartPendulum2App.de_strings = {
  LENGTH: 'Federlänge',
  SPRING_DAMPING: 'Federdämpfung',
  STIFFNESS: 'Federsteifheit',
  CART: 'Wagen',
  PENDULUM: 'Pendel'
};

/** Set of internationalized strings.
@type {CartPendulum2App.i18n_strings}
*/
CartPendulum2App.i18n = goog.LOCALE === 'de' ? CartPendulum2App.de_strings :
    CartPendulum2App.en;

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!CartPendulum2App}
*/
function makeCartPendulum2App(elem_ids) {
  return new CartPendulum2App(elem_ids);
};
goog.exportSymbol('makeCartPendulum2App', makeCartPendulum2App);

exports = CartPendulum2App;
