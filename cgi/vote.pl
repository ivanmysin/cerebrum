#!/usr/bin/perl -w

my $html = "file=/home/mysites/template.html" ;#$res[0]->{'html_code'};
	
if (substr($html, 0, 5) eq "file=") {
	my $file = substr($html, 5);
	# $html = &read_file($file);
	print $file;
};

