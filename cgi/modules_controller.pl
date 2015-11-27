#!/usr/bin/perl -w

# this script is point of enter in application
use lib ("/home/ivan/perl5/lib/perl5/");
use strict;
use warnings;
use index_lib;
use model;
use view;
use Switch;

&set_config();
&use_cgi();
our %_getpost;
&start_session();
our $_session;

#print ("Content-Type: text/html charset=utf-8\n\n");
my $processing_node_id = int($_getpost{'processing_node_id'});
my $reg_path_id = int($_getpost{'registrated_path_id'});
my $parent_processing_node_id = int($_getpost{'parent_processing_node_id'});
my $record_id = int($_getpost{'record_id'});

my $access = &verify_user_acceess_to_processing_node($processing_node_id, $record_id);

if ( $access eq "host" or $access eq "write" ) {

	my $processing_parameters = &get_ajax_script_param($processing_node_id, $reg_path_id, $parent_processing_node_id, $record_id);

	#&print_arr($processing_parameters);

	# form query to module script
	my $script_query;
	my $user_query = $ENV{'QUERY_STRING'};

	$_ = $user_query;
	s/&/&amp;/;
	$user_query = $_;

	#print_arr( $processing_parameters);

	$script_query = CGI_MODULES_DIR.$processing_parameters->{'server_script_file'}."/?".$user_query."&source_file=".MAT_FILES_DIR.$processing_parameters->{'source_file_dir'}.$processing_parameters->{'sourse_file'};
	$script_query = $script_query."&target_file=".MAT_FILES_DIR.$processing_parameters->{'target_file_dir'}.$processing_parameters->{'target_file'};
	$script_query = $script_query.qq(&server_json_params=$processing_parameters->{'server_json_params'}&client_json_params=$processing_parameters->{'client_params'});

	&redirect($script_query); 
} else {
	print ("Content-Type: text/html charset=utf-8\n\n");
	print "Access denied";
	exit();
}
&save_session();
