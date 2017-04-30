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

goog.provide('myphysicslab.sims.roller.BrachistoPaths');

goog.require('myphysicslab.sims.roller.AbstractPath');

goog.scope(function() {

var AbstractPath = myphysicslab.sims.roller.AbstractPath;

/** Contains the various curves used in the Brachistochrone simulation,
see {@link myphysicslab.sims.roller.BrachistoApp}.

The Mathematica notebook [Brachistochrone Curves](Brachistochrone_Curves.pdf) shows how
the various curves were chosen. The goal is to find a variety of curves that start at
the origin (0, 0) and pass thru the point (3, -2). The Brachistochrone simulation shows
a ball sliding down each of the curves without friction, with gravity acting.

* @constructor
* @final
* @struct
* @private
*/
myphysicslab.sims.roller.BrachistoPaths = function() {
  throw new Error();
};
var BrachistoPaths = myphysicslab.sims.roller.BrachistoPaths;


// =================================================================
/**
* @constructor
* @final
* @struct
* @extends {AbstractPath}
*/
BrachistoPaths.LinearPath = function() {
  AbstractPath.call(this, BrachistoPaths.en.LINEAR_PATH,
      BrachistoPaths.i18n.LINEAR_PATH, 0, 6, false);
};
var LinearPath = myphysicslab.sims.roller.BrachistoPaths.LinearPath;
goog.inherits(LinearPath, AbstractPath);

/** @inheritDoc */
LinearPath.prototype.getClassName = function() {
  return 'LinearPath';
};

/** @inheritDoc */
LinearPath.prototype.x_func = function(t) {
  return t;
};

/** @inheritDoc */
LinearPath.prototype.y_func = function(t) {
  return -(2.0/3.0)*t;
};



// =================================================================
/**
* @constructor
* @final
* @struct
* @extends {AbstractPath}
*/
BrachistoPaths.BrachistochronePath = function() {
  AbstractPath.call(this, BrachistoPaths.en.BRACH_PATH,
      BrachistoPaths.i18n.BRACH_PATH, 0, 2*Math.PI, false);
};
var BrachistochronePath = BrachistoPaths.BrachistochronePath;
goog.inherits(BrachistochronePath, AbstractPath);

/** @inheritDoc */
BrachistochronePath.prototype.getClassName = function() {
  return 'BrachistochronePath';
};

/** @inheritDoc */
BrachistochronePath.prototype.x_func = function(t) {
  if (t>2*Math.PI)
    t = 2*Math.PI; // goes up vertical beyond the end (so x is fixed)
  if (t<0)
    t = 0;
  return 1.00133*(t - Math.sin(t));
};

/** @inheritDoc */
BrachistochronePath.prototype.y_func = function(t) {
  if (t>2*Math.PI)
    return t - 2*Math.PI;  // goes up vertical beyond the end
  else if (t<0)
    return -t;
  else
    return -1.00133*(1 - Math.cos(t));
};



// =================================================================
/**
* @constructor
* @final
* @struct
* @extends {AbstractPath}
*/
BrachistoPaths.ParabolaUpPath = function() {
  AbstractPath.call(this, BrachistoPaths.en.PARABOLA_UP,
      BrachistoPaths.i18n.PARABOLA_UP, -2, 8, false);
};
var ParabolaUpPath = BrachistoPaths.ParabolaUpPath;
goog.inherits(ParabolaUpPath, AbstractPath);

/** @inheritDoc */
ParabolaUpPath.prototype.getClassName = function() {
  return 'ParabolaUpPath';
};

/** @inheritDoc */
ParabolaUpPath.prototype.x_func = function(t) {
  return t;
};

/** @inheritDoc */
ParabolaUpPath.prototype.y_func = function(t) {
  return -2.0 + (2.0/9.0)*(t - 3.0)*(t - 3.0);  // parabola
  //return -2.0 - (2.0/27.0)*(t - 3.0)*(t-3.0)*(t-3.0);  // cubic
  //return -2.0 + (2.0/81.0)*(t - 3.0)*(t - 3.0)*(t - 3.0)*(t - 3.0); // quartic
};


// =================================================================
/** A 'squared' Brachistochrone path.  Created to have a path that drops below the
regular brachistochrone and stays below it.
* @constructor
* @final
* @struct
* @extends {AbstractPath}
*/
BrachistoPaths.Brachistochrone2Path = function() {
  AbstractPath.call(this, BrachistoPaths.en.BRACH_SQUARED,
      BrachistoPaths.i18n.BRACH_SQUARED, 0, 2*Math.PI, false);
};
var Brachistochrone2Path = BrachistoPaths.Brachistochrone2Path;
goog.inherits(Brachistochrone2Path, AbstractPath);

/** @inheritDoc */
Brachistochrone2Path.prototype.getClassName = function() {
  return 'Brachistochrone2Path';
};

/** @inheritDoc */
Brachistochrone2Path.prototype.x_func = function(t) {
  if (t>2*Math.PI)
    t = 2*Math.PI; // goes up vertical beyond the end (so x is fixed)
  if (t<0)
    t = 0;
  return 1.00133*(t - Math.sin(t));
};

/** @inheritDoc */
Brachistochrone2Path.prototype.y_func = function(t) {
  if (t>2*Math.PI)
    return t - 2*Math.PI;  // goes up vertical beyond the end
  else if (t<0)
    return -t;
  else {
    var d = 1 - (1 - Math.cos(t))/2.0;
    return 2*1.00133*(-1 + d*d);
  }
};


// =================================================================
/**
* @constructor
* @final
* @struct
* @extends {AbstractPath}
*/
BrachistoPaths.ParabolaDownPath = function() {
  AbstractPath.call(this, BrachistoPaths.en.PARABOLA_DOWN,
      BrachistoPaths.i18n.PARABOLA_DOWN, -2, 8, false);
};
var ParabolaDownPath = BrachistoPaths.ParabolaDownPath;
goog.inherits(ParabolaDownPath, AbstractPath);

/** @inheritDoc */
ParabolaDownPath.prototype.getClassName = function() {
  return 'ParabolaDownPath';
};

/** @inheritDoc */
ParabolaDownPath.prototype.x_func = function(t) {
  return t;
};

/** @inheritDoc */
ParabolaDownPath.prototype.y_func = function(t) {
  return -0.1666667*(t+0.5)*(t+0.5) + 0.04166667;
};


// =================================================================
/**
* @constructor
* @final
* @struct
* @extends {AbstractPath}
*/
BrachistoPaths.CircleArcPath = function() {
  AbstractPath.call(this, BrachistoPaths.en.CIRCLE_ARC,
      BrachistoPaths.i18n.CIRCLE_ARC, -Math.PI, 0, false);
};
var CircleArcPath = BrachistoPaths.CircleArcPath;
goog.inherits(CircleArcPath, AbstractPath);

/** @inheritDoc */
CircleArcPath.prototype.getClassName = function() {
  return 'CircleArcPath';
};

/** @inheritDoc */
CircleArcPath.prototype.x_func = function(t) {
  return 3 + (13.0/4.0)*Math.cos(t);
};

/** @inheritDoc */
CircleArcPath.prototype.y_func = function(t) {
  return (13.0/4.0 - 2.0) + (13.0/4.0)*Math.sin(t);
};


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

}); // goog.scope
