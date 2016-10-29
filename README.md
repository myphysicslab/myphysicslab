myPhysicsLab README
===================
myPhysicsLab provides JavaScript classes to build real-time interactive
animated physics simulations.

The [myPhysicsLab website](http://67.199.21.25) shows the simulations running
and contains explanations of the math behind them.


Author and License
------------------
myPhysicsLab is provided as open source software under the
[Apache 2.0 License](http://www.apache.org/licenses/). See the accompanying
file named `LICENSE`. The author is Erik Neumann <erikn@myphysicslab.com>.

Source code is available at <https://github.com/myphysicslab/myphysicslab>.


Building
--------
It is possible to customize a myPhysicsLab simulation without
building from source code, see
[Customizing myPhysicsLab Simulations](http://67.199.21.25/develop/docs/Customizing.html).

To build from source code the required tools are

+ [Java 7 or higher](http://www.java.com)

+ [Perl](https://www.perl.org)

+ [GNU Make](https://www.gnu.org/software/make/)

+ [Closure Compiler](https://github.com/google/closure-compiler)

+ [Closure Library](https://github.com/google/closure-library) is a separate
    download from Closure Compiler. It is a collection of JavaScript source
    code.

Once the prerequisites are on your system, follow these steps:

1. Download the myPhysicsLab source code from
    <https://github.com/myphysicslab/myphysicslab>.

2. Copy the file `sampleConfig.mk` to `myConfig.mk` and edit `myConfig.mk` to
    specify location of Closure Compiler in the `CLOSURE_COMPILER` variable.

3. Create a **symbolic link** to `closure-library` in the directory that has
    the `makefile`. Example of how to create the symbolic link:

        $ ln -s ../closure-library/ closure-library

4. Execute `make` at the command line. (Set your directory to where the `makefile` is).
    This will compile all applications and tests in all language versions (using the
    default option `COMPILE_LEVEL=simple`).
    Execute `make help` to see available options.

5.  Open the file `myphysicslab/build/index_en.html` with a browser. This has
    links to all the files that were built.

NOTE: the HTML files in the source directories **cannot be used directly** from
a browser. You must complete the build process first.

See [Building myPhysicsLab Software](http://67.199.21.25/develop/docs/Building.html)
for more information about the build process.


Documentation
-------------
See [myPhysicsLab Documentation](http://67.199.21.25/develop/docs/index.html)
for overview of architecture and for detailed documentation of software.


Examples
--------
There are around 50 different simulations in the source code, each of which has
has an example file which is mainly for development and testing.

The example files are available online in two forms:
[advanced-compiled](http://67.199.21.25/develop/adv-build/index_en.html)
which loads faster and
[simple-compiled](http://67.199.21.25/develop/build/index_en.html)
which allows for more customization.
