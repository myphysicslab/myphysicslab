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

/** Utility functions to convert a floating point double-precision number to/from its
representation as a IEEE 754 binary number. The main functions defined here are
{@link numToHex} and {@link hexToNum}.

DoubleMath can help detect changes in floating point numbers when debugging a sensitive
numerical computational algorithm.

See [IEEE 754 double-precision binary floating-point format:
binary64](http://en.wikipedia.org/wiki/Double-precision_floating-point_format)
*/
import { Util } from "./Util.js";

const HEX_DIGITS = '0123456789ABCDEF';

/** Convert a string of binary 1's and 0's to equivalent hexadecimal number
* @param binary  string of 1's and 0's, length must be multiple of 4
* @return hexadecimal equivalent
*/
export function binaryToHex(binary: string): string {
  if (binary.length % 4 != 0) {
    throw '';
  }
  let s = '';
  let v = 0;
  const n = binary.length;
  for (let i = 0; i<n; i++) {
    v = (2 * v) + (binary[i] === '0' ? 0 : 1);
    if (i % 4 === 3) {
      s = s + HEX_DIGITS[v];
      v = 0;
    }
  }
  return s;
};

/** Convert an IEEE 754 binary string to a double number.
* @param s an IEEE 754 formatted string of 64 binary digits
* @return the equivalent floating-point number
*/
export function binaryToNum(s: string): number {
  if (s.length != 64) {
    throw 'need 64 binary digits '+s;
  }
  // sign is bit 0
  const sign = s[0] == '0' ? 1 : -1;
  // exponent is bits 1 to 11
  let exp = 0;
  let d = 1;
  for (let i = 11; i > 0; i--) {
    if (s[i] == '1') {
      exp += d;
    }
    d *= 2;
  }
  let frac = 0;
  // fraction (mantissa) is bits 12 to 63
  d = 0.5;
  for (let i = 12; i < 64; i++) {
    if (s[i] == '1')
      frac += d;
    d /= 2;
  }
  // exponent == 0x7ff means NaN or infinity
  if (exp == 0x7ff) {
    if (frac != 0)
      return Number.NaN;
    else
      return sign > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }
  // exponent == 0x000 means zero or subnormal
  if (exp == 0) {
    if (frac == 0) {
      // zero
      return 0;
    } else {
      // subnormal
      return sign * Math.pow(2, -1022) * frac;
    }
  } else {
    // normal
    return sign * Math.pow(2, exp - 1023) * (1 + frac);
  }
};

/** Convert a hexadecimal number string to equivalent binary number string
* @param {string} hex hexadecimal number string
* @return {string} equivalent binary number string
*/
export function hexToBinary(hex: string): string {
  hex = hex.toUpperCase();
  let s = '';
  for (let i = 0; i < hex.length; i++) {
    let j = HEX_DIGITS.indexOf(hex[i]);
    if (j < 0) {
      throw '';
    }
    // 0 = 0000
    // 1 = 0001
    // 2 = 0010
    // D = 1101
    // E = 1110
    // F = 1111
    let d = 8;
    for (let k = 0; k < 4; k++) {
      if (j >= d) {
        s += '1';
        j -= d;
      } else {
        s += '0';
      }
      d /= 2;
    }
  }
  return s;
};

/** Convert a IEEE 754 hexadecimal string to a double number.
* @param {string} hex an IEEE 754 formatted string of 16 hexadecimal digits
* @return {number} the equivalent floating-point number
*/
export function hexToNum(hex: string): number {
  if (hex.length != 16)
    throw '';
  const s = hexToBinary(hex);
  Util.assert( s.length == 64 );
  return binaryToNum(s);
};

/** Formats a number in IEEE 754 hexadecimal format.
* @param num the number to format, null or undefined are OK
* @return the number in IEEE 754 hexadecimal format.
*/
export function NFHEX(num?: number|null): string {
  if (num != null)
    return numToHex(num);
  else
    return num === null ? 'null' : 'undefined';
};

/**  Convert a double to an IEEE 754 format binary string.
* @param {number} x the number to convert
* @return {string}  the binary IEEE 754 string equivalent of x
*/
export function numToBinary(x: number): string {
  //assumes it is not Infinity or NaN, for now... could fix this later
  if (isNaN(x)) {
    return '0' + repeatChar('1', 12) + repeatChar('0', 51);
  }
  const sign = x >= 0 ? 0 : 1;
  let s = sign == 0 ? '0' : '1';
  if (!isFinite(x)) {
    return s + repeatChar('1', 11) + repeatChar('0', 52);
  }
  const absx = Math.abs(x);
  let bit;
  // zero is a special case
  if (absx === 0) {
    bit = 1;
    while (bit++ < 64) {
      s += '0';
    }
    return s;
  }
  // log = log (base 2) of absolute value of x, determines the exponent
  let log = Math.floor(Math.LOG2E * Math.log(absx));
  // this limit of the exponent matters at least when x = Number.MAX_VALUE
  if (log > 1023) {
    log = 1023;
  }
  let num;  // num = mantissa
  if (log < -1022) {
    // subnormal number;  exponent is zero
    s += '00000000000';
    num = absx * Math.pow(2, 1022);
    // for subnormal, the first digit of mantissa must be zero
    Util.assert( num > 0 && num < 1 );
  } else {
    num = absx * Math.pow(2, -log);
    Util.assert( num < 2 );
    if (num >= 1) {
      // exponent is 1023 + log
      s += numToBits(1023 + log, 11);
      // we throw away the first 1, because this is a normal number
      // and the 1 is assumed to be there.
      num = num - 1;
    } else {
      // subnormal number
      s += '00000000000';
      num = absx * Math.pow(2, 1022);
    }
  }
  // get the 52 bits of mantissa
  bit = 0;
  while (bit++ < 52) {
    num = 2 * num;
    if (num >= 1) {
      s += '1';
      num = num - 1;
    } else {
      s += '0';
    }
  }
  return s;
};

/** Convert a number to base 2 format string of bits ('0' or '1').
* @param {number} num   the number of interest
* @param {number} size  desired length of string returned
* @return {string} equivalent string of bits encoded as '0' and '1'
*/
function numToBits(num: number, size: number): string {
  let s = '', bit;
  while (size--) {
    s = (bit = num % 2) + s;
    num = (num - bit) / 2;
  }
  Util.assert( Math.floor(num) == 0 );
  return s;
};

/** Convert a double number to an IEEE 754 format hexadecimal string.
* @param {number} x the number to convert
* @return {string}  the hexadecimal IEEE 754 string equivalent of x
*/
export function numToHex(x: number): string {
  return binaryToHex(numToBinary(x));
};

/**  Forms a string of repetitions of a given string.
* @param {string} str  string to repeat
* @param {number} size  number of repetitions
* @return {string} a string of repetitions of a given string
*/
function repeatChar(str: string, size: number): string {
  let s = '';
  while (size--) {
    s += str;
  }
  return s;
};
