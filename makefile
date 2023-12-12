# makefile for myphysicslab
#
# Copyright 2023 Erik Neumann. All Rights Reserved.
# Use of this source code is governed by the Apache License, Version 2.0.
# See the LICENSE file and http://www.apache.org/licenses/LICENSE-2.0.
#
# NOTE: you need to run the TypeScript compiler 'tsc' before running 'make'.
# It's still unclear to me why 'tsc' doesn't work when run from within this makefile.
#
# You need to create a symbolic link for esbuild in the myphysicslab directory, with
# a command like this (using the path to esbuild on your system)
#    ln -s node_modules/esbuild/bin/esbuild esbuild
# You can test whether this works by doing:
#    cd myphysicslab
#    ./esbuild --version
#
# If you want to build the documentation, you also need to make a symbolic link
# for typedoc, like this  (using the path to typedoc on your system)
#    ln -s node_modules/typedoc/bin/typedoc typedoc
# You can test whether this works by doing:
#    cd myphysicslab
#    ./typedoc --version
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

# set the default target here.  Prerequisites are given later on.
all:
#
# Detect which operating system we are running under
# From: https://stackoverflow.com/questions/714100/os-detecting-makefile
ifeq ($(OS),Windows_NT)
    detected_OS := Windows
else
    detected_OS := $(shell uname -s)
endif

# Different copy command for different operating systems
# For MacOS (Darwin) we want -X to not copy extended attributes
COPY_CMD := cp -va
ifeq ($(detected_OS),Darwin)
    COPY_CMD := cp -vaX
endif

# BUILD_DIR is name of build directory, relative to makefile location
BUILD_DIR := build

# if LOCALE is not specified, then build all locale versions
ifndef LOCALE
    LOCALE := en de
endif

biketimer: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/experimental/BikeTimerApp-$(loc).html )
billiards: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/BilliardsApp-$(loc).html )
billiards2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/Billiards2App-$(loc).html )
blank: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/BlankApp-$(loc).html )
blankslate: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/experimental/BlankSlateApp-$(loc).html )
brachisto: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/roller/BrachistoApp-$(loc).html )
carsuspension: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/CarSuspensionApp-$(loc).html )
cartpendulum2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/CartPendulum2App-$(loc).html )
cartpendulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/CartPendulumApp-$(loc).html )
chain: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/ChainApp-$(loc).html )
chainofsprings: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/ChainOfSpringsApp-$(loc).html )
circletrack: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/CircleTrack-$(loc).html )
rigidbodyroller2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/RigidBodyRoller2-$(loc).html )
collideblocks: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/CollideBlocksApp-$(loc).html )
collidespring: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/CollideSpringApp-$(loc).html )
collisioncombo: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/misc/CollisionCombo-$(loc).html )
comparedoublependulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/CompareDoublePendulumApp-$(loc).html )
comparedoublependulum2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/CompareDoublePendulumApp2-$(loc).html )
comparependulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/ComparePendulumApp-$(loc).html )
contact: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/ContactApp-$(loc).html )
create: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/CreateApp-$(loc).html )
create2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/CreateApp2-$(loc).html )
curvedtest: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/CurvedTestApp-$(loc).html )
danglestick: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/DangleStickApp-$(loc).html )
donothing: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/DoNothingApp-$(loc).html )
double2dspring: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/Double2DSpringApp-$(loc).html )
doublependulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/DoublePendulumApp-$(loc).html )
doublependulum2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/DoublePendulum2App-$(loc).html )
doublespring: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/DoubleSpringApp-$(loc).html )
fastball: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/FastBallApp-$(loc).html )
gears: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/GearsApp-$(loc).html )
graphcalc: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/experimental/GraphCalcApp-$(loc).html )
graphcalc2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/experimental/GraphCalc2App-$(loc).html )
impulse: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/ImpulseApp-$(loc).html )
inclineplane: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/InclinePlane-$(loc).html )
index: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/index-$(loc).html )
lagrangeroller: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/roller/LagrangeRollerApp-$(loc).html )
magnetwheel: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/misc/MagnetWheelApp-$(loc).html )
marsmoon: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/MarsMoonApp-$(loc).html )
molecule1: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/Molecule1App-$(loc).html )
molecule2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/Molecule2App-$(loc).html )
molecule3: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/Molecule3App-$(loc).html )
moveabledoublependulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/MoveableDoublePendulumApp-$(loc).html )
moveablependulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/MoveablePendulumApp-$(loc).html )
multigraphcalc2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/experimental/MultiGraphCalc2App-$(loc).html )
multiplecollision: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/MultipleCollisionApp-$(loc).html )
multispring: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/MultiSpringApp-$(loc).html )
mutualattract: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/MutualAttractApp-$(loc).html )
newtonscradle: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/NewtonsCradleApp-$(loc).html )
pendulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/PendulumApp-$(loc).html )
pendulumclock: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/PendulumClockApp-$(loc).html )
pendulumspring: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/PendulumSpringApp-$(loc).html )
perf: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/test/PerformanceTests-$(loc).html )
pile: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/PileApp-$(loc).html )
pileattract: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/PileAttractApp-$(loc).html )
polygontest: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/PolygonTestApp-$(loc).html )
reactionpendulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/ReactionPendulumApp-$(loc).html )
rigidbody: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/RigidBodyApp-$(loc).html )
rigidbodyroller: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/roller/RigidBodyRollerApp-$(loc).html )
rigiddoublependulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/RigidDoublePendulumApp-$(loc).html )
rigiddoublependulum2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/RigidDoublePendulumApp2-$(loc).html )
robotspeed: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/misc/RobotSpeedApp-$(loc).html )
rollerdouble: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/roller/RollerDoubleApp-$(loc).html )
rollerflight: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/roller/RollerFlightApp-$(loc).html )
rollersingle: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/roller/RollerSingleApp-$(loc).html )
rollerspring: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/roller/RollerSpringApp-$(loc).html )
simple: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/experimental/SimpleApp-$(loc).html )
singletest: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/test/SingleTest-$(loc).html )
singleviewer: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/test/SingleViewerApp-$(loc).html )
singlespring: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/SingleSpringApp-$(loc).html )
singlespring2: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/SingleSpring2App-$(loc).html )
singlespring3: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/SingleSpring3App-$(loc).html )
spring2d: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/Spring2DApp-$(loc).html )
string: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pde/StringApp-$(loc).html )
stucktest: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/test/StuckTestApp-$(loc).html )
terminalspring: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/TerminalSpringApp-$(loc).html )
terminalspring2d: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/springs/TerminalSpring2DApp-$(loc).html )
test: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/test/Engine2DTests-$(loc).html )
testbody: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/engine2D/TestBodyApp-$(loc).html )
testviewer: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/test/TestViewerApp-$(loc).html )
unittest: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/test/UnitTest-$(loc).html )
vectorgraphpendulum: $(foreach loc,$(LOCALE),\
  $(BUILD_DIR)/sims/pendulum/VectorGraphPendulumApp-$(loc).html )

# special rules for HTML file which requires different-named JS file

$(BUILD_DIR)/sims/experimental/MultiGraphCalc2App%.html : \
  src/sims/experimental/MultiGraphCalc2App.html $(macros_req) | settings \
  $(BUILD_DIR)/sims/experimental/GraphCalc2App%.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt

$(BUILD_DIR)/sims/engine2D/Billiards2App%.html : \
  src/sims/engine2D/Billiards2App.html $(macros_req) | settings \
  $(BUILD_DIR)/sims/engine2D/CreateApp%.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt

$(BUILD_DIR)/sims/pendulum/CompareDoublePendulumApp2%.html : \
  src/sims/pendulum/CompareDoublePendulumApp2.html $(macros_req) | settings \
  $(BUILD_DIR)/sims/pendulum/CompareDoublePendulumApp%.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt

$(BUILD_DIR)/sims/pendulum/RigidDoublePendulumApp2%.html : \
  src/sims/pendulum/RigidDoublePendulumApp2.html $(macros_req) | settings \
  $(BUILD_DIR)/sims/pendulum/RigidDoublePendulumApp%.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt

$(BUILD_DIR)/sims/springs/Molecule2App%.html : src/sims/springs/Molecule2App.html \
  $(macros_req) | settings $(BUILD_DIR)/sims/experimental/BlankSlateApp%.js \
  $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt

$(BUILD_DIR)/sims/springs/TerminalSpring2DApp%.html : \
  src/sims/springs/TerminalSpring2DApp.html $(macros_req) | settings \
  $(BUILD_DIR)/sims/springs/TerminalSpringApp%.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt

$(BUILD_DIR)/sims/springs/MultiSpringApp%.html : src/sims/springs/MultiSpringApp.html \
 $(macros_req) | settings $(BUILD_DIR)/sims/springs/SingleSpringApp%.js \
 $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt


app_names := sims/engine2D/BilliardsApp \
sims/engine2D/Billiards2App \
sims/engine2D/BlankApp \
sims/engine2D/CarSuspensionApp \
sims/engine2D/CartPendulum2App \
sims/engine2D/ChainApp \
sims/engine2D/ContactApp \
sims/engine2D/CreateApp \
sims/engine2D/CreateApp2 \
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
sims/engine2D/PileAttractApp \
sims/engine2D/PolygonTestApp \
sims/engine2D/RigidBodyApp \
sims/engine2D/TestBodyApp \
sims/experimental/BikeTimerApp \
sims/experimental/BlankSlateApp \
sims/experimental/GraphCalcApp \
sims/experimental/GraphCalc2App \
sims/experimental/MultiGraphCalc2App \
sims/experimental/SimpleApp \
sims/misc/CollisionCombo \
sims/misc/MagnetWheelApp \
sims/misc/RobotSpeedApp \
sims/pde/StringApp \
sims/pendulum/CartPendulumApp \
sims/pendulum/CompareDoublePendulumApp \
sims/pendulum/CompareDoublePendulumApp2 \
sims/pendulum/ComparePendulumApp \
sims/pendulum/DoublePendulumApp \
sims/pendulum/MoveableDoublePendulumApp \
sims/pendulum/MoveablePendulumApp \
sims/pendulum/PendulumApp \
sims/pendulum/ReactionPendulumApp \
sims/pendulum/RigidDoublePendulumApp \
sims/pendulum/RigidDoublePendulumApp2 \
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
sims/springs/Molecule2App \
sims/springs/Molecule3App \
sims/springs/MultiSpringApp \
sims/springs/SingleSpringApp \
sims/springs/SingleSpring2App \
sims/springs/SingleSpring3App \
sims/springs/Spring2DApp \
sims/springs/TerminalSpringApp \
sims/springs/TerminalSpring2DApp \
test/Engine2DTests \
test/PerformanceTests \
test/SingleTest \
test/SingleViewerApp \
test/StuckTestApp \
test/TestViewerApp \
test/UnitTest


bld_apps := $(addprefix $(BUILD_DIR)/,$(app_names))

# Copy stylesheet.css to build/
css_files := $(wildcard src/stylesheet*.css)
bld_css := $(subst src/,$(BUILD_DIR)/,$(css_files))
$(bld_css): $(BUILD_DIR)/%.css : src/%.css
	@mkdir -v -p $(dir $@)
	@$(COPY_CMD) $< $@

# Copy images to build/images
img_files := $(wildcard src/images/*.png src/images/*.gif src/images/*.jpg \
src/images/*.mp3)

build_images := $(subst src/,$(BUILD_DIR)/,$(img_files))
$(build_images): $(BUILD_DIR)/images/% : src/images/%
	@mkdir -v -p $(dir $@)
	@$(COPY_CMD) $< $@

src_ts := $(shell find src -name '*.ts')
lab_ts := $(shell find src/lab -name '*.ts')

macros_req := src/macros.html \
src/macros_tab.html \
src/macros_vert.html

# Extra requirement for some HTML test files
$(BUILD_DIR)/test/UnitTest*.html \
$(BUILD_DIR)/test/Engine2DTests*.html \
$(BUILD_DIR)/test/PerformanceTests*.html \
$(BUILD_DIR)/test/SingleTest*.html : src/test/macros_test.html

# tsc seems to not work from within makefile
#$(BUILD_DIR)%.js : src/%.ts
#	./node_modules/.bin/tsc

# about bash quotes:  in bash, single-quote suppresses any interpretation of what
# is inside the single quotes.  For example:
#     echo '"$(date)"'
#     "$(date)"
# But inside the makefile, the command $(shell date) is executed BEFORE the 
# command is passed to bash.  Even though that command is inside single quotes.
# The makefile command
#     echo '"$(shell date)"'
# looks like this to bash
#     echo '"Mon Apr 3 07:51:06 PDT 2023"'
#     "Mon Apr 3 07:51:06 PDT 2023"

apps_js_en := $(addsuffix -en.js,$(bld_apps))
$(apps_js_en): $(BUILD_DIR)/%-en.js : $(BUILD_DIR)/%.js
	./esbuild $< --outfile=$@ --bundle --format=iife \
	--platform=browser  \
	--global-name=mpl --define:MPL_LOCALE='"en"' \
	--define:MPL_BUILD_TIME='"$(shell date)"' --minify

apps_js_de := $(addsuffix -de.js,$(bld_apps))
$(apps_js_de): $(BUILD_DIR)/%-de.js : $(BUILD_DIR)/%.js
	./esbuild $< --outfile=$@ --bundle --format=iife \
	--platform=browser  \
	--global-name=mpl --define:MPL_LOCALE='"de"' \
	--define:MPL_BUILD_TIME='"$(shell date)"' --minify

# rules for HTML file which requires same-named JS file (most apps are like this)

$(BUILD_DIR)/%-en.html : src/%.html src/index_order.txt $(macros_req) | settings \
  $(BUILD_DIR)/%-en.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt

$(BUILD_DIR)/%-de.html : src/%.html src/index_order.txt $(macros_req) | settings \
  $(BUILD_DIR)/%-de.js $(build_images) $(bld_css)
	./prep_html.pl $< $@ src/index_order.txt

index_files := $(BUILD_DIR)/index-en.html $(BUILD_DIR)/index-de.html
$(index_files): $(BUILD_DIR)/index-%.html : src/index.html src/macros.html
	@mkdir -v -p $(dir $@)
	./prep_html.pl $< $@ ""


# Copy all .css files from src/docs/ to docs/ directory.
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_css := $(subst src/docs/,docs/,$(wildcard src/docs/*.css))
$(doc_css): docs/%.css : src/docs/%.css
	@mkdir -v -p $(dir $@)
	@$(COPY_CMD) $< $@

# Copy all .svg files from src/docs/ to docs/ directory.
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_svg := $(subst src/docs/,docs/,$(wildcard src/docs/*.svg))
$(doc_svg): docs/%.svg : src/docs/%.svg
	@mkdir -v -p $(dir $@)
	@$(COPY_CMD) $< $@

# Copy all .pdf files from src/docs/ to docs/ directory.
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_pdf := $(subst src/docs/,docs/,$(wildcard src/docs/*.pdf))
$(doc_pdf): docs/%.pdf : src/docs/%.pdf
	@mkdir -v -p $(dir $@)
	@$(COPY_CMD) $< $@

# Copy all .jpg files from src/docs/ to docs/ directory.
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_jpg := $(subst src/docs/,docs/,$(wildcard src/docs/*.jpg))
$(doc_jpg): docs/%.jpg : src/docs/%.jpg
	@mkdir -v -p $(dir $@)
	@$(COPY_CMD) $< $@

# Copy all .png files from src/docs/ to docs/ directory.
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_png := $(subst src/docs/,docs/,$(wildcard src/docs/*.png))
$(doc_png): docs/%.png : src/docs/%.png
	@mkdir -v -p $(dir $@)
	@$(COPY_CMD) $< $@

# Markdown documentation .md files are transformed to .html files by multimarkdown
# Use static pattern rule -- otherwise `make` will regard these as intermediate files
# and delete them after copying.
doc_md := $(subst .md,.html,$(subst src/docs/,docs/,$(wildcard src/docs/*.md)))
$(doc_md): docs/%.html : src/docs/%.md | $(doc_css) $(doc_svg) $(doc_pdf) $(doc_png) \
  $(doc_jpg)
	@mkdir -v -p $(dir $@)
	multimarkdown $< --output=$@

docs-md: $(doc_md)

docs: $(doc_md) $(doc_css) $(doc_svg) $(doc_pdf) $(doc_png) typedoc.json \
  tsconfig.json $(src_js)
	@mkdir -v -p docs
	./typedoc

apps-en: $(BUILD_DIR)/index-en.html $(addsuffix -en.html,$(bld_apps))

apps-de: $(BUILD_DIR)/index-de.html $(addsuffix -de.html,$(bld_apps))

apps: apps-en apps-de

combos: $(BUILD_DIR)/sims/misc/CollisionCombo-en.js \
$(BUILD_DIR)/sims/misc/CollisionCombo-de.js

all: settings apps combos

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
	@echo "index       Make index files (table of contents for tests)"
	@echo "perf        Make performance test"
	@echo "settings    Lists current value of important settings used by this makefile"
	@echo "test        Make engine2D test"
	@echo "unittest    Make unit tests"
	@echo ""
	@echo "Options:"
	@echo "BUILD_DIR=     where to put compiled files; default is build"
	@echo "LOCALE=        en, de; default is en"

settings:
	@echo "Current settings:"
	@echo "BUILD_DIR = $(BUILD_DIR)"
	@echo "LOCALE = $(LOCALE)"

# PHONY means "don't bother trying to make an actual file with this name"
# PHONY also means "always out of date if it has no prerequistes"
# PHONY also prevents implicit rules from trying to build these.
.PHONY: all apps apps-de apps-en clean deps docs help index settings unit-test \
  compiler docs-md engine2d experimental pendulums roller springs alltest

# If .DELETE_ON_ERROR is mentioned as a target anywhere in the makefile, then make will
# delete the target of a rule if it has changed and its recipe exits with a nonzero exit
# status.
.DELETE_ON_ERROR:
