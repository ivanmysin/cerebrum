# model 

use lib ("/home/ivan/perl5/lib/perl5/");
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
	my $name = &clear($_getpost{'seria_name'});
	my $description = &clear($_getpost{'description'});
	
	my $read_users = $_getpost{'read_users'};		
	#print_arr ($read_users);
	my $write_users = $_getpost{'write_users'};
	
	my $current=0;
	if ($_getpost{'current'} eq 'on') {
		$current=1;
		my $query = "UPDATE series SET current='0'";
		&mysql_other_query($query);
	}
	# add seria in db
	my $query = "INSERT INTO series (name, current, description) VALUE ($name, $current, $description)";
	&mysql_other_query($query);
	
	#add access for this seria in db for this user
	my $series_id = $dbh->last_insert_id(undef, undef, "series", "series_id");
	$query = qq( INSERT INTO access (series_id, user_id, access_type) VALUES ($series_id, $_session->{"user_id"}, "host") );
	&mysql_other_query($query);
	
	# add access for reading for this seria for other users
	my $logins = "";
	if (ref($read_users) eq "ARRAY") {
		for (my $i=0; $i<@{$read_users}; $i++ ){
			my $t  = &clear($read_users->[$i]);
			$logins .= $t.", ";
		}
		$logins = substr($logins, 0, -2);
	} else {
		$logins = &clear($read_users);
	}
	$query = qq( SELECT id FROM users WHERE login IN ($logins) );
	my @readusers_ids = &mysql_select_query($query);
	$query = qq(INSERT INTO access (series_id, user_id, access_type) VALUES );
	for (my $i=0; $i<@readusers_ids; $i++ ){
		$query .= qq( ($series_id, $readusers_ids[$i]->{"id"}, "read"), );
	}
	$query = substr($query, 0, -2);
	&mysql_other_query($query);
	
	# add access for write for this seria for other users
	$logins = "";
	if (ref($write_users) eq "ARRAY") {
		for (my $i=0; $i<@{$write_users}; $i++ ){
			my $t  = &clear($write_users->[$i]);
			$logins .= $t.", ";
		}
		$logins = substr($logins, 0, -2);
	} else {
		$logins = &clear($read_users);
	}
	$query = qq( SELECT id FROM users WHERE login IN ($logins) );
	my @writeusers_ids = &mysql_select_query($query);
	$query = qq(INSERT INTO access (series_id, user_id, access_type) VALUES );
	for (my $i=0; $i<@writeusers_ids; $i++ ){
		$query .= qq( ($series_id, $writeusers_ids[$i]->{"id"}, "write"), );
	}
	$query = substr($query, 0, -2);
	&mysql_other_query($query);
	
}
########################################################################
sub get_records {
	my $user_id = $_session->{"user_id"};
	my $query = qq(
		SELECT records.records_id, records.name, records.description, DATE_FORMAT(date,'%d/%m/%Y') AS date, 
			series.name AS series_name, sub_series.name AS group_name, access.access_type FROM records 
		INNER JOIN sub_series ON records.sub_series_id = sub_series.id 
		INNER JOIN series ON records.series_id = series.series_id
		INNER JOIN access ON access.series_id = series.series_id
		WHERE access.user_id=$user_id AND access.access_type IN ("host", "write", "read")
	); 
	my @res = &mysql_select_query($query);
	return \@res;
}
########################################################################
sub get_groups {
	my $user_id = $_session->{'user_id'};
	my $query = qq(
		SELECT sub_series.id, sub_series.name, sub_series.description, sub_series.current, sub_series.parent_seria_id,
			series.name AS series_name, access.access_type FROM sub_series 
			INNER JOIN series ON sub_series.parent_seria_id = series.series_id
			INNER JOIN access ON series.series_id=access.series_id
		WHERE access.user_id=$user_id AND access.access_type IN ("host", "write", "read")
	);
	my @res = &mysql_select_query($query);
	return \@res;
}
########################################################################
sub get_series {
	my $user_id = $_session->{'user_id'};
	my $query = qq(
		SELECT series.series_id, series.name, series.description, access.access_type FROM series 
		INNER JOIN access ON series.series_id=access.series_id
		WHERE access.user_id=$user_id AND access_type IN ("host", "write", "read") 
	);
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
	my $user_id = $_session->{"user_id"};
	my $query = qq(
		UPDATE records SET series_id='$ser_id', sub_series_id='$group_id', name=$name, 
			date=STR_TO_DATE($date, '%d/%m/%Y'), description=$description 
		WHERE records_id=$record_id AND series_id IN 
		( 
			SELECT series_id FROM access WHERE user_id=$user_id AND access_type IN ("host", "write")
		)
	);
	&mysql_other_query($query);
}
########################################################################
sub get_group_by_id {
	my $group_id = shift;
	my $query = qq(SELECT * FROM sub_series WHERE id=$group_id);
	my @res = &mysql_select_query($query);
	return $res[0]; 
}
########################################################################
sub edited_group {
	my $group_id = int($_getpost{'group_id'});
	my $name = &clear($_getpost{'group_name'});
	my $series_id = int($_getpost{'series'});
	my $description = &clear($_getpost{'description'});
	my $user_id = $_session->{"user_id"};
	my $current = 0;
	if ($_getpost{'current'} eq 'on') {
		$current = 1;
		my $query = qq(
			UPDATE sub_series SET current=0 
				WHERE parent_seria_id=$series_id AND parent_seria_id IN
					( SELECT series_id FROM access WHERE user_id=$user_id AND access_type IN ("host", "write") )
			);
		&mysql_other_query($query);
	}
	my $query = qq(
		UPDATE sub_series SET parent_seria_id=$series_id, name=$name,
				current=$current, description=$description 
			WHERE id=$group_id AND parent_seria_id IN
				( SELECT series_id FROM access WHERE user_id=$user_id AND access_type IN ("host", "write") )
		);
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
	my $user_id = $_session->{'user_id'};
	if ($_getpost{'current'} eq 'on') {
		$current = 1;
		my $query = qq(UPDATE series SET current=0 WHERE series_id IN ( SELECT series_id FROM access WHERE user_id=$user_id AND access_type IN ("host", "write") ) );
		&mysql_other_query($query);
	}
	my $query = qq( 
			UPDATE series SET name=$name, description=$description, current='$current' 
				WHERE series_id=$series_id AND series_id IN (SELECT series_id FROM access WHERE user_id=$user_id AND access_type IN ("host", "write") )
			);
	&mysql_other_query($query);
}
########################################################################
sub delete_record {
	my $record_id = shift;
	my $user_id = $_session->{"user_id"};
	my $query = qq(
		DELETE FROM records WHERE records_id=$record_id AND series_id IN 
		( 
			SELECT series_id FROM access WHERE user_id=$user_id AND access_type IN ("host")
		)
	);
	&mysql_other_query($query);
}
########################################################################
sub delete_group {
	my $group_id = shift;
	my $user_id = $_session->{'user_id'};
	my $query = qq(
		DELETE FROM sub_series WHERE id=$group_id AND parent_seria_id IN
			( SELECT series_id FROM access WHERE user_id=$user_id AND access_type IN ("host") )
	);
	&mysql_other_query($query);
}
########################################################################
sub delete_seria {
	my $series_id = shift;
	my $user_id = $_session->{"user_id"};
	my $query = qq(DELETE FROM series WHERE series_id=$series_id AND series_id IN ( SELECT series_id FROM access WHERE user_id=$user_id AND access_type IN ("host") ) );
	&mysql_other_query($query);	
}
########################################################################
sub get_home_data {
	my $query = "SELECT records_id, records.name AS record_name, sub_series.id AS group_id, sub_series.name AS group_name, series.name AS series_name 
					FROM records RIGHT JOIN sub_series ON records.sub_series_id=sub_series.id 
						INNER JOIN series ON sub_series.parent_seria_id=series.series_id 
							WHERE series.current=1 ORDER BY sub_series.current DESC, sub_series.name";
	my @res = &mysql_select_query($query);
	
	
	my $newQuery = qq(
		SELECT processing_nodes.id, processing_nodes.id_parent_nodes AS parent, processing_nodes.id_record AS record_id, registrated_nodes.name,
		records.name AS record_name, processing_nodes.statistics
		FROM processing_nodes INNER JOIN registrated_nodes ON registrated_nodes.id = processing_nodes.id_registrated_node 
			INNER JOIN records ON processing_nodes.id_record=records.records_id
			INNER JOIN sub_series ON records.sub_series_id=sub_series.id
			INNER JOIN series ON series.series_id = sub_series.parent_seria_id
			WHERE series.current=1 AND sub_series.current=1
			ORDER BY processing_nodes.id_record
	);
	
	my @newRes = &mysql_select_query($newQuery);
	my @tree = (); 
	
	my $current_record_id=0;
	my $tree_ind = -1;
	for (my $i=0; $i<@newRes; $i++) {
		my $t = $newRes[$i];
		
		if ($t->{"record_id"} != $current_record_id) {
			
			$tree_ind++;
			$tree[$tree_ind] = {
				"record_name" => $t->{"record_name"},
				"json_tree" => {
					'core' => {
						'data' => [],
					},
				},
			};
			$current_record_id = $t->{"record_id"};
		};
	
		$t->{"parent"} = $t->{"parent"} == 0 ? "#" : $t->{"parent"};
		
		my $text = qq(
		<a href=?view=get_processed&processing_node_id=$t->{"id"}> $t->{"name"} </a> 

		);
		# 		<div class="node_statistics"> $t->{"statistics"} </div>
		my $node = {
			"id" => $t->{"id"},
			"parent" => $t->{"parent"},
			"text" => $text,
			'state' => {
				'opened' => 1,
			},
			"icon" => "False", #PATH."alv.gif",
		};
		push($tree[$tree_ind]->{"json_tree"}->{'core'}->{'data'}, $node);
	};
	
	foreach my $t (@tree) {
		$t->{"json_tree"} = JSON->new->utf8(0)->encode($t->{"json_tree"});
	}
	
	
	return (\@res, \@tree);
}
########################################################################
sub get_processing_data {
	my $node_id = shift;
	# my $query = "SELECT * FROM processing_nodes WHERE id='$node_id'";
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
	my $path_id = shift;
	my $query = qq(
	SELECT 	reg_nodes_connections.id AS path_id, reg_nodes_connections.name
				FROM reg_nodes_connections
		WHERE reg_nodes_connections.origin_reg_node_id=(SELECT reg_nodes_connections.target_reg_node_id  FROM reg_nodes_connections WHERE reg_nodes_connections.id=$path_id) );
	
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
	my $path_id = shift;
	my $query = qq(
		SELECT * FROM registrated_nodes WHERE id=(SELECT target_reg_node_id FROM reg_nodes_connections WHERE id=$path_id)
	);
		
	my @res = &mysql_select_query($query);
	my $html = $res[0]->{'html_code'};
	
	if (substr($html, 0, 5) eq "file=") {
		my $file = HTML_TEMPLATES_DIR . substr($html, 5);
		$html = &read_file($file);
		$res[0]->{'html_code'} = $html;
	};
	
	return $res[0];
}
########################################################################
sub get_ajax_script_param {
	my $processing_node_id = shift;
	my $path_id = shift;
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
		my $query = "SELECT processing_nodes.mat_file AS sourse_file, registrated_nodes.directory_of_mat_files AS source_file_dir,
		processing_nodes.server_json_params, processing_nodes.json_params AS client_params
				FROM processing_nodes 
					INNER JOIN registrated_nodes ON 
						registrated_nodes.id=processing_nodes.id_registrated_node
					WHERE processing_nodes.id = $parent_processing_node_id";
		# print $query;
		@sourse = &mysql_select_query($query);
	}
	my $query = "SELECT registrated_nodes.directory_of_mat_files AS target_file_dir, 
			reg_nodes_connections.server_script_file
				FROM registrated_nodes
					INNER JOIN reg_nodes_connections ON
						reg_nodes_connections.target_reg_node_id = registrated_nodes.id
					WHERE reg_nodes_connections.id=$path_id";
					
	my @res2 = &mysql_select_query($query);
	
	$query = "SELECT processing_nodes.mat_file AS target_file, registrated_nodes.directory_of_mat_files AS target_file_dir FROM processing_nodes 
					INNER JOIN registrated_nodes ON 
						registrated_nodes.id=processing_nodes.id_registrated_node
					WHERE processing_nodes.id = $processing_node_id";
	
	my @res3 = &mysql_select_query($query);
	my %data = (%{$sourse[0]}, %{$res2[0]}, %{$res3[0]});

	return \%data;
}


########################################################################
sub get_session_data {
	my $session_id = shift;
	my $ip = shift;
	my $user_agent = shift;
	my $query = "SELECT session_id, data FROM session WHERE session_id=$session_id AND IP=$ip AND user_agent=$user_agent";
	my @res = &mysql_select_query($query);
	return $res[0]->{"data"};
}

=h
sub get_session_file {
	my $session_id = shift;
	my $ip = shift;
	my $user_agent = shift;
	my $query = "SELECT data FROM session WHERE session_id='$session_id' AND IP='$ip' AND user_agent='$user_agent'";

	my @res = &mysql_select_query($query);
	return $res[0]->{"data"};
}
=cut
sub create_new_session {
	my $ip = shift;
	my $user_agent = shift;
	my $query = "INSERT INTO session (user_agent, date, IP, data) values ($user_agent, NOW(), $ip, '{}')";

	my $res = &mysql_other_query($query);
	my $session_id = $dbh->last_insert_id(undef, undef, "session", "session_id");
	return $session_id;
} 

sub save_session {
	my $session_data = &clear(JSON->new->utf8(1)->encode($_session));
	                          
	my $session_id = int($_session->{"session_id"});
	my $query = "UPDATE session SET data=$session_data WHERE session_id=$session_id";

	my $res = &mysql_other_query($query);
}

########################################################################
sub create_new_processing_node {
	
	my $parent_processing_node_id = shift;
	my $path_id = shift;
	my $record_id = shift;
	my $processed_html_code = shift;
	my $processed_param = shift;
	my $after_processing = shift;
	
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
	# Но делаем это только в том случае, если пользователь пришел с обрабатываемой страницы, а не со сохраненного узла !!!!
	if ($after_processing == 0) {
	my $query = qq(UPDATE processing_nodes SET html_processed_code=$processed_html_code,
					json_params = $processed_param
				WHERE id=$parent_processing_node_id);
	my $res = &mysql_other_query($query);
	}
	# Заводим новый узел обработки
	my $query = qq( INSERT INTO processing_nodes (id_parent_nodes, id_record, id_registrated_node)
	                                     VALUES ($parent_processing_node_id, $record_id, 
	        (
				SELECT target_reg_node_id FROM reg_nodes_connections WHERE id=$path_id
	        ))
	        ); 
	my $res = &mysql_other_query($query);
	my $new_processing_node_id = $dbh->last_insert_id(undef, undef, "processing_nodes", "id");
	
	my $file_name = $new_processing_node_id."_".$record_name.".mat";
	$query = "UPDATE processing_nodes SET mat_file='$file_name' WHERE id=$new_processing_node_id";
	$res = &mysql_other_query($query);
	
	# Возвращяем id нового узла
	return $new_processing_node_id;
}
########################################################################
sub get_processed_data {
	my $processing_node_id = shift;
	my $query = qq(
		SELECT processing_nodes.id AS processing_node_id, processing_nodes.id_parent_nodes AS parent_processing_node, processing_nodes.html_processed_code, 
		processing_nodes.id_record, records.name, registrated_nodes.css_file
			FROM processing_nodes INNER JOIN records ON processing_nodes.id_record = records.records_id
			INNER JOIN registrated_nodes ON registrated_nodes.id=processing_nodes.id_registrated_node
		WHERE processing_nodes.id=$processing_node_id	
	); 
	my @res = &mysql_select_query($query);
	
	my $query_top_menu = qq(
		SELECT reg_nodes_connections.id AS path_id, reg_nodes_connections.name 
			FROM reg_nodes_connections INNER JOIN registrated_nodes ON registrated_nodes.id = reg_nodes_connections.target_reg_node_id 
		WHERE reg_nodes_connections.origin_reg_node_id = 
			(SELECT processing_nodes.id_registrated_node FROM processing_nodes WHERE processing_nodes.id = $processing_node_id)
	);
	my @top_menu = &mysql_select_query($query_top_menu);
	return {"processed_data" => $res[0], "targets" => \@top_menu};
}

########################################################################
sub save_node_state {
	my $processing_node_id = shift;
	my $html_code = shift;
	my $processed_param = shift;
	my $query = qq(UPDATE processing_nodes SET html_processed_code=$html_code, json_params=$processed_param WHERE id=$processing_node_id);
	my $res = &mysql_other_query($query);
	return $res;
}
########################################################################
# Функция сохраняет параметры, обрабатывающиеся на стороне сервера
sub save_param {
	my $node_id = shift;
	my $param_ref = shift;
	my $statistics = shift;
	$statistics = defined($statistics) ? $statistics : "Statistics is not defined";
	$statistics  = &clear($statistics);
	print_log("ok");
	my $param = &clear(JSON->new->utf8(0)->encode($param_ref));
	print_log($param);
	my $query = "UPDATE processing_nodes SET server_json_params=$param, statistics=$statistics WHERE id=$node_id";
	my $res = &mysql_other_query($query);
	
	#$query = "SELECT server_json_params FROM processing_nodes WHERE id=$node_id";
	#my @res = &mysql_select_query($query);
	#print("Получили из БД ".$res->[0]->{"server_json_params"}); #
	
	return $res;
}

sub cut_end_qouts {
	my $str = shift;
	if (substr($str, 0, 1) eq "\"" or substr($str, 0, 1) eq "'") {
		$str = substr($str, 1);
	};

	if (substr($str, -1, 1) eq "\"" or substr($str, -1, 1) eq "'") {
		$str = substr($str, 0, -1);
	};
	return $str;
}
########################################################################
sub authorize_user {
	my $login = shift;
	my $password = shift;
	my $query = qq(SELECT id AS user_id, name FROM users WHERE login=$login AND password=$password LIMIT 1);

	my @res = &mysql_select_query($query);
	if ( defined($res[0]->{"user_id"}) ) {
		$_session->{"user_id"} = $res[0]->{"user_id"};
		$_session->{"username"} = $res[0]->{"name"};
	} else {
		$_session->{"error"} = 1; # flag of error
	}
}
########################################################################
sub registrate_user {
	my $login = &clear($_getpost{"login"});
	my $password = &clear($_getpost{"password"});
	my $name = &clear($_getpost{"username"});
	my $patronymic = &clear($_getpost{"userpatronymic"});
	my $surname = &clear($_getpost{"usersurname"});
	my $info = &clear($_getpost{"userinfo"});
	my $query = qq(
	INSERT INTO users (login, password, name, patronymic, surname, info)
		VALUES ($login, $password, $name, $patronymic, $surname, $info)
	);
	print $query;
	my $res = &mysql_other_query($query);
	if ($res) {
		my $user_id = $dbh->last_insert_id(undef, undef, "users", "id");
		$_session->{"user_id"} = $user_id;
		$_session->{"username"} = $name;
	} else {
		$_session->{"error"} = 1; # flag of error
	}
}
########################################################################
sub get_userdata {
	my $user_id = shift;
	my $query = "SELECT * FROM users WHERE id=$user_id";
	my @res = &mysql_select_query($query);
	return $res[0]; 
} 
########################################################################
sub update_user_profile {
	my $user_id = $_session->{"user_id"};
	my $password = &clear($_getpost{"password"});
	my $name = &clear($_getpost{"username"});
	my $patronymic = &clear($_getpost{"userpatronymic"});
	my $surname = &clear($_getpost{"usersurname"});
	my $info = &clear($_getpost{"userinfo"});
	my $query = qq(
	UPDATE users SET password=$password, name=$name, patronymic=$patronymic, surname=$surname, info=$info
		WHERE id=$user_id );
	my $res = &mysql_other_query($query);
	
}
########################################################################
sub verify_user_acceess_to_processing_node {
	my $node_id = shift;
	my $record_id = shift;
	my $user_id = $_session->{"user_id"};
	my $query;
	if ($node_id != 0) {
		$query = qq(
			SELECT access_type FROM access WHERE user_id=$user_id 
				AND series_id IN
			( 
				SELECT records.series_id FROM records
					INNER JOIN processing_nodes ON processing_nodes.id_record=records.records_id
				WHERE processing_nodes.id=$node_id
			)
		
		);
	} else {
		$query = qq(
			SELECT access_type FROM access WHERE user_id=$user_id 
				AND series_id IN
			( 
				SELECT series_id FROM records WHERE records_id = $record_id
			)
		);
	};
	#print $query;
	my @res = &mysql_select_query($query);
	return $res[0]->{"access_type"};
}
########################################################################
1;
