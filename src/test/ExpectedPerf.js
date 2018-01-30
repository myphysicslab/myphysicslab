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

goog.module('myphysicslab.test.ExpectedPerf');

/** Defines expected times for performance tests.  There are separate expected times
* for each combination of machine, browser, compiled-status, and test.  The compiled
* status can be 'simple', 'advanced', or 'all'.
*
* When the performance test is run, the machine name is defined in the file
* MachineName.js, which is not stored in the source repository because it defines a
* different name on each machine.
*
* To understand how machine names and browser names are determined during the test
* see {@link myphysicslab.test.Engine2DTestRig#getMachineName} and
* {@link myphysicslab.test.Engine2DTestRig#getBrowserName}.
*
*/
const ExpectedPerf = {
  'ERN_MacBookProMid2010': {
    'Safari': {
      'all': {
        'six_blocks_perf': 2.8,
        'pile_10_perf': 7.7,
        'clock_gears_perf': 3.5
      }
    },
    'Firefox': {
      'all': {
        'six_blocks_perf': 4.5,
        'pile_10_perf': 8.2,
        'clock_gears_perf': 8.0
      }
    },
    'Chrome': {
      'all': {
        'six_blocks_perf': 1.2,
        'pile_10_perf': 2.44,
        'pile_20_perf': 25,
        'clock_gears_perf': 6
      }
    },
  },
  'ERN_MacBookPro2013': {
    'Safari': {
      'all': {
        'six_blocks_perf': 1.25,
        'pile_10_perf': 3.74,
        'clock_gears_perf': 1.33
      }
    },
    'Firefox': {
      'simple': {
        'six_blocks_perf': 1.3,
        'pile_10_perf': 2.0,
        'clock_gears_perf': 1.9
      },
      'advanced': {
        'six_blocks_perf': 0.6,
        'pile_10_perf': 1.1,
        'clock_gears_perf': 1.4
      }
    },
    'Chrome': {
      'simple': {
        'six_blocks_perf': 1.33,
        'pile_10_perf': 2.20,
        'pile_20_perf': 19.00,
        'clock_gears_perf': 2.78
      },
      'advanced': {
        'six_blocks_perf': 0.60,
        'pile_10_perf': 1.15,
        'pile_20_perf': 11.24,
        'clock_gears_perf': 2.39
      }
    },
  }
};
exports = ExpectedPerf;