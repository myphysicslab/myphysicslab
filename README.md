myPhysicsLab README
===================

myPhysicsLab provides JavaScript classes to build real-time interactive
animated physics simulations.

The [myPhysicsLab website](http://67.199.21.25) shows the simulations running
and contains explanations of the math behind them.


Building
--------
It is possible to customize a myPhysicsLab simulation without
building from source code, see [Customizing myPhysicsLab
Simulations](Customizing.html).

The prerequisite tools are

+ [Java 7 or higher](www.java.com)

+ [Perl](https://www.perl.org)

+ [GNU Make](https://www.gnu.org/software/make/)

+ [Closure Compiler](https://github.com/google/closure-compiler), see also
    [Closure Compiler References](Building.html#closurecompilerreferences)

+ [Closure Library](https://github.com/google/closure-library) is a separate
    download from Closure Compiler. It is a collection of JavaScript source
    code, see [Closure Library References](Building.html#closurelibraryreferences).

Once the prerequisites are on your system, follow these steps:

1. Download the myPhysicsLab source code from
    <https://github.com/myphysicslab/myphysicslab>.

2. Copy the file `sampleConfig.mk` to `myConfig.mk` and edit `myConfig.mk` to
    specify location of Closure Compiler in the `CLOSURE_COMPILER` variable.

3. Create a **symbolic link** to `closure-library` in the `myphysicslab`
    directory. Example of how to create the symbolic link:

        $ ln -s ../closure-library/ closure-library

4. Execute `make` at the command line with your directory set to the directory
    containing the myphysicslab `makefile`.
    This will compile all applications and tests in all language versions (using the
    default option `COMPILE_LEVEL=simple`).
    Execute `make help` to see available options.

5.  Open the file `myphysicslab/build/index_en.html` with a browser. This has
    links to all the files that were built.

NOTE: the HTML files in the source directories **cannot be used directly** from
a browser. You must complete the build process first.

More details about building myPhysicsLab software are at
<http://67.199.21.25/develop/docs/Building.html>.



Documentation
-------------
myPhysicsLab Documentation is at <http://67.199.21.25/develop/docs/index.html>


Author and License
------------------

myPhysicsLab is provided as open source software under the
[Apache 2.0 License](http://www.apache.org/licenses/). See the accompanying
file named `LICENSE`. The author is Erik Neumann <erikn@myphysicslab.com>.

Source code is available at <https://github.com/myphysicslab/myphysicslab>.


