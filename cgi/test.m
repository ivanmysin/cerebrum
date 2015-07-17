#!/usr/bin/octave -qH
addpath('/home/abarth/Octave/cgi');
printf('Content-type: text/html\n\n');

disp ("<p> Hello </p>");
CGI = cgi();
name = getfirst(CGI,'name','world'); % 'world' is the default parameter
printf('Hello from Octave %s', name);
printf('<form method="get">');
printf('Your name<input type="text" name="name">');
printf('<input type="submit"></form>');
printf('</body></html>');
