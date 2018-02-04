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

goog.module('myphysicslab.test.TestRig');

const ExpectedPerf = goog.require('myphysicslab.test.ExpectedPerf');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Static class that provides common test functions such as `runTest`.

When using these test functions, be sure to set the `testName` class variable.

## Why the testName class property exists

We can't get the name of the current test function from the stack in
Javascript. There are ways to do it, but the Error.stack property is
non-standard (Chrome and Firefox only); and using arguments.callee.caller is standard
but deprecated; and in either case we still have to prevent Google Closure from mangling
the name of the function when compiled.  So it seems to be safer and easier to just
stuff the name of the current test into the testName variable.  Plus, we can add other
information about the test, such as additional test parameters that vary between runs
of the test.
*/
class TestRig {
/**
* @private
*/
constructor() {
  throw new Error();
};

/** Returns the name of this machine, which should be stored in the global
* variable `MYPHYSICSLAB_MACHINE_NAME`.  That global is set in the file
* `MachineName.js` (which is not checked in to the source repository, see
* the file `sampleMachineName.js`).
* @return {string} the name of this machine, or `UNKNOWN_MACHINE`
*/
static getMachineName() {
  if (window.hasOwnProperty(TestRig.machineName)) {
    var s = window[TestRig.machineName];
    if (goog.isString(s)) {
      return s;
    }
  }
  if (Util.DEBUG) {
    console.log('TestRig.getMachineName: not defined '
        +TestRig.machineName);
  }
  return 'UNKNOWN_MACHINE';
};

/** Returns name of the browser we are running under;  returns 'other' for
unrecognized browsers.
* @return {string}
*/
static getBrowserName() {
  var nav = navigator;
  if (nav == null)
    return 'unknown';
  if (nav.userAgent.match(/.*Chrome.*/) != null)
    return TestRig.BROWSER_CHROME;
  else if (nav.userAgent.match(/.*Firefox.*/) != null)
    return TestRig.BROWSER_FIREFOX;
  else if (nav.userAgent.match(/.*Safari.*/) != null)
    return TestRig.BROWSER_SAFARI;
  else
    return 'other';
};

/** Returns the length of time that a performance test should take; if the test
* takes longer than this then an error should be reported.
* @param {number} expected the expected length of time
* @return {number} the maximum length of time the test should take in seconds
*/
static getPerfLimit(expected) {
  return 1.20 * expected;
};

/** Returns string showing performance test results with the percentage that the test
* was over (or under) the expected time.
* @param {number} duration the actual length of time the test ran in seconds
* @param {number} expected the expected length of time in seconds
* @return {string} string showing performance test results
*/
static perfResult(duration, expected) {
  return 'time='+Util.NF2(duration)+' expected='+Util.NF2(expected)
    +'  ('+(Util.NF1S(100*duration/expected - 100))+'%)';
};

/** Returns expected running time for a test by looking up the time in
* {@link myphysicslab.test.ExpectedPerf}, using the current machine name and
* browser.  See {@link #getMachineName} and {@link #getBrowserName}.
* @param {string} testName the name of the test
* @param {number=} defaultTime the default expected running time to use when unable
*     to find expected time
* @return {number} the expected running time in seconds
*/
static perfExpected(testName, defaultTime) {
  if (defaultTime === undefined) {
    defaultTime = 10000;
  }
  var machine = TestRig.getMachineName();
  var browser = TestRig.getBrowserName();
  var compiled = Util.ADVANCED ? 'advanced' : 'simple';
  var e0 = ExpectedPerf;
  goog.asserts.assertObject(e0, 'not an object '+e0);
  var err = 'no expected results for machine: '+machine;
  var e1 = e0[machine];
  if (!goog.isObject(e1)) {
    TestRig.myPrintln(err, /*error=*/true);
    return defaultTime;
  }
  err += ', browser: '+browser;
  var e2 = e1[browser];
  if (!goog.isObject(e2)) {
    TestRig.myPrintln(err, /*error=*/true);
    return defaultTime;
  }
  err += ', compiled: '+compiled;
  var e3 = e2[compiled];
  if (!goog.isObject(e3)) {
    // 'all' property has results for either advanced or simple compile
    e3 = e2['all'];
    if (!goog.isObject(e3)) {
      TestRig.myPrintln(err, /*error=*/true);
      return defaultTime;
    }
  }
  err += ', test: '+testName;
  var e4 = e3[testName];
  if (!goog.isNumber(e4)) {
    TestRig.myPrintln(err, /*error=*/true);
    return defaultTime;
  } else {
    return e4;
  }
};

/** Executes the test function; catches and reports errors.
* @param {!Function} testFunc
*/
static runFunction(testFunc) {
  try {
    testFunc();
  } catch (e) {
    TestRig.testsFailed += 1;
    TestRig.myPrintln('***FAILED*** '+TestRig.testName
      +' '+e, /*error=*/true);
    TestRig.myPrintln(e.stack, /*error=*/true);
  }
};

/** Schedules the test function to be run in a way that will catch and report errors.
Tests will not start until `TestRig.runTests` is called.
* @param {!Function} testFunc
*/
static schedule(testFunc) {
  TestRig.testFns.push(goog.partial(TestRig.runFunction, testFunc));
};

/** Run tests that have been scheduled with `TestRig.schedule`. There is a small
gap of time between each test so that the browser will update the page to show test
results, and so that the user can interrupt the test.
* @return {undefined}
*/
static runTests() {
  var testFunc = TestRig.testFns.shift();
  if (goog.isFunction(testFunc)) {
    testFunc();
    setTimeout(TestRig.runTests, 50);
  }
};

/** Sets up reporting for a group of tests. Finds an Element named `test_results`
for writing the results.
* @return {undefined}
*/
static startTests() {
  TestRig.testsFailed = 0;
  // Find the  element to show test results
  var test_results = document.getElementById('test_results');
  if (!goog.isObject(test_results)) {
    throw new Error('<p> element with id="test_results" not found');
  }
  TestRig.output = test_results;
  var d = new Date();
  TestRig.myPrintln(d.toDateString()+' '+d.toTimeString());
  TestRig.myPrintln('compiled '+Util.COMPILE_TIME);
  TestRig.myPrintln('machine = '+TestRig.getMachineName());
  TestRig.myPrintln('browser = '+TestRig.getBrowserName());
  // global variable COMPILED is created by goog.base
  if (!COMPILED) {
    TestRig.myPrintln('COMPILE_LEVEL = debug (uncompiled)');
  } else {
    TestRig.myPrintln('COMPILE_LEVEL = '
      +(Util.ADVANCED ? 'advanced' : 'simple'));
  }
  TestRig.myPrintln('goog.DEBUG = '+goog.DEBUG);
  TestRig.myPrintln('Util.DEBUG = '+Util.DEBUG);
  TestRig.myPrintln('myPhysicsLab version = '+Util.VERSION);
  var nav = navigator;
  if (nav != null) {
    TestRig.myPrintln('userAgent = '+nav.userAgent);
    TestRig.myPrintln('platform = '+nav.platform);
  }
  if (window['MSSTream']) {
    // http://stackoverflow.com/questions/9038625/detect-if-device-is-ios
    // "Microsoft injected the word iPhone in IE11's userAgent in order to try
    // and fool Gmail somehow."
    TestRig.myPrintln('MSStream detected: probably on Internet Explorer'
        +' for Windows Phone');
  }
  if (goog.DEBUG && !Util.ADVANCED) {
    try {
      var a = 1;
      goog.asserts.assert(1 == 0);
      a = 2;
    } catch(e) {
      TestRig.myPrintln('asserts are working');
    }
    if (a == 2) {
      throw new Error('asserts are not working');
    }
  } else {
    TestRig.myPrintln('NOTE: asserts are NOT enabled');
  }
};

/**  Reports that a group of tests has finished.
* @return {undefined}
*/
static finishTests() {
  var f = TestRig.testsFailed;
  if (f > 0) {
    TestRig.myPrintln('Tests finished -- '+f+' TESTS FAILED', /*error=*/true);
  } else {
    TestRig.myPrintln('Tests finished and passed.');
  }
  var d = new Date();
  TestRig.myPrintln(d.toDateString()+' '+d.toTimeString());
};

/** Sets the name of current test, and prints the name to results.
* @param {string} name name of the current test
*/
static startTest(name) {
  TestRig.testName = name;
  TestRig.myPrintln(name);
};

/**  Prints a line of test results to the HTML page.

Tests should schedule themselves to run immediately with setTimeout so that
the test results can be written to the HTML page as they occur.  Otherwise (not using
setTimeout) the page will not refresh until all the tests have finished.

The warning flag is used to make visible those tests that reproduce errors which need
to be fixed.
* @param {string} s the string to print
* @param {boolean=} opt_error if true then string is highlighted as an error
* @param {boolean=} opt_warning if true then string is highlighted as a warning
*/
static myPrintln(s, opt_error, opt_warning) {
  console.log(s);
  if (TestRig.output != null) {
    if (opt_error) {
      s = '<span class="error">'+s+'</span>';
    }
    if (opt_warning) {
      s = '<span class="warning">'+s+'</span>';
    }
    TestRig.output.innerHTML += s + '<br>';
    var docElement = /** @type {!HTMLElement}*/(document.documentElement);
    var documentHeight = docElement.offsetHeight;
    var viewportHeight = window.innerHeight;
    window.scrollTo(0, documentHeight - viewportHeight);
  }
};

/** The test suite version of `assert`, this prints whether the test passed or
failed, along with the name of the test method; if the test failed, prints the reason
and if `ABORT_ON_FAIL` is true throws an Error.

Some tests reproduce errors which need to be fixed. To make these visible, any test
whose name includes the word 'error' is printed with the 'warning' highlighting.

@param {boolean} passed whether the test passed
@param {string} testType type of test (variables, energy, number of collisions, etc.)
@param {?string=} reason why the test failed: a string giving details of
    test results, or `null`
@throws {!Error} if `passed` is false and `ABORT_ON_FAIL` is true
*/
static reportTestResults(passed, testType, reason) {
  var s = TestRig.testName+' ['+testType+']';
  if (passed) {
    if (testType == 'performance') {
      s += ' '+reason;
    }
    var warning = TestRig.testName.match(/.*error.*/) != null;
    TestRig.myPrintln('passed: '+s, /*error=*/false, warning);
  } else {
    TestRig.testsFailed += 1;
    TestRig.myPrintln('FAILED '+s, /*error=*/true);
    if (goog.isString(reason) && reason.length > 0) {
      TestRig.myPrintln(reason, /*error=*/true);
    }
    // show stack trace in console, to help figure out what went wrong.
    console.trace();
    if (TestRig.ABORT_ON_FAIL) {
      throw(new Error());
    }
  }
};

/** If the value does not match the expected value, then report a test failure.
* @param {*} expected  the expected value
* @param {*} value  the value to test
*/
static assertEquals(expected, value) {
  if (value !== expected) {
    var s = 'expected='+expected+' but was actual='+value;
    TestRig.reportTestResults(false, 'value', s);
  }
};

/** If the value does not match the expected value, then report a test failure.
* @param {number} expected  the expected value
* @param {*} value  the value to test
* @param {number} tolerance  how much the value can differ from expected value
*/
static assertRoughlyEquals(expected, value, tolerance) {
  if (!goog.isNumber(value)) {
    TestRig.reportTestResults(false, 'value', 'not a number '+value);
    return;
  }
  var num = /** @type {number} */(value);
  if (Math.abs(expected - num) > tolerance) {
    var s = 'expected='+expected+' but was actual='+num
                + ' tolerance='+tolerance;
    TestRig.reportTestResults(false, 'value', s);
  }
};

/** If the value is not true, then report a test failure.
* @param {*} value  the value to test
*/
static assertTrue(value) {
  if (!goog.isBoolean(value) || !value) {
    TestRig.reportTestResults(false, 'boolean');
  }
};

/** If the array elements are not equal, then report a test failure.
* @param {!Array} expected  the expected array
* @param {*} value  the array to test
*/
static assertElementsEquals(expected, value) {
  if (!goog.isArray(value)) {
    TestRig.reportTestResults(false, 'assert', 'not an array '+value);
    return;
  }
  var arr = /** !Array */(value);
  if (expected.length != arr.length) {
    TestRig.reportTestResults(false, 'assert', 'array not expected length '+arr);
    return;
  }
  for (var i=0, n=expected.length; i<n; i++) {
    if (expected[i] != arr[i]) {
      var s = 'expected='+expected[i]+' but was actual='+arr[i];
      TestRig.reportTestResults(false, 'boolean', 'array elements not equal '+s);
    }
  }
};

/** If the value is true, then report a test failure.
* @param {*} value  the value to test
*/
static assertFalse(value) {
  if (!goog.isBoolean(value) || value) {
    TestRig.reportTestResults(false, 'boolean');
  }
};

/** If the value is not NaN, then report a test failure.
* @param {*} value  the value to test
*/
static assertNaN(value) {
  if (!isNaN(value)) {
    TestRig.reportTestResults(false, 'assert', 'value is not NaN '+value);
  }
};

/** If the value is null, then report a test failure.
* @param {*} value  the value to test
*/
static assertNotNull(value) {
  if (value === null) {
    TestRig.reportTestResults(false, 'assert', 'value is null');
  }
};

/** If the value is not null, then report a test failure.
* @param {*} value  the value to test
*/
static assertNull(value) {
  if (value !== null) {
    TestRig.reportTestResults(false, 'assert', 'value is not null '+value);
  }
};

/** If the function does throw an error, then report a test failure.
* @param {function()} func  the function to test
*/
static assertNotThrows(func) {
  try {
    func();
  } catch (e) {
    TestRig.reportTestResults(false, 'exception',
        'exception should not occur');
  }
};

/** If the function does not throw an error, then report a test failure.
* @param {function()} func  the function to test
* @return {Error|undefined}
*/
static assertThrows(func) {
  try {
    func();
    TestRig.reportTestResults(false, 'assert',
        'expected exception did not occur');
  } catch (e) {
    return e;
  }
};

/** If the value is not undefined, then report a test failure.
* @param {*} value  the value to test
*/
static assertUndefined(value) {
  if (value !== undefined) {
    TestRig.reportTestResults(false, 'assert');
  }
};

} // end class

/** ABORT_ON_FAIL = true means generate an exception to immediately stop the tests.
* @type {boolean}
* @const
* @private
*/
TestRig.ABORT_ON_FAIL = false;

/** Identifier of Chrome browser.
* @type {string}
* @const
*/
TestRig.BROWSER_CHROME = 'Chrome';

/** Identifier of Firefox browser.
* @type {string}
* @const
*/
TestRig.BROWSER_FIREFOX = 'Firefox';

/** Identifier of Safari browser.
* @type {string}
* @const
*/
TestRig.BROWSER_SAFARI = 'Safari';

/** Array of tests that have been scheduled to run.
* @type {!Array<!Function>}
*/
TestRig.testFns = new Array();

/**  Number of tests that failed.
* @type {number}
*/
TestRig.testsFailed = 0;

/**  Output will be written to this Element.  If this is null then
* output goes to window.console.
* @type {?Element}
*/
TestRig.output = null;

/** Name of currently running test, for reporting results.
* @type {string}
*/
TestRig.testName = '';

/** Name of global variable that gives name of current machine.
* @type {string}
* @const
* @private
*/
TestRig.machineName = 'MYPHYSICSLAB_MACHINE_NAME';

exports = TestRig;
