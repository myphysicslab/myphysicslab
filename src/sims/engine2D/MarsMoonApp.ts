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
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { Gravity2Law } from '../../lab/model/Gravity2Law.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Simulation of an asteroid orbiting a moon.

This app has a {@link MarsMoonApp.config} function which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.
*/
export class MarsMoonApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  moonMass: number = 100;
  asteroidMass: number = 0.1;
  moonRadius: number = 3;
  asteroidRadius: number = 0.2;
  /** asteriod starting vertical velocity */
  velocity: number = 14;
  /** asteriod starting distance */
  distance: number = 0.8;
  /** ratio of axes of oval.  1.0 = circle. */
  ovalness: number = 1.0;
  /** initial moon rotational velocity.  Only relevant for oval shaped moon. */
  moonSpin: number = 0;
  moon: Polygon;
  asteroid: Polygon;
  gravityLaw: Gravity2Law;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-10, -10, 10, 10);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(1.0);
  this.sim.setShowForces(false);
  this.sim.setShowCollisions(true);
  this.dampingLaw = new DampingLaw(/*damping=*/0, /*rotateRatio=*/0.15, this.simList);
  this.gravityLaw = new Gravity2Law(10.0, this.simList);

  this.addPlaybackControls();
  let pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(Gravity2Law.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.MOON_MASS,
      MarsMoonApp.i18n.MOON_MASS,
      () => this.getMoonMass(), a => this.setMoonMass(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.ASTERIOD_MASS,
      MarsMoonApp.i18n.ASTERIOD_MASS,
      () => this.getAsteroidMass(), a => this.setAsteroidMass(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.VELOCITY,
      MarsMoonApp.i18n.VELOCITY,
      () => this.getVelocity(), a => this.setVelocity(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.DISTANCE,
      MarsMoonApp.i18n.DISTANCE,
      () => this.getDistance(), a => this.setDistance(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.MOON_RADIUS,
      MarsMoonApp.i18n.MOON_RADIUS,
      () => this.getMoonRadius(), a => this.setMoonRadius(a)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, MarsMoonApp.en.ASTERIOD_RADIUS,
      MarsMoonApp.i18n.ASTERIOD_RADIUS,
      () => this.getAsteroidRadius(),
      a => this.setAsteroidRadius(a)));
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();

  // show the pan-zoom controls
  this.panZoomParam.setValue(true);
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
  return 'MarsMoonApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('MarsMoonApp|Engine2DApp',
       'sims$engine2D$', /*addToVars=*/false);
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

/** @inheritDoc */
override graphSetup(_body?: RigidBody): void {
  const idx = this.asteroid.getVarsIndex();
  this.graph.line.setXVariable(idx+0); // 'asteroid x position'
  this.graph.line.setYVariable(idx+2); // 'asteroid y position'
  this.timeGraph.line1.setYVariable(idx+0); // 'asteroid x position'
  this.timeGraph.line2.setYVariable(idx+1); // 'asteroid x velocity'
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ContactSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
config(): void {
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.advance.reset();
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  if (this.ovalness == 1.0) {
    this.moon = Shapes.makeBall(this.moonRadius, MarsMoonApp.en.MOON,
      MarsMoonApp.i18n.MOON);
  } else {
    //this.moon = Shapes.makeOval('moon', 3, ovalness*3);
    throw 'oval shape not implemented';
  }
  // Set moon velocity so the combined bodies have zero momentum.
  // asteroid momentum = asteroid_v * asteroid_mass
  // moon_momentum = -asteroid_momentum = moon_v * moon_mass
  const moon_v = -this.velocity * this.asteroidMass / this.moonMass;
  this.moon.setMass(this.moonMass);
  this.moon.setPosition(new Vector(0,  0),  0);
  this.moon.setVelocity(new Vector(0,  moon_v),  this.moonSpin);
  this.moon.setElasticity(elasticity);
  this.sim.addBody(this.moon);
  let ds = this.displayList.findShape(this.moon);
  ds.setFillStyle('#E0E0E0');
  ds.setDrawCenterOfMass(true);

  this.asteroid = Shapes.makeBall(this.asteroidRadius, MarsMoonApp.en.ASTERIOD,
      MarsMoonApp.i18n.ASTERIOD);
  const dist = this.asteroidRadius + this.moonRadius + this.distance;
  this.asteroid.setPosition(new Vector(dist,  0),  0);
  this.asteroid.setMass(this.asteroidMass);
  this.asteroid.setVelocity(new Vector(0,  this.velocity),  0);
  this.asteroid.setElasticity(elasticity);
  this.sim.addBody(this.asteroid);
  this.displayList.findShape(this.asteroid).setFillStyle('Blue')

  this.sim.getVarsList().setTime(0);
  this.sim.saveInitialState();
  this.clock.setTime(this.sim.getTime());
  this.clock.setRealTime(this.sim.getTime());
  this.easyScript.update();
};

/**
*/
getAsteroidMass(): number {
  return this.asteroidMass;
};

/**
* @param value
*/
setAsteroidMass(value: number) {
  this.asteroidMass = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.ASTERIOD_MASS);
};

/**
*/
getMoonMass(): number {
  return this.moonMass;
};

/**
* @param value
*/
setMoonMass(value: number) {
  this.moonMass = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.MOON_MASS);
};

/**
*/
getAsteroidRadius(): number {
  return this.asteroidRadius;
};

/**
* @param value
*/
setAsteroidRadius(value: number) {
  this.asteroidRadius = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.ASTERIOD_RADIUS);
};

/**
*/
getMoonRadius(): number {
  return this.moonRadius;
};

/**
* @param value
*/
setMoonRadius(value: number) {
  this.moonRadius = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.MOON_RADIUS);
};

/**
*/
getVelocity(): number {
  return this.velocity;
};

/**
* @param value
*/
setVelocity(value: number) {
  this.velocity = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.VELOCITY);
};

/**
*/
getDistance(): number {
  return this.distance;
};

/**
* @param value
*/
setDistance(value: number) {
  this.distance = value;
  this.config();
  this.broadcastParameter(MarsMoonApp.en.DISTANCE);
};

static readonly en: i18n_strings = {
  ASTERIOD_MASS: 'asteroid mass',
  ASTERIOD_RADIUS: 'asteroid radius',
  GRAVITY: 'gravity',
  MOON_MASS: 'moon mass',
  MOON_RADIUS: 'moon radius',
  MOON_SPIN: 'moon spin',
  OVALNESS: 'ovalness',
  VELOCITY: 'initial velocity',
  MOON: 'moon',
  ASTERIOD: 'asteroid',
  DISTANCE: 'distance'
};

static readonly de_strings: i18n_strings = {
  ASTERIOD_MASS: 'Asteroid Masse',
  ASTERIOD_RADIUS: 'Asteroid Radius',
  GRAVITY: 'Gravitation',
  MOON_MASS: 'Mondmasse',
  MOON_RADIUS: 'Mond Radius',
  MOON_SPIN: 'Mondrotation',
  OVALNESS: 'Oval-heit',
  VELOCITY: 'Anfangs Geschwindigkeit',
  MOON: 'Mond',
  ASTERIOD: 'Asteroid',
  DISTANCE: 'Entfernung'
};

static readonly i18n = Util.LOCALE === 'de' ? MarsMoonApp.de_strings : MarsMoonApp.en;

} // end class

type i18n_strings = {
  ASTERIOD_MASS: string,
  ASTERIOD_RADIUS: string,
  GRAVITY: string,
  MOON_MASS: string,
  MOON_RADIUS: string,
  MOON_SPIN: string,
  OVALNESS: string,
  VELOCITY: string,
  MOON: string,
  ASTERIOD: string,
  DISTANCE: string
};
