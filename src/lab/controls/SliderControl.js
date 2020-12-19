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

goog.module('myphysicslab.lab.controls.SliderControl');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.Event');

const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Creates a "slider plus textbox" control that displays and modifies the given {@link
ParameterNumber}. Consists of a label plus a slider and textbox which show the value of
the ParameterNumber. Modifying the slider changes the value of the ParameterNumber, as
does editing the number in the textbox.

In most browsers you can use the arrow keys to adjust the value after clicking on the
slider. Some browsers highlight the slider when it is active.

The HTML elements created are wrapped in a single `<div>` element. The slider has a
classname of `slider` for CSS scripting. The label is just text within the `<div>`.

SliderControl Math
------------------

The value of the SliderControl can only roughly match the value of the ParameterNumber
because *SliderControl can only take on discrete values*. In the following,
`sliderIndex` means the value of the HTML range element, which is an integer from 0 to
`increments`.

SliderControl can multiply or add a factor to move between increments.  If it
adds, the relationships are:

    delta = (maximum - minimum)/increments
    value = minimum + delta*sliderIndex
    sliderIndex = Math.floor((value - minimum)/delta)

If it multiplies, the relationships are:

    delta = exp((ln(maximum) - ln(minimum)) / increments)
    value = minimum * (delta^sliderIndex)
    ln(value) = ln(minimum) + sliderIndex*ln(delta)
    sliderIndex = (ln(value) - ln(minimum)) / ln(delta)

Number Formatting
------------------

The number is formatted without any thousands separators and with the number of
fractional decimal places depending on the "mode".

+ **Fixed decimal places mode** shows the number of decimal places given by
{@link #getDecimalPlaces}.
Ignores significant digits setting. *Fixed decimal places mode* is active when
`getDecimalPlaces()` returns 0 or greater.

+ **Variable decimal places mode** ensures that the requested number of significant
digits are visible. Adjusts decimal places shown based on the magnitude of the value.
See {@link #setSignifDigits}. *Variable decimal places mode* is active when
`getDecimalPlaces()` returns –1.

The default settings are gotten from the ParameterNumber:
see {@link ParameterNumber#setDecimalPlaces}
and {@link ParameterNumber#setSignifDigits}.

The displayed value is rounded to a certain number of digits, and therefore the
displayed value can differ from the target value. SliderControl allows for
this difference by only making changes to the target value when the the user
modifies the displayed value, or when {@link #setValue} is called.

Preventing Forbidden Values
---------------------------

To prevent the user from entering forbidden values (such as enforcing upper or lower
limits) the setter function can throw an Error. An alert is displayed to the user with
the text of the Error. After dismissing the alert, the displayed value will be restored
to match the current target value, as returned by the `getter`. (Note that the user's
input is discarded).

How SliderControl Works
-----------------------

Both the slider and the text are approximations of the value of the ParameterNumber.
SliderControl allows for this difference by only making changes to the target value
when the the user modifies the displayed value, or when {@link #setValue} is called.

There are 3 entities to coordinate: ParameterNumber, textbox, slider. Each has its own
notion of the current value; changes can come from any of the 3 entities. The textbox
and slider are limited in the values they can represent because of rounding in textbox
or increments in slider. Essentially we need to:

+ Distinguish between a *genuine change* vs. events coming thru as a result of
updating a control or ParameterNumber in response to a genuine change (we can call
these 'echo events').

+  when a genuine change occurs, update all 3 entities.

The ParameterNumber can take on any value allowed by the ParameterNumber's upper and
lower limits. If the ParameterNumber takes on a value outside the range of the slider,
then the slider will be at its min or max position.

Odd Behavior in Browsers
------------------------

+ In all browsers, clicking in the slider area moves the thumb to that position. In
Safari and Chrome, clicking directly on the thumb does not change the value. But in
Firefox, clicking directly on the thumb does "move to that position" which results in
the value being set to the nearest increment.

+ Safari does not visually highlight the thumb after clicking it.

+ In Safari, to be able to "tab select" to get to the slider, turn on the option in
Preferences>Advanced called "Press Tab to highlight each item on a webpage".

History
-------
In an earlier version the slider and text box were both contained in a `<label>`
element. This caused confusion because click events would be passed to the `for` entity
of the label. The `for` attribute of a label seems to be the first control unless it is
explicitly specified. The solution is to not use `<label>` for grouping the slider
elements, but use a `<div>` instead.

* @implements {LabControl}
* @implements {Observer}
*/
class SliderControl {
/**
* @param {!ParameterNumber} parameter the ParameterNumber to
      display and control
* @param {number} min  the minimum value that the slider can reach
* @param {number} max  the maximum value that the slider can reach
* @param {boolean=} multiply whether the slider increases by multiplying or adding the
*     delta for each step; default is `false` meaning "add"
* @param {number=} increments  the number of increments, between max and min,
*     that the value can take on; default is 100
*/
constructor(parameter, min, max, multiply, increments) {
  /**
  * @type {!ParameterNumber}
  * @private
  */
  this.parameter_ = parameter;
  /**
  * @type {number}
  * @private
  */
  this.min_ = min;
  var lowerLimit = parameter.getLowerLimit();
  if (lowerLimit > min) {
    throw 'lower limit on slider ='+Util.NF(min)
        +' is less than parameter lower limit ='+Util.NF(lowerLimit);
  }
  /**
  * @type {number}
  * @private
  */
  this.max_ = max;
  if (min >= max) {
    throw 'min >= max';
  }
  var upperLimit = parameter.getUpperLimit();
  if (upperLimit < max) {
    throw 'upper limit on slider ='+Util.NF(max)
        +' is greater than parameter upper limit ='+Util.NF(upperLimit);
  }
  /**
  * @type {number}
  * @private
  */
  this.increments_ = increments || 100;
  if (increments < 2) {
    throw 'increments < 2';
  }
  /**
  * @type {boolean}
  * @private
  */
  this.multiply_ = multiply == true;
  if (multiply && min <= 0) {
    // cannot have exponential control that goes to zero or negative
    throw 'slider cannot have min <= 0 and also exponential scale';
  }
  /**
  * @type {number}
  * @private
  */
  this.delta_ = SliderControl.rangeToDelta(min, max, this.increments_, this.multiply_);
  /** The number of significant digits to display.
  * @type {number}
  * @private
  */
  this.signifDigits_ = parameter.getSignifDigits();
  /** Fixed number of fractional decimal places to show, or -1 if variable.
  * @type {number}
  * @private
  */
  this.decimalPlaces_ = parameter.getDecimalPlaces();
  /** The number of columns (characters) shown in the text field.
  * @type {number}
  * @private
  */
  this.columns_ = Math.max(8, 1+this.signifDigits_);
  /** The exact value of the Parameter as last seen by this control;
   note that the displayed value may be different due to rounding.
  * @type {number}
  * @private
  */
  this.paramValue_ = parameter.getValue();
  goog.asserts.assert( goog.isNumber(this.paramValue_) );
  /**
  * @type {!HTMLInputElement}
  * @private
  */
  this.slider_ = /** @type {!HTMLInputElement} */(document.createElement('input'));
  this.slider_.type = 'range';
  if (this.slider_.type == 'text') {
    throw 'cannot make slider';
  };
  this.slider_.min = '0';
  this.slider_.max = String(this.increments_);
  this.slider_.step = '1';
  this.slider_.value = String(this.valueToIncrement(this.paramValue_));
  /** The value according to the slider control; used to detect when user has
  * intentionally changed the value.  This value can change only by
  * discrete increments therefore it only approximates the current parameter value.
  * @type {number}
  * @private
  */
  this.sliderValue_ = this.incrementToValue(Number(this.slider_.value));
  /** the text field showing the double value
  * @type {!HTMLInputElement}
  * @private
  */
  this.textField_ = /** @type {!HTMLInputElement} */(document.createElement('input'));
  this.textField_.type = 'text';
  this.textField_.size = this.columns_;

  /**
  * @type {!Element}
  * @private
  */
  this.label_ = document.createElement('DIV');
  this.label_.className = 'slider';
  this.label_.appendChild(document.createTextNode(
      parameter.getName(/*localized=*/true))+parameter.getUnits());
  this.label_.appendChild(this.slider_);
  this.label_.appendChild(this.textField_);
  /** The last value that the text field was set to, used to detect when user has
  intentionally changed the value;  note that the parameter value will be different
  than this because of rounding.
  * @type {string}
  * @private
  */
  this.textboxValue_ = '';
  this.textField_.textAlign = 'right';
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.sliderKey_ = goog.events.listen(this.slider_, goog.events.EventType.INPUT,
      /*callback=*/this.sliderChange, /*capture=*/true, this);
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.sliderKey2_ = goog.events.listen(this.slider_, goog.events.EventType.CHANGE,
      /*callback=*/this.sliderChange, /*capture=*/true, this);
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.clickKey2_ = goog.events.listen(this.slider_, goog.events.EventType.CLICK,
      /*callback=*/this.doClick2, /*capture=*/true, this);
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.changeKey_ = goog.events.listen(this.textField_, goog.events.EventType.CHANGE,
      /*callback=*/this.validateText, /*capture=*/true, this);
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.focusKey_ = goog.events.listen(this.textField_, goog.events.EventType.FOCUS,
      /*callback=*/this.gainFocus, /*capture=*/false, this);
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.clickKey_ = goog.events.listen(this.textField_, goog.events.EventType.CLICK,
      /*callback=*/this.doClick, /*capture=*/true, this);
  /**  True when first click in field after gaining focus.
  * @type {boolean}
  * @private
  */
  this.firstClick_ = false;
  this.formatTextField();
  this.parameter_.getSubject().addObserver(this);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', paramValue_: '+Util.NF(this.paramValue_)
      +', sliderValue_: '+Util.NF(this.sliderValue_)
      +', slider_.value: '+this.slider_.value
      +', textboxValue_: '+this.textboxValue_
      +', min_: '+Util.NF(this.min_)
      +', max_: '+Util.NF(this.max_)
      +', increments_: '+this.increments_
      +', delta_: '+Util.NF(this.delta_)
      +', multiply_: '+this.multiply_
      +', signifDigits_: '+this.signifDigits_
      +', decimalPlaces_: '+this.decimalPlaces_
      +', columns_: '+this.columns_
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' :
      'SliderControl{parameter: '+this.parameter_.toStringShort()+'}';
};

/** Returns the number of columns needed to show the number `x`
with the given number of significant digits.
@param {number} x the number to display
@param {number} sigDigits the number of significant digits to show
@return {number} the number of columns needed
@private
*/
columnsNeeded(x, sigDigits) {
  var mag = SliderControl.magnitude(x);
  return 2 + this.decimalPlacesNeeded(x, sigDigits) + (mag > 0 ? mag : 0);
};

/** Returns the number of fractional decimal places needed to show the number
`x` with the given number of significant digits.
@param {number} x the number to display
@param {number} sigDigits the number of significant digits to show
@return {number} the number of fractional decimal places needed
@private
*/
decimalPlacesNeeded(x, sigDigits) {
  if (this.decimalPlaces_ > -1) {
    return this.decimalPlaces_;
  } else {
    var d = sigDigits - 1 - SliderControl.magnitude(x);
    // limit of 16 decimal places; this could be a settable option.
    if (d > 16)
      d = 16;
    return d > 0 ? d : 0;
  }
};

/** @override */
disconnect() {
  this.parameter_.getSubject().removeObserver(this);
  goog.events.unlistenByKey(this.sliderKey_);
  goog.events.unlistenByKey(this.sliderKey2_);
  goog.events.unlistenByKey(this.changeKey_);
  goog.events.unlistenByKey(this.clickKey_);
  goog.events.unlistenByKey(this.clickKey2_);
  goog.events.unlistenByKey(this.focusKey_);
};

/**
* @param {!goog.events.Event} evt the event that caused this callback to fire
* @private
*/
doClick(evt) {
  if (this.firstClick_) {
    // first click after gaining focus should select entire field
    this.textField_.select();
    this.firstClick_ = false;
  }
};

/**
* @param {!goog.events.Event} evt the event that caused this callback to fire
* @private
*/
doClick2(evt) {
  this.slider_.focus();
};

/**  Sets the text field to match this.paramValue_ (or as close as possible with
* rounding).
* @return {undefined}
* @private
*/
formatTextField() {
  var dec = this.decimalPlacesNeeded(this.paramValue_, this.signifDigits_);
  var col = this.columnsNeeded(this.paramValue_, this.signifDigits_);
  // console.log('columnsNeeded '+col+' dec='+dec+' x='
  //      +Util.NFE(this.paramValue_)+' '+this.parameter_.getName());
  this.textboxValue_ = this.paramValue_.toFixed(dec);
  this.textField_.value = this.textboxValue_;
  if (col != this.columns_) {
    this.columns_ = col;
    this.textField_.size =this.columns_;
  }
};

/**
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
gainFocus(event) {
  this.firstClick_ = true;
};

/** Returns the fixed number of fractional decimal places to show when formatting
the number, or –1 when in *variable decimal places mode*.
@return {number} the fixed number of fractional decimal places to show when formatting
    the number, or –1 when in *variable decimal places mode*.
*/
getDecimalPlaces() {
  return this.decimalPlaces_;
};

/** @override */
getElement() {
  return this.label_;
};

/** @override */
getParameter() {
  return this.parameter_;
};

/** Returns the number of significant digits to show when formatting the number. Only
has an effect in *variable decimal places mode*, see {@link #getDecimalPlaces}.
@return {number} the number of significant digits to show when formatting the number
*/
getSignifDigits() {
  return this.signifDigits_;
};

/** Returns the value of this control (which should match the Parameter value if
{@link #observe} is being called).
@return {number} the value that this control is currently displaying
*/
getValue() {
  return this.paramValue_;
};

/**
* @param {number} increment
* @return {number}
* @private
*/
incrementToValue(increment) {
  if (this.multiply_) {
    return this.min_ * Math.pow(this.delta_, increment);
  } else {
    return this.min_ + increment*this.delta_;
  }
};

/**
* @param {number} x
* @return {number}
* @private
*/
static magnitude(x) {
  if (Math.abs(x) < 1E-15) {
    // fix for displaying zero.
    return 0;
  } else {
    return Math.floor(Math.LOG10E * Math.log(Math.abs(x)));
  }
};

/** @override */
observe(event) {
  // only update when this parameter has changed
  if (event == this.parameter_) {
    // Ensure that the correct value is displayed by the control.
    this.setValue(this.parameter_.getValue());
  }
};

/**
* @param {number} min
* @param {number} max
* @param {number} increments
* @param {boolean} multiply
* @return {number}
* @private
*/
static rangeToDelta(min, max, increments, multiply) {
  if (multiply) {
    return Math.exp((Math.log(max) - Math.log(min))/increments);
  } else {
    return (max - min)/increments;
  }
};

/** Sets the fixed number of fractional decimal places to show when formatting the
number, or puts this SliderControl into *variable decimal places mode* where
the number of decimal places depends on the desired number of significant digits.
See {@link #setSignifDigits}.
@param {number} decimalPlaces the fixed number of fractional decimal places to show when
    formatting the number, or –1 to have variable number of fractional decimal places.
@return {!SliderControl} this SliderControl for chaining
    setters
*/
setDecimalPlaces(decimalPlaces) {
  if (this.decimalPlaces_ != decimalPlaces) {
    this.decimalPlaces_ = decimalPlaces > -1 ? decimalPlaces : -1;
    this.formatTextField();
  }
  return this;
};

/** @override */
setEnabled(enabled) {
  this.textField_.disabled = !enabled;
};

/** Sets the number of significant digits to show when formatting the number. Only
has an effect in *variable decimal places mode*, see {@link #setDecimalPlaces}.
@param {number} signifDigits the number of significant digits to show when
    formatting the number
@return {!SliderControl} this object for chaining setters
*/
setSignifDigits(signifDigits) {
  if (this.signifDigits_ != signifDigits) {
    this.signifDigits_ = signifDigits;
    this.formatTextField();
  }
  return this;
};

/** Changes the value shown by this control, and sets the corresponding
ParameterNumber to this value.
@param {number} value  the new value
@throws {!Error} if value is NaN (not a number)
*/
setValue(value) {
  if (value != this.paramValue_) {
    //console.log('SliderControl.setValue value='+value+' vs '+this.paramValue_);
    if (isNaN(value)) {
      throw 'not a number: '+value;
    }
    try {
      // set this.paramValue_ first to prevent the observe() coming here twice
      this.paramValue_ = value;
      // parameter_.setValue() broadcasts which causes observe() to be called here
      this.parameter_.setValue(value);
    } catch(ex) {
      alert(ex);
      this.paramValue_ = this.parameter_.getValue();
    }
    this.formatTextField();
    // note that the scroll can only reach certain discrete values,
    // so its positioning will only approximate this.value
    var incr = this.valueToIncrement(this.paramValue_);
    // We store the sliderValue to be able to ignore upcoming "slider changed" event.
    this.sliderValue_ = this.incrementToValue(incr);
    // Note that this will fire a 'slider changed' event
    this.slider_.value = String(incr);
  }
};

/** Called when slider changes value.
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
sliderChange(event) {
  var newValue = this.incrementToValue(Number(this.slider_.value));
  if (Util.veryDifferent(newValue, this.sliderValue_)) {
    this.setValue(newValue);
  }
};

/** Checks that an entered number is a valid number, updates the double value
* if valid, otherwise restores the old value.
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
validateText(event) {
  // trim whitespace from start and end of string
  var newValue = this.textField_.value.trim();
  // Compare the current and previous text value of the field.
  // Note that the double value may be different from the text value because
  // of rounding.
  if (newValue != this.textboxValue_) {
    var value = parseFloat(newValue);
    if (isNaN(value)) {
      alert('not a number: '+newValue);
      this.formatTextField();
    } else {
      this.setValue(value);
    }
  }
};

/**
* @param {number} value
* @return {number}
* @private
*/
valueToIncrement(value) {
  if (this.multiply_) {
    return Math.floor(0.5+(Math.log(value) - Math.log(this.min_)) /
        Math.log(this.delta_));
  } else {
    return Math.floor(0.5+(value - this.min_) / this.delta_);
  }
};

} // end class
exports = SliderControl;
