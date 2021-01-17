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

goog.module('myphysicslab.test.TestShapes');

const CircularEdge = goog.require('myphysicslab.lab.engine2D.CircularEdge');
const ConcreteVertex = goog.require('myphysicslab.lab.engine2D.ConcreteVertex');
const Polygon = goog.require('myphysicslab.lab.engine2D.Polygon');
const RigidBody = goog.require('myphysicslab.lab.engine2D.RigidBody');
const StraightEdge = goog.require('myphysicslab.lab.engine2D.StraightEdge');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/**  This class contains static methods that create RigidBodys.
*/
class TestShapes {
/**
* @private
*/
constructor() {
  throw '';
};

/**
* @return {!Polygon}
*/
static makeBlockRoundEdge() {
  const p = new Polygon('block-round-edge');
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
* @return {!Polygon}
*/
static makeConcaveCirclePoly() {
  const p = new Polygon('concave_circle');
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
@return {!Polygon} an n-sided Polygon with n equal sides.
*/
static makeNGon(n, radius) {
  const p = new Polygon('polygon-'+n+'-sides');
  const delta = 2*Math.PI/n;
  p.startPath(new ConcreteVertex(new Vector(radius, 0)));
  for (let i=1; i<n; i++) {
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

} // end class

exports = TestShapes;
