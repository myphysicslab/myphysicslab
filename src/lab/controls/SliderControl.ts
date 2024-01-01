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

import { LabControl } from './LabControl.js';
import { Observer, Parameter, SubjectEvent, ParameterNumber } from '../util/Observe.js'
import { Util } from '../util/Util.js';

/** Creates a "slider plus textbox" control that displays and modifies the given
{@link ParameterNumber}. Consists of a label plus a slider and textbox
which show the value of the ParameterNumber. Modifying the slider changes the value of
the ParameterNumber, as does editing the number in the textbox.

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
```text
delta = (maximum - minimum)/increments
value = minimum + delta*sliderIndex
sliderIndex = Math.floor((value - minimum)/delta)
```
If it multiplies, the relationships are:
```text
delta = exp((ln(maximum) - ln(minimum)) / increments)
value = minimum * (delta^sliderIndex)
ln(value) = ln(minimum) + sliderIndex*ln(delta)
sliderIndex = (ln(value) - ln(minimum)) / ln(delta)
```

Number Formatting
------------------

The number is formatted without any thousands separators and with the number of
fractional decimal places depending on the "mode".

+ **Fixed decimal places mode** shows the number of decimal places given by
{@link getDecimalPlaces}.
Ignores significant digits setting. *Fixed decimal places mode* is active when
`getDecimalPlaces()` returns 0 or greater.

+ **Variable decimal places mode** ensures that the requested number of significant
digits are visible. Adjusts decimal places shown based on the magnitude of the value.
See {@link setSignifDigits}. *Variable decimal places mode* is active when
`getDecimalPlaces()` returns –1.

The default settings are gotten from the ParameterNumber:
see {@link ParameterNumber.setDecimalPlaces}
and {@link ParameterNumber.setSignifDigits}.

The displayed value is rounded to a certain number of digits, and therefore the
displayed value can differ from the target value. SliderControl allows for
this difference by only making changes to the target value when the the user
modifies the displayed value, or when {@link setValue} is called.

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
when the the user modifies the displayed value, or when {@link setValue}
is called.

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

*/
export class SliderControl implements Observer, LabControl {
  private parameter_: ParameterNumber;
  private min_: number;
  private max_: number;
  private increments_: number;
  private multiply_: boolean;
  private delta_: number;
  /** The number of significant digits to display. */
  private signifDigits_: number;
  /** Fixed number of fractional decimal places to show, or -1 if variable. */
  private decimalPlaces_: number;
  /** The number of columns (characters) shown in the text field. */
  private columns_: number;
  /** The exact value of the Parameter as last seen by this control;
  * note that the displayed value may be different due to rounding.
  */
  private paramValue_: number;
  private slider_: HTMLInputElement;
  /** The value according to the slider control; used to detect when user has
  * intentionally changed the value.  This value can change only by
  * discrete increments therefore it only approximates the current parameter value.
  */
  private sliderValue_: number;
  /** the text field showing the double value */
  private textField_: HTMLInputElement;
  private label_: HTMLDivElement;
  /** The last value that the text field was set to, used to detect when user has
  * intentionally changed the value;  note that the parameter value will be different
  * than this because of rounding.
  */
  private textboxValue_: string = '';
  /**  True when first click in field after gaining focus. */
  private firstClick_: boolean = false;
  private changeSliderFn_: (e:Event)=>void;
  private clickSliderFn_: (e:Event)=>void;
  private validateTextFn_: (e:Event)=>void;
  private focusTextFn_: (e:Event)=>void;
  private clickTextFn_: (e:Event)=>void;

/**
* @param parameter the ParameterNumber to
*       display and control
* @param min  the minimum value that the slider can reach
* @param max  the maximum value that the slider can reach
* @param multiply whether the slider increases by multiplying or adding the
*     delta for each step; default is `false` meaning "add"
* @param increments  the number of increments, between max and min,
*     that the value can take on; default is 100
*/
constructor(parameter: ParameterNumber, min: number, max: number, multiply?: boolean, increments?: number) {
  this.parameter_ = parameter;
  this.min_ = min;
  const lowerLimit = parameter.getLowerLimit();
  if (lowerLimit > min) {
    throw 'lower limit on slider ='+Util.NF(min)
        +' is less than parameter lower limit ='+Util.NF(lowerLimit);
  }
  this.max_ = max;
  if (min >= max) {
    throw 'min >= max';
  }
  const upperLimit = parameter.getUpperLimit();
  if (upperLimit < max) {
    throw 'upper limit on slider ='+Util.NF(max)
        +' is greater than parameter upper limit ='+Util.NF(upperLimit);
  }
  this.increments_ = increments || 100;
  if (this.increments_ < 2) {
    throw 'increments < 2';
  }
  this.multiply_ = multiply ?? true;
  if (this.multiply_ && min <= 0) {
    // cannot have exponential control that goes to zero or negative
    throw 'slider cannot have min <= 0 and also exponential scale';
  }
  this.delta_ = SliderControl.rangeToDelta(min, max, this.increments_, this.multiply_);
  this.signifDigits_ = parameter.getSignifDigits();
  this.decimalPlaces_ = parameter.getDecimalPlaces();
  this.columns_ = Math.max(8, 1+this.signifDigits_);
  this.paramValue_ = parameter.getValue();
  Util.assert( typeof this.paramValue_ === 'number' );
  this.slider_ = document.createElement('input');
  this.slider_.type = 'range';
  if (this.slider_.type == 'text') {
    throw 'cannot make slider';
  };
  this.slider_.min = '0';
  this.slider_.max = String(this.increments_);
  this.slider_.step = '1';
  this.slider_.value = String(this.valueToIncrement(this.paramValue_));
  this.sliderValue_ = this.incrementToValue(Number(this.slider_.value));
  this.textField_ = document.createElement('input');
  this.textField_.type = 'text';
  this.textField_.size = this.columns_;

  this.label_ = document.createElement('div');
  this.label_.className = 'slider';
  this.label_.appendChild(document.createTextNode(
      parameter.getName(/*localized=*/true)+parameter.getUnits()));
  this.label_.appendChild(this.slider_);
  this.label_.appendChild(this.textField_);
  this.textField_.style.textAlign = 'right';
  
  this.changeSliderFn_ = this.changeSlider.bind(this);
  this.slider_.addEventListener('input', this.changeSliderFn_, /*capture=*/true);
  this.slider_.addEventListener('change', this.changeSliderFn_, /*capture=*/true);
  this.clickSliderFn_ = this.clickSlider.bind(this);
  this.slider_.addEventListener('click', this.clickSliderFn_, /*capture=*/true);
  this.validateTextFn_ = this.validateText.bind(this);
  this.textField_.addEventListener('change', this.validateTextFn_, /*capture=*/true);
  this.focusTextFn_ = this.focusText.bind(this);
  this.textField_.addEventListener('focus', this.focusTextFn_, /*capture=*/false);
  this.clickTextFn_ = this.clickText.bind(this);
  this.textField_.addEventListener('click', this.clickTextFn_, /*capture=*/true);
  this.formatTextField();
  this.parameter_.getSubject().addObserver(this);
};

/** @inheritDoc */
toString() {
  return this.toStringShort().slice(0, -1)
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

/** @inheritDoc */
toStringShort() {
  return 'SliderControl{parameter: '+this.parameter_.toStringShort()+'}';
};

/** Returns the number of columns needed to show the number `x`
with the given number of significant digits.
@param x the number to display
@param sigDigits the number of significant digits to show
@return the number of columns needed
*/
private columnsNeeded(x: number, sigDigits: number): number {
  const mag = SliderControl.magnitude(x);
  return 2 + this.decimalPlacesNeeded(x, sigDigits) + (mag > 0 ? mag : 0);
};

/** Returns the number of fractional decimal places needed to show the number
`x` with the given number of significant digits.
@param x the number to display
@param sigDigits the number of significant digits to show
@return the number of fractional decimal places needed
*/
private decimalPlacesNeeded(x: number, sigDigits: number): number {
  if (this.decimalPlaces_ > -1) {
    return this.decimalPlaces_;
  } else {
    let d = sigDigits - 1 - SliderControl.magnitude(x);
    // limit of 16 decimal places; this could be a settable option.
    if (d > 16) {
      d = 16;
    }
    return d > 0 ? d : 0;
  }
};

/** @inheritDoc */
disconnect(): void {
  this.parameter_.getSubject().removeObserver(this);
  this.slider_.removeEventListener('input', this.changeSliderFn_, /*capture=*/true);
  this.slider_.removeEventListener('change', this.changeSliderFn_, /*capture=*/true);
  this.slider_.removeEventListener('click', this.clickSliderFn_, /*capture=*/true);
  this.textField_.removeEventListener('change', this.validateTextFn_, /*capture=*/true);
  this.textField_.removeEventListener('focus', this.focusTextFn_, /*capture=*/false);
  this.textField_.removeEventListener('click', this.clickTextFn_, /*capture=*/true);
};

/**
* @param _evt the event that caused this callback to fire
*/
private clickText(_evt: Event): void {
  if (this.firstClick_) {
    // first click after gaining focus should select entire field
    this.textField_.select();
    this.firstClick_ = false;
  }
};

/**
* @param _evt the event that caused this callback to fire
*/
private clickSlider(_evt: Event): void {
  this.slider_.focus();
};

/**  Sets the text field to match this.paramValue_ (or as close as possible with
* rounding).
*/
private formatTextField(): void {
  const dec = this.decimalPlacesNeeded(this.paramValue_, this.signifDigits_);
  const col = this.columnsNeeded(this.paramValue_, this.signifDigits_);
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
* @param _event the event that caused this callback to fire
*/
private focusText(_event: Event): void {
  this.firstClick_ = true;
};

/** Returns the fixed number of fractional decimal places to show when formatting
the number, or –1 when in *variable decimal places mode*.
@return the fixed number of fractional decimal places to show when formatting
    the number, or –1 when in *variable decimal places mode*.
*/
getDecimalPlaces(): number {
  return this.decimalPlaces_;
};

/** @inheritDoc */
getElement(): HTMLElement {
  return this.label_;
};

/** @inheritDoc */
getParameter(): null|Parameter {
  return this.parameter_;
};

/** Returns the number of significant digits to show when formatting the number. Only
has an effect in *variable decimal places mode*,
see {@link getDecimalPlaces}.
@return the number of significant digits to show when formatting the number
*/
getSignifDigits(): number {
  return this.signifDigits_;
};

/** Returns the value of this control (which should match the Parameter value if
{@link observe} is being called).
@return the value that this control is currently displaying
*/
getValue(): number {
  return this.paramValue_;
};

private incrementToValue(increment: number): number {
  if (this.multiply_) {
    return this.min_ * Math.pow(this.delta_, increment);
  } else {
    return this.min_ + increment*this.delta_;
  }
};

private static magnitude(x: number): number {
  if (Math.abs(x) < 1E-15) {
    // fix for displaying zero.
    return 0;
  } else {
    return Math.floor(Math.LOG10E * Math.log(Math.abs(x)));
  }
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  // only update when this parameter has changed
  if (event == this.parameter_) {
    // Ensure that the correct value is displayed by the control.
    this.setValue(this.parameter_.getValue());
  }
};

private static rangeToDelta(min: number, max: number, increments: number,
    multiply: boolean): number {
  if (multiply) {
    return Math.exp((Math.log(max) - Math.log(min))/increments);
  } else {
    return (max - min)/increments;
  }
};

/** Sets the fixed number of fractional decimal places to show when formatting the
number, or puts this SliderControl into *variable decimal places mode* where
the number of decimal places depends on the desired number of significant digits.
See {@link setSignifDigits}.
@param decimalPlaces the fixed number of fractional decimal places to show when
    formatting the number, or –1 to have variable number of fractional decimal places.
@return this SliderControl for chaining
    setters
*/
setDecimalPlaces(decimalPlaces: number): SliderControl {
  if (this.decimalPlaces_ != decimalPlaces) {
    this.decimalPlaces_ = decimalPlaces > -1 ? decimalPlaces : -1;
    this.formatTextField();
  }
  return this;
};

/** @inheritDoc */
setEnabled(enabled: boolean): void {
  this.textField_.disabled = !enabled;
  this.slider_.disabled = !enabled;
};

/** Sets the number of significant digits to show when formatting the number. Only
has an effect in *variable decimal places mode*,
see {@link setDecimalPlaces}.
@param signifDigits the number of significant digits to show when
    formatting the number
@return this object for chaining setters
*/
setSignifDigits(signifDigits: number): SliderControl {
  if (this.signifDigits_ != signifDigits) {
    this.signifDigits_ = signifDigits;
    this.formatTextField();
  }
  return this;
};

/** Changes the value shown by this control, and sets the corresponding
ParameterNumber to this value.
@param value  the new value
@throws if value is NaN (not a number)
*/
setValue(value: number): void {
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
    const incr = this.valueToIncrement(this.paramValue_);
    // We store the sliderValue to be able to ignore upcoming "slider changed" event.
    this.sliderValue_ = this.incrementToValue(incr);
    // Note that this will fire a 'slider changed' event
    this.slider_.value = String(incr);
  }
};

/** Called when slider changes value.
* @param _event the event that caused this callback to fire
*/
private changeSlider(_event: Event): void {
  const newValue = this.incrementToValue(Number(this.slider_.value));
  if (Util.veryDifferent(newValue, this.sliderValue_)) {
    this.setValue(newValue);
  }
};

/** Checks that an entered number is a valid number, updates the double value
* if valid, otherwise restores the old value.
* @param _event the event that caused this callback to fire
*/
private validateText(_event: Event): void {
  // trim whitespace from start and end of string
  const newValue = this.textField_.value.trim();
  // Compare the current and previous text value of the field.
  // Note that the double value may be different from the text value because
  // of rounding.
  if (newValue != this.textboxValue_) {
    const value = parseFloat(newValue);
    if (isNaN(value)) {
      alert('not a number: '+newValue);
      this.formatTextField();
    } else {
      this.setValue(value);
    }
  }
};

private valueToIncrement(value: number): number {
  if (this.multiply_) {
    return Math.floor(0.5+(Math.log(value) - Math.log(this.min_)) /
        Math.log(this.delta_));
  } else {
    return Math.floor(0.5+(value - this.min_) / this.delta_);
  }
};

} // end class
Util.defineGlobal('lab$controls$SliderControl', SliderControl);
