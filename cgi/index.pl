#!/usr/bin/perl -w

# this script is point of enter in application

use lib ("/home/ivan/perl5/lib/perl5/");
use strict;
use warnings;
use Switch;
use JSON;

use index_lib;
use model;
use view;


&set_config();
&use_cgi();
&start_session();
our %_getpost;
our $_session;

print "Content-Type: text/html charset=utf-8\n\n";


my $view = defined ($_getpost{'view'}) ? $_getpost{'view'} : 'home'; 



#exit user session 
if ($view eq "logout") {
	$_session->{"user_id"} = 0;
}
# work with authorization
if ($view eq "authorization_query" ) {
	my $login = &clear($_getpost{"login"});
	my $password = &clear($_getpost{"password"});
	&authorize_user($login, $password);
	$view = "home";
}

if ($view eq "registration_query") {
	&registrate_user();
	$view = "home";
}

if (not $_session->{"user_id"} and $view ne "authorization" and $view ne "registration") { 
	# if user is not authorized and query page is not authtorization and registration
	$view  =  "authorization";
}

# controller 
# writing to DB
switch ($view) {
	case ("authorization") {
		&print_header();
		&print_authorization();
		&print_footer();
		&save_session();
		exit();
	}
	
	case ("registration") {
		&print_header();
		&print_registration();
		&print_footer();
		&save_session();
		exit();
	}

	case ('added_record') {
		&added_record();
		$view = 'records';
	}
		
	case ('added_group') {
		&added_group();
		$view = 'home';
	}
		
	case ('added_seria') {
		&added_seria();
		$view = 'home';
	}
	
	case ('edited_record') {
		&edited_record();
		$view = 'records';
	}
	
	case ('edited_group') {
		&edited_group();
		$view = 'groups';
	}
	
	case ('edited_seria') {
		&edited_seria();
		$view = 'series';
	}
	
	case ('delete_record') {
		my $record_id = int ($_getpost{'record_id'});
		&delete_record($record_id);
		$view = 'records';
	}
	
	case ('delete_group') {
		my $group_id = int ($_getpost{'group_id'});
		&delete_group($group_id);
		$view = 'groups';
	}
	
	case ('delete_seria') {
		my $series_id = int($_getpost{'series_id'});
		&delete_seria($series_id);
		$view = 'series';
	}
	
	case ("save_processed_node") {
		my $processing_node_id = int($_getpost{'processing_node_id'});
		my $processed_html_code = &clear($_getpost{'processed_html_code'});
		my $processed_param = &clear($_getpost{'processed_params'});
		&save_node_state($processing_node_id, $processed_html_code, $processed_param);
		print ("success");
		&save_session();
		exit();
	}
	
	case ("registration_update") {
		&update_user_profile();
		$view = "userprofile";
	}
	
}
############################################
#### reading from DB

my $top_menu = &get_top_menu();
my %left_bar = &get_left_bar();

&print_header();
&print_top_menu($top_menu);
&print_left_bar(\%left_bar);	
	
switch ($view) {
	case ('home') {
		(my $home_data, my $trees) = &get_home_data ();
		&print_home($home_data, $trees);
	}
	
	case ("userprofile") {
		my $user_id = $_session->{"user_id"};
		my $userprofile = &get_userdata($user_id);
		&print_userdata($userprofile);
	}
		
	case ('add_record') {
		my $add_record = &add_record();
		&print_add_record($add_record);
	}
	
	case ('add_group') {
		my $add_group = &get_add_group();
		&print_add_group($add_group);
	}
		
	case ('add_seria') {
		&print_add_seria();
	}
	
	case ('records') {
		my $records = &get_records();
		&print_records($records);
	}
	
	case ('groups') {
		my $groups = &get_groups();
		&print_groups($groups);
	}
	
	case ('series') {
		my $series = &get_series();
		&print_series($series);
		
	}
	
	case ('edit_record') {
		my $record_id = int($_getpost{'record_id'});
		my $record = &get_record_by_id($record_id);
		my $groups = &get_groups();
		my $series = &get_series();
		&print_edit_record($record, $groups, $series);
	}
	
	case ('edit_group') {
		my $group_id = int($_getpost{'group_id'});
		my $group = &get_group_by_id($group_id);
		my $series = &get_series();
		&print_edit_group($group, $series);
	}
	
	case ('edit_seria') {
		my $series_id = int($_getpost{'series_id'});
		my $seria = &get_seria_by_id($series_id);
		&print_edit_seria($seria);
	}
	
	case ('processing') {
		my $record_id = int($_getpost{'record_id'});
		my $parent_processing_node_id = int($_getpost{'processing_node_id'});
		my $reg_path_id = int($_getpost{'registrated_path_id'});
		my $after_processing = int($_getpost{'after_processing'}); # Flag = 1 if user come from early processed node. It means that we will not save html code and client params
		
		my $processed_html_code = &clear("<div> Стартовый узел </div>");
		my $processed_param = &clear(qq({param: "Стартовый узел" }));
		if ($parent_processing_node_id == 0) {
			# Если родительский узел обработки не определен, то получаем корень дерева обработки по id записи
			# В данном случае дочерним узлом обработки будет корень
			$reg_path_id = 1; # устанавливаем путь обработки в начало, возможны другие значения, если точек входа будет много
		} else {
			$processed_html_code = &clear($_getpost{'processed_html_code'});
			$processed_param = &clear($_getpost{'processed_params'});
		}
		
		my $access = &verify_user_acceess_to_processing_node($parent_processing_node_id, $record_id);
		if ( $access eq "host" or $access eq "write" ) {
			my $processing_node_id = &create_new_processing_node($parent_processing_node_id, $reg_path_id, $record_id, $processed_html_code, $processed_param, $after_processing);
			# Тут нужно будет исправить, потому, что мы сначала пишем в базу, а потом читаем эту же информацию !!!!! 
			my $proccessing = &get_processing_data($processing_node_id);
			my $registrated_data = &get_registrated_data($reg_path_id);
			my $target_nodes = &get_target_nodes($reg_path_id);
     		&print_processing($proccessing, $registrated_data, $target_nodes, $parent_processing_node_id, $record_id, $reg_path_id);
		} else {
			print "Доступ запрещен";
		}

	
	}
	
	case ("get_processed") {
		my $processing_node_id = int($_getpost{"processing_node_id"});
		my $access = &verify_user_acceess_to_processing_node($processing_node_id);
		if ( $access eq "host" or $access eq "write" or $access eq "read") {
			my $processed_data = &get_processed_data($processing_node_id);
			&print_processed_data($processed_data, $access);
		} else {
			print "Доступ запрещен";
		}
	}
	
	else {
		&print_default();
	}
}	

&print_footer();
&save_session();







