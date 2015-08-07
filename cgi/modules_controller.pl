#!/usr/bin/perl -w

# this script is point of enter in application

use strict;
use warnings;
use index_lib;
use model;
use view;
use Switch;

&set_config();
&use_cgi();
our %_getpost;
#&start_session();
our $_session;

#print ("Content-Type: text/html charset=utf-8\n\n");
my $processing_node_id = int($_getpost{'processing_node_id'});
my $target_node_id = int($_getpost{'registrated_node_id'});
my $parent_processing_node_id = int($_getpost{'parent_processing_node_id'});
my $record_id = int($_getpost{'record_id'});


my $processing_parameters = &get_ajax_script_param($processing_node_id, $target_node_id, $parent_processing_node_id, $record_id);

#&print_arr($processing_parameters);

# form query to module script
my $script_query;

my $user_query = $ENV{'QUERY_STRING'};

$_ = $user_query;
s/&/&amp;/;
$user_query = $_;

#print_arr( $processing_parameters);

$script_query = CGI_MODULES_DIR.$processing_parameters->{'server_ajax_file'}."/?".$user_query."&source_file=".MAT_FILES_DIR.$processing_parameters->{'source_file_dir'}.$processing_parameters->{'sourse_file'};
$script_query = $script_query."&target_file=".MAT_FILES_DIR.$processing_parameters->{'target_file_dir'}.$processing_parameters->{'target_file'};
$script_query = $script_query.qq(&server_json_params=$processing_parameters->{'server_json_params'});

&redirect($script_query); 

