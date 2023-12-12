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

/** Defines expected times for performance tests.  There are separate expected times
* for each combination of machine, browser, and test.
*
* When the performance test is run, the machine name is defined in the file
* MachineName.js, which is not stored in the source repository because it defines a
* different name on each machine.
*
* To understand how machine names and browser names are determined during the test
* see `getMachineName` and `getBrowserName` in {@link test/TestRig}.
*/
export const ExpectedPerf = {
  'ERN_MacBookProMid2010': {
    'Safari': {
        'six_blocks_perf': 2.8,
        'pile_10_perf': 7.7,
        'clock_gears_perf': 3.5
    },
    'Firefox': {
        'six_blocks_perf': 4.5,
        'pile_10_perf': 8.2,
        'clock_gears_perf': 8.0
    },
    'Chrome': {
        'six_blocks_perf': 1.2,
        'pile_10_perf': 2.44,
        'pile_20_perf': 25,
        'clock_gears_perf': 6
    },
  },
  'ERN_MacBookPro2013': {
    'Safari': {
        'six_blocks_perf': 0.47,
        'pile_10_perf': 0.78,
        'clock_gears_perf': 0.85
    },
    'Firefox': {
        'six_blocks_perf': 1.24,
        'pile_10_perf': 2.02,
        'clock_gears_perf': 2.65
    },
    'Chrome': {
        'six_blocks_perf': 0.56,
        'pile_10_perf': 1.08,
        'pile_20_perf': 19.00,
        'clock_gears_perf': 0.75
    },
  },
  'ERN_MacBookPro2017': {
    'Safari': {
        'six_blocks_perf': 0.41,
        'pile_10_perf': 0.75,
        'clock_gears_perf': 0.73
    },
    'Firefox': {
        'six_blocks_perf': 1.09,
        'pile_10_perf': 1.75,
        'clock_gears_perf': 2.23
    },
    'Chrome': {
        'six_blocks_perf': 0.53,
        'pile_10_perf': 1.18,
        'clock_gears_perf': 0.86
    },
  },
  'ERN_MacBookAir2023': {
    'Safari': {
        'six_blocks_perf': 0.21,
        'pile_10_perf': 0.40,
        'clock_gears_perf': 0.30
    },
    'Firefox': {
        'six_blocks_perf': 0.40,
        'pile_10_perf': 0.75,
        'clock_gears_perf': 0.67
    },
    'Chrome': {
        'six_blocks_perf': 0.22,
        'pile_10_perf': 0.50,
        'clock_gears_perf': 0.25
    },
  },
};
