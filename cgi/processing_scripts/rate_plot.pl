#!/usr/bin/perl -w
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
print "Content-Type: text/html charset=utf-8\n\n";

my $sources_file = $_getpost{'source_file'}; 
my $target_file = $_getpost{'target_file'};
my $regime = $_getpost{'regime'};


my $server_params = &cut_end_qouts($_getpost{"server_json_params"});

$server_params = from_json($server_params);

my $data = matlab_read($sources_file);

switch ($regime) {
	case("read") {
		# Send to client form for controles parameters of processing
		print qq(
		<form id="client_params">
			Выризать стимуляции <input type="checkbox" name="cut_stims" checked/>, вырезаемое время до и после стимуляции <input type="text" name="time_cut_stims" size="3" value="0.1"> сек </br>
			Постоить график частоты разрядов по бинам <input type="checkbox" name="rate_by_bins" checked/>, бин для интегралки: <input type="text" name="bin" size="3" value=10> сек </br>
			Постоить график мгновенной частоты разрядов <input type="checkbox" name="momentary_rate"/> </br>
		);	
		for (my $i=1; $i<=@{$server_params}; $i++) {
			
			print qq(Обработать канал № $i <input type="checkbox" name="channel_${i}" checked/> </br>);
			
		};
		print qq(	
			</br> <button type="submit" class="btn btn-grey"> Построить графики </button>
		</form> 
		);
	}
	
	case("write") {
		print "success";
	}
	
	case("processing") {
		# Algorim of processing
		my @send_vals = ();        # struct with processing result for sending to browser 

		

		while ( my ($i, $channel) = each (@{$server_params})) { # пробеграем циклом по всем каналам
			my $ch_number = $i + 1;
			if ($_getpost{"channel_${ch_number}"} eq "off") { # Если канал не отмечен, то просто пропускаем его
				next;
			};
			my $l_ind = $channel->{'stim'}->{'low_ind'};
			my $u_ind = $channel->{'stim'}->{'upper_ind'};
			my $stims = $data($l_ind:$u_ind)->sever; # получили стимуляции в переменную
			


			$send_vals[$i]->{'channel_name'} = $channel->{'channel_name'};             # Добавляем в отправляемую структуру
			
			$send_vals[$i]->{'plots'} = [];

			
			while ( my ($j, $sp_data ) = each (@{$channel->{'spikes'}}) ) { # пробегаем по всем нейронам, которые дискриминировали в данном канале
				
				my $l_ind = $sp_data->{'low_ind'};
				my $u_ind = $sp_data->{'upper_ind'};
				my $spikes = $data($l_ind:$u_ind)->sever;  # получили импульсы одного нейрона в переменную
				

				
				if ($_getpost{"cut_stims"} eq 'on') {      # Вырезаем стимуляции, если включена соответствующая опция
					my $time_cut_stims = $_getpost{"time_cut_stims"};
					$spikes = &cut_stim_shift_spikes($spikes, $stims, $time_cut_stims); 
				}
				

				if ($_getpost{"rate_by_bins"} eq 'on') {
					my $bin = $_getpost{"bin"};
					my $rate_by_bins = histogram($spikes, $bin, 0, int(max($spikes)/$bin)+1);
					$rate_by_bins = double($rate_by_bins) / $bin;
										
					my @y_arr = list($rate_by_bins);
					my $x_vals = sequence (nelem($rate_by_bins)) / $bin;
					my @x_arr = list ($x_vals);
					
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'y_vals'} = \@y_arr;
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'x_vals'} = \@x_arr;
					
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'plot_label'} = "Rate plot by bins";
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'x_labels'} = "time, s";
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'y_labels'} = "rate, sp/s";
					
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'minX'} = 0;
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'maxX'} = max ($x_vals);
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'minY'} = 0;
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'maxY'} = 1.2*max($rate_by_bins);
					
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'binGridX'} = $bin;
					${$send_vals[$i]->{'plots'}}[$j]->{"rate_by_bins"}->{'binGridY'} = 0.1 * max($rate_by_bins);
		
					
					# Получили интегралку, разбитую по бинам
					# save data to send
					
				}
				
				
				
				
				if ($_getpost{'momentary_rate'} eq 'on') {
					my $moment_rate_y = 1 / ($spikes(1:-1) - $spikes(0:-2));
					my $moment_rate_x = $spikes(0:-2)->sever;
					# Получили интегралку мгновенной скорости
					my @y_arr = list($moment_rate_y);
					my @x_arr = list($moment_rate_x);
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'y_vals'} = \@y_arr;
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'x_vals'} = \@x_arr;
					
					
					
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'plot_label'} = "Moment rate plot";
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'x_labels'} = "time, s";
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'y_labels'} = "rate, sp/s";
					
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'minX'} = 0;
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'maxX'} = max ($moment_rate_x);
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'minY'} = 0;
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'maxY'} = 1.2*max($moment_rate_y);
					
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'binGridX'} = 0.05 * max($moment_rate_x);
					${$send_vals[$i]->{'plots'}}[$j]->{'momentary_rate'}->{'binGridY'} = 0.1 * max($moment_rate_y);
					
					
					
					
				}
				

				
			}
			
			
			$ch_number++;
		};
		

		my $json = JSON->new->utf8->encode(\@send_vals);
		print $json;
		
	}
	
	else {
		print qq(Not valid regime);
	}
}
########################################################################
################### libs of function ###################################
########################################################################

sub cut_stim_shift_spikes {
	my $spikes = shift;
	my $stims = shift;
	my $cut_time = shift;
	
	for (my $i=0; $i<nelem($stims); $i++) {
		my $l_b = $stims($i) - $cut_time;
		my $u_b = $stims($i) + $cut_time;
		my $l_sp_ind = which ($spikes<=$l_b);
		my $u_sp_ind = which ($spikes>=$u_b);
		
		
		$spikes($u_sp_ind) -= 2*$cut_time;
		my $sp_ind = $l_sp_ind->append($u_sp_ind);
		$spikes = $spikes($sp_ind)->sever;
		
		
	}
	
	return $spikes;
	
	
}








