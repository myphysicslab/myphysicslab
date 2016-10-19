#!/usr/bin/perl
# Copyright 2016 Erik Neumann. All Rights Reserved.
# Use of this source code is governed by the Apache License, Version 2.0.
# See the LICENSE file and http://www.apache.org/licenses/LICENSE-2.0.
#
# Preprocess html files by doing macro substitutions (similar to C preprocessor) to
# transform text within the file, writing a new html file.
#
# @param {string} file = source file name, example: src/sims/mechanics/Spring1App.html
#
# @param {string} target = output file, example: build/sims/mechanics/Spring1App_en.html
#        The suffix determines the value of the #LOCALE macro.  For example
#        #LOCALE would be "en" for "Spring1App_en.html".  Default locale is "en"
#        when there is no suffix.
#
# @param {string} orderFile = file containing list of files for next/previous links,
#        (or empty string). Available in #NEXT_LINK, #PREV_LINK macros.
#
# @param {string} COMPILE_LEVEL = "simple", "advanced", or "debug" indicates what level
#        of compilation is being used for the accompanying JavaScript.
#        "debug" means uncompiled JavaScript. Available in #COMPILE_LEVEL macro.
#
#
# ------------ #define ----------------
#
# The macro definitions are roughly similar to the C preprocessor.
#
# #define makes a simple text replacement macro. It causes a 'token' to be replaced
# with some text.  Example:
#
#     #define L1  L<sub>1</sub>
#
# After this is defined, anytime we see the text L1 (as a separate word) then it
# is replaced by L<sub>1</sub>.
#
# It is legal to define a macro that expands to nothing:
#
#     #define FOO
#
# The # character can be used to delimit macro tokens: for example #L1, L1#, or #L1#
# will all be expanded into the same result.
#
# In a #define statement: WHEN THE MACRO TOKEN BEGINS WITH A #, THEN THE # IS REQUIRED.
# For example if the macro definition is
#
#     #define #L1  L<sub>1</sub>
#
# Then only the tokens #L1 and #L1# will be replaced.
# Requiring the leading # is recommended for making macros more visible to the reader
# of the code.
#
# Multi-line definitions use backslash '\' as line continuation. Note that unlike in
# the C preprocessor, we retain the newline in the definition.
#
# All macro definitions create perl regexp substitution rules. For example
#
#     #define L1  L<sub>1</sub>
#
# becomes
#
#     s~#?\bL1\b#?~L<sub>1</sub>~
#
# A #define cannot contain a ~ character because ~ is the regexp delimiter.
#
# The 'token' of the definition is stored along with the regexp substitution rule.
# The token does not include the leading #.
# If another #define occurs with the same token, then the previous #define
# is deleted.
#
#
# ------------ #rule ----------------
#
# #rule defines a raw perl substitution rule. It operates on the perl variable $_ which
# holds the current line being processed.
# Here is an example which replaces "sub(foo)" by "<sub>foo</sub>"
#
#     #rule s~#?\bsub\b#?\((.+?)\)~<sub>$1</sub>~
#
# By using a regular expression, a rule like this can appear to take multiple arguments.
# The replacement expression can include variables defined in this program such as
# $LOCALE, $targetName, $fileName.
#
# Rules have an empty string for their 'token', so they are never replaced and
# cannot be undefined.
#
#
# ------------ #defineFrom ----------------
#
# #defineFrom creates a #define rule by evaluating a regexp on some existing text.
# The text is first processed with any rules defined at the time, and then the
# regexp is applied to the processed text. The resulting text becomes the value
# for the rule that is created, similar to how #define works.
#
#      #defineFrom token {text} regexp
#
# Here is an example.
#
#     #define #APP_PATH sims.pendulum.DoublePendulumApp
#     #defineFrom #FILE_PATH {#APP_PATH} s~\.~/~g
#
# Then #FILE_PATH will evaluate to sims/pendulum/DoublePendulumApp.
#
# A #defineFrom must be on a single line.
#
#
# ------------ #mathDefine, #mathRule, #mathOn, #mathOff ---------
#
# These are similar to #define and #rule, except these rules are only active
# when "math mode" is on.  You turn math mode on or off by calling #mathOn
# or #mathOff.
#
# The idea is to make a set of rules for writing math as HTML, using tags like
# <sub>, <sup>, etc.  Turning math mode on or off ensures these rules will not
# affect anything other than these HTML math expressions.
# For example, these HTML-macro rules must not modify any LaTeX expressions
# on the same page when using MathJaX.
#
# The #mathOn and #mathOff directives can be included in other macros.
# For example, here are definitions to surround some HTML with both a special
# HTML <p> tag and also the #mathOn, #mathOff directives.
#
#     #define #eqn_start #mathOn \
#     <p class="display-equation">
#
#     #define #eqn_end </p> \
#     #mathOff
#
# Note that the embedded newlines (indicated by trailing slash at end of line)
# are required, because the #mathOn, #mathOff directives only work when they
# are at the beginning of a line (also, the rest of the line after #mathOn
# is discarded).
#
#
# ------------ #variable  ----------------
#
# #variable is a shortcut version of #mathDefine.  The following are equivalent
#
#     #variable _x  x
#     #mathDefine _x  <i>x</i>
#
#
# ------------ #undefine  ----------------
#
# Use #undefine TOKEN to delete a #define, #mathDefine, or #variable.
# Any rule that has a "token" name can be deleted.  The token can be preceded
# by a # or not, both ways will work:
#
#     #undefine #L1
#     #undefine L1
#
#
# ------------- #include -----------------------
#
# To include another file:
#
#     #include "macros.html"
#
# The included file can contain macro (rule) definitions or regular text content.
#
# Macro rules are applied to the name of the include file. This makes it possible to
# include different files depending on variables like #LOCALE or #COMPILE_LEVEL.
# For example:
#
#     #include "macros_#LOCALE.html"
#
# Would include the file "macros_de.html" when #LOCALE is "de".
#
#
# ------------- #comment -----------------------
#
# Comments are written as:
#
#     #comment  This is a comment.
#
# Comments must appear at the start of a line, but can have whitespace at front.
# Comments can be put inside of a multi-line macro definition, they are eliminated
# when processed.
#
# ------------- #macrosOn, #macrosOff -----------------------
#
# These commands turn macro processing on or off.  When macro processing is off
# we still process macro keywords (#define, etc.) but do not apply the set of
# macro rules to do text replacement.
#
#
# ---------- Pre-Defined Macros ------------------
#
# These macros are automatically created.
#
# #FILE_NAME gives the file name being processed without the type suffix.
#
# #BASE_NAME gives the file name being processed without locale suffix or
# file type.
#
# #DATE_TIME gives the current date
#
# #LOCALE gives the two-letter ISO 639-1 locale (for example en, de) derived
# from suffix of the target file name (for example _en, _de).
# If target file doesn't end with a locale, then #LOCALE is empty string.
#
# #COMPILE_LEVEL indicates what level of compilation is being used for the
# accompanying JavaScript. It is equal to the last argument passed to
# prep_html: "advanced", "simple" or "debug".
# "debug" means uncompiled JavaScript.
# .
#
#
# ---------- Next/Previous Links ------------------
#
# The next/previous links are read from the orderFile (typically this is
# `src/index_order.txt`). We create the pre-defined macros
#
#     #NEXT_LINK
#     #PREV_LINK
#
# These are created by finding the name of the current file in the orderFile
# and getting the preceding and succeeding entries in the orderFile.
# See Overview.md section "HTML Example Files for Applications".
#
#
# ------------- Order Is Significant -------------------
#
# Later rules are executed first.
#
# When a rule (macro) is defined it is prepended to the list of rules.  Therefore
# rules are executed in reverse order of when they are defined:  the last rule
# defined is the first to be attempted.
#
# Also keep in mind that this program runs in a single pass.  So only the rules
# that have been defined so far are available to execute.  Rules defined later
# have no effect on earlier text in the file.
#
# When a new rule is defined with the same token, the previous rule is deleted.
# The token is the name provided in #define, #mathDefine, or #variable.
# (The leading # is not part of the token).
#
#
# ------------- First Line, Blank Lines, White Space -------------------
#
# We throw away newlines and spaces at the start of the file.
# This is to ensure that the HTML doctype declaration is on the first line.
#
# We throw away blank lines that occur after macro directives (#define, etc.).
# This helps to make the resulting HTML file look better by not having
# multiple blank lines where there were macro definitions in the source
# HTML file.
#
# Macro keyword directives (#define, etc.) can have leading white space,
# but nothing else can precede them on a line.
#
# User-defined (and pre-defined) macros can appear anywhere, even in quotes.
#
#
# -------------  Debugging  ---------------------
#
# Two levels of debugging, controlled by setting the $debug variable.
# Higher level includes lower level of debug messages.
#
# $debug = 1
# Prints key computed variables such as file name, locale, next and previous
# links, etc.
#
# $debug = 10
# Prints each line as it is read, shows how rules are applied, prints complete
# rules database at end. Each time a rule is applied, the resulting changed
# text is printed, until there are no more changes, and then you see the final
# output text.
#
#
# -------------  How It Works  ------------------
#
# We build up a set of "rules" (or "macros") which are Perl regexp substitution
# expressions stored as text strings in the @rules array.  Each entry in the
# @rules array is a "record" (Perl hash) consisting of three fields:
#
#    TOKEN (string) the unique name of the rule (can be empty string)
#    MATH  (boolean) if true then the rule only fires in #mathOn mode
#    RULE  (string) the regexp substitution expression
#
# Most rules are user-defined via keyword directives like #rule, #define,
# or #variable which are read from the file(s) being processed.  Some rules
# are pre-defined in this program.
#
# The #include keyword reads another file, which usually defines macros (rules)
# but could also just be regular content (which would be added in place).
#
# We begin by reading a line from the input file into the "buffer" which holds
# yet unprocessed text.
#
# We consider one line at a time from the buffer. Lines are separated by a newline
# character (\n). We remove the line from the buffer.
#
# We first check for the various keywords (such as #define, #include,
# #comment, #macrosOff, etc.) and take appropriate action if those are found
# at the start of a line (leading whitespace is ignored).
#
# If the line doesn't start with a keyword, we then go thru the list
# of rules (macros).  When we find that a rule matches and changes the line
# (possibly into multiple lines) we then prepend the changed line to the buffer
# and start over: taking the first line from the buffer and processing that line
# as described above.  This process can happen many times for a single line
# because a macro can be replaced by multiple lines which can contain other macros.
#
# If no keywords (#define, #include, #comment, etc.) were found at the start of the
# line and no user defined macro rules changed the line, then the line is finished.
# We write the line to the target file, and fetch a new line from the buffer (or
# from the input file if the buffer is empty).
#
# Note that checkNoRule() is called frequently in the code.  Here's why:  there may
# be a multi-line #rule or #define that is "open" -- in process of being created.
# Until we see a line that ends without a continuation backslash, we keep adding
# the text to the currently open definition. Therefore, whenever we recognize a new
# keyword, we check that there is not an open rule.
#
#
# -------------  To Do List  ------------------
#
# TO DO: allow #rule to have a token, so that a rule can be #undefined or replaced.
# TO DO: close file handles if an error occurs.
# TO DO: check #define for ~ char, and pick a different delimiter for the regexp.
# TO DO: add option to use different symbol for delimiter other than #
# TO DO: create #default statement: like a #define or #rule, except it adds the rule to
#        the end of the list instead of the start, so it only takes effect if the rule
#        has not been previously defined. (Would need another flag to avoid deleting
#        the rule since it would have same token).
# TO DO: add a -d flag for debugging
# TO DO: instead of the fourth argument being compiled, could define a general
#        argument to create a macro with any name:  -macro(COMPILE_LEVEL=debug)

use strict;
use warnings;
use File::Path qw(make_path);
# This creates the global variable $NestedParen
use vars qw($NestedParen);

# Set $debug to 1 for key variables;  10 for verbose.
my $debug = 0;

# The #include keyword causes us to open and read from a new file.
# We keep a stack of filenames that tells what files are open for input.
my @filenames; # stack of open filenames; current file is last one
my @filelines; # array of current line number being processed for each file
my %fileHandles;  # hash map from filename to filehandle
my $inputFileName;  # name of file being processed
my $origLine;  # unaltered input line for error reporting

# ARGV[0] is source file, example: "src/sims/pendulum/DoublePendulumApp.html"
defined($ARGV[0]) or die "$0 ERROR no file specified";
my $file = $ARGV[0];
-e $file or die "$0 ERROR file $file does not exist";
-T $file or die "$0 ERROR file $file is not a text file";

# $originDir is where the source file is located: "src/sims/pendulum/"
$file =~ m{^(.*/)} or die "$0 ERROR finding origin directory";
my $originDir = $1;

# $orderName should be "sims/pendulum/DoublePendulumApp" to look up in order list
$file =~ /(.*)\.html$/ or die "$0 ERROR file $file does not end with .html";
my $orderName = $1;
# strip out "src/" from "src/sims/pendulum/DoublePendulumApp"
$orderName =~ m{^([^/]+)/(.*)} or die "$0 ERROR finding orderName";
$orderName = $2;

# $fileName should be "DoublePendulumApp"
$orderName =~ m{([^/]+)$} or die "$0 ERROR finding fileName";
my $fileName = $1;

defined($ARGV[1]) or die "$0 ERROR no target specified";
my $target = $ARGV[1];
$target =~ /\.html$/ or die "$0 ERROR target $target does not end with .html";

defined($ARGV[2]) or die "$0 ERROR no ordering file specified";
my $orderFile = $ARGV[2];
if ($orderFile) {
	$orderFile =~ /\.txt$/ or die "$0 ERROR ordering file $orderFile does not end with .txt";
}

# $COMPILE_LEVEL indicates whether running compiled JavaScript, or uncompiled JavaScript
defined($ARGV[3]) or die "$0 ERROR COMPILE_LEVEL argument not specified";
my $COMPILE_LEVEL = $ARGV[3];
if ($COMPILE_LEVEL ne "simple" && $COMPILE_LEVEL ne "advanced" && $COMPILE_LEVEL ne "debug") {
   die "$0 ERROR COMPILE_LEVEL=$COMPILE_LEVEL, must be simple, advanced, or debug";
}

$target =~ m{^(.*)/} or die "$0 ERROR cannot determine targetDir in target: $target";
my $targetDir = $1;
make_path("$targetDir");
-d "$targetDir" or die "$0 ERROR build directory $targetDir does not exist";

# base name of target file (without the .html extension)
$target =~ m{([^/\n]+)\.\w+$} or die "$0 ERROR cannot parse base name of $target";
my $targetName = $1;

# locale: get from the suffix of targetName
# example:  src/spring1_en.html means locale is 'en'.
# Default is "en" when we cannot determine locale from suffix.
my $locale = "en";
if ($targetName =~ /_(\w{2})$/) {
	$locale = $1;
}

if ($debug)	{
	print STDERR "\$file=$file\n";
	print STDERR "\$originDir=$originDir\n";
	print STDERR "\$fileName=$fileName\n";
	print STDERR "\$targetName=$targetName\n";
	print STDERR "\$locale=$locale\n";
	print STDERR "\$target=$target\n";
	print STDERR "\$COMPILE_LEVEL=$COMPILE_LEVEL\n";
}

my $next_link = "";
my $prev_link = "";
if ($orderFile) {
	my $order_line;
	my $line_no = 0;
	my @order_list = ();
	# get the list of files for "next/previous" links
	open(ORDER, $orderFile) or die "$0 ERROR cannot open file $orderFile";
	while ($order_line = <ORDER>) {
		chomp $order_line;
		if ($debug > 9) { print STDOUT "[$line_no] $order_line\n"; }
		push @order_list, $order_line;
		$line_no++;
	}
	if ($debug) { print STDOUT "length of order_list is $#order_list\n"; }

	$line_no = 0;
	foreach $order_line (@order_list) {
		if ($order_line eq $orderName) {
			$prev_link = $order_list[$line_no > 0 ? $line_no - 1 : $#order_list];
			$next_link = $order_list[$line_no < $#order_list ? $line_no + 1 : 0];
			last;
		}
		$line_no++;
	}

	if ($debug)	{
		print STDERR "\$orderFile=$orderFile\n";
		print STDERR "\$orderName=$orderName\n";
		print STDERR "\$next_link=$next_link\n";
		print STDERR "\$prev_link=$prev_link\n";
	}
} else {
	if ($debug) { print STDERR "WARNING: order file not specified\n"; }
}

my @rules; # rules to execute on each line
my $token = ""; # name of current definition, rule, math_def, math_rule.
my $def = "";  # current definition being formed;
my $rule = "";  # current rule being defined; potentially a multi-line rule
my $math_def = "";  # current math definition being formed;
my $math_rule = "";  # current math rule being defined; potentially a multi-line rule
my $firstChar = 1;  # true until we've written the first character into target file
my $macrosEnabled = 1;  # true means do the rules substitutions
my $mathEnabled = 0;  # true means do the mathRules substitutions
my $date_string;
my $IS_MATH = 1; # constant indicates a math rule
my $NOT_MATH = 0; # constant indicates a non-math rule
my $was_macro = 0; # true when previous line was a macro directive (#define, etc.)
# $NestedParen is a pre-defined regexp that matches expessions containing
# nested parentheses which can be used in user defined rules.
# See Friedl, Mastering Regular Expressions, 2nd edition, p. 330
# "Using a Dynamic Regex to Match Nested Pairs"
# The ??{ %perl code% } is a "dynamic regex" which evaluates perl code
# The (?: ) is a non-capturing parenthesis
# The /x allows adding spaces and comments to the regexp.
# The qr/ defines a perl regexp object.
$NestedParen = qr/ (?: [^()]+ | \( (??{$NestedParen}) \)  )* /x;

# deletes rule with given token
# @param {string} token  the name of the rule to delete
sub deleteRule {
	my $token = shift(@_);
	my $idx = 0;
	my $r;
	if (!$token) {
		die errorMsg("attempt to delete rule with empty token");
	}
	foreach $r (@rules) {
		if ($r->{TOKEN} eq $token) {
			splice(@rules, $idx, 1);
			if ($debug > 9) {
				print STDERR "DELETED RULE: $r->{TOKEN}, MATH: $r->{MATH}, "
					. "RULE: $r->{RULE}\n";
			}
			last;
		}
		$idx++;
	}
}

# adds a rule to rules database
# @param {string} token = name of the rule, or empty string
# @param {string} rule = regular expression that does text substitution
# @param {boolean} math = true if this should only execute during #mathOn
sub addRule2 {
	my $token = shift(@_);
	my $rule = shift(@_);
	my $math = shift(@_);
	if ($token) {
		deleteRule($token);
	}
	($rule =~ /^s/) or die errorMsg("rule must start with 's'\n$rule");
	my $record = {
		TOKEN => $token,
		RULE => $rule,
		MATH => $math,
	};
	unshift @rules, $record;
	if ($debug > 9) {
		print STDERR "addRule2: TOKEN: $record->{TOKEN}, MATH: $record->{MATH}, "
			 . "RULE: $record->{RULE}\n";
	}
}

# Adds a rule to the rules database.  The rule can be in any of
# the variables $def, $rule, $math_def, $math_rule.
# The name of the rule is in $token (can be empty string).
sub addRule {
	if ($def) {
		chomp $def;
		$def = $def . '~g';
		addRule2($token, $def, $NOT_MATH);
		if ($debug > 9) {
			print STDERR "ADD DEF: " . $def . "\n";
		}
		$def = "";
	} elsif ($rule) {
		chomp $rule;
		addRule2("", $rule, $NOT_MATH);
		if ($debug > 9) {
			print STDERR "ADD RULE: " . $rule . "\n";
		}
		$rule = "";
	} elsif ($math_def) {
		chomp $math_def;
		$math_def = $math_def . '~g';
		addRule2($token, $math_def, $IS_MATH);
		if ($debug > 9) {
			print STDERR "ADD MATH DEF: " . $math_def . "\n";
		}
		$math_def = "";
	} elsif ($math_rule) {
		chomp $math_rule;
		addRule2("", $math_rule, $IS_MATH);
		if ($debug > 9) {
			print STDERR "ADD MATH RULE: " . $math_rule . "\n";
		}
		$math_rule = "";
	} else {
		die errorMsg("no rule or define found in addRule");
	}
	$token = "";
}

# Returns an error message which includes current input file and line number.
# @param {string} text to include in the error message
# @return {string} the error message text with added file & line number info.
sub errorMsg {
	my $msg = shift(@_); # first argument is the error message
	return "$0 ERROR $msg\n" .
	 $inputFileName. "[". $filelines[$#filelines]. "] $origLine";
}

# Check that there is no multi-line #rule or #define in process.
sub checkNoRule {
	if ($def) {
		die errorMsg("#define not terminated");
	} elsif ($rule) {
		die errorMsg("#rule not terminated");
	} elsif ($math_def) {
		die errorMsg("#mathDefine not terminated");
	} elsif ($math_rule) {
		die errorMsg("#mathRule not terminated");
	}
}

# Apply rules to $_ until a single rule changes (matches)
# @return {boolean} true if a rule matched
sub applyOneRule {
	if ($macrosEnabled) {
		my $r;
		my $c;
		foreach $r (@rules) {
			if (!$r->{MATH} || $mathEnabled) {
				defined ($c = eval $r->{RULE}) or die "eval error: $@\nrule: $r";
				if ($debug > 9 && $c) {
					print STDERR "RULE:   $r->{RULE} \n";
					print STDERR "CHANGE: " . $_;
				}
				if ($c) {
					return 1;
				}
			}
		}
	}
	return 0;
}

# Apply rules repeatedly to $_ until no rule changes (matches).
sub applyRules {
	while (applyOneRule()) {
	};
}

$rule = 's/#FILE_NAME\b#?/$fileName/g';
addRule();

$rule = 's/#BASE_NAME\b#?/$targetName/g';
addRule();

$rule = 's/#NEXT_LINK\b#?/$next_link/g';
addRule();

$rule = 's/#PREV_LINK\b#?/$prev_link/g';
addRule();

$rule = 's/#COMPILE_LEVEL\b#?/$COMPILE_LEVEL/g';
addRule();

{
	my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);
	$year += 1900;
	my $thismon = (split /,/, "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec")[$mon];
	$date_string = "$thismon $mday $year";
	if ($debug > 9) { print STDERR "\$date_string=$date_string\n"; }
}
$rule = 's/#DATE_TIME\b#?/$date_string/g';
addRule();

$rule = 's/#LOCALE\b#?/$locale/g';
addRule();

open(TARGET, ">$target") or die "$0 ERROR cannot write to file $target";

# this puts the filehandle into the hash map %fileHandles under the key $file
open($fileHandles{$file}, $file)
	or die "$0 ERROR cannot open file $file: $!";
push @filenames, $file;
push @filelines, 0;

FILE: while (@filenames) {
	# last file in array @filenames is the current file to read from
	$inputFileName = $filenames[$#filenames];
	my $inputFileHandle = $fileHandles{$inputFileName};  # the filehandle to read from
	if ($debug > 9) {
		print STDERR "now processing file $inputFileName at line ["
			. $filelines[$#filelines] . "]\n";
	}
	my $buffer = "";
	my $inputText;
	INPUT_TEXT: while (1) {
		$inputText = <$inputFileHandle>;
		if (!$inputText) {
			if ($buffer) {
				# add new-line because the file didn't end with a new-line
				print STDERR "\nWARNING: file " . $inputFileName
					. " does not end with new-line\n";
				$inputText = "\n";
			} else {
				# done reading from $inputFileHandle
				last;
			}
		}
		$filelines[$#filelines]++;  # increment line number, for error reporting
		$buffer = $buffer . $inputText;
		LINE: while ($buffer) {
			if (0 && $debug > 9) {
				print STDERR "BUFFER : " . $buffer;
			}
			my $idx = index($buffer, "\n");
			if ($idx == -1) {
				# if no CR, then go read more from the file
				next INPUT_TEXT;
			}
			# remove the first line from $buffer, put it in $line
			my $line = substr($buffer, 0, $idx+1);
			substr($buffer, 0, $idx+1) = "";
			$origLine = $line;
			if ($debug > 9) {
				print STDERR "LINE : " . $line ;
			}
			if ($line =~ s/^\s*#include\s+//) {
				checkNoRule();
				$_ = $line;
				applyRules();
				$_ =~ /"([^"]+)"/;
				my $incfile = $originDir . $1;
				if (-e $incfile) {
					push @filenames, $incfile;
					push @filelines, 0;
					open($fileHandles{$incfile}, '<', $incfile)
						or die errorMsg("cannot open include file $incfile: $!");
					if ($debug > 9) {
						print STDERR "INCLUDE: " . $incfile . "\n";
					}
					next FILE;
				} else {
					die errorMsg("include file $incfile does not exist");
				}
			}
			if ($line =~ /^\s*#macrosOff\b/) {
				checkNoRule();
				$macrosEnabled = 0;
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ /^\s*#macrosOn\b/) {
				checkNoRule();
				$macrosEnabled = 1;
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ s/^\s*#rule\s+//) {
				checkNoRule();
				$rule = $line;
				# A multi-line rule ends with a backslash.
				# If rule doesn't end with a backslash, then it is complete.
				if ($rule !~ /\\\n$/) {
					addRule();
				}
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ s/^\s*#mathRule\s+//) {
				checkNoRule();
				$math_rule = $line;
				# A multi-line rule ends with a backslash.
				# If rule doesn't end with a backslash, then it is complete.
				if ($math_rule !~ /\\\n$/) {
					addRule();
				}
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ s/^\s*#undefine\b//) {
				checkNoRule();
				unless ($line =~ s/^\s+(#?\w+)\s+//) {
					die errorMsg("#undefine did not parse");
				}
				deleteRule($1);
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ s/^\s*#define\b//) {
				checkNoRule();
				if ($line =~ /~/) {
					die errorMsg("#define cannot have tilde ~ char");
				}
				unless ($line =~ s/^\s+(#?\w+)\s+//) {
					die errorMsg("#define did not parse");
				}
				$token = $1;
				if ($token =~ /^#/) {
					# the token already starts with #
					$def = 's~' . $token . '\b#?~' . $line;
					# remove the leading # from $token
					$token =~ s/#(.+)/$1/;
				} else {
					# the starting # is optional
					$def = 's~#?\b' . $token . '\b#?~' . $line;
				}
				# a multi-line rule ends with a backslash
				# if rule doesn't end with a backslash, then add as-is
				if ($def !~ /\\\n$/) {
					addRule();
				}
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ s/^\s*#defineFrom\b//) {
				# Create a #define rule by evaluating a regexp on specified text.
				# syntax: defineFrom token {text} regexp
				# (Must be on a single line, cannot be multi-line.)
				checkNoRule();
				unless ($line =~ s/^\s+(#?\w+)\s+//) {
					die errorMsg("#defineFrom did not parse");
				}
				$token = $1;
				unless ($line =~ s/{([^}]+)}\s+//) {
					die errorMsg("#defineFrom did not parse");
				}
				# expand the text
				$_ = $1;
				applyRules();
				my $fromText = $_;
				# at this point the remainder of $line is the regexp
				defined (eval "\$fromText =~ " . $line) or
					die errorMsg("#defineFrom eval error: $@");
				if ($token =~ /^#/) {
					# the token already starts with #
					$def = 's~' . $token . '\b#?~' . $fromText;
					# remove the leading # from $token
					$token =~ s/#(.+)/$1/;
				} else {
					# the starting # is optional
					$def = 's~#?\b' . $token . '\b#?~' . $fromText;
				}
				# multi-line rule not allowed here
				addRule();
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ s/^\s*#mathDefine\b//) {
				checkNoRule();
				if ($line =~ /~/) {
					die errorMsg("#mathDefine cannot have tilde ~ char");
				}
				unless ($line =~ s/^\s+(#?\w+)\s+//) {
					die errorMsg("#mathDefine did not parse");
				}
				$token = $1;
				if ($token =~ /^#/) {
					# the token already starts with #
					$math_def = 's~' . $token . '\b#?~' . $line;
					# remove the leading # from $token
					$token =~ s/#(.+)/$1/;
				} else {
					# the starting # is optional
					$math_def = 's~#?\b' . $token . '\b#?~' . $line;
				}
				# a multi-line rule ends with a backslash
				# if rule doesn't end with a backslash, then add as-is
				if ($math_def !~ /\\\n$/) {
					addRule();
				}
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ s/^\s*#variable\s+//) {
				# #variable is a shortcut version of #mathDefine.
				# The following are equivalent
				#     #variable _x  x
				#     #mathDefine _x  <i>x</i>
				checkNoRule();
				if ($line =~ /^(\w+)\s+([\S]+)\s*$/) {
					$math_rule = "s~\#?\\b$1\\b\#?~<i>$2<\/i>~g";
					$token = $1;
					addRule();
				} else {
					die errorMsg("#variable did not parse");
				}
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ /^\s*#comment\b/) {
				# ignore everything on the line
				next LINE;
			}
			if ($rule) {
				# we are building up a multi-line rule
				$rule .= $line;
				# if line does not end with backslash, then rule is done
				if ($line !~ /\\\n$/) {
					addRule();
				}
				next LINE;
			}
			if ($def) {
				# we are building up a multi-line define
				if ($line =~ /~/) {
					die errorMsg("#define cannot have tilde ~ char");
				}
				$def .= $line;
				# if line does not end with backslash, then define is done
				if ($line !~ /\\\n$/) {
					addRule();
				}
				next LINE;
			}
			if ($math_rule) {
				# we are building up a multi-line math rule
				$math_rule .= $line;
				# if line does not end with backslash, then math rule is done
				if ($line !~ /\\\n$/) {
					addRule();
				}
				next LINE;
			}
			if ($math_def) {
				# we are building up a multi-line math define
				if ($line =~ /~/) {
					die errorMsg("#mathDefine cannot have tilde ~ char");
				}
				$math_def .= $line;
				# if line does not end with backslash, then math define is done
				if ($line !~ /\\\n$/) {
					addRule();
				}
				next LINE;
			}
			# mathOff, mathOn come after rule building so that they can appear in a rule.
			if ($line =~ /^\s*#mathOff\b/) {
				checkNoRule();
				$mathEnabled = 0;
				$was_macro = 1;
				next LINE;
			}
			if ($line =~ /^\s*#mathOn\b/) {
				checkNoRule();
				$mathEnabled = 1;
				$was_macro = 1;
				next LINE;
			}
			# Apply rules until they stop matching;  then write out the line.
			# The regexp-rules operate on $_.
			$_ = $line;
			# Ignore empty lines when last line was a macro directive (#define, etc.)
			if ($was_macro && $line =~ /^\s*$/) {
				next LINE;
			}
			$was_macro = 0;
			if ($debug > 9) {
				print STDERR "INPUT : " . $_;
			}
			if (applyOneRule()) {
				# One of the rules matched and (presumably) changed $_
				# Prepend changed (expanded) line to $buffer.
				$buffer = $_ . $buffer;
				next LINE;
			}
			if ($firstChar) {
				# throw away blank lines at start of file
				if (/^\s*$/) {
					next LINE;
				} else {
					$firstChar = 0;
				}
			}
			if ($debug > 9) {
				print STDERR "OUTPUT: " . $_;
			}
			print TARGET $_;
		}
	}
	if ($debug > 9) {
		print STDERR "done processing file $inputFileName, last line was ["
			. $filelines[$#filelines] . "]\n";
	}
	close $inputFileHandle;
	pop @filenames;
	pop @filelines;
	delete $fileHandles{$inputFileName};  # deletes the filehandle from hash %fileHandles
	$macrosEnabled = 1;  # reset the macrosEnabled flag after include file
}

if ($debug > 9) {
	my $r;
	print STDERR "\n***********  ALL RULES ***********\n\n";
	foreach $r (@rules) {
		print STDERR "TOKEN: $r->{TOKEN}, MATH: $r->{MATH}, RULE: $r->{RULE}\n\n";
	}
}
