# Configuration for myphysicslab makefile.
# Copyright 2016 Erik Neumann. All Rights Reserved.
# Use of this source code is governed by the Apache License, Version 2.0.
# See the LICENSE file and http://www.apache.org/licenses/LICENSE-2.0.
#
# Specifies information that is specific to each development environment, such as:
# 1. where tools are located such as closure compiler
# 2. build options such as compile level, locale, name of build directory, etc.

#CLOSURE_COMPILER := ../closure-compiler/target/closure-compiler-1.0-SNAPSHOT.jar
CLOSURE_COMPILER := ../compiler-latest/closure-compiler-v20160911.jar
export CLOSURE_COMPILER

# (optional: DOSSIER is for building documentation, otherwise you can ignore this)
# Location of js-dossier which builds documentation using closure compiler.
# See https://github.com/jleyba/js-dossier
# Install Bazel, then build js-dossier with command ./gendossier.sh -r
DOSSIER := ../js-dossier/bazel-bin/src/java/com/github/jsdossier/dossier_deploy.jar
export DOSSIER

# COMPILE_LEVEL determines whether HTML file loads advanced-compiled, simple-compiled
# or uncompiled source code.
# COMPILE_LEVEL can be "advanced", "simple", or "debug".
COMPILE_LEVEL ?= simple

# GOOG_DEBUG is passed to compile_js.sh, it determines whether goog.DEBUG=true
# Leave GOOG_DEBUG unspecified to let it be determined by COMPILE_LEVEL flag.
# GOOG_DEBUG ?= true

# LOCALE can be "en" or "de"
LOCALE ?= en

# Leave BUILD_DIR unspecified to let it be determined by COMPILE_LEVEL flag.
# Or specify BUILD_DIR if desired.
# BUILD_DIR ?= build

# Custom locations for build directories can be specified like this:
#ADV_BUILD_DIR := adv-build_foo
#export ADV_BUILD_DIR
#SIMPLE_BUILD_DIR := build_foo
#export SIMPLE_BUILD_DIR
#DEBUG_BUILD_DIR := debug_foo
#export DEBUG_BUILD_DIR
