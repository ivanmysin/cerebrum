#!/usr/bin/perl -w
print "Content-Type: text/html \n\n"; # charset=utf-8 

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

&use_cgi();
&set_config();
our %_getpost;
&start_session();
our $_session;


my $processing_node_id = int($_getpost{'processing_node_id'});
my $access = &verify_user_acceess_to_processing_node($processing_node_id);
if (not ($access eq "host" or $access eq "write")) {
	print "Access denied";
	exit();
}


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
		my $start_ind;
		my $end_ind;
		if ($_getpost{"load"} eq "start") {
				$start_ind = 0;
				$end_ind = 10000;
		} else {
				$start_ind = int ($_getpost{"minX"} * $fd);
				$end_ind = int ($_getpost{"maxX"} * $fd);
		}

		my @send_array;
		my $title = 'Potential';
		for (my $i=0; $i<$nchs; $i++) {
			my $ch = $data(:, $i);
			$ch = rint(100 * ( ($ch - min($ch)) / (max($ch) - min($ch)) ) )/100;

			my %hash = (
				'title' => 'channel '.($i + 1), 
				'Xtitle' => 'time, s',
				'Ytitle' => $title,
				'fd' => $fd,
				'minX' => $start_ind/$fd, 
				'maxX' => $end_ind/$fd,
				'minY' => -0.2, 
				'maxY' => 1.2,
				'y_vals' => [ list ( $ch($start_ind:$end_ind)  ) ],
				'start_ind_of_loaded' => $start_ind,
				'end_ind_of_loaded' => $end_ind, 
			);
			$send_array[$i] = \%hash;
		}
		my $json = JSON->new->utf8->encode(\@send_array);
		print ($json);
	}
	
	
	case("write") {
		
		for (my $i=0; $i<$nchs; $i++) {
			my $ch = $data(0:-1, $i);
			$ch = ($ch - min($ch)) / (max($ch) - min($ch));
			$data(0:-1, $i) .= $ch;
		}
		
		
		matlab_write($target_file, $data);
		
		
		my $statistics = &get_statistics($server_params);
		&save_param($processing_node_id, $server_params, $statistics);
		print "success";

	}
	
	case ("save") {
		
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
			<th> Discretization frequency, Hz </th>
			<th> Channels number </th>
		</tr>
		<tr>
			<td> $server_params->{"fd"} </td>
			<td> $server_params->{"nchs"} </td>
		</tr>
	
	</table>
	);
	return $stat;
}
&save_session();

