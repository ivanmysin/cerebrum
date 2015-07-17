#!/usr/bin/perl -w
use warnings;

use strict;
use JSON;
use PDL;
use PDL::NiceSlice;
use PDL::Audio;
use index_lib; 
use PDL::IO::Matlab;
use Switch;
use im_pdl;
use index_lib ("../");


&use_cgi();
&set_config();

&use_cgi();
our %_getpost;
print "Content-Type: text/html charset=utf-8\n\n";

my $regime = $_getpost{'regime'};



my $sources_file = $_getpost{'source_file'}; 

my $target_file = $_getpost{'target_file'};

my $data =  matlab_read($sources_file); 


my $server_params = substr ($_getpost{"server_json_params"}, 1, -1);
$server_params = from_json($server_params);



my $fd = $server_params->{'fd'}; # $fd is discritisation frequency of wav data
my $nchs = $data->ndims();  # $nchs is number chanels in wav file
$data = double($data); 


switch ($regime) {
	case("read") {
		
		my $intT = 10000; # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		my @send_array;
		my $title = 'Potential';
		for (my $i=0; $i<$nchs; $i++) {
			my $ch = $data(0:$intT, $i);
			$ch = ($ch - min($ch)) / (max($ch) - min($ch));
			my $t = sequence(nelem($ch)) / $fd;
			my @x = list ($t);
			my @y = list ($ch);
			my $xref = \@x;
			my $yref = \@y;
			my %hash = (
				'title' => $title, 
				'Xtitle' => 'time, s',
				'Ytitle' => 'channel '.($i + 1),
				'binGridX' => 0.2,
				'binGridY' => 0.2,
				'minX' => 0, 
				'maxX' => 1,
				'minY' => -0.2, 
				'maxY' => 1.2,
				'x' => $xref,
				'y' => $yref,
			);
			$send_array[$i] = \%hash;
		}
		my $json = JSON->new->utf8->encode(\@send_array);
		print $json;
	}
	case("write") {
		
		for (my $i=0; $i<$nchs; $i++) {
			my $ch = $data(0:-1, $i);
			$ch = ($ch - min($ch)) / (max($ch) - min($ch));
			$data(0:-1, $i) .= $ch;
		}
		
		
		matlab_write($target_file, $data);
		
		my $processing_node_id = int($_getpost{'processing_node_id'});
		&save_param($processing_node_id, $server_params);
		print "success";
		
		
		
	}
	
	else {
		my $error = "Not valid regime";
		print $error;
		exit;
	}
}




