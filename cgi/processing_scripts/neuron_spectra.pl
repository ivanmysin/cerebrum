#!/usr/bin/perl -w

print "Content-Type: text/html charset=utf-8\n\n";
use warnings;
use strict;

use PDL;
use PDL::NiceSlice;
use PDL::FFT;
use index_lib; 
use PDL::IO::Matlab;
use Switch;
use im_pdl;
use index_lib;
use model;


&use_cgi();
&set_config();

our %_getpost;


my $sources_file = $_getpost{'source_file'}; 
my $target_file = $_getpost{'target_file'};
my $regime = $_getpost{'regime'};


my $server_params = &cut_end_qouts($_getpost{"server_json_params"});
$server_params = from_json($server_params);

my $client_params =  &cut_end_qouts($_getpost{"client_json_params"});
$client_params = from_json($client_params);


switch ($regime) {
	case("read") {
		# Send to client form for controles parameters of processing

		print qq(
		<form id="client_params">
		);	
		
		for (my $i=0; $i<@{ $server_params->{"data"} }; $i++) {
			my $nn = $i + 1;
			my $name = $server_params->{"data"}->[$i]->{"channel_name"};
			print qq(Обработать канал № $nn <input type="checkbox" name="$name" checked/> </br>);
			
		};

		print qq(
			</br> <a href="#plots" class="btn btn-grey"> Построить графики </a>
		</form> 
		);
	}

	case ("processing") {
		#&print_arr(\%_getpost);
		
		my $mat_content = matlab_read($sources_file);
		my $fd = $server_params->{"bin"} != 0 ? 1/$server_params->{"bin"} : exit("invalid discretization frequency!");
		
		my @send_vals;
		
		my $saving_data = pdl([]);
		my $data_header = { # header for saving data
			"fd" => $fd,
			"data" => [],
		};   
		
		my $send_index=0;
		
		for (my $i=0; $i<@{ $server_params->{"data"} }; $i++) { # Цикл  пробегает по всем каналам 
			if ($_getpost{ $server_params->{"data"}->[$i]->{"channel_name"} } ne "on" ) {
				print $server_params->{"data"}->[$i]->{"channel_name"};		
				next;
			};

			$send_vals[$send_index] = {
				"channel_name" => $server_params->{"data"}->[$i]->{"channel_name"},
				"neurons" => [],
			};
			
			$data_header->{"data"}->[$send_index] = {
				"channel_name" => $server_params->{"data"}->[$i]->{"channel_name"},
				"neurons" => [],
			};

			for (my $j=0; $j<@{ $server_params->{"data"}->[$i]->{"neurons"} }; $j++) {   # Цикл пробегает по всем нейронам
			
				$send_vals[$send_index]->{"neurons"}->[$j] = [];
				$data_header->{"data"}->[$send_index]->{"neurons"}->[$j] = [];
				
				for (my $k=0; $k<@{ $server_params->{"data"}->[$i]->{"neurons"}->[$j] }; $k++) {# Цикл пробегает по всем границам 
					my $indexes = $server_params->{"data"}->[$i]->{"neurons"}->[$j]->[$k];

					my $low_ind = $indexes->{"lowerindex"};
					my $upper_ind = $indexes->{"upperindex"};
					my $acg = $mat_content($low_ind:$upper_ind);
				
					(my $mode_fr, my $specter, my $fr) = &get_spectra($acg, $fd);
					
					$send_vals[$send_index]->{"neurons"}->[$j]->[$k] = {
						"y_vals" => [list($specter)],
						"x_vals" => [list ($fr)],
						"effect_name"=> $indexes->{"effect_name"},
						"y_labels" => 'Amp',
						"x_labels" => 'frequency, Hz',
						"minX" => 0,
						"maxX" => max($fr),
						"minY" => 0, 
						"maxY" => max($specter)*1.2,
						"binGridX" => max($fr)/10,
						"binGridY" => max($specter)/10,
						"neuron_ind" => $j,
						"channel_ind" => $i,
						"channel_name" => $server_params->{"data"}->[$i]->{"channel_name"},
						"mode_fr" => $mode_fr,
					};
					
					my $lowerindex = nelem($saving_data);
					my $upperindex = nelem($specter) + $lowerindex -1;
					$saving_data = $saving_data->append($specter);
					
					$data_header->{"data"}->[$send_index]->{"neurons"}->[$j]->[$k] = {
						"effect_name" =>  $indexes->{"effect_name"},
						"lowerindex" => $lowerindex,
						"upperindex" => $upperindex,
						"effect_low_bound" => $indexes->{"effect_low_bound"}, 
						"effect_upper_bound" => $indexes->{"effect_upper_bound"}, 
						"mode_fr" => $mode_fr,
						"fd" => $fd,
					};
					
					
				};
			};
			$send_index++;
		};
		#print_arr(\@send_vals);
		my $json = JSON->new->utf8(0)->encode(\@send_vals);
		print $json;
		
		matlab_write($target_file, $saving_data);
		my $processing_node_id = int($_getpost{'processing_node_id'});
		my $statistics = &get_statistics($data_header);
		&save_param($processing_node_id, $data_header, $statistics);
	}

	else {
		print qq(Not valid regime);
	}
}
##################################################################################################
# calculate specters of autocorrelelograms of interspike intervals

sub get_spectra {     
	my $acg = shift;
	my $fd = shift;
	
	(my $fr, my $spectr) = &furie_spectr($fd,$acg);
	$fr = $fr(1:-1);
	$spectr = $spectr(1:-1);
	
	my $maxspectr = which($spectr==max($spectr));
	my $mode_fr = sprintf("%0.2f", [list($fr($maxspectr))]->[0] );

	return $mode_fr, $spectr, $fr;
}

sub furie_spectr {

	my $fd=shift; # fd is friquncy of discritization
	$fd=1/$fd;
	my $r=shift; # $r is external data
	my $i=zeroes($r);
	my $n=nelem($r);
	
	my $kx;
	fft($r,$i);
	my $a=sqrt($r**2+$i**2)*2/$n;
	if ($n%2 == 0) {
		$kx = $r->xlinvals(-($n/2-1)/$n/$fd,1/2/$fd)->rotate(-($n/2 -1));
		} else {
		$kx = $r->xlinvals(-($n/2-0.5)/$n/$fd,($n/2-0.5)/$n/$fd)->rotate(-($n-1)/2);
		}
	$a=$a(0:$n/2);
	$a(0)/=2;
	$kx=$kx(0:$n/2);
return ($kx, $a);
}

#########################################################################
sub get_statistics {
	my $data = shift;
	#print_arr($data);
	my $stat = qq(
	<div class="neuron_spectra_stat">
		<style>
		div.neuron_spectra_stat_channel_presentation {
			margin-top: 2px;
			margin-bottom: 20px;
		}
		table.neuron_spectra_stat_effects_table, table.neuron_spectra_stat_effects_table th,  table.neuron_spectra_stat_effects_table tr, table.neuron_spectra_stat_effects_table td {
			border: 1px solid black; 
			border-collapse: collapse;
			text-align: center;
			padding: 7px;
			margin: 5px;
		}
		
		</style>
	);
	for (my $i=0; $i<@{$data->{"data"}}; $i++) {
		$stat .= qq(
			<div class="neuron_spectra_stat_channel_presentation">
			<p> Канал: $data->{"data"}->[$i]->{"channel_name"} </p>
		);
		for (my $j=0; $j<@{$data->{"data"}->[$i]->{"neurons"}}; $j++ ) {
			my $neuron_num = $j + 1;
			$stat .= qq(
			<div class="neuron_spectra_stat_neurons_presentions">
				<table class="neuron_spectra_stat_effects_table">
					<caption> Нейрон № $neuron_num </caption>
					<tr>
						<th> Эффект </th>
						<th> Нижняя граница </th>
						<th> Верхняя раница </th>
						<th> Мода спектра </th>
					</tr>
			);
			
			for (my $k=0; $k<@{$data->{"data"}->[$i]->{"neurons"}->[$j]}; $k++) {
				$stat .= qq(
					<tr>
						<td> $data->{"data"}->[$i]->{"neurons"}->[$j]->[$k]->{"effect_name"} </td>
						<td> $data->{"data"}->[$i]->{"neurons"}->[$j]->[$k]->{"effect_low_bound"} </td>
						<td> $data->{"data"}->[$i]->{"neurons"}->[$j]->[$k]->{"effect_upper_bound"} </td>
						<td> $data->{"data"}->[$i]->{"neurons"}->[$j]->[$k]->{"mode_fr"} </td>
					</tr>
				
				);
			}
			
			$stat .= qq(</table> </div>);
		}
		
		$stat .= qq(</div>);
	}
	$stat .= qq(</div>);
	#print $stat;
	return $stat;
}






