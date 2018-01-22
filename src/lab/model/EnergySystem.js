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

goog.module('myphysicslab.lab.model.EnergySystem');

const EnergyInfo = goog.require('myphysicslab.lab.model.EnergyInfo');
const Printable = goog.require('myphysicslab.lab.util.Printable');

/** An object that provides information about its energy state. See {@link EnergyInfo}.

* @interface
*/
class EnergySystem extends Printable {

/** Returns the current EnergyInfo for this system.
* @return {!EnergyInfo} an EnergyInfo object representing
*    the current energy of this system.
*/
getEnergyInfo() {}

/** Sets the current potential energy of this system.
* @param {number} value the current potential energy of this system
*/
setPotentialEnergy(value) {}

} //end class

/** Set of internationalized strings.
@typedef {{
  POTENTIAL_ENERGY: string,
  TRANSLATIONAL_ENERGY: string,
  KINETIC_ENERGY: string,
  ROTATIONAL_ENERGY: string,
  TOTAL: string,
  TOTAL_ENERGY: string
  }}
*/
EnergySystem.i18n_strings;

/**
@type {EnergySystem.i18n_strings}
*/
EnergySystem.en = {
  POTENTIAL_ENERGY: 'potential energy',
  TRANSLATIONAL_ENERGY: 'translational energy',
  KINETIC_ENERGY: 'kinetic energy',
  ROTATIONAL_ENERGY: 'rotational energy',
  TOTAL: 'total',
  TOTAL_ENERGY: 'total energy'
};

/**
@private
@type {EnergySystem.i18n_strings}
*/
EnergySystem.de_strings = {
  POTENTIAL_ENERGY: 'potenzielle Energie',
  TRANSLATIONAL_ENERGY: 'Translationsenergie',
  KINETIC_ENERGY: 'kinetische Energie',
  ROTATIONAL_ENERGY: 'Rotationsenergie',
  TOTAL: 'gesamt',
  TOTAL_ENERGY: 'gesamte Energie'
};

/** Set of internationalized strings.
@type {EnergySystem.i18n_strings}
*/
EnergySystem.i18n = goog.LOCALE === 'de' ? EnergySystem.de_strings :
    EnergySystem.en;

exports = EnergySystem;
