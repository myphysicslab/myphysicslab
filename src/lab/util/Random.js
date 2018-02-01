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

goog.module('myphysicslab.lab.util.Random');

/** Pseudo-random number generator.
* @interface
*/
class Random {

/** Returns the modulus of the random number generator.
@return {number} the modulus of the random number generator
*/
getModulus() {}

/** Returns the seed of the random number generator.
@return {number} the seed of the random number generator
*/
getSeed() {}

/** Returns random floating point number in range `[0,1]`.
@return {number} random floating point number in range `[0,1]`
*/
nextFloat() {}

/** Returns next random integer in range 0 (inclusive) to modulus (exclusive).
@return {number} next the pseudo-random number
*/
nextInt() {}

/** Returns random integer in range 0 (inclusive) to n (exclusive).
@param {number} n the limit of the range
@return {number} random integer in range 0 (inclusive) to n (exclusive)
*/
nextRange(n) {}

/** Returns an array of integers from 0 to `n-1`, in random order.
@param {number} n the size of the array to create
@return {!Array<number>} an array of integers from 0 to `n-1`, in random order.
*/
randomInts(n) {}

/** Sets the seed of the random number generator; must be an integer between 0
(inclusive) and modulus (exclusive).
@param {number} seed  the seed to start the random number generator with
@throws {!Error} if seed is not an integer between 0 (inclusive) and modulus
    (exclusive).
*/
setSeed(seed) {}

} // end class
exports = Random;
