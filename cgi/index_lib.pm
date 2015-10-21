
use strict;
use warnings;
use Data::Dumper;
use File::Basename;
use DBI;
use PDL;
use PDL::NiceSlice;
use PDL::Audio;
use PDL::IO::Matlab;
use Switch;
use IO::File;
use CGI qw(:all);
use CGI::Carp qw (fatalsToBrowser);

use Storable;
use CGI::Cookie;


our %_getpost;
our $_session;
our $dbh;


sub set_config {
	# set configuration constant and connect to db
	
	use constant PATH => "http://cerebrum.loc/"; # main page
	use constant GCI_SCRIPTS_DIR => PATH."cgi/" ;
	use constant ENTER_POINT => GCI_SCRIPTS_DIR."index.pl";
	use constant TITLE => "cerebrum";
	use constant UPLOAD_DIR => "/home/ivan/mysites/upload/";
	use constant SOURCE_DIR => "/home/ivan/mysites/sources_files/";
	use constant JS_DIR => PATH."js/";
	use constant JS_FOR_MODULS_DIR => JS_DIR."ajax/";
	use constant MAT_FILES_DIR => "/home/ivan/mysites/mat_files/";
	use constant CGI_MODULES_DIR => GCI_SCRIPTS_DIR."processing_scripts/";
	use constant CSS_FILES_DIR => PATH."css/";
	use constant CSS_FILES_MODULES_DIR => CSS_FILES_DIR."modules/";
	use constant SESSION_FILES_DIR => "sessions/";
	use constant MUDULES_CONTROLLER => GCI_SCRIPTS_DIR."modules_controller.pl";
	use constant MAT_FILES_ORIGIN => "origin/";
	use constant HTML_TEMPLATES_DIR => "../www/html_template/";
	
	my $db = "cerebrum";               # data base
	my $db_user = "root";              # user of db
	my $password = "vinogradova";      # password for db
	my $host = "localhost";            # host of db
	
	our $dbh = DBI->connect("DBI:mysql:$db:$host", $db_user, $password);
	my $sth = $dbh->prepare("SET NAMES 'utf8';");
	$sth->execute();
	$sth->finish();
}

########################################################################
sub print_arr {
	print "<pre>\n";
	my $ref = shift;
	print Dumper($ref);
	print "</pre>\n";
}
########################################################################

sub use_cgi {


	my $query = new CGI;

	my $self_url = $query->self_url;
	my $query_string = $query->query_string;

	my %_server_query = $query->Vars;
	our %_getpost = %_server_query; # TODO: check for overhead!!!!!!!!!
	# USE: @foo = split("\0",$param{'foo'});
	foreach my $key (keys %_getpost){
		$_getpost{$key}=[split("\0",$_getpost{$key})] if $_getpost{$key}=~/\0/;
	}
	# $query->import_names('p');
	# $script=$ENV{'SCRIPT_NAME'};
}

########################################################################
sub redirect {
	my $url;
	if (scalar @_ == 0) {
		$url = PATH;
	} else {
		$url = shift; 
	}
	print "Location: $url\n\n";
}
########################################################################
sub upload_file {

	my $source = shift;
	my $target = shift;
	my $dir_for_mat = MAT_FILES_ORIGIN;

	my $queryCGI = new CGI;

	# Загружаем файл на сервер 
	my $filename = $queryCGI->param($source);
	my $safe_filename_characters = "a-zA-Z0-9_.-";
	my ($name, $path, $extension) = fileparse ( $filename, '\..*' );

	$extension =~ s/^\.//;

	if (!$filename) {
		print $queryCGI->header();
		print "Проблемы призагрузке вашего файла";
		exit;
	}
	$filename = $name . "." . $extension;
	$filename =~ tr/ /_/;
	$filename =~ s/[^$safe_filename_characters]//g;
	if ( $filename =~ /^([$safe_filename_characters]+)$/ ) {
		$filename = $1;
		} else {
		die "Filename contains invalid characters";
	}
	
	
	my $file_name = UPLOAD_DIR.$target.".".$extension;
	

	my $upload_filehandle = $queryCGI->upload($source);	

	# Сохраняем файл в директорию, указанную в константе
	if (defined ($upload_filehandle)) {
		open (UPLOADFILE, ">", $file_name);  # or die "$!";
		binmode UPLOADFILE;
		while ( <$upload_filehandle> ) {
			print UPLOADFILE;
		}
		close UPLOADFILE;
	} else {
		print "File is not uploaded";
		exit;
		
	}
	# Сохранили файл, теперь открываем его и пересохраняем содержимое в исходную точку, т.е. в директорию MAT_FILES_ORIGIN
	
	my $fd;
	my $nchs;
	my $uploaded_file;
	
	switch ($extension) {
		case ('wav') {	
			my $wav = raudio($file_name);
			
			$fd = $wav->rate();  # $fd is discritisation frequency of wav data

			$nchs = $wav->ndims();  # $nchs is number chanels in wav file
			$wav = double($wav->transpose()); 
			
			
			$uploaded_file = MAT_FILES_DIR.MAT_FILES_ORIGIN.$target."_".$name.'.mat'; 

			matlab_write($uploaded_file, $wav); # !!!!!!!!!!!!!!!!!! # Тут нужно разобраться можно ли сохранять больше информации mat файл с помощью перла 
			
			
			}
		
		else {
			
			print "Incorrect extention!";
			exit;
		}
	};
	
	my %returned = ();
	($name, $path, $extension) = fileparse ($uploaded_file, '\..*' );
	$returned{'origin_file'} = $name.$extension;
	
	($name, $path, $extension) = fileparse ($file_name, '\..*' );
	$returned{'sourse_file'} = $name.$extension;;
	
	
	$returned{'fd'} = $fd;
	$returned{'nchs'} = $nchs;
	
	
	return (\%returned);
}
########################################################################
sub  trim { my $s = shift; $s =~ s/^\s+|\s+$//g; return $s };

sub _quote	{
	my $val = shift;
	my $qval = $dbh->quote($val);
	return "''" if $qval eq '';
	return $qval;
}

sub clear { my $s=shift; return &_quote(&trim($s))}

########################################################################
sub start_session {
	my $ip = &clear($ENV{'REMOTE_ADDR'});
	my $user_agent = &clear($ENV{'HTTP_USER_AGENT'});
	my %cookies = CGI::Cookie->fetch;
	
	if ( defined($cookies{'session_id'}) and ($cookies{'session_id'}->value > 0) ) {
		
		my $session_id = $cookies{'session_id'}->value;
		$_session = &get_session_data($session_id, $ip, $user_agent);
		$_session->{'session_id'} = $session_id;

	} else {

		my $session_id = &create_new_session($ip, $user_agent);
		$_session = {'session_id' => $session_id};
		my $cookies = CGI::Cookie->new(
						-name    =>  'session_id',
                        -value   =>  $session_id,
                        -expires =>  '+3M');
		print "Set-Cookie: $cookies\n";
	}
}

#sub save_session {
	#my $file = $_session -> {"session_id"};
	#store($_session, SESSION_FILES_DIR.$file) or die "Can't store session\n";
#}

########################################################################
sub read_file {
	my $file = shift;
	my $die;
	$die ="die" if (not defined $die);
	if ($die eq "die"){
		open(FILEREADFILE,"< $file") || die "Cann't open file $file:$!\n";
		}else{
		open(FILEREADFILE,"< $file") || return "";
		}
	my $old=$/;
	undef $/;           # enable "slurp" mode
	my $file_content = <FILEREADFILE>;
	close(FILEREADFILE);
	$/=$old;
	$file_content='' if not $file_content;
	return $file_content;
}
########################################################################
sub print_log {
	my $logged = shift;
	open (FILE, ">log.txt");
	print FILE $logged;
	close (FILE);
}

########################################################################

########################################################################
1;
