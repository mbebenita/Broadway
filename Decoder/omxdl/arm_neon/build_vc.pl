/*
 * Copyright (C) 2007-2008 ARM Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
#!/usr/bin/perl
#
# 
# File Name:  build_vc.pl
# OpenMAX DL: v1.0.2
# Revision:   12290
# Date:       Wednesday, April 9, 2008
# 
# 
# 
#
# This file builds the OpenMAX DL vc domain library omxVC.o.
#

use File::Spec;
use strict;

my ($CC, $CC_OPTS, $AS, $AS_OPTS, $LIB, $LIB_OPTS, $LIB_TYPE);

$CC       = 'armcc';
$CC_OPTS  = '--no_unaligned_access --cpu Cortex-A8 -c';
$AS       = 'armasm';
$AS_OPTS  = '--no_unaligned_access --cpu Cortex-A8';
# $LIB      = 'armlink';
# $LIB_OPTS = '--partial -o';
# $LIB_TYPE = '.o';
$LIB      = 'armar';
$LIB_OPTS = '--create -r';
$LIB_TYPE = '.a';

#------------------------

my (@headerlist, @filelist, $hd, $file, $ofile, $command, $objlist, $libfile, $h);

# Define the list of directories containing included header files.
@headerlist = qw(api vc/api vc/m4p2/api vc/m4p10/api);

# Define the list of source files to compile.
open(FILES, '<filelist_vc.txt') or die("Can't open source file list\n");
@filelist = <FILES>;
close(FILES);

# Fix the file separators in the header paths
foreach $h (@headerlist)
{
        $h = File::Spec->canonpath($h);
}

# Create the include path to be passed to the compiler
$hd = '-I' . join(' -I', @headerlist);

# Create the build directories "/lib/" and "/obj/" (if they are not there already)
mkdir "obj", 0777 if (! -d "obj");
mkdir "lib", 0777 if (! -d "lib");

$objlist = '';

# Compile each file
foreach $file (@filelist)
{
	my $f;
	my $base;
	my $ext;
	my $objfile;

	chomp($file);
	$file = File::Spec->canonpath($file);

	(undef, undef, $f) = File::Spec->splitpath($file);
    $f=~s/[\n\f\r]//g; # Remove any end-of-line characters

	if(($base, $ext) = $f =~ /(.+)\.(\w)$/)
	{
		$objfile = File::Spec->catfile('obj', $base.'.o');

		if($ext eq 'c')
		{
			$objlist .= "$objfile ";
			$command = $CC.' '.$CC_OPTS.' '.$hd.' -o '.$objfile.' '.$file;
			print "$command\n";
			system($command);
		}
		elsif($ext eq 's')
		{
			$objlist .= "$objfile ";
			$command = $AS.' '.$AS_OPTS.' '.$hd.' -o '.$objfile.' '.$file;
			print "$command\n";
			system($command);
		}
		else
		{
			print "Ignoring file: $f\n";
		}
	}
	else
	{
		die "No file extension found: $f\n";
	}
}

# Do the final link stage to create the libraries.
$libfile = File::Spec->catfile('lib', 'omxVC'.$LIB_TYPE);
$command = $LIB.' '.$LIB_OPTS.' '.$libfile.' '.$objlist;
print "$command\n";
(system($command) == 0) and print "Build successful\n";







