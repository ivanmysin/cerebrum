#!/usr/bin/perl -w
use PDL;
use PDL::NiceSlice;
use utf8;
use Encode qw(encode_utf8);
#use JSON;
use JSON::XS;

print "Content-Type: text/html charset=utf-8\n\n";

my $a = "abcd";

$a = substr($a, 0, -2);

print $a; 
