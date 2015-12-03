#!/usr/bin/perl -w
use PDL;
use PDL::NiceSlice;
use Data::Dumper;
use DBIx::Tree;
my $db = "cerebrum";               # data base
my $db_user = "cerebrum";          # user of db
my $password = "vinogradova";      # password for db
my $host = "localhost";            # host of db
	
our $dbh = DBI->connect("DBI:mysql:$db:$host", $db_user, $password);
my $sth = $dbh->prepare("SET NAMES 'utf8';");
$sth->execute();
$sth->finish();
# have DBIx::Tree build the necessary SQL from table & column names:
my $tree = new DBIx::Tree (
	  connection => $dbh,
      table      => "processing_nodes",
      method     => sub { disp_tree(@_) },
      columns    => ["id", "id", "id_parent_nodes"],
      start_id   => 1495);
$tree->traverse;

# print Dumper $tree;


sub disp_tree {
	for(my $i=0; $i<@_; $i++) {
		if ($_[$i] eq "id") {
			print $_[$i+1], "\n";
		}
	}
}