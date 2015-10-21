#!/usr/bin/perl -w
print "Content-Type: text/html charset=utf-8\n\n";

use warnings;
use strict;
use JSON;
use PDL;
use PDL::NiceSlice;
use PDL::Audio;
use PDL::IO::Matlab;
use Switch;

use im_pdl;
use index_lib; 
use model;

&use_cgi();
&set_config();
our %_getpost;



my $regime = $_getpost{'regime'};



my $sources_file = $_getpost{'source_file'}; 

my $target_file = $_getpost{'target_file'};

my $data =  matlab_read($sources_file); 


my $server_params = from_json($_getpost{"server_json_params"});

my $fd = $server_params->{'fd'}; # $fd is discritisation frequency of wav data
my $nchs = $data->ndims();  # $nchs is number chanels in wav file
$data = double($data); 

switch ($regime) {
	case("read") {
		
		my $intT = 10000; # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -1
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
		my $statistics = &get_statistics($server_params);
		&save_param($processing_node_id, $server_params, $statistics);
		print "success";

	}
	
	case ("save") {
		my $processing_node_id = int($_getpost{'processing_node_id'});
		my $statistics = &get_statistics($server_params);
		&save_param($processing_node_id, $server_params, $statistics);
		print "success";
		
	}

	else {
		my $error = "Not valid regime";
		print $error;
		exit;
	}
}

sub get_statistics {
	my $server_params = shift;
	my $stat = qq(
	<style>
	table.start_statistics_table, table.start_statistics_table th,  table.start_statistics_table tr, table.start_statistics_table td {
		border: 1px solid black; 
		border-collapse: collapse;
		text-align: center;
		padding: 3px;
	}
	</style>
	<table class="start_statistics_table">
	
		<tr>
			<th> Частота дискретизации, Гц </th>
			<th> Количество каналов </th>
		</tr>
		<tr>
			<td> $server_params->{"fd"} </td>
			<td> $server_params->{"nchs"} </td>
		</tr>
	
	</table>
	);
	return $stat;
}


