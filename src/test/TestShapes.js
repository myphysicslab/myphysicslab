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

goog.provide('myphysicslab.test.TestShapes');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.engine2D.CircularEdge');
goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.StraightEdge');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');

goog.scope(function() {

var CircularEdge = myphysicslab.lab.engine2D.CircularEdge;
var ConcreteVertex = myphysicslab.lab.engine2D.ConcreteVertex;
var NF5 = myphysicslab.lab.util.UtilityCore.NF5;
var Polygon = myphysicslab.lab.engine2D.Polygon;
var RigidBody = myphysicslab.lab.engine2D.RigidBody;
var StraightEdge = myphysicslab.lab.engine2D.StraightEdge;
var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Vector = myphysicslab.lab.util.Vector;

/**  This class consists exclusively of static methods that create RigidBodys.

* @constructor
* @final
* @struct
* @private
*/
myphysicslab.test.TestShapes = function() {
  throw new Error();
};
var TestShapes = myphysicslab.test.TestShapes;

/**
* @return {!myphysicslab.lab.engine2D.Polygon}
*/
TestShapes.makeBlockRoundEdge = function() {
  var p = new Polygon('block-round-edge');
  p.startPath(new ConcreteVertex(new Vector(0, 0)));
  p.addStraightEdge(new Vector(2, 0), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(2, 1), /*outsideIsUp=*/true);
  p.addCircularEdge(/*endPoint=*/new Vector(0, 1),
                    /*center=*/new Vector(1.0, -0.3),
                    /*clockwise=*/false,
                    /*outsideIsOut=*/true);
  p.addStraightEdge(new Vector(0, 0), /*outsideIsUp=*/false);
  p.finish();
  p.setElasticity(0.8);
  return p;
};

/**
* @return {!myphysicslab.lab.engine2D.Polygon}
*/
TestShapes.makeConcaveCirclePoly = function() {
  var p = new Polygon('concave_circle');
  p.startPath(new ConcreteVertex(new Vector(0, -0.5)));
  p.addStraightEdge(new Vector(3, -0.5), /*outsideIsUp=*/false);
  p.addStraightEdge(new Vector(3, 1), /*outsideIsUp=*/true);
  p.addCircularEdge2(/*endPoint=*/new Vector(0, 1),
                    /*radius=*/2,
                    /*aboveRight=*/true,
                    /*clockwise=*/true,
                    /*outsideIsOut=*/false);
  p.addStraightEdge(new Vector(0, -0.5), /*outsideIsUp=*/false);
  p.finish();
  p.setCenterOfMass(1.5, 0);
  p.setElasticity(0.8);
  return p;
};

/** Returns an n-sided Polygon with n equal sides.
@param {number} n the number of sides
@param {number} radius the distance from center to each vertex
@return {!myphysicslab.lab.engine2D.Polygon} an n-sided Polygon with n equal sides.
*/
TestShapes.makeNGon = function(n, radius) {
  var p = new Polygon('polygon-'+n+'-sides');
  var delta = 2*Math.PI/n;
  p.startPath(new ConcreteVertex(new Vector(radius, 0)));
  for (var i=1; i<n; i++) {
    p.addStraightEdge(new Vector(radius*Math.cos(delta*i), radius*Math.sin(delta*i)),
      /*outsideIsUp=*/i <= n/2);
  }
  p.addStraightEdge(new Vector(radius, 0), /*outsideIsUp=*/false);
  p.finish();
  p.setCenterOfMass(0, 0);
  // use same moment calculation as circle
  p.setMomentAboutCM(radius*radius/2);
  p.setElasticity(0.8);
  return p;
};

}); // goog.scope
