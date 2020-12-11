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

goog.module('myphysicslab.lab.util.Calculus');

goog.require('goog.array');
goog.require('goog.asserts');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Provides functions for numerically estimating integrals.
*/
class Calculus {

/**
@private
*/
constructor() { throw new Error(); }


/** Returns Simpson's rule for quadrature.
* @param {function(number): number} f the function to integrate
* @param {number} a starting x value
* @param {number} b ending x value
* @return {number} the quadrature of fn from a to b
*/
static simp(f, a, b) {
  var h = (b - a)/2;
  return (h/3)*(f(a) + 4*f(a+h) + f(b));
};

/** Recursive function for doing adaptive quadrature integration.
* @param {function(number): number} f the function to integrate
* @param {number} a starting x value
* @param {number} b ending x value
* @param {number} tol error tolerance
* @return {number} the integral of f from a to b
*/
static aq(f, a, b, tol) {
  //console.log('aq('+Util.NF7(a)+', '+Util.NF7(b)+' tol='+Util.NF7(tol));
  var S1 = Calculus.simp(f, a, b);
  var c = (a + b)/2;
  var S_left = Calculus.simp(f, a, c);
  var S_right = Calculus.simp(f, c, b);
  if (Math.abs(S1 - S_left - S_right) < tol) {
    return S_left + S_right;
  } else {
    return Calculus.aq(f, a, c, tol/2) + Calculus.aq(f, c, b, tol/2);
  }
};

/** Performs adaptive quadrature integration.
* See Numerical Analysis, 6th edition by Richard L. Burden and J. Douglas Faires.
* Chapter 4.6 "Adaptive Quadrature Methods".
* @param {function(number): number} f the function to integrate
* @param {number} a starting x value
* @param {number} b ending x value
* @param {number} tol error tolerance
* @return {number} the integral of f from a to b
*/
static adaptQuad(f, a, b, tol) {
  var r = Calculus.aq(f, a, b, 10*tol);
  //console.log('adaptQuad '+Util.NF7(r));
  return r;
};

} // end class

exports = Calculus;
