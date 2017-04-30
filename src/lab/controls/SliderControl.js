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

goog.provide('myphysicslab.lab.controls.SliderControl');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.controls.LabControl');

goog.scope(function() {

var ParameterNumber = myphysicslab.lab.util.ParameterNumber;
var Util = myphysicslab.lab.util.Util;
var NF = myphysicslab.lab.util.Util.NF;

/** Creates a 'slider plus textbox' control that displays and modifies the given
ParameterNumber. Consists of a label plus a slider and textbox which show the value of
the ParameterNumber. Modifying the slider changes the value of the ParameterNumber, as
does editting the number in the textbox.

The HTML elements created are wrapped in a DIV.  The slider has a classname of
'slider' for CSS scripting.  The label is just text within the DIV.

SliderControl takes on discrete values. The value of the SliderControl may only roughly
match the value of the ParameterNumber because it can only take on discrete values. In
the following `sliderIndex` means the value of the HTML range element, which is an
integer from 0 to `increments`.

SliderControl can multiply or add a factor to get between increments.  If it
adds, the relationships are:

    delta = (maximum - minimum)/increments
    value = minimum + delta*sliderIndex
    sliderIndex = Math.floor((value - minimum)/delta)

If it multiplies, the relationships are:

    delta = exp((ln(maximum) - ln(minimum)) / increments)
    value = minimum * (delta^sliderIndex)
    ln(value) = ln(minimum) + sliderIndex*ln(delta)
    sliderIndex = (ln(value) - ln(minimum)) / ln(delta)

How It Works
------------

SliderControl takes on discrete values, so what happens when the value it is tracking is
between those discrete values? The answer is that SliderControl moves its slider to the
nearest position to that value, but does not force the value to match the corresponding
discrete value. It is important that when the ParameterNumber is modified by some other
entity, the SliderControl does not force the ParameterNumber value to become one of the
discrete values it can represent.

There are 3 entities to coordinate: ParameterNumber, textbox, slider. Each has its own
notion of the current value; changes can come from any of the 3 entities. The textbox
and slider are limited in the values they can represent because of rounding in textbox
or increments in slider. Essentially we need to:

+ Distinguish between a **genuine change** vs. events coming thru as a result of
updating a control or ParameterNumber in response to a genuine change (we can call these
'echo events').

+  when a genuine change occurs, update all 3 entities.

The ParameterNumber, and the textbox can take on any value allowed by the
ParameterNumber, which are limited by the ParameterNumber's upper and lower limits. If
the ParameterNumber takes on a value outside the range of the slider, then the slider
will be at its min or max position.


Odd Behavior in Browsers
------------------------

* **Firefox:** In all browsers, clicking in the slider area moves the thumb to that
position. In Safari and Chrome, clicking on the thumb does not change the value. But in
Safari, clicking on the thumb does 'move to that position' which results in the value
changing unexpectedly.

* **Chrome:** Does not keep the thumb visually highlighted after clicking it (see
`doClick2` where we call `focus()` method on the slider). Other browsers (Safari,
Firefox) do keep the thumb highlighted. But it seems the slider still has focus because
you can use arrow keys in Chrome, after which the thumb is highlighted. There is a bug
about this from 2011: [Issue 89698: input type=range should allow keyboard control by
default](https://code.google.com/p/chromium/issues/detail?id=89698)

History
-------
In an earlier version the slider and text box were both contained in a
LABEL element. This caused confusion because click events would be passed to the 'for'
control. The 'for' control of the LABEL seems to be the first control unless it is
explicitly specified. The solution is to not use LABEL for grouping the slider elements,
but use a DIV instead.

* @param {!ParameterNumber} parameter the ParameterNumber to
      display and control
* @param {number} min  the minimum value that the parameter can take on
* @param {number} max  the maximum value that the parameter can take on
* @param {boolean=} multiply whether the slider increases by multiplying or adding the
*     delta for each step; default is `false` meaning 'add'
* @param {number=} increments  the number of increments, between max and min,
*     that the value can take on
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.controls.LabControl}
* @implements {myphysicslab.lab.util.Observer}
*/
myphysicslab.lab.controls.SliderControl = function(parameter, min, max, multiply,
      increments) {
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
    throw new Error('lower limit on slider ='+NF(min)
        +' is less than parameter lower limit ='+NF(lowerLimit));
  }
  /**
  * @type {number}
  * @private
  */
  this.max_ = max;
  if (min >= max) {
    throw new Error('min >= max');
  }
  var upperLimit = parameter.getUpperLimit();
  if (upperLimit < max) {
    throw new Error('upper limit on slider ='+NF(max)
        +' is greater than parameter upper limit ='+NF(upperLimit));
  }
  /**
  * @type {number}
  * @private
  */
  this.increments_ = increments || 100;
  if (increments < 2) {
    throw new Error('increments < 2');
  }
  /**
  * @type {boolean}
  * @private
  */
  this.multiply_ = multiply == true;
  if (multiply && min <= 0) {
    // cannot have exponential control that goes to zero or negative
    throw new Error('slider cannot have min <= 0 and also exponential scale');
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
  this.sigDigits_ = parameter.getSignifDigits();
  /** Fixed number of fractional decimal places to show, or -1 if variable.
  * @type {number}
  * @private
  */
  this.decimalPlaces_ = parameter.getDecimalPlaces();
  /** The number of columns (characters) shown in the text field.
  * @type {number}
  * @private
  */
  this.columns_ = Math.max(8, 1+this.sigDigits_);
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
    throw new Error('cannot make slider');
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
  this.sliderValue_ = Number(this.slider_.value);
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
      parameter.getName(/*localized=*/true)));
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
var SliderControl = myphysicslab.lab.controls.SliderControl;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  SliderControl.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', paramValue_: '+NF(this.paramValue_)
        +', sliderValue_: '+NF(this.sliderValue_)
        +', slider_.value: '+this.slider_.value
        +', textboxValue_: '+this.textboxValue_
        +', min_: '+NF(this.min_)
        +', max_: '+NF(this.max_)
        +', increments_: '+this.increments_
        +', delta_: '+NF(this.delta_)
        +', multiply_: '+this.multiply_
        +', sigDigits_: '+this.sigDigits_
        +', decimalPlaces_: '+this.decimalPlaces_
        +', columns_: '+this.columns_
        +'}';
  };

  /** @inheritDoc */
  SliderControl.prototype.toStringShort = function() {
    return 'SliderControl{parameter: '+this.parameter_.toStringShort()+'}';
  };
}

/** Returns the number of columns needed to show the number `x`
with the given number of significant digits.
@param {number} x the number to display
@param {number} sigDigits the number of significant digits to show
@return {number} the number of columns needed
@private
*/
SliderControl.prototype.columnsNeeded = function(x, sigDigits) {
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
SliderControl.prototype.decimalPlacesNeeded = function(x, sigDigits) {
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

/** @inheritDoc */
SliderControl.prototype.disconnect = function() {
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
SliderControl.prototype.doClick = function(evt) {
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
SliderControl.prototype.doClick2 = function(evt) {
  this.slider_.focus();
};

/**  Sets the text field to match this.paramValue_ (or as close as possible with
* rounding).
* @return {undefined}
* @private
*/
SliderControl.prototype.formatTextField = function() {
  var dec = this.decimalPlacesNeeded(this.paramValue_, this.sigDigits_);
  var col = this.columnsNeeded(this.paramValue_, this.sigDigits_);
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
SliderControl.prototype.gainFocus = function(event) {
  this.firstClick_ = true;
};

/** Returns the fixed number of fractional decimal places to show when formatting
the number.
@return {number} the fixed number of fractional decimal places to show when formatting
    the number, or -1 to have variable number of fractional decimal places.
*/
SliderControl.prototype.getDecimalPlaces = function() {
  return this.decimalPlaces_;
};

/** @inheritDoc */
SliderControl.prototype.getElement = function() {
  return this.label_;
};

/** @inheritDoc */
SliderControl.prototype.getParameter = function() {
  return this.parameter_;
};

/** Returns the value of the control, which might be different from the value
of the parameter.
@return {number} the value that this control is currently displaying
*/
SliderControl.prototype.getValue = function() {
  return this.paramValue_;
};

/**
* @param {number} increment
* @return {number}
* @private
*/
SliderControl.prototype.incrementToValue = function(increment) {
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
SliderControl.magnitude = function(x) {
  if (Math.abs(x) < 1E-15) {
    // fix for displaying zero.
    return 0;
  } else {
    return Math.floor(Math.LOG10E * Math.log(Math.abs(x)));
  }
};

/** @inheritDoc */
SliderControl.prototype.observe =  function(event) {
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
SliderControl.rangeToDelta = function(min, max, increments, multiply) {
  if (multiply) {
    return Math.exp((Math.log(max) - Math.log(min))/increments);
  } else {
    return (max - min)/increments;
  }
};

/** Sets the fixed number of fractional decimal places to show when formatting the
number, or puts this SliderControl into 'variable decimal places' mode where
the number of decimal places depends on the desired number of significant digits for
the ParameterNumber.
@param {number} decimalPlaces the fixed number of fractional decimal places to show when
    formatting the number, or -1 to have variable number of fractional decimal places.
@return {!SliderControl} this SliderControl for chaining
    setters
*/
SliderControl.prototype.setDecimalPlaces = function(decimalPlaces) {
  this.decimalPlaces_ = decimalPlaces > -1 ? decimalPlaces : -1;
  this.formatTextField();
  return this;
};

/** @inheritDoc */
SliderControl.prototype.setEnabled = function(enabled) {
  this.textField_.disabled = !enabled;
};

/** Changes the value shown by this control, and sets the corresponding
ParameterNumber to this value.
@throws {Error} if value is NaN (not a number)
@param {number} value  the new value
@protected
*/
SliderControl.prototype.setValue = function(value) {
  if (value != this.paramValue_) {
    //console.log('SliderControl.setValue value='+value+' vs '+this.paramValue_);
    if (isNaN(value)) {
      throw new Error('not a number: '+value);
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
    this.sliderValue_ = this.incrementToValue(incr);
    // note that this will fire a 'slider changed' event
    this.slider_.value = String(incr);
  }
};

/** Called when slider changes value.
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
SliderControl.prototype.sliderChange = function(event) {
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
SliderControl.prototype.validateText = function(event) {
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
SliderControl.prototype.valueToIncrement = function(value) {
  if (this.multiply_) {
    return Math.floor(0.5+(Math.log(value) - Math.log(this.min_)) /
        Math.log(this.delta_));
  } else {
    return Math.floor(0.5+(value - this.min_) / this.delta_);
  }
};

}); // goog.scope
