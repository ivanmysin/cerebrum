

use Data::Dumper;
use File::Basename;

sub set_config {
	# set configuration constant and connect to db
	use DBI;
	
	use constant PATH => "http://cerebrum.loc/"; # main page
	use constant GCI_SCRIPTS_DIR => PATH."cgi/" ;
	use constant TITLE => "cerebrum";
	use constant UPLOAD_DIR => "upload/";
	my $db = "cerebrum";               # data base
	my $db_user = "root";              # user of db
	my $password = "vinogradova";   # password for db
	my $host = "localhost";         # host of db
	
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
	use CGI qw(:all);
	use CGI::Carp qw (fatalsToBrowser);
	my $query = new CGI;
	$self_url=$query->self_url;
	$query_string = $query->query_string;

	our %_server_query = $query->Vars;
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
	my $query = new CGI;
	
	my $filename = $query->param($source);
	my $safe_filename_characters = "a-zA-Z0-9_.-";
	my $upload_dir = UPLOAD_DIR;
	my ($name, $path, $extension) = fileparse ( $filename, '\..*' );

	$extension =~ s/^\.//;

	if (!$filename) {
		print $query->header ();
		print "Проблемы призагрузке вашего файла";
		exit;
	}
	$filename = $name . $extension;
	$filename =~ tr/ /_/;
	$filename =~ s/[^$safe_filename_characters]//g;
	if ( $filename =~ /^([$safe_filename_characters]+)$/ ) {
		$filename = $1;
		} else {
		die "Filename contains invalid characters";
	}
	my $upload_filehandle = $query->upload($source);
	open ( UPLOADFILE, ">", $upload_dir.$target.".".$extension) or die "$!";
	binmode UPLOADFILE;

	while ( <$upload_filehandle> ) {
		print UPLOADFILE;
	}
	close UPLOADFILE;
	return $target.".".$extension;
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
########################################################################
1;
