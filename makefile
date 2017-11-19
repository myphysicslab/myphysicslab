# makefile for jssimlab: the javascript version of myphysicslab
#
# Copyright 2016 Erik Neumann. All Rights Reserved.
# Use of this source code is governed by the Apache License, Version 2.0.
# See the LICENSE file and http://www.apache.org/licenses/LICENSE-2.0.
#
# NOTE:  You should copy the file sampleConfig.mk to myConfig.mk and modify
# myConfig.mk according to your environment settings.  This makefile will
# automatically create myConfig.mk if it doesn't exist.
#
# Instead of using sampleConfig to define environment variables, we use
# myConfig which is not checked in to the source control system so that
# each user can have their own environment settings.
#
# Build process explanation:
#
# ** source files **
# Consider for example the simulation src/sims/springs/Spring1App.js.  There are also
# the accompanying files Spring1.js, and Spring1App.html in that directory.
# When building, we are only concerned with the "App" files: Spring1App.js and 
# Spring1App.html.  Those will include whatever other files they need, and the closure
# compiler will handle all of the dependencies.
#
# ** run in uncompiled mode **
# You can run Spring1App.html directly from the source directory and it will run
# in uncompiled mode from the set of source files.  Note that the dependency file
# build/deps.js is required in uncompiled mode. This will run with the default locale
# setting, though locale can be changed in the html file via goog.define.
#
# ** compile javascript **
# We compile Spring1App.js via the compile_js script to create localized (english,
# german, etc.) versions, these are put in the corresponding build directory at
# for example build/sims/springs/Spring1App-de.js.
# To see compiler options:
#    java -jar ../javascript/closure-compiler/build/compiler.jar --help
#
# ** process html **
# We process Spring1App.html to create versions that load the compiled javascript 
# in english or german via prep_html.pl. These are put in the corresponding
# build directory at for example build/sims/springs/Spring1App-de.html.
#
# ** prerequisites **
# This makefile attempts to reduce recompiling files when not needed by specifying
# prerequisites.  For javascript files this is rather crude.  Most every target
# depends on ALL the javascript files in src/lab, although that is not actually
# the case.  Without more detailed dependency information, this is the best
# we can do. We do specify other dependencies in more detail, such as the
# tests having different dependencies than the simulation apps.
#
# ** makefile hints **
#  Below are some hints about using and reading this makefile.  See also the make
#  manual at http://www.gnu.org/software/make/manual/make.html
#
# Shorthand target names:
# While developing, to avoid compiling every app you will typically specify a single
# app to compile.  To reduce typing you can add a shorthand target name to your
# myConfig.mk, like this:
#      spring1: $(BUILD_DIR)/sims/springs/Spring1App-en.html
# Then to compile that one app type just:
#      make spring1
#
# Command-line arguments:
# Some 'make' variables can be set in command line arguments to 'make'.
# Example: to create advanced-optimized compile files in a separate directory:
#     make COMPILE_LEVEL=advanced BUILD_DIR=adv-build
# You can even do both the regular build and the advanced build on one line:
#     make; make COMPILE_LEVEL=advanced BUILD_DIR=adv-build
# The first invocation of 'make' will use whatever are the defaults in myConfig.mk.
# The second invocation will override the given arguments.
#
# Tabs:
# Note that tabs are significant syntax in makefiles, but only on 'non-continued'
# lines.  A non-continued line is a line that is not a continuation of a previous
# line.  Lines are continued by ending with the \ (back-slash) character.
# Only 'recipe' (aka 'command') non-continued lines should start with a tab.
#
# Automatic variables:
# $@  The file name of the target of the rule.
# $<  The name of the first prerequisite.
# $^  The names of all the prerequisites, with spaces between them.
#
# Pattern- or Target-Specific Variables:
# Are variable definitions attached to a target that are valid only during the
# processing of that target and any of its prerequisites.
#   target : variable := value
#
# Order-only Prerequisites:
# In a rule, the prerequisites to the right of a | (pipe symbol) are "order-only".
# Like a "normal" prerequisite it means these files must exist prior to building 
# the target;  but when they change they do not trigger rebuilding of the target.
#
# Static Pattern Rules:
# We use many static pattern rules because otherwise `make` ignores
# prerequisites that don't exist. See
# stackoverflow.com/questions/23964228/make-ignoring-prerequisite-that-doesnt-exist
# Static Pattern Rule is like a Pattern rule, but only applies to an explicit list
# of target files. Example: $(OBJECTS): %.o: %.c.
# This is because `make` regards any file that doesn't appear as a target or goal
# as an intermediate file.
#
# Debugging hints:
# make -d  Print  debugging  information in addition to normal processing.
# make -n  Print the commands that would be executed, but do not execute them.
# make -r  Eliminate use of the built-in implicit rules.
# make -s  Silent mode, don't print commands as they are executed
# make -t  touch mode, Marks targets as up to date without actually changing them.
# make help  Prints descriptions of available targets
# Try adding a line to a recipe like this to see value of automatic variables
#    echo $^
#
# Using make -n and make -t are useful for debugging the makefile dependencies.
#
# Testing the makefile:
# After making everything, try deleting files that were made as a by-product.
# For example, delete an image from build/images.  Then make the app again.
# If the image is recreated (copied) then all is well.  This problem was originally
# found Jan 24 2016. The solution is to use "static pattern rule".
# Another example: after making an html "app", try to delete the javascript for
# that app.  Then make the app again.  If the javascript is recreated, all is well.
# Or, try modifying a javascript file that the app requires; make should recreate
# the javascript even when you are asking to build the app's html file.
#
# TO DO:
# Get specific prerequisites for each file from depswriter?  To avoid recompiling files
# when not needed.

# set the default target here.  Prerequisites are given later on.
all:

# myConfig.mk defines variables such as BUILD_DIR, COMPILE_LEVEL, etc.
# You can use sampleConfig.mk as a model when creating your own custom myConfig.mk.
include myConfig.mk

# ?= is for conditional variables: only happens if variable not yet defined and
# when used (lazy). Can be overridden via command line, environment variable, etc.

# COMPILE_LEVEL determines whether HTML file loads advanced-compiled, simple-compiled
# or uncompiled source code.
# COMPILE_LEVEL can be "advanced", "simple", or "debug".
COMPILE_LEVEL ?= simple
ifneq "$(COMPILE_LEVEL)" "simple"
    ifneq "$(COMPILE_LEVEL)" "advanced"
        ifneq "$(COMPILE_LEVEL)" "debug"
            $(error COMPILE_LEVEL=$(COMPILE_LEVEL), must be simple, advanced, or debug)
        endif
    endif
endif


# BUILD_DIR is name of build directory, relative to makefile location
ADV_BUILD_DIR ?= adv-build
SIMPLE_BUILD_DIR ?= build
DEBUG_BUILD_DIR ?= debug
ifndef BUILD_DIR
    BUILD_DIR := $(SIMPLE_BUILD_DIR)
    ifeq "$(COMPILE_LEVEL)" "advanced"
        BUILD_DIR := $(ADV_BUILD_DIR)
    else
        ifeq "$(COMPILE_LEVEL)" "debug"
            BUILD_DIR := $(DEBUG_BUILD_DIR)
        endif
    endif
endif

# if LOCALE is not specified, then build all locale versions
ifndef LOCALE
    LOCALE := en de
endif

# GOOG_DEBUG is passed to compile_js, determines whether goog.DEBUG=true
GOOG_DEBUG ?= false

# UTIL_DEBUG is passed to compile_js, determines whether Util.DEBUG=true
UTIL_DEBUG ?= false

biketimer: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/experimental/BikeTimerApp-$(loc).html )
billiards: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/BilliardsApp-$(loc).html )
blank: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/BlankApp-$(loc).html )
blankslate: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/experimental/BlankSlateApp-$(loc).html )
brachisto: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/roller/BrachistoApp-$(loc).html )
carsuspension: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/CarSuspensionApp-$(loc).html )
cartpendulum2: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/CartPendulum2App-$(loc).html )
cartpendulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/CartPendulumApp-$(loc).html )
chain: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/ChainApp-$(loc).html )
chainofsprings: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/ChainOfSpringsApp-$(loc).html )
collideblocks: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/CollideBlocksApp-$(loc).html )
collidespring: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/CollideSpringApp-$(loc).html )
collisioncombo: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/experimental/CollisionCombo-$(loc).js )
comparedoublependulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/CompareDoublePendulumApp-$(loc).html )
comparependulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/ComparePendulumApp-$(loc).html )
contact: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/ContactApp-$(loc).html )
curvedtest: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/CurvedTestApp-$(loc).html )
danglestick: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/DangleStickApp-$(loc).html )
donothing: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/DoNothingApp-$(loc).html )
double2dspring: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/Double2DSpringApp-$(loc).html )
doublependulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/DoublePendulumApp-$(loc).html )
doublependulum2: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/DoublePendulum2App-$(loc).html )
doublespring: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/DoubleSpringApp-$(loc).html )
fastball: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/FastBallApp-$(loc).html )
gears: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/GearsApp-$(loc).html )
graphcalc: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/experimental/GraphCalcApp-$(loc).html )
impulse: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/ImpulseApp-$(loc).html )
index: $(foreach loc,$(LOCALE),$(BUILD_DIR)/index-$(loc).html )
lagrangeroller: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/roller/LagrangeRollerApp-$(loc).html )
marsmoon: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/MarsMoonApp-$(loc).html )
marsmoon: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/MarsMoonApp-$(loc).html )
molecule1: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/Molecule1App-$(loc).html )
molecule3: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/Molecule3App-$(loc).html )
molecule4: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/Molecule4App-$(loc).html )
moveabledoublependulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/MoveableDoublePendulumApp-$(loc).html )
moveablependulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/MoveablePendulumApp-$(loc).html )
multiplecollision: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/MultipleCollisionApp-$(loc).html )
multispring: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/MultiSpringApp-$(loc).html )
mutualattract: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/MutualAttractApp-$(loc).html )
newtonscradle: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/NewtonsCradleApp-$(loc).html )
pendulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/PendulumApp-$(loc).html )
pendulumclock: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/PendulumClockApp-$(loc).html )
pendulumspring: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/PendulumSpringApp-$(loc).html )
perf: $(foreach loc,$(LOCALE),$(BUILD_DIR)/test/PerformanceTests-$(loc).html )
pile: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/PileApp-$(loc).html )
pileattract: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/PileAttractApp-$(loc).html )
polygontest: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/PolygonTestApp-$(loc).html )
reactionpendulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/ReactionPendulumApp-$(loc).html )
rigidbody: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/RigidBodyApp-$(loc).html )
rigidbodyroller: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/roller/RigidBodyRollerApp-$(loc).html )
rigiddoublependulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/RigidDoublePendulumApp-$(loc).html )
rollerdouble: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/roller/RollerDoubleApp-$(loc).html )
rollerflight: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/roller/RollerFlightApp-$(loc).html )
rollersingle: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/roller/RollerSingleApp-$(loc).html )
rollerspring: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/roller/RollerSpringApp-$(loc).html )
simple: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/experimental/SimpleApp-$(loc).html )
singletest: $(foreach loc,$(LOCALE),$(BUILD_DIR)/test/SingleTest-$(loc).html )
singleviewer: $(foreach loc,$(LOCALE),$(BUILD_DIR)/test/SingleViewerApp-$(loc).html )
singlespring: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/SingleSpringApp-$(loc).html )
singlespring2: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/SingleSpring2App-$(loc).html )
spring2d: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/Spring2DApp-$(loc).html )
string: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pde/StringApp-$(loc).html )
stucktest: $(foreach loc,$(LOCALE),$(BUILD_DIR)/test/StuckTestApp-$(loc).html )
terminalspring: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/TerminalSpringApp-$(loc).html )
terminalspring2d: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/springs/TerminalSpring2DApp-$(loc).html )
test: $(foreach loc,$(LOCALE),$(BUILD_DIR)/test/Engine2DTests-$(loc).html )
testbody: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/engine2D/TestBodyApp-$(loc).html )
testviewer: $(foreach loc,$(LOCALE),$(BUILD_DIR)/test/TestViewerApp-$(loc).html )
unittest: $(foreach loc,$(LOCALE),$(BUILD_DIR)/test/UnitTest-$(loc).html )
unittestone: $(BUILD_DIR)/test/UnitTestOne.html
vectorgraphpendulum: $(foreach loc,$(LOCALE),$(BUILD_DIR)/sims/pendulum/VectorGraphPendulumApp-$(loc).html )

app_names := sims/engine2D/BilliardsApp \
sims/engine2D/BlankApp \
sims/engine2D/CarSuspensionApp \
sims/engine2D/CartPendulum2App \
sims/engine2D/ChainApp \
sims/engine2D/ContactApp \
sims/engine2D/CurvedTestApp \
sims/engine2D/DoNothingApp \
sims/engine2D/DoublePendulum2App \
sims/engine2D/FastBallApp \
sims/engine2D/GearsApp \
sims/engine2D/ImpulseApp \
sims/engine2D/MarsMoonApp \
sims/engine2D/MultipleCollisionApp \
sims/engine2D/MutualAttractApp \
sims/engine2D/NewtonsCradleApp \
sims/engine2D/PendulumClockApp \
sims/engine2D/PendulumSpringApp \
sims/engine2D/PileApp \
sims/engine2D/PileAttractApp\
sims/engine2D/PolygonTestApp \
sims/engine2D/RigidBodyApp \
sims/engine2D/TestBodyApp \
sims/experimental/BikeTimerApp \
sims/experimental/BlankSlateApp \
sims/experimental/GraphCalcApp \
sims/experimental/SimpleApp \
sims/pde/StringApp \
sims/pendulum/CartPendulumApp \
sims/pendulum/CompareDoublePendulumApp \
sims/pendulum/ComparePendulumApp \
sims/pendulum/DoublePendulumApp \
sims/pendulum/MoveableDoublePendulumApp \
sims/pendulum/MoveablePendulumApp \
sims/pendulum/PendulumApp \
sims/pendulum/ReactionPendulumApp \
sims/pendulum/RigidDoublePendulumApp \
sims/pendulum/VectorGraphPendulumApp \
sims/roller/BrachistoApp \
sims/roller/LagrangeRollerApp \
sims/roller/RigidBodyRollerApp \
sims/roller/RollerDoubleApp \
sims/roller/RollerFlightApp \
sims/roller/RollerSingleApp \
sims/roller/RollerSpringApp \
sims/springs/ChainOfSpringsApp \
sims/springs/CollideBlocksApp \
sims/springs/CollideSpringApp \
sims/springs/DangleStickApp \
sims/springs/Double2DSpringApp \
sims/springs/DoubleSpringApp \
sims/springs/Molecule1App \
sims/springs/Molecule3App \
sims/springs/Molecule4App \
sims/springs/MultiSpringApp \
sims/springs/SingleSpringApp \
sims/springs/SingleSpring2App \
sims/springs/Spring2DApp \
sims/springs/TerminalSpringApp \
sims/springs/TerminalSpring2DApp \
test/Engine2DTests \
test/PerformanceTests \
test/SingleTest \
test/SingleViewerApp \
test/StuckTestApp \
test/TestViewerApp

bld_apps := $(addprefix $(BUILD_DIR)/,$(app_names))

# CollisionCombo combines two apps; has no corresponding HTML page
combo_names := sims/experimental/CollisionCombo

bld_combos := $(addprefix $(BUILD_DIR)/,$(combo_names))

# Copy .css files to build/sims/layout
bld_css := $(BUILD_DIR)/stylesheet.css
$(bld_css): $(BUILD_DIR)/%.css : src/%.css
	@mkdir -v -p $(dir $@)
	@cp -vax $< $@

# Copy images to build/images
img_files := $(wildcard src/images/*.png src/images/*.gif src/images/*.jpg \
src/images/*.mp3)

build_images := $(subst src/,$(BUILD_DIR)/,$(img_files))
$(build_images): $(BUILD_DIR)/images/% : src/images/%
	@mkdir -v -p $(dir $@)
	@cp -vax $< $@

src_js := $(shell find src -name '*.js')
lab_js := $(shell find src/lab -name '*.js')

# Create the deps.js file, which has commands that tell goog.requires scripts
# where to find a given namespace and what other namespaces are needed
# to run any namespace.
#
# From http://code.google.com/p/closure-library/wiki/FrequentlyAskedQuestions
#    "Closure Library contains a deps.js file. The deps file serves two
#    purposes: It lists the location of files, so we can bootstrap them for
#    uncompiled testing. It forward-declares all type names even if their
#    files are not included in compilation. Unused type names can be
#    optimized away, whereas statics and other file contents cannot."
# Nov 2014:  deps.js is only needed to run from uncompiled source code.
# deps.js is no longer needed for compile, see
# https://github.com/google/closure-compiler/wiki/Manage-Closure-Dependencies
#
# Note that the --root_with_prefix option assumes there is a symlink for
# closure-library in the simlab directory. See Environment Setup in Overview.md.
# The --root_with_prefix option contains the path back to the jssimlab/src
# directory from closure-library/closure/bin -- but via the symbolic link
# to closure-library.
# For example, here is a file reference (split into two lines) generated within
# goog.importScript_ when running from source code:
# file:///Users/erikn/Documents/Programming/jssimlab/closure-library/closure/
# goog/../../../src/lab/util/GenericVector.js

$(BUILD_DIR)/deps.js : $(src_js)
	@mkdir -v -p $(dir $@)
	python ./closure-library/closure/bin/build/depswriter.py \
	--root_with_prefix="src ../../../src" > $@


# src/sims/engine2D prerequisites

$(BUILD_DIR)/sims/engine2D/*.js : src/sims/engine2D/Engine2DApp.js \
src/sims/engine2D/RigidBodyObserver.js \
src/sims/engine2D/ElasticitySetter.js

$(BUILD_DIR)/sims/engine2D/ChainApp*.js : src/sims/engine2D/ChainConfig.js

$(BUILD_DIR)/sims/engine2D/CurvedTestApp*.js : src/sims/engine2D/SixThrusters.js

$(BUILD_DIR)/sims/engine2D/DoNothingApp*.js : src/sims/engine2D/RotatingTestForce.js

$(BUILD_DIR)/sims/engine2D/GearsApp*.js : src/sims/engine2D/GearsConfig.js

$(BUILD_DIR)/sims/engine2D/PendulumClockApp*.js : src/sims/engine2D/PendulumClockConfig.js \
src/sims/engine2D/GearsConfig.js

$(BUILD_DIR)/sims/engine2D/PileApp*.js : src/sims/engine2D/PileConfig.js \
src/sims/engine2D/SixThrusters.js

$(BUILD_DIR)/sims/engine2D/DoublePendulum2App*.js : src/sims/engine2D/SixThrusters.js

$(BUILD_DIR)/sims/engine2D/RigidBodyApp*.js : src/sims/engine2D/SixThrusters.js

# src/sims/experimental prerequisites

$(BUILD_DIR)/sims/experimental/CollisionCombo*.js : src/sims/engine2D/MultipleCollisionApp.js \
src/sims/springs/CollideSpringApp.js \
src/sims/engine2D/Engine2DApp.js \
src/sims/engine2D/ElasticitySetter.js \
src/sims/engine2D/RigidBodyObserver.js

# src/sims/pde prerequisites

$(BUILD_DIR)/sims/pde/StringApp*.js : src/sims/pde/StringSim.js \
src/sims/pde/StringShape.js

# src/sims/pendulum prerequisites

$(BUILD_DIR)/sims/pendulum/CartPendulumApp*.js : src/sims/pendulum/CartPendulumSim.js

$(BUILD_DIR)/sims/pendulum/CompareDoublePendulumApp*.js : src/sims/pendulum/RigidDoublePendulumSim.js \
src/sims/common/CompareGraph.js \
src/sims/common/CompareTimeGraph.js

$(BUILD_DIR)/sims/pendulum/ComparePendulumApp*.js : src/sims/pendulum/PendulumSim.js \
src/sims/common/CompareGraph.js \
src/sims/common/CompareTimeGraph.js

$(BUILD_DIR)/sims/pendulum/DoublePendulumApp*.js : src/sims/pendulum/DoublePendulumSim.js

$(BUILD_DIR)/sims/pendulum/MoveableDoublePendulumApp*.js : src/sims/pendulum/MoveableDoublePendulumSim.js

$(BUILD_DIR)/sims/pendulum/MoveablePendulumApp*.js : src/sims/pendulum/MoveablePendulumSim.js

$(BUILD_DIR)/sims/pendulum/PendulumApp_*.js : src/sims/pendulum/PendulumSim.js

$(BUILD_DIR)/sims/pendulum/ReactionPendulumApp*.js : src/sims/pendulum/PendulumSim.js \
src/sims/pendulum/ReactionPendulumSim.js \
src/sims/common/CompareGraph.js \
src/sims/common/CompareTimeGraph.js

$(BUILD_DIR)/sims/pendulum/RigidDoublePendulumApp*.js : src/sims/pendulum/RigidDoublePendulumSim.js

$(BUILD_DIR)/sims/pendulum/VectorGraphPendulumApp*.js : src/sims/pendulum/PendulumSim.js

# src/sims/springs prerequisites

$(BUILD_DIR)/sims/springs/ChainOfSpringsApp*.js : src/sims/springs/ChainOfSpringsSim.js

$(BUILD_DIR)/sims/springs/CollideBlocksApp*.js : src/sims/springs/CollideBlocksSim.js \
src/sims/springs/BlockCollision.js

$(BUILD_DIR)/sims/springs/CollideSpringApp*.js : src/sims/springs/CollideSpringSim.js

$(BUILD_DIR)/sims/springs/Double2DSpringApp*.js : src/sims/springs/Double2DSpringSim.js

$(BUILD_DIR)/sims/springs/DoubleSpringApp*.js : src/sims/springs/DoubleSpringSim.js

$(BUILD_DIR)/sims/springs/Molecule1App*.js : src/sims/springs/Molecule1Sim.js

$(BUILD_DIR)/sims/springs/Molecule3App*.js : src/sims/springs/Molecule3Sim.js

$(BUILD_DIR)/sims/springs/Molecule4App*.js : src/sims/springs/Molecule4Sim.js \
src/sims/springs/SpringNonLinear.js

$(BUILD_DIR)/sims/springs/SingleSpringApp_*.js : src/sims/springs/SingleSpringSim.js

$(BUILD_DIR)/sims/springs/SingleSpring2App_*.js : src/sims/springs/SingleSpringSim.js \
src/sims/common/TimeGraph2.js

$(BUILD_DIR)/sims/springs/Spring2DApp*.js : src/sims/springs/Spring2DSim.js

$(BUILD_DIR)/sims/springs/TestSpringApp*.js : src/sims/springs/Spring1Sim.js

# src/sims/roller: too many prerequisites to list individually (but could be done)

$(BUILD_DIR)/sims/roller/*.js : src/sims/roller/*.js

$(BUILD_DIR)/sims/roller/RigidBodyRollerApp*.js : src/sims/engine2D/Engine2DApp.js \
src/sims/engine2D/RigidBodyObserver.js

# almost all sim apps have these prerequisites
# (TO DO: have separate prerequisites for engine2D apps vs others)
sims_req := $(lab_js) \
src/sims/common/AbstractApp.js \
src/sims/common/VerticalLayout.js \
src/sims/common/TabLayout.js \
src/sims/common/CommonControls.js \
src/sims/common/StandardGraph1.js \
src/sims/common/TimeGraph1.js

# tests require only a few .js files from src/sims/engine2D
test_req := src/test/*.js $(lab_js) \
src/sims/engine2D/GearsConfig.js \
src/sims/engine2D/DoNothingApp.js \
src/sims/engine2D/CurvedTestApp.js \
src/sims/engine2D/PendulumClockConfig.js \
src/sims/engine2D/RotatingTestForce.js \
src/sims/engine2D/PileConfig.js

# TestViewerApp requires only a few .js files from src/sims/engine2D
$(BUILD_DIR)/test/SingleViewerApp*.js $(BUILD_DIR)/test/TestViewerApp*.js : $(test_req) $(sims_req) \
src/sims/engine2D/ElasticitySetter.js \
src/sims/engine2D/RigidBodyObserver.js \
src/sims/roller/PathObserver.js

# all engine2D sims require these
$(BUILD_DIR)/sims/engine2D/*.js : src/sims/engine2D/ElasticitySetter.js \
src/sims/engine2D/RigidBodyObserver.js

macros_req := src/macros.html \
src/macros_tab.html \
src/macros_vert.html

$(BUILD_DIR)/sims/*/*.js : $(sims_req)
$(BUILD_DIR)/test/*.js : $(test_req)

# The following use Target Specific Variable Values
# https://www.gnu.org/software/make/manual/make.html#Target_002dspecific
# Turn off GOOG_DEBUG for maximum performance
$(BUILD_DIR)/test/PerformanceTests*.js : override GOOG_DEBUG:=false
# Turn on GOOG_DEBUG to ensure that assertions are working.
$(BUILD_DIR)/test/Engine2DTests*.js : override GOOG_DEBUG:=true
# Turn off UTIL_DEBUG to avoid seeing lots of debug messages during tests.
$(BUILD_DIR)/test/PerformanceTests*.js \
$(BUILD_DIR)/test/Engine2DTests*.js : override UTIL_DEBUG:=false

apps_js_en := $(addsuffix -en.js,$(bld_apps)) $(addsuffix -en.js,$(bld_combos))
$(apps_js_en): $(BUILD_DIR)/%-en.js : src/%.js
	./compile_js.sh $< $@ $(GOOG_DEBUG) $(UTIL_DEBUG) $(COMPILE_LEVEL)

apps_js_de := $(addsuffix -de.js,$(bld_apps)) $(addsuffix -de.js,$(bld_combos))
$(apps_js_de): $(BUILD_DIR)/%-de.js : src/%.js
	./compile_js.sh $< $@ $(GOOG_DEBUG) $(UTIL_DEBUG) $(COMPILE_LEVEL)

unit_test := $(BUILD_DIR)/test/UnitTest-en $(BUILD_DIR)/test/UnitTest-de
unit_test_js := $(addsuffix .js,$(unit_test))

# UnitTest is built with a special shell script and prerequisites.
# Note Oct 2015: MockClock requires goog.DEBUG to be true (unfortunately).
$(unit_test_js) : $(BUILD_DIR)/test/UnitTest%.js : $(lab_js) \
src/sims/springs/test/*.js \
src/sims/pendulum/test/*.js
	./compile_test.sh src $@ $(UTIL_DEBUG) $(COMPILE_LEVEL)

# Extra requirement for some HTML test files
$(BUILD_DIR)/test/Engine2DTests*.html \
$(BUILD_DIR)/test/PerformanceTests*.html \
$(BUILD_DIR)/test/SingleTest*.html : src/test/macros_test.html

# UnitTestOne needs special options: debug (uncompiled), no index_order file, no locale
$(BUILD_DIR)/test/UnitTestOne.html: src/test/UnitTestOne.html | $(BUILD_DIR)/deps.js
	./prep_html.pl $< $@ "" debug

ifeq "$(COMPILE_LEVEL)" "debug"
# make HTML file that loads uncompiled (source) JavaScript. Needs deps.js.
$(BUILD_DIR)/%-en.html : src/%.html src/index_order.txt $(macros_req) | settings $(BUILD_DIR)/deps.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt $(COMPILE_LEVEL)

$(BUILD_DIR)/%-de.html : src/%.html src/index_order.txt $(macros_req) | settings $(BUILD_DIR)/deps.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt $(COMPILE_LEVEL)

else
# special rule for HTML file which requires different-named JS file
$(BUILD_DIR)/sims/springs/TerminalSpring2DApp%.html : src/sims/springs/TerminalSpring2DApp.html $(macros_req) | settings $(BUILD_DIR)/sims/springs/TerminalSpringApp%.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt $(COMPILE_LEVEL)

$(BUILD_DIR)/sims/springs/MultiSpringApp%.html : src/sims/springs/MultiSpringApp.html $(macros_req) | settings $(BUILD_DIR)/sims/springs/SingleSpringApp%.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt $(COMPILE_LEVEL)

# rule for HTML file which requires same-named JS file (most apps are like this)
$(BUILD_DIR)/%-en.html : src/%.html src/index_order.txt $(macros_req) | settings  $(BUILD_DIR)/%-en.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt $(COMPILE_LEVEL)

$(BUILD_DIR)/%-de.html : src/%.html src/index_order.txt $(macros_req) | settings $(BUILD_DIR)/%-de.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt $(COMPILE_LEVEL)
endif

index_files := $(BUILD_DIR)/index-en.html $(BUILD_DIR)/index-de.html
$(index_files): $(BUILD_DIR)/index-%.html : src/index.html src/macros.html
	@mkdir -v -p $(dir $@)
	./prep_html.pl $< $@ "" $(COMPILE_LEVEL)

# Copy all .css files from src/docs/ to docs/ directory.
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_css := $(subst src/docs/,docs/,$(wildcard src/docs/*.css))
$(doc_css): docs/%.css : src/docs/%.css
	@mkdir -v -p $(dir $@)
	@cp -vax $< $@

# Copy all .svg files from src/docs/ to docs/ directory.
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_svg := $(subst src/docs/,docs/,$(wildcard src/docs/*.svg))
$(doc_svg): docs/%.svg : src/docs/%.svg
	@mkdir -v -p $(dir $@)
	@cp -vax $< $@

# Copy all .pdf files from src/docs/ to docs/ directory.
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_pdf := $(subst src/docs/,docs/,$(wildcard src/docs/*.pdf))
$(doc_pdf): docs/%.pdf : src/docs/%.pdf
	@mkdir -v -p $(dir $@)
	@cp -vax $< $@

# Copy all .png files from src/docs/ to docs/ directory.
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_png := $(subst src/docs/,docs/,$(wildcard src/docs/*.png))
$(doc_png): docs/%.png : src/docs/%.png
	@mkdir -v -p $(dir $@)
	@cp -vax $< $@

# Markdown documentation .md files are transformed to .html files by multimarkdown
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_md := $(subst .md,.html,$(subst src/docs/,docs/,$(wildcard src/docs/*.md)))
$(doc_md): docs/%.html : src/docs/%.md | $(doc_css) $(doc_svg) $(doc_pdf) $(doc_png)
	@mkdir -v -p $(dir $@)
	multimarkdown $< --output=$@

docs-md: $(doc_md)

# Use Dossier to create documentation from JavaScript source code.
# DOSSIER is location of the Java dossier.jar file.
# Note: Dossier creates hundreds of .html files (and .css and .js) so we cannot
# have any kind of "smart update" that does minimal work.  Instead we always
# recreate all the Dossier files whenever requesting to build "docs" target.
docs: $(doc_md) $(doc_css) $(doc_svg) $(doc_pdf) $(doc_png) dossier_config.json $(src_js)
	@mkdir -v -p $(dir $@)
	java -jar $(DOSSIER) -c dossier_config.json

# Following are Dossier commands using configuration flags instead of config.json
# These were used to figure out Dossier issue #96 "Dossier not generating docs when
# excludes are specified".
#	java -jar $(DOSSIER) --source "src/lab/util/*.js" --output docs2 --closure_library_dir `readlink closure-library`closure/goog
#	java -jar $(DOSSIER) --source "src/lab/util/*.js" --output docs2 --closure_library_dir `readlink closure-library`closure/goog --exclude "src/lab/util/test"

apps-en: $(BUILD_DIR)/index-en.html $(addsuffix -en.html,$(bld_apps))

apps-de: $(BUILD_DIR)/index-de.html $(addsuffix -de.html,$(bld_apps))

apps: apps-en apps-de

combos: $(addsuffix -en.js,$(bld_combos)) $(addsuffix -de.js,$(bld_combos))

deps: $(BUILD_DIR)/deps.js

index: $(index_files)

ifeq "$(COMPILE_LEVEL)" "debug"
all: settings apps index unit-test
else
all: settings apps index unit-test combos
endif

unit-test: $(addsuffix .html,$(unit_test))

# When a line starts with ‘@’, the echoing of that line is suppressed. The ‘@’ is
# discarded before the line is passed to the shell.
help:
	@echo "Available targets:"
	@echo "all         Make all applications, tests, index files"
	@echo "apps        Make all applications, tests"
	@echo "apps-de     Make German versions of apps"
	@echo "apps-en     Make English versions of apps"
	@echo "clean       Deletes build directory"
	@echo "compiler    Shows options for closure compiler"
	@echo "deps        Calculate dependencies needed for running uncompiled"
	@echo "docs        Make documentation"
	@echo "docs-md     Make markdown documentation (overview, engine2D, ...)"
	@echo "help        List available targets"
	@echo "perf        Make performance test"
	@echo "index       Make index files (table of contents for tests)"
	@echo "settings    Lists current value of important settings used by this makefile"
	@echo "test        Make engine2D test"
	@echo "unittest    Make unit tests"
	@echo ""
	@echo "Options:"
	@echo "COMPILE_LEVEL= advanced, simple, debug; default is simple"
	@echo "BUILD_DIR=     where to put compiled files; default is build"
	@echo "LOCALE=        en, de; default is en"
	@echo "UTIL_DEBUG=    true, false; default is false"
	@echo "GOOG_DEBUG=    true, false; default is false"

settings:
	@echo "Current settings:"
	@echo "COMPILE_LEVEL = $(COMPILE_LEVEL)"
	@echo "BUILD_DIR = $(BUILD_DIR)"
	@echo "LOCALE = $(LOCALE)"
	@echo "UTIL_DEBUG = $(UTIL_DEBUG)"
	@echo "GOOG_DEBUG = $(GOOG_DEBUG)"

compiler:
	java -jar $(CLOSURE_COMPILER) --version
	java -jar $(CLOSURE_COMPILER) --help

clean:
	rm -rf $(BUILD_DIR)

# PHONY means "don't bother trying to make an actual file with this name"
# PHONY also means "always out of date if it has no prerequistes"
# PHONY also prevents implicit rules from trying to build these.
.PHONY: all apps apps-de apps-en clean deps docs help index settings unit-test \
compiler docs-md

# If .DELETE_ON_ERROR is mentioned as a target anywhere in the makefile, then make will
# delete the target of a rule if it has changed and its recipe exits with a nonzero exit
# status.
.DELETE_ON_ERROR:
