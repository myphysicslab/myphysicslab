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

goog.module('myphysicslab.sims.roller.BrachistoPaths');

const AbstractPath = goog.require('myphysicslab.sims.roller.AbstractPath');

/** Contains the various curves used in the Brachistochrone simulation,
see {@link myphysicslab.sims.roller.BrachistoApp}.

The Mathematica notebook [Brachistochrone Curves](Brachistochrone_Curves.pdf) shows how
the various curves were chosen. The goal is to find a variety of curves that start at
the origin (0, 0) and pass thru the point (3, -2). The Brachistochrone simulation shows
a ball sliding down each of the curves without friction, with gravity acting.
*/
class BrachistoPaths {
/**
* @private
*/
constructor() {
  throw new Error();
};

} // end class


// =================================================================
/**
*/
class LinearPath extends AbstractPath {
constructor() {
  super(BrachistoPaths.en.LINEAR_PATH,
      BrachistoPaths.i18n.LINEAR_PATH, 0, 6, false);
};

/** @override */
getClassName() {
  return 'LinearPath';
};

/** @override */
x_func(t) {
  return t;
};

/** @override */
y_func(t) {
  return -(2.0/3.0)*t;
};

} // end class
BrachistoPaths.LinearPath = LinearPath;

// =================================================================
/**
*/
class BrachistochronePath extends AbstractPath {
constructor() {
  super(BrachistoPaths.en.BRACH_PATH,
      BrachistoPaths.i18n.BRACH_PATH, 0, 2*Math.PI, false);
};

/** @override */
getClassName() {
  return 'BrachistochronePath';
};

/** @override */
x_func(t) {
  if (t>2*Math.PI)
    t = 2*Math.PI; // goes up vertical beyond the end (so x is fixed)
  if (t<0)
    t = 0;
  return 1.00133*(t - Math.sin(t));
};

/** @override */
y_func(t) {
  if (t>2*Math.PI)
    return t - 2*Math.PI;  // goes up vertical beyond the end
  else if (t<0)
    return -t;
  else
    return -1.00133*(1 - Math.cos(t));
};

} // end class
BrachistoPaths.BrachistochronePath = BrachistochronePath;

// =================================================================
/**
*/
class ParabolaUpPath extends AbstractPath {
constructor() {
  super(BrachistoPaths.en.PARABOLA_UP,
      BrachistoPaths.i18n.PARABOLA_UP, -2, 8, false);
};

/** @override */
getClassName() {
  return 'ParabolaUpPath';
};

/** @override */
x_func(t) {
  return t;
};

/** @override */
y_func(t) {
  return -2.0 + (2.0/9.0)*(t - 3.0)*(t - 3.0);  // parabola
  //return -2.0 - (2.0/27.0)*(t - 3.0)*(t-3.0)*(t-3.0);  // cubic
  //return -2.0 + (2.0/81.0)*(t - 3.0)*(t - 3.0)*(t - 3.0)*(t - 3.0); // quartic
};

} // end class
BrachistoPaths.ParabolaUpPath = ParabolaUpPath;

// =================================================================
/** A 'squared' Brachistochrone path.  Created to have a path that drops below the
regular brachistochrone and stays below it.
*/
class Brachistochrone2Path extends AbstractPath {
constructor() {
  super(BrachistoPaths.en.BRACH_SQUARED,
      BrachistoPaths.i18n.BRACH_SQUARED, 0, 2*Math.PI, false);
};

/** @override */
getClassName() {
  return 'Brachistochrone2Path';
};

/** @override */
x_func(t) {
  if (t>2*Math.PI)
    t = 2*Math.PI; // goes up vertical beyond the end (so x is fixed)
  if (t<0)
    t = 0;
  return 1.00133*(t - Math.sin(t));
};

/** @override */
y_func(t) {
  if (t>2*Math.PI)
    return t - 2*Math.PI;  // goes up vertical beyond the end
  else if (t<0)
    return -t;
  else {
    var d = 1 - (1 - Math.cos(t))/2.0;
    return 2*1.00133*(-1 + d*d);
  }
};

} // end class
BrachistoPaths.Brachistochrone2Path = Brachistochrone2Path;

// =================================================================
/**
*/
class ParabolaDownPath extends AbstractPath {
constructor() {
  super(BrachistoPaths.en.PARABOLA_DOWN,
      BrachistoPaths.i18n.PARABOLA_DOWN, -2, 8, false);
};

/** @override */
getClassName() {
  return 'ParabolaDownPath';
};

/** @override */
x_func(t) {
  return t;
};

/** @override */
y_func(t) {
  return -0.1666667*(t+0.5)*(t+0.5) + 0.04166667;
};

} // end class
BrachistoPaths.ParabolaDownPath = ParabolaDownPath;

// =================================================================
/**
*/
class CircleArcPath extends AbstractPath {
constructor() {
  super(BrachistoPaths.en.CIRCLE_ARC,
      BrachistoPaths.i18n.CIRCLE_ARC, -Math.PI, 0, false);
};

/** @override */
getClassName() {
  return 'CircleArcPath';
};

/** @override */
x_func(t) {
  return 3 + (13.0/4.0)*Math.cos(t);
};

/** @override */
y_func(t) {
  return (13.0/4.0 - 2.0) + (13.0/4.0)*Math.sin(t);
};

} // end class
BrachistoPaths.CircleArcPath = CircleArcPath;

/** Set of internationalized strings.
@typedef {{
  BRACH_PATH: string,
  BRACH_SQUARED: string,
  CIRCLE_ARC: string,
  LINEAR_PATH: string,
  PARABOLA_DOWN: string,
  PARABOLA_UP: string
  }}
*/
BrachistoPaths.i18n_strings;

/**
@type {BrachistoPaths.i18n_strings}
*/
BrachistoPaths.en = {
  BRACH_PATH: 'brachistochrone',
  BRACH_SQUARED: 'brachistochrone-squared',
  CIRCLE_ARC: 'circle',
  LINEAR_PATH: 'linear',
  PARABOLA_DOWN: 'parabola-down',
  PARABOLA_UP: 'parabola-up'
};

/**
@private
@type {BrachistoPaths.i18n_strings}
*/
BrachistoPaths.de_strings = {
  BRACH_PATH: 'Brachistochrone',
  BRACH_SQUARED: 'Brachistochrone-quadriert',
  CIRCLE_ARC: 'Kreis',
  LINEAR_PATH: 'Linear',
  PARABOLA_DOWN: 'Parabola-ab',
  PARABOLA_UP: 'Parabola-auf'
};

/** Set of internationalized strings.
@type {BrachistoPaths.i18n_strings}
*/
BrachistoPaths.i18n = goog.LOCALE === 'de' ? BrachistoPaths.de_strings :
    BrachistoPaths.en;

exports = BrachistoPaths;
