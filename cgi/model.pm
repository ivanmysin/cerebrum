# model 
use strict;
use warnings;
use JSON;
our %_getpost;
our $_session;
our $dbh;
sub mysql_select_query {
	my $query = shift;
	my $sth = $dbh->prepare($query);
	$sth->execute(); # or die $Mysql::db_errstr;
	my @ans;
	my $i=0;
	while (my $row = $sth->fetchrow_hashref()) {
		$ans[$i] = $row;
		$i++;
	}
	$sth->finish();
	return @ans;
}
########################################################################

sub mysql_other_query {
	my $query = shift;
	my $sth = $dbh->prepare($query);
	my $res = $sth->execute();
	$sth->finish();
	return $res;
}


########################################################################
sub get_top_menu {
	my $query = "SELECT * FROM top_menu ORDER BY parent_id, top_menu.order";
	my @res = mysql_select_query ($query);
	my $sth = $dbh->prepare($query);
	$sth->execute();
	my @top_menu;
	my $i=0;
	
	while (my $row = $sth->fetchrow_hashref()) {
		my @sub = ();
		if ($row->{'parent_id'} == 0) {
			$top_menu[$i] = {'main' => $row, 'sub'=> []}; 
		} else {
			my $parent = $row->{'parent_id'};
			foreach my $t (@top_menu) {
				if ($parent == $t->{'main'}{'id'}) {
					push($t->{'sub'}, $row);
				}
			}
		}
		$i++;
	}
	$sth->finish();
	return \@top_menu;
}
########################################################################
sub get_left_bar {
	my $query = "SELECT sub_series.id, sub_series.parent_seria_id, sub_series.name FROM sub_series 
					INNER JOIN series ON sub_series.parent_seria_id = series.series_id 
						WHERE series.current='1'";
	my @res = mysql_select_query ($query);
	#print_arr (\@res);
	my %left_bar;
	my $i=0;
	foreach my $t (@res) {
		$left_bar{$t->{'id'}}{'main'} = $t;
		my $id = $t->{'parent_seria_id'};
		my $sub_id = $t->{'id'};
		my $query2 = "SELECT *, DATE_FORMAT(date,'%d/%m/%Y') as date FROM records WHERE series_id=$id AND sub_series_id=$sub_id";
		#print_arr ($t);
		my @res2 = mysql_select_query ($query2);
		if (@res2 != 0) { 
			my $ref = \@res2;
			$left_bar{$t->{'id'}}{'sub'} = $ref; 
		}
		
	} 
	
	
	#print_arr (\%left_bar);
	
	return %left_bar;
}
########################################################################
sub add_record {
	my $query = "SELECT * FROM series";
	my @res = mysql_select_query($query);
	foreach my $t (@res) {
		$query = "SELECT * FROM sub_series WHERE parent_seria_id=$t->{'series_id'}";
		my @res2 = mysql_select_query($query);
		if (scalar(@res2) != 0) {
			my $ref = \@res2;
			$t->{'sub'} = $ref;
		}
	}
	my $ref = \@res;
	return $ref;
}
########################################################################
sub added_record {
	my @ser = split('|', $_getpost{'series'});
	my $ser_id = int ($ser[0]);
	my $group_id = int ($ser[-1]);
	my $name = clear($_getpost{'record_name'});
	my $date = clear($_getpost{'date'});
	my $description = clear($_getpost{'description'});
	
	# Insert into table records received data
	my $query = "INSERT INTO records (series_id, sub_series_id, name, date, description) VALUE ('$ser_id', '$group_id', $name, STR_TO_DATE($date, '%d/%m/%Y'), $description)";
	&mysql_other_query($query);
	
	# Select data about processing receive data
	$query = "SELECT id, directory_of_mat_files FROM registrated_nodes WHERE id_parent_nodes='0'";
	my @registrated_nodes = mysql_select_query($query);
	
	my $record_id = $dbh->last_insert_id(undef, undef, "records", "records_id");
	my $registrated_nodes_id = $registrated_nodes[0]->{'id'};
	
	# Create new processing node
	# $query = "INSERT INTO processing_nodes (id_parent_nodes, id_record, id_regisrated_node) VALUE (0, '$record_id', '$registrated_nodes_id')";
	# &mysql_other_query($query);
	
	# Upload file and copy this to dir in mat format
	# my $last_node_id = $dbh->last_insert_id(undef, undef, "processing_nodes", "id");
	my $target_file = $record_id;
	my $sources_file = "file";
	my $dir_for_mat = $registrated_nodes[0] -> {'directory_of_mat_files'};
	
	my $receved_data = &upload_file($sources_file, $target_file);
	
	my $sourse_file = $receved_data->{'sourse_file'}; # Это файл полученный от пользователя
	my $origin_file = $receved_data->{'origin_file'}; # Это файл - начало обработки
	
	
	
	my $server_params = &clear (JSON->new->utf8->encode($receved_data));
	
	$query = "UPDATE records SET sourse_file='$sourse_file', origin_file='$origin_file', server_json_params=$server_params WHERE records_id=$record_id";
	&mysql_other_query($query);
	
=h
	# Тут нужно сделать сохраниние параметров, полученных при сохранении, таких как частота дискретизации !!!
	foreach my $key (keys (%{$receved_data})) {
		if ($key eq 'uploaded_file') {next;};
		my $val = $receved_data->{$key};
		$query = "INSERT INTO proccessed_values (name, value, id_registrated_values, id_processing_nodes) VALUE ('$key', '$val', '1', '$last_node_id')";       
		&mysql_other_query($query);
	};
=cut
}
########################################################################
sub get_add_group {
	my $query = "SELECT * FROM series";
	my @res = mysql_select_query($query);
	return (\@res);
}
########################################################################
sub added_group {
	my $parent_seria_id = int($_getpost{'series'});
	my $name = clear($_getpost{'group_name'});
	my $current=0;
	if ($_getpost{'current'} eq 'on') {
		$current=1;
		my $query = "UPDATE sub_series SET current='0' WHERE parent_seria_id = '$parent_seria_id'";
		&mysql_other_query($query);
	}
	my $description = clear($_getpost{'description'});
	my $query = "INSERT INTO sub_series (parent_seria_id, name, current, description) VALUE ($parent_seria_id, $name, $current, $description)";
	&mysql_other_query($query);
	
}
########################################################################
sub added_seria {
	my $name = clear($_getpost{'seria_name'});
	my $description = clear($_getpost{'description'});
	my $current=0;
	if ($_getpost{'current'} eq 'on') {
		$current=1;
		my $query = "UPDATE series SET current='0'";
		&mysql_other_query($query);
	}
	my $query = "INSERT INTO series (name, current, description) VALUE ($name, $current, $description)";
	&mysql_other_query($query);
}
########################################################################
sub get_records {
	my $query = "SELECT records.records_id, records.name, records.description, DATE_FORMAT(date,'%d/%m/%Y') AS date, 
					series.name AS series_name, sub_series.name AS group_name FROM records 
					INNER JOIN sub_series ON records.sub_series_id = sub_series.id 
					INNER JOIN series ON records.series_id = series.series_id"; #"SELECT *, DATE_FORMAT(date,'%d/%m/%Y') as date FROM records";
	my @res = &mysql_select_query($query);
	return \@res;
}
########################################################################
sub get_groups {
	my $query = "SELECT sub_series.id, sub_series.name, sub_series.description, sub_series.current,
					series.name AS series_name FROM sub_series 
					INNER JOIN series ON sub_series.parent_seria_id = series.series_id";
	my @res = &mysql_select_query($query);
	return \@res;
}
########################################################################
sub get_series {
	my $query = "SELECT * FROM series";
	my @res = &mysql_select_query($query);
	return \@res;
}
########################################################################
sub get_record_by_id {
	my $record_id = shift;
	my $query = "SELECT *, DATE_FORMAT(date,'%d/%m/%Y') as date FROM records WHERE records_id='$record_id'";
	my @res = &mysql_select_query($query);
	return $res[0]; 
}
########################################################################
sub edited_record {
	my $record_id = int ($_getpost{'record_id'});
	my @ser = split('|', $_getpost{'series'});
	my $ser_id = int ($ser[0]);
	my $group_id = int ($ser[-1]);
	my $name = clear($_getpost{'record_name'});
	my $date = clear($_getpost{'date'});
	my $description = clear($_getpost{'description'});
	my $query = "UPDATE records SET series_id='$ser_id', sub_series_id='$group_id', name=$name, date=STR_TO_DATE($date, '%d/%m/%Y'), description=$description WHERE records_id='$record_id'";
	# print $query;
	&mysql_other_query($query);
}
########################################################################
sub get_group_by_id {
	my $group_id = shift;
	my $query = "SELECT * FROM sub_series WHERE id='$group_id'";
	my @res = &mysql_select_query($query);
	return $res[0]; 
}
########################################################################
sub edited_group {
	my $group_id = int($_getpost{'group_id'});
	my $name = &clear($_getpost{'group_name'});
	my $series_id = int($_getpost{'series'});
	my $description = &clear($_getpost{'description'});
	my $current = 0;
	if ($_getpost{'current'} eq 'on') {
		$current = 1;
		my $query = "UPDATE sub_series SET current=0 WHERE parent_seria_id='$series_id'";
		&mysql_other_query($query);
	}
	my $query = "UPDATE sub_series SET parent_seria_id='$series_id', name=$name, current='$current', description=$description WHERE id='$group_id'";
	&mysql_other_query($query);
}
########################################################################
sub get_seria_by_id {
	my $series_id = shift;
	my $query = "SELECT * FROM series WHERE series_id='$series_id'";
	my @res = &mysql_select_query($query);
	return $res[0];
}
########################################################################
sub edited_seria {
	my $series_id = int($_getpost{'series_id'});
	my $name = &clear($_getpost{'seria_name'});
	my $description = &clear($_getpost{'description'});
	my $current = 0;
	if ($_getpost{'current'} eq 'on') {
		$current = 1;
		my $query = "UPDATE series SET current=0";
		&mysql_other_query($query);
	}
	my $query = "UPDATE series SET name=$name, description=$description, current='$current' WHERE series_id=$series_id";
	&mysql_other_query($query);
}
########################################################################
sub delete_record {
	my $record_id = shift;
	my $query = "DELETE FROM records WHERE records_id='$record_id'";
	&mysql_other_query($query);
}
########################################################################
sub delete_group {
	my $group_id = shift;
	my $query = "DELETE FROM records WHERE sub_series_id='$group_id'";
	&mysql_other_query($query);
	$query = "DELETE FROM sub_series WHERE id='$group_id'";
	&mysql_other_query($query);
}
########################################################################
sub delete_seria {
	my $series_id = shift;
	my $query = "DELETE FROM records WHERE series_id='$series_id'";
	&mysql_other_query($query);
	$query = "DELETE FROM sub_series WHERE parent_seria_id='$series_id'";
	&mysql_other_query($query);
	$query = "DELETE FROM series WHERE series_id='$series_id'";
	&mysql_other_query($query);	
}
########################################################################
sub get_home_data {
	my $query = "SELECT records_id, records.name AS record_name, sub_series.id AS group_id, sub_series.name AS group_name, series.name AS series_name 
					FROM records RIGHT JOIN sub_series ON records.sub_series_id=sub_series.id 
						INNER JOIN series ON sub_series.parent_seria_id=series.series_id 
							WHERE series.current=1 ORDER BY sub_series.current DESC, sub_series.name";
	my @res = &mysql_select_query($query);
	return \@res;
}
########################################################################
sub get_processing_data {
	my $node_id = shift;
	my $query = "SELECT * FROM processing_nodes WHERE id='$node_id'";
	my $newQuery =  qq(
	SELECT registrated_nodes.name AS module_name, records.name AS record_name, processing_nodes.id, 
	processing_nodes.id_parent_nodes, processing_nodes.id_registrated_node, processing_nodes.mat_file FROM 
	processing_nodes INNER JOIN registrated_nodes ON processing_nodes.id_registrated_node=registrated_nodes.id 
	                 INNER JOIN records ON records.records_id=processing_nodes.id_record 
	          WHERE processing_nodes.id=$node_id);

	my @res = &mysql_select_query($newQuery);
	return $res[0];
}
########################################################################
sub get_target_nodes {
	my $node_id = shift;
	my $query = "SELECT * FROM registrated_nodes WHERE id_parent_nodes='$node_id'";
	my @res = &mysql_select_query($query);
	return \@res;
}

########################################################################
# Эта функция пока не используется !!!!!
=h
sub set_new_processing_node {
	my $parent_processing_node = shift;
	my $record_id = shift;
	my $registrated_node_id = shift;
	my $query = "INSERT INTO processing_nodes ('$parent_processing_node', '$record_id', '$registrated_node_id') VALUES (id_parent_nodes, id_record, id_regisrated_node)";
	my $res = mysql_other_query ($query);
	print $res;
	return $res;
}
=cut
########################################################################
sub get_processing_id_by_record {
	my $record_id = shift;
	my $query = "SELECT id FROM `processing_nodes` WHERE id_record='$record_id' AND id_parent_nodes='0'";
	my @res = &mysql_select_query($query);
	my $id = $res[0]->{"id"};
	return $id;
}
########################################################################
sub get_regisrated_node_id_by_processing_node_id {
	my $processing_node_id = shift;
	my $query = "SELECT id_registrated_node FROM `processing_nodes` WHERE id='$processing_node_id'";
	my @res = &mysql_select_query($query);
	my $id = $res[0]->{"id_registrated_node"};
	return $id;
}
########################################################################
sub get_registrated_data {
	my $node_id = shift;
	my $query = "SELECT * FROM registrated_nodes WHERE id='$node_id'";
	my @res = &mysql_select_query($query);
	return $res[0];
}
########################################################################
sub get_ajax_script_param {
	my $processing_node_id = shift;
	my $target_node_id = shift;
	my $parent_processing_node_id = shift;
	my $record_id = shift;
	my @sourse;
	if ($parent_processing_node_id == 0) {
		my $query = "SELECT origin_file, server_json_params FROM records WHERE records_id=$record_id";
		my @res = &mysql_select_query($query);
		$sourse[0]->{"sourse_file"} = $res[0]->{"origin_file"}; 
		$sourse[0]->{"server_json_params"} = $res[0]->{"server_json_params"}; 
		$sourse[0]->{"source_file_dir"} = MAT_FILES_ORIGIN;
		
	} else {
		my $query = "SELECT processing_nodes.mat_file AS sourse_file, registrated_nodes.directory_of_mat_files AS source_file_dir, processing_nodes.server_json_params 
				FROM processing_nodes 
					INNER JOIN registrated_nodes ON 
						registrated_nodes.id=processing_nodes.id_registrated_node
					WHERE processing_nodes.id = $parent_processing_node_id";
				
		@sourse = &mysql_select_query($query);
	}
	my $query = "SELECT directory_of_mat_files AS target_file_dir, server_ajax_file FROM registrated_nodes WHERE id=$target_node_id";
	my @res2 = &mysql_select_query($query);
	
	$query = "SELECT processing_nodes.mat_file AS target_file, registrated_nodes.directory_of_mat_files AS target_file_dir FROM processing_nodes 
					INNER JOIN registrated_nodes ON 
						registrated_nodes.id=processing_nodes.id_registrated_node
					WHERE processing_nodes.id = $processing_node_id";;
	
	my @res3 = &mysql_select_query($query);
	
	my %data = (%{$sourse[0]}, %{$res2[0]}, %{$res3[0]});
	
	return \%data;
}


########################################################################
sub get_session_file {
	my $session_id = shift;
	my $ip = shift;
	my $user_agent = shift;
	my $query = "SELECT data FROM session WHERE session_id='$session_id' AND IP='$ip' AND user_agent='$user_agent'";

	my @res = &mysql_select_query($query);
	return $res[0]->{"data"};
}

sub create_new_session {
	my $ip = shift;
	my $user_agent = shift;
	$user_agent = clear ($user_agent);
	$ip = clear ($ip);
	
	my $query = "INSERT INTO session (user_agent, date, IP) values ($user_agent, NOW(), $ip)";
	my $res = &mysql_other_query($query);
	my $session_id = $dbh->last_insert_id(undef, undef, "session", "session_id");
	my $query = "UPDATE session SEt data=$session_id";
	my $res = &mysql_other_query($query);
	return $session_id;
} 
########################################################################
sub create_new_processing_node {
	
	my $parent_processing_node_id = shift;
	my $target_reg_node_id = shift;
	my $record_id = shift;
	my $processed_html_code = shift;
	my $processed_param = shift;
	
	# Получаем имя записи
	my $record_name;
	if ($parent_processing_node_id != 0) {
		my $query = "SELECT processing_nodes.id_record, records.name FROM processing_nodes 
		                      INNER JOIN records ON processing_nodes.id_record=records.records_id 
		                WHERE processing_nodes.id= $parent_processing_node_id";
		my @res = &mysql_select_query($query);
		$record_id = $res[0]->{'id_record'};
		$record_name = $res[0]->{'name'};
	} else {
		my $query = "SELECT name FROM records WHERE records_id=$record_id";
		my @res = &mysql_select_query($query);
		$record_name = $res[0]->{'name'};
	}
	# Обновляем данные о старом узле, сохраняем html код (это код на момент когда пользователь покинул страницу) 
	my $query = qq(UPDATE processing_nodes SET html_processed_code=$processed_html_code WHERE id=$parent_processing_node_id);

	my $res = &mysql_other_query($query);
	# Заводим новый узел обработки
	$query = "INSERT INTO processing_nodes (id_parent_nodes, id_record, id_registrated_node, json_params)
	                                     VALUES ($parent_processing_node_id, $record_id, $target_reg_node_id, $processed_param)"; 
	$res = &mysql_other_query($query);
	my $new_processing_node_id = $dbh->last_insert_id(undef, undef, "processing_nodes", "id");
	
	my $file_name = $new_processing_node_id."_".$record_name.".mat";
	$query = "UPDATE processing_nodes SET mat_file='$file_name' WHERE id=$new_processing_node_id";
	$res = &mysql_other_query($query);
	
	# Возвращяем id нового узла
	return $new_processing_node_id;
}
########################################################################


########################################################################
1;
