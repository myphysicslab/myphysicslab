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

/** Provides functions for numerically estimating integrals.
*/

/** Returns Simpson's rule for quadrature.
* @param f the function to integrate
* @param a starting x value
* @param b ending x value
* @return the quadrature of fn from a to b
*/
function simp(f: (n: number)=>number, a: number, b: number) {
  const h = (b - a)/2;
  return (h/3)*(f(a) + 4*f(a+h) + f(b));
};

/** Recursive function for doing adaptive quadrature integration.
* @param f the function to integrate
* @param a starting x value
* @param b ending x value
* @param tol error tolerance
* @param S1 simpson's rule quadrature from a to b
* @return the integral of f from a to b
*/
function aq(f: (n: number)=>number, a: number, b: number, tol: number, S1: number): number {
  const c = (a + b)/2;
  const S_left = simp(f, a, c);
  const S_right = simp(f, c, b);
  if (Math.abs(S1 - S_left - S_right) < tol) {
    return S_left + S_right;
  } else {
    return aq(f, a, c, tol/2, S_left) + aq(f, c, b, tol/2, S_right);
  }
};

/** Performs adaptive quadrature integration.
* See Numerical Analysis, 6th edition by Richard L. Burden and J. Douglas Faires.
* Chapter 4.6 "Adaptive Quadrature Methods".
* @param f the function to integrate
* @param a starting x value
* @param b ending x value
* @param tol error tolerance
* @return the integral of f from a to b
*/
export function adaptQuad(f: (n: number)=>number, a: number, b: number, tol: number) {
  if (a > b) {
    throw 'adaptQuad a > b'+a+' '+b;
  } else if (a == b) {
    return 0;
  }
  const S1 = simp(f, a, b);
  return aq(f, a, b, 10*tol, S1);
};
