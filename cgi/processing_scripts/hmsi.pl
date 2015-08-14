#!/usr/bin/perl -w

print "Content-Type: text/html charset=utf-8\n\n";
use warnings;
use strict;

use PDL;
use PDL::NiceSlice;
use index_lib; 
use PDL::IO::Matlab;
use Switch;
use im_pdl;
use index_lib ("../");


&use_cgi();
&set_config();

our %_getpost;


my $sources_file = $_getpost{'source_file'}; 
my $target_file = $_getpost{'target_file'};
my $regime = $_getpost{'regime'};


my $server_params = &cut_end_qouts($_getpost{"server_json_params"});
$server_params = from_json($server_params);



switch ($regime) {
	case("read") {
		# Send to client form for controles parameters of processing
		print qq(
		<form id="client_params">
			Порядок гистограмм <input type="number" name="order" size="2" value="1">
		);	
		for (my $i=1; $i<=@{$server_params}; $i++) {
			
			print qq(Обработать канал № $i <input type="checkbox" name="channel_${i}" checked/> </br>);
			
		};
		print qq(	
			</br> <a href="#plots" class="btn btn-grey"> Построить графики </a>
		</form> 
		);
	}

	case ("processing") {
		my @send_vals = (1,2);
		my $json = JSON->new->utf8->encode(\@send_vals);
		print $json;

	}

	else {
		print qq(Not valid regime);
	}
}