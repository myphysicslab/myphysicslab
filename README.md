myPhysicsLab README
===================
myPhysicsLab provides JavaScript classes to build real-time interactive
animated physics simulations.

The [myPhysicsLab website](http://www.myphysicslab.com) shows the simulations running
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
[Customizing myPhysicsLab Simulations](http://www.myphysicslab.com/develop/docs/Customizing.html).

To build from source code the required tools are

+ [TypeScript](https://www.typescriptlang.org)

+ [esbuild](https://esbuild.github.io)

+ [Perl](https://www.perl.org)

+ [GNU Make](https://www.gnu.org/software/make/)

Once the prerequisites are on your system, follow these steps:

1. Download the myPhysicsLab source code from
    <https://github.com/myphysicslab/myphysicslab>. You can download a zip file
    from that github page, or use
    `git clone https://github.com/myphysicslab/myphysicslab.git`

2. Execute `tsc` at the command line, this will compile all the typescript `.ts` files
    to become JavaScript `.js` files in the `build` directory. (Set your directory to
    where the `makefile` is).

3. Execute `make` at the command line. (Set your directory to where the `makefile` is).
    This will create `.html` files for all applications and tests in all language
    versions. Execute `make help` to see available options.

5.  Open the file `/build/index-en.html` with a browser. This has
    links to all the files that were built.

NOTE: the HTML files in the source directories **cannot be used directly** from
a browser. You must complete the build process first.

See [Building myPhysicsLab Software](http://www.myphysicslab.com/develop/docs/Building.html)
for more information about the build process.


Installation Hints
------------------
Here are some hints about installing tools, this was on MacOS. Following
[this page](https://dyclassroom.com/howto-mac/how-to-install-typescript-on-mac-using-node-npm)
I use `HomeBrew` to install `node`, and then use node's `npm` to install the other
tools locally inside the myphysicslab directory:

    cd myphysicslab
    brew install node
    npm install typescript
    npm install esbuild
    npm install typedoc

Those commands create some directories and files (for example `node_modules`) inside
the myphysicslab directory that are unrelated to the myphysicslab project. The
`.gitignore` file contains entries to prevent these from being added to the
myphysicslab project.

I create alias for these commands in my `.bash_profile` like this

    alias tsc=~/Documents/Programming/myphysicslab/node_modules/typescript/bin/tsc
    alias typedoc=~/Documents/Programming/myphysicslab/node_modules/typedoc/bin/typedoc
    alias esbuild=~/Documents/Programming/myphysicslab/node_modules/esbuild/bin/esbuild


Documentation
-------------
See [myPhysicsLab Documentation](http://www.myphysicslab.com/develop/docs/index.html)
for overview of architecture and for detailed documentation of software.


Examples
--------
There are around 50 different simulations in the source code, each of which has
has an example file which is mainly for development and testing. Find them in the
[examples index](https://www.myphysicslab.com/develop/build/index-en.html).


History
-------
myPhysicsLab was started in 2000 using Java. From 2013 to 2016 the code was converted
to JavaScript that depended on Google Closure Compiler.

In 2023 the code was converted to TypeScript for a couple of reasons: to be able to
generate documentation, and because
[Google Closure Library is being retired](https://github.com/google/closure-library/issues/1214).

Because of how modules work in TypeScript, sometimes several classes or interfaces
are combined into a single file. For example the file `util/Observe.ts` contains what
was previously in 10 separate files. This can make finding things a little harder
in the new scheme.

&nbsp;

&nbsp;
