goog.module('myphysicslab.sims.pde.AbstractShape');

const StringShape = goog.require('myphysicslab.sims.pde.StringShape');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Defines initial conditions of a string used in the
{@link myphysicslab.sims.pde.StringSim} PDE simulation by specifying the initial
displacement and velocity at each point of the string.

### How to find the correct velocity for a traveling wave:

The d'Alembert equation for a left-moving traveling wave is `f(x + ct)`, where `f()`
is a general single-variable waveform, think of it as `f(x)` moving to
the left as `t` increases.  The velocity (partial derivative with respect
to time) is then `c f'(x + ct)` which at time `t=0` is  `c f'(x)`.
So take the first derivative of the waveform, and multiply by `c`
where `c` is the wave speed `= sqrt(tension/density)`.
Right-moving wave is `f(x - ct)` with derivative `-c f'(x)`

* @implements {StringShape}
* @abstract
*/
class AbstractShape {
/**
* @param {number} length
* @param {string} name
* @param {string=} opt_localName localized name of this SimObject (optional)
*/
constructor(length, name, opt_localName) {
  if (length < 1e-16) {
    throw '';
  }
  /**
  * @type {number}
  * @protected
  */
  this.length_ = length;
  /**
  * @type {string}
  * @private
  */
  this.name_ = Util.toName(name);
  /**
  * @type {string}
  * @private
  */
  this.localName_ = opt_localName || name;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.getClassName()+'{name_: "'+this.name_+'"'
      +', length_: '+Util.NF(this.length_)
      +'}';
};

/** @abstract */
getClassName() {};

/** Returns the length of the string.
@return {number} length of the string
*/
getLength() {
  return this.length_;
};

/** Name of this AbstractShape, either a the language-independent name for scripting
purposes or the localized name for display to user.
@param {boolean=} opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return {string} name of this AbstractShape
*/
getName(opt_localized) {
  return opt_localized ? this.localName_ : this.name_;
};

/** @abstract */
position(x) {};

/** @abstract */
velocity(x) {};

} // end class

exports = AbstractShape;
