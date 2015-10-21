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
			Бин автокоррелелограмм <input type="number" name="bin" style="width: 40px;" value="1" min="1"> с;
			</br>
			Максимальный порядок гистограммы межимпульсных интервалов <input type="number" name="maxorder" style="width: 40px;" value="50" min="1">
			</br>
		);	
		
		for (my $i=0; $i<@{$server_params}; $i++) {
			my $nn = $i + 1;
			my $name = $server_params->[$i]->{"channel_name"};
			print qq(Обработать канал № $nn <input type="checkbox" name="$name" checked/> </br>);
			
		};

		print qq(
			</br> <a href="#plots" class="btn btn-grey"> Построить графики </a>
		</form> 
		);
	}

	case ("processing") {
		
		my $mat_content = matlab_read($sources_file);
		my $bin = $_getpost{"bin"};
		my $maxorder = $_getpost{"maxorder"};
		my @send_vals;
		
		my $saving_data = pdl([]);
		my $data_header = { # header for saving data
			"bin" => $bin,
			"maxorder" => $maxorder,
			"data" => [],
		};       
		
		
		my $send_index=0;
		for (my $i=0; $i<@{$server_params}; $i++) { # Цикл  пробегает по всем каналам 
			if ($_getpost{ $server_params->[$i]->{"channel_name"} } ne "on" ) {
				next;
			}
			
			$send_vals[$send_index] = {
				"channel_name" => $server_params->[$i]->{"channel_name"},
				"neurons" => [],
			};
			
			$data_header->{"data"}->[$send_index] = {
				"channel_name" => $server_params->[$i]->{"channel_name"},
				"neurons" => [],
			};
			
			
			my $spikes_indexes = $server_params->[$i]->{"spikes"};
			for (my $j=0; $j<@{$spikes_indexes}; $j++) {   # Цикл пробегает по всем нейронам
				my $low_ind = $spikes_indexes->[$j]->{"low_ind"};
				my $upper_ind = $spikes_indexes->[$j]->{"upper_ind"};
				my $sp = $mat_content($low_ind:$upper_ind);
				
				$send_vals[$send_index]->{"neurons"}->[$j] = [];
				
				$data_header->{"data"}->[$send_index]->{"neurons"}->[$j] = [];
				
				for (my $k=0; $k<@{$client_params->{"channels"}->[$i]->[$j]}; $k++) {# Цикл пробегает по всем границам 
					my $effect = $client_params->{"channels"}->[$i]->[$j]->[$k];
					
					my $lowbound = $effect->{"lowbound"};
					my $upperbound = $effect->{"upperbound"};
					
					my $spikes_in_effect = $sp->where($sp>=$lowbound);
					$spikes_in_effect = $spikes_in_effect->where($spikes_in_effect<=$upperbound);
				
					(my $tau, my $acg, my $x) = &get_acg($spikes_in_effect, $bin, $maxorder);

					my $lowerindex = nelem($saving_data);
					my $upperindex = nelem($acg) + $lowerindex -1;
					$saving_data = $saving_data->append($acg);
					
					$data_header->{"data"}->[$send_index]->{"neurons"}->[$j]->[$k] = {
						"effect_name" => $effect->{"name"},
						"lowerindex" => $lowerindex,
						"upperindex" => $upperindex,
						"effect_low_bound" => $lowbound, 
						"effect_upper_bound" => $upperbound, 
						"tau" => $tau,
					};
				
					$send_vals[$send_index]->{"neurons"}->[$j]->[$k] = {
						"y_vals" => [list($acg)],
						"x_vals" => [list ($x)],
						"effect_name"=> $effect->{"name"},
						"y_labels" => 'p',
						"x_labels" => 'time, s',
						"minX" => 0,
						"maxX" => max($x),
						"minY" => 0, 
						"maxY" => max($acg)*1.2,
						"binGridX" => $bin,
						"binGridY" => nelem($acg)/10,
						"neuron_ind" => $j,
						"channel_ind" => $i,
						"channel_name" => $server_params->[$i]->{"channel_name"},
						"tau" => $tau,
					};
				};
			};
			$send_index++;
		};
		
		
		my $json = JSON->new->utf8(0)->encode(\@send_vals);
		print $json;
		#print_arr($client_params);
		
		matlab_write($target_file, $saving_data);
		my $processing_node_id = int($_getpost{'processing_node_id'});
		my $statistics = &get_statistics($data_header);
		&save_param($processing_node_id, $data_header, $statistics);
		
	}
	case ("save") {
		print "success";
	}

	else {
		print qq(Not valid regime);
	}
}
##################################################################################################
# calculate autocorrelelogram by interspike intervals

sub get_acg {
	my $spike_train = shift;
	my $bin = shift;
	my $maxorder = shift;
	
	$maxorder = (nelem($spike_train) > $maxorder) ? $maxorder : nelem($spike_train)-1;
	
	my $intervals = $spike_train($maxorder:-1) - $spike_train(0:-$maxorder-1); # calculate maximal intervals for number of bin estimation
	my $nbins = max($intervals)/$bin + 1;
	my $hist = double ( histogram($intervals, $bin, 0,  $nbins) ) / nelem ($intervals);
	
	
	my $acg = zeroes($nbins) + $hist;
	
	# calculate histograms with range of orders and summarize thears 
	for (my $order=1; $order<$maxorder; $order++) {
		my $intervals = $spike_train($order:-1) - $spike_train(0:-$order-1);
		my $hist = double ( histogram($intervals, $bin, 0,  $nbins) ) / nelem ($intervals);
		$acg += $hist;
	}
	
	my $x = sequence($nbins) * $bin;
	my $tau = 0;
	
	return $tau, $acg, $x;
}
########################################################################
sub get_statistics {
	my $data = shift;
	my $stat = qq(
	<div class="acg_stat">
		<style>
		div.acg_stat_channel_presentation {
			margin-top: 2px;
			margin-bottom: 20px;
		}
		table.acg_stat_effects_table, table.acg_stat_effects_table th,  acg.hmsi_stat_effects_table tr, table.acg_stat_effects_table td {
			border: 1px solid black; 
			border-collapse: collapse;
			text-align: center;
			padding: 7px;
			margin: 5px;
		}
		
		</style>
		<p> Бин = $data->{"bin"} </p>
		<p> Максимальный порядок = $data->{"maxorder"} </p>
	);
	for (my $i=0; $i<@{$data->{"data"}}; $i++) {
		$stat .= qq(
			<div class="acg_stat_channel_presentation">
			<p> Канал: $data->{"data"}->[$i]->{"channel_name"} </p>
		);
		for (my $j=0; $j<@{$data->{"data"}->[$i]->{"neurons"}}; $j++ ) {
			my $neuron_num = $j + 1;
			$stat .= qq(
			<div class="acg_stat_neurons_presentions">
				<table class="acg_stat_effects_table">
					<caption> Нейрон № $neuron_num </caption>
					<tr>
						<th> Эффект </th>
						<th> Нижняя граница </th>
						<th> Верхняя раница </th>
						<th> Tau </th>
					</tr>
			);
			
			for (my $k=0; $k<@{$data->{"data"}->[$i]->{"neurons"}->[$j]}; $k++) {
				$stat .= qq(
					<tr>
						<td> $data->{"data"}->[$i]->{"neurons"}->[$j]->[$k]->{"effect_name"} </td>
						<td> $data->{"data"}->[$i]->{"neurons"}->[$j]->[$k]->{"effect_low_bound"} </td>
						<td> $data->{"data"}->[$i]->{"neurons"}->[$j]->[$k]->{"effect_upper_bound"} </td>
						<td> $data->{"data"}->[$i]->{"neurons"}->[$j]->[$k]->{"tau"} </td>
					</tr>
				
				);
			}
			
			$stat .= qq(</table> </div>);
		}
		
		$stat .= qq(</div>);
	}
	$stat .= qq(</div>);
	return $stat;
}








