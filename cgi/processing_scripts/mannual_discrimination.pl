#!/usr/bin/perl -w
use warnings;

use strict;

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

our %_getpost;
print "Content-Type: text/html charset=utf-8\n\n";

my $sources_file = $_getpost{'source_file'}; 
my $target_file = $_getpost{'target_file'};
my $regime = $_getpost{'regime'};

my $params = $_getpost{'processed_params'};

my $server_params = substr ($_getpost{"server_json_params"}, 1, -1);
$server_params = from_json($server_params);



my $fd = $server_params->{'fd'}; # $fd is discritisation frequency of wav data


my $data = matlab_read($sources_file);
my $nchs = $data->ndims();   # $nchs is number chanels in wav file

my $parent_node_id = int($_getpost{'parent_processing_node_id'});  
my $server_processing_param = &get_server_param($parent_node_id);

switch ($regime) {
	case("read") {
		$data = double($data); 
		my $intT = 10000; # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!  Эта цифра тут для ограничения информации, передаваемой в браузер, 
		                  #   в окончательном варианте нужно убрать или поставить -1 !!!!!!!!!!!!!!!!!!!!!!!!! #
		my @send_array;
		my $title = 'Potential';
		for (my $i=0; $i<$nchs; $i++) {
			my $ch = $data(0:$intT, $i);
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
		exit;
	}
	
	case("write") {
		my $processing_params = JSON->new->utf8->decode($params); # !!!! Надо бы сделать верификацию данных, сейчас верификация происходит только на стороне клиента с помощью Javascript !!!!!!!! 
		
		
		my @st_levels = @{$processing_params->{'st_threshold_line'}}; # Каждый элемент в этом массиве содержит пороги для дискриминации одного канала
		my @sp_level1 = @{$processing_params->{'sp_threshold_line1'}}; # Каждый элемент в этом массиве содержит пороги для дискриминации одного канала
		my @sp_level2 = @{$processing_params->{'sp_threshold_line2'}}; # Каждый элемент в этом массиве содержит пороги для дискриминации одного канала
		
		my $result_data =  pdl(); # вектор для сохранения результатов в мат файл
		my $data_header = [];   # заголовок к вектору data
		
		
		
		for (my $i=0; $i<$nchs; $i++) {              # в этом цикле пробегаемся по всем каналам
			my $ch = $data(:, $i);                     # в этой переменной храним отсчеты i-го канала
			(my $lmax_ind, my $lmin_ind) = &extremums($ch); # $lmax_ind and $lmin_ind are indexes of local maximums and nimimums in $ch
		
			# Дискриминируем стимуляции
			my @levels = @{$st_levels[$i]->{'level'}};    # Получаем массив уровней
			my @sides = @{$st_levels[$i]->{'side'}};      # Получаем массив сторон, с которых дискриминируем
			my @times = @{$st_levels[$i]->{'t'}};         # Получаем массив временных границ
			
	
			
			my $stims = pdl(); # вектор времен стимуляций
			for (my $j=0; $j<@levels; $j++) {  # цикл пробегает по всем значениям порога в разных временных диапазонах (порог динамических, не забываем про это)  
				my $t_min;  # время начала диапазона
				my $t_max;  # время конца диапазона
				
				if ($j == 0) {
					$t_min = 0;
				} else {
					$t_min = $times[$j-1];
					$t_min *= $fd;  # Пересчитываем времена в значения индексов отсчетов
				};
				
				if ($j == scalar(@levels)-1) {
					$t_max = nelem($ch); # Это время последнейго отсчета
				} else {
					$t_max = $times[$j];
					$t_max *= $fd;  # Пересчитываем времена в значения индексов отсчетов
				};
			
				my $st;
				if ($sides[$j] eq "top") { # дискриминируем стимуляции по-верху
					my $tmp_ind = $lmax_ind -> where ($lmax_ind > $t_min & $lmax_ind < $t_max);
					$st = which($ch($tmp_ind) > $levels[$j]);
					$st = double($tmp_ind($st))/$fd;
				}
				
				
				if ($sides[$j] eq "low") { 	# дискриминируем стимуляции по-низу
					my $tmp_ind = $lmin_ind -> where ($lmin_ind > $t_min & $lmin_ind < $t_max);
					$st = which ($ch($tmp_ind) < $levels[$j]);
					$st = double($tmp_ind($st))/$fd;
				}
				$stims = $stims->append($st);  # добавляем стимуляции на данном промежутке времени в конец общего вектора
			}

			# закончили дискриминировать стимуляции
			
			
			# Дискриминируем спайки
			my @levels1 = @{$sp_level1[$i]->{'level'}};    # Получаем первый массив уровней
			my @times1 = @{$sp_level1[$i]->{'t'}};         # Получаем первый массив временных границ
			
			my @levels2 = @{$sp_level2[$i]->{'level'}};    # Получаем второй массив уровней
			my @times2 = @{$sp_level2[$i]->{'t'}};         # Получаем второй массив временных границ
			
			my $spikes = pdl(); # вектор времен спайков


			my $n_levels = scalar(@levels1) + scalar(@levels2) - 1;

			
			my $t_min = 0;
			my $t_max;
			my $level1 = shift (@levels1);
			my $level2 =  shift (@levels2);;
			
			
			for (my $j=0; $j<$n_levels; $j++) {    
				# В этом цикле мы пробегаемся по всем уровням дискриминации
				# тут нужно перебрать все пороги !!!!
				# А для этого нужно преобразовать структуру данных 
				
				# если в массиве времен нет элементов, устанавливаем значение первого элемента в максимальное значение
				if (scalar(@times1) == 0) {
					$times1[0] = nelem($ch) / $fd;
     			}
     			if (scalar(@times2) == 0) {
					$times2[0] = nelem($ch) / $fd;
				}
				
				# Этот код делает преоборазование формата данных 
				if ($j==0) {
					if ($times1[0] <= $times2[0]) { # тут неочевидное место, в котором могут быть проблемы
						$t_max = shift (@times1);
					} else {
						$t_max = shift (@times2);
					}
				} else {
					if ($times1[0] <= $times2[0]) { # тут неочевидное место, в котором могут буть проблемы, надо потестировать !!!!!!!
						$t_max = shift (@times1);
						$level2 = shift (@levels2);
					} else {
						$t_max = shift (@times2);
						$level1 = shift (@levels1);
					}
				}
				
				# получаем индексы элементов, которые лежат в текущем временном диапазоне
				my $sp;
				$t_max *= $fd;
				$t_min *= $fd;
				my $tmp_ind_max = $lmax_ind -> where ($lmax_ind > $t_min & $lmax_ind < $t_max);
				my $tmp_ind_min = $lmin_ind -> where ($lmin_ind > $t_min & $lmin_ind < $t_max);
				
				my $tmp_ind = $tmp_ind_max -> append ($tmp_ind_min);
				
				if ($level1 >= $level2) {
					
					$sp = which($ch($tmp_ind) > $level2 & $ch($tmp_ind) < $level1);
					
				 } else {
					$sp = which($ch($tmp_ind) < $level2 & $ch($tmp_ind) > $level1);
					
				}
				if (nelem($sp) > 0) {
					$sp = double($tmp_ind($sp))/$fd;
				}
				
				$spikes = $spikes->append($sp); # Складываем полученные значения в результирующий вектор
				
				
				$t_min = $t_max; # Это присвоение нужно для следующего цикла
			}

			
			# сохраняем результаты в вектор $result_data
			# Сохраняем заголовок в виде хеша $data_header
			${$data_header}[$i] -> {"channel_name"} = "channel_".($i + 1); 
			my $low_ind = nelem($result_data);
			my $upper_ind = nelem ($stims) + $low_ind - 1;
			$result_data = $result_data -> append ($stims);
			
			
			${$data_header}[$i] -> {"stim"} = {
					"low_ind" => $low_ind,
					"upper_ind" => $upper_ind,
			};
			
			
			$low_ind = nelem($result_data);
			$upper_ind = nelem($spikes) + $low_ind -1;
			$result_data = $result_data -> append ($spikes);
			${$data_header}[$i] -> {"spikes"} = [
				{
					"low_ind" => $low_ind,
					"upper_ind" => $upper_ind,
				}
			];
			
			
		} # Конец цикла, который пробегает по всем каналам

		matlab_write($target_file, $result_data);
		my $processing_node_id = int($_getpost{'processing_node_id'});
		&save_param($processing_node_id, $data_header);
		
		print qq(\n ######################### success ########################### \n\n\n\n);

	}
	
	else {
		print qq(Not valid regime);
	}
}


