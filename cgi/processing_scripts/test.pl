#!/usr/bin/perl

use lib ("/home/ivan/perl5/lib/perl5/");
use warnings;
use strict;
use JSON;
use PDL;
use PDL::NiceSlice;
use PDL::Audio;
use PDL::IO::Matlab;
use Switch;


# use im_pdl;
use index_lib; 
use model;

my $s = cut_end_qouts ("Привет");

print  $s;