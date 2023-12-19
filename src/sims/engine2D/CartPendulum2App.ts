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

import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { Joint } from '../../lab/engine2D/Joint.js';
import { JointUtil } from '../../lab/engine2D/JointUtil.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { GenericObserver, ParameterString, ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Spring } from '../../lab/model/Spring.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/** Simulation of a cart moving on a horizontal track with a pendulum suspended from the
cart.  Intended to be similar to {@link sims/pendulum/CartPendulumSim.CartPendulumSim}.

This app has a {@link CartPendulum2App.configure} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------

+ ParameterNumber named `SPRING_DAMPING`, see {@link CartPendulum2App.setSpringDamping}

+ ParameterNumber named `STIFFNESS`, see {@link CartPendulum2App.setStiffness}

*/
export class CartPendulum2App extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  stiffness: number = 6;
  springDamping: number = 0;
  spring: null|Spring = null;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-3, -2, 3, 2);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.sim.setShowForces(false);
  this.dampingLaw = new DampingLaw(/*damping=*/0, /*rotateRatio=*/0.15, this.simList);
  this.gravityLaw = new GravityLaw(9.8, this.simList);
  this.elasticity.setElasticity(0.8);

  this.addPlaybackControls();
  let pn: ParameterNumber;
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

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'CartPendulum2App';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ContactSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
private configure(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.advance.reset();
  // wall pivot point is where in world space the pivot is
  const wallPivotX = -0.85;
  const wallPivotY = 0;
  const displacement = 0.13; //=(6.0/5.83)*0.13; initial displacement; to match other sim.

  // the cart (on track)
  const cart = Shapes.makeBlock2(0.3, 1.0, CartPendulum2App.en.CART,
      CartPendulum2App.i18n.CART);
  const pivotX = 0.5*cart.getWidth();
  const pivot1Y = 0.85*cart.getHeight();
  const pivot2Y = 0.15*cart.getHeight();
  const bodyX = 0.3*cart.getWidth(); // was 0.5
  const bodyY = 0.5*cart.getHeight();
  //cart.setDragPoints([Vector.ORIGIN]);
  this.sim.addBody(cart);
  this.displayList.findShape(cart).setFillStyle('rgb(200,200,200)');

  // the pendulum
  const pendulum = Shapes.makePendulum(/*stickwidth=*/0.03,
      /*sticklength=*/1.0, /*radius=*/0.15, CartPendulum2App.en.PENDULUM,
      CartPendulum2App.i18n.PENDULUM);
  //pendulum.setDragPoints(
  //    [new Vector(0.5*pendulum.getWidth(), 0.15*pendulum.getHeight())]);
  //const otherBodyX = .5* pendulum.getWidth();
  //const otherBodyY = .85* pendulum.getHeight();
  this.sim.addBody(pendulum);
  let ds = this.displayList.findShape(pendulum);
  ds.setFillStyle('#B0C4DE');
  ds.setDrawCenterOfMass(true);
  //this.sim.addBody(this.sim.getScrim());

  this.spring = new Spring('spring1',
      cart, new Vector(0.5*cart.getWidth(), 0.5*cart.getHeight()),
      Scrim.getScrim(), new Vector(3, 0),
      /*restLength=*/3.0, /*stiffness=*/this.stiffness);
  this.spring.setDamping(this.springDamping);
  this.sim.addForceLaw(this.spring);
  this.sim.getSimList().add(this.spring);
  let dspr = this.displayList.findSpring(this.spring);
  dspr.setWidth(0.3);

  cart.setPosition(new Vector(1,  0),  Math.PI/2);

  // Make joints to keep the cart on the track.
  // These joints are only pushing vertically, one joint is forward,
  // the other aft on the body.
  const pivot1_body = new Vector(pivotX, pivot1Y);
  const fixed1_world = cart.bodyToWorld(pivot1_body);
  const j1 = new Joint(
    cart, pivot1_body,
    Scrim.getScrim(), fixed1_world,
    CoordType.WORLD, Vector.SOUTH
    );
  this.sim.addConnector(j1);
  const pivot2_body = new Vector(pivotX, pivot2Y);
  const fixed2_world = cart.bodyToWorld(pivot2_body);
  const j2 = new Joint(
    cart, pivot2_body,
    Scrim.getScrim(), fixed2_world,
    CoordType.WORLD, Vector.SOUTH
    );
  this.sim.addConnector(j2);

  // make a double joint to attach the pendulum to the cart
  JointUtil.attachRigidBody(this.sim,
    cart,  /*attach1_body=*/new Vector(cart.getWidth()/2, cart.getHeight()/2),
    pendulum, /*attach2_body=*/new Vector(0, 1),
    /*normalType=*/CoordType.BODY
    );
  this.sim.alignConnectors();
  // set zero energy level for cart & pendulum
  cart.setZeroEnergyLevel(cart.getPosition().getY());
  pendulum.setZeroEnergyLevel(pendulum.getPosition().getY());

  const Icm = pendulum.momentAboutCM();
  // distance from pivot to CM on the pendulum
  //const R = otherBodyY-bods[1].cmy;
  let R = 0.5;
  let r = (Icm/(pendulum.getMass() * R)) + R;
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
  Walls.make(this.sim, /*width=*/6, /*height=*/4, /*thickness=*/1.0);
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  this.sim.setElasticity(elasticity);
  this.sim.saveInitialState();
  this.clock.setTime(this.sim.getTime());
  this.clock.setRealTime(this.sim.getTime());
  this.easyScript.update();
};

/**
*/
getSpringDamping(): number {
  return this.springDamping;
};

/**
* @param value
*/
setSpringDamping(value: number) {
  if (this.springDamping != value) {
    this.springDamping = value;
    if (this.spring != null) {
      this.spring.setDamping(value);
    }
    this.broadcastParameter(CartPendulum2App.en.SPRING_DAMPING);
  }
};

/**
*/
getStiffness(): number {
  return this.stiffness;
};

/**
* @param value
*/
setStiffness(value: number) {
  if (this.stiffness != value) {
    this.stiffness = value;
    if (this.spring != null) {
      this.spring.setStiffness(value);
    }
    this.broadcastParameter(CartPendulum2App.en.STIFFNESS);
  }
};

/** @inheritDoc */
override graphSetup(_body?: RigidBody): void {
  const cart = this.sim.getBody('cart');
  const pendulum = this.sim.getBody('pendulum');
  this.graph.line.setXVariable(cart.getVarsIndex()+0); // x position
  this.graph.line.setYVariable(pendulum.getVarsIndex()+4); // angle
  this.timeGraph.line1.setYVariable(cart.getVarsIndex()+0); // x position
  this.timeGraph.line2.setYVariable(pendulum.getVarsIndex()+4); // angle
};

static readonly en: i18n_strings = {
  LENGTH: 'spring length',
  SPRING_DAMPING: 'spring damping',
  STIFFNESS: 'spring stiffness',
  CART: 'cart',
  PENDULUM: 'pendulum'
};

static readonly de_strings: i18n_strings = {
  LENGTH: 'Federlänge',
  SPRING_DAMPING: 'Federdämpfung',
  STIFFNESS: 'Federsteifheit',
  CART: 'Wagen',
  PENDULUM: 'Pendel'
};

static readonly i18n = Util.LOCALE === 'de' ? CartPendulum2App.de_strings : CartPendulum2App.en;

} // end class

type i18n_strings = {
  LENGTH: string,
  SPRING_DAMPING: string,
  STIFFNESS: string,
  CART: string,
  PENDULUM: string
};
Util.defineGlobal('sims$engine2D$CartPendulum2App', CartPendulum2App);
