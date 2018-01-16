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

goog.module('myphysicslab.lab.util.SubjectEvent');

const Printable = goog.require('myphysicslab.lab.util.Printable');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Provides information about an event that has happened to a
{@link myphysicslab.lab.util.Subject Subject}. A SubjectEvent has a name, a value,
and can identify which Subject broadcast the event.

See {@link myphysicslab.lab.util.Subject} for more extensive documentation.

* @interface
*/
class SubjectEvent extends Printable {

/** Name of this SubjectEvent, either the language-independent name for scripting
purposes or the localized name for display to user.

The [language-independent name](Building.html#languageindependentnames) should be the
same as the English version but capitalized and with spaces and dashes replaced by
underscore, see {@link Util#toName} and {@link #nameEquals}.

@param {boolean=} opt_localized `true` means return the localized version of the name;
    default is `false` which means return the language independent name.
@return {string} name of this object
*/
getName(opt_localized) {}

/** Returns the Subject to which this SubjectEvent refers.
@return {!myphysicslab.lab.util.Subject} the Subject to which this SubjectEvent refers.
*/
getSubject() {}

/** Returns the value of this SubjectEvent, or `undefined` if there is no assigned
value.
@return {*} the value of this SubjectEvent
*/
getValue() {}

/** Whether this SubjectEvent has the given name, adjusting for the transformation to a
[language-independent form]((Building.html#languageindependentnames) of the name, as is
done by {@link Util#toName}.

@param {string} name the English or language-independent version of the name
@return {boolean} whether this SubjectEvent has the given name (adjusted to
    language-independent form)
*/
nameEquals(name) {}

}
exports = SubjectEvent;
