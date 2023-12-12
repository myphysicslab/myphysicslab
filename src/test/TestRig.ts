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


/** TestRig provides functions for software testing.

When using these test functions, be sure to set the `testName` class variable.

## Why the `testName` class property exists

We can't get the name of the current test function from the stack in
Javascript. There are ways to do it, but the `Error.stack` property is
non-standard (Chrome and Firefox only); and using `arguments.callee.caller` is standard
but deprecated; and in either case we still have to prevent Google Closure from mangling
the name of the function when compiled.  So it seems to be safer and easier to just
stuff the name of the current test into the `testName` variable.  Plus, we can add other
information about the test, such as additional test parameters that vary between runs
of the test.
*/
import { Util } from "../lab/util/Util.js";
import { ExpectedPerf } from './ExpectedPerf.js';

/** name of the currently running test.
*/
export var testName = '';

/** Sets the name of current test.
* @param name name of the current test
*/
export function setTestName(name: string) {
  testName = name;
};

/** ABORT_ON_FAIL = true means generate an exception to immediately stop the tests.
*/
const ABORT_ON_FAIL = false;

/** Identifier of Chrome browser.
*/
const BROWSER_CHROME = 'Chrome';

/** Identifier of Firefox browser.
*/
const BROWSER_FIREFOX = 'Firefox';

/** Identifier of Safari browser.
*/
const BROWSER_SAFARI = 'Safari';

/** Array of tests that have been scheduled to run.
*/
const testFns: { (): void; }[] = new Array();

/**  Number of tests that failed.
*/
let testsFailed = 0;

/**  Output will be written to this Element.  If this is null then
* output goes to window.console.
*/
let output: Element|null = null;

/** Executes the test function; catches and reports errors.
* @param testFunc the test function to run, takes no arguments and returns nothing
*/
function runFunction(testFunc: ()=>void) {
  try {
    testFunc();
  } catch (e: unknown) {
    testsFailed += 1;
    myPrintln('***FAILED*** '+testName+' '+e, /*error=*/true);
  }
};

/** Schedules the test function to be run in a way that will catch and report errors.
* Tests will not start until `runTests` is called.
* @param testFunc the test function to run, which takes no arguments and returns nothing
*/
export function schedule(testFunc: ()=>void) {
  // The tests to run are stored as an array of functions to be called.
  testFns.push(()=>{runFunction(testFunc)});
};

/** Run tests that have been scheduled with `schedule`. There is a small
gap of time between each test so that the browser will update the page to show test
results, and so that the user can interrupt the test.
*/
export function runTests() {
  // The tests to run are stored as an array of functions to be called.
  const testFunc = testFns.shift();
  // Only the first testFunc is run during this invocation of runTests().
  // We use setTimeout() to schedule runTests() to be called again after a brief delay.
  // Every time runTest() is called it runs a single test and schedules itself
  // to run again.
  if (testFunc !== undefined) {
    testFunc();
    setTimeout(runTests, 10);
  }
};

/** Sets up reporting for a group of tests. Finds an Element named `test_results`
for writing the results.
*/
export function startTests() {
  testsFailed = 0;
  // Find the  element to show test results
  const test_results = document.getElementById('test_results');
  
  if (!Util.isObject(test_results)) {
    throw '<p> element with id="test_results" not found';
  }
  output = test_results;
  const d = new Date();
  myPrintln(d.toDateString()+' '+d.toTimeString());
  myPrintln('myPhysicsLab version = '+Util.VERSION);
  myPrintln('compiled '+Util.COMPILE_TIME);
  myPrintln('machine = '+getMachineName());
  myPrintln('browser = '+getBrowserName());
  const nav = navigator;
  if (nav != null) {
    myPrintln('userAgent = '+nav.userAgent);
    myPrintln('platform = '+nav.platform);
  }
  myPrintln('Util.DEBUG = '+Util.DEBUG);
  if (Util.DEBUG) {
    let a = 1;
    try {
      Util.assert(false);
      a = 2;
    } catch(e) {
      myPrintln('asserts are working');
    }
    if (a == 2) {
      throw 'asserts are not working';
    }
  } else {
    myPrintln('NOTE: asserts are NOT enabled');
  }
};

/**  Reports that a group of tests has finished.
*/
export function finishTests() {
  const f = testsFailed;
  if (f > 0) {
    myPrintln('Tests finished -- '+f+' TESTS FAILED', /*error=*/true);
  } else {
    myPrintln('Tests finished and passed.');
  }
  const d = new Date();
  myPrintln(d.toDateString()+' '+d.toTimeString());
};

/** Sets the name of current test, and prints the name to results.
* @param  n name of the current test
*/
export function startTest(n: string) {
  testName = n;
  myPrintln(n);
};

/**  Prints a line of test results to the HTML page.

Tests should schedule themselves to run immediately with setTimeout so that
the test results can be written to the HTML page as they occur.  Otherwise (not using
setTimeout) the page will not refresh until all the tests have finished.

The warning flag is used to make visible those tests that reproduce errors which need
to be fixed.
@param s the string to print
@param opt_error if true then string is highlighted as an error
@param opt_warning if true then string is highlighted as a warning
*/
export function  myPrintln(s: string, opt_error?: boolean, opt_warning?: boolean) {
  console.log(s);
  if (output != null) {
    if (opt_error) {
      s = '<span class="error">'+s+'</span>';
    }
    if (opt_warning) {
      s = '<span class="warning">'+s+'</span>';
    }
    output.innerHTML += s + '<br>';
    const docElement = document.documentElement as HTMLElement;
    const documentHeight = docElement.offsetHeight;
    const viewportHeight = window.innerHeight;
    window.scrollTo(0, documentHeight - viewportHeight);
  }
};

/** Prints whether the test passed or
failed, along with the name of the test method; if the test failed, prints the reason
and if `ABORT_ON_FAIL` is true throws an Error.

Some tests reproduce errors which need to be fixed. To make these visible, any test
whose name includes the word 'error' is printed with the 'warning' highlighting.

@param passed whether the test passed
@param testType type of test (variables, energy, number of collisions, etc.)
@param reason why the test failed: a string giving details of
    test results, or `null`
@throws if `passed` is false and `ABORT_ON_FAIL` is true
*/
export function reportTestResults(passed: boolean, testType: string, reason?: string) {
  let s = testName+' ['+testType+']';
  if (passed) {
    if (testType == 'performance') {
      s += ' '+reason;
    }
    const warning = testName.match(/.*error.*/) != null;
    myPrintln('passed: '+s, /*error=*/false, warning);
  } else {
    testsFailed += 1;
    myPrintln('FAILED '+s, /*error=*/true);
    if (typeof reason === 'string' && reason.length > 0) {
      myPrintln(reason, /*error=*/true);
    }
    // show stack trace in console, to help figure out what went wrong.
    console.trace();
    if (ABORT_ON_FAIL) {
      throw(new Error());
    }
  }
};

// https://stackoverflow.com/questions/61700127/
// check-if-a-property-exists-on-global-or-window-object-in-typescript
declare global {
    interface Window {
        MYPHYSICSLAB_MACHINE_NAME: string | undefined;
    }
}

/** Returns the name of this machine, which should be stored in the global
* variable `MYPHYSICSLAB_MACHINE_NAME`.  That global is set in the file
* `MachineName.js` (which is not checked in to the source repository, see
* the file `sampleMachineName.js`).
* @return the name of this machine, or `UNKNOWN_MACHINE`
*/
export function getMachineName() {
  if (window.MYPHYSICSLAB_MACHINE_NAME !== undefined) {
    const s = window.MYPHYSICSLAB_MACHINE_NAME;
    if (typeof s === 'string') {
      return s;
    }
  }
  if (Util.DEBUG) {
    console.log('MYPHYSICSLAB_MACHINE_NAME not defined');
  }
  return 'UNKNOWN_MACHINE';
};

/** Returns name of the browser we are running under;  returns 'other' for
unrecognized browsers.
*/
export function getBrowserName() {
  const nav = navigator;
  if (nav == null)
    return 'unknown';
  if (nav.userAgent.match(/.*Chrome.*/) != null)
    return BROWSER_CHROME;
  else if (nav.userAgent.match(/.*Firefox.*/) != null)
    return BROWSER_FIREFOX;
  else if (nav.userAgent.match(/.*Safari.*/) != null)
    return BROWSER_SAFARI;
  else
    return 'other';
};

/** If the array elements are not equal, then report a test failure.
* @param expected  the expected array
* @param arr  the array to test
*/
export function assertElementsEquals<T>(expected: T[], arr: T[]) {
  if (!Array.isArray(arr)) {
    reportTestResults(false, 'assert', 'not an array '+arr);
    return;
  }
  if (expected.length != arr.length) {
    reportTestResults(false, 'assert', 'expected array length '
        +expected.length+' but found '+arr.length);
    return;
  }
  for (let i=0, n=expected.length; i<n; i++) {
    if (expected[i] != arr[i]) {
      const s = 'expected='+expected[i]+' but was actual='+arr[i];
      reportTestResults(false, 'assert', 'array elements not equal '+s);
    }
  }
};

/** If the value does not match the expected value, then report a test failure.
* @param expected  the expected value
* @param value  the value to test
*/
export function assertEquals(expected: any, value: any) {
  if (value !== expected) {
    const s = 'expected='+expected+' but was actual='+value;
    reportTestResults(false, 'value', s);
  }
};

/** If the value is true, then report a test failure.
* @param value  the value to test
*/
export function assertFalse(value: boolean) {
  if (value) {
    reportTestResults(false, 'assert');
  }
};

/** If the value is not less than the limit, then report a test failure.
* @param value  the value to test
* @param limit  the limit value
*/
export function assertLessThan(value: number, limit: number) {
  if (value > limit) {
    const s = 'value of '+value+' exceeds limit of '+limit;
    reportTestResults(false, 'value', s);
  }
};

/** If the value is not NaN, then report a test failure.
* @param value  the value to test
*/
export function assertNaN(value: number) {
  if (!isNaN(value)) {
    reportTestResults(false, 'assert', 'value is not NaN '+value);
  }
};

/** If the value is null, then report a test failure.
* @param value  the value to test
*/
export function assertNotNull(value: any) {
  if (value === null) {
    reportTestResults(false, 'assert', 'value is null');
  }
};

/** If the value is not null, then report a test failure.
* @param value  the value to test
*/
export function assertNull(value: any) {
  if (value !== null) {
    reportTestResults(false, 'assert', 'value is not null '+value);
  }
};

/** If the function does throw an error, then report a test failure.
* @param func  the function to test
*/
export function assertNotThrows(func: ()=>void) {
  try {
    func();
  } catch (e: unknown) {
    reportTestResults(false, 'exception',
        'exception should not occur');
  }
};

/** If the value does not match the expected value, then report a test failure.
* @param expected  the expected value
* @param value  the value to test
* @param tolerance  how much the value can differ from expected value
*/
export function assertRoughlyEquals(expected: number, value: number, tolerance: number) {
  if (Math.abs(expected - value) > tolerance) {
    const s = 'expected='+expected+' but was actual='+value
                + ' tolerance='+tolerance;
    reportTestResults(false, 'value', s);
  }
};

/** If the function does not throw an error, then report a test failure.
* @param  func  the function to test
*/
export function assertThrows(func: ()=>void) {
  try {
    func();
    reportTestResults(false, 'assert', 'expected exception did not occur');
    return '';
  } catch (e: unknown) {
    return String(e);
  }
};

/** If the value is not true, then report a test failure.
*/
export function assertTrue(value: boolean) {
  if (!value) {
    reportTestResults(false, 'assert');
  }
};

/** If the value is not undefined, then report a test failure.
* @param value  the value to test
*/
export function assertUndefined(value: any) {
  if (value !== undefined) {
    reportTestResults(false, 'assert');
  }
};

/** Returns the length of time that a performance test should take; if the test
* takes longer than this then an error should be reported.
* @param expected the expected length of time
* @return the maximum length of time the test should take in seconds
*/
export function getPerfLimit(expected: number): number {
  return 1.20 * expected;
};

/** Returns string showing performance test results with the percentage that the test
* was over (or under) the expected time.
* @param duration the actual length of time the test ran in seconds
* @param expected the expected length of time in seconds
* @return string showing performance test results
*/
export function perfResult(duration: number, expected: number): string {
  return 'time='+Util.NF2(duration)+' expected='+Util.NF2(expected)
    +'  ('+(Util.NF1S(100*duration/expected - 100))+'%)';
};

/** Returns expected running time for a test by looking up the time in
* {@link test/ExpectedPerf}, using the current machine name and
* browser.  See `getMachineName` and `getBrowserName`.
* @param testName the name of the test
* @param defaultTime the default expected running time to use when unable
*     to find expected time
* @return the expected running time in seconds
*/
export function perfExpected(testName: string, defaultTime: number = 10000): number {
  const machine = getMachineName();
  const browser = getBrowserName();
  const compiled = 'simple';
  const e0 = ExpectedPerf;
  Util.assert(Util.isObject(e0));
  let err = 'no expected results for machine: '+machine;
  const e1 = e0[machine as keyof typeof e0];
  if (!Util.isObject(e1)) {
    myPrintln(err, true);
    return defaultTime;
  }
  err += ', browser: '+browser;
  const e2 = e1[browser as keyof typeof e1];
  if (!Util.isObject(e2)) {
    myPrintln(err, true);
    return defaultTime;
  }
  err += ', test: '+testName;
  const e4 = e2[testName as keyof typeof e2];
  if (typeof e4 !== 'number') {
    myPrintln(err, true);
    return defaultTime;
  } else {
    return e4;
  }
};


