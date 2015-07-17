#!/usr/bin/perl -w


	open(LOG, ">","/home/ivan/mysites/cerebrum.loc/log.txt");
	print LOG $query;
	close LOG;
