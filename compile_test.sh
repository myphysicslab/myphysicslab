#!/bin/bash
# Copyright 2016 Erik Neumann. All Rights Reserved.
# Use of this source code is governed by the Apache License, Version 2.0.
# See the LICENSE file and http://www.apache.org/licenses/LICENSE-2.0.

# compile unit tests
# WARNING: when adding a unit test, also change the list in src/test/UnitTest.html
# param: {string} rootDir = top level source directory, example: src/
# param: {string} target = output file, example: build/test/UnitTest_en.js
# param: {string} COMPILE_LEVEL = "simple" or "advanced", whether to compile with advanced
#                 closure compiler optimizations
# input: the variable CLOSURE_COMPILER must be set; it is set in myConfig.mk
#        so that each user can specify it for their environment.
# output: compiled version of unit tests in a single javascript file

# Note that goog.DEBUG must be true because goog.testing.MockClock uses
# goog.async.run which requires goog.DEBUG to be true.
# The error message was something like `goog.async.run.resetQueue is undefined`
# which happened while trying to uninstall a MockClock.

#set dbg to "true" to show some debug statements
dbg=""

rootDir="${1}"
if [ -z "$rootDir" ] ; then
	echo "$0 ERROR: no source directory specified"
	exit 1
fi
# ${variable%pattern}  Trim the shortest match from the end
# Remove trailing slash
rootDir="${rootDir%/}"
if [ ! -d "$rootDir" ] ; then
	echo "$0 ERROR: source directory $rootDir does not exist"
	exit 1
fi

target="${2}"
if [ -z "$target" ] ; then
	echo "$0 ERROR: no target file specified"
	exit 1
fi

# Find locale from suffix of target:  foo_en.js is "en";  bar_de.js is "de"
# ${variable##pattern} Trim the longest match from the beginning
locale=${target##*_}
# ${variable%%pattern} Trim the longest match from the end:
# remove the ".js" suffix
locale=${locale%%.*}
if [ -z "$locale" ] ; then
	echo "cannot determine locale from $target"
	exit 1
fi

# ${parameter:-word} Use Default Values. If parameter is unset or null, 
# the expansion of word is substituted. Otherwise, the value of parameter 
# is substituted.
COMPILE_LEVEL="${4:-simple}"

if [[ "$COMPILE_LEVEL" == "advanced" ]] ; then
	comp_level="ADVANCED"
	advanced="true"
elif [[ "$COMPILE_LEVEL" == "simple" ]] ; then
	comp_level="SIMPLE"
	advanced="false"
else
	echo "COMPILE_LEVEL=$COMPILE_LEVEL, must be simple or advanced"
	exit 1
fi

if [ -z "$CLOSURE_COMPILER" ] ; then echo "CLOSURE_COMPILER not set"; exit 1; fi
if [ ! -e "$CLOSURE_COMPILER" ] ; then echo "$CLOSURE_COMPILER does not exist"; exit 1; fi

# ${variable%%pattern}  Trim the longest match from the end
buildRoot="${target%%/*}"
# ${variable%pattern}  Trim the shortest match from the end
buildDir="${target%/*}"
mkdir -p "$buildDir"

if [ -n "$dbg" ] ; then
	echo "rootDir=$rootDir, target=$target, locale=$locale, buildRoot=$buildRoot, buildDir=$buildDir, advanced=$advanced";
fi

#exit 0

# Creates a single compiled script containing the required functions
# from the Closure Library and myphysicslab that are needed to realize
# things in the specified closure_entry_point(s).
#
# To see compiler options:
#  java -jar ../javascript/closure-compiler/build/compiler.jar --help
#
# compilation_levels: WHITESPACE_ONLY, SIMPLE, ADVANCED
#
# WARNING: when adding a unit test, also change the list in src/test/UnitTest.html
#set -x
java -jar "$CLOSURE_COMPILER" \
--entry_point=goog:myphysicslab.lab.engine2D.test.CircularEdge_test \
--entry_point=goog:myphysicslab.lab.engine2D.test.EdgeSet_test \
--entry_point=goog:myphysicslab.lab.engine2D.test.Polygon_test \
--entry_point=goog:myphysicslab.lab.engine2D.test.RigidBodySim_test \
--entry_point=goog:myphysicslab.lab.engine2D.test.StraightEdge_test \
--entry_point=goog:myphysicslab.lab.engine2D.test.UtilEngine_test \
--entry_point=goog:myphysicslab.lab.engine2D.test.Vertex_test \
--entry_point=goog:myphysicslab.lab.model.test.ConcreteLine_test \
--entry_point=goog:myphysicslab.lab.model.test.EnergyInfo_test \
--entry_point=goog:myphysicslab.lab.model.test.NumericalPath_test \
--entry_point=goog:myphysicslab.lab.model.test.PointMass_test \
--entry_point=goog:myphysicslab.lab.model.test.SimList_test \
--entry_point=goog:myphysicslab.lab.model.test.Spring_test \
--entry_point=goog:myphysicslab.lab.model.test.VarsList_test \
--entry_point=goog:myphysicslab.lab.util.test.AbstractSubject_test \
--entry_point=goog:myphysicslab.lab.util.test.AffineTransform_test \
--entry_point=goog:myphysicslab.lab.util.test.CircularList_test \
--entry_point=goog:myphysicslab.lab.util.test.DoubleMath_test \
--entry_point=goog:myphysicslab.lab.util.test.DoubleRect_test \
--entry_point=goog:myphysicslab.lab.util.test.MutableVector_test \
--entry_point=goog:myphysicslab.lab.util.test.ParameterBoolean_test \
--entry_point=goog:myphysicslab.lab.util.test.ParameterNumber_test \
--entry_point=goog:myphysicslab.lab.util.test.ParameterString_test \
--entry_point=goog:myphysicslab.lab.util.test.RandomLCG_test \
--entry_point=goog:myphysicslab.lab.util.test.ScriptParser_test \
--entry_point=goog:myphysicslab.lab.util.test.Terminal_test \
--entry_point=goog:myphysicslab.lab.util.test.TimerClock_test \
--entry_point=goog:myphysicslab.lab.util.test.UtilityCore_test \
--entry_point=goog:myphysicslab.lab.util.test.Vector_test \
--entry_point=goog:myphysicslab.lab.view.test.CoordMap_test \
--entry_point=goog:myphysicslab.lab.view.test.DisplayList_test \
--entry_point=goog:myphysicslab.lab.view.test.DisplayShape_test \
--entry_point=goog:myphysicslab.lab.view.test.DisplaySpring_test \
--entry_point=goog:myphysicslab.lab.view.test.LabCanvas_test \
--entry_point=goog:myphysicslab.lab.view.test.ScreenRect_test \
--entry_point=goog:myphysicslab.lab.view.test.SimView_test \
--entry_point=goog:myphysicslab.sims.pendulum.test.DoublePendulum_test \
--entry_point=goog:myphysicslab.sims.springs.test.SingleSpring_test \
--entry_point=goog:myphysicslab.sims.roller.test.Roller_test \
--compilation_level=$comp_level \
--define=goog.DEBUG=true \
--define=goog.LOCALE="'$locale'" \
--define=myphysicslab.lab.util.UtilityCore.ADVANCED=$advanced \
--generate_exports \
--js=`readlink closure-library` \
--js=src/ \
--jscomp_error=checkTypes \
--jscomp_error=missingProperties \
--jscomp_error=missingProvide \
--jscomp_error=missingRequire \
--jscomp_warning=accessControls \
--jscomp_warning=ambiguousFunctionDecl \
--jscomp_warning=checkVars \
--jscomp_warning=const \
--jscomp_warning=constantProperty \
--jscomp_warning=fileoverviewTags \
--jscomp_warning=globalThis \
--jscomp_warning=invalidCasts \
--jscomp_warning=misplacedTypeAnnotation \
--jscomp_warning=missingReturn \
--jscomp_warning=newCheckTypes \
--jscomp_warning=strictModuleDepCheck \
--jscomp_warning=suspiciousCode \
--jscomp_warning=typeInvalidation \
--jscomp_warning=undefinedNames \
--jscomp_warning=undefinedVars \
--jscomp_warning=unknownDefines \
--jscomp_warning=uselessCode \
--jscomp_warning=visibility \
--language_in=ECMASCRIPT5_STRICT \
--language_out=ECMASCRIPT5_STRICT \
--dependency_mode=STRICT \
--warning_level=VERBOSE \
> $target
#set +x
