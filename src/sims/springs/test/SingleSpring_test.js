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

goog.provide('myphysicslab.sims.springs.test.SingleSpring_test');

goog.require('goog.array');
goog.require('goog.testing.jsunit');
goog.require('myphysicslab.lab.model.ModifiedEuler');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.sims.springs.SingleSpringSim');

var testSingleSpring = function() {
  var SimObject = myphysicslab.lab.model.SimObject;
  var SimpleAdvance = myphysicslab.lab.model.SimpleAdvance;
  var Util = goog.module.get('myphysicslab.lab.util.Util');
  var SingleSpringSim = myphysicslab.sims.springs.SingleSpringSim;
  var i;
  var tol = 1E-15;
  var sim = new myphysicslab.sims.springs.SingleSpringSim();
  var simList = sim.getSimList();
  var solvr = new myphysicslab.lab.model.ModifiedEuler(sim);
  var simpleAdv = new SimpleAdvance(sim, solvr);

  // confirm block and spring exist
  var block = simList.getPointMass('block');
  assertTrue(block instanceof myphysicslab.lab.model.PointMass);
  var spring = simList.getSpring('spring');
  assertTrue(spring instanceof myphysicslab.lab.model.Spring);

  // confirm parameters exist
  var dampingParam = sim.getParameterNumber(SingleSpringSim.en.DAMPING);
  assertTrue(dampingParam.nameEquals(SingleSpringSim.en.DAMPING));
  assertEquals(Util.toName(SingleSpringSim.en.DAMPING), dampingParam.getName());
  assertEquals(0.1, dampingParam.getValue());
  var lengthParam = sim.getParameterNumber(SingleSpringSim.en.SPRING_LENGTH);
  assertEquals(Util.toName(SingleSpringSim.en.SPRING_LENGTH),
     lengthParam.getName());
  assertTrue(lengthParam.nameEquals(SingleSpringSim.en.SPRING_LENGTH));
  assertEquals(2.5, lengthParam.getValue());
  var massParam = sim.getParameterNumber(SingleSpringSim.en.MASS);
  assertTrue(massParam.nameEquals(SingleSpringSim.en.MASS));
  assertEquals(Util.toName(SingleSpringSim.en.MASS), massParam.getName());
  assertEquals(0.5, massParam.getValue());
  var stiffnessParam = sim.getParameterNumber(SingleSpringSim.en.SPRING_STIFFNESS);
  assertTrue(stiffnessParam.nameEquals(SingleSpringSim.en.SPRING_STIFFNESS));
  assertEquals(Util.toName(SingleSpringSim.en.SPRING_STIFFNESS),
      stiffnessParam.getName());
  assertEquals(3.0, stiffnessParam.getValue());

  /**  Observer that counts number of times that parameters are changed or events fire.
  @constructor
  @implements {myphysicslab.lab.util.Observer}
  */
  var MockObserver1 = function() {
    /**
    * @type {number}
    */
    this.numEvents = 0;
    /**
    * @type {number}
    */
    this.numBooleans = 0;
    /**
    * @type {number}
    */
    this.numDoubles = 0;
    /**
    * @type {number}
    */
    this.numStrings = 0;
  };
  MockObserver1.prototype.observe =  function(event) {
    if (event instanceof myphysicslab.lab.util.GenericEvent) {
      this.numEvents++;
      assertTrue(event instanceof myphysicslab.lab.util.GenericEvent);
      assertEquals(sim, event.getSubject());
    } else if (event instanceof myphysicslab.lab.util.ParameterBoolean) {
      this.numBooleans++;
      assertTrue(event instanceof myphysicslab.lab.util.ParameterBoolean);
      assertEquals(sim, event.getSubject());
      var val = event.getValue();
      assertTrue(goog.isBoolean(val));
    } else if (event instanceof myphysicslab.lab.util.ParameterNumber) {
      this.numDoubles++;
      assertTrue(event instanceof myphysicslab.lab.util.ParameterNumber);
      assertEquals(sim, event.getSubject());
      var val = event.getValue();
      assertTrue(goog.isNumber(val));
    } else if (event instanceof myphysicslab.lab.util.ParameterString) {
      this.numStrings++;
      assertTrue(event instanceof myphysicslab.lab.util.ParameterString);
      assertEquals(sim, event.getSubject());
      assertTrue(goog.isString(event.getValue()));
    }
  };
  MockObserver1.prototype.toStringShort = function() {
    return 'MockObserver1';
  };
  var mockObsvr1 = new MockObserver1();
  assertEquals(0, mockObsvr1.numEvents);
  assertEquals(0, mockObsvr1.numBooleans);
  assertEquals(0, mockObsvr1.numDoubles);
  assertEquals(0, mockObsvr1.numStrings);
  // add the observer to the subject
  sim.addObserver(mockObsvr1);
  // there should be only this one observer
  var obsvrs = sim.getObservers();
  assertEquals(1, obsvrs.length);
  assertTrue(goog.array.contains(obsvrs, mockObsvr1));

  sim.setFixedPoint(0);
  assertEquals(0, sim.getFixedPoint());
  assertEquals(0.1, sim.getDamping());
  sim.setDamping(0.15);
  assertEquals(0.15, sim.getDamping());
  assertEquals(2, mockObsvr1.numDoubles);
  assertEquals(2.5, sim.getSpringRestLength());
  sim.setSpringRestLength(2.0);
  assertEquals(2.0, sim.getSpringRestLength());
  assertEquals(3, mockObsvr1.numDoubles);
  assertEquals(3.0, sim.getSpringStiffness());
  sim.setSpringStiffness(6.0);
  assertEquals(6.0, sim.getSpringStiffness());
  assertEquals(4, mockObsvr1.numDoubles);
  assertEquals(0.5, sim.getMass());
  sim.setMass(0.7);
  assertEquals(0.7, sim.getMass());
  assertEquals(5, mockObsvr1.numDoubles);
  var va = sim.getVarsList();
  va.setValue(0, 0.5);
  sim.initWork();
  sim.saveInitialState();
  assertEquals(Util.toName(SingleSpringSim.en.POSITION),
      va.getVariable(0).getName());
  assertEquals(SingleSpringSim.i18n.POSITION,
      va.getVariable(0).getName(/*localized=*/true));
  assertEquals(0.5, va.getValue(0));
  assertEquals(Util.toName(SingleSpringSim.en.VELOCITY),
      va.getVariable(1).getName());
  assertEquals(SingleSpringSim.i18n.VELOCITY,
      va.getVariable(1).getName(/*localized=*/true));
  assertEquals(0, va.getValue(1));
  var timeIdx = va.timeIndex();
  va.setValue(timeIdx, 100);
  sim.saveInitialState();
  va.setValue(timeIdx, 0);

  var expect = [
    [ 0.5040178571428572, 0.32056760204081636 ],
    [ 0.516017675638894, 0.6377051511841583 ],
    [ 0.5358925536030913, 0.9497343223285384 ],
    [ 0.5634940297550691, 1.2550130990176436 ],
    [ 0.5986331000236428, 1.551944363925923 ],
    [ 0.6410814456152146, 1.8389842031764325 ],
    [ 0.6905728648445506, 2.114649881594092 ],
    [ 0.7468048999775697, 2.377527447987486 ],
    [ 0.8094406493392821, 2.6262789317505306 ],
    [ 0.8781107540009925, 2.8596490944688435 ]
    ];

  // step to time zero to ensure energy is updated
  simpleAdv.advance(0);
  // step forward in time
  var timeStep = 0.025;
  var time = 0;
  for (i=0; i<10; i++) {
    simpleAdv.advance(timeStep);
    time += timeStep;
    assertEquals(va.getValue(0), block.getPosition().getX());
    assertEquals(va.getValue(1), block.getVelocity().getX());
    assertRoughlyEquals(time, sim.getTime(), tol);
    // check expected values
    assertRoughlyEquals(expect[i][0], va.getValue(0), 1E-14);
    assertRoughlyEquals(expect[i][1], va.getValue(1), 1E-14);
    // check that energy is roughly constant
    assertRoughlyEquals(6.7, va.getValue(7), 0.1);
    //console.log(va.getTime()+' '+va.getValue(0)+' '+va.getValue(1));
  }

  // reset to initial conditions, with time starting at 100
  sim.reset();
  assertEquals(0.5, va.getValue(0));
  assertEquals(0, va.getValue(1));
  assertEquals(100, sim.getTime());

  // advance again after reset, with time starting at 100
  time = 100;
  for (i=0; i<10; i++) {
    simpleAdv.advance(timeStep);
    time += timeStep;
    assertRoughlyEquals(time, sim.getTime(), tol);
    // check expected values
    assertRoughlyEquals(expect[i][0], va.getValue(0), 1E-14);
    assertRoughlyEquals(expect[i][1], va.getValue(1), 1E-14);
    // check that energy is roughly constant
    assertRoughlyEquals(6.7, va.getValue(7), 0.1);
  }

  sim.setPotentialEnergy(99);
  var ei = sim.getEnergyInfo();
  assertEquals(99, ei.getPotential());
  assertRoughlyEquals(2.8621575302237665, ei.getTranslational(), 1e-10);

};
goog.exportProperty(window, 'testSingleSpring', testSingleSpring);
